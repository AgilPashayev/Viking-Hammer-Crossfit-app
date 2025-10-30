// services/planService.js
// Complete Plan Management Service for Viking Hammer Gym
// Handles CRUD operations for membership plans

const { supabase } = require('../supabaseClient');

/**
 * Get all membership plans
 * @returns {Promise<{plans: Array, error: string|null}>}
 */
async function getAllPlans() {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching plans:', error);
      return { plans: [], error: error.message };
    }

    // Transform database format to API format
    const formattedPlans = data.map((plan) => transformPlanToAPI(plan));

    console.log(`✅ Fetched ${formattedPlans.length} plans from database`);
    return { plans: formattedPlans, error: null };
  } catch (error) {
    console.error('Unexpected error in getAllPlans:', error);
    return { plans: [], error: error.message };
  }
}

/**
 * Get a single plan by ID
 * @param {number} planId - Plan ID
 * @returns {Promise<{plan: Object|null, error: string|null}>}
 */
async function getPlanById(planId) {
  try {
    const { data, error } = await supabase.from('plans').select('*').eq('id', planId).single();

    if (error) {
      console.error('Error fetching plan:', error);
      return { plan: null, error: error.message };
    }

    const formattedPlan = transformPlanToAPI(data);
    return { plan: formattedPlan, error: null };
  } catch (error) {
    console.error('Unexpected error in getPlanById:', error);
    return { plan: null, error: error.message };
  }
}

/**
 * Create a new membership plan
 * @param {Object} planData - Plan data from request body
 * @returns {Promise<{plan: Object|null, error: string|null}>}
 */
