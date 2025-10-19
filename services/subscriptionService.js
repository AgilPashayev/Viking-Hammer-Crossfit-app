// services/subscriptionService.js
// Complete Subscription Management Service for Viking Hammer Gym

const { supabase } = require('../supabaseClient');

/**
 * Get all subscriptions with member and plan details
 * @returns {Promise<{subscriptions: Array, error: string|null}>}
 */
async function getAllSubscriptions() {
  try {
    const { data, error } = await supabase
      .from('memberships')
      .select(
        `
        id,
        user_id,
        plan_id,
        start_date,
        end_date,
        remaining_visits,
        status,
        notes,
        created_at,
        users_profile:user_id (
          id,
          name,
          email,
          phone
        ),
        plans:plan_id (
          id,
          name,
          price_cents,
          duration_days,
          visit_quota
        )
      `,
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return { subscriptions: [], error: error.message };
    }

    // Transform to match UI expectations
    const subscriptions = data.map((membership) => ({
      id: membership.id.toString(),
      memberId: membership.user_id,
      memberName: membership.users_profile?.name || 'Unknown',
      memberEmail: membership.users_profile?.email || 'N/A',
      memberPhone: membership.users_profile?.phone || '',
      planId: membership.plan_id?.toString() || '',
      planName: membership.plans?.name || 'Unknown Plan',
      planPrice: membership.plans?.price_cents ? membership.plans.price_cents / 100 : 0,
      startDate: membership.start_date,
      endDate: membership.end_date,
      status: membership.status || 'active',
      remainingEntries: membership.remaining_visits,
      totalEntries: membership.plans?.visit_quota,
      paymentStatus: determinePaymentStatus(membership),
      nextPaymentDate: calculateNextPaymentDate(membership),
      createdAt: membership.created_at,
    }));

    return { subscriptions, error: null };
  } catch (error) {
    console.error('Unexpected error in getAllSubscriptions:', error);
    return { subscriptions: [], error: error.message };
  }
}

/**
 * Get subscription by ID
 * @param {number} subscriptionId
 * @returns {Promise<{subscription: Object|null, error: string|null}>}
 */
async function getSubscriptionById(subscriptionId) {
  try {
    const { data, error } = await supabase
      .from('memberships')
      .select(
        `
        *,
        users_profile:user_id (id, name, email, phone),
        plans:plan_id (id, name, price_cents, duration_days, visit_quota)
      `,
      )
      .eq('id', subscriptionId)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return { subscription: null, error: error.message };
    }

    return { subscription: data, error: null };
  } catch (error) {
    console.error('Unexpected error in getSubscriptionById:', error);
    return { subscription: null, error: error.message };
  }
}

/**
 * Update subscription (edit)
 * @param {number} subscriptionId
 * @param {Object} updateData - Fields to update
 * @returns {Promise<{subscription: Object|null, error: string|null}>}
 */
async function updateSubscription(subscriptionId, updateData) {
  try {
    const allowedFields = ['start_date', 'end_date', 'remaining_visits', 'status', 'notes'];
    const filteredData = {};

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    const { data, error } = await supabase
      .from('memberships')
      .update(filteredData)
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating subscription:', error);
      return { subscription: null, error: error.message };
    }

    console.log(`✅ Subscription ${subscriptionId} updated successfully`);
    return { subscription: data, error: null };
  } catch (error) {
    console.error('Unexpected error in updateSubscription:', error);
    return { subscription: null, error: error.message };
  }
}

