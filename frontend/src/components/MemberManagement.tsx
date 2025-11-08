import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useData, Member } from '../contexts/DataContext';
import { formatDate } from '../utils/dateFormatter';
import './MemberManagement.css';

interface MemberManagementProps {
  onBack: () => void;
}

const MemberManagement: React.FC<MemberManagementProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const {
    members,
    membersLoading,
    membersSaving,
    membersError,
    addMember,
    updateMember,
    deleteMember,
    refreshMembers,
    membershipTypes,
    roles,
  } = useData();

  const [filteredMembers, setFilteredMembers] = useState<Member[]>(members);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterMembershipType, setFilterMembershipType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    membershipType: membershipTypes[0] || 'Single',
    role: 'member' as 'member' | 'instructor' | 'admin' | 'reception' | 'sparta',
    company: '',
    dateOfBirth: '',
  });

  const companies = [
    'TechCorp',
    'Innovation Labs',
    'Digital Solutions',
    'StartupHub',
    'CodeFactory',
  ];

  const countries = [
    { code: '+994', flag: '🇦🇿', name: 'Azerbaijan' },
    { code: '+1', flag: '🇺🇸', name: 'United States' },
    { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
    { code: '+49', flag: '🇩🇪', name: 'Germany' },
    { code: '+33', flag: '🇫🇷', name: 'France' },
    { code: '+90', flag: '🇹🇷', name: 'Turkey' },
    { code: '+7', flag: '🇷🇺', name: 'Russia' },
    { code: '+39', flag: '🇮🇹', name: 'Italy' },
    { code: '+34', flag: '🇪🇸', name: 'Spain' },
    { code: '+31', flag: '🇳🇱', name: 'Netherlands' },
  ];

  const [selectedCountry, setSelectedCountry] = useState(countries[0]);

  // Translation helper functions for dynamic values
  const translateRole = (role: string): string => {
    const roleMap: Record<string, string> = {
      member: t('admin.memberManagement.roles.member'),
      instructor: t('admin.memberManagement.roles.instructor'),
      admin: t('admin.memberManagement.roles.admin'),
      reception: t('admin.memberManagement.roles.reception'),
      sparta: t('admin.memberManagement.roles.sparta'),
    };
    return roleMap[role.toLowerCase()] || role;
  };

  const translateStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      active: t('admin.memberManagement.status.active'),
      inactive: t('admin.memberManagement.status.inactive'),
      suspended: t('admin.memberManagement.status.suspended'),
    };
    return statusMap[status.toLowerCase()] || status;
  };

  const translateMembershipType = (type: string): string => {
    // Normalize the membership type (remove dashes, lowercase, trim)
    const normalized = type.replace(/[–—−]/g, '-').replace(/\s+/g, ' ').trim().toLowerCase();

    const membershipMap: Record<string, string> = {
      'monthly unlimited': t('admin.membership.planNames.monthlyUnlimited'),
      'monthly limited': t('admin.membership.planNames.monthlyLimited'),
      'single session': t('admin.membership.planNames.singleSession'),
      single: t('admin.membership.planNames.singleSession'),
    };
    return membershipMap[normalized] || type;
  };

  const translateGender = (gender: string): string => {
    if (!gender) return '';
    const genderMap: Record<string, string> = {
      male: t('admin.memberManagement.gender.male'),
      female: t('admin.memberManagement.gender.female'),
      other: t('admin.memberManagement.gender.other'),
    };
    return genderMap[gender.toLowerCase()] || gender;
  };

  React.useEffect(() => {
    refreshMembers().catch((error) => console.error('Failed to refresh members:', error));
  }, [refreshMembers]);

  React.useEffect(() => {
    let filtered = members;

    // Filter by role
    if (filterRole !== 'all') {
      filtered = filtered.filter((member) => member.role === filterRole);
    }

    // Filter by membership type
    if (filterMembershipType !== 'all') {
      filtered = filtered.filter((member) => member.membershipType === filterMembershipType);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((member) => member.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (member) =>
          `${member.firstName} ${member.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.phone.includes(searchTerm) ||
          (member.company && member.company.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    setFilteredMembers(filtered);
  }, [filterRole, filterMembershipType, filterStatus, searchTerm, members]);

  const showToast = (message: string, duration: number = 3000) => {
    setConfirmationMessage(message);
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), duration);
  };

  const handleAddMember = async () => {
    const isEditing = selectedMember !== null;
    setFormError(null);

    // Check for duplicates (exclude current member when editing)
    const isDuplicateEmail = members.some(
      (member) =>
        member.email.toLowerCase() === newMember.email.toLowerCase() &&
        (!isEditing || member.id !== selectedMember?.id),
    );
    const formattedPhoneForCheck = `${selectedCountry.flag} ${selectedCountry.code} ${newMember.phone}`;
    const isDuplicatePhone = members.some(
      (member) =>
        member.phone === formattedPhoneForCheck && (!isEditing || member.id !== selectedMember?.id),
    );
    const isDuplicateName = members.some(
      (member) =>
        member.firstName.toLowerCase() === newMember.firstName.toLowerCase() &&
        member.lastName.toLowerCase() === newMember.lastName.toLowerCase() &&
        (!isEditing || member.id !== selectedMember?.id),
    );

    if (isDuplicateEmail) {
      showToast('❌ Email address already exists!');
      return;
    }

    if (isDuplicatePhone) {
      showToast('❌ Phone number already exists!');
      return;
    }

    if (isDuplicateName) {
      showToast('❌ Member with same name already exists!');
      return;
    }

    // Format phone number with flag and country code
    const formattedPhone = `${selectedCountry.flag} ${selectedCountry.code} ${newMember.phone}`;

    try {
      if (isEditing && selectedMember) {
        await updateMember(selectedMember.id, {
          firstName: newMember.firstName,
          lastName: newMember.lastName,
          email: newMember.email,
          phone: formattedPhone,
          role: newMember.role,
          membershipType: newMember.membershipType,
          company: newMember.company || undefined,
          dateOfBirth: newMember.dateOfBirth || undefined,
        });
        showToast('✅ Member updated successfully!');
      } else {
        const result = await addMember({
          firstName: newMember.firstName,
          lastName: newMember.lastName,
          email: newMember.email,
          phone: formattedPhone,
          membershipType: newMember.membershipType,
          // Don't set status - let backend handle it
          // Members will be 'pending' until they complete registration
          // Staff (instructor, reception, sparta, admin) will be 'active' immediately
          role: newMember.role,
          company: newMember.company || undefined,
          dateOfBirth: newMember.dateOfBirth || undefined,
        });

        // Check invitation email status
        if ((result as any).invitationStatus === 'created_but_email_failed') {
          if ((result as any).isTestModeRestriction) {
            showToast(
              '⚠️ Member added, but invitation email NOT sent. Email service is in test mode and can only send to vikingshammerxfit@gmail.com. Please verify your domain at resend.com/domains to send to all members.',
              8000,
            );
          } else {
            showToast(
              '⚠️ Member added, but invitation email failed to send. Please check email configuration.',
              5000,
            );
          }
        } else if ((result as any).invitationStatus === 'failed') {
          showToast(
            '⚠️ Member added, but invitation system failed. Member may need manual onboarding.',
            5000,
          );
        } else {
          showToast('✅ Member added successfully and invitation email sent!');
        }
      }

      await refreshMembers();

      setNewMember({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        membershipType: membershipTypes[0] || 'Single',
        role: 'member',
        company: '',
        dateOfBirth: '',
      });
      setSelectedCountry(countries[0]);
      setSelectedMember(null);
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to save member:', error);
      const message = error instanceof Error ? error.message : 'Failed to save member';
      setFormError(message);
      showToast(`❌ ${message}`);
    }
  };

  const toggleMemberExpansion = (memberId: string) => {
    const newExpanded = new Set(expandedMembers);
    if (newExpanded.has(memberId)) {
      newExpanded.delete(memberId);
    } else {
      newExpanded.add(memberId);
    }
    setExpandedMembers(newExpanded);
  };

  const handleEditMember = (member: Member) => {
    setFormError(null);
    setSelectedMember(member);

    // Extract country code and phone number from formatted phone
    const phoneMatch = member.phone.match(/(\+\d+)\s+(.+)/);
    const countryCode = phoneMatch ? phoneMatch[1] : '+994';
    const phoneNumber = phoneMatch ? phoneMatch[2] : '';
    const country = countries.find((c) => c.code === countryCode) || countries[0];
    setSelectedCountry(country);

    setNewMember({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: phoneNumber, // Store only the number part for editing
      membershipType: member.membershipType,
      role: member.role,
      company: member.company || '',
      dateOfBirth: member.dateOfBirth || '',
    });
    setShowAddForm(true);
  };

  const handleDeleteMember = async (member: Member) => {
    setMemberToDelete(member);
    setShowDeleteModal(true);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;

    try {
      await deleteMember(memberToDelete.id);
      await refreshMembers();
      showToast(`✅ ${t('admin.memberManagement.deleteSuccess')}`);
      setShowDeleteModal(false);
      setMemberToDelete(null);
    } catch (error) {
      console.error('Failed to delete member:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete member';
      setFormError(message);
      showToast(`❌ ${message}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return '👑';
      case 'instructor':
        return '🏋️‍♂️';
      default:
        return '👤';
    }
  };

  return (
    <div className="member-management">
      {showConfirmation && <div className="confirmation-message">{confirmationMessage}</div>}

      <div className="page-header">
        <div className="page-title">
          <h2>🛡️ {t('admin.memberManagement.pageTitle')}</h2>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={onBack}
            title={t('admin.memberManagement.returnTooltip')}
          >
            🏠 {t('admin.memberManagement.returnButton')}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setFormError(null);
              setSelectedMember(null);
              setNewMember({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                membershipType: membershipTypes[0] || 'Single',
                role: 'member',
                company: '',
                dateOfBirth: '',
              });
              setSelectedCountry(countries[0]);
              setShowAddForm(true);
            }}
            title={t('admin.memberManagement.addTooltip')}
          >
            ➕ {t('admin.memberManagement.addButton')}
          </button>
        </div>
      </div>

      {membersError && <div className="confirmation-message">❌ {membersError}</div>}
      {membersLoading && (
        <div className="confirmation-message">🔄 {t('admin.memberManagement.loading')}</div>
      )}

      <div className="management-controls">
        <div className="top-controls">
          <div className="stats-summary stats-compact">
            <div className="stat-item">
              <div className="stat-box">
                <span className="stat-number">{filteredMembers.length}</span>
              </div>
              <span className="stat-label">
                {searchTerm ||
                filterRole !== 'all' ||
                filterMembershipType !== 'all' ||
                filterStatus !== 'all'
                  ? t('admin.memberManagement.stats.found')
                  : t('admin.memberManagement.stats.total')}
              </span>
            </div>
            <div className="stat-item">
              <div className="stat-box">
                <span className="stat-number">
                  {filteredMembers.filter((m) => m.status === 'active').length}
                </span>
              </div>
              <span className="stat-label">{t('admin.memberManagement.stats.active')}</span>
            </div>
            <div className="stat-item">
              <div className="stat-box">
                <span className="stat-number">
                  {filteredMembers.filter((m) => m.role === 'instructor').length}
                </span>
              </div>
              <span className="stat-label">{t('admin.memberManagement.stats.instructors')}</span>
            </div>
            <div className="stat-item">
              <div className="stat-box">
                <span className="stat-number">
                  {filteredMembers.filter((m) => m.role === 'member').length}
                </span>
              </div>
              <span className="stat-label">{t('admin.memberManagement.stats.members')}</span>
            </div>
          </div>

          <div className="search-row">
            <div className="search-section">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder={t('admin.memberManagement.search.placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button
                    className="clear-search"
                    onClick={() => setSearchTerm('')}
                    title={t('admin.memberManagement.search.clearTooltip')}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="filters-row">
            <div className="filters-section">
              <div className="filter-group">
                <label>{t('admin.memberManagement.filters.roleLabel')}</label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">{t('admin.memberManagement.filters.allRoles')}</option>
                  <option value="member">{t('admin.memberManagement.filters.members')}</option>
                  <option value="instructor">
                    {t('admin.memberManagement.filters.instructors')}
                  </option>
                  <option value="reception">{t('admin.memberManagement.filters.reception')}</option>
                  <option value="sparta">{t('admin.memberManagement.filters.sparta')}</option>
                  <option value="admin">{t('admin.memberManagement.filters.admin')}</option>
                </select>
              </div>

              <div className="filter-group">
                <label>{t('admin.memberManagement.filters.membershipLabel')}</label>
                <select
                  value={filterMembershipType}
                  onChange={(e) => setFilterMembershipType(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">{t('admin.memberManagement.filters.allTypes')}</option>
                  <option value="Single">{t('admin.memberManagement.filters.single')}</option>
                  <option value="Monthly">{t('admin.memberManagement.filters.monthly')}</option>
                  <option value="Monthly Unlimited">
                    {t('admin.memberManagement.filters.unlimited')}
                  </option>
                  <option value="Company">{t('admin.memberManagement.filters.company')}</option>
                </select>
              </div>

              <div className="filter-group">
                <label>{t('admin.memberManagement.filters.statusLabel')}</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">{t('admin.memberManagement.filters.allStatus')}</option>
                  <option value="active">{t('admin.memberManagement.filters.active')}</option>
                  <option value="inactive">{t('admin.memberManagement.filters.inactive')}</option>
                  <option value="pending">{t('admin.memberManagement.filters.pending')}</option>
                </select>
              </div>

              <button
                className="btn btn-outline btn-xs clear-filters"
                onClick={() => {
                  setFilterRole('all');
                  setFilterMembershipType('all');
                  setFilterStatus('all');
                  setSearchTerm('');
                }}
                title={t('admin.memberManagement.filters.clearTooltip')}
              >
                🗑️ {t('admin.memberManagement.filters.clearButton')}
              </button>
            </div>

            <div className="view-toggle">
              <button
                className={`toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
                onClick={() => setViewMode('card')}
              >
                <span className="toggle-icon" aria-hidden="true">
                  📋
                </span>
                <span className="toggle-label">{t('admin.memberManagement.viewToggle.cards')}</span>
              </button>
              <button
                className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <span className="toggle-icon" aria-hidden="true">
                  📊
                </span>
                <span className="toggle-label">{t('admin.memberManagement.viewToggle.list')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`members-container ${viewMode}`}>
        {viewMode === 'card' ? (
          <div className="members-grid">
            {filteredMembers.map((member) => (
              <div key={member.id} className="member-card">
                <div className="member-header">
                  <div className="member-avatar">
                    <span>
                      {member.firstName.charAt(0)}
                      {member.lastName.charAt(0)}
                    </span>
                    <div className="role-badge">{getRoleIcon(member.role)}</div>
                  </div>
                  <div className="member-info">
                    <h3>
                      {member.firstName} {member.lastName}
                    </h3>
                    <p>{member.email}</p>
                    <div className={`status-badge ${getStatusColor(member.status)}`}>
                      {translateStatus(member.status)}
                    </div>
                  </div>
                  <button
                    className="expand-btn"
                    onClick={() => toggleMemberExpansion(member.id)}
                    title={
                      expandedMembers.has(member.id)
                        ? t('admin.memberManagement.card.collapseTooltip')
                        : t('admin.memberManagement.card.expandTooltip')
                    }
                  >
                    {expandedMembers.has(member.id) ? '−' : '+'}
                  </button>
                </div>

                {expandedMembers.has(member.id) && (
                  <div className="member-details">
                    <div className="detail-row">
                      <span className="label">
                        📧 {t('admin.memberManagement.card.emailLabel')}
                      </span>
                      <span className="value">{member.email}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">
                        📞 {t('admin.memberManagement.card.phoneLabel')}
                      </span>
                      <span className="value">{member.phone}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">
                        💎 {t('admin.memberManagement.card.membershipLabel')}
                      </span>
                      <span className="value">
                        {translateMembershipType(member.membershipType)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">👤 {t('admin.memberManagement.card.roleLabel')}</span>
                      <span className="value">{translateRole(member.role)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">
                        📅 {t('admin.memberManagement.card.joinDateLabel')}
                      </span>
                      <span className="value">{formatDate(member.joinDate)}</span>
                    </div>
                    {member.dateOfBirth && (
                      <div className="detail-row">
                        <span className="label">
                          🎂 {t('admin.memberManagement.card.dateOfBirthLabel')}
                        </span>
                        <span className="value">{formatDate(member.dateOfBirth)}</span>
                      </div>
                    )}
                    {member.gender && (
                      <div className="detail-row">
                        <span className="label">
                          ⚧ {t('admin.memberManagement.card.genderLabel')}
                        </span>
                        <span className="value">{translateGender(member.gender)}</span>
                      </div>
                    )}
                    {member.lastCheckIn && (
                      <div className="detail-row">
                        <span className="label">
                          ✅ {t('admin.memberManagement.card.lastCheckInLabel')}
                        </span>
                        <span className="value">{formatDate(member.lastCheckIn)}</span>
                      </div>
                    )}
                    {member.company && (
                      <div className="detail-row">
                        <span className="label">
                          🏢 {t('admin.memberManagement.card.companyLabel')}
                        </span>
                        <span className="value">{member.company}</span>
                      </div>
                    )}
                    {member.emergencyContact && (
                      <div className="detail-row">
                        <span className="label">
                          🚨 {t('admin.memberManagement.card.emergencyContactLabel')}
                        </span>
                        <span className="value">{member.emergencyContact}</span>
                      </div>
                    )}
                    {member.address && (
                      <div className="detail-row">
                        <span className="label">
                          🏠 {t('admin.memberManagement.card.addressLabel')}
                        </span>
                        <span className="value">{member.address}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="member-actions">
                  <button
                    className="btn btn-outline btn-xs"
                    onClick={() => handleEditMember(member)}
                    title={t('admin.memberManagement.card.editTooltip')}
                  >
                    <span className="btn-icon" aria-hidden="true">
                      ✏️
                    </span>
                    <span className="btn-label">{t('admin.memberManagement.card.editButton')}</span>
                  </button>
                  <button
                    className="btn btn-danger btn-xs"
                    onClick={() => handleDeleteMember(member)}
                    title={t('admin.memberManagement.card.deleteTooltip')}
                  >
                    <span className="btn-icon" aria-hidden="true">
                      🗑️
                    </span>
                    <span className="btn-label">
                      {t('admin.memberManagement.card.deleteButton')}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="members-list">
            {filteredMembers.map((member) => {
              const isExpanded = expandedMembers.has(member.id);

              return (
                <div
                  key={member.id}
                  className={`member-list-item ${isExpanded ? 'expanded' : 'collapsed'}`}
                >
                  {/* Clickable Header Row */}
                  <div
                    className="member-list-header"
                    onClick={() => toggleMemberExpansion(member.id)}
                  >
                    <div className="expand-icon">{isExpanded ? '▼' : '▶'}</div>

                    <div className="header-member-info">
                      <div className="member-name-row">
                        <span className="avatar-sm">
                          {member.firstName.charAt(0)}
                          {member.lastName.charAt(0)}
                        </span>
                        <div className="name-email-container">
                          <span className="member-name-text">
                            {member.firstName} {member.lastName}
                          </span>
                          <span className="member-email-text">{member.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="header-membership-info">
                      <span className="membership-type-text">
                        {translateMembershipType(member.membershipType)}
                      </span>
                    </div>

                    <div className="header-contact-info">
                      <span className="phone-text">{member.phone}</span>
                    </div>

                    <div className="header-role-info">
                      <span className="role-indicator">
                        {getRoleIcon(member.role)} {translateRole(member.role)}
                      </span>
                    </div>

                    <div className="header-status-info">
                      <span className={`status-badge-mini ${getStatusColor(member.status)}`}>
                        {translateStatus(member.status)}
                      </span>
                    </div>
                  </div>

                  {/* Expandable Details Section */}
                  {isExpanded && (
                    <div className="member-expanded-details">
                      <div className="details-grid">
                        <div className="detail-section">
                          <h5>{t('admin.memberManagement.card.personalInfo')}</h5>
                          <div className="detail-row">
                            <span className="detail-label">
                              📧 {t('admin.memberManagement.card.emailLabel')}
                            </span>
                            <span className="detail-value">{member.email}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">
                              📞 {t('admin.memberManagement.card.phoneLabel')}
                            </span>
                            <span className="detail-value">{member.phone}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">
                              💎 {t('admin.memberManagement.card.membershipLabel')}
                            </span>
                            <span className="detail-value">{member.membershipType}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">
                              � {t('admin.memberManagement.card.joinDateLabel')}
                            </span>
                            <span className="detail-value">{formatDate(member.joinDate)}</span>
                          </div>
                          {member.dateOfBirth && (
                            <div className="detail-row">
                              <span className="detail-label">
                                🎂 {t('admin.memberManagement.card.dateOfBirthLabel')}
                              </span>
                              <span className="detail-value">{formatDate(member.dateOfBirth)}</span>
                            </div>
                          )}
                          {member.gender && (
                            <div className="detail-row">
                              <span className="detail-label">
                                ⚧ {t('admin.memberManagement.card.genderLabel')}
                              </span>
                              <span className="detail-value">{member.gender}</span>
                            </div>
                          )}
                        </div>

                        <div className="detail-section">
                          <h5>{t('admin.memberManagement.card.additionalInfo')}</h5>
                          <div className="detail-row">
                            <span className="detail-value">
                              {translateMembershipType(member.membershipType)}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">
                              � {t('admin.memberManagement.card.joinDateLabel')}
                            </span>
                            <span className="detail-value">{formatDate(member.joinDate)}</span>
                          </div>
                          {member.dateOfBirth && (
                            <div className="detail-row">
                              <span className="detail-label">
                                🎂 {t('admin.memberManagement.card.dateOfBirthLabel')}
                              </span>
                              <span className="detail-value">{formatDate(member.dateOfBirth)}</span>
                            </div>
                          )}
                          {member.gender && (
                            <div className="detail-row">
                              <span className="detail-label">
                                ⚧ {t('admin.memberManagement.card.genderLabel')}
                              </span>
                              <span className="detail-value">{translateGender(member.gender)}</span>
                            </div>
                          )}
                        </div>

                        <div className="detail-section">
                          <h5>{t('admin.memberManagement.card.additionalInfo')}</h5>
                          <div className="detail-row">
                            <span className="detail-label">
                              👤 {t('admin.memberManagement.card.roleLabel')}
                            </span>
                            <span className="detail-value">
                              {getRoleIcon(member.role)} {translateRole(member.role)}
                            </span>
                          </div>
                          {member.lastCheckIn && (
                            <div className="detail-row">
                              <span className="detail-label">
                                ✅ {t('admin.memberManagement.card.lastCheckInLabel')}
                              </span>
                              <span className="detail-value">{formatDate(member.lastCheckIn)}</span>
                            </div>
                          )}
                          {member.company && (
                            <div className="detail-row">
                              <span className="detail-label">
                                🏢 {t('admin.memberManagement.card.companyLabel')}
                              </span>
                              <span className="detail-value">{member.company}</span>
                            </div>
                          )}
                          {member.emergencyContact && (
                            <div className="detail-row">
                              <span className="detail-label">
                                🚨 {t('admin.memberManagement.card.emergencyContactLabel')}
                              </span>
                              <span className="detail-value">{member.emergencyContact}</span>
                            </div>
                          )}
                          {member.address && (
                            <div className="detail-row">
                              <span className="detail-label">
                                🏠 {t('admin.memberManagement.card.addressLabel')}
                              </span>
                              <span className="detail-value">{member.address}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="member-actions-expanded">
                        <button
                          className="edit-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditMember(member);
                          }}
                        >
                          ✏️ {t('admin.memberManagement.card.editButton')}
                        </button>
                        <button
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMember(member);
                          }}
                        >
                          🗑️ {t('admin.memberManagement.card.deleteButton')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {selectedMember
                  ? `⚔️ ${t('admin.memberManagement.modal.editTitle')}`
                  : `🛡️ ${t('admin.memberManagement.modal.addTitle')}`}
              </h3>
              <button
                className="close-btn"
                onClick={() => {
                  setFormError(null);
                  setShowAddForm(false);
                }}
              >
                {t('admin.memberManagement.modal.closeButton')}
              </button>
            </div>

            {formError && <div className="confirmation-message">❌ {formError}</div>}

            <div className="form-grid">
              <div className="form-group">
                <label>{t('admin.memberManagement.modal.form.firstNameLabel')}</label>
                <input
                  type="text"
                  value={newMember.firstName}
                  onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                  placeholder={t('admin.memberManagement.modal.form.firstNamePlaceholder')}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>{t('admin.memberManagement.modal.form.lastNameLabel')}</label>
                <input
                  type="text"
                  value={newMember.lastName}
                  onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                  placeholder={t('admin.memberManagement.modal.form.lastNamePlaceholder')}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>{t('admin.memberManagement.modal.form.emailLabel')}</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder={t('admin.memberManagement.modal.form.emailPlaceholder')}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>{t('admin.memberManagement.modal.form.phoneLabel')}</label>
                <div className="phone-input-group">
                  <select
                    value={selectedCountry.code}
                    onChange={(e) => {
                      const country =
                        countries.find((c) => c.code === e.target.value) || countries[0];
                      setSelectedCountry(country);
                    }}
                    className="country-code-select"
                  >
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newMember.phone}
                    onChange={(e) =>
                      setNewMember({
                        ...newMember,
                        phone: e.target.value,
                      })
                    }
                    placeholder={t('admin.memberManagement.modal.form.phonePlaceholder')}
                    className="form-input phone-number-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>{t('admin.memberManagement.modal.form.membershipLabel')}</label>
                <select
                  value={newMember.membershipType}
                  onChange={(e) => setNewMember({ ...newMember, membershipType: e.target.value })}
                  className="form-select"
                >
                  {membershipTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{t('admin.memberManagement.modal.form.roleLabel')}</label>
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value as any })}
                  className="form-select"
                >
                  <option value="member">
                    {t('admin.memberManagement.modal.form.roleMember')}
                  </option>
                  <option value="reception">
                    {t('admin.memberManagement.modal.form.roleReception')}
                  </option>
                  <option value="instructor">
                    {t('admin.memberManagement.modal.form.roleInstructor')}
                  </option>
                  <option value="sparta">
                    {t('admin.memberManagement.modal.form.roleSpartaOption')}
                  </option>
                  <option value="admin">{t('admin.memberManagement.modal.form.roleAdmin')}</option>
                </select>
              </div>
              <div className="form-group">
                <label>📅 {t('admin.memberManagement.modal.form.dateOfBirthLabel')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="date"
                    value={newMember.dateOfBirth}
                    onChange={(e) => setNewMember({ ...newMember, dateOfBirth: e.target.value })}
                    className="form-input"
                    style={{ paddingLeft: '40px' }}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '18px',
                      pointerEvents: 'none',
                      color: '#666',
                    }}
                  >
                    📅
                  </span>
                </div>
                {newMember.dateOfBirth && (
                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '14px',
                      color: '#666',
                      fontStyle: 'italic',
                    }}
                  >
                    {t('admin.memberManagement.modal.form.datePreview')}{' '}
                    {formatDate(newMember.dateOfBirth)}
                  </div>
                )}
              </div>
              {newMember.role === 'member' && (
                <div className="form-group">
                  <label>{t('admin.memberManagement.modal.form.companyLabel')}</label>
                  <select
                    value={newMember.company}
                    onChange={(e) => setNewMember({ ...newMember, company: e.target.value })}
                    className="form-select"
                  >
                    <option value="">{t('admin.memberManagement.modal.form.noCompany')}</option>
                    {companies.map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedMember(null);
                  setSelectedCountry(countries[0]);
                  setNewMember({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    membershipType: membershipTypes[0] || 'Single',
                    role: 'member',
                    company: '',
                    dateOfBirth: '',
                  });
                }}
              >
                ❌ {t('admin.memberManagement.modal.actions.cancelButton')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddMember}
                disabled={membersSaving}
              >
                {membersSaving
                  ? `🔄 ${t('admin.memberManagement.modal.actions.working')}`
                  : selectedMember
                  ? `⚡ ${t('admin.memberManagement.modal.actions.updateButton')}`
                  : `🛡️ ${t('admin.memberManagement.modal.actions.addButton')}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && memberToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>⚠️ {t('admin.memberManagement.deleteModal.title')}</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowDeleteModal(false);
                  setMemberToDelete(null);
                }}
              >
                {t('admin.memberManagement.modal.closeButton')}
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '16px', marginBottom: '20px' }}>
                {t('admin.memberManagement.deleteModal.message', {
                  name: `${memberToDelete.firstName} ${memberToDelete.lastName}`,
                })}
              </p>
              <div
                className="member-card"
                style={{ marginBottom: '20px', border: '2px solid #ff4444' }}
              >
                <div className="member-header">
                  <div className="member-avatar">
                    <span>
                      {memberToDelete.firstName.charAt(0)}
                      {memberToDelete.lastName.charAt(0)}
                    </span>
                  </div>
                  <div className="member-info">
                    <h3>
                      {memberToDelete.firstName} {memberToDelete.lastName}
                    </h3>
                    <p>{memberToDelete.email}</p>
                    <p>{memberToDelete.phone}</p>
                  </div>
                </div>
              </div>
              <p style={{ color: '#ff4444', fontWeight: 'bold', marginBottom: '20px' }}>
                {t('admin.memberManagement.deleteModal.warning')}
              </p>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setMemberToDelete(null);
                }}
              >
                ❌ {t('admin.memberManagement.deleteModal.cancel')}
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmDeleteMember}
                disabled={membersSaving}
              >
                {membersSaving
                  ? `🔄 ${t('admin.memberManagement.modal.actions.working')}`
                  : `🗑️ ${t('admin.memberManagement.deleteModal.confirm')}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManagement;
