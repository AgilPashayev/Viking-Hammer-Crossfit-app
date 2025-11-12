// services/checkInService.js - Check-in Service
const { supabase } = require('../supabaseClient');

/**
 * Create a check-in record
 * @param {object} checkInData - Check-in data {userId, qrCode, locationId}
 * @returns {Promise<{data: object|null, error: string|null}>}
 */
async function createCheckIn(checkInData) {
  try {
    const { userId, qrCode, locationId } = checkInData;

    if (!userId) {
      return { data: null, error: 'userId is required', status: 400 };
    }

    // Verify user exists and has active membership
    const { data: user, error: userError } = await supabase
      .from('users_profile')
      .select('id, name, status')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return { data: null, error: 'User not found', status: 404 };
    }

    if (user.status !== 'active') {
      return {
        data: null,
        error: 'Cannot check-in. Membership is not active.',
        status: 403,
      };
    }

    // Get user's active subscription to decrement remaining visits
    const { data: activeSubscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    // If user has an active subscription with visit limits, decrement it
    if (
      activeSubscription &&
      activeSubscription.remaining_visits !== null &&
      activeSubscription.remaining_visits !== undefined
    ) {
      const newRemainingVisits = Math.max(0, activeSubscription.remaining_visits - 1);

      // Update the subscription with decremented visits
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          remaining_visits: newRemainingVisits,
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeSubscription.id);

      if (updateError) {
        console.error('Error updating subscription visits:', updateError);
      } else {
        console.log(
          `✅ Decremented visits for subscription ${activeSubscription.id}: ${activeSubscription.remaining_visits} → ${newRemainingVisits}`,
        );
      }

      // Check if subscription should be marked as expired (no visits left)
      if (newRemainingVisits === 0 && activeSubscription.total_visits !== null) {
        const { error: statusError } = await supabase
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('id', activeSubscription.id);

        if (statusError) {
          console.error('Error updating subscription status:', statusError);
        } else {
          console.log(
            `⚠️ Subscription ${activeSubscription.id} marked as expired (0 visits remaining)`,
          );
        }
      }
    }

    // Create check-in record
    const { data: checkIn, error: insertError } = await supabase
      .from('checkins')
      .insert([
        {
          user_id: userId,
          ts: new Date().toISOString(),
          method: 'QR',
          location_id: locationId || null,
          notes: qrCode ? `QR Code: ${qrCode}` : null,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Check-in insert error:', insertError);
      return { data: null, error: insertError.message, status: 500 };
    }

    return {
      data: {
        ...checkIn,
        userName: user.name || 'Member',
      },
      error: null,
    };
  } catch (error) {
    console.error('Error creating check-in:', error);
    return { data: null, error: error.message, status: 500 };
  }
}

/**
 * Get all check-ins with optional filters
 * @param {object} filters - {userId, startDate, endDate, locationId}
 * @returns {Promise<{data: array|null, error: string|null}>}
 */
async function getAllCheckIns(filters = {}) {
  try {
    let query = supabase
      .from('checkins')
      .select(
        `
  *,
  users_profile!inner(id, name, email)
      `,
      )
      .order('ts', { ascending: false });

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.startDate) {
      query = query.gte('ts', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('ts', filters.endDate);
    }

    if (filters.locationId) {
      query = query.eq('location_id', filters.locationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Check-ins fetch error:', error);
      return { data: null, error: error.message, status: 500 };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    return { data: null, error: error.message, status: 500 };
  }
}

/**
 * Get check-ins for a specific user
 * @param {string} userId - User ID
 * @param {object} options - {limit, startDate, endDate}
 * @returns {Promise<{data: array|null, error: string|null}>}
 */
async function getUserCheckIns(userId, options = {}) {
  try {
    const { limit = 50, startDate, endDate } = options;

    let query = supabase
      .from('checkins')
      .select('*')
      .eq('user_id', userId)
      .order('ts', { ascending: false })
      .limit(limit);

    if (startDate) {
      query = query.gte('ts', startDate);
    }

    if (endDate) {
      query = query.lte('ts', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('User check-ins fetch error:', error);
      return { data: null, error: error.message, status: 500 };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user check-ins:', error);
    return { data: null, error: error.message, status: 500 };
  }
}

/**
 * Get check-in statistics
 * @param {object} filters - {userId, startDate, endDate}
 * @returns {Promise<{data: object|null, error: string|null}>}
 */
async function getCheckInStatistics(filters = {}) {
  try {
    let query = supabase.from('checkins').select('id, user_id, ts');

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.startDate) {
      query = query.gte('ts', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('ts', filters.endDate);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message, status: 500 };
    }

    // Calculate statistics
    const totalCheckIns = data.length;
    const uniqueUsers = new Set(data.map((ci) => ci.user_id)).size;

    // Group by hour for peak time analysis
    const hourCounts = {};
    data.forEach((ci) => {
      const hour = new Date(ci.ts).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHour = Object.entries(hourCounts).reduce(
      (max, [hour, count]) => (count > max.count ? { hour: parseInt(hour), count } : max),
      { hour: 0, count: 0 },
    );

    return {
      data: {
        totalCheckIns,
        uniqueUsers,
        peakHour: peakHour.hour,
        peakHourCount: peakHour.count,
        averagePerDay: totalCheckIns / 7, // Assuming weekly stats
        hourlyDistribution: hourCounts,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error calculating statistics:', error);
    return { data: null, error: error.message, status: 500 };
  }
}

module.exports = {
  createCheckIn,
  getAllCheckIns,
  getUserCheckIns,
  getCheckInStatistics,
};