/**
 * Suspend a subscription
 * @param {number} subscriptionId
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function suspendSubscription(subscriptionId) {
  try {
    const { data, error } = await supabase
      .from('memberships')
      .update({
        status: 'suspended',
        notes: `Suspended on ${new Date().toISOString()}`,
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      console.error('Error suspending subscription:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Subscription ${subscriptionId} suspended successfully`);
    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error in suspendSubscription:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reactivate a suspended subscription
 * @param {number} subscriptionId
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function reactivateSubscription(subscriptionId) {
  try {
    const { data, error } = await supabase
      .from('memberships')
      .update({
        status: 'active',
        notes: `Reactivated on ${new Date().toISOString()}`,
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      console.error('Error reactivating subscription:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Subscription ${subscriptionId} reactivated successfully`);
    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error in reactivateSubscription:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cancel/Delete a subscription
 * @param {number} subscriptionId
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function cancelSubscription(subscriptionId) {
  try {
    // Soft delete - mark as inactive rather than deleting
    const { data, error } = await supabase
      .from('memberships')
      .update({
        status: 'inactive',
        end_date: new Date().toISOString().split('T')[0],
        notes: `Cancelled on ${new Date().toISOString()}`,
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Subscription ${subscriptionId} cancelled successfully`);
    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error in cancelSubscription:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Renew a subscription
 * @param {number} subscriptionId
 * @param {Object} renewalData - New start/end dates
 * @returns {Promise<{subscription: Object|null, error: string|null}>}
 */
async function renewSubscription(subscriptionId, renewalData = {}) {
  try {
    // Get current subscription to determine renewal period
    const { subscription, error: fetchError } = await getSubscriptionById(subscriptionId);

    if (fetchError || !subscription) {
      return { subscription: null, error: fetchError || 'Subscription not found' };
    }

    const plan = subscription.plans;
    const today = new Date();
    const startDate = renewalData.startDate || today.toISOString().split('T')[0];

    // Calculate end date based on plan duration
    const endDate =
      renewalData.endDate ||
      (() => {
        const end = new Date(startDate);
        end.setDate(end.getDate() + (plan?.duration_days || 30));
        return end.toISOString().split('T')[0];
      })();

    const updateData = {
      status: 'active',
      start_date: startDate,
      end_date: endDate,
      remaining_visits: plan?.visit_quota || null,
      notes: `Renewed on ${new Date().toISOString()}`,
    };

    const { data, error } = await supabase
      .from('memberships')
      .update(updateData)
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      console.error('Error renewing subscription:', error);
      return { subscription: null, error: error.message };
    }

    console.log(`✅ Subscription ${subscriptionId} renewed successfully`);
    return { subscription: data, error: null };
  } catch (error) {
    console.error('Unexpected error in renewSubscription:', error);
    return { subscription: null, error: error.message };
  }
}

/**
 * Get subscriptions by user ID
 * @param {string} userId
 * @returns {Promise<{subscriptions: Array, error: string|null}>}
 */
async function getSubscriptionsByUserId(userId) {
  try {
    const { data, error } = await supabase
      .from('memberships')
      .select(
        `
        *,
        plans:plan_id (id, name, price_cents, duration_days, visit_quota)
      `,
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user subscriptions:', error);
      return { subscriptions: [], error: error.message };
    }

    return { subscriptions: data, error: null };
  } catch (error) {
    console.error('Unexpected error in getSubscriptionsByUserId:', error);
    return { subscriptions: [], error: error.message };
  }
}

// Helper function to determine payment status
function determinePaymentStatus(membership) {
  if (!membership.end_date) return 'paid';

  const today = new Date();
  const endDate = new Date(membership.end_date);

  // If expired and still marked as active, it's overdue
  if (endDate < today && membership.status === 'active') {
    return 'overdue';
  }

  // If within 7 days of expiry, mark as pending
  const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
    return 'pending';
  }

  return 'paid';
}

// Helper function to calculate next payment date
function calculateNextPaymentDate(membership) {
  if (!membership.end_date) return null;

  const endDate = new Date(membership.end_date);
  const today = new Date();

  // If already expired, next payment is overdue
  if (endDate < today) {
    return membership.end_date;
  }

  // Next payment is the end date
  return membership.end_date;
}

module.exports = {
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscription,
  suspendSubscription,
  reactivateSubscription,
  cancelSubscription,
  renewSubscription,
  getSubscriptionsByUserId,
};
