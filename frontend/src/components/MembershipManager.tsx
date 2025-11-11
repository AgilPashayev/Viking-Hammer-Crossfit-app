import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { showConfirmDialog } from '../utils/confirmDialog';
import { useTranslation } from 'react-i18next';
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

const normalizeText = (value?: string | null) =>
  (value || '').replace(/[–—−]/g, '-').replace(/\s+/g, ' ').trim().toLowerCase();

const PLAN_NAME_KEY_MAP: Record<string, string> = {
  'monthly unlimited': 'admin.membership.planNames.monthlyUnlimited',
  'monthly limited': 'admin.membership.planNames.monthlyLimited',
  'single session': 'admin.membership.planNames.singleSession',
};

const PLAN_DESCRIPTION_KEY_MAP: Record<string, string> = {
  'unlimited monthly access': 'admin.membership.planDescriptions.monthlyUnlimited',
  'limited monthly plan - 12 visits': 'admin.membership.planDescriptions.monthlyLimited',
  'single gym visit - pay as you go': 'admin.membership.planDescriptions.singleSession',
};

const PLAN_FEATURE_KEY_MAP: Record<string, string> = {
  'unlimited gym visits': 'admin.membership.planFeatures.unlimitedGymVisits',
  'access to all classes': 'admin.membership.planFeatures.accessAllClasses',
  'locker privileges': 'admin.membership.planFeatures.lockerPrivileges',
  'guest privileges (2/month)': 'admin.membership.planFeatures.guestPrivileges',
  '12 gym visits per month': 'admin.membership.planFeatures.twelveVisitsPerMonth',
  'flexible schedule': 'admin.membership.planFeatures.flexibleSchedule',
  'access to all equipment': 'admin.membership.planFeatures.accessAllEquipment',
  'valid for one day': 'admin.membership.planFeatures.validOneDay',
};

const PLAN_LIMITATION_KEY_MAP: Record<string, string> = {
  'monthly commitment': 'admin.membership.planLimitations.monthlyCommitment',
  'auto-renews': 'admin.membership.planLimitations.autoRenews',
  'visit quota applies': 'admin.membership.planLimitations.visitQuotaApplies',
  'no rollover of unused visits': 'admin.membership.planLimitations.noRollover',
  'single entry only': 'admin.membership.planLimitations.singleEntryOnly',
};

