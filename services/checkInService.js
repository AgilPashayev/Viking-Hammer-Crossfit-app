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
      .select('id, first_name, last_name, membership_status')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return { data: null, error: 'User not found', status: 404 };
    }

    if (user.membership_status !== 'active') {
      return {
        data: null,
        error: 'Cannot check-in. Membership is not active.',
        status: 403,
      };
    }

    // Create check-in record
    const { data: checkIn, error: insertError } = await supabase
      .from('check_ins')
      .insert([
        {
          user_id: userId,
          check_in_time: new Date().toISOString(),
          qr_code_used: qrCode || null,
          location_id: locationId || null,
          status: 'completed',
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
        userName: `${user.first_name} ${user.last_name}`,
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
      .from('check_ins')
      .select(
        `
        *,
        users_profile!inner(id, first_name, last_name, email)
      `,
      )
      .order('check_in_time', { ascending: false });

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.startDate) {
      query = query.gte('check_in_time', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('check_in_time', filters.endDate);
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
      .from('check_ins')
      .select('*')
      .eq('user_id', userId)
      .order('check_in_time', { ascending: false })
      .limit(limit);

    if (startDate) {
      query = query.gte('check_in_time', startDate);
    }

    if (endDate) {
      query = query.lte('check_in_time', endDate);
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
    let query = supabase.from('check_ins').select('id, user_id, check_in_time');

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.startDate) {
      query = query.gte('check_in_time', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('check_in_time', filters.endDate);
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
      const hour = new Date(ci.check_in_time).getHours();
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
