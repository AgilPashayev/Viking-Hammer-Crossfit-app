// services/userService.js
// User/Member service with Supabase database operations

const { supabase } = require('../supabaseClient');

/**
 * Get all users/members with optional filters
 */
async function getAllUsers(filters = {}) {
  try {
    let query = supabase
      .from('users_profile')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.role) {
      query = query.eq('role', filters.role);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return { error: 'Failed to fetch users', status: 500 };
    }

    // Remove password hashes from response
    const usersWithoutPasswords = data.map(({ password_hash, ...user }) => user);

    return { success: true, data: usersWithoutPasswords };
  } catch (error) {
    console.error('Get all users error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Get user by ID
 */
async function getUserById(userId) {
  try {
    const { data, error } = await supabase
      .from('users_profile')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return { error: 'User not found', status: 404 };
    }

    // Remove password hash
    const { password_hash, ...userWithoutPassword } = data;

    return { success: true, data: userWithoutPassword };
  } catch (error) {
    console.error('Get user by ID error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Create new user/member (without password - use authService.signUp for auth users)
 */
async function createUser(userData) {
  try {
    const {
      name,
      firstName,
      lastName,
      email,
      phone,
      role = 'member',
      dob,
      status = 'active',
      membershipType,
      company,
      joinDate,
    } = userData;

    const normalizedFirstName = firstName || (name ? name.split(' ')[0] : '');
    const normalizedLastName = lastName || (name ? name.split(' ').slice(1).join(' ') : '');
    const normalizedName = [normalizedFirstName, normalizedLastName]
      .filter((part) => part && part.trim().length > 0)
      .join(' ')
      .trim();

    if (!normalizedName) {
      return { error: 'First name or last name is required', status: 400 };
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users_profile')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return { error: 'User with this email already exists', status: 400 };
    }

    const joinDateValue = (() => {
      if (!joinDate) return new Date().toISOString().split('T')[0];
      const parsed = joinDate instanceof Date ? joinDate : new Date(joinDate);
      if (Number.isNaN(parsed.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return parsed.toISOString().split('T')[0];
    })();

    const { data: newUser, error } = await supabase
      .from('users_profile')
      .insert({
        name: normalizedName,
        email,
        phone,
        role,
        dob,
        status,
        membership_type: membershipType || 'Monthly Unlimited',
        company: company || null,
        join_date: joinDateValue,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return { error: 'Failed to create user', status: 500 };
    }

    // Auto-create invitation for new members
    if (role === 'member') {
      const invitationService = require('./invitationService');
      const invitationResult = await invitationService.createInvitation({
        userId: newUser.id,
        email: newUser.email,
        phone: newUser.phone,
        userName: newUser.name,
        deliveryMethod: 'email',
        sentBy: 'system',
      });

      if (invitationResult.error) {
        console.warn('Failed to create invitation for new member:', invitationResult.error);
        // Don't fail user creation if invitation fails
      } else {
        console.log(`✅ Invitation created and email sent to ${newUser.email}`);
      }
    }

    return { success: true, data: newUser };
  } catch (error) {
    console.error('Create user error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Update user/member
 */
async function updateUser(userId, updates) {
  try {
    // Don't allow updating password_hash directly (use authService.updatePassword)
    const { password_hash, id, created_at, ...allowedUpdates } = updates;

    const { data: existingUser, error: fetchError } = await supabase
      .from('users_profile')
      .select('name, membership_type, company, join_date, last_check_in')
      .eq('id', userId)
      .single();

    if (fetchError || !existingUser) {
      return { error: 'User not found', status: 404 };
    }

    const nameParts = existingUser.name ? existingUser.name.split(' ') : [''];
    const existingFirstName = nameParts[0] || '';
    const existingLastName = nameParts.slice(1).join(' ');

    const dbUpdates = {};

    // Handle first/last name updates
    if (allowedUpdates.name) {
      dbUpdates.name = allowedUpdates.name;
    } else if (allowedUpdates.firstName !== undefined || allowedUpdates.lastName !== undefined) {
      const newFirst =
        allowedUpdates.firstName !== undefined ? allowedUpdates.firstName : existingFirstName;
      const newLast =
        allowedUpdates.lastName !== undefined ? allowedUpdates.lastName : existingLastName;
      dbUpdates.name = `${newFirst} ${newLast}`.trim();
    }

    // Direct field mappings
    if (allowedUpdates.email !== undefined) dbUpdates.email = allowedUpdates.email;
    if (allowedUpdates.phone !== undefined) dbUpdates.phone = allowedUpdates.phone;
    if (allowedUpdates.role !== undefined) dbUpdates.role = allowedUpdates.role;
    if (allowedUpdates.status !== undefined) dbUpdates.status = allowedUpdates.status;
    if (allowedUpdates.dob !== undefined) dbUpdates.dob = allowedUpdates.dob;

    if (allowedUpdates.membershipType !== undefined) {
      dbUpdates.membership_type = allowedUpdates.membershipType;
    }

    if (allowedUpdates.company !== undefined) {
      dbUpdates.company = allowedUpdates.company;
    }

    if (allowedUpdates.joinDate !== undefined) {
      dbUpdates.join_date = allowedUpdates.joinDate;
    }

    if (allowedUpdates.lastCheckIn !== undefined) {
      dbUpdates.last_check_in = allowedUpdates.lastCheckIn;
    }

    const { data, error } = await supabase
      .from('users_profile')
      .update({ ...dbUpdates, updated_at: new Date() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return { error: 'Failed to update user', status: 500 };
    }

    // Remove password hash
    const { password_hash: _, ...userWithoutPassword } = data;

    return { success: true, data: userWithoutPassword };
  } catch (error) {
    console.error('Update user error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Delete user/member
 */
async function deleteUser(userId) {
  try {
    const { error } = await supabase.from('users_profile').delete().eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      return { error: 'Failed to delete user', status: 500 };
    }

    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    console.error('Delete user error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Get users by role
 */
async function getUsersByRole(role) {
  try {
    const { data, error } = await supabase
      .from('users_profile')
      .select('*')
      .eq('role', role)
      .eq('status', 'active')
      .order('name');

    if (error) {
      console.error('Error fetching users by role:', error);
      return { error: 'Failed to fetch users', status: 500 };
    }

    // Remove password hashes
    const usersWithoutPasswords = data.map(({ password_hash, ...user }) => user);

    return { success: true, data: usersWithoutPasswords };
  } catch (error) {
    console.error('Get users by role error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUsersByRole,
};