const MembershipManager: React.FC<MembershipManagerProps> = ({ onBack }) => {
  const { setPlansCount, updateMembershipTypes } = useData();
  const { t, i18n } = useTranslation();

  // Get current user role from localStorage
  const [userRole, setUserRole] = useState<string>('member');

  useEffect(() => {
    const userData =
      localStorage.getItem('userData') || localStorage.getItem('viking_remembered_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserRole(user.role || 'member');
      } catch (error) {
        console.error('Failed to parse user data:', error);
        setUserRole('member');
      }
    }
  }, []);

  // Define tab access based on roles
  const canAccessPlans = userRole === 'sparta' || userRole === 'reception';
  const canAccessSubscriptions = userRole === 'sparta' || userRole === 'reception';
  const canAccessCompanies = userRole === 'sparta'; // Only Sparta can access Companies

  // Determine default tab based on role
  const getDefaultTab = (): 'plans' | 'subscriptions' | 'companies' => {
    if (userRole === 'sparta') return 'plans';
    if (userRole === 'reception') return 'plans'; // Reception sees Plans and Subscriptions
    return 'plans'; // Fallback (though they shouldn't see this page)
  };

  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions' | 'companies'>(
    getDefaultTab(),
  );

  // Update activeTab when userRole changes
  useEffect(() => {
    const defaultTab = getDefaultTab();
    setActiveTab(defaultTab);
  }, [userRole]);

  const resolveLocale = (language?: string) => {
    if (!language) return 'en-US';
    if (language.startsWith('az')) return 'az-Latn-AZ';
    if (language.startsWith('ru')) return 'ru-RU';
    return 'en-US';
  };

  const getCurrentLocale = () => resolveLocale(i18n.language || i18n.resolvedLanguage);

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
  const [expandedSubscriptions, setExpandedSubscriptions] = useState<Set<string>>(new Set());

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
  const calculateDaysLeft = (endDate: string | null | undefined): number | null => {
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

  const getCountdownLabel = (daysLeft: number) => {
    if (daysLeft < 0) {
      return t('admin.membership.countdown.expired');
    }
    return t('admin.membership.countdown.days', { count: daysLeft });
  };

  const getPlanTypeLabel = (type: MembershipPlan['type']) => {
    switch (type) {
      case 'single':
        return t('admin.membership.singleEntry');
      case 'monthly-limited':
        return t('admin.membership.monthlyLimited');
      case 'monthly-unlimited':
        return t('admin.membership.monthlyUnlimited');
      case 'company':
        return t('admin.membership.companyPlan');
      default:
        return type;
    }
  };

  const translateUsingMap = (
    value: string | undefined | null,
    map: Record<string, string>,
  ): string => {
    if (!value) {
      return value ?? '';
    }

    const normalized = normalizeText(value);
    const translationKey = map[normalized];

    if (translationKey) {
      const translated = t(translationKey);
      if (translated !== translationKey) {
        return translated;
      }
    }

    return value;
  };

  const translatePlanName = (name: string) => translateUsingMap(name, PLAN_NAME_KEY_MAP);

  const translatePlanDescription = (description?: string | null) =>
    translateUsingMap(description, PLAN_DESCRIPTION_KEY_MAP);

  const translatePlanFeature = (feature: string) =>
    translateUsingMap(feature, PLAN_FEATURE_KEY_MAP);

  const translatePlanLimitation = (limitation: string) =>
    translateUsingMap(limitation, PLAN_LIMITATION_KEY_MAP);

  const translatePlanDuration = (duration?: string | null) => {
    if (!duration) {
      return '';
    }

    const normalized = normalizeText(duration);
    const match = normalized.match(/^(\d+)\s+(day|days|month|months)$/);

    if (match) {
      const count = Number(match[1]);
      const unit = match[2].startsWith('day') ? 'days' : 'months';
      return t(`admin.membership.durationDisplay.${unit}`, { count });
    }

    return duration;
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
        title: t('admin.membership.dialogs.titles.validation'),
        message: t('admin.membership.dialogs.messages.planNameRequired'),
        confirmText: t('common.ok'),
        cancelText: '',
        type: 'warning',
      });
      return;
    }

    if (!newPlan.price || newPlan.price <= 0) {
      await showConfirmDialog({
        title: t('admin.membership.dialogs.titles.validation'),
        message: t('admin.membership.dialogs.messages.planPriceInvalid'),
        confirmText: t('common.ok'),
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
        title: t('admin.membership.dialogs.titles.duplicate'),
        message: t('admin.membership.dialogs.messages.duplicatePlan', {
          name: newPlan.name,
        }),
        confirmText: t('common.ok'),
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
            title: t('admin.membership.dialogs.titles.updateFailed'),
            message: t('admin.membership.dialogs.messages.planUpdateFailed', {
              error: result.error,
            }),
            confirmText: t('common.ok'),
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
          title: t('admin.membership.dialogs.titles.success'),
          message: t('admin.membership.dialogs.messages.planUpdateSuccess'),
          confirmText: t('common.ok'),
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
            title: t('admin.membership.dialogs.titles.creationFailed'),
            message: t('admin.membership.dialogs.messages.planCreationFailed', {
              error: result.error,
            }),
            confirmText: t('common.ok'),
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
          title: t('admin.membership.dialogs.titles.success'),
          message: t('admin.membership.dialogs.messages.planCreationSuccess'),
          confirmText: t('common.ok'),
          cancelText: '',
          type: 'success',
        });
      }

      // Reload plans from backend
      await loadPlansFromDatabase();
    } catch (error) {
      console.error('Unexpected error saving plan:', error);
      await showConfirmDialog({
        title: t('admin.membership.dialogs.titles.error'),
        message: t('admin.membership.dialogs.messages.genericError'),
        confirmText: t('common.ok'),
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

    const formattedPrice = formatPrice(plan.price, plan.currency);
    const planTypeLabel = getPlanTypeLabel(plan.type);
    const translatedPlanName = translatePlanName(plan.name);

    const confirmed = await showConfirmDialog({
      title: t('admin.membership.dialogs.titles.deletePlan'),
      message: t('admin.membership.dialogs.messages.deletePlan', {
        name: translatedPlanName,
        price: formattedPrice,
        type: planTypeLabel,
      }),
      confirmText: t('admin.membership.dialogs.confirm.deletePlan'),
      cancelText: t('common.cancel'),
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
          title: t('admin.membership.dialogs.titles.deleteFailed'),
          message: t('admin.membership.dialogs.messages.deletePlanFailed', {
            error: result.error,
          }),
          confirmText: t('common.ok'),
          cancelText: '',
          type: 'danger',
        });
        return;
      }

      await showConfirmDialog({
        title: t('admin.membership.dialogs.titles.success'),
        message: t('admin.membership.dialogs.messages.deletePlanSuccess'),
        confirmText: t('common.ok'),
        cancelText: '',
        type: 'success',
      });

      // Reload plans from backend
      await loadPlansFromDatabase();
    } catch (error) {
      console.error('Unexpected error deleting plan:', error);
      await showConfirmDialog({
        title: t('admin.membership.dialogs.titles.error'),
        message: t('admin.membership.dialogs.messages.genericError'),
        confirmText: t('common.ok'),
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
          title: t('admin.membership.dialogs.titles.success'),
          message: t('admin.membership.dialogs.messages.subscriptionUpdateSuccess'),
          confirmText: t('common.ok'),
          cancelText: '',
          type: 'success',
        });
        await loadSubscriptionsFromDatabase();
        setShowEditSubscriptionModal(false);
        setEditingSubscriptionId(null);
        setEditingSubscription({});
      } else {
        await showConfirmDialog({
          title: t('admin.membership.dialogs.titles.updateFailed'),
          message: t('admin.membership.dialogs.messages.subscriptionUpdateFailed', {
            error: result.error,
          }),
          confirmText: t('common.ok'),
          cancelText: '',
          type: 'danger',
        });
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      await showConfirmDialog({
        title: t('admin.membership.dialogs.titles.error'),
        message: t('admin.membership.dialogs.messages.subscriptionUpdateError'),
        confirmText: t('common.ok'),
        cancelText: '',
        type: 'danger',
      });
    }
  };

  const handleRenewSubscription = async (subscriptionId: string) => {
    const subscription = subscriptions.find((s) => s.id === subscriptionId);
    if (!subscription) return;
    const localizedPlanName = translatePlanName(subscription.planName);

    const confirmed = await showConfirmDialog({
      title: t('admin.membership.dialogs.titles.renewSubscription'),
      message: t('admin.membership.dialogs.messages.renewSubscriptionConfirm', {
        member: subscription.memberName,
        plan: localizedPlanName,
        status: translateStatus(subscription.status),
        endDate: subscription.endDate ? formatDate(subscription.endDate) : t('common.notAvailable'),
      }),
      confirmText: t('admin.membership.dialogs.confirm.renew'),
      cancelText: t('common.cancel'),
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
          title: t('admin.membership.dialogs.titles.renewalComplete'),
          message: t('admin.membership.dialogs.messages.renewalSuccess'),
          confirmText: t('common.ok'),
          cancelText: '',
          type: 'success',
        });
        await loadSubscriptionsFromDatabase(); // Reload data
      } else {
        await showConfirmDialog({
          title: t('admin.membership.dialogs.titles.renewalFailed'),
          message: t('admin.membership.dialogs.messages.renewalFailed', {
            error: result.error,
          }),
          confirmText: t('common.ok'),
          cancelText: '',
          type: 'danger',
        });
      }
    } catch (error) {
      console.error('Error renewing subscription:', error);
      await showConfirmDialog({
        title: t('admin.membership.dialogs.titles.error'),
        message: t('admin.membership.dialogs.messages.renewalError'),
        confirmText: t('common.ok'),
        cancelText: '',
        type: 'danger',
      });
    }
  };

  const handleSuspendSubscription = async (subscriptionId: string) => {
    const subscription = subscriptions.find((s) => s.id === subscriptionId);
    if (!subscription) return;
    const localizedPlanName = translatePlanName(subscription.planName);

    const confirmed = await showConfirmDialog({
      title: t('admin.membership.dialogs.titles.suspendSubscription'),
      message: t('admin.membership.dialogs.messages.suspendSubscriptionConfirm', {
        member: subscription.memberName,
        plan: localizedPlanName,
        status: translateStatus(subscription.status),
      }),
      confirmText: t('admin.membership.dialogs.confirm.suspend'),
      cancelText: t('common.cancel'),
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
          title: t('admin.membership.dialogs.titles.suspendSuccess'),
          message: t('admin.membership.dialogs.messages.suspendSuccess'),
          confirmText: t('common.ok'),
          cancelText: '',
          type: 'success',
        });
        await loadSubscriptionsFromDatabase(); // Reload data
      } else {
        await showConfirmDialog({
          title: t('admin.membership.dialogs.titles.suspendFailed'),
          message: t('admin.membership.dialogs.messages.suspendFailed', {
            error: result.error,
          }),
          confirmText: t('common.ok'),
          cancelText: '',
          type: 'danger',
        });
      }
    } catch (error) {
      console.error('Error suspending subscription:', error);
      await showConfirmDialog({
        title: t('admin.membership.dialogs.titles.error'),
        message: t('admin.membership.dialogs.messages.suspendError'),
        confirmText: t('common.ok'),
        cancelText: '',
        type: 'danger',
      });
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    const subscription = subscriptions.find((s) => s.id === subscriptionId);
    if (!subscription) return;
    const localizedPlanName = translatePlanName(subscription.planName);

    const confirmed = await showConfirmDialog({
      title: t('admin.membership.dialogs.titles.cancelSubscription'),
      message: t('admin.membership.dialogs.messages.cancelSubscriptionConfirm', {
        member: subscription.memberName,
        email: subscription.memberEmail,
        plan: localizedPlanName,
        startDate: formatDate(subscription.startDate),
        endDate: subscription.endDate ? formatDate(subscription.endDate) : t('common.notAvailable'),
      }),
      confirmText: t('admin.membership.dialogs.confirm.cancelSubscription'),
      cancelText: t('admin.membership.dialogs.confirm.keepSubscription'),
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
          title: t('admin.membership.dialogs.titles.cancelled'),
          message: t('admin.membership.dialogs.messages.cancellationSuccess'),
          confirmText: t('common.ok'),
          cancelText: '',
          type: 'success',
        });
        await loadSubscriptionsFromDatabase(); // Reload data
      } else {
        await showConfirmDialog({
          title: t('admin.membership.dialogs.titles.cancellationFailed'),
          message: t('admin.membership.dialogs.messages.cancellationFailed', {
            error: result.error,
          }),
          confirmText: t('common.ok'),
          cancelText: '',
          type: 'danger',
        });
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      await showConfirmDialog({
        title: t('admin.membership.dialogs.titles.error'),
        message: t('admin.membership.dialogs.messages.cancellationError'),
        confirmText: t('common.ok'),
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

  const handleRemoveCompany = async (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    if (!company) return;

    const confirmed = await showConfirmDialog({
      title: t('admin.membership.dialogs.titles.removeCompany'),
      message: t('admin.membership.dialogs.messages.removeCompany', { name: company.name }),
      confirmText: t('admin.membership.dialogs.confirm.deleteCompany'),
      cancelText: t('common.cancel'),
      type: 'danger',
    });

    if (!confirmed) return;

    setCompanies(companies.filter((c) => c.id !== companyId));
  };

  const handleContactCompany = async (company: Company) => {
    const confirmed = await showConfirmDialog({
      title: t('admin.membership.dialogs.titles.contactCompany'),
      message: t('admin.membership.dialogs.messages.contactCompany', {
        contact: company.contactPerson,
        company: company.name,
        phone: company.phone,
      }),
      confirmText: t('admin.membership.dialogs.confirm.contactWhatsApp'),
      cancelText: t('admin.membership.dialogs.confirm.contactCall'),
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

    const confirmed = await showConfirmDialog({
      title: t('admin.membership.dialogs.titles.changeCompanyStatus', {
        status: translateStatus(newStatus),
      }),
      message: t('admin.membership.dialogs.messages.companyStatusChange', {
        company: company.name,
        currentStatus: translateStatus(company.status),
        action: t(`admin.membership.dialogs.messages.companyStatus.${newStatus}`),
      }),
      confirmText: t('admin.membership.dialogs.confirm.changeStatus'),
      cancelText: t('common.cancel'),
      type: newStatus === 'suspended' ? 'warning' : 'info',
    });

    if (!confirmed) return;

    const updatedCompanies = companies.map((c) =>
      c.id === companyId ? { ...c, status: newStatus } : c,
    );
    setCompanies(updatedCompanies);

    await showConfirmDialog({
      title: t('admin.membership.dialogs.titles.statusUpdated'),
      message: t('admin.membership.dialogs.messages.companyStatusUpdated', {
        status: translateStatus(newStatus),
      }),
      confirmText: t('common.ok'),
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
    const monthlyRevenueCurrency = membershipPlans.find((p) => p.currency)?.currency || 'AZN';

    return {
      totalPlans,
      activePlans,
      totalSubscriptions,
      activeSubscriptions,
      totalCompanies,
      activeCompanies,
      monthlyRevenue,
      monthlyRevenueCurrency,
    };
  };

  const formatPrice = (price: number, currency: string) => {
    try {
      return new Intl.NumberFormat(getCurrentLocale(), {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(price);
    } catch (error) {
      console.warn('Currency formatting failed, falling back to basic display.', error);
      return `${price} ${currency}`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(getCurrentLocale(), {
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

  const translateStatus = (status: string) => {
    const dashboardStatusKey = `dashboard.status.${status}`;
    const dashboardTranslation = t(dashboardStatusKey);
    if (dashboardTranslation !== dashboardStatusKey) {
      return dashboardTranslation;
    }

    const membershipStatusKey = `admin.membership.statusLabels.${status}`;
    const membershipTranslation = t(membershipStatusKey);
    if (membershipTranslation !== membershipStatusKey) {
      return membershipTranslation;
    }

    return status;
  };

  // Toggle subscription expand/collapse
  const toggleSubscription = (id: string) => {
    setExpandedSubscriptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const renderPlansTab = () => (
    <div className="tab-content">
      <div className="section-header">
        <h3>{t('admin.membership.plans')}</h3>
        <button className="add-btn" onClick={() => setShowCreatePlanModal(true)}>
          ➕ {t('admin.membership.createNewPlan')}
        </button>
      </div>

      <div className="plans-grid">
        {getFilteredPlans().map((plan) => {
          const translatedPlanName = translatePlanName(plan.name);
          const translatedDescription = translatePlanDescription(plan.description);
          const translatedDuration = translatePlanDuration(plan.duration);

          return (
            <div key={plan.id} className={`plan-card ${plan.isPopular ? 'popular' : ''}`}>
              {plan.isPopular && (
                <div className="popular-badge">⭐ {t('admin.membership.mostPopular')}</div>
              )}

              <div className="plan-header">
                <h4 className="plan-name">{translatedPlanName}</h4>
                <div className="plan-price">
                  <span className="price-amount">{formatPrice(plan.price, plan.currency)}</span>
                  {plan.duration && (
                    <span className="price-period">
                      {t('admin.membership.planCard.perDuration', {
                        duration: translatedDuration,
                      })}
                    </span>
                  )}
                </div>
              </div>

              <p className="plan-description">{translatedDescription}</p>

              {plan.type === 'company' && plan.companyName && (
                <div className="company-info">
                  <span className="company-tag">🏢 {plan.companyName}</span>
                  {plan.discountPercentage && (
                    <span className="discount-tag">
                      {t('admin.membership.planCard.discount', {
                        discount: plan.discountPercentage,
                      })}
                    </span>
                  )}
                </div>
              )}

              <div className="plan-details">
                {plan.entryLimit && (
                  <div className="detail-item">
                    <span className="detail-label">{t('admin.membership.entryLimit')}:</span>
                    <span className="detail-value">
                      {plan.entryLimit} {t('admin.membership.entries')}
                    </span>
                  </div>
                )}
                {plan.duration && (
                  <div className="detail-item">
                    <span className="detail-label">{t('profile.subscription.duration')}:</span>
                    <span className="detail-value">{translatedDuration}</span>
                  </div>
                )}
              </div>

              <div className="plan-features">
                <h5>{t('admin.membership.planCard.features')}</h5>
                <ul>
                  {plan.features.map((feature, index) => {
                    const translatedFeature = translatePlanFeature(feature);
                    return <li key={index}>{translatedFeature}</li>;
                  })}
                </ul>
              </div>

              {plan.limitations.length > 0 && (
                <div className="plan-limitations">
                  <h5>{t('admin.membership.planCard.limitations')}</h5>
                  <ul>
                    {plan.limitations.map((limitation, index) => {
                      const translatedLimitation = translatePlanLimitation(limitation);
                      return <li key={index}>{translatedLimitation}</li>;
                    })}
                  </ul>
                </div>
              )}

              <div className="plan-status">
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: getStatusColor(plan.isActive ? 'active' : 'inactive'),
                  }}
                >
                  {plan.isActive
                    ? t('profile.subscription.active')
                    : t('profile.subscription.inactive')}
                </span>
              </div>

              <div className="plan-actions">
                <button className="edit-btn" onClick={() => handleEditPlan(plan.id)}>
                  ✏️ {t('admin.membership.edit')}
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
                  {plan.isActive
                    ? `🔒 ${t('admin.membership.deactivate')}`
                    : `🔓 ${t('admin.membership.activate')}`}
                </button>
                <button className="delete-btn" onClick={() => handleDeletePlan(plan.id)}>
                  🗑️ {t('admin.membership.delete')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSubscriptionsTab = () => (
    <div className="tab-content">
      <div className="section-header">
        <h3>{t('admin.membership.subscriptions')}</h3>
        <button className="add-btn" onClick={() => setShowAddSubscriptionModal(true)}>
          ➕ {t('admin.membership.addSubscription')}
        </button>
      </div>

      <div className="subscriptions-list-view">
        {getFilteredSubscriptions().map((subscription) => {
          const daysLeft = calculateDaysLeft(subscription.endDate);
          const daysLeftColor = getDaysLeftColor(daysLeft);
          const isExpanded = expandedSubscriptions.has(subscription.id);
          const translatedPlanName = translatePlanName(subscription.planName);

          return (
            <div
              key={subscription.id}
              className={`subscription-list-item ${isExpanded ? 'expanded' : 'collapsed'}`}
            >
              {/* Clickable Header Row */}
              <div
                className="subscription-list-header"
                onClick={() => toggleSubscription(subscription.id)}
              >
                <div className="expand-icon">{isExpanded ? '▼' : '▶'}</div>

                <div className="header-member-info">
                  <span className="member-name-text">{subscription.memberName}</span>
                  <span className="member-email-text">{subscription.memberEmail}</span>
                </div>

                <div className="header-plan-info">
                  <span className="plan-name-text">{translatedPlanName}</span>
                  {subscription.remainingEntries !== undefined && (
                    <span
                      className="visits-text-inline"
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color:
                          subscription.remainingEntries <= 3
                            ? '#ff6b35'
                            : subscription.remainingEntries <= 6
                            ? '#ffc107'
                            : '#28a745',
                      }}
                    >
                      {subscription.remainingEntries}/{subscription.totalEntries}
                    </span>
                  )}
                </div>

                <div className="header-status-info">
                  <span
                    className="status-badge-mini"
                    style={{ backgroundColor: getStatusColor(subscription.status) }}
                  >
                    {translateStatus(subscription.status)}
                  </span>
                </div>

                <div className="header-countdown-info">
                  {daysLeft !== null && (
                    <span
                      className="countdown-badge-mini"
                      style={{
                        backgroundColor: daysLeftColor,
                        color: '#fff',
                      }}
                    >
                      {getCountdownLabel(daysLeft)}
                    </span>
                  )}
                </div>
              </div>

              {/* Expandable Details Section */}
              {isExpanded && (
                <div className="subscription-expanded-details">
                  <div className="details-grid">
                    <div className="detail-section">
                      <h5>{t('admin.membership.subscriptionsSection.memberInfo')}</h5>
                      <div className="detail-row">
                        <span className="detail-label">{t('admin.membership.name')}:</span>
                        <span className="detail-value">{subscription.memberName}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">{t('admin.membership.email')}:</span>
                        <span className="detail-value">{subscription.memberEmail}</span>
                      </div>
                      {subscription.companyName && (
                        <div className="detail-row">
                          <span className="detail-label">{t('admin.membership.company')}:</span>
                          <span className="detail-value">🏢 {subscription.companyName}</span>
                        </div>
                      )}
                    </div>

                    <div className="detail-section">
                      <h5>{t('admin.membership.subscriptionsSection.subscriptionDetails')}</h5>
                      <div className="detail-row">
                        <span className="detail-label">{t('admin.membership.plan')}:</span>
                        <span className="detail-value">{translatedPlanName}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">{t('profile.subscription.startDate')}:</span>
                        <span className="detail-value">{formatDate(subscription.startDate)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">{t('profile.subscription.endDate')}:</span>
                        <span className="detail-value">
                          {subscription.endDate
                            ? formatDate(subscription.endDate)
                            : t('profile.subscription.ongoing')}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">{t('profile.subscription.status')}:</span>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(subscription.status) }}
                        >
                          {translateStatus(subscription.status)}
                        </span>
                      </div>
                    </div>

                    <div className="detail-section">
                      <h5>{t('admin.membership.subscriptionsSection.usageStats')}</h5>
                      {subscription.remainingEntries !== undefined && (
                        <>
                          <div className="detail-row">
                            <span className="detail-label">
                              {t('admin.membership.totalVisits')}:
                            </span>
                            <span className="detail-value">{subscription.totalEntries}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">
                              {t('admin.membership.remainingVisits')}:
                            </span>
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
                              {subscription.remainingEntries}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">
                              {t('admin.membership.usedVisits')}:
                            </span>
                            <span className="detail-value">
                              {(subscription.totalEntries || 0) - subscription.remainingEntries}
                            </span>
                          </div>
                        </>
                      )}
                      {subscription.nextPaymentDate && (
                        <div className="detail-row">
                          <span className="detail-label">{t('admin.membership.nextPayment')}:</span>
                          <span className="detail-value">
                            {formatDate(subscription.nextPaymentDate)}
                          </span>
                        </div>
                      )}
                      {daysLeft !== null && daysLeft >= 0 && (
                        <div className="detail-row">
                          <span className="detail-label">
                            {t('admin.membership.daysRemaining')}:
                          </span>
                          <span
                            className="detail-value"
                            style={{
                              fontWeight: 'bold',
                              color: daysLeftColor,
                            }}
                          >
                            {t('admin.membership.dayCount', { count: daysLeft })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="subscription-actions">
                    <button
                      className="edit-btn"
                      onClick={() => handleEditSubscription(subscription.id)}
                    >
                      ✏️ {t('admin.membership.edit')}
                    </button>
                    <button
                      className="renew-btn"
                      onClick={() => handleRenewSubscription(subscription.id)}
                    >
                      🔄 {t('admin.membership.renew')}
                    </button>
                    <button
                      className="suspend-btn"
                      onClick={() => handleSuspendSubscription(subscription.id)}
                    >
                      ⏸️ {t('admin.membership.suspend')}
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleCancelSubscription(subscription.id)}
                    >
                      🗑️ {t('admin.membership.cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCompaniesTab = () => (
    <div className="tab-content">
      <div className="section-header">
        <h3>{t('admin.membership.companies')}</h3>
        <button className="add-btn" onClick={() => setShowCreateCompanyModal(true)}>
          ➕ {t('admin.membership.createCompany')}
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
                {translateStatus(company.status)}
              </span>
            </div>

            <div className="company-details">
              <div className="detail-row">
                <span className="detail-icon">👤</span>
                <span className="detail-label">{t('admin.membership.name')}:</span>
                <span className="detail-value">{company.contactPerson}</span>
              </div>
              <div className="detail-row">
                <span className="detail-icon">📧</span>
                <span className="detail-label">{t('admin.membership.email')}:</span>
                <span className="detail-value">{company.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-icon">📱</span>
                <span className="detail-label">{t('admin.membership.phone')}:</span>
                <span className="detail-value">{company.phone}</span>
              </div>
              <div className="detail-row">
                <span className="detail-icon">📍</span>
                <span className="detail-label">{t('admin.membership.address')}:</span>
                <span className="detail-value">{company.address}</span>
              </div>
              <div className="detail-row">
                <span className="detail-icon">💰</span>
                <span className="detail-label">{t('admin.membership.discount')}:</span>
                <span className="detail-value">{company.discountPercentage}%</span>
              </div>
              <div className="detail-row">
                <span className="detail-icon">👥</span>
                <span className="detail-label">{t('admin.membership.employees')}:</span>
                <span className="detail-value">{company.employeeCount}</span>
              </div>
              <div className="detail-row">
                <span className="detail-icon">📊</span>
                <span className="detail-label">{t('admin.membership.activeSubs')}:</span>
                <span className="detail-value">{company.activeSubscriptions}</span>
              </div>
              <div className="detail-row">
                <span className="detail-icon">📅</span>
                <span className="detail-label">{t('admin.membership.contract')}:</span>
                <span className="detail-value">
                  {formatDate(company.contractStartDate)} - {formatDate(company.contractEndDate)}
                </span>
              </div>
            </div>

            <div className="company-actions">
              <button className="edit-btn" onClick={() => handleEditCompany(company.id)}>
                ✏️ {t('admin.membership.edit')}
              </button>
              <button className="contact-btn" onClick={() => handleContactCompany(company)}>
                📞 {t('admin.membership.contact')}
              </button>
              {company.status !== 'active' && (
                <button
                  className="activate-btn"
                  onClick={() => handleToggleCompanyStatus(company.id, 'active')}
                >
                  ✅ {t('admin.membership.activate')}
                </button>
              )}
              {company.status !== 'pending' && (
                <button
                  className="pending-btn"
                  onClick={() => handleToggleCompanyStatus(company.id, 'pending')}
                >
                  ⏳ {t('dashboard.status.pending')}
                </button>
              )}
              {company.status !== 'suspended' && (
                <button
                  className="suspend-btn"
                  onClick={() => handleToggleCompanyStatus(company.id, 'suspended')}
                >
                  ⏸️ {t('admin.membership.suspend')}
                </button>
              )}
              <button className="delete-btn" onClick={() => handleRemoveCompany(company.id)}>
                🗑️ {t('admin.membership.delete')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const stats = getStats();
  const quickActionSteps = [
    t('admin.membership.addSubscriptionModal.quickActions.step1', {
      page: t('admin.membership.labels.memberManagement'),
    }),
    t('admin.membership.addSubscriptionModal.quickActions.step2'),
    t('admin.membership.addSubscriptionModal.quickActions.step3'),
    t('admin.membership.addSubscriptionModal.quickActions.step4'),
    t('admin.membership.addSubscriptionModal.quickActions.step5'),
  ];

  return (
    <div className="membership-manager">
      <div className="membership-header">
        <button className="back-button" onClick={onBack}>
          {t('admin.membership.back')}
        </button>
        <h2 className="membership-title">💳 {t('admin.membership.title')}</h2>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        {canAccessPlans && (
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.totalPlans}</h3>
              <p className="stat-label">{t('admin.membership.plans')}</p>
            </div>
          </div>
        )}
        {canAccessSubscriptions && (
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.activeSubscriptions}</h3>
              <p className="stat-label">{t('admin.membership.subscriptions')}</p>
            </div>
          </div>
        )}
        {canAccessCompanies && (
          <div className="stat-card">
            <div className="stat-icon">🏢</div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.activeCompanies}</h3>
              <p className="stat-label">{t('admin.membership.companies')}</p>
            </div>
          </div>
        )}
        {(canAccessPlans || canAccessSubscriptions) && (
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3 className="stat-number">
                {formatPrice(stats.monthlyRevenue, stats.monthlyRevenueCurrency)}
              </h3>
              <p className="stat-label">{t('admin.membership.stats.monthlyRevenue')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="tabs-navigation">
        {canAccessPlans && (
          <button
            className={`tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
            onClick={() => setActiveTab('plans')}
          >
            📋 {t('admin.membership.plans')}
          </button>
        )}
        {canAccessSubscriptions && (
          <button
            className={`tab-btn ${activeTab === 'subscriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscriptions')}
          >
            📊 {t('admin.membership.subscriptions')}
          </button>
        )}
        {canAccessCompanies && (
          <button
            className={`tab-btn ${activeTab === 'companies' ? 'active' : ''}`}
            onClick={() => setActiveTab('companies')}
          >
            🏢 {t('admin.membership.companies')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-filters">
          <input
            type="text"
            placeholder={t('admin.membership.searchPlaceholder', { tab: activeTab })}
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
              <option value="all">{t('admin.membership.filters.allTypes')}</option>
              <option value="single">{t('admin.membership.singleEntry')}</option>
              <option value="monthly-limited">{t('admin.membership.monthlyLimited')}</option>
              <option value="monthly-unlimited">{t('admin.membership.monthlyUnlimited')}</option>
              <option value="company">{t('admin.membership.filters.companyPlans')}</option>
            </select>
          )}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">{t('admin.membership.filters.allStatus')}</option>
            <option value="active">{t('dashboard.status.active')}</option>
            <option value="inactive">{t('dashboard.status.inactive')}</option>
            {activeTab === 'subscriptions' && (
              <>
                <option value="expired">{t('admin.membership.statusLabels.expired')}</option>
                <option value="suspended">{t('admin.membership.statusLabels.suspended')}</option>
              </>
            )}
            {activeTab === 'companies' && (
              <option value="pending">{t('dashboard.status.pending')}</option>
            )}
          </select>
        </div>
      </div>

      {/* Tab Content */}
      {canAccessPlans && activeTab === 'plans' && renderPlansTab()}
      {canAccessSubscriptions && activeTab === 'subscriptions' && renderSubscriptionsTab()}
      {canAccessCompanies && activeTab === 'companies' && renderCompaniesTab()}

      {/* Access Denied Message */}
      {!canAccessPlans && !canAccessSubscriptions && !canAccessCompanies && (
        <div className="access-denied-message">
          <div className="access-denied-icon">🔒</div>
          <h3>{t('admin.membership.accessDenied')}</h3>
          <p>{t('admin.membership.noPermission')}</p>
          <p>{t('admin.membership.contactAdmin')}</p>
        </div>
      )}

      {/* Create/Edit Plan Modal */}
      {showCreatePlanModal && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h3>
                {editingPlanId
                  ? `✏️ ${t('admin.membership.editPlan')}`
                  : `➕ ${t('admin.membership.createPlan')}`}
              </h3>
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
                  {t('admin.membership.planName')}: <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={newPlan.name || ''}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  placeholder={t('admin.membership.planNamePlaceholder')}
                  className="form-input-large"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    {t('admin.membership.planType')}: <span className="required">*</span>
                  </label>
                  <select
                    value={newPlan.type || 'single'}
                    onChange={(e) => setNewPlan({ ...newPlan, type: e.target.value as any })}
                    className="form-select-large"
                  >
                    <option value="single">{t('admin.membership.singleEntry')}</option>
                    <option value="monthly-limited">{t('admin.membership.monthlyLimited')}</option>
                    <option value="monthly-unlimited">
                      {t('admin.membership.monthlyUnlimited')}
                    </option>
                    <option value="company">{t('admin.membership.companyPlan')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    {t('admin.membership.price')} (AZN): <span className="required">*</span>
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
                <label>{t('admin.membership.description')}:</label>
                <textarea
                  value={newPlan.description || ''}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  placeholder={t('admin.membership.descriptionPlaceholder')}
                  rows={3}
                  className="form-textarea-large"
                />
              </div>

              {newPlan.type === 'monthly-limited' && (
                <div className="form-group">
                  <label>{t('admin.membership.entryLimit')}:</label>
                  <input
                    type="number"
                    value={newPlan.entryLimit || 0}
                    onChange={(e) =>
                      setNewPlan({ ...newPlan, entryLimit: parseInt(e.target.value) })
                    }
                    min="1"
                    className="form-input-large"
                    placeholder={t('admin.membership.entryLimitPlaceholder')}
                  />
                </div>
              )}

              {(newPlan.type === 'monthly-limited' ||
                newPlan.type === 'monthly-unlimited' ||
                newPlan.type === 'company') && (
                <div className="form-group">
                  <label>{t('profile.subscription.duration')}:</label>
                  <input
                    type="text"
                    value={newPlan.duration || ''}
                    onChange={(e) => setNewPlan({ ...newPlan, duration: e.target.value })}
                    placeholder={t('admin.membership.durationPlaceholder')}
                    className="form-input-large"
                  />
                </div>
              )}

              <div className="form-group">
                <label>✅ {t('admin.membership.features')}:</label>
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
                    + {t('admin.membership.addFeature')}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>⚠️ {t('admin.membership.limitations')}:</label>
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
                    + {t('admin.membership.addLimitation')}
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
                    <span>⭐ {t('admin.membership.markPopular')}</span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newPlan.isActive !== false}
                      onChange={(e) => setNewPlan({ ...newPlan, isActive: e.target.checked })}
                    />
                    <span>✅ {t('admin.membership.activePlan')}</span>
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
                ❌ {t('admin.membership.cancel')}
              </button>
              <button className="confirm-btn" onClick={handleCreatePlan}>
                {editingPlanId
                  ? `💾 ${t('admin.membership.savePlan')}`
                  : `➕ ${t('admin.membership.createNewPlan')}`}
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
              <h3>{t('admin.membership.createCompany')}</h3>
              <button className="close-btn" onClick={() => setShowCreateCompanyModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>{t('admin.membership.companyName')}:</label>
                <input
                  type="text"
                  value={newCompany.name || ''}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  placeholder={t('admin.membership.companyName')}
                />
              </div>

              <div className="form-group">
                <label>{t('admin.membership.contactPerson')}:</label>
                <input
                  type="text"
                  value={newCompany.contactPerson || ''}
                  onChange={(e) => setNewCompany({ ...newCompany, contactPerson: e.target.value })}
                  placeholder={t('admin.membership.contactPerson')}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('admin.membership.email')}:</label>
                  <input
                    type="email"
                    value={newCompany.email || ''}
                    onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                    placeholder="company@email.com"
                  />
                </div>

                <div className="form-group">
                  <label>{t('admin.membership.phone')}:</label>
                  <input
                    type="tel"
                    value={newCompany.phone || ''}
                    onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                    placeholder="+994501234567"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t('admin.membership.address')}:</label>
                <textarea
                  value={newCompany.address || ''}
                  onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                  placeholder={t('admin.membership.address')}
                  rows={2}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('admin.membership.employeeCount')}:</label>
                  <input
                    type="number"
                    value={newCompany.employeeCount || 0}
                    onChange={(e) =>
                      setNewCompany({ ...newCompany, employeeCount: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>{t('admin.membership.discountPercentage')} (0-100%):</label>
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
                {t('admin.membership.cancel')}
              </button>
              <button className="confirm-btn" onClick={handleCreateCompany}>
                {t('admin.membership.createCompany')}
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
              <h3>✏️ {t('admin.membership.editSubscription')}</h3>
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
                <label>{t('profile.subscription.startDate')}:</label>
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
                <label>{t('profile.subscription.endDate')}:</label>
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
                  <label>{t('admin.membership.remainingVisits')}:</label>
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
                <label>{t('profile.subscription.status')}:</label>
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
                  <option value="active">✅ {t('profile.subscription.active')}</option>
                  <option value="inactive">❌ {t('profile.subscription.inactive')}</option>
                  <option value="suspended">⏸️ {t('dashboard.status.suspended')}</option>
                  <option value="expired">⏳ {t('admin.membership.expired')}</option>
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
                ❌ {t('admin.membership.cancel')}
              </button>
              <button className="confirm-btn" onClick={handleSaveSubscriptionEdit}>
                💾 {t('admin.membership.saveSubscription')}
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
              <h3>➕ {t('admin.membership.createSubscription')}</h3>
              <button className="close-btn" onClick={() => setShowAddSubscriptionModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="info-box">
                <p>
                  ℹ️ <strong>{t('admin.membership.addSubscriptionModal.info.noteTitle')}</strong>{' '}
                  {t('admin.membership.addSubscriptionModal.info.noteDescription', {
                    page: t('admin.membership.labels.memberManagement'),
                  })}
                </p>
                <p>{t('admin.membership.addSubscriptionModal.info.detail')}</p>
              </div>

              <div className="quick-actions">
                <h4>{t('admin.membership.addSubscriptionModal.quickActions.title')}</h4>
                <ul>
                  {quickActionSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAddSubscriptionModal(false)}>
                {t('common.close')}
              </button>
              <button
                className="confirm-btn"
                onClick={() => {
                  setShowAddSubscriptionModal(false);
                  onBack(); // Go back to Reception dashboard where Member Management is
                }}
              >
                {t('admin.membership.addSubscriptionModal.buttons.goToReception')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipManager;
