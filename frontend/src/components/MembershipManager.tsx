import React, { useState, useEffect } from 'react';
import './MembershipManager.css';

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
  status: 'active' | 'inactive' | 'pending';
}

interface MembershipManagerProps {
  onBack: () => void;
}

const MembershipManager: React.FC<MembershipManagerProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions' | 'companies'>('plans');
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);

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
    discountPercentage: 0
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
    status: 'pending'
  });

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Mock membership plans
    const mockPlans: MembershipPlan[] = [
      {
        id: 'plan1',
        name: 'Single Entry',
        type: 'single',
        price: 10,
        currency: 'AZN',
        description: 'No expiration - Pay and enter gym any time',
        features: [
          'Access to all gym equipment',
          'No time restrictions',
          'Never expires',
          'Perfect for occasional visits'
        ],
        limitations: [
          'Single use only',
          'No class access',
          'No personal training included'
        ],
        isActive: true,
        isPopular: false,
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00'
      },
      {
        id: 'plan2',
        name: 'Monthly - 12 Entries',
        type: 'monthly-limited',
        price: 60,
        currency: 'AZN',
        description: '12 gym entries per month - Great for regular visitors',
        features: [
          'Access to all gym equipment',
          '12 entries per month',
          'Access to group classes',
          'Locker room access',
          'Valid for 30 days'
        ],
        limitations: [
          'Limited to 12 entries per month',
          'Expires after 30 days',
          'No personal training included'
        ],
        duration: '30 days',
        entryLimit: 12,
        isActive: true,
        isPopular: true,
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00'
      },
      {
        id: 'plan3',
        name: 'Monthly - Unlimited Access',
        type: 'monthly-unlimited',
        price: 100,
        currency: 'AZN',
        description: 'Unlimited access during the month dates',
        features: [
          'Unlimited gym access',
          'All group classes included',
          'Pool and sauna access',
          'Locker room access',
          'Guest pass (2 per month)',
          'Personal training consultation'
        ],
        limitations: [
          'Valid for calendar month only',
          'Guest passes limited to 2 per month'
        ],
        duration: '1 month',
        isActive: true,
        isPopular: false,
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00'
      },
      {
        id: 'plan4',
        name: 'TechCorp Partnership',
        type: 'company',
        price: 70,
        currency: 'AZN',
        description: 'Special corporate rate for TechCorp employees',
        features: [
          'Unlimited monthly access',
          'All group classes included',
          'Pool and sauna access',
          'Flexible schedule',
          'Corporate wellness reports'
        ],
        limitations: [
          'Valid only for TechCorp employees',
          'Employment verification required'
        ],
        duration: '1 month',
        isActive: true,
        isPopular: false,
        companyName: 'TechCorp',
        discountPercentage: 30,
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00'
      }
    ];

    // Mock subscriptions
    const mockSubscriptions: Subscription[] = [
      {
        id: 'sub1',
        memberId: 'member1',
        memberName: 'Sarah Johnson',
        memberEmail: 'sarah.johnson@email.com',
        planId: 'plan2',
        planName: 'Monthly - 12 Entries',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        status: 'active',
        remainingEntries: 8,
        totalEntries: 12,
        paymentStatus: 'paid',
        nextPaymentDate: '2024-02-01'
      },
      {
        id: 'sub2',
        memberId: 'member2',
        memberName: 'Mike Thompson',
        memberEmail: 'mike.thompson@email.com',
        planId: 'plan3',
        planName: 'Monthly - Unlimited Access',
        startDate: '2024-01-15',
        endDate: '2024-02-15',
        status: 'active',
        paymentStatus: 'paid',
        nextPaymentDate: '2024-02-15'
      },
      {
        id: 'sub3',
        memberId: 'member3',
        memberName: 'Elena Rodriguez',
        memberEmail: 'elena.rodriguez@email.com',
        planId: 'plan4',
        planName: 'TechCorp Partnership',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        status: 'active',
        paymentStatus: 'paid',
        companyName: 'TechCorp',
        nextPaymentDate: '2024-02-01'
      },
      {
        id: 'sub4',
        memberId: 'member4',
        memberName: 'David Kim',
        memberEmail: 'david.kim@email.com',
        planId: 'plan2',
        planName: 'Monthly - 12 Entries',
        startDate: '2023-12-15',
        endDate: '2024-01-15',
        status: 'expired',
        remainingEntries: 0,
        totalEntries: 12,
        paymentStatus: 'overdue'
      }
    ];

    // Mock companies
    const mockCompanies: Company[] = [
      {
        id: 'comp1',
        name: 'TechCorp',
        contactPerson: 'John Smith',
        email: 'hr@techcorp.com',
        phone: '+994501234567',
        address: '123 Business Street, Baku',
        discountPercentage: 30,
        employeeCount: 150,
        activeSubscriptions: 45,
        contractStartDate: '2024-01-01',
        contractEndDate: '2024-12-31',
        status: 'active'
      },
      {
        id: 'comp2',
        name: 'BuildCorp Construction',
        contactPerson: 'Maria Garcia',
        email: 'maria@buildcorp.az',
        phone: '+994501234568',
        address: '456 Industry Ave, Baku',
        discountPercentage: 25,
        employeeCount: 80,
        activeSubscriptions: 22,
        contractStartDate: '2024-02-01',
        contractEndDate: '2025-01-31',
        status: 'active'
      },
      {
        id: 'comp3',
        name: 'FinanceHub',
        contactPerson: 'Ahmed Aliyev',
        email: 'ahmed@financehub.az',
        phone: '+994501234569',
        address: '789 Finance District, Baku',
        discountPercentage: 20,
        employeeCount: 60,
        activeSubscriptions: 0,
        contractStartDate: '2024-03-01',
        contractEndDate: '2025-02-28',
        status: 'pending'
      }
    ];

    setMembershipPlans(mockPlans);
    setSubscriptions(mockSubscriptions);
    setCompanies(mockCompanies);
  };

  const getFilteredPlans = () => {
    return membershipPlans.filter(plan => {
      const matchesSearch = 
        plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (plan.companyName && plan.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = filterType === 'all' || plan.type === filterType;
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && plan.isActive) ||
        (filterStatus === 'inactive' && !plan.isActive);
      
      return matchesSearch && matchesType && matchesStatus;
    });
  };

  const getFilteredSubscriptions = () => {
    return subscriptions.filter(subscription => {
      const matchesSearch = 
        subscription.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subscription.memberEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subscription.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (subscription.companyName && subscription.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = filterStatus === 'all' || subscription.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredCompanies = () => {
    return companies.filter(company => {
      const matchesSearch = 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || company.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  };

  const handleCreatePlan = () => {
    if (newPlan.name && newPlan.price !== undefined) {
      if (editingPlanId) {
        // Update existing plan
        const updatedPlans = membershipPlans.map(plan => 
          plan.id === editingPlanId 
            ? { ...plan, ...newPlan, updatedAt: new Date().toISOString() } as MembershipPlan
            : plan
        );
        setMembershipPlans(updatedPlans);
        setEditingPlanId(null);
      } else {
        // Create new plan
        const planToAdd: MembershipPlan = {
          ...newPlan,
          id: `plan${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as MembershipPlan;
        setMembershipPlans([...membershipPlans, planToAdd]);
      }
      
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
        discountPercentage: 0
      });
      setShowCreatePlanModal(false);
    }
  };

  const handleCreateCompany = () => {
    if (newCompany.name && newCompany.contactPerson && newCompany.email) {
      if (editingCompanyId) {
        // Update existing company
        const updatedCompanies = companies.map(company => 
          company.id === editingCompanyId 
            ? { ...company, ...newCompany } as Company
            : company
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
          contractEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
        status: 'pending'
      });
      setShowCreateCompanyModal(false);
    }
  };

  const handleEditPlan = (planId: string) => {
    const plan = membershipPlans.find(p => p.id === planId);
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
        discountPercentage: plan.discountPercentage || 0
      });
      setEditingPlanId(planId);
      setShowCreatePlanModal(true);
    }
  };

  const handleDeletePlan = (planId: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      setMembershipPlans(membershipPlans.filter(p => p.id !== planId));
    }
  };

  const handleEditSubscription = (subscriptionId: string) => {
    console.log('Edit subscription:', subscriptionId);
    // Implementation for editing subscription
  };

  const handleRenewSubscription = (subscriptionId: string) => {
    const subscription = subscriptions.find(s => s.id === subscriptionId);
    if (subscription) {
      const updatedSubscriptions = subscriptions.map(s => 
        s.id === subscriptionId 
          ? { ...s, status: 'active' as const, paymentStatus: 'paid' as const } 
          : s
      );
      setSubscriptions(updatedSubscriptions);
    }
  };

  const handleSuspendSubscription = (subscriptionId: string) => {
    const updatedSubscriptions = subscriptions.map(s => 
      s.id === subscriptionId 
        ? { ...s, status: 'suspended' as const } 
        : s
    );
    setSubscriptions(updatedSubscriptions);
  };

  const handleCancelSubscription = (subscriptionId: string) => {
    if (confirm('Are you sure you want to cancel this subscription?')) {
      const updatedSubscriptions = subscriptions.map(s => 
        s.id === subscriptionId 
          ? { ...s, status: 'inactive' as const } 
          : s
      );
      setSubscriptions(updatedSubscriptions);
    }
  };

  const handleEditCompany = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setNewCompany({
        name: company.name,
        contactPerson: company.contactPerson,
        email: company.email,
        phone: company.phone,
        address: company.address,
        discountPercentage: company.discountPercentage,
        employeeCount: company.employeeCount,
        status: company.status
      });
      setEditingCompanyId(companyId);
      setShowCreateCompanyModal(true);
    }
  };

  const handleRemoveCompany = (companyId: string) => {
    if (confirm('Are you sure you want to remove this company?')) {
      setCompanies(companies.filter(c => c.id !== companyId));
    }
  };

  const getStats = () => {
    const totalPlans = membershipPlans.length;
    const activePlans = membershipPlans.filter(p => p.isActive).length;
    const totalSubscriptions = subscriptions.length;
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
    const totalCompanies = companies.length;
    const activeCompanies = companies.filter(c => c.status === 'active').length;
    const monthlyRevenue = subscriptions
      .filter(s => s.status === 'active' && s.paymentStatus === 'paid')
      .reduce((sum, s) => {
        const plan = membershipPlans.find(p => p.id === s.planId);
        return sum + (plan?.price || 0);
      }, 0);

    return {
      totalPlans,
      activePlans,
      totalSubscriptions,
      activeSubscriptions,
      totalCompanies,
      activeCompanies,
      monthlyRevenue
    };
  };

  const formatPrice = (price: number, currency: string) => {
    return `${price} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
      overdue: '#dc3545'
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
        {getFilteredPlans().map(plan => (
          <div key={plan.id} className={`plan-card ${plan.isPopular ? 'popular' : ''}`}>
            {plan.isPopular && (
              <div className="popular-badge">⭐ Most Popular</div>
            )}
            
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
              <button className="edit-btn" onClick={() => handleEditPlan(plan.id)}>✏️ Edit</button>
              <button className="toggle-btn" onClick={() => setMembershipPlans(membershipPlans.map(p => p.id === plan.id ? {...p, isActive: !p.isActive} : p))}>
                {plan.isActive ? '🔒 Deactivate' : '🔓 Activate'}
              </button>
              <button className="delete-btn" onClick={() => handleDeletePlan(plan.id)}>🗑️ Delete</button>
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
        <button className="add-btn">➕ Add Subscription</button>
      </div>

      <div className="subscriptions-list">
        {getFilteredSubscriptions().map(subscription => (
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
                <span 
                  className="payment-badge" 
                  style={{ backgroundColor: getStatusColor(subscription.paymentStatus) }}
                >
                  {subscription.paymentStatus}
                </span>
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
                  {formatDate(subscription.startDate)} - {subscription.endDate ? formatDate(subscription.endDate) : 'Ongoing'}
                </span>
              </div>
              {subscription.remainingEntries !== undefined && (
                <div className="detail-row">
                  <span className="detail-label">Entries:</span>
                  <span className="detail-value">
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
              <button className="edit-btn" onClick={() => handleEditSubscription(subscription.id)}>✏️ Edit</button>
              <button className="renew-btn" onClick={() => handleRenewSubscription(subscription.id)}>🔄 Renew</button>
              <button className="suspend-btn" onClick={() => handleSuspendSubscription(subscription.id)}>⏸️ Suspend</button>
              <button className="delete-btn" onClick={() => handleCancelSubscription(subscription.id)}>🗑️ Cancel</button>
            </div>
          </div>
        ))}
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
        {getFilteredCompanies().map(company => (
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
              <button className="edit-btn" onClick={() => handleEditCompany(company.id)}>✏️ Edit</button>
              <button className="contact-btn" onClick={() => window.open(`mailto:${company.email}`)}>📞 Contact</button>
              <button className="contract-btn" onClick={() => console.log('View contract for:', company.name)}>📄 Contract</button>
              <button className="delete-btn" onClick={() => handleRemoveCompany(company.id)}>🗑️ Remove</button>
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
          <div className="stat-number">{stats.totalPlans}</div>
          <div className="stat-label">Total Plans</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.activeSubscriptions}</div>
          <div className="stat-label">Active Subscriptions</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.activeCompanies}</div>
          <div className="stat-label">Company Partners</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.monthlyRevenue} AZN</div>
          <div className="stat-label">Monthly Revenue</div>
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

      {/* Create Plan Modal */}
      {showCreatePlanModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Membership Plan</h3>
              <button className="close-btn" onClick={() => setShowCreatePlanModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Plan Name:</label>
                <input
                  type="text"
                  value={newPlan.name || ''}
                  onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                  placeholder="Enter plan name"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Plan Type:</label>
                  <select
                    value={newPlan.type || 'single'}
                    onChange={(e) => setNewPlan({...newPlan, type: e.target.value as any})}
                  >
                    <option value="single">Single Entry</option>
                    <option value="monthly-limited">Monthly Limited</option>
                    <option value="monthly-unlimited">Monthly Unlimited</option>
                    <option value="company">Company Plan</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Price (AZN):</label>
                  <input
                    type="number"
                    value={newPlan.price || 0}
                    onChange={(e) => setNewPlan({...newPlan, price: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={newPlan.description || ''}
                  onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                  placeholder="Enter plan description"
                  rows={3}
                />
              </div>
              
              {newPlan.type === 'monthly-limited' && (
                <div className="form-group">
                  <label>Entry Limit:</label>
                  <input
                    type="number"
                    value={newPlan.entryLimit || 0}
                    onChange={(e) => setNewPlan({...newPlan, entryLimit: parseInt(e.target.value)})}
                  />
                </div>
              )}
              
              {(newPlan.type === 'monthly-limited' || newPlan.type === 'monthly-unlimited' || newPlan.type === 'company') && (
                <div className="form-group">
                  <label>Duration:</label>
                  <input
                    type="text"
                    value={newPlan.duration || ''}
                    onChange={(e) => setNewPlan({...newPlan, duration: e.target.value})}
                    placeholder="e.g., 30 days, 1 month"
                  />
                </div>
              )}
              
              <div className="form-group">
                <label>Features (comma-separated):</label>
                <textarea
                  placeholder="e.g., All gym equipment, Group classes, Pool access"
                  onChange={(e) => setNewPlan({
                    ...newPlan, 
                    features: e.target.value.split(',').map(f => f.trim()).filter(f => f)
                  })}
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label>Limitations (comma-separated, optional):</label>
                <textarea
                  placeholder="e.g., No personal training, Limited guest passes"
                  onChange={(e) => setNewPlan({
                    ...newPlan, 
                    limitations: e.target.value.split(',').map(l => l.trim()).filter(l => l)
                  })}
                  rows={2}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newPlan.isPopular || false}
                      onChange={(e) => setNewPlan({...newPlan, isPopular: e.target.checked})}
                    />
                    Mark as Popular
                  </label>
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newPlan.isActive !== false}
                      onChange={(e) => setNewPlan({...newPlan, isActive: e.target.checked})}
                    />
                    Active Plan
                  </label>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowCreatePlanModal(false)}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleCreatePlan}>
                Create Plan
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
                  onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                  placeholder="Enter company name"
                />
              </div>
              
              <div className="form-group">
                <label>Contact Person:</label>
                <input
                  type="text"
                  value={newCompany.contactPerson || ''}
                  onChange={(e) => setNewCompany({...newCompany, contactPerson: e.target.value})}
                  placeholder="Enter contact person name"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={newCompany.email || ''}
                    onChange={(e) => setNewCompany({...newCompany, email: e.target.value})}
                    placeholder="company@email.com"
                  />
                </div>
                
                <div className="form-group">
                  <label>Phone:</label>
                  <input
                    type="tel"
                    value={newCompany.phone || ''}
                    onChange={(e) => setNewCompany({...newCompany, phone: e.target.value})}
                    placeholder="+994501234567"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Address:</label>
                <textarea
                  value={newCompany.address || ''}
                  onChange={(e) => setNewCompany({...newCompany, address: e.target.value})}
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
                    onChange={(e) => setNewCompany({...newCompany, employeeCount: parseInt(e.target.value)})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Discount Percentage:</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newCompany.discountPercentage || 10}
                    onChange={(e) => setNewCompany({...newCompany, discountPercentage: parseInt(e.target.value)})}
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
    </div>
  );
};

export default MembershipManager;