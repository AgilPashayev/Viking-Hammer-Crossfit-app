// services/resetService.js - Password Reset Token Management
const crypto = require('crypto');
const { supabase } = require('../supabaseClient');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Generate a secure random token for password reset
 */
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a password reset token and send email
 * @param {string} email - User email
 * @returns {Promise<Object>} Result with token and email status
 */
async function createPasswordResetToken(email) {
  try {
    // 1. Find user by email
    const { data: user, error: userError } = await supabase
      .from('users_profile')
      .select('id, name, email, role')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (userError || !user) {
      // Don't reveal if email exists (security best practice)
      return {
        success: true,
        message: 'If that email exists, a reset link has been sent',
      };
    }

    // 2. Generate reset token
    const token = generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1-hour expiry

    // 3. Store token in database
    const { data: resetToken, error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        email: user.email,
        token: token,
        expires_at: expiresAt.toISOString(),
        used: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to create reset token:', insertError);
      return { error: 'Failed to create reset token', status: 500 };
    }

    // 4. Send reset email
    const resetLink = `${process.env.APP_URL}/reset-password/${token}`;
    const emailResult = await sendPasswordResetEmail(user, resetLink);

    if (emailResult.error) {
      console.error('❌ Failed to send reset email:', emailResult.error);
      // Don't fail the request, just log it
    }

    return {
      success: true,
      message: 'If that email exists, a reset link has been sent',
      data: {
        token: token,
        link: resetLink,
        expiresAt: resetToken.expires_at,
      },
    };
  } catch (error) {
    console.error('❌ Password reset error:', error);
    return { error: 'Failed to process password reset request', status: 500 };
  }
}

/**
 * Send password reset email using Resend
 * @param {Object} user - User object with email and name
 * @param {string} resetLink - Password reset link
 * @returns {Promise<Object>} Email send result
 */
async function sendPasswordResetEmail(user, resetLink) {
  try {
    const userName = user.name || user.email.split('@')[0] || 'Member';

    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to: [user.email],
      replyTo: process.env.REPLY_TO_EMAIL || 'vikingshammerxfit@gmail.com',
      subject: 'Reset Your Viking Hammer CrossFit Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Arial', 'Helvetica', sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header with gradient -->
                  <tr>
                    <td style="padding: 0;">
                      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                          🔨 Viking Hammer CrossFit
                        </h1>
                        <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">
                          Password Reset Request
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">
                        Hello ${userName}! 👋
                      </h2>
                      
                      <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                        We received a request to reset your password for your Viking Hammer CrossFit account.
                      </p>
                      
                      <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                        Click the button below to reset your password:
                      </p>
                      
                      <!-- Reset Button -->
                      <table role="presentation" style="margin: 0 auto;">
                        <tr>
                          <td style="border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                            <a href="${resetLink}" 
                               style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                              🔒 Reset My Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 30px 0 20px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                        This link will expire in <strong>1 hour</strong> for security reasons.
                      </p>
                      
                      <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                        <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                          <strong>⚠️ Security Notice:</strong><br>
                          If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
                        </p>
                      </div>
                      
                      <p style="margin: 20px 0 0 0; color: #999999; font-size: 12px; line-height: 1.6;">
                        Or copy and paste this link into your browser:<br>
                        <a href="${resetLink}" style="color: #667eea; word-break: break-all;">${resetLink}</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
                      <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                        <strong>Viking Hammer CrossFit</strong>
                      </p>
                      <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px;">
                        Forge Your Strength. Build Your Community.
                      </p>
                      <p style="margin: 0; color: #999999; font-size: 12px;">
                        Need help? Contact us at ${
                          process.env.REPLY_TO_EMAIL || 'vikingshammerxfit@gmail.com'
                        }
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      return { error: error.message };
    }

    console.log(`✅ Password reset email sent to ${user.email}. Message ID: ${data.id}`);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    return { error: error.message };
  }
}

/**
 * Validate password reset token
 * @param {string} token - Reset token to validate
 * @returns {Promise<Object>} Validation result with user data if valid
 */
async function validateResetToken(token) {
  try {
    const { data: resetToken, error } = await supabase
      .from('password_reset_tokens')
      .select('id, user_id, email, expires_at, used')
      .eq('token', token)
      .single();

    if (error || !resetToken) {
      return { valid: false, error: 'Invalid reset token' };
    }

    if (resetToken.used) {
      return { valid: false, error: 'This reset link has already been used' };
    }

    const now = new Date();
    const expiresAt = new Date(resetToken.expires_at);

    if (now > expiresAt) {
      return { valid: false, error: 'This reset link has expired' };
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users_profile')
      .select('id, name, email, role')
      .eq('id', resetToken.user_id)
      .single();

    if (userError || !user) {
      return { valid: false, error: 'User not found' };
    }

    return {
      valid: true,
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
        tokenId: resetToken.id,
      },
    };
  } catch (error) {
    console.error('❌ Token validation error:', error);
    return { valid: false, error: 'Failed to validate token' };
  }
}

/**
 * Reset user password using valid token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Reset result
 */
async function resetPassword(token, newPassword) {
  try {
    // 1. Validate token
    const validation = await validateResetToken(token);
    if (!validation.valid) {
      return { error: validation.error, status: 400 };
    }

    const { userId, tokenId } = validation.data;

    // 2. Update password using authService
    const authService = require('./authService');
    const result = await authService.resetUserPassword(userId, newPassword);

    if (result.error) {
      return { error: result.error, status: result.status || 500 };
    }

    // 3. Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', tokenId);

    console.log(`✅ Password reset successful for user ${userId}`);

    return {
      success: true,
      message: 'Password reset successfully',
      data: result.data,
    };
  } catch (error) {
    console.error('❌ Password reset error:', error);
    return { error: 'Failed to reset password', status: 500 };
  }
}

module.exports = {
  createPasswordResetToken,
  validateResetToken,
  resetPassword,
  sendPasswordResetEmail,
};
