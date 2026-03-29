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
export const getVerificationEmailHTML = (verificationUrl, email) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #0a0a1a; border-radius: 16px; color: #f1f5f9;">
      <h2 style="color: #c084fc; margin-bottom: 16px;">Verify your email</h2>
      <p style="color: #94a3b8; line-height: 1.6;">Welcome to PrepLoop! To complete your signup, please verify your email address.</p>
      <p style="color: #94a3b8; line-height: 1.6; margin-bottom: 24px;">Click the button below to verify:</p>
      <a href="${verificationUrl}" style="display: inline-block; margin: 20px 0; padding: 14px 28px; background: linear-gradient(135deg, #a855f7, #c026d3); color: white; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 15px;">Verify Email</a>
      <p style="color: #94a3b8; line-height: 1.6; margin-top: 24px;">Or copy and paste this link in your browser:</p>
      <p style="color: #64748b; font-size: 12px; word-break: break-all; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">${verificationUrl}</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08);">
        <p style="color: #64748b; font-size: 13px; margin: 0;">
          <strong>This link expires in 24 hours.</strong>
        </p>
        <p style="color: #64748b; font-size: 13px; margin-top: 10px;">
          If you didn't create this account, you can safely ignore this email.
        </p>
      </div>
      <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0;" />
      <p style="color: #475569; font-size: 12px;">PrepLoop - AI Interview Prep Platform</p>
    </div>
  `;
};
