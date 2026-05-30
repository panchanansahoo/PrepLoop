import crypto from 'crypto';

/**
 * Generate a random verification token
 * @returns {string} 32-character hex token
 */
export const generateVerificationToken = () => {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Get token expiration time (24 hours from now)
 * @returns {Date} Expiration timestamp
 */
export const getTokenExpirationTime = () => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // Token valid for 24 hours
  return expiresAt;
};

/**
 * Check if token has expired
 * @param {Date} expiresAt - Token expiration timestamp
 * @returns {boolean} True if token has expired
 */
export const isTokenExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

/**
 * HTML template for verification email
 * @param {string} verificationUrl - Full verification URL
 * @param {string} email - User email
 * @returns {string} HTML email content
 */
export const getVerificationEmailHTML = (verificationUrl, _email) => {
  return `
    <div style="background-color: #020617; margin: 0; padding: 40px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';">
      <div style="max-width: 520px; margin: 0 auto; background-color: #0f172a; border-radius: 12px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        <!-- Logo / Brand Header -->
        <div style="padding: 32px 32px 0 32px; text-align: center;">
          <h1 style="margin: 0; color: #f8fafc; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">PrepLoop</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px;">
          <h2 style="margin: 0 0 16px; color: #f8fafc; font-size: 18px; font-weight: 600;">Confirm your email address</h2>
          <p style="margin: 0 0 24px; color: #94a3b8; font-size: 15px; line-height: 1.6;">
            Welcome to PrepLoop! To complete your signup and secure your account, please verify your email address.
          </p>
          
          <!-- CTA Button -->
          <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px; width: 100%;">
            <tr>
              <td align="center">
                <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #9333ea; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; line-height: 100%;">Verify Email</a>
              </td>
            </tr>
          </table>
          
          <p style="margin: 0 0 8px; color: #94a3b8; font-size: 14px; line-height: 1.5;">Or copy and paste this link in your browser:</p>
          <div style="background-color: #020617; padding: 12px; border-radius: 6px; border: 1px solid #1e293b; overflow-wrap: anywhere; word-wrap: break-word; word-break: break-all;">
            <a href="${verificationUrl}" style="color: #c084fc; font-size: 13px; text-decoration: none; line-height: 1.4;">${verificationUrl}</a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="padding: 24px 32px; background-color: #020617; border-top: 1px solid #1e293b; text-align: center;">
          <p style="margin: 0 0 8px; color: #64748b; font-size: 12px;">This link will expire in 24 hours.</p>
          <p style="margin: 0; color: #475569; font-size: 12px;">If you didn't request this email, there's nothing to worry about &mdash; you can safely ignore it.</p>
        </div>
      </div>
    </div>
  `;
};
