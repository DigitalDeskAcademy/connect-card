/**
 * Staff Invitation Email Template
 *
 * Sends email to invited staff members with secure acceptance link.
 * Template includes organization details, role information, and expiration notice.
 *
 * @param params - Template parameters
 * @returns HTML email content
 */
interface StaffInvitationParams {
  churchName: string;
  inviterName: string;
  recipientEmail: string;
  role: string;
  locationName: string | null;
  acceptUrl: string;
  expiresInDays: number;
}

export function getStaffInvitationEmail(params: StaffInvitationParams): string {
  const {
    churchName,
    inviterName,
    recipientEmail,
    role,
    locationName,
    acceptUrl,
    expiresInDays,
  } = params;

  const roleDisplay = role === "church_admin" ? "Church Admin" : "Staff";
  const locationText = locationName
    ? ` at the ${locationName} location`
    : " with access to all locations";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation - ${churchName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 32px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #111827; line-height: 1.2;">
                You've been invited to join<br>${churchName}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 16px; font-size: 16px; color: #374151; line-height: 1.6;">
                Hi there,
              </p>
              <p style="margin: 0 0 16px; font-size: 16px; color: #374151; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join <strong>${churchName}</strong>'s Connect Card Management team as a <strong>${roleDisplay}</strong>${locationText}.
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; color: #374151; line-height: 1.6;">
                As a team member, you'll be able to:
              </p>

              <ul style="margin: 0 0 24px; padding-left: 24px; font-size: 16px; color: #374151; line-height: 1.6;">
                ${
                  role === "church_admin"
                    ? `
                <li style="margin-bottom: 8px;">Scan and process connect cards</li>
                <li style="margin-bottom: 8px;">Review and edit visitor information</li>
                <li style="margin-bottom: 8px;">Manage team members and locations</li>
                <li style="margin-bottom: 8px;">Access analytics and reports</li>
                `
                    : `
                <li style="margin-bottom: 8px;">Scan and process connect cards</li>
                <li style="margin-bottom: 8px;">Review and edit visitor information</li>
                <li>View dashboard analytics for your location</li>
                `
                }
              </ul>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${acceptUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; line-height: 1.5;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                Or copy and paste this URL into your browser:<br>
                <a href="${acceptUrl}" style="color: #2563eb; word-break: break-all;">${acceptUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280; line-height: 1.6;">
                <strong>Important:</strong> This invitation will expire in ${expiresInDays} days.
              </p>
              <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280; line-height: 1.6;">
                This invitation was sent to <strong>${recipientEmail}</strong>. If you didn't expect this invitation, you can safely ignore this email.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
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
 * Plain text version of staff invitation email
 * Used as fallback for email clients that don't support HTML
 */
export function getStaffInvitationText(params: StaffInvitationParams): string {
  const {
    churchName,
    inviterName,
    recipientEmail,
    role,
    locationName,
    acceptUrl,
    expiresInDays,
  } = params;

  const roleDisplay = role === "church_admin" ? "Church Admin" : "Staff";
  const locationText = locationName
    ? ` at the ${locationName} location`
    : " with access to all locations";

  return `
You've been invited to join ${churchName}

Hi there,

${inviterName} has invited you to join ${churchName}'s Connect Card Management team as a ${roleDisplay}${locationText}.

Accept your invitation here:
${acceptUrl}

This invitation will expire in ${expiresInDays} days.

This invitation was sent to ${recipientEmail}. If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} ${churchName}. All rights reserved.
  `.trim();
}
