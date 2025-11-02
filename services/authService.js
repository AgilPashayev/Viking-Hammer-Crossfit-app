// services/authService.js
// Authentication service with bcrypt password hashing and Supabase integration

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabase } = require('../supabaseClient');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'viking-hammer-secret-key-change-in-production';

/**
 * Transform user data for frontend compatibility
 * Parses name into firstName/lastName and maps database fields
 */
function transformUserForFrontend(user) {
  if (!user) return user;

  // Parse name into firstName and lastName
  if (user.name && !user.firstName && !user.lastName) {
    const nameParts = user.name.trim().split(' ');
    user.firstName = nameParts[0] || '';
    user.lastName = nameParts.slice(1).join(' ') || '';
  }

  // Map database fields to frontend-expected fields
  if (user.dob && !user.dateOfBirth) {
    user.dateOfBirth = user.dob;
  }
  if (user.membership_type && !user.membershipType) {
    user.membershipType = user.membership_type;
  }
  if (user.join_date && !user.joinDate) {
    user.joinDate = user.join_date;
  }
  if (user.emergency_contact_name && !user.emergencyContactName) {
    user.emergencyContactName = user.emergency_contact_name;
  }
  if (user.emergency_contact_phone && !user.emergencyContactPhone) {
    user.emergencyContactPhone = user.emergency_contact_phone;
  }
  if (user.emergency_contact_country_code && !user.emergencyContactCountryCode) {
    user.emergencyContactCountryCode = user.emergency_contact_country_code;
  }

  return user;
}

async function signUp(userData) {
  try {
    const { email, password, firstName, lastName, phone, role = 'member', dateOfBirth } = userData;

    // Check if user already exists (might be in pending state from invitation)
    const { data: existingUser } = await supabase
      .from('users_profile')
      .select('*')
      .eq('email', email)
      .single();

    let newUser;

    if (existingUser) {
      // User exists (likely from invitation) - update with password and activate
      if (existingUser.password_hash) {
        return { error: 'User with this email already exists and is registered', status: 400 };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Build update object - ONLY update password and status for existing profiles
      const updateData = {
        password_hash: passwordHash,
        status: 'active', // Activate on registration
        updated_at: new Date(),
      };

      // Only update name/phone/dob if they were provided AND user doesn't have them yet
      // This preserves admin-created member data
      if (firstName && lastName && !existingUser.name) {
        updateData.name = `${firstName} ${lastName}`;
      }
      if (phone && !existingUser.phone) {
        updateData.phone = phone;
      }
      if (dateOfBirth && !existingUser.dob) {
        updateData.dob = dateOfBirth;
      }

      // Update existing user with password and set to active
      const { data: updatedUser, error: updateError } = await supabase
        .from('users_profile')
        .update(updateData)
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('Database error during user activation:', updateError);
        return { error: 'Failed to activate user', status: 500 };
      }

      newUser = updatedUser;
      console.log(`✅ User activated: ${email} (was pending) - preserved existing profile data`);
    } else {
      // New user - create from scratch (for non-invitation flow)
      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user in database
      const { data: createdUser, error: dbError } = await supabase
        .from('users_profile')
        .insert({
          email,
          password_hash: passwordHash,
          name: `${firstName} ${lastName}`,
          role,
          phone: phone || null,
          dob: dateOfBirth || null,
          status: 'active',
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error during signup:', dbError);
        return { error: 'Failed to create user', status: 500 };
      }

      newUser = createdUser;
      console.log(`✅ New user created: ${email}`);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    // Return user data without password hash
    const { password_hash, ...userWithoutPassword } = newUser;

    return {
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
    };
  } catch (error) {
    console.error('Sign up error:', error);
    return { error: 'Internal server error during sign up', status: 500 };
  }
}

/**
 * Sign in user with email and password
 */
async function signIn(email, password) {
  try {
    // Find user by email
    const { data: user, error: dbError } = await supabase
      .from('users_profile')
      .select('*')
      .eq('email', email)
      .single();

    if (dbError || !user) {
      return { error: 'Invalid email or password', status: 401 };
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return { error: 'Invalid email or password', status: 401 };
    }

    // Check if user is active
    if (user.status !== 'active') {
      return { error: 'Account is not active', status: 403 };
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Return user data without password hash
    const { password_hash, ...userWithoutPassword } = user;

    // Transform user data for frontend compatibility
    const transformedUser = transformUserForFrontend(userWithoutPassword);

    return {
      success: true,
      data: {
        user: transformedUser,
        token,
      },
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return { error: 'Internal server error during sign in', status: 500 };
  }
}

/**
 * Verify JWT token and return user data
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { success: true, data: decoded };
  } catch (error) {
    return { error: 'Invalid or expired token', status: 401 };
  }
}

/**
 * Update user password (requires old password verification)
 */
async function updatePassword(userId, oldPassword, newPassword) {
  try {
    // Get user with password hash
    const { data: user, error: dbError } = await supabase
      .from('users_profile')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (dbError || !user) {
      return { error: 'User not found', status: 404 };
    }

    // Verify old password
    const passwordMatch = await bcrypt.compare(oldPassword, user.password_hash);

    if (!passwordMatch) {
      return { error: 'Current password is incorrect', status: 401 };
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    const { error: updateError } = await supabase
      .from('users_profile')
      .update({ password_hash: newPasswordHash, updated_at: new Date() })
      .eq('id', userId);

    if (updateError) {
      return { error: 'Failed to update password', status: 500 };
    }

    return { success: true, message: 'Password updated successfully' };
  } catch (error) {
    console.error('Update password error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Reset user password without old password (for password reset flow)
 * @param {string} userId - User ID
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Reset result
 */
async function resetUserPassword(userId, newPassword) {
  try {
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    const { data, error: updateError } = await supabase
      .from('users_profile')
      .update({ password_hash: newPasswordHash, updated_at: new Date() })
      .eq('id', userId)
      .select('id, email, name, role')
      .single();

    if (updateError) {
      console.error('❌ Failed to reset password:', updateError);
      return { error: 'Failed to reset password', status: 500 };
    }

    console.log(`✅ Password reset for user ${userId}`);

    return {
      success: true,
      message: 'Password reset successfully',
      data: {
        userId: data.id,
        email: data.email,
        name: data.name,
      },
    };
  } catch (error) {
    console.error('❌ Reset password error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

module.exports = {
  signUp,
  signIn,
  verifyToken,
  updatePassword,
  resetUserPassword,
};
