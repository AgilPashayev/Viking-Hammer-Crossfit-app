import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { showConfirmDialog } from '../utils/confirmDialog';
import './MembershipManager.css';
import './MembershipManager-additions.css';

interface MembershipPlan {
  id: string;
  name: string;
  type: 'single' | 'monthly-limited' | 'monthly-unlimited' | 'company';
  price: number;
  currency: string;
  description: string;
  features: string[];
  limitations: string[];
  duration?: string;
  entryLimit?: number;
  isActive: boolean;
  isPopular?: boolean;
  companyName?: string;
  discountPercentage?: number;
  createdAt: string;
  updatedAt: string;
}

interface Subscription {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  planId: string;
  planName: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'inactive' | 'suspended' | 'expired';
  remainingEntries?: number;
  totalEntries?: number;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  nextPaymentDate?: string;
  companyName?: string;
}

interface Company {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  discountPercentage: number;
  employeeCount: number;
  activeSubscriptions: number;
  contractStartDate: string;
  contractEndDate: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
}

interface MembershipManagerProps {
  onBack: () => void;
}

const MembershipManager: React.FC<MembershipManagerProps> = ({ onBack }) => {
  const { setPlansCount, updateMembershipTypes } = useData();
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions' | 'companies'>('plans');
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [showEditSubscriptionModal, setShowEditSubscriptionModal] = useState(false);
  const [showAddSubscriptionModal, setShowAddSubscriptionModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editingSubscriptionId, setEditingSubscriptionId] = useState<string | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<Partial<Subscription>>({});

  // New plan form state
  const [newPlan, setNewPlan] = useState<Partial<MembershipPlan>>({
    name: '',
    type: 'single',
    price: 0,
    currency: 'AZN',
    description: '',
    features: [],
    limitations: [],
    duration: '',
    entryLimit: undefined,
    isActive: true,
    isPopular: false,
    discountPercentage: 0,
  });

  // New company form state
  const [newCompany, setNewCompany] = useState<Partial<Company>>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    discountPercentage: 10,
    employeeCount: 0,
    status: 'pending',
  });

  useEffect(() => {
    loadPlansFromDatabase();
    loadSubscriptionsFromDatabase(); // Load real subscriptions from database
    // Companies will be loaded from database when needed - no mock data
  }, []);

  // Helper function to generate metadata from plan fields (no database metadata column needed)
  // Load plans from backend API (replaced direct Supabase access)
  const loadPlansFromDatabase = async () => {
    try {
      const response = await fetch('http://localhost:4001/api/plans');
      const result = await response.json();

      if (!result.success || !result.data) {
        console.error('Failed to load plans from backend:', result.error);
        // Fallback to localStorage
        const savedPlans = localStorage.getItem('viking-membership-plans');
        if (savedPlans) {
          try {
            const parsed = JSON.parse(savedPlans);
            setMembershipPlans(parsed);
          } catch (e) {
            console.error('Failed to parse saved plans:', e);
          }
        }
        return;
      }

      console.log('✅ Loaded plans from backend API:', result.data);

      // Backend already returns properly formatted plans with metadata
      const formattedPlans: MembershipPlan[] = result.data.map((plan: any) => ({
        id: plan.id,
        name: plan.name,
        type: plan.type,
        price: plan.price,
        currency: plan.currency,
        description: plan.description,
        features: plan.features || [],
        limitations: plan.limitations || [],
        duration: plan.duration,
        entryLimit: plan.entryLimit,
        isActive: plan.isActive,
        isPopular: plan.isPopular,
        discountPercentage: plan.discountPercentage || 0,
        createdAt: plan.createdAt,
        updatedAt: plan.createdAt,
      }));

      console.log('✅ Formatted plans for display:', formattedPlans);
      setMembershipPlans(formattedPlans);
    } catch (error) {
      console.error('Error fetching plans from backend:', error);
      // Fallback to localStorage on network error
      const savedPlans = localStorage.getItem('viking-membership-plans');
      if (savedPlans) {
        try {
          const parsed = JSON.parse(savedPlans);
          setMembershipPlans(parsed);
        } catch (e) {
          console.error('Failed to parse saved plans:', e);
        }
      }
    }
  };

  // Load subscriptions from backend API
  const loadSubscriptionsFromDatabase = async () => {
    try {
      const response = await fetch('http://localhost:4001/api/subscriptions');
      const result = await response.json();

      if (result.success && result.data) {
        console.log('✅ Loaded subscriptions from database:', result.data.length);
        setSubscriptions(result.data);
      } else {
        console.error('Failed to load subscriptions:', result.error);
        // Fallback to mock data if database is empty
        console.log('⚠️ No subscriptions in database, loading mock data');
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      // On error, use empty array (database might be empty)
      console.log('⚠️ Database connection issue, subscriptions list will be empty');
    }
  };

  // keep global plans count in sync
  useEffect(() => {
    setPlansCount(membershipPlans.length);
    // Extract unique plan names and sync with DataContext
    const planNames = Array.from(new Set(membershipPlans.map((plan) => plan.name)));
    updateMembershipTypes(
      planNames.length > 0 ? planNames : ['Single', 'Monthly', 'Monthly Unlimited', 'Company'],
    );
  }, [membershipPlans, setPlansCount, updateMembershipTypes]);

  // Mock data loading removed - all data loaded from database

  const getFilteredPlans = () => {
    return membershipPlans.filter((plan) => {
      const matchesSearch =
        plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (plan.companyName && plan.companyName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = filterType === 'all' || plan.type === filterType;
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && plan.isActive) ||
        (filterStatus === 'inactive' && !plan.isActive);

      return matchesSearch && matchesType && matchesStatus;
    });
  };

  const getFilteredSubscriptions = () => {
    const filtered = subscriptions.filter((subscription) => {
      const matchesSearch =
        subscription.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subscription.memberEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subscription.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (subscription.companyName &&
          subscription.companyName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = filterStatus === 'all' || subscription.status === filterStatus;

      return matchesSearch && matchesStatus;
    });

    // Sort by end_date ascending (soonest expiration first - most important at top)
    return filtered.sort((a, b) => {
      if (!a.endDate) return 1; // No end date goes to bottom
      if (!b.endDate) return -1;
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    });
  };

  // Calculate days remaining until subscription expires
  const calculateDaysLeft = (endDate: string | null): number | null => {
    if (!endDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get color based on days remaining (urgency indicator)
  const getDaysLeftColor = (daysLeft: number | null): string => {
    if (daysLeft === null) return '#6c757d'; // grey for unlimited
    if (daysLeft < 0) return '#dc3545'; // red for expired
    if (daysLeft <= 7) return '#ff6b35'; // orange for critical (1 week)
    if (daysLeft <= 14) return '#ffc107'; // yellow for warning (2 weeks)
    return '#28a745'; // green for good
  };

  const getFilteredCompanies = () => {
    return companies.filter((company) => {
      const matchesSearch =
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || company.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  };

  const handleCreatePlan = async () => {
    // Validation
    if (!newPlan.name || !newPlan.name.trim()) {
      await showConfirmDialog({
        title: '⚠️ Validation Error',
        message: 'Please enter a plan name',
        confirmText: 'OK',
        cancelText: '',
        type: 'warning',
      });
      return;
    }

    if (!newPlan.price || newPlan.price <= 0) {
      await showConfirmDialog({
        title: '⚠️ Validation Error',
        message: 'Please enter a valid price (greater than 0)',
        confirmText: 'OK',
        cancelText: '',
        type: 'warning',
      });
      return;
    }

    // Check for duplicate plan names (excluding current plan if editing)
    const isDuplicate = membershipPlans.some(
      (plan) =>
        plan.name.toLowerCase() === (newPlan.name?.trim().toLowerCase() || '') &&
        plan.id !== editingPlanId,
    );

    if (isDuplicate) {
      await showConfirmDialog({
        title: '⚠️ Duplicate Plan',
        message: `A plan with the name "${newPlan.name}" already exists. Please choose a different name.`,
        confirmText: 'OK',
        cancelText: '',
        type: 'warning',
      });
      return;
    }

    // Filter out empty features and limitations
    const cleanedFeatures = (newPlan.features || []).filter((f) => f && f.trim());
    const cleanedLimitations = (newPlan.limitations || []).filter((l) => l && l.trim());

    // Prepare plan data for backend API
    const planData = {
      name: newPlan.name.trim(),
      type: newPlan.type || 'single',
      price: newPlan.price,
      currency: newPlan.currency || 'AZN',
      description: newPlan.description || '',
      features: cleanedFeatures,
      limitations: cleanedLimitations,
      duration: newPlan.duration || '30 days',
      entryLimit: newPlan.entryLimit,
      isActive: newPlan.isActive ?? true,
      isPopular: newPlan.isPopular || false,
      discountPercentage: newPlan.discountPercentage || 0,
    };

    try {
      // Get authentication token (assuming you have it in localStorage or context)
      const token = localStorage.getItem('authToken') || '';

      if (editingPlanId) {
        // Update existing plan via backend API
        const response = await fetch(`http://localhost:4001/api/plans/${editingPlanId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(planData),
        });

        const result = await response.json();

        if (!result.success) {
          await showConfirmDialog({
            title: '❌ Update Failed',
            message: `Failed to update plan: ${result.error}\n\nPlease check your connection and try again.`,
            confirmText: 'OK',
            cancelText: '',
            type: 'danger',
          });
          return;
        }

        // Show warning if metadata not saved (column doesn't exist yet)
        if (result.warning) {
          console.warn('⚠️ ', result.warning);
        }

        await showConfirmDialog({
          title: '✅ Success',
          message: 'Plan updated successfully!',
          confirmText: 'OK',
          cancelText: '',
          type: 'success',
        });
        setEditingPlanId(null);
      } else {
        // Create new plan via backend API
        const response = await fetch('http://localhost:4001/api/plans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(planData),
        });

        const result = await response.json();

        if (!result.success) {
          await showConfirmDialog({
            title: '❌ Creation Failed',
            message: `Failed to create plan: ${result.error}\n\nPlease check your connection and try again.`,
            confirmText: 'OK',
            cancelText: '',
            type: 'danger',
          });
          return;
        }

        // Show warning if metadata not saved (column doesn't exist yet)
        if (result.warning) {
          console.warn('⚠️ ', result.warning);
        }

        await showConfirmDialog({
          title: '✅ Success',
          message: 'Plan created successfully!',
          confirmText: 'OK',
          cancelText: '',
          type: 'success',
        });
      }

      // Reload plans from backend
      await loadPlansFromDatabase();
    } catch (error) {
      console.error('Unexpected error saving plan:', error);
      await showConfirmDialog({
        title: '❌ Error',
        message: 'An unexpected error occurred. Please try again.',
        confirmText: 'OK',
        cancelText: '',
        type: 'danger',
      });
      return;
    }

    // Reset form
    setNewPlan({
      name: '',
      type: 'single',
      price: 0,
      currency: 'AZN',
      description: '',
      features: [],
      limitations: [],
      duration: '',
      entryLimit: undefined,
      isActive: true,
      isPopular: false,
      discountPercentage: 0,
    });
    setShowCreatePlanModal(false);
  };

  const handleCreateCompany = () => {
    if (newCompany.name && newCompany.contactPerson && newCompany.email) {
      if (editingCompanyId) {
        // Update existing company
        const updatedCompanies = companies.map((company) =>
          company.id === editingCompanyId ? ({ ...company, ...newCompany } as Company) : company,
        );
        setCompanies(updatedCompanies);
        setEditingCompanyId(null);
      } else {
        // Create new company
        const companyToAdd: Company = {
          ...newCompany,
          id: `comp${Date.now()}`,
          activeSubscriptions: 0,
          contractStartDate: new Date().toISOString().split('T')[0],
          contractEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        } as Company;
        setCompanies([...companies, companyToAdd]);
      }

      setNewCompany({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        discountPercentage: 10,
        employeeCount: 0,
        status: 'pending',
      });
      setShowCreateCompanyModal(false);
    }
  };

  const handleEditPlan = (planId: string) => {
    const plan = membershipPlans.find((p) => p.id === planId);
    if (plan) {
      setNewPlan({
        name: plan.name,
        type: plan.type,
        price: plan.price,
        currency: plan.currency,
        description: plan.description,
        features: plan.features,
        limitations: plan.limitations,
        duration: plan.duration || '',
        entryLimit: plan.entryLimit,
        isActive: plan.isActive,
        isPopular: plan.isPopular || false,
        discountPercentage: plan.discountPercentage || 0,
      });
      setEditingPlanId(planId);
      setShowCreatePlanModal(true);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    const plan = membershipPlans.find((p) => p.id === planId);
    if (!plan) return;

    const confirmed = await showConfirmDialog({
      title: '🗑️ Delete Membership Plan',
      message: `Plan: ${plan.name}\nPrice: ${plan.price} ${plan.currency}\nType: ${plan.type}\n\n⚠️ WARNING: This action cannot be undone.\n\nAll subscriptions using this plan will be affected. Are you sure you want to delete this plan?`,
      confirmText: 'Yes, Delete It',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      // Get authentication token
      const token = localStorage.getItem('authToken') || '';

      // Delete via backend API
      const response = await fetch(`http://localhost:4001/api/plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!result.success) {
        await showConfirmDialog({
          title: '❌ Delete Failed',
          message: `Failed to delete plan: ${result.error}`,
          confirmText: 'OK',
          cancelText: '',
          type: 'danger',
        });
        return;
      }

      await showConfirmDialog({
        title: '✅ Success',
        message: 'Plan deleted successfully!',
        confirmText: 'OK',
        cancelText: '',
        type: 'success',
      });

      // Reload plans from backend
      await loadPlansFromDatabase();
    } catch (error) {
      console.error('Unexpected error deleting plan:', error);
      await showConfirmDialog({
        title: '❌ Error',
        message: 'An unexpected error occurred. Please try again.',
        confirmText: 'OK',
        cancelText: '',
        type: 'danger',
      });
    }
  };

  const handleEditSubscription = (subscriptionId: string) => {
    const subscription = subscriptions.find((s) => s.id === subscriptionId);
    if (subscription) {
      setEditingSubscriptionId(subscriptionId);
      setEditingSubscription({
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        remainingEntries: subscription.remainingEntries,
        status: subscription.status,
      });
      setShowEditSubscriptionModal(true);
    }
  };

  const handleSaveSubscriptionEdit = async () => {
    if (!editingSubscriptionId) return;

    try {
      const response = await fetch(
        `http://localhost:4001/api/subscriptions/${editingSubscriptionId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start_date: editingSubscription.startDate,
            end_date: editingSubscription.endDate,
            remaining_visits: editingSubscription.remainingEntries,
            status: editingSubscription.status,
          }),
        },
      );

      const result = await response.json();

      if (result.success) {
        await showConfirmDialog({
          title: '✅ Success',
          message: 'Subscription updated successfully!',
          confirmText: 'OK',
          cancelText: '',
          type: 'success',
        });
        await loadSubscriptionsFromDatabase();
        setShowEditSubscriptionModal(false);
        setEditingSubscriptionId(null);
        setEditingSubscription({});
      } else {
        await showConfirmDialog({
          title: '❌ Update Failed',
          message: `Failed to update subscription:\n\n${result.error}`,
          confirmText: 'OK',
          cancelText: '',
          type: 'danger',
        });
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      await showConfirmDialog({
        title: '❌ Error',
        message: 'An unexpected error occurred while updating the subscription.',
        confirmText: 'OK',
        cancelText: '',
        type: 'danger',
      });
    }
  };

  const handleRenewSubscription = async (subscriptionId: string) => {
    const subscription = subscriptions.find((s) => s.id === subscriptionId);
    if (!subscription) return;

    const confirmed = await showConfirmDialog({
      title: '🔄 Renew Subscription',
      message: `Member: ${subscription.memberName}\nPlan: ${
        subscription.planName
      }\nCurrent Status: ${subscription.status}\nCurrent End Date: ${
        subscription.endDate || 'N/A'
      }\n\nThis will extend the subscription period and reset available visits (if applicable).\n\nDo you want to renew this subscription?`,
      confirmText: 'Yes, Renew',
      cancelText: 'Cancel',
      type: 'success',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(
        `http://localhost:4001/api/subscriptions/${subscriptionId}/renew`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const result = await response.json();

      if (result.success) {
        await showConfirmDialog({
          title: '✅ Renewal Complete',
          message:
            'Subscription renewed successfully!\n\nThe subscription period has been extended.',
          confirmText: 'OK',
          cancelText: '',
          type: 'success',
        });
        await loadSubscriptionsFromDatabase(); // Reload data
      } else {
        await showConfirmDialog({
          title: '❌ Renewal Failed',
          message: `Failed to renew subscription:\n\n${result.error}`,
          confirmText: 'OK',
          cancelText: '',
          type: 'danger',
        });
      }
    } catch (error) {
      console.error('Error renewing subscription:', error);
      await showConfirmDialog({
        title: '❌ Error',
        message: 'An unexpected error occurred while renewing the subscription.',
        confirmText: 'OK',
        cancelText: '',
        type: 'danger',
      });
    }
  };

  const handleSuspendSubscription = async (subscriptionId: string) => {
    const subscription = subscriptions.find((s) => s.id === subscriptionId);
    if (!subscription) return;

    const confirmed = await showConfirmDialog({
      title: '⏸️ Suspend Subscription',
      message: `Member: ${subscription.memberName}\nPlan: ${subscription.planName}\nCurrent Status: ${subscription.status}\n\nThis will temporarily pause the subscription. You can reactivate it later.\n\nThe member will not be able to access gym facilities while suspended.\n\nDo you want to continue?`,
      confirmText: 'Yes, Suspend',
      cancelText: 'Cancel',
      type: 'warning',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(
        `http://localhost:4001/api/subscriptions/${subscriptionId}/suspend`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const result = await response.json();

      if (result.success) {
        await showConfirmDialog({
          title: '✅ Suspended',
          message:
            'Subscription suspended successfully!\n\nThe member will not be able to access gym facilities until reactivated.',
          confirmText: 'OK',
          cancelText: '',
          type: 'success',
        });
        await loadSubscriptionsFromDatabase(); // Reload data
      } else {
        await showConfirmDialog({
          title: '❌ Suspend Failed',
          message: `Failed to suspend subscription:\n\n${result.error}`,
          confirmText: 'OK',
          cancelText: '',
          type: 'danger',
        });
      }
    } catch (error) {
      console.error('Error suspending subscription:', error);
      await showConfirmDialog({
        title: '❌ Error',
        message: 'An unexpected error occurred while suspending the subscription.',
        confirmText: 'OK',
        cancelText: '',
        type: 'danger',
      });
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    const subscription = subscriptions.find((s) => s.id === subscriptionId);
    if (!subscription) return;

    const confirmed = await showConfirmDialog({
      title: '🗑️ Cancel Subscription',
      message: `Member: ${subscription.memberName}\nEmail: ${subscription.memberEmail}\nPlan: ${
        subscription.planName
      }\nStart Date: ${subscription.startDate}\nEnd Date: ${
        subscription.endDate || 'N/A'
      }\n\n⚠️ WARNING: This will mark the subscription as INACTIVE.\n\nThe member will immediately lose access to all membership benefits and gym facilities.\n\nThis action can be reversed by creating a new subscription.\n\nAre you absolutely sure you want to cancel this subscription?`,
      confirmText: 'Yes, Cancel It',
      cancelText: 'No, Keep It',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:4001/api/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (result.success) {
        await showConfirmDialog({
          title: '✅ Cancelled',
          message:
            'Subscription cancelled successfully!\n\nThe member no longer has access to gym facilities.',
          confirmText: 'OK',
          cancelText: '',
          type: 'success',
        });
        await loadSubscriptionsFromDatabase(); // Reload data
      } else {
        await showConfirmDialog({
          title: '❌ Cancellation Failed',
          message: `Failed to cancel subscription:\n\n${result.error}`,
          confirmText: 'OK',
          cancelText: '',
          type: 'danger',
        });
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      await showConfirmDialog({
        title: '❌ Error',
        message: 'An unexpected error occurred while cancelling the subscription.',
        confirmText: 'OK',
        cancelText: '',
        type: 'danger',
      });
    }
  };

  const handleEditCompany = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    if (company) {
      setNewCompany({
        name: company.name,
        contactPerson: company.contactPerson,
        email: company.email,
        phone: company.phone,
        address: company.address,
        discountPercentage: company.discountPercentage,
        employeeCount: company.employeeCount,
        status: company.status,
      });
      setEditingCompanyId(companyId);
      setShowCreateCompanyModal(true);
    }
  };

  const handleRemoveCompany = (companyId: string) => {
    if (confirm('Are you sure you want to remove this company?')) {
      setCompanies(companies.filter((c) => c.id !== companyId));
    }
  };

  const handleContactCompany = async (company: Company) => {
    const confirmed = await showConfirmDialog({
      title: '📞 Contact Company',
      message: `Contact: ${company.contactPerson}\nCompany: ${company.name}\nPhone: ${company.phone}\n\nHow would you like to contact them?`,
      confirmText: '📱 WhatsApp',
      cancelText: '☎️ Regular Call',
      type: 'info',
    });

    if (confirmed) {
      // WhatsApp call
      const phoneNumber = company.phone.replace(/\D/g, ''); // Remove non-digits
      window.open(`https://wa.me/${phoneNumber}`, '_blank');
    } else {
      // Regular phone call
      window.location.href = `tel:${company.phone}`;
    }
  };

  const handleToggleCompanyStatus = async (
    companyId: string,
    newStatus: 'active' | 'pending' | 'suspended',
  ) => {
    const company = companies.find((c) => c.id === companyId);
    if (!company) return;

    const statusMessages = {
      active: '✅ Activate this company partnership?',
      pending: '⏳ Set this company partnership to pending?',
      suspended: '⏸️ Suspend this company partnership?',
    };

    const confirmed = await showConfirmDialog({
      title: `${
        newStatus === 'active' ? '✅' : newStatus === 'pending' ? '⏳' : '⏸️'
      } Change Status`,
      message: `Company: ${company.name}\nCurrent Status: ${company.status}\n\n${statusMessages[newStatus]}`,
      confirmText: 'Yes, Change Status',
      cancelText: 'Cancel',
      type: newStatus === 'suspended' ? 'warning' : 'info',
    });

    if (!confirmed) return;

    const updatedCompanies = companies.map((c) =>
      c.id === companyId ? { ...c, status: newStatus } : c,
    );
    setCompanies(updatedCompanies);

    await showConfirmDialog({
      title: '✅ Status Updated',
      message: `Company status changed to: ${newStatus}`,
      confirmText: 'OK',
      cancelText: '',
      type: 'success',
    });
  };

  const getStats = () => {
    const totalPlans = membershipPlans.length;
    const activePlans = membershipPlans.filter((p) => p.isActive).length;
    const totalSubscriptions = subscriptions.length;
    const activeSubscriptions = subscriptions.filter((s) => s.status === 'active').length;
    const totalCompanies = companies.length;
    const activeCompanies = companies.filter((c) => c.status === 'active').length;
    const monthlyRevenue = subscriptions
      .filter((s) => s.status === 'active' && s.paymentStatus === 'paid')
      .reduce((sum, s) => {
        const plan = membershipPlans.find((p) => p.id === s.planId);
        return sum + (plan?.price || 0);
      }, 0);

    return {
      totalPlans,
      activePlans,
      totalSubscriptions,
      activeSubscriptions,
      totalCompanies,
      activeCompanies,
      monthlyRevenue,
    };
  };

  const formatPrice = (price: number, currency: string) => {
    return `${price} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: '#28a745',
      inactive: '#6c757d',
      suspended: '#ffc107',
      expired: '#dc3545',
      pending: '#17a2b8',
      paid: '#28a745',
      overdue: '#dc3545',
    };
    return colors[status as keyof typeof colors] || '#6c757d';
  };

  const renderPlansTab = () => (
    <div className="tab-content">
      <div className="section-header">
        <h3>Membership Plans</h3>
        <button className="add-btn" onClick={() => setShowCreatePlanModal(true)}>
          ➕ Create New Plan
        </button>
      </div>

      <div className="plans-grid">
        {getFilteredPlans().map((plan) => (
          <div key={plan.id} className={`plan-card ${plan.isPopular ? 'popular' : ''}`}>
            {plan.isPopular && <div className="popular-badge">⭐ Most Popular</div>}

            <div className="plan-header">
              <h4 className="plan-name">{plan.name}</h4>
              <div className="plan-price">
                <span className="price-amount">{formatPrice(plan.price, plan.currency)}</span>
                {plan.duration && <span className="price-period">/ {plan.duration}</span>}
              </div>
            </div>

            <p className="plan-description">{plan.description}</p>

            {plan.type === 'company' && plan.companyName && (
              <div className="company-info">
                <span className="company-tag">🏢 {plan.companyName}</span>
                {plan.discountPercentage && (
                  <span className="discount-tag">💰 {plan.discountPercentage}% OFF</span>
                )}
              </div>
            )}

            <div className="plan-details">
              {plan.entryLimit && (
                <div className="detail-item">
                  <span className="detail-label">Entry Limit:</span>
                  <span className="detail-value">{plan.entryLimit} entries</span>
                </div>
              )}
              {plan.duration && (
                <div className="detail-item">
                  <span className="detail-label">Duration:</span>
                  <span className="detail-value">{plan.duration}</span>
                </div>
              )}
            </div>

            <div className="plan-features">
              <h5>✅ Features:</h5>
              <ul>
                {plan.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>

            {plan.limitations.length > 0 && (
              <div className="plan-limitations">
                <h5>⚠️ Limitations:</h5>
                <ul>
                  {plan.limitations.map((limitation, index) => (
                    <li key={index}>{limitation}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="plan-status">
              <span
                className="status-badge"
                style={{ backgroundColor: getStatusColor(plan.isActive ? 'active' : 'inactive') }}
              >
                {plan.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="plan-actions">
              <button className="edit-btn" onClick={() => handleEditPlan(plan.id)}>
                ✏️ Edit
              </button>
              <button
                className="toggle-btn"
                onClick={() =>
                  setMembershipPlans(
                    membershipPlans.map((p) =>
                      p.id === plan.id ? { ...p, isActive: !p.isActive } : p,
                    ),
                  )
                }
              >
                {plan.isActive ? '🔒 Deactivate' : '🔓 Activate'}
              </button>
              <button className="delete-btn" onClick={() => handleDeletePlan(plan.id)}>
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSubscriptionsTab = () => (
    <div className="tab-content">
      <div className="section-header">
        <h3>Active Subscriptions</h3>
        <button className="add-btn" onClick={() => setShowAddSubscriptionModal(true)}>
          ➕ Add Subscription
        </button>
      </div>

      <div className="subscriptions-list">
        {getFilteredSubscriptions().map((subscription) => {
          const daysLeft = calculateDaysLeft(subscription.endDate);
          const daysLeftColor = getDaysLeftColor(daysLeft);

          return (
            <div key={subscription.id} className="subscription-card">
              <div className="subscription-header">
                <div className="member-info">
                  <h4 className="member-name">{subscription.memberName}</h4>
                  <p className="member-email">{subscription.memberEmail}</p>
                  {subscription.companyName && (
                    <span className="company-tag">🏢 {subscription.companyName}</span>
                  )}
                </div>
                <div className="subscription-status">
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(subscription.status) }}
                  >
                    {subscription.status}
                  </span>
                  {daysLeft !== null && (
                    <span
                      className="countdown-badge"
                      style={{
                        backgroundColor: daysLeftColor,
                        color: '#fff',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        marginLeft: '8px',
                      }}
                    >
                      {daysLeft < 0
                        ? '⚠️ EXPIRED'
                        : `⏱️ ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                    </span>
                  )}
                </div>
              </div>

              <div className="subscription-details">
                <div className="detail-row">
                  <span className="detail-label">Plan:</span>
                  <span className="detail-value">{subscription.planName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Period:</span>
                  <span className="detail-value">
                    {formatDate(subscription.startDate)} -{' '}
                    {subscription.endDate ? formatDate(subscription.endDate) : 'Ongoing'}
                  </span>
                </div>
                {subscription.remainingEntries !== undefined && (
                  <div className="detail-row">
                    <span className="detail-label">Visits Left:</span>
                    <span
                      className="detail-value"
                      style={{
                        fontWeight: 'bold',
                        color:
                          subscription.remainingEntries <= 3
                            ? '#ff6b35'
                            : subscription.remainingEntries <= 6
                            ? '#ffc107'
                            : '#28a745',
                      }}
                    >
                      {subscription.remainingEntries} / {subscription.totalEntries} remaining
                    </span>
                  </div>
                )}
                {subscription.nextPaymentDate && (
                  <div className="detail-row">
                    <span className="detail-label">Next Payment:</span>
                    <span className="detail-value">{formatDate(subscription.nextPaymentDate)}</span>
                  </div>
                )}
              </div>

              <div className="subscription-actions">
                <button
                  className="edit-btn"
                  onClick={() => handleEditSubscription(subscription.id)}
                >
                  ✏️ Edit
                </button>
                <button
                  className="renew-btn"
                  onClick={() => handleRenewSubscription(subscription.id)}
                >
                  🔄 Renew
                </button>
                <button
                  className="suspend-btn"
                  onClick={() => handleSuspendSubscription(subscription.id)}
                >
                  ⏸️ Suspend
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleCancelSubscription(subscription.id)}
                >
                  🗑️ Cancel
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCompaniesTab = () => (
    <div className="tab-content">
      <div className="section-header">
        <h3>Company Partnerships</h3>
        <button className="add-btn" onClick={() => setShowCreateCompanyModal(true)}>
          ➕ Add Company
        </button>
      </div>

      <div className="companies-grid">
        {getFilteredCompanies().map((company) => (
          <div key={company.id} className="company-card">
            <div className="company-header">
              <h4 className="company-name">{company.name}</h4>
              <span
                className="status-badge"
                style={{ backgroundColor: getStatusColor(company.status) }}
              >
                {company.status}
              </span>
            </div>

            <div className="company-details">
              <div className="detail-row">
                <span className="detail-icon">👤</span>
                <span className="detail-label">Contact:</span>
                <span className="detail-value">{company.contactPerson}</span>
              </div>
              <div className="detail-row">
                <span className="detail-icon">📧</span>
                <span className="detail-label">Email:</span>
                <span className="detail-value">{company.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-icon">📱</span>
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{company.phone}</span>
              </div>
              <div className="detail-row">
                <span className="detail-icon">📍</span>
                <span className="detail-label">Address:</span>
                <span className="detail-value">{company.address}</span>
              </div>
              <div className="detail-row">
                <span className="detail-icon">💰</span>
                <span className="detail-label">Discount:</span>
                <span className="detail-value">{company.discountPercentage}%</span>
              </div>
              <div className="detail-row">
                <span className="detail-icon">👥</span>
                <span className="detail-label">Employees:</span>
                <span className="detail-value">{company.employeeCount}</span>
              </div>
              <div className="detail-row">
                <span className="detail-icon">📊</span>
                <span className="detail-label">Active Subs:</span>
                <span className="detail-value">{company.activeSubscriptions}</span>
              </div>
              <div className="detail-row">
                <span className="detail-icon">📅</span>
                <span className="detail-label">Contract:</span>
                <span className="detail-value">
                  {formatDate(company.contractStartDate)} - {formatDate(company.contractEndDate)}
                </span>
              </div>
            </div>

            <div className="company-actions">
              <button className="edit-btn" onClick={() => handleEditCompany(company.id)}>
                ✏️ Edit
              </button>
              <button className="contact-btn" onClick={() => handleContactCompany(company)}>
                📞 Contact
              </button>
              {company.status !== 'active' && (
                <button
                  className="activate-btn"
                  onClick={() => handleToggleCompanyStatus(company.id, 'active')}
                >
                  ✅ Activate
                </button>
              )}
              {company.status !== 'pending' && (
                <button
                  className="pending-btn"
                  onClick={() => handleToggleCompanyStatus(company.id, 'pending')}
                >
                  ⏳ Pending
                </button>
              )}
              {company.status !== 'suspended' && (
                <button
                  className="suspend-btn"
                  onClick={() => handleToggleCompanyStatus(company.id, 'suspended')}
                >
                  ⏸️ Suspend
                </button>
              )}
              <button className="delete-btn" onClick={() => handleRemoveCompany(company.id)}>
                🗑️ Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const stats = getStats();

  return (
    <div className="membership-manager">
      <div className="membership-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Reception
        </button>
        <h2 className="membership-title">💳 Membership Manager</h2>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.totalPlans}</h3>
            <p className="stat-label">Total Plans</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.activeSubscriptions}</h3>
            <p className="stat-label">Active Subscriptions</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.activeCompanies}</h3>
            <p className="stat-label">Company Partners</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.monthlyRevenue} AZN</h3>
            <p className="stat-label">Monthly Revenue</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-navigation">
        <button
          className={`tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          📋 Membership Plans
        </button>
        <button
          className={`tab-btn ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          📊 Subscriptions
        </button>
        <button
          className={`tab-btn ${activeTab === 'companies' ? 'active' : ''}`}
          onClick={() => setActiveTab('companies')}
        >
          🏢 Companies
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-filters">
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {activeTab === 'plans' && (
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="single">Single Entry</option>
              <option value="monthly-limited">Monthly Limited</option>
              <option value="monthly-unlimited">Monthly Unlimited</option>
              <option value="company">Company Plans</option>
            </select>
          )}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            {activeTab === 'subscriptions' && (
              <>
                <option value="expired">Expired</option>
                <option value="suspended">Suspended</option>
              </>
            )}
            {activeTab === 'companies' && <option value="pending">Pending</option>}
          </select>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'plans' && renderPlansTab()}
      {activeTab === 'subscriptions' && renderSubscriptionsTab()}
      {activeTab === 'companies' && renderCompaniesTab()}

      {/* Create/Edit Plan Modal */}
      {showCreatePlanModal && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h3>{editingPlanId ? '✏️ Edit Membership Plan' : '➕ Create New Membership Plan'}</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowCreatePlanModal(false);
                  setEditingPlanId(null);
                  setNewPlan({
                    name: '',
                    type: 'single',
                    price: 0,
                    currency: 'AZN',
                    description: '',
                    features: [],
                    limitations: [],
                    duration: '',
                    entryLimit: undefined,
                    isActive: true,
                    isPopular: false,
                    discountPercentage: 0,
                  });
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>
                  Plan Name: <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={newPlan.name || ''}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  placeholder="e.g., Premium Monthly, Single Entry"
                  className="form-input-large"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    Plan Type: <span className="required">*</span>
                  </label>
                  <select
                    value={newPlan.type || 'single'}
                    onChange={(e) => setNewPlan({ ...newPlan, type: e.target.value as any })}
                    className="form-select-large"
                  >
                    <option value="single">Single Entry</option>
                    <option value="monthly-limited">Monthly Limited</option>
                    <option value="monthly-unlimited">Monthly Unlimited</option>
                    <option value="company">Company Plan</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Price (AZN): <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    value={newPlan.price || 0}
                    onChange={(e) => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) })}
                    min="0"
                    step="0.01"
                    className="form-input-large"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={newPlan.description || ''}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  placeholder="Brief description of this plan"
                  rows={3}
                  className="form-textarea-large"
                />
              </div>

              {newPlan.type === 'monthly-limited' && (
                <div className="form-group">
                  <label>Entry Limit:</label>
                  <input
                    type="number"
                    value={newPlan.entryLimit || 0}
                    onChange={(e) =>
                      setNewPlan({ ...newPlan, entryLimit: parseInt(e.target.value) })
                    }
                    min="1"
                    className="form-input-large"
                    placeholder="Number of gym visits allowed"
                  />
                </div>
              )}

              {(newPlan.type === 'monthly-limited' ||
                newPlan.type === 'monthly-unlimited' ||
                newPlan.type === 'company') && (
                <div className="form-group">
                  <label>Duration:</label>
                  <input
                    type="text"
                    value={newPlan.duration || ''}
                    onChange={(e) => setNewPlan({ ...newPlan, duration: e.target.value })}
                    placeholder="e.g., 30 days, 1 month, 1 year"
                    className="form-input-large"
                  />
                </div>
              )}

              <div className="form-group">
                <label>✅ Features:</label>
                <div className="dynamic-list">
                  {(newPlan.features || []).map((feature, index) => (
                    <div key={index} className="list-item">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => {
                          const updated = [...(newPlan.features || [])];
                          updated[index] = e.target.value;
                          setNewPlan({ ...newPlan, features: updated });
                        }}
                        className="list-input"
                      />
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => {
                          const updated = (newPlan.features || []).filter((_, i) => i !== index);
                          setNewPlan({ ...newPlan, features: updated });
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="add-item-btn"
                    onClick={() =>
                      setNewPlan({ ...newPlan, features: [...(newPlan.features || []), ''] })
                    }
                  >
                    + Add Feature
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>⚠️ Limitations (Optional):</label>
                <div className="dynamic-list">
                  {(newPlan.limitations || []).map((limitation, index) => (
                    <div key={index} className="list-item">
                      <input
                        type="text"
                        value={limitation}
                        onChange={(e) => {
                          const updated = [...(newPlan.limitations || [])];
                          updated[index] = e.target.value;
                          setNewPlan({ ...newPlan, limitations: updated });
                        }}
                        className="list-input"
                      />
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => {
                          const updated = (newPlan.limitations || []).filter((_, i) => i !== index);
                          setNewPlan({ ...newPlan, limitations: updated });
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="add-item-btn"
                    onClick={() =>
                      setNewPlan({ ...newPlan, limitations: [...(newPlan.limitations || []), ''] })
                    }
                  >
                    + Add Limitation
                  </button>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newPlan.isPopular || false}
                      onChange={(e) => setNewPlan({ ...newPlan, isPopular: e.target.checked })}
                    />
                    <span>⭐ Mark as Popular</span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newPlan.isActive !== false}
                      onChange={(e) => setNewPlan({ ...newPlan, isActive: e.target.checked })}
                    />
                    <span>✅ Active Plan</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowCreatePlanModal(false);
                  setEditingPlanId(null);
                  setNewPlan({
                    name: '',
                    type: 'single',
                    price: 0,
                    currency: 'AZN',
                    description: '',
                    features: [],
                    limitations: [],
                    duration: '',
                    entryLimit: undefined,
                    isActive: true,
                    isPopular: false,
                    discountPercentage: 0,
                  });
                }}
              >
                ❌ Cancel
              </button>
              <button className="confirm-btn" onClick={handleCreatePlan}>
                {editingPlanId ? '💾 Update Plan' : '➕ Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Company Modal */}
      {showCreateCompanyModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Company Partnership</h3>
              <button className="close-btn" onClick={() => setShowCreateCompanyModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Company Name:</label>
                <input
                  type="text"
                  value={newCompany.name || ''}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>

              <div className="form-group">
                <label>Contact Person:</label>
                <input
                  type="text"
                  value={newCompany.contactPerson || ''}
                  onChange={(e) => setNewCompany({ ...newCompany, contactPerson: e.target.value })}
                  placeholder="Enter contact person name"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={newCompany.email || ''}
                    onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                    placeholder="company@email.com"
                  />
                </div>

                <div className="form-group">
                  <label>Phone:</label>
                  <input
                    type="tel"
                    value={newCompany.phone || ''}
                    onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                    placeholder="+994501234567"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address:</label>
                <textarea
                  value={newCompany.address || ''}
                  onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                  placeholder="Enter company address"
                  rows={2}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Employee Count:</label>
                  <input
                    type="number"
                    value={newCompany.employeeCount || 0}
                    onChange={(e) =>
                      setNewCompany({ ...newCompany, employeeCount: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Discount Percentage (0-100%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={
                      newCompany.discountPercentage !== undefined
                        ? newCompany.discountPercentage
                        : 10
                    }
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                      const validValue = Math.min(100, Math.max(0, isNaN(value) ? 0 : value));
                      setNewCompany({ ...newCompany, discountPercentage: validValue });
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowCreateCompanyModal(false)}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleCreateCompany}>
                Add Company
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subscription Modal */}
      {showEditSubscriptionModal && editingSubscriptionId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>✏️ Edit Subscription</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowEditSubscriptionModal(false);
                  setEditingSubscriptionId(null);
                  setEditingSubscription({});
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Start Date:</label>
                <input
                  type="date"
                  value={editingSubscription.startDate || ''}
                  onChange={(e) =>
                    setEditingSubscription({ ...editingSubscription, startDate: e.target.value })
                  }
                  className="form-input-large"
                />
              </div>

              <div className="form-group">
                <label>End Date:</label>
                <input
                  type="date"
                  value={editingSubscription.endDate || ''}
                  onChange={(e) =>
                    setEditingSubscription({ ...editingSubscription, endDate: e.target.value })
                  }
                  className="form-input-large"
                />
              </div>

              {editingSubscription.remainingEntries !== undefined && (
                <div className="form-group">
                  <label>Remaining Entries:</label>
                  <input
                    type="number"
                    min="0"
                    value={editingSubscription.remainingEntries || 0}
                    onChange={(e) =>
                      setEditingSubscription({
                        ...editingSubscription,
                        remainingEntries: parseInt(e.target.value),
                      })
                    }
                    className="form-input-large"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Status:</label>
                <select
                  value={editingSubscription.status || 'active'}
                  onChange={(e) =>
                    setEditingSubscription({
                      ...editingSubscription,
                      status: e.target.value as any,
                    })
                  }
                  className="form-select-large"
                >
                  <option value="active">✅ Active</option>
                  <option value="inactive">❌ Inactive</option>
                  <option value="suspended">⏸️ Suspended</option>
                  <option value="expired">⏳ Expired</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowEditSubscriptionModal(false);
                  setEditingSubscriptionId(null);
                  setEditingSubscription({});
                }}
              >
                ❌ Cancel
              </button>
              <button className="confirm-btn" onClick={handleSaveSubscriptionEdit}>
                💾 Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subscription Modal */}
      {showAddSubscriptionModal && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h3>➕ Add New Subscription</h3>
              <button className="close-btn" onClick={() => setShowAddSubscriptionModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="info-box">
                <p>
                  ℹ️ <strong>Note:</strong> To add a new subscription, please use the{' '}
                  <strong>Member Management</strong> page to assign a membership plan to a member.
                </p>
                <p>
                  This ensures all member details and payment information are properly recorded.
                </p>
              </div>

              <div className="quick-actions">
                <h4>Quick Actions:</h4>
                <ul>
                  <li>
                    ✅ Go to <strong>Member Management</strong>
                  </li>
                  <li>✅ Select the member</li>
                  <li>
                    ✅ Click <strong>"Assign Membership"</strong>
                  </li>
                  <li>✅ Choose a plan and set dates</li>
                  <li>✅ Subscription will appear here automatically</li>
                </ul>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAddSubscriptionModal(false)}>
                Close
              </button>
              <button
                className="confirm-btn"
                onClick={() => {
                  setShowAddSubscriptionModal(false);
                  onBack(); // Go back to Reception dashboard where Member Management is
                }}
              >
                📋 Go to Reception Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipManager;
