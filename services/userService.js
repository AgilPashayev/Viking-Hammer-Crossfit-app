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
    const { name, email, phone, role = 'member', dob, status = 'active' } = userData;

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users_profile')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return { error: 'User with this email already exists', status: 400 };
    }

    const { data: newUser, error } = await supabase
      .from('users_profile')
      .insert({
        name,
        email,
        phone,
        role,
        dob,
        status,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return { error: 'Failed to create user', status: 500 };
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

    const { data, error } = await supabase
      .from('users_profile')
      .update({ ...allowedUpdates, updated_at: new Date() })
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
