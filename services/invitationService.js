// services/invitationService.js
// Member invitation management service

const { supabase } = require('../supabaseClient');
const crypto = require('crypto');
const { Resend } = require('resend');

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Generate a secure random invitation token
 */
function generateInvitationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Send invitation email via Resend
 */
async function sendInvitationEmail({ email, token, userName }) {
  try {
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const registrationLink = `${appUrl}/register/${token}`;
    const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
    const fromName = process.env.FROM_NAME || 'Viking Hammer CrossFit';
    const replyTo = process.env.REPLY_TO_EMAIL || 'vikingshammerxfit@gmail.com';

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [email],
      replyTo: replyTo,
      subject: 'Welcome to Viking Hammer CrossFit! 🏋️',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⚔️ Viking Hammer CrossFit</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <h2 style="color: #667eea; margin-top: 0;">Welcome${
              userName ? ', ' + userName : ''
            }! 🎉</h2>
            
            <p style="font-size: 16px;">
              You've been invited to join <strong>Viking Hammer CrossFit</strong>! We're excited to have you as part of our community.
            </p>
            
            <p style="font-size: 16px;">
              Click the button below to complete your registration and set up your account:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${registrationLink}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 40px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-size: 18px; 
                        font-weight: bold;
                        display: inline-block;">
                Complete Registration
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              Or copy and paste this link into your browser:
            </p>
            <p style="background: white; padding: 15px; border-radius: 5px; word-break: break-all; font-size: 13px; border: 1px solid #e0e0e0;">
              ${registrationLink}
            </p>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 20px; border-radius: 5px;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                ⏰ <strong>Important:</strong> This invitation link will expire in 7 days.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="font-size: 14px; color: #666; margin: 5px 0;">
                Need help? Contact us at <a href="mailto:${replyTo}" style="color: #667eea;">${replyTo}</a>
              </p>
              <p style="font-size: 12px; color: #999; margin-top: 15px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Viking Hammer CrossFit. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Email sent successfully to ${email}. Message ID:`, data.id);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new invitation and send email
 * Note: Uses direct SQL to bypass RLS since this is a server-side operation
 * Backend validates permissions before calling this function
 */
async function createInvitation({ userId, email, phone, deliveryMethod, sentBy, userName }) {
  try {
    const token = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const invitationMessage = `You've been invited to join Viking Hammer CrossFit! 
Click the link to complete your registration: ${appUrl}/register/${token}`;

    // Create invitation in database
    const { data, error } = await supabase
      .from('invitations')
      .insert([
        {
          user_id: userId,
          invitation_token: token,
          email,
          phone,
          delivery_method: deliveryMethod || 'email',
          invitation_message: invitationMessage,
          expires_at: expiresAt.toISOString(),
          sent_by: sentBy || 'system',
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      console.warn('RLS blocked invitation insert, error:', error);
      throw error;
    }

    // Send email via Resend
    if (deliveryMethod === 'email' || !deliveryMethod) {
      const emailResult = await sendInvitationEmail({
        email,
        token,
        userName,
      });

      if (emailResult.success) {
        // Mark invitation as sent
        await markInvitationAsSent(token);
        console.log(`✅ Invitation created and email sent to ${email}`);
      } else {
        console.warn(`⚠️  Invitation created but email failed: ${emailResult.error}`);
        // Update status to failed
        await supabase
          .from('invitations')
          .update({ status: 'failed' })
          .eq('invitation_token', token);
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating invitation:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Mark invitation as sent
 */
async function markInvitationAsSent(token) {
  try {
    const { data, error } = await supabase
      .from('invitations')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('invitation_token', token)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error marking invitation as sent:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Validate invitation token
 */
async function validateInvitationToken(token) {
  try {
    const { data, error } = await supabase
      .from('invitations')
      .select('*, users_profile(*)')
      .eq('invitation_token', token)
      .single();

    if (error) throw error;

    if (!data) {
      return { valid: false, error: 'Invalid invitation token' };
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    if (now > expiresAt) {
      // Mark as expired
      await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('invitation_token', token);

      return { valid: false, error: 'Invitation has expired' };
    }

    // Check if already accepted
    if (data.status === 'accepted') {
      return { valid: false, error: 'Invitation already used' };
    }

    return { valid: true, data, error: null };
  } catch (error) {
    console.error('Error validating invitation token:', error);
    return { valid: false, error: error.message };
  }
}

/**
 * Mark invitation as accepted
 */
async function acceptInvitation(token) {
  try {
    const { data, error } = await supabase
      .from('invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('invitation_token', token)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Get all invitations for a user
 */
async function getUserInvitations(userId) {
  try {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error getting user invitations:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Clean up expired invitations (can be run as a cron job)
 */
async function cleanupExpiredInvitations() {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('invitations')
      .update({ status: 'expired' })
      .lt('expires_at', now)
      .eq('status', 'pending')
      .select();

    if (error) throw error;

    console.log(`Cleaned up ${data?.length || 0} expired invitations`);
    return { data, error: null };
  } catch (error) {
    console.error('Error cleaning up expired invitations:', error);
    return { data: null, error: error.message };
  }
}

module.exports = {
  generateInvitationToken,
  createInvitation,
  sendInvitationEmail,
  markInvitationAsSent,
  validateInvitationToken,
  acceptInvitation,
  getUserInvitations,
  cleanupExpiredInvitations,
};
