// services/notificationService.js
// Notification Management Service for Viking Hammer Gym

const { supabase } = require('../supabaseClient');

/**
 * Create a new notification in the outbox
 * @param {Object} notificationData
 * @returns {Promise<{notification: Object|null, error: string|null}>}
 */
async function createNotification(notificationData) {
  try {
    const { recipient_user_id, payload, channel, status = 'pending' } = notificationData;

    if (!recipient_user_id || !payload || !channel) {
      return { notification: null, error: 'Missing required fields' };
    }

    const { data, error } = await supabase
      .from('notifications_outbox')
      .insert([
        {
          recipient_user_id,
          payload,
          channel,
          status,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return { notification: null, error: error.message };
    }

    console.log(`✅ Notification created for user ${recipient_user_id}`);
    return { notification: data, error: null };
  } catch (error) {
    console.error('Unexpected error in createNotification:', error);
    return { notification: null, error: error.message };
  }
}

/**
 * Get all notifications for a user
 * @param {string} userId
 * @returns {Promise<{notifications: Array, error: string|null}>}
 */
async function getUserNotifications(userId) {
  try {
    const { data, error } = await supabase
      .from('notifications_outbox')
      .select('*')
      .eq('recipient_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return { notifications: [], error: error.message };
    }

    return { notifications: data, error: null };
  } catch (error) {
    console.error('Unexpected error in getUserNotifications:', error);
    return { notifications: [], error: error.message };
  }
}

/**
 * Mark notification as sent
 * @param {number} notificationId
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function markAsSent(notificationId) {
  try {
    const { error } = await supabase
      .from('notifications_outbox')
      .update({ status: 'sent' })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as sent:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error in markAsSent:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a notification
 * @param {number} notificationId
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function deleteNotification(notificationId) {
  try {
    const { error } = await supabase.from('notifications_outbox').delete().eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error in deleteNotification:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  createNotification,
  getUserNotifications,
  markAsSent,
  deleteNotification,
};
