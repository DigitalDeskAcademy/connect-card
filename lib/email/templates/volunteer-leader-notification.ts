/**
 * Volunteer Leader Notification Email Template
 *
 * Sends email to ministry leaders when a new volunteer is assigned to them.
 * Includes volunteer contact info and ministry category.
 */
interface VolunteerLeaderNotificationParams {
  churchName: string;
  leaderName: string;
  volunteerName: string;
  volunteerEmail: string | null;
  volunteerPhone: string | null;
  volunteerCategory: string;
  dashboardUrl: string;
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

export function getVolunteerLeaderNotificationEmail(
  params: VolunteerLeaderNotificationParams
): string {
  const {
    churchName,
    leaderName,
    volunteerName,
    volunteerEmail,
    volunteerPhone,
    volunteerCategory,
    dashboardUrl,
  } = params;

  const categoryDisplay = formatCategory(volunteerCategory);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Volunteer Assigned - ${churchName}</title>
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
                <span style="font-size: 14px; font-weight: 600; color: #166534;">New Volunteer</span>
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827; line-height: 1.2;">
                A new volunteer has been assigned to you
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 16px; font-size: 16px; color: #374151; line-height: 1.6;">
                Hi ${leaderName},
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; color: #374151; line-height: 1.6;">
                Good news! <strong>${volunteerName}</strong> has expressed interest in volunteering with <strong>${categoryDisplay}</strong> and has been assigned to you.
              </p>

              <!-- Volunteer Info Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
                      Volunteer Information
                    </h3>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="font-size: 14px; color: #6b7280;">Name</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                          <span style="font-size: 14px; color: #111827; font-weight: 500;">${volunteerName}</span>
                        </td>
                      </tr>
                      ${
                        volunteerEmail
                          ? `
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="font-size: 14px; color: #6b7280;">Email</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                          <a href="mailto:${volunteerEmail}" style="font-size: 14px; color: #2563eb; text-decoration: none; font-weight: 500;">${volunteerEmail}</a>
                        </td>
                      </tr>
                      `
                          : ""
                      }
                      ${
                        volunteerPhone
                          ? `
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="font-size: 14px; color: #6b7280;">Phone</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                          <a href="tel:${volunteerPhone}" style="font-size: 14px; color: #2563eb; text-decoration: none; font-weight: 500;">${volunteerPhone}</a>
                        </td>
                      </tr>
                      `
                          : ""
                      }
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="font-size: 14px; color: #6b7280;">Ministry</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="display: inline-block; padding: 4px 12px; background-color: #dbeafe; border-radius: 9999px; font-size: 13px; color: #1e40af; font-weight: 500;">${categoryDisplay}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px; font-size: 16px; color: #374151; line-height: 1.6;">
                Please reach out to welcome them and discuss next steps for their onboarding journey.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; line-height: 1.5;">
                      View in Dashboard
                    </a>
                  </td>
                </tr>
              </table>
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
 * Plain text version of volunteer leader notification email
 */
export function getVolunteerLeaderNotificationText(
  params: VolunteerLeaderNotificationParams
): string {
  const {
    churchName,
    leaderName,
    volunteerName,
    volunteerEmail,
    volunteerPhone,
    volunteerCategory,
    dashboardUrl,
  } = params;

  const categoryDisplay = formatCategory(volunteerCategory);

  const contactInfo = [
    `Name: ${volunteerName}`,
    volunteerEmail ? `Email: ${volunteerEmail}` : null,
    volunteerPhone ? `Phone: ${volunteerPhone}` : null,
    `Ministry: ${categoryDisplay}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `
New Volunteer Assigned - ${churchName}

Hi ${leaderName},

Good news! ${volunteerName} has expressed interest in volunteering with ${categoryDisplay} and has been assigned to you.

VOLUNTEER INFORMATION
---------------------
${contactInfo}

Please reach out to welcome them and discuss next steps for their onboarding journey.

View in Dashboard: ${dashboardUrl}

© ${new Date().getFullYear()} ${churchName}. All rights reserved.
  `.trim();
}