async function createPlan(planData) {
  try {
    // Validate required fields
    if (!planData.name || !planData.price) {
      return { plan: null, error: 'Plan name and price are required' };
    }

    // Generate unique SKU
    const sku = `plan_${planData.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;

    // Convert price to cents
    const priceCents = Math.round(parseFloat(planData.price) * 100);

    // Parse duration (e.g., "30 days" -> 30)
    const durationDays = parseDuration(planData.duration);

    // Prepare metadata object
    const metadata = {
      type: planData.type || 'single',
      currency: planData.currency || 'AZN',
      description: planData.description || planData.name,
      features: Array.isArray(planData.features) ? planData.features : [],
      limitations: Array.isArray(planData.limitations) ? planData.limitations : [],
      isActive: planData.isActive !== undefined ? planData.isActive : true,
      isPopular: planData.isPopular || false,
      discountPercentage: planData.discountPercentage || 0,
    };

    // Prepare database record
    const dbPlan = {
      sku,
      name: planData.name.trim(),
      price_cents: priceCents,
      duration_days: durationDays,
      visit_quota: planData.entryLimit || null,
      metadata, // This will only work after migration adds the column
    };

    console.log('Creating plan in database:', { name: dbPlan.name, sku: dbPlan.sku });

    const { data, error } = await supabase.from('plans').insert([dbPlan]).select().single();

    if (error) {
      console.error('Error creating plan:', error);
      // If metadata column doesn't exist yet, retry without metadata
      if (error.message.includes('metadata') || error.code === '42703') {
        console.warn('⚠️  metadata column not found, creating plan without metadata');
        const { metadata: _, ...planWithoutMetadata } = dbPlan;
        const { data: retryData, error: retryError } = await supabase
          .from('plans')
          .insert([planWithoutMetadata])
          .select()
          .single();

        if (retryError) {
          return { plan: null, error: retryError.message };
        }

        console.log('✅ Plan created (without metadata):', retryData.id);
        // Store metadata in a separate table or return warning
        return {
          plan: transformPlanToAPI(retryData, metadata),
          error: null,
          warning: 'Plan created but metadata not stored. Please run database migration.',
        };
      }
      return { plan: null, error: error.message };
    }

    console.log('✅ Plan created successfully:', data.id);
    const formattedPlan = transformPlanToAPI(data);
    return { plan: formattedPlan, error: null };
  } catch (error) {
    console.error('Unexpected error in createPlan:', error);
    return { plan: null, error: error.message };
  }
}

/**
 * Update an existing membership plan
 * @param {number} planId - Plan ID to update
 * @param {Object} planData - Updated plan data
 * @returns {Promise<{plan: Object|null, error: string|null}>}
 */
async function updatePlan(planId, planData) {
  try {
    // Fetch existing plan
    const { data: existingPlan, error: fetchError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (fetchError || !existingPlan) {
      return { plan: null, error: 'Plan not found' };
    }

    // Prepare update object (only include provided fields)
    const updates = {};

    if (planData.name !== undefined) {
      updates.name = planData.name.trim();
    }

    if (planData.price !== undefined) {
      updates.price_cents = Math.round(parseFloat(planData.price) * 100);
    }

    if (planData.duration !== undefined) {
      updates.duration_days = parseDuration(planData.duration);
    }

    if (planData.entryLimit !== undefined) {
      updates.visit_quota = planData.entryLimit || null;
    }

    // Update metadata if any metadata fields are provided
    const metadataUpdates = {};
    let hasMetadataUpdates = false;

    if (planData.type !== undefined) {
      metadataUpdates.type = planData.type;
      hasMetadataUpdates = true;
    }
    if (planData.currency !== undefined) {
      metadataUpdates.currency = planData.currency;
      hasMetadataUpdates = true;
    }
    if (planData.description !== undefined) {
      metadataUpdates.description = planData.description;
      hasMetadataUpdates = true;
    }
    if (planData.features !== undefined) {
      metadataUpdates.features = Array.isArray(planData.features) ? planData.features : [];
      hasMetadataUpdates = true;
    }
    if (planData.limitations !== undefined) {
      metadataUpdates.limitations = Array.isArray(planData.limitations) ? planData.limitations : [];
      hasMetadataUpdates = true;
    }
    if (planData.isActive !== undefined) {
      metadataUpdates.isActive = planData.isActive;
      hasMetadataUpdates = true;
    }
    if (planData.isPopular !== undefined) {
      metadataUpdates.isPopular = planData.isPopular;
      hasMetadataUpdates = true;
    }
    if (planData.discountPercentage !== undefined) {
      metadataUpdates.discountPercentage = planData.discountPercentage;
      hasMetadataUpdates = true;
    }

    if (hasMetadataUpdates) {
      // Merge with existing metadata
      const currentMetadata = existingPlan.metadata || {};
      updates.metadata = { ...currentMetadata, ...metadataUpdates };
    }

    // Perform update
    console.log('Updating plan:', planId, 'with updates:', Object.keys(updates));

    const { data, error } = await supabase
      .from('plans')
      .update(updates)
      .eq('id', planId)
      .select()
      .single();

    if (error) {
      console.error('Error updating plan:', error);
      // If metadata column doesn't exist, retry without metadata
      if (error.message.includes('metadata') || error.code === '42703') {
        console.warn('⚠️  metadata column not found, updating plan without metadata');
        const { metadata: _, ...updatesWithoutMetadata } = updates;
        if (Object.keys(updatesWithoutMetadata).length === 0) {
          return {
            plan: null,
            error: 'No basic fields to update. Metadata updates require database migration.',
          };
        }
        const { data: retryData, error: retryError } = await supabase
          .from('plans')
          .update(updatesWithoutMetadata)
          .eq('id', planId)
          .select()
          .single();

        if (retryError) {
          return { plan: null, error: retryError.message };
        }

        console.log('✅ Plan updated (without metadata):', retryData.id);
        return {
          plan: transformPlanToAPI(retryData, updates.metadata),
          error: null,
          warning: 'Plan updated but metadata not stored. Please run database migration.',
        };
      }
      return { plan: null, error: error.message };
    }

    console.log('✅ Plan updated successfully:', data.id);
    const formattedPlan = transformPlanToAPI(data);
    return { plan: formattedPlan, error: null };
  } catch (error) {
    console.error('Unexpected error in updatePlan:', error);
    return { plan: null, error: error.message };
  }
}

/**
 * Delete a membership plan
 * @param {number} planId - Plan ID to delete
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function deletePlan(planId) {
  try {
    // Check if plan has any active subscriptions
    const { data: memberships, error: checkError } = await supabase
      .from('memberships')
      .select('id')
      .eq('plan_id', planId)
      .eq('status', 'active');

    if (checkError) {
      console.error('Error checking memberships:', checkError);
      return { success: false, error: checkError.message };
    }

    if (memberships && memberships.length > 0) {
      return {
        success: false,
        error: `Cannot delete plan: ${memberships.length} active subscription(s) are using this plan`,
      };
    }

    // Delete the plan
    const { error } = await supabase.from('plans').delete().eq('id', planId);

    if (error) {
      console.error('Error deleting plan:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Plan deleted successfully:', planId);
    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error in deletePlan:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Helper: Transform database plan to API format
 * @param {Object} dbPlan - Plan from database
 * @param {Object} fallbackMetadata - Fallback metadata if column doesn't exist
 * @returns {Object} - Formatted plan for API response
 */
function transformPlanToAPI(dbPlan, fallbackMetadata = null) {
  const metadata = dbPlan.metadata || fallbackMetadata || generateDefaultMetadata(dbPlan);

  return {
    id: dbPlan.id.toString(),
    sku: dbPlan.sku,
    name: dbPlan.name,
    type: metadata.type || 'single',
    price: dbPlan.price_cents / 100,
    currency: metadata.currency || 'AZN',
    description: metadata.description || dbPlan.name,
    features: metadata.features || [],
    limitations: metadata.limitations || [],
    duration: `${dbPlan.duration_days} days`,
    durationDays: dbPlan.duration_days,
    entryLimit: dbPlan.visit_quota,
    isActive: metadata.isActive !== undefined ? metadata.isActive : true,
    isPopular: metadata.isPopular || false,
    discountPercentage: metadata.discountPercentage || 0,
    createdAt: dbPlan.created_at,
  };
}

/**
 * Helper: Generate default metadata from plan name (fallback for when metadata column doesn't exist)
 * @param {Object} dbPlan - Plan from database
 * @returns {Object} - Generated metadata
 */
function generateDefaultMetadata(dbPlan) {
  const name = dbPlan.name.toLowerCase();
  let type = 'single';
  let description = dbPlan.name;
  let features = [];
  let limitations = [];

  if (name.includes('single') || name.includes('day pass')) {
    type = 'single';
    description = 'Single gym visit - pay as you go';
    features = ['One-time gym access', 'Access to all equipment', 'Valid for one day'];
    limitations = ['Single entry only', 'No rollover', 'Non-refundable'];
  } else if (name.includes('unlimited')) {
    type = 'monthly-unlimited';
    description = 'Unlimited monthly access';
    features = [
      'Unlimited gym visits',
      'Access to all classes',
      'Locker privileges',
      'Guest privileges (2/month)',
    ];
    limitations = ['Monthly commitment', 'Auto-renews'];
  } else if (dbPlan.visit_quota && dbPlan.visit_quota > 0) {
    type = 'monthly-limited';
    description = `Limited monthly plan - ${dbPlan.visit_quota} visits`;
    features = [
      `${dbPlan.visit_quota} gym visits per month`,
      'Flexible schedule',
      'Access to all equipment',
    ];
    limitations = ['Visit quota applies', 'No rollover of unused visits'];
  } else if (name.includes('company') || name.includes('corporate')) {
    type = 'company';
    description = 'Corporate/Company membership';
    features = ['Group membership', 'Corporate discount', 'Flexible team access'];
    limitations = ['Requires company contract'];
  }

  return {
    type,
    currency: 'AZN',
    description,
    features,
    limitations,
    isActive: true,
    isPopular: false,
    discountPercentage: 0,
  };
}

/**
 * Helper: Parse duration string to days
 * @param {string} duration - Duration string (e.g., "30 days", "1 month", "90")
 * @returns {number} - Duration in days
 */
function parseDuration(duration) {
  if (!duration) return 30; // Default to 30 days

  const durationStr = duration.toString().toLowerCase().trim();

  // Try to extract number
  const match = durationStr.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1]);

    // Check for months
    if (durationStr.includes('month')) {
      return num * 30;
    }

    // Check for weeks
    if (durationStr.includes('week')) {
      return num * 7;
    }

    // Check for years
    if (durationStr.includes('year')) {
      return num * 365;
    }

    // Default: assume days
    return num;
  }

  return 30; // Fallback default
}

module.exports = {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
};
