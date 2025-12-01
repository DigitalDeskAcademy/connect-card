/**
 * Volunteer Documents Email Template
 *
 * Sends required onboarding documents to new volunteers based on their ministry.
 * Includes background check info if required for the ministry.
 */

interface DocumentInfo {
  name: string;
  description: string | null;
  fileUrl: string;
}

interface VolunteerDocumentsEmailParams {
  churchName: string;
  volunteerName: string;
  volunteerCategory: string;
  documents: DocumentInfo[];
  backgroundCheckRequired: boolean;
  backgroundCheckUrl: string | null;
  backgroundCheckInstructions: string | null;
  trainingRequired: boolean;
  trainingUrl: string | null;
  trainingDescription: string | null;
}

/**
 * Format category for display (e.g., KIDS_MINISTRY -> Kids Ministry)
 */
function formatCategory(category: string): string {
  return category
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function getVolunteerDocumentsEmail(
  params: VolunteerDocumentsEmailParams
): string {
  const {
    churchName,
    volunteerName,
    volunteerCategory,
    documents,
    backgroundCheckRequired,
    backgroundCheckUrl,
    backgroundCheckInstructions,
    trainingRequired,
    trainingUrl,
    trainingDescription,
  } = params;

  const categoryDisplay = formatCategory(volunteerCategory);
  const firstName = volunteerName.split(" ")[0] || volunteerName;

  // Build documents list HTML
  const documentsHtml =
    documents.length > 0
      ? documents
          .map(
            doc => `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
            <div style="font-weight: 500; color: #111827; margin-bottom: 4px;">${doc.name}</div>
            ${doc.description ? `<div style="font-size: 13px; color: #6b7280;">${doc.description}</div>` : ""}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            <a href="${doc.fileUrl}" style="display: inline-block; padding: 6px 12px; background-color: #f3f4f6; color: #374151; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 500;">View</a>
          </td>
        </tr>
      `
          )
          .join("")
      : "";

  // Build background check section
  const bgCheckHtml =
    backgroundCheckRequired && backgroundCheckUrl
      ? `
      <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #92400e;">Background Check Required</h3>
        <p style="margin: 0 0 12px; font-size: 14px; color: #78350f;">
          ${backgroundCheckInstructions || `A background check is required for ${categoryDisplay}. Please complete this before your first day.`}
        </p>
        <a href="${backgroundCheckUrl}" style="display: inline-block; padding: 10px 20px; background-color: #f59e0b; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">Start Background Check</a>
      </div>
    `
      : "";

  // Build training section
  const trainingHtml =
    trainingRequired && trainingUrl
      ? `
      <div style="background-color: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #1e40af;">Training Required</h3>
        <p style="margin: 0 0 12px; font-size: 14px; color: #1e3a8a;">
          ${trainingDescription || `Please complete the required training for ${categoryDisplay}.`}
        </p>
        <a href="${trainingUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">Start Training</a>
      </div>
    `
      : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${categoryDisplay} - ${churchName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <div style="display: inline-block; padding: 8px 16px; background-color: #dcfce7; border-radius: 9999px; margin-bottom: 16px;">
                <span style="font-size: 14px; font-weight: 600; color: #166534;">Welcome to the Team!</span>
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827; line-height: 1.2;">
                Your ${categoryDisplay} Onboarding Materials
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 16px; font-size: 16px; color: #374151; line-height: 1.6;">
                Hi ${firstName},
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; color: #374151; line-height: 1.6;">
                Thank you for volunteering with <strong>${categoryDisplay}</strong> at ${churchName}! We're excited to have you on the team.
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; color: #374151; line-height: 1.6;">
                Below you'll find everything you need to get started. Please review these materials and complete any required steps.
              </p>

              ${bgCheckHtml}
              ${trainingHtml}

              ${
                documents.length > 0
                  ? `
              <!-- Documents Table -->
              <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #111827;">Documents to Review</h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 24px;">
                ${documentsHtml}
              </table>
              `
                  : ""
              }

              <p style="margin: 24px 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
                If you have any questions, please reach out to your ministry leader or the church office.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5; text-align: center;">
                © ${new Date().getFullYear()} ${churchName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Plain text version of volunteer documents email
 */
export function getVolunteerDocumentsText(
  params: VolunteerDocumentsEmailParams
): string {
  const {
    churchName,
    volunteerName,
    volunteerCategory,
    documents,
    backgroundCheckRequired,
    backgroundCheckUrl,
    backgroundCheckInstructions,
    trainingRequired,
    trainingUrl,
    trainingDescription,
  } = params;

  const categoryDisplay = formatCategory(volunteerCategory);
  const firstName = volunteerName.split(" ")[0] || volunteerName;

  const documentsList = documents
    .map(
      doc =>
        `- ${doc.name}${doc.description ? ` - ${doc.description}` : ""}\n  ${doc.fileUrl}`
    )
    .join("\n");

  const bgCheckSection =
    backgroundCheckRequired && backgroundCheckUrl
      ? `
BACKGROUND CHECK REQUIRED
-------------------------
${backgroundCheckInstructions || `A background check is required for ${categoryDisplay}. Please complete this before your first day.`}

Start Background Check: ${backgroundCheckUrl}
`
      : "";

  const trainingSection =
    trainingRequired && trainingUrl
      ? `
TRAINING REQUIRED
-----------------
${trainingDescription || `Please complete the required training for ${categoryDisplay}.`}

Start Training: ${trainingUrl}
`
      : "";

  return `
Welcome to ${categoryDisplay} - ${churchName}

Hi ${firstName},

Thank you for volunteering with ${categoryDisplay} at ${churchName}! We're excited to have you on the team.

Below you'll find everything you need to get started. Please review these materials and complete any required steps.
${bgCheckSection}${trainingSection}
${
  documents.length > 0
    ? `
DOCUMENTS TO REVIEW
-------------------
${documentsList}
`
    : ""
}
If you have any questions, please reach out to your ministry leader or the church office.

© ${new Date().getFullYear()} ${churchName}. All rights reserved.
  `.trim();
}
