"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { MemberType } from "@/lib/generated/prisma";
import { z } from "zod";

// ============================================================================
// SCHEMAS
// ============================================================================

const createContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  memberType: z.nativeEnum(MemberType).default("VISITOR"),
  tags: z.array(z.string()).default([]),
});

const updateContactSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  memberType: z.nativeEnum(MemberType).optional(),
  tags: z.array(z.string()).optional(),
});

const addNoteSchema = z.object({
  content: z.string().min(1, "Note content is required").max(2000),
});

const updateTagsSchema = z.object({
  tags: z.array(z.string()),
});

// ============================================================================
// TYPES
// ============================================================================

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Create a new contact (ChurchMember)
 */
export async function createContact(
  slug: string,
  data: CreateContactInput
): Promise<ApiResponse<{ id: string }>> {
  const { organization } = await requireDashboardAccess(slug);

  const validation = createContactSchema.safeParse(data);
  if (!validation.success) {
    return {
      status: "error",
      message: validation.error.errors[0]?.message ?? "Invalid data",
    };
  }

  const validData = validation.data;

  // Check for duplicate email
  if (validData.email) {
    const existing = await prisma.churchMember.findUnique({
      where: {
        organizationId_email: {
          organizationId: organization.id,
          email: validData.email,
        },
      },
    });

    if (existing) {
      return {
        status: "error",
        message: "A contact with this email already exists",
      };
    }
  }

  try {
    const contact = await prisma.churchMember.create({
      data: {
        organizationId: organization.id,
        name: validData.name,
        email: validData.email,
        phone: validData.phone,
        address: validData.address,
        memberType: validData.memberType,
        tags: validData.tags,
      },
    });

    return {
      status: "success",
      message: "Contact created successfully",
      data: { id: contact.id },
    };
  } catch {
    return {
      status: "error",
      message: "Failed to create contact",
    };
  }
}

/**
 * Update an existing contact
 */
export async function updateContact(
  slug: string,
  contactId: string,
  data: UpdateContactInput
): Promise<ApiResponse<{ id: string }>> {
  const { organization } = await requireDashboardAccess(slug);

  const validation = updateContactSchema.safeParse(data);
  if (!validation.success) {
    return {
      status: "error",
      message: validation.error.errors[0]?.message ?? "Invalid data",
    };
  }

  const validData = validation.data;

  // Verify contact exists and belongs to organization
  const existing = await prisma.churchMember.findFirst({
    where: {
      id: contactId,
      organizationId: organization.id,
    },
  });

  if (!existing) {
    return {
      status: "error",
      message: "Contact not found",
    };
  }

  // Check for duplicate email if changing
  if (validData.email && validData.email !== existing.email) {
    const emailExists = await prisma.churchMember.findFirst({
      where: {
        organizationId: organization.id,
        email: validData.email,
        id: { not: contactId },
      },
    });

    if (emailExists) {
      return {
        status: "error",
        message: "A contact with this email already exists",
      };
    }
  }

  try {
    await prisma.churchMember.update({
      where: { id: contactId },
      data: validData,
    });

    return {
      status: "success",
      message: "Contact updated successfully",
      data: { id: contactId },
    };
  } catch {
    return {
      status: "error",
      message: "Failed to update contact",
    };
  }
}

/**
 * Delete a contact
 */
export async function deleteContact(
  slug: string,
  contactId: string
): Promise<ApiResponse> {
  const { organization } = await requireDashboardAccess(slug);

  // Verify contact exists and belongs to organization
  const existing = await prisma.churchMember.findFirst({
    where: {
      id: contactId,
      organizationId: organization.id,
    },
  });

  if (!existing) {
    return {
      status: "error",
      message: "Contact not found",
    };
  }

  try {
    await prisma.churchMember.delete({
      where: { id: contactId },
    });

    return {
      status: "success",
      message: "Contact deleted successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to delete contact",
    };
  }
}

/**
 * Add a note to a contact
 */
