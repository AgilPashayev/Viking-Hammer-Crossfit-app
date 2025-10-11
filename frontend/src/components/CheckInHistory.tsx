import React, { useState } from 'react';
import './CheckInHistory.css';

interface CheckInRecord {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  checkInTime: string;
  checkOutTime?: string;
  duration?: number;
  membershipType: string;
  status: 'active' | 'completed';
}

interface CheckInHistoryProps {
  onBack: () => void;
}

const CheckInHistory: React.FC<CheckInHistoryProps> = ({ onBack }) => {
  const [checkIns] = useState<CheckInRecord[]>([
    {
      id: '1',
      memberId: '1',
      memberName: 'Thor Hammer',
      memberAvatar: 'TH',
      checkInTime: '2024-10-07T14:45:00',
      checkOutTime: '2024-10-07T16:30:00',
      duration: 105,
      membershipType: 'Monthly Unlimited',
      status: 'completed'
    },
    {
      id: '2',
      memberId: '2',
      memberName: 'Freya Viking',
      memberAvatar: 'FV',
      checkInTime: '2024-10-07T15:20:00',
      membershipType: 'Single',
      status: 'active'
    },
    {
      id: '3',
      memberId: '3',
      memberName: 'Odin Hammer',
      memberAvatar: 'OH',
      checkInTime: '2024-10-07T13:15:00',
      checkOutTime: '2024-10-07T14:45:00',
      duration: 90,
      membershipType: 'Monthly',
      status: 'completed'
    },
    {
      id: '4',
      memberId: '4',
      memberName: 'Astrid Viking',
      memberAvatar: 'AV',
      checkInTime: '2024-10-06T18:30:00',
      checkOutTime: '2024-10-06T20:00:00',
      duration: 90,
      membershipType: 'Company',
      status: 'completed'
    },
    {
      id: '5',
      memberId: '5',
      memberName: 'Ragnar Hammer',
      memberAvatar: 'RH',
      checkInTime: '2024-10-06T16:45:00',
      checkOutTime: '2024-10-06T18:15:00',
      duration: 90,
      membershipType: 'Single',
      status: 'completed'
    }
  ]);

  const [filteredCheckIns, setFilteredCheckIns] = useState<CheckInRecord[]>(checkIns);
  const [timeFilter, setTimeFilter] = useState<string>('today');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [membershipFilter, setMembershipFilter] = useState<string>('all');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

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
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timeString: string) => {
    return new Date(timeString).toLocaleDateString();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStats = () => {
    const today = filteredCheckIns.filter(record => {
      const checkInDate = new Date(record.checkInTime);
      const today = new Date();
      return checkInDate.toDateString() === today.toDateString();
    });

    // Calculate currently active members (checked in within last 90 minutes)
    const now = new Date();
    const ninetyMinsAgo = new Date(now.getTime() - 90 * 60 * 1000);
    const currentlyActive = filteredCheckIns.filter(record => {
      const checkInTime = new Date(record.checkInTime);
      return record.status === 'active' && checkInTime >= ninetyMinsAgo;
    });

    const avgDuration = filteredCheckIns
      .filter(record => record.duration)
      .reduce((sum, record) => sum + (record.duration || 0), 0) / 
      filteredCheckIns.filter(record => record.duration).length || 0;

    return {
      total: filteredCheckIns.length,
      today: today.length,
      active: currentlyActive.length,
      avgDuration: Math.round(avgDuration),
      currentClass: currentlyActive.length > 0 ? 'Active Class in Session' : 'No Active Classes'
    };
  };

  const stats = getStats();

  return (
    <div className="checkin-history">
      <div className="page-header">
        <div className="page-title">
          <h2>🛡️ Viking Army Check-In History</h2>
          <p>Monitor Viking warriors' activity and battle hall usage patterns</p>
        </div>
        <button className="btn btn-secondary" onClick={onBack}>
          🏠 Back to Command Center
        </button>
      </div>

      <div className="stats-overview">
        <div className="stat-card primary">
          <div className="stat-icon">⚔️</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Battles</p>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">�️</div>
          <div className="stat-content">
            <h3>{stats.today}</h3>
            <p>Today's Warriors</p>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">�️‍♂️</div>
          <div className="stat-content">
            <h3>{stats.active}</h3>
            <p>Active Warriors</p>
            <small>{stats.currentClass}</small>
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3>{stats.avgDuration}m</h3>
            <p>Avg Battle Time</p>
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
            <div className="empty-icon">�️</div>
            <h3>No Viking battles found</h3>
            <p>Try adjusting your battle filters to see more warrior activity.</p>
          </div>
        ) : (
          filteredCheckIns.map(record => (
            <div key={record.id} className={`checkin-item ${record.status}`}>
              <div className="member-info">
                <div className="member-avatar">
                  {record.memberAvatar}
                </div>
                <div className="member-details">
                  <h4 
                    className="member-name clickable"
                    onClick={() => console.log('View member details:', record.memberName)}
                  >
                    {record.memberName}
                  </h4>
                  <p>{record.membershipType}</p>
                </div>
              </div>

              <div className="timing-info">
                <div className="time-details">
                  <div className="check-in">
                    <span className="label">Check-in:</span>
                    <span className="time">{formatTime(record.checkInTime)}</span>
                    <span className="date">{formatDate(record.checkInTime)}</span>
                  </div>
                  {record.checkOutTime && (
                    <div className="check-out">
                      <span className="label">Check-out:</span>
                      <span className="time">{formatTime(record.checkOutTime)}</span>
                    </div>
                  )}
                </div>
                {record.duration && (
                  <div className="duration">
                    <span className="duration-badge">
                      {formatDuration(record.duration)}
                    </span>
                  </div>
                )}
              </div>

              <div className="status-section">
                <div className={`status-indicator ${record.status}`}>
                  {record.status === 'active' ? '🟢' : '✅'}
                </div>
                <span className="status-text">
                  {record.status === 'active' ? 'Active' : 'Completed'}
                </span>
              </div>

              <div className="actions">
                <button className="btn btn-outline btn-sm">
                  View Details
                </button>
                {record.status === 'active' && (
                  <button className="btn btn-secondary btn-sm">
                    Check Out
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CheckInHistory;