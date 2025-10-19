// services/invitationService.js
// Member invitation management service

const { supabase } = require('../supabaseClient');
const crypto = require('crypto');

/**
 * Generate a secure random invitation token
 */
function generateInvitationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a new invitation
 */
async function createInvitation({ userId, email, phone, deliveryMethod, sentBy }) {
  try {
    const token = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invitationMessage = `You've been invited to join Viking Hammer CrossFit! 
Click the link to complete your registration: ${
      process.env.APP_URL || 'http://localhost:5173'
    }/register/${token}`;

    const { data, error } = await supabase
      .from('invitations')
      .insert([
        {
          user_id: userId,
          invitation_token: token,
          email,
          phone,
          delivery_method: deliveryMethod,
          invitation_message: invitationMessage,
          expires_at: expiresAt.toISOString(),
          sent_by: sentBy,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) throw error;

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
  markInvitationAsSent,
  validateInvitationToken,
  acceptInvitation,
  getUserInvitations,
  cleanupExpiredInvitations,
};