export async function addContactNote(
  slug: string,
  contactId: string,
  data: { content: string }
): Promise<ApiResponse<{ id: string }>> {
  const { session, organization } = await requireDashboardAccess(slug);

  const validation = addNoteSchema.safeParse(data);
  if (!validation.success) {
    return {
      status: "error",
      message: validation.error.errors[0]?.message ?? "Invalid data",
    };
  }

  // Verify contact exists and belongs to organization
  const contact = await prisma.churchMember.findFirst({
    where: {
      id: contactId,
      organizationId: organization.id,
    },
  });

  if (!contact) {
    return {
      status: "error",
      message: "Contact not found",
    };
  }

  try {
    const note = await prisma.memberNote.create({
      data: {
        churchMemberId: contactId,
        organizationId: organization.id,
        content: validation.data.content,
        createdBy: session.user.id,
      },
    });

    return {
      status: "success",
      message: "Note added successfully",
      data: { id: note.id },
    };
  } catch {
    return {
      status: "error",
      message: "Failed to add note",
    };
  }
}

/**
 * Update contact tags
 */
export async function updateContactTags(
  slug: string,
  contactId: string,
  data: { tags: string[] }
): Promise<ApiResponse> {
  const { organization } = await requireDashboardAccess(slug);

  const validation = updateTagsSchema.safeParse(data);
  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid tags",
    };
  }

  // Verify contact exists and belongs to organization
  const contact = await prisma.churchMember.findFirst({
    where: {
      id: contactId,
      organizationId: organization.id,
    },
  });

  if (!contact) {
    return {
      status: "error",
      message: "Contact not found",
    };
  }

  try {
    await prisma.churchMember.update({
      where: { id: contactId },
      data: { tags: validation.data.tags },
    });

    return {
      status: "success",
      message: "Tags updated successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to update tags",
    };
  }
}

/**
 * Bulk update member type for multiple contacts
 */
export async function bulkUpdateMemberType(
  slug: string,
  contactIds: string[],
  memberType: MemberType
): Promise<ApiResponse<{ count: number }>> {
  const { organization } = await requireDashboardAccess(slug);

  if (!contactIds.length) {
    return {
      status: "error",
      message: "No contacts selected",
    };
  }

  try {
    const result = await prisma.churchMember.updateMany({
      where: {
        id: { in: contactIds },
        organizationId: organization.id,
      },
      data: { memberType },
    });

    return {
      status: "success",
      message: `Updated ${result.count} contact(s)`,
      data: { count: result.count },
    };
  } catch {
    return {
      status: "error",
      message: "Failed to update contacts",
    };
  }
}

/**
 * Bulk add tag to multiple contacts
 */
export async function bulkAddTag(
  slug: string,
  contactIds: string[],
  tag: string
): Promise<ApiResponse<{ count: number }>> {
  const { organization } = await requireDashboardAccess(slug);

  if (!contactIds.length) {
    return {
      status: "error",
      message: "No contacts selected",
    };
  }

  if (!tag.trim()) {
    return {
      status: "error",
      message: "Tag is required",
    };
  }

  try {
    // Get contacts and add tag if not already present
    const contacts = await prisma.churchMember.findMany({
      where: {
        id: { in: contactIds },
        organizationId: organization.id,
      },
      select: { id: true, tags: true },
    });

    let updateCount = 0;
    for (const contact of contacts) {
      if (!contact.tags.includes(tag)) {
        await prisma.churchMember.update({
          where: { id: contact.id },
          data: { tags: [...contact.tags, tag] },
        });
        updateCount++;
      }
    }

    return {
      status: "success",
      message: `Added tag to ${updateCount} contact(s)`,
      data: { count: updateCount },
    };
  } catch {
    return {
      status: "error",
      message: "Failed to add tag",
    };
  }
}

/**
 * Bulk delete contacts
 */
export async function bulkDeleteContacts(
  slug: string,
  contactIds: string[]
): Promise<ApiResponse<{ count: number }>> {
  const { organization } = await requireDashboardAccess(slug);

  if (!contactIds.length) {
    return {
      status: "error",
      message: "No contacts selected",
    };
  }

  try {
    const result = await prisma.churchMember.deleteMany({
      where: {
        id: { in: contactIds },
        organizationId: organization.id,
      },
    });

    return {
      status: "success",
      message: `Deleted ${result.count} contact(s)`,
      data: { count: result.count },
    };
  } catch {
    return {
      status: "error",
      message: "Failed to delete contacts",
    };
  }
}
