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
      .select('id, name, membership_status')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return { data: null, error: 'User not found', status: 404 };
    }

    // Check membership status
    if (user.membership_status !== 'active') {
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
 * Verify QR code and extract user information
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

    // Verify user exists and has active membership
    const { data: user, error: userError } = await supabase
      .from('users_profile')
      .select('id, name, email, membership_status, membership_type')
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

    if (user.membership_status !== 'active') {
      return {
        data: { ...user, reason: 'inactive_membership' },
        error: 'Membership is not active',
        valid: false,
        status: 403,
      };
    }

    const [firstName, ...lastParts] = (user.name || '').trim().split(' ');
    const lastName = lastParts.join(' ');

    return {
      data: {
        userId: user.id,
        firstName: firstName || user.name || 'Member',
        lastName: lastName || '',
        email: user.email,
        membershipStatus: user.membership_status,
        membershipType: user.membership_type,
        qrGeneratedAt: new Date(qrTimestamp).toISOString(),
      },
      error: null,
      valid: true,
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
