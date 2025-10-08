import React, { useState } from 'react';
import './MemberManagement.css';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  membershipType: string;
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  lastCheckIn?: string;
  role: 'member' | 'instructor' | 'admin';
  company?: string;
  dateOfBirth?: string;
  gender?: string;
  emergencyContact?: string;
  address?: string;
}

interface MemberManagementProps {
  onBack: () => void;
}

const MemberManagement: React.FC<MemberManagementProps> = ({ onBack }) => {
  const [members, setMembers] = useState<Member[]>([
    {
      id: '1',
      firstName: 'John',
      lastName: 'Viking',
      email: 'john@example.com',
      phone: '+994501234567',
      membershipType: 'Viking Warrior Pro',
      status: 'active',
      joinDate: '2024-01-15',
      lastCheckIn: '2024-10-07',
      role: 'member'
    },
    {
      id: '2',
      firstName: 'Sarah',
      lastName: 'Connor',
      email: 'sarah@example.com',
      phone: '+994507654321',
      membershipType: 'Single Entry',
      status: 'active',
      joinDate: '2024-02-20',
      lastCheckIn: '2024-10-06',
      role: 'member',
      company: 'TechCorp'
    },
    {
      id: '3',
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike@example.com',
      phone: '+994509876543',
      membershipType: 'Monthly',
      status: 'pending',
      joinDate: '2024-10-01',
      role: 'instructor'
    }
  ]);

  const [filteredMembers, setFilteredMembers] = useState<Member[]>(members);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string>('');

  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    membershipType: 'Single Entry',
    role: 'member' as 'member' | 'instructor' | 'admin',
    company: ''
  });

  const membershipTypes = [
    'Single Entry - 10 AZN',
    'Monthly - 12 entries',
    'Viking Warrior Basic',
    'Viking Warrior Pro'
  ];

  const companies = [
    'TechCorp',
    'Innovation Labs',
    'Digital Solutions',
    'StartupHub',
    'CodeFactory'
  ];

  React.useEffect(() => {
    let filtered = members;

    // Filter by role
    if (filterRole !== 'all') {
      filtered = filtered.filter(member => member.role === filterRole);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(member =>
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMembers(filtered);
  }, [filterRole, searchTerm, members]);

  const handleAddMember = () => {
    // Check for duplicates
    const isDuplicateEmail = members.some(member => member.email.toLowerCase() === newMember.email.toLowerCase());
    const isDuplicatePhone = members.some(member => member.phone === newMember.phone);
    const isDuplicateName = members.some(member => 
      member.firstName.toLowerCase() === newMember.firstName.toLowerCase() && 
      member.lastName.toLowerCase() === newMember.lastName.toLowerCase()
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

    const member: Member = {
      id: Date.now().toString(),
      ...newMember,
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0]
    };

    setMembers([...members, member]);
    
    // Show success message
    setConfirmationMessage('✅ Member added successfully!');
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);
    
    // Reset form
    setNewMember({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      membershipType: 'Single Entry',
      role: 'member',
      company: ''
    });
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
    setNewMember({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      membershipType: member.membershipType,
      role: member.role,
      company: member.company || ''
    });
    setShowAddForm(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'danger';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return '👑';
      case 'instructor': return '🏋️‍♂️';
      default: return '👤';
    }
  };

  return (
    <div className="member-management">
      {showConfirmation && (
        <div className="confirmation-message">
          {confirmationMessage}
        </div>
      )}
      
      <div className="page-header">
        <div className="page-title">
          <h2>Member Management</h2>
          <p>Manage gym members, instructors, and administrators</p>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
              onClick={() => setViewMode('card')}
            >
              📋 Card View
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              📊 List View
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            + Add Member
          </button>
          <button className="btn btn-secondary" onClick={onBack}>
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="management-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-section">
          <label>Filter by Role:</label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value="member">Members</option>
            <option value="instructor">Instructors</option>
            <option value="admin">Administrators</option>
          </select>
        </div>

        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-number">{filteredMembers.length}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{filteredMembers.filter(m => m.status === 'active').length}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{filteredMembers.filter(m => m.role === 'instructor').length}</span>
            <span className="stat-label">Instructors</span>
          </div>
        </div>
      </div>

      <div className={`members-container ${viewMode}`}>
        {viewMode === 'card' ? (
          <div className="members-grid">
            {filteredMembers.map(member => (
              <div key={member.id} className="member-card">
                <div className="member-header">
                  <div className="member-avatar">
                    <span>{member.firstName.charAt(0)}{member.lastName.charAt(0)}</span>
                    <div className="role-badge">{getRoleIcon(member.role)}</div>
                  </div>
                  <div className="member-info">
                    <h3>{member.firstName} {member.lastName}</h3>
                    <p>{member.email}</p>
                    <div className={`status-badge ${getStatusColor(member.status)}`}>
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </div>
                  </div>
                  <button 
                    className="expand-btn"
                    onClick={() => toggleMemberExpansion(member.id)}
                  >
                    {expandedMembers.has(member.id) ? '📁' : '📂'}
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
                      <span className="value">{member.role.charAt(0).toUpperCase() + member.role.slice(1)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Join Date:</span>
                      <span className="value">{new Date(member.joinDate).toLocaleDateString()}</span>
                    </div>
                    {member.lastCheckIn && (
                      <div className="detail-row">
                        <span className="label">Last Check-in:</span>
                        <span className="value">{new Date(member.lastCheckIn).toLocaleDateString()}</span>
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
                    className="btn btn-outline btn-sm"
                    onClick={() => handleEditMember(member)}
                  >
                    Edit
                  </button>
                  <button className="btn btn-secondary btn-sm">
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="members-list">
            <div className="list-header">
              <div className="col">Name</div>
              <div className="col">Email</div>
              <div className="col">Phone</div>
              <div className="col">Role</div>
              <div className="col">Status</div>
              <div className="col">Actions</div>
            </div>
            {filteredMembers.map(member => (
              <div key={member.id} className="list-row">
                <div className="col">
                  <div className="member-name">
                    <span className="avatar-sm">{member.firstName.charAt(0)}{member.lastName.charAt(0)}</span>
                    {member.firstName} {member.lastName}
                  </div>
                </div>
                <div className="col">{member.email}</div>
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
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => handleEditMember(member)}
                  >
                    Edit
                  </button>
                  <button 
                    className="expand-btn"
                    onClick={() => toggleMemberExpansion(member.id)}
                  >
                    {expandedMembers.has(member.id) ? '▼' : '▶'}
                  </button>
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
              <h3>Add New Member</h3>
              <button 
                className="close-btn"
                onClick={() => setShowAddForm(false)}
              >
                ×
              </button>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={newMember.firstName}
                  onChange={(e) => setNewMember({...newMember, firstName: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={newMember.lastName}
                  onChange={(e) => setNewMember({...newMember, lastName: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Membership Type</label>
                <select
                  value={newMember.membershipType}
                  onChange={(e) => setNewMember({...newMember, membershipType: e.target.value})}
                  className="form-select"
                >
                  {membershipTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({...newMember, role: e.target.value as any})}
                  className="form-select"
                >
                  <option value="member">Member</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              {newMember.role === 'member' && (
                <div className="form-group">
                  <label>Company (Optional)</label>
                  <select
                    value={newMember.company}
                    onChange={(e) => setNewMember({...newMember, company: e.target.value})}
                    className="form-select"
                  >
                    <option value="">No Company</option>
                    {companies.map(company => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddMember}>
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManagement;