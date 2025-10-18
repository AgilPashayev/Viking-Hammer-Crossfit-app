// services/instructorService.js
// Instructor management service with Supabase database operations

const { supabase } = require('../supabaseClient');

/**
 * Get all instructors
 */
async function getAllInstructors(filters = {}) {
  try {
    let query = supabase.from('instructors').select('*').order('last_name');

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching instructors:', error);
      return { error: 'Failed to fetch instructors', status: 500 };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Get all instructors error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Get instructor by ID
 */
async function getInstructorById(instructorId) {
  try {
    const { data, error } = await supabase
      .from('instructors')
      .select(
        `
        *,
        class_instructors (
          class:classes (
            id,
            name,
            difficulty
          )
        )
      `,
      )
      .eq('id', instructorId)
      .single();

    if (error || !data) {
      return { error: 'Instructor not found', status: 404 };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Get instructor by ID error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Create new instructor
 */
async function createInstructor(instructorData) {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      specialties = [],
      certifications = [],
      bio,
      years_experience = 0,
      avatar_url,
      availability = {},
      status = 'active',
    } = instructorData;

    // Check if email already exists
    if (email) {
      const { data: existingInstructor } = await supabase
        .from('instructors')
        .select('email')
        .eq('email', email)
        .single();

      if (existingInstructor) {
        return { error: 'Instructor with this email already exists', status: 400 };
      }
    }

    const { data: newInstructor, error } = await supabase
      .from('instructors')
      .insert({
        first_name,
        last_name,
        email,
        phone,
        specialties,
        certifications,
        bio,
        years_experience,
        avatar_url,
        availability,
        status,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating instructor:', error);
      return { error: 'Failed to create instructor', status: 500 };
    }

    return { success: true, data: newInstructor };
  } catch (error) {
    console.error('Create instructor error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Update instructor
 */
async function updateInstructor(instructorId, updates) {
  try {
    const { id, created_at, updated_at, ...allowedUpdates } = updates;

    const { data, error } = await supabase
      .from('instructors')
      .update({ ...allowedUpdates, updated_at: new Date() })
      .eq('id', instructorId)
      .select()
      .single();

    if (error) {
      console.error('Error updating instructor:', error);
      return { error: 'Failed to update instructor', status: 500 };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Update instructor error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Delete instructor
 */
async function deleteInstructor(instructorId) {
  try {
    // Check if instructor has active schedule slots
    const { data: activeSlots } = await supabase
      .from('schedule_slots')
      .select('id')
      .eq('instructor_id', instructorId)
      .eq('status', 'active')
      .limit(1);

    if (activeSlots && activeSlots.length > 0) {
      return {
        error:
          'Cannot delete instructor with active schedule assignments. Reassign or remove slots first.',
        status: 400,
      };
    }

    const { error } = await supabase.from('instructors').delete().eq('id', instructorId);

    if (error) {
      console.error('Error deleting instructor:', error);
      return { error: 'Failed to delete instructor', status: 500 };
    }

    return { success: true, message: 'Instructor deleted successfully' };
  } catch (error) {
    console.error('Delete instructor error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

module.exports = {
  getAllInstructors,
  getInstructorById,
  createInstructor,
  updateInstructor,
  deleteInstructor,
};
