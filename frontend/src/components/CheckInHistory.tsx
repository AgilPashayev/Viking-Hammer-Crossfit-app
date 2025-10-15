import React, { useState } from 'react';
import { useData, CheckIn } from '../contexts/DataContext';
import './CheckInHistory.css';

interface CheckInHistoryProps {
  onBack: () => void;
}

const CheckInHistory: React.FC<CheckInHistoryProps> = ({ onBack }) => {
  const { checkIns, getTodayCheckIns, getWeeklyCheckIns, stats, members } = useData();
  
  const [filteredCheckIns, setFilteredCheckIns] = useState<CheckIn[]>(checkIns);
  const [timeFilter, setTimeFilter] = useState<string>('today');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [membershipFilter, setMembershipFilter] = useState<string>('all');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showMemberPopup, setShowMemberPopup] = useState<boolean>(false);

  React.useEffect(() => {
    let filtered = checkIns;

    // Time filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

    switch (timeFilter) {
      case 'today':
        filtered = filtered.filter(record => {
          const checkInDate = new Date(record.checkInTime);
          return checkInDate >= today;
        });
        break;
      case 'week':
        filtered = filtered.filter(record => {
          const checkInDate = new Date(record.checkInTime);
          return checkInDate >= weekAgo;
        });
        break;
      case 'month':
        filtered = filtered.filter(record => {
          const checkInDate = new Date(record.checkInTime);
          return checkInDate >= monthAgo;
        });
        break;
      case 'year':
        filtered = filtered.filter(record => {
          const checkInDate = new Date(record.checkInTime);
          return checkInDate >= yearAgo;
        });
        break;
      case 'custom':
        if (customDateRange.startDate && customDateRange.endDate) {
          const startDate = new Date(customDateRange.startDate);
          const endDate = new Date(customDateRange.endDate);
          endDate.setHours(23, 59, 59, 999);
          filtered = filtered.filter(record => {
            const checkInDate = new Date(record.checkInTime);
            return checkInDate >= startDate && checkInDate <= endDate;
          });
        }
        break;
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.memberName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    // Membership filter
    if (membershipFilter !== 'all') {
      filtered = filtered.filter(record => record.membershipType === membershipFilter);
    }

    setFilteredCheckIns(filtered);
  }, [checkIns, timeFilter, searchTerm, statusFilter, membershipFilter, customDateRange]);

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (timeString: string) => {
    const date = new Date(timeString);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getLocalStats = () => {
    const todayCheckIns = getTodayCheckIns();
    const weeklyCheckIns = getWeeklyCheckIns();
    const activeNow = todayCheckIns.filter(checkIn => {
      const checkInTime = new Date(checkIn.checkInTime);
      const now = new Date();
      const diffMinutes = (now.getTime() - checkInTime.getTime()) / (1000 * 60);
      return diffMinutes <= 90 && !checkIn.checkOutTime; // Active if checked in within 90 mins and not checked out
    });

    return {
      total: weeklyCheckIns,
      today: todayCheckIns.length,
      active: activeNow.length,
      avgDuration: 75, // Default average
      currentClass: activeNow.length > 0 ? 'Active Class in Session' : 'No Active Classes'
    };
  };

  const localStats = getLocalStats();

  // Get member statistics
  const getMemberStats = (memberId: string) => {
    const memberCheckIns = checkIns.filter(c => c.memberId === memberId);
    const now = new Date();
    
    // Today
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayCount = memberCheckIns.filter(c => new Date(c.checkInTime) >= today).length;
    
    // This week (Monday 2am)
    const currentDay = now.getDay();
    const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + daysToMonday);
    monday.setHours(2, 0, 0, 0);
    const weekCount = memberCheckIns.filter(c => new Date(c.checkInTime) >= monday).length;
    
    // This month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthCount = memberCheckIns.filter(c => new Date(c.checkInTime) >= monthStart).length;
    
    // This year
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearCount = memberCheckIns.filter(c => new Date(c.checkInTime) >= yearStart).length;
    
    return {
      total: memberCheckIns.length,
      today: todayCount,
      week: weekCount,
      month: monthCount,
      year: yearCount,
      history: memberCheckIns.sort((a, b) => 
        new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
      )
    };
  };

  const handleMemberClick = (memberId: string) => {
    setSelectedMemberId(memberId);
    setShowMemberPopup(true);
  };

  const selectedMember = selectedMemberId ? members.find(m => m.id === selectedMemberId) : null;
  const memberStats = selectedMemberId ? getMemberStats(selectedMemberId) : null;

  return (
    <div className="checkin-history">
      <div className="page-header">
        <div className="page-title">
          <h2>🛡️ Viking Army Check-In History</h2>
        </div>
        <button className="btn btn-secondary btn-back" onClick={onBack}>
          🏠 Back to Command Center
        </button>
      </div>

      <div className="stats-overview">
        <div className="stat-card primary">
          <div className="stat-icon">⚔️</div>
          <div className="stat-content">
            <h3>{localStats.total}</h3>
            <p>Weekly Check-In</p>
            <small>Resets Monday 2am</small>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{localStats.today}</h3>
            <p>Today's Check-In</p>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">👨‍🏫</div>
          <div className="stat-content">
            <h3>{checkIns.filter(c => {
              const checkInDate = new Date(c.checkInTime);
              const today = new Date();
              return checkInDate.toDateString() === today.toDateString() && c.role === 'instructor';
            }).length}</h3>
            <p>Active Instructors</p>
          </div>
        </div>
      </div>

      <div className="filter-controls">
        <div className="basic-filters">
          <button
            className="btn btn-outline advanced-filter-btn"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            🔍 Advanced Battle Filters
          </button>

          <div className="search-section">
            <input
              type="text"
              placeholder="Search Viking warriors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="time-filters">
            <button
              className={`filter-btn ${timeFilter === 'today' ? 'active' : ''}`}
              onClick={() => setTimeFilter('today')}
            >
              Today
            </button>
            <button
              className={`filter-btn ${timeFilter === 'week' ? 'active' : ''}`}
              onClick={() => setTimeFilter('week')}
            >
              This Week
            </button>
            <button
              className={`filter-btn ${timeFilter === 'month' ? 'active' : ''}`}
              onClick={() => setTimeFilter('month')}
            >
              This Month
            </button>
            <button
              className={`filter-btn ${timeFilter === 'year' ? 'active' : ''}`}
              onClick={() => setTimeFilter('year')}
            >
              This Year
            </button>
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="advanced-filters">
            <div className="advanced-filter-content">
              <div className="filter-row">
                <div className="filter-group">
                  <label>Status:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Status</option>
                    <option value="active">🏋️‍♂️ In Battle</option>
                    <option value="completed">✅ Battle Complete</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>Membership Type:</label>
                  <select
                    value={membershipFilter}
                    onChange={(e) => setMembershipFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Types</option>
                    <option value="Single">Single Battle</option>
                    <option value="Monthly">Monthly Warrior</option>
                    <option value="Monthly Unlimited">Unlimited Viking</option>
                    <option value="Company">Company Army</option>
                  </select>
                </div>
              </div>
              
              <div className="filter-row">
                <div className="filter-group">
                  <label>From Date:</label>
                  <input
                    type="date"
                    value={customDateRange.startDate}
                    onChange={(e) => setCustomDateRange({...customDateRange, startDate: e.target.value})}
                    className="filter-input"
                  />
                </div>
                
                <div className="filter-group">
                  <label>To Date:</label>
                  <input
                    type="date"
                    value={customDateRange.endDate}
                    onChange={(e) => setCustomDateRange({...customDateRange, endDate: e.target.value})}
                    className="filter-input"
                  />
                </div>
              </div>
              
              <div className="filter-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    // Apply custom filters logic would go here
                    setShowAdvancedFilters(false);
                  }}
                >
                  ⚔️ Apply Battle Filters
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setStatusFilter('all');
                    setMembershipFilter('all');
                    setCustomDateRange({ startDate: '', endDate: '' });
                    setShowAdvancedFilters(false);
                  }}
                >
                  🗑️ Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {(statusFilter !== 'all' || membershipFilter !== 'all' || customDateRange.startDate || customDateRange.endDate) && (
          <div className="applied-filters">
            <span className="filter-label">Applied Filters:</span>
            {statusFilter !== 'all' && <span className="filter-tag">Status: {statusFilter}</span>}
            {membershipFilter !== 'all' && <span className="filter-tag">Type: {membershipFilter}</span>}
            {customDateRange.startDate && <span className="filter-tag">From: {customDateRange.startDate}</span>}
            {customDateRange.endDate && <span className="filter-tag">To: {customDateRange.endDate}</span>}
          </div>
        )}
      </div>

      <div className="checkin-list">
        {filteredCheckIns.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⚔️</div>
            <h3>No Check-Ins Found</h3>
            <p>Try adjusting your filters to see more warrior activity.</p>
          </div>
        ) : (
          <div className="checkin-table-container">
            <table className="checkin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Membership Type</th>
                  <th>Status</th>
                  <th>Phone Number</th>
                  <th>Check-In Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredCheckIns.map(record => {
                  const initials = record.memberName.split(' ').map(n => n.charAt(0)).join('');
                  const checkInDate = new Date(record.checkInTime);
                  const now = new Date();
                  const diffMinutes = Math.floor((now.getTime() - checkInDate.getTime()) / (1000 * 60));
                  const isActive = diffMinutes <= 90 && !record.checkOutTime;
                  
                  return (
                    <tr key={record.id} className={`checkin-row ${isActive ? 'active' : 'completed'}`}>
                      <td>
                        <div className="member-info-cell">
                          <div className="member-avatar-sm">
                            {initials}
                          </div>
                          <span 
                            className="member-name-text clickable"
                            onClick={() => handleMemberClick(record.memberId)}
                          >
                            {record.memberName}
                          </span>
                        </div>
                      </td>
                      <td>{record.membershipType}</td>
                      <td>
                        <span className={`status-badge status-${record.status}`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                      <td>{record.phone}</td>
                      <td>
                        <div className="time-cell">
                          <span className="time">{formatTime(record.checkInTime)}</span>
                          <span className="date">{formatDate(record.checkInTime)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Member Information Popup */}
      {showMemberPopup && selectedMember && memberStats && (
        <div className="modal-overlay" onClick={() => setShowMemberPopup(false)}>
          <div className="member-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h2>👤 Member Information</h2>
              <button className="close-btn" onClick={() => setShowMemberPopup(false)}>✕</button>
            </div>
            
            <div className="popup-content">
              {/* Member Details */}
              <div className="member-details-section">
                <div className="member-avatar-large">
                  {selectedMember.firstName.charAt(0)}{selectedMember.lastName.charAt(0)}
                </div>
                <div className="member-info-details">
                  <h3>{selectedMember.firstName} {selectedMember.lastName}</h3>
                  <p><strong>Email:</strong> {selectedMember.email}</p>
                  <p><strong>Phone:</strong> {selectedMember.phone}</p>
                  <p><strong>Membership:</strong> {selectedMember.membershipType}</p>
                  <p><strong>Status:</strong> <span className={`status-badge status-${selectedMember.status}`}>
                    {selectedMember.status.charAt(0).toUpperCase() + selectedMember.status.slice(1)}
                  </span></p>
                  <p><strong>Joined:</strong> {new Date(selectedMember.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p><strong>Last Check-In:</strong> {selectedMember.lastCheckIn ? new Date(selectedMember.lastCheckIn).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
                </div>
              </div>

              {/* Visit Statistics */}
              <div className="visit-stats-section">
                <h3>Visit Statistics</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <span
                      className={`stat-value digits-${String(memberStats.today).length}`}
                      title={`${memberStats.today} visits today`}
                    >
                      {memberStats.today}
                    </span>
                    <span className="stat-label">Today</span>
                  </div>
                  <div className="stat-card">
                    <span
                      className={`stat-value digits-${String(memberStats.week).length}`}
                      title={`${memberStats.week} visits this week`}
                    >
                      {memberStats.week}
                    </span>
                    <span className="stat-label">This Week</span>
                  </div>
                  <div className="stat-card">
                    <span
                      className={`stat-value digits-${String(memberStats.month).length}`}
                      title={`${memberStats.month} visits this month`}
                    >
                      {memberStats.month}
                    </span>
                    <span className="stat-label">This Month</span>
                  </div>
                  <div className="stat-card">
                    <span
                      className={`stat-value digits-${String(memberStats.year).length}`}
                      title={`${memberStats.year} visits this year`}
                    >
                      {memberStats.year}
                    </span>
                    <span className="stat-label">This Year</span>
                  </div>
                  <div className="stat-card">
                    <span
                      className={`stat-value digits-${String(memberStats.total).length}`}
                      title={`${memberStats.total} visits in total`}
                    >
                      {memberStats.total}
                    </span>
                    <span className="stat-label">All Time</span>
                  </div>
                </div>
              </div>

              {/* Check-In History */}
              <div className="checkin-history-section">
                <h3>📅 Check-In History</h3>
                <div className="history-list">
                  {memberStats.history.length > 0 ? (
                    memberStats.history.slice(0, 10).map((checkIn) => (
                      <div key={checkIn.id} className="history-item">
                        <div className="history-time">
                          <span className="history-date">{formatDate(checkIn.checkInTime)}</span>
                          <span className="history-time-value">{formatTime(checkIn.checkInTime)}</span>
                        </div>
                        <div className="history-details">
                          <span className={`status-badge status-${checkIn.status}`}>
                            {checkIn.status.charAt(0).toUpperCase() + checkIn.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-history">No check-in history available</p>
                  )}
                  {memberStats.history.length > 10 && (
                    <p className="more-history">Showing 10 most recent check-ins out of {memberStats.total} total</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInHistory;