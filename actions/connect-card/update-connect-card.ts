"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow, arcjetMode } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import {
  connectCardUpdateSchema,
  ConnectCardUpdateSchemaType,
} from "@/lib/zodSchemas";
import { request } from "@arcjet/next";
import { formatPhoneNumber } from "@/lib/utils";
import { createPrayerRequestFromConnectCard } from "@/lib/data/prayer-requests";
import { updateBatchStatus } from "@/lib/data/connect-card-batch";
import { VolunteerCategoryType, DocumentScope } from "@/lib/generated/prisma";
import { resend, DEFAULT_FROM_EMAIL } from "@/lib/email/client";
import {
  getVolunteerLeaderNotificationEmail,
  getVolunteerLeaderNotificationText,
} from "@/lib/email/templates/volunteer-leader-notification";
import {
  getVolunteerDocumentsEmail,
  getVolunteerDocumentsText,
} from "@/lib/email/templates/volunteer-documents";
import { env } from "@/lib/env";

const aj = arcjet.withRule(
  fixedWindow({
    mode: arcjetMode,
    window: "1m",
    max: 10, // Allow 10 updates per minute (staff reviewing cards)
  })
);

/**
 * Helper: Check if a name matches (case-insensitive, trimmed)
 */
function namesMatch(name1: string | null, name2: string | null): boolean {
  if (!name1 || !name2) return false;
  return name1.trim().toLowerCase() === name2.trim().toLowerCase();
}

/**
 * Helper: Map connect card volunteerCategory string to VolunteerCategoryType enum
 */
function mapToVolunteerCategoryType(
  category: string | null | undefined
): VolunteerCategoryType | null {
  if (!category) return null;

  const categoryMap: Record<string, VolunteerCategoryType> = {
    GENERAL: "GENERAL",
    GREETER: "GREETER",
    USHER: "USHER",
    KIDS_MINISTRY: "KIDS_MINISTRY",
    WORSHIP_TEAM: "WORSHIP_TEAM",
    PARKING: "PARKING",
    HOSPITALITY: "HOSPITALITY",
    AV_TECH: "AV_TECH",
    PRAYER_TEAM: "PRAYER_TEAM",
    OTHER: "OTHER",
  };

  return categoryMap[category.toUpperCase()] || "GENERAL";
}

/**
 * Update Connect Card
 *
 * Updates a connect card with corrected data from staff review.
 * Creates/updates ChurchMember and Volunteer records as needed.
 * Changes card status from "EXTRACTED" to "PROCESSED" after processing.
 *
 * Workflow (per approved spec):
 * 1. Update card with staff corrections
 * 2. Find or create ChurchMember (email-based matching)
 * 3. Create Volunteer record if interest indicated (PENDING_APPROVAL)
 * 4. Create PrayerRequest if present
 * 5. Link card to member, mark as PROCESSED
 *
 * Security:
 * - Requires dashboard access (church admin or staff)
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet (10 updates per minute)
 *
 * @param slug - Organization slug for multi-tenant context
 * @param data - Corrected connect card data
 * @returns ApiResponse with success/error status
 */
