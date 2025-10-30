// services/classService.js
// Class management service with Supabase database operations

const { supabase } = require('../supabaseClient');

/**
 * Get all classes
 */
async function getAllClasses(filters = {}) {
  try {
    let query = supabase
      .from('classes')
      .select(
        `
        *,
        class_instructors (
          instructor:instructors (
            id,
            first_name,
            last_name,
            email
          )
        ),
        schedule_slots (
          id,
          day_of_week,
          start_time,
          end_time,
          status,
          class_bookings (
            id,
            user_id,
            booking_date,
            booked_at,
            status,
            user:users_profile (
              id,
              name,
              email,
              status,
              phone
            )
          )
        )
      `,
      )
      .order('name');

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching classes:', error);
      return { error: 'Failed to fetch classes', status: 500 };
    }

    // Debug: Log first class structure
    if (data && data.length > 0) {
      console.log('📊 First class structure:');
      console.log('   - name:', data[0].name);
      console.log('   - class_instructors:', data[0].class_instructors);
      console.log('   - schedule_slots count:', data[0].schedule_slots?.length || 0);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Get all classes error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Get class by ID
 */
async function getClassById(classId) {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select(
        `
        *,
        class_instructors (
          instructor:instructors (
            id,
            first_name,
            last_name,
            email,
            specialties
          )
        ),
        schedule_slots (
          id,
          day_of_week,
          start_time,
          end_time,
          status,
          class_bookings (
            id,
            user_id,
            booking_date,
            booked_at,
            status,
            user:users_profile (
              id,
              name,
              email,
              status,
              phone
            )
          )
        )
      `,
      )
      .eq('id', classId)
      .single();

    if (error || !data) {
      return { error: 'Class not found', status: 404 };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Get class by ID error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Create new class
 */
async function createClass(classData) {
  try {
    console.log('=== CREATE CLASS CALLED ===');
    console.log('Received classData:', JSON.stringify(classData, null, 2));

    const {
      name,
      description,
      duration_minutes = 60,
      difficulty = 'All Levels',
      category,
      max_capacity = 20,
      equipment_needed = [],
      image_url,
      color,
      instructorIds = [],
      schedule_slots = [], // Add schedule_slots parameter
    } = classData;

    console.log('Extracted schedule_slots:', schedule_slots);

    // Create class
    const { data: newClass, error: classError } = await supabase
      .from('classes')
      .insert({
        name,
        description,
        duration_minutes,
        difficulty,
        category,
        max_capacity,
        equipment_needed,
        image_url,
        color,
        status: 'active',
      })
      .select()
      .single();

    if (classError) {
      console.error('Error creating class:', classError);
      return { error: 'Failed to create class', status: 500 };
    }

    // Add instructors to class
    if (instructorIds.length > 0) {
      const classInstructorRecords = instructorIds.map((instructorId, index) => ({
        class_id: newClass.id,
        instructor_id: instructorId,
        is_primary: index === 0,
      }));

      const { error: linkError } = await supabase
        .from('class_instructors')
        .insert(classInstructorRecords);

      if (linkError) {
        console.warn('Warning: Failed to link instructors:', linkError);
      }
    }

    // Create schedule slots for the class
    if (schedule_slots.length > 0) {
      console.log(`Creating ${schedule_slots.length} schedule slots for class ${newClass.id}`);
      const scheduleRecords = schedule_slots.map((slot) => ({
        class_id: newClass.id,
        instructor_id: instructorIds[0] || null, // Assign primary instructor if available
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        status: slot.status || 'active',
      }));

      console.log('Schedule records to insert:', JSON.stringify(scheduleRecords, null, 2));

      const { error: scheduleError } = await supabase
        .from('schedule_slots')
        .insert(scheduleRecords);

      if (scheduleError) {
        console.error('ERROR: Failed to create schedule slots:', scheduleError);
      } else {
        console.log('✅ Successfully created schedule slots');
      }
    } else {
      console.log('⚠️ No schedule_slots provided, skipping schedule creation');
    }

    return { success: true, data: newClass };
  } catch (error) {
    console.error('Create class error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Update class
 */
async function updateClass(classId, updates) {
  try {
    const { instructorIds, schedule_slots, id, created_at, updated_at, ...allowedUpdates } =
      updates;

    const { data, error } = await supabase
      .from('classes')
      .update({ ...allowedUpdates, updated_at: new Date() })
      .eq('id', classId)
      .select()
      .single();

    if (error) {
      console.error('Error updating class:', error);
      return { error: 'Failed to update class', status: 500 };
    }

    // Update instructors if provided
    if (instructorIds) {
      // Delete existing links
      await supabase.from('class_instructors').delete().eq('class_id', classId);

      // Create new links
      if (instructorIds.length > 0) {
        const classInstructorRecords = instructorIds.map((instructorId, index) => ({
          class_id: classId,
          instructor_id: instructorId,
          is_primary: index === 0,
        }));

        await supabase.from('class_instructors').insert(classInstructorRecords);
      }
    }

    // Update schedule slots if provided
    if (schedule_slots !== undefined) {
      // Delete existing schedule slots for this class
      await supabase.from('schedule_slots').delete().eq('class_id', classId);

      // Create new schedule slots
      if (schedule_slots.length > 0) {
        const scheduleRecords = schedule_slots.map((slot) => ({
          class_id: classId,
          instructor_id: instructorIds?.[0] || null, // Assign primary instructor if available
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          status: slot.status || 'active',
        }));

        const { error: scheduleError } = await supabase
          .from('schedule_slots')
          .insert(scheduleRecords);

        if (scheduleError) {
          console.warn('Warning: Failed to update schedule slots:', scheduleError);
        }
      }
    }

    return { success: true, data };
  } catch (error) {
    console.error('Update class error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Delete class
 */
async function deleteClass(classId) {
  try {
    // Check if class has active schedule slots
    const { data: activeSlots } = await supabase
      .from('schedule_slots')
      .select('id')
      .eq('class_id', classId)
      .eq('status', 'active')
      .limit(1);

    if (activeSlots && activeSlots.length > 0) {
      return {
        error: 'Cannot delete class with active schedule slots. Cancel or remove slots first.',
        status: 400,
      };
    }

    const { error } = await supabase.from('classes').delete().eq('id', classId);

    if (error) {
      console.error('Error deleting class:', error);
      return { error: 'Failed to delete class', status: 500 };
    }

    return { success: true, message: 'Class deleted successfully' };
  } catch (error) {
    console.error('Delete class error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
};
