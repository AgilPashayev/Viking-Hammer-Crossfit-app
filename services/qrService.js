// services/qrService.js - QR Code Service for Member Check-ins
const { supabase } = require('../supabaseClient');
const crypto = require('crypto');

/**
 * Generate QR code for member check-in
 * @param {string} userId - User ID
 * @returns {Promise<{data: object|null, error: string|null}>}
 */
async function mintQRCode(userId) {
  try {
    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users_profile')
      .select('id, name, status')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return { data: null, error: 'User not found', status: 404 };
    }

    // Check membership status
    if (user.status !== 'active') {
      return {
        data: null,
        error: 'Membership is not active. Cannot generate QR code.',
        status: 403,
      };
    }

    // Generate unique QR code (base64 encoded userId + timestamp + random)
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const qrData = Buffer.from(`${userId}:${timestamp}:${random}`).toString('base64');

    return {
      data: {
        qrCode: qrData,
        userId: userId,
        userName: user.name || 'Member',
        generatedAt: new Date(timestamp).toISOString(),
        expiresAt: new Date(timestamp + 5 * 60 * 1000).toISOString(), // 5 minutes
      },
      error: null,
    };
  } catch (error) {
    console.error('Error minting QR code:', error);
    return { data: null, error: error.message, status: 500 };
  }
}

/**
 * Verify QR code and extract user information with membership limits validation
 * @param {string} qrCode - Base64 QR code string
 * @returns {Promise<{data: object|null, error: string|null, valid: boolean}>}
 */
async function verifyQRCode(qrCode) {
  try {
    // Decode QR code
    const decoded = Buffer.from(qrCode, 'base64').toString('utf-8');
    const [userId, timestamp, random] = decoded.split(':');

    if (!userId || !timestamp) {
      return {
        data: null,
        error: 'Invalid QR code format',
        valid: false,
        status: 400,
      };
    }

    // Check expiration (5 minutes)
    const qrTimestamp = parseInt(timestamp);
    const now = Date.now();
    const expirationTime = 5 * 60 * 1000; // 5 minutes

    if (now - qrTimestamp > expirationTime) {
      return {
        data: null,
        error: 'QR code expired. Please generate a new one.',
        valid: false,
        status: 410,
      };
    }

    // Verify user exists and get membership info
    const { data: user, error: userError } = await supabase
      .from('users_profile')
      .select('id, name, email, status, membership_type, avatar_url')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return {
        data: null,
        error: 'User not found',
        valid: false,
        status: 404,
      };
    }

    if (user.status !== 'active') {
      return {
        data: { ...user, reason: 'inactive_membership' },
        error: 'Membership is not active',
        valid: false,
        status: 403,
      };
    }

    // Get current month start and end dates
    const currentDate = new Date();
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

    // Count check-ins for current month
    const { data: checkIns, error: checkInError } = await supabase
      .from('checkins')
      .select('id, ts')
      .eq('user_id', userId)
      .gte('ts', monthStart.toISOString())
      .lte('ts', monthEnd.toISOString());

    if (checkInError) {
      console.error('Error fetching check-ins:', checkInError);
      // Continue without check-in count if error
    }

    const monthlyCheckInCount = checkIns ? checkIns.length : 0;
    let canCheckIn = true;
    let limitMessage = '';
    let remainingVisits = null;

    // Validate membership limits based on type
    const membershipType = user.membership_type || '';

    if (membershipType.toLowerCase().includes('limited') || membershipType === 'Monthly Limited') {
      // Monthly Limited: 12 visits per month
      const limit = 12;
      remainingVisits = Math.max(0, limit - monthlyCheckInCount);

      if (monthlyCheckInCount >= limit) {
        canCheckIn = false;
        limitMessage = `Monthly limit reached (${monthlyCheckInCount}/${limit} visits this month). Please upgrade to Monthly Unlimited.`;
      } else {
        limitMessage = `${remainingVisits} visits remaining this month (${monthlyCheckInCount}/${limit} used)`;
      }
    } else if (
      membershipType.toLowerCase().includes('unlimited') ||
      membershipType === 'Monthly Unlimited'
    ) {
      // Monthly Unlimited: No visit limit
      limitMessage = `Unlimited visits (${monthlyCheckInCount} visits this month)`;
      remainingVisits = -1; // -1 indicates unlimited
    } else if (
      membershipType.toLowerCase().includes('single') ||
      membershipType === 'Single Session'
    ) {
      // Single Session: Pay-per-visit, always allowed (payment verified separately)
      limitMessage = 'Pay-per-visit (Single Session)';
      remainingVisits = -1; // -1 indicates pay-per-visit
    } else {
      // Unknown membership type - allow but flag
      limitMessage = `Unknown membership type: ${membershipType} (${monthlyCheckInCount} visits this month)`;
    }

    const [firstName, ...lastParts] = (user.name || '').trim().split(' ');
    const lastName = lastParts.join(' ');

    return {
      data: {
        userId: user.id,
        firstName: firstName || user.name || 'Member',
        lastName: lastName || '',
        email: user.email,
        membershipStatus: user.status,
        membershipType: user.membership_type,
        avatarUrl: user.avatar_url,
        qrGeneratedAt: new Date(qrTimestamp).toISOString(),
        // Membership limits info
        canCheckIn: canCheckIn,
        monthlyCheckInCount: monthlyCheckInCount,
        remainingVisits: remainingVisits,
        limitMessage: limitMessage,
      },
      error: canCheckIn ? null : limitMessage,
      valid: canCheckIn,
    };
  } catch (error) {
    console.error('Error verifying QR code:', error);
    return {
      data: null,
      error: 'QR code verification failed',
      valid: false,
      status: 500,
    };
  }
}

module.exports = {
  mintQRCode,
  verifyQRCode,
};
