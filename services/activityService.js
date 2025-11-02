// Activity Service - Handles activity logging and retrieval
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Create a new activity log entry
 */
async function createActivity(activityData) {
  try {
    const {
      type,
      message,
      memberId = null,
      updatedByUserId = null,
      updatedByName = null,
      updatedByRole = null,
      metadata = null,
    } = activityData;

    const { data, error } = await supabase
      .from('activity_log')
      .insert([
        {
          type,
          message,
          member_id: memberId,
          updated_by_user_id: updatedByUserId,
          updated_by_name: updatedByName,
          updated_by_role: updatedByRole,
          metadata,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating activity:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to create activity:', error);
    throw error;
  }
}

/**
 * Get recent activities with pagination
 */
async function getActivities(limit = 200, offset = 0) {
  try {
    const { data, error, count } = await supabase
      .from('activity_log')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }

    return {
      activities: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    throw error;
  }
}

/**
 * Get activities for a specific member
 */
async function getActivitiesByMember(memberId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('member_id', memberId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching member activities:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch member activities:', error);
    throw error;
  }
}

/**
 * Get activities by type
 */
async function getActivitiesByType(type, limit = 100) {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('type', type)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activities by type:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch activities by type:', error);
    throw error;
  }
}

/**
 * Delete old activities (cleanup)
 */
async function deleteOldActivities(daysOld = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from('activity_log')
      .delete()
      .lt('timestamp', cutoffDate.toISOString());

    if (error) {
      console.error('Error deleting old activities:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to delete old activities:', error);
    throw error;
  }
}

module.exports = {
  createActivity,
  getActivities,
  getActivitiesByMember,
  getActivitiesByType,
  deleteOldActivities,
};
