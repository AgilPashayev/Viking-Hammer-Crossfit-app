/**
 * Membership History Service
 * Handles all membership history operations with Supabase
 */

import { supabase } from './supabaseService';

export interface MembershipRecord {
  id: string;
  user_id?: string;
  plan_name: string;
  plan_type: string;
  start_date: string;
  end_date: string | null;
  duration_months: number | null;
  status: 'active' | 'expired' | 'cancelled' | 'completed' | 'pending';
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: 'paid' | 'pending' | 'failed' | 'refunded';
  renewal_type: string;
  auto_renew: boolean;
  next_billing_date: string | null;
  class_limit: number | null;
  created_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
}

export interface MembershipHistoryResult {
  success: boolean;
  data?: MembershipRecord[];
  error?: string;
}

export interface ActiveMembershipResult {
  success: boolean;
  data?: MembershipRecord;
  error?: string;
}

/**
 * Get complete membership history for a user
 */
export const getUserMembershipHistory = async (
  userId: string,
): Promise<MembershipHistoryResult> => {
  try {
    console.log('📊 Fetching membership history for user:', userId);

    // Call backend API instead of direct Supabase query
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      console.error('❌ No auth token found');
      return {
        success: false,
        error: 'Please log in to view your membership history.',
      };
    }

    const response = await fetch(`http://localhost:4001/api/subscriptions/user/${userId}/history`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ API error:', response.status, response.statusText);
      return {
        success: false,
        error: 'Unable to retrieve membership history. Please try again later.',
      };
    }

    const result = await response.json();

    if (!result.success) {
      console.error('❌ API returned error:', result.error);
      return {
        success: false,
        error: result.error || 'Unable to retrieve membership history.',
      };
    }

    if (!result.data || result.data.length === 0) {
      console.log('ℹ️ No membership history found for user');
      return {
        success: true,
        data: [],
      };
    }

    console.log('✅ Retrieved', result.data.length, 'membership records');
    return {
      success: true,
      data: result.data as MembershipRecord[],
    };
  } catch (error: any) {
    console.error('❌ Exception in getUserMembershipHistory:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please contact support if this persists.',
    };
  }
};

/**
 * Get active membership for a user
 */
export const getActiveMembership = async (userId: string): Promise<ActiveMembershipResult> => {
  try {
    console.log('Fetching active membership for user:', userId);
    const { data, error } = await supabase.rpc('get_active_membership', { p_user_id: userId });

    if (error) {
      console.error('Error fetching active membership:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data && data.length > 0 ? data[0] : undefined,
    };
  } catch (error: any) {
    console.error('Exception in getActiveMembership:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch active membership',
    };
  }
};

/**
 * Create new membership record
 */
export const createMembershipRecord = async (membershipData: {
  userId: string;
  planName: string;
  planType: string;
  startDate: string;
  endDate: string | null;
  durationMonths: number | null;
  amount: number;
  paymentMethod: string;
  renewalType: string;
  autoRenew: boolean;
  classLimit: number | null;
  createdBy?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('create_membership_record', {
      p_user_id: membershipData.userId,
      p_plan_name: membershipData.planName,
      p_plan_type: membershipData.planType,
      p_start_date: membershipData.startDate,
      p_end_date: membershipData.endDate,
      p_duration_months: membershipData.durationMonths,
      p_amount: membershipData.amount,
      p_payment_method: membershipData.paymentMethod,
      p_renewal_type: membershipData.renewalType,
      p_auto_renew: membershipData.autoRenew,
      p_class_limit: membershipData.classLimit,
      p_created_by: membershipData.createdBy,
    });

    if (error) {
      console.error('Error creating membership record:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      id: data,
    };
  } catch (error: any) {
    console.error('Exception in createMembershipRecord:', error);
    return {
      success: false,
      error: error.message || 'Failed to create membership record',
    };
  }
};

/**
 * Update membership status
 */
export const updateMembershipStatus = async (
  membershipId: string,
  status: 'active' | 'expired' | 'cancelled' | 'completed' | 'pending',
  cancelledBy?: string,
  cancellationReason?: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('update_membership_status', {
      p_membership_id: membershipId,
      p_status: status,
      p_cancelled_by: cancelledBy,
      p_cancellation_reason: cancellationReason,
    });

    if (error) {
      console.error('Error updating membership status:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Exception in updateMembershipStatus:', error);
    return {
      success: false,
      error: error.message || 'Failed to update membership status',
    };
  }
};

export default {
  getUserMembershipHistory,
  getActiveMembership,
  createMembershipRecord,
  updateMembershipStatus,
};
