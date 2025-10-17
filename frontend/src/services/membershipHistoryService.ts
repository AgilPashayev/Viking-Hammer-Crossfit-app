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
export const getUserMembershipHistory = async (userId: string): Promise<MembershipHistoryResult> => {
  try {
    // Check if demo mode (localhost detection)
    const hostname = window.location.hostname;
    const isDemoMode = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost');
    
    console.log('🔍 Membership History - Demo mode check:', { hostname, isDemoMode });
    
    if (isDemoMode) {
      // Return mock data for demo mode
      const mockHistory: MembershipRecord[] = [
        {
          id: '1',
          plan_name: 'Viking Warrior Basic',
          plan_type: 'basic',
          start_date: '2025-01-15',
          end_date: null,
          duration_months: null,
          status: 'active',
          amount: 49.99,
          currency: 'USD',
          payment_method: 'credit_card',
          payment_status: 'paid',
          renewal_type: 'monthly',
          auto_renew: true,
          next_billing_date: '2025-02-15',
          class_limit: null,
          created_at: '2025-01-15T00:00:00Z',
          cancelled_at: null,
          cancellation_reason: null
        },
        {
          id: '2',
          plan_name: 'Viking Starter',
          plan_type: 'basic',
          start_date: '2024-06-01',
          end_date: '2025-01-14',
          duration_months: 6,
          status: 'expired',
          amount: 29.99,
          currency: 'USD',
          payment_method: 'credit_card',
          payment_status: 'paid',
          renewal_type: 'monthly',
          auto_renew: false,
          next_billing_date: null,
          class_limit: 12,
          created_at: '2024-06-01T00:00:00Z',
          cancelled_at: null,
          cancellation_reason: null
        },
        {
          id: '3',
          plan_name: 'Trial Membership',
          plan_type: 'trial',
          start_date: '2024-05-15',
          end_date: '2024-05-31',
          duration_months: 1,
          status: 'completed',
          amount: 0,
          currency: 'USD',
          payment_method: 'free',
          payment_status: 'paid',
          renewal_type: 'one-time',
          auto_renew: false,
          next_billing_date: null,
          class_limit: 5,
          created_at: '2024-05-15T00:00:00Z',
          cancelled_at: null,
          cancellation_reason: null
        }
      ];

      console.log('✅ Demo mode: Returning', mockHistory.length, 'membership records');
      return {
        success: true,
        data: mockHistory
      };
    }

    // Production mode: Call Supabase RPC
    console.log('🔄 Production mode: Fetching membership history from Supabase for user:', userId);
    const { data, error } = await supabase
      .rpc('get_user_membership_history', { p_user_id: userId });

    if (error) {
      console.error('❌ Supabase RPC error:', error);
      return {
        success: false,
        error: 'Unable to retrieve membership history from database'
      };
    }

    console.log('✅ Retrieved', data?.length || 0, 'membership records from database');
    return {
      success: true,
      data: data || []
    };
  } catch (error: any) {
    console.error('❌ Exception in getUserMembershipHistory:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while loading membership history'
    };
  }
};

/**
 * Get active membership for a user
 */
export const getActiveMembership = async (userId: string): Promise<ActiveMembershipResult> => {
  try {
    // Check if demo mode (localhost detection)
    const hostname = window.location.hostname;
    const isDemoMode = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost');
    
    if (isDemoMode) {
      // Return mock active membership
      const mockActive: MembershipRecord = {
        id: '1',
        plan_name: 'Viking Warrior Basic',
        plan_type: 'basic',
        start_date: '2025-01-15',
        end_date: null,
        duration_months: null,
        status: 'active',
        amount: 49.99,
        currency: 'USD',
        payment_method: 'credit_card',
        payment_status: 'paid',
        renewal_type: 'monthly',
        auto_renew: true,
        next_billing_date: '2025-02-15',
        class_limit: null,
        created_at: '2025-01-15T00:00:00Z',
        cancelled_at: null,
        cancellation_reason: null
      };

      return {
        success: true,
        data: mockActive
      };
    }

    // Production mode
    const { data, error } = await supabase
      .rpc('get_active_membership', { p_user_id: userId });

    if (error) {
      console.error('Error fetching active membership:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data: data && data.length > 0 ? data[0] : undefined
    };
  } catch (error: any) {
    console.error('Exception in getActiveMembership:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch active membership'
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
    const { data, error } = await supabase
      .rpc('create_membership_record', {
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
        p_created_by: membershipData.createdBy
      });

    if (error) {
      console.error('Error creating membership record:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      id: data
    };
  } catch (error: any) {
    console.error('Exception in createMembershipRecord:', error);
    return {
      success: false,
      error: error.message || 'Failed to create membership record'
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
  cancellationReason?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase
      .rpc('update_membership_status', {
        p_membership_id: membershipId,
        p_status: status,
        p_cancelled_by: cancelledBy,
        p_cancellation_reason: cancellationReason
      });

    if (error) {
      console.error('Error updating membership status:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true
    };
  } catch (error: any) {
    console.error('Exception in updateMembershipStatus:', error);
    return {
      success: false,
      error: error.message || 'Failed to update membership status'
    };
  }
};

export default {
  getUserMembershipHistory,
  getActiveMembership,
  createMembershipRecord,
  updateMembershipStatus
};
