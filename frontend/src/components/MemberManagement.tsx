import React, { useState } from 'react';
import { useData, Member } from '../contexts/DataContext';
import './MemberManagement.css';

interface MemberManagementProps {
  onBack: () => void;
}

const MemberManagement: React.FC<MemberManagementProps> = ({ onBack }) => {
  const { members, addMember, updateMember, deleteMember } = useData();

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

  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    membershipType: 'Single',
    role: 'member' as 'member' | 'instructor' | 'admin',
    company: '',
  });

  const membershipTypes = ['Single', 'Monthly', 'Monthly Unlimited', 'Company'];

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

  const handleAddMember = () => {
    const isEditing = selectedMember !== null;

    // Check for duplicates (exclude current member when editing)
    const isDuplicateEmail = members.some(
      (member) =>
        member.email.toLowerCase() === newMember.email.toLowerCase() &&
        (!isEditing || member.id !== selectedMember.id),
    );
    const formattedPhoneForCheck = `${selectedCountry.flag} ${selectedCountry.code} ${newMember.phone}`;
    const isDuplicatePhone = members.some(
      (member) =>
        member.phone === formattedPhoneForCheck && (!isEditing || member.id !== selectedMember.id),
    );
    const isDuplicateName = members.some(
      (member) =>
        member.firstName.toLowerCase() === newMember.firstName.toLowerCase() &&
        member.lastName.toLowerCase() === newMember.lastName.toLowerCase() &&
        (!isEditing || member.id !== selectedMember.id),
    );

    if (isDuplicateEmail) {
      setConfirmationMessage('❌ Email address already exists!');
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000);
      return;
    }

    if (isDuplicatePhone) {
      setConfirmationMessage('❌ Phone number already exists!');
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000);
      return;
    }

    if (isDuplicateName) {
      setConfirmationMessage('❌ Member with same name already exists!');
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000);
      return;
    }

    // Format phone number with flag and country code
    const formattedPhone = `${selectedCountry.flag} ${selectedCountry.code} ${newMember.phone}`;
    
    if (isEditing) {
      // Update existing member
      updateMember(selectedMember.id, { ...newMember, phone: formattedPhone });
      setConfirmationMessage('✅ Member updated successfully!');
    } else {
      // Add new member
      const memberData = {
        ...newMember,
        phone: formattedPhone,
        status: 'active' as 'active',
        joinDate: new Date().toISOString().split('T')[0],
      };
      addMember(memberData);
      setConfirmationMessage('✅ Member added successfully!');
    }

    // Show success message
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);

    // Reset form
    setNewMember({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      membershipType: 'Single',
      role: 'member',
      company: '',
    });
    setSelectedCountry(countries[0]);
    setSelectedMember(null);
    setShowAddForm(false);
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
    setSelectedMember(member);
    
    // Extract country code and phone number from formatted phone
    const phoneMatch = member.phone.match(/(\+\d+)\s+(.+)/);
    const countryCode = phoneMatch ? phoneMatch[1] : '+994';
    const phoneNumber = phoneMatch ? phoneMatch[2] : '';
    const country = countries.find(c => c.code === countryCode) || countries[0];
    setSelectedCountry(country);
    
    setNewMember({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: phoneNumber, // Store only the number part for editing
      membershipType: member.membershipType,
      role: member.role,
      company: member.company || '',
    });
    setShowAddForm(true);
  };

  const handleDeleteMember = (member: Member) => {
    if (window.confirm(`Are you sure you want to delete ${member.firstName} ${member.lastName}?`)) {
      deleteMember(member.id);
      setConfirmationMessage('✅ Member deleted successfully!');
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000);
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
          <h2>🛡️ Viking Hammer Member Management</h2>
          <p>Manage Viking Army members, instructors, and administrators</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            ⚔️ Add Viking
          </button>
          <button className="btn btn-secondary" onClick={onBack}>
            🏠 Dashboard
          </button>
        </div>
      </div>

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
                  ? 'Found'
                  : 'Total'}
              </span>
            </div>
            <div className="stat-item">
              <div className="stat-box">
                <span className="stat-number">
                  {filteredMembers.filter((m) => m.status === 'active').length}
                </span>
              </div>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat-item">
              <div className="stat-box">
                <span className="stat-number">
                  {filteredMembers.filter((m) => m.role === 'instructor').length}
                </span>
              </div>
              <span className="stat-label">Warriors</span>
            </div>
            <div className="stat-item">
              <div className="stat-box">
                <span className="stat-number">
                  {filteredMembers.filter((m) => m.role === 'member').length}
                </span>
              </div>
              <span className="stat-label">Vikings</span>
            </div>
          </div>

          <div className="search-row">
            <div className="search-section">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search Vikings by name, email, phone, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button
                    className="clear-search"
                    onClick={() => setSearchTerm('')}
                    title="Clear search"
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
                <label>Role:</label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Roles</option>
                  <option value="member">Vikings</option>
                  <option value="instructor">Warriors</option>
                  <option value="admin">Commanders</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Membership:</label>
                <select
                  value={filterMembershipType}
                  onChange={(e) => setFilterMembershipType(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Types</option>
                  <option value="Single">Single</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Monthly Unlimited">Unlimited</option>
                  <option value="Company">Company</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Status:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
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
                title="Clear all filters"
              >
                🗑️ Clear
              </button>
            </div>

            <div className="view-toggle">
              <button
                className={`toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
                onClick={() => setViewMode('card')}
              >
                <span className="toggle-icon" aria-hidden="true">📋</span>
                <span className="toggle-label">Cards</span>
              </button>
              <button
                className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <span className="toggle-icon" aria-hidden="true">📊</span>
                <span className="toggle-label">List</span>
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
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </div>
                  </div>
                  <button
                    className="expand-btn"
                    onClick={() => toggleMemberExpansion(member.id)}
                    title={expandedMembers.has(member.id) ? 'Collapse' : 'Expand'}
                  >
                    {expandedMembers.has(member.id) ? '−' : '+'}
                  </button>
                </div>

                {expandedMembers.has(member.id) && (
                  <div className="member-details">
                    <div className="detail-row">
                      <span className="label">Phone:</span>
                      <span className="value">{member.phone}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Membership:</span>
                      <span className="value">{member.membershipType}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Role:</span>
                      <span className="value">
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Join Date:</span>
                      <span className="value">
                        {new Date(member.joinDate).toLocaleDateString()}
                      </span>
                    </div>
                    {member.lastCheckIn && (
                      <div className="detail-row">
                        <span className="label">Last Check-in:</span>
                        <span className="value">
                          {new Date(member.lastCheckIn).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {member.company && (
                      <div className="detail-row">
                        <span className="label">Company:</span>
                        <span className="value">{member.company}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="member-actions">
                  <button
                    className="btn btn-outline btn-xs"
                    onClick={() => handleEditMember(member)}
                    title="Edit Member"
                  >
                    <span className="btn-icon" aria-hidden="true">✏️</span>
                    <span className="btn-label">Edit</span>
                  </button>
                  <button
                    className="btn btn-danger btn-xs"
                    onClick={() => handleDeleteMember(member)}
                    title="Delete Member"
                  >
                    <span className="btn-icon" aria-hidden="true">🗑️</span>
                    <span className="btn-label">Delete</span>
                  </button>
                  <button className="btn btn-secondary btn-xs" title="View Profile">
                    👁️
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="members-list">
            <div className="list-header">
              <div className="col">Name</div>
              <div className="col">Membership Type</div>
              <div className="col">Phone</div>
              <div className="col">Role</div>
              <div className="col">Status</div>
              <div className="col">Actions</div>
            </div>
            {filteredMembers.map((member) => (
              <div key={member.id} className="list-row">
                <div className="col">
                  <div className="member-name">
                    <span className="avatar-sm">
                      {member.firstName.charAt(0)}
                      {member.lastName.charAt(0)}
                    </span>
                    {member.firstName} {member.lastName}
                  </div>
                </div>
                <div className="col">{member.membershipType}</div>
                <div className="col">{member.phone}</div>
                <div className="col">
                  <span className="role-indicator">
                    {getRoleIcon(member.role)} {member.role}
                  </span>
                </div>
                <div className="col">
                  <div className={`status-badge ${getStatusColor(member.status)}`}>
                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                  </div>
                </div>
                <div className="col">
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button
                      className="btn btn-outline btn-xs"
                      onClick={() => handleEditMember(member)}
                      title="Edit Member"
                    >
                      <span className="btn-icon" aria-hidden="true">✏️</span>
                      <span className="btn-label">Edit</span>
                    </button>
                    <button
                      className="btn btn-danger btn-xs"
                      onClick={() => handleDeleteMember(member)}
                      title="Delete Member"
                    >
                      <span className="btn-icon" aria-hidden="true">🗑️</span>
                      <span className="btn-label">Delete</span>
                    </button>
                    <button
                      className="expand-btn"
                      onClick={() => toggleMemberExpansion(member.id)}
                      title={expandedMembers.has(member.id) ? 'Collapse' : 'Expand'}
                    >
                      {expandedMembers.has(member.id) ? '−' : '+'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedMember ? '⚔️ Edit Viking' : '🛡️ Join the Viking Army!'}</h3>
              <button className="close-btn" onClick={() => setShowAddForm(false)}>
                ×
              </button>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={newMember.firstName}
                  onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                  placeholder="Thor"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={newMember.lastName}
                  onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                  placeholder="Hammer"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="user@vikinghammer.com"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <div className="phone-input-group">
                  <select
                    value={selectedCountry.code}
                    onChange={(e) => {
                      const country = countries.find(c => c.code === e.target.value) || countries[0];
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
                    onChange={(e) => setNewMember({ 
                      ...newMember, 
                      phone: e.target.value
                    })}
                    placeholder="50 333 33 33"
                    className="form-input phone-number-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Membership Type</label>
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
                <label>Role</label>
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value as any })}
                  className="form-select"
                >
                  <option value="member">🛡️ Viking (Member)</option>
                  <option value="instructor">⚔️ Warrior (Instructor)</option>
                  <option value="admin">👑 Commander (Admin)</option>
                </select>
              </div>
              {newMember.role === 'member' && (
                <div className="form-group">
                  <label>Company (Optional)</label>
                  <select
                    value={newMember.company}
                    onChange={(e) => setNewMember({ ...newMember, company: e.target.value })}
                    className="form-select"
                  >
                    <option value="">No Company</option>
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
                    membershipType: 'Single',
                    role: 'member',
                    company: '',
                  });
                }}
              >
                ❌ Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddMember}>
                {selectedMember ? '⚡ Update Viking' : '🛡️ Join Army'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManagement;