export async function updateConnectCard(
  slug: string,
  data: ConnectCardUpdateSchemaType
): Promise<ApiResponse<{ id: string }>> {
  // 1. Authentication and authorization
  const { session, organization } = await requireDashboardAccess(slug);

  // 2. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_update_connect_card`,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "You have been blocked due to rate limiting",
      };
    } else {
      return {
        status: "error",
        message: "You are a bot! if this is a mistake contact our support",
      };
    }
  }

  // 3. Validation
  const validation = connectCardUpdateSchema.safeParse(data);

  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid form data",
    };
  }

  try {
    // 4. Verify card belongs to this organization (security check)
    const existingCard = await prisma.connectCard.findFirst({
      where: {
        id: validation.data.id,
        organizationId: organization.id,
      },
    });

    if (!existingCard) {
      return {
        status: "error",
        message: "Connect card not found",
      };
    }

    const cardEmail = validation.data.email?.trim().toLowerCase();
    const cardName = validation.data.name?.trim();
    const cardPhone = formatPhoneNumber(validation.data.phone);
    let memberCreated = false;
    let memberUpdated = false;
    let volunteerCreated = false;
    let nameMismatchWarning = false;
    let churchMemberId: string | null = null;

    // 5. Find or create ChurchMember (email-based matching per approved spec)
    if (cardEmail) {
      // Look for existing member by email (primary identifier)
      const existingMember = await prisma.churchMember.findFirst({
        where: {
          organizationId: organization.id,
          email: { equals: cardEmail, mode: "insensitive" },
        },
        include: {
          volunteer: true,
        },
      });

      if (existingMember) {
        // Email match found - check name match
        if (namesMatch(existingMember.name, cardName)) {
          // Exact match: Auto-update member with new contact info
          await prisma.churchMember.update({
            where: { id: existingMember.id },
            data: {
              phone: cardPhone || existingMember.phone,
              updatedAt: new Date(),
            },
          });
          churchMemberId = existingMember.id;
          memberUpdated = true;
        } else {
          // Email match but name different - flag for review but still link
          // Per spec: Flag for manual review when name differs
          nameMismatchWarning = true;
          churchMemberId = existingMember.id;
        }

        // Handle volunteer category for existing member
        if (validation.data.volunteerCategory && existingMember.volunteer) {
          // Member already has volunteer record - append category if new
          const categoryType = mapToVolunteerCategoryType(
            validation.data.volunteerCategory
          );
          if (categoryType) {
            const existingCategory = await prisma.volunteerCategory.findFirst({
              where: {
                volunteerId: existingMember.volunteer.id,
                category: categoryType,
              },
            });

            if (!existingCategory) {
              await prisma.volunteerCategory.create({
                data: {
                  volunteerId: existingMember.volunteer.id,
                  organizationId: organization.id,
                  category: categoryType,
                },
              });
            }
          }
        } else if (
          validation.data.volunteerCategory &&
          !existingMember.volunteer
        ) {
          // Member exists but no volunteer record - create one
          const categoryType = mapToVolunteerCategoryType(
            validation.data.volunteerCategory
          );
          const newVolunteer = await prisma.volunteer.create({
            data: {
              churchMemberId: existingMember.id,
              organizationId: organization.id,
              locationId: existingCard.locationId,
              status: "PENDING_APPROVAL",
            },
          });

          if (categoryType) {
            await prisma.volunteerCategory.create({
              data: {
                volunteerId: newVolunteer.id,
                organizationId: organization.id,
                category: categoryType,
              },
            });
          }
          volunteerCreated = true;
        }
      } else {
        // No email match - create new ChurchMember
        const newMember = await prisma.churchMember.create({
          data: {
            organizationId: organization.id,
            name: cardName || "Unknown",
            email: cardEmail,
            phone: cardPhone,
            memberType: "MEMBER", // Per spec: Everyone created as MEMBER
            visitDate: new Date(),
          },
        });
        churchMemberId = newMember.id;
        memberCreated = true;

        // Create Volunteer record if category selected (PENDING_APPROVAL per spec)
        if (validation.data.volunteerCategory) {
          const categoryType = mapToVolunteerCategoryType(
            validation.data.volunteerCategory
          );
          const newVolunteer = await prisma.volunteer.create({
            data: {
              churchMemberId: newMember.id,
              organizationId: organization.id,
              locationId: existingCard.locationId,
              status: "PENDING_APPROVAL",
            },
          });

          if (categoryType) {
            await prisma.volunteerCategory.create({
              data: {
                volunteerId: newVolunteer.id,
                organizationId: organization.id,
                category: categoryType,
              },
            });
          }
          volunteerCreated = true;
        }
      }
    } else if (cardName) {
      // No email but has name - create member without email (can be matched later)
      const newMember = await prisma.churchMember.create({
        data: {
          organizationId: organization.id,
          name: cardName,
          phone: cardPhone,
          memberType: "MEMBER",
          visitDate: new Date(),
        },
      });
      churchMemberId = newMember.id;
      memberCreated = true;

      // Create Volunteer if category selected
      if (validation.data.volunteerCategory) {
        const categoryType = mapToVolunteerCategoryType(
          validation.data.volunteerCategory
        );
        const newVolunteer = await prisma.volunteer.create({
          data: {
            churchMemberId: newMember.id,
            organizationId: organization.id,
            locationId: existingCard.locationId,
            status: "PENDING_APPROVAL",
          },
        });

        if (categoryType) {
          await prisma.volunteerCategory.create({
            data: {
              volunteerId: newVolunteer.id,
              organizationId: organization.id,
              category: categoryType,
            },
          });
        }
        volunteerCreated = true;
      }
    }

    // 6. Update card with corrected data, link to member, and mark as PROCESSED
    const updatedCard = await prisma.connectCard.update({
      where: {
        id: validation.data.id,
      },
      data: {
        name: validation.data.name,
        email: validation.data.email,
        phone: cardPhone,
        visitType: validation.data.visitType,
        interests: validation.data.interests,
        volunteerCategory: validation.data.volunteerCategory,
        prayerRequest: validation.data.prayerRequest,
        assignedLeaderId: validation.data.assignedLeaderId,
        smsAutomationEnabled: validation.data.smsAutomationEnabled,
        sendMessageToLeader: validation.data.sendMessageToLeader,
        sendBackgroundCheckInfo: validation.data.sendBackgroundCheckInfo,
        churchMemberId: churchMemberId, // Link to member
        status: "PROCESSED", // Mark as PROCESSED (per approved spec)
        updatedAt: new Date(),
      },
      select: {
        id: true,
        smsAutomationEnabled: true,
        sendMessageToLeader: true,
        sendBackgroundCheckInfo: true,
      },
    });

    // 7. Create PrayerRequest record if prayer request exists
    const prayerRequestText = validation.data.prayerRequest?.trim();

    if (prayerRequestText && prayerRequestText.length > 0) {
      const existingPrayerRequest = await prisma.prayerRequest.findFirst({
        where: {
          connectCardId: validation.data.id,
        },
        select: {
          id: true,
        },
      });

      if (!existingPrayerRequest) {
        try {
          await createPrayerRequestFromConnectCard(
            validation.data.id,
            organization.id,
            existingCard.locationId,
            prayerRequestText
          );
        } catch (error) {
          // Prayer request creation failed but card update continues
        }
      }
    }

    // 8. Auto-complete batch if all cards are now PROCESSED
    if (existingCard.batchId) {
      try {
        const batch = await prisma.connectCardBatch.findUnique({
          where: { id: existingCard.batchId },
          include: {
            cards: { select: { status: true } },
          },
        });

        if (batch) {
          const allProcessed = batch.cards.every(
            card => card.status === "PROCESSED"
          );

          if (allProcessed && batch.status !== "COMPLETED") {
            await updateBatchStatus(batch.id, "COMPLETED");
          }
        }
      } catch (error) {
        // Batch auto-complete failed but card update continues
      }
    }

    // 9. Send leader notification email if leader was assigned
    let leaderNotified = false;
    if (
      validation.data.assignedLeaderId &&
      validation.data.volunteerCategory &&
      validation.data.sendMessageToLeader
    ) {
      try {
        // Get the assigned leader's info
        const leader = await prisma.user.findUnique({
          where: { id: validation.data.assignedLeaderId },
          select: { name: true, email: true },
        });

        if (leader?.email) {
          const dashboardUrl = `${env.NEXT_PUBLIC_APP_URL}/church/${slug}/admin/volunteer`;

          const emailHtml = getVolunteerLeaderNotificationEmail({
            churchName: organization.name,
            leaderName: leader.name || "Ministry Leader",
            volunteerName: cardName || "New Volunteer",
            volunteerEmail: cardEmail || null,
            volunteerPhone: cardPhone || null,
            volunteerCategory: validation.data.volunteerCategory,
            dashboardUrl,
          });

          const emailText = getVolunteerLeaderNotificationText({
            churchName: organization.name,
            leaderName: leader.name || "Ministry Leader",
            volunteerName: cardName || "New Volunteer",
            volunteerEmail: cardEmail || null,
            volunteerPhone: cardPhone || null,
            volunteerCategory: validation.data.volunteerCategory,
            dashboardUrl,
          });

          await resend.emails.send({
            from: DEFAULT_FROM_EMAIL,
            to: leader.email,
            subject: `New Volunteer Assigned: ${cardName || "New Volunteer"} - ${organization.name}`,
            html: emailHtml,
            text: emailText,
          });

          leaderNotified = true;
        }
      } catch {
        // Leader notification failed but card processing continues
      }
    }

    // 10. Send documents to volunteer if sendBackgroundCheckInfo is enabled
    let documentsSent = false;
    if (
      validation.data.volunteerCategory &&
      validation.data.sendBackgroundCheckInfo &&
      cardEmail
    ) {
      try {
        const categoryType = mapToVolunteerCategoryType(
          validation.data.volunteerCategory
        );

        // Get ministry requirements for this category
        const ministryRequirements = categoryType
          ? await prisma.ministryRequirements.findUnique({
              where: {
                organizationId_category: {
                  organizationId: organization.id,
                  category: categoryType,
                },
              },
            })
          : null;

        // Get documents for this category (GLOBAL + MINISTRY_SPECIFIC)
        const documents = await prisma.volunteerDocument.findMany({
          where: {
            organizationId: organization.id,
            OR: [
              { scope: DocumentScope.GLOBAL },
              categoryType
                ? {
                    scope: DocumentScope.MINISTRY_SPECIFIC,
                    category: categoryType,
                  }
                : { scope: DocumentScope.MINISTRY_SPECIFIC, category: null },
            ],
          },
          select: {
            name: true,
            description: true,
            fileUrl: true,
          },
        });

        // Get background check config if required
        let bgCheckConfig = null;
        if (ministryRequirements?.backgroundCheckRequired) {
          bgCheckConfig = await prisma.backgroundCheckConfig.findUnique({
            where: { organizationId: organization.id },
          });
        }

        // Only send email if there's something to send
        const hasContent =
          documents.length > 0 ||
          (ministryRequirements?.backgroundCheckRequired &&
            bgCheckConfig?.applicationUrl) ||
          (ministryRequirements?.trainingRequired &&
            ministryRequirements?.trainingUrl);

        if (hasContent) {
          const emailHtml = getVolunteerDocumentsEmail({
            churchName: organization.name,
            volunteerName: cardName || "Volunteer",
            volunteerCategory: validation.data.volunteerCategory,
            documents: documents.map(d => ({
              name: d.name,
              description: d.description,
              fileUrl: d.fileUrl,
            })),
            backgroundCheckRequired:
              ministryRequirements?.backgroundCheckRequired ?? false,
            backgroundCheckUrl: bgCheckConfig?.applicationUrl ?? null,
            backgroundCheckInstructions: bgCheckConfig?.instructions ?? null,
            trainingRequired: ministryRequirements?.trainingRequired ?? false,
            trainingUrl: ministryRequirements?.trainingUrl ?? null,
            trainingDescription:
              ministryRequirements?.trainingDescription ?? null,
          });

          const emailText = getVolunteerDocumentsText({
            churchName: organization.name,
            volunteerName: cardName || "Volunteer",
            volunteerCategory: validation.data.volunteerCategory,
            documents: documents.map(d => ({
              name: d.name,
              description: d.description,
              fileUrl: d.fileUrl,
            })),
            backgroundCheckRequired:
              ministryRequirements?.backgroundCheckRequired ?? false,
            backgroundCheckUrl: bgCheckConfig?.applicationUrl ?? null,
            backgroundCheckInstructions: bgCheckConfig?.instructions ?? null,
            trainingRequired: ministryRequirements?.trainingRequired ?? false,
            trainingUrl: ministryRequirements?.trainingUrl ?? null,
            trainingDescription:
              ministryRequirements?.trainingDescription ?? null,
          });

          await resend.emails.send({
            from: DEFAULT_FROM_EMAIL,
            to: cardEmail,
            subject: `Welcome to ${validation.data.volunteerCategory.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())} - ${organization.name}`,
            html: emailHtml,
            text: emailText,
          });

          documentsSent = true;

          // Check if volunteer can be marked as ready for export
          // Ready = docs sent + (BG check not required OR BG check cleared)
          if (churchMemberId) {
            const bgCheckNotRequired =
              !ministryRequirements?.backgroundCheckRequired;

            // Find the volunteer and check their BG check status
            const volunteer = await prisma.volunteer.findFirst({
              where: {
                churchMemberId,
                organizationId: organization.id,
              },
              select: { id: true, backgroundCheckStatus: true },
            });

            if (volunteer) {
              const bgCheckCleared =
                volunteer.backgroundCheckStatus === "CLEARED";

              if (bgCheckNotRequired || bgCheckCleared) {
                await prisma.volunteer.update({
                  where: { id: volunteer.id },
                  data: {
                    readyForExport: true,
                    readyForExportDate: new Date(),
                  },
                });
              }
            }
          }
        }
      } catch {
        // Document send failed but card processing continues
      }
    }

    // 11. Build response message
    const messages: string[] = ["Connect card processed successfully"];

    if (memberCreated) {
      messages.push("New member created");
    } else if (memberUpdated) {
      messages.push("Existing member updated");
    }

    if (volunteerCreated) {
      messages.push("Volunteer added to pending queue");
    }

    if (nameMismatchWarning) {
      messages.push("Warning: Name on card differs from existing member");
    }

    if (leaderNotified) {
      messages.push("Leader notification sent");
    }

    if (documentsSent) {
      messages.push("Onboarding documents sent to volunteer");
    }

    if (updatedCard.smsAutomationEnabled) {
      messages.push("SMS automation enabled");
    }

    return {
      status: "success",
      message: messages.join(". "),
      data: { id: updatedCard.id },
    };
  } catch {
    return {
      status: "error",
      message: "Failed to process connect card",
    };
  }
}
