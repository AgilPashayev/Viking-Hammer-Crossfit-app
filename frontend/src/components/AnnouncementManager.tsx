import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import './AnnouncementManager.css';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'class' | 'maintenance' | 'event' | 'promotion';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  recipients: 'all' | 'members' | 'instructors' | 'staff' | 'custom';
  customRecipients?: string[];
  status: 'draft' | 'published' | 'scheduled' | 'expired';
  scheduledDate?: string;
  expiryDate?: string;
  createdBy: string;
  createdAt: string;
  publishedAt?: string;
  viewCount: number;
  readByCount: number;
  attachments?: string[];
  tags: string[];
}

interface AnnouncementManagerProps {
  onBack: () => void;
  user?: any;
}

const AnnouncementManager: React.FC<AnnouncementManagerProps> = ({ onBack, user }) => {
  const { logActivity } = useData();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);

  // New announcement form state
  const [newAnnouncement, setNewAnnouncement] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    type: 'general',
    priority: 'normal',
    recipients: 'all',
    customRecipients: [],
    status: 'draft',
    tags: [],
    attachments: []
  });

  useEffect(() => {
    // Load announcements from API
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const response = await fetch('http://localhost:4001/api/announcements/member');
      const result = await response.json();
      
      if (result.success && result.data) {
        // Transform backend data to component format
        const transformedAnnouncements: Announcement[] = result.data.map((ann: any) => ({
          id: String(ann.id),
          title: ann.title,
          content: ann.content,
          type: 'general' as const,
          priority: (ann.priority as any) || 'medium',
          recipients: ann.target_audience || 'all',
          status: ann.status || 'published',
          createdBy: ann.created_by || 'System',
          createdAt: ann.created_at,
          publishedAt: ann.published_at,
          viewCount: ann.views_count || 0,
          readByCount: (ann.read_by_users || []).length,
          tags: [],
          attachments: []
        }));
        
        setAnnouncements(transformedAnnouncements);
      }
    } catch (error) {
      console.error('Failed to load announcements:', error);
      // Fallback to empty array instead of mock data
      setAnnouncements([]);
    }
  };

  const loadMockData = () => {
    const mockAnnouncements: Announcement[] = [
      {
        id: 'ann1',
        title: 'New Group Fitness Classes Starting Next Week!',
        content: 'We are excited to announce three new group fitness classes starting Monday: Advanced HIIT, Beginner Yoga Flow, and Strength & Conditioning. All classes are included in your membership. Check the schedule for available time slots.',
        type: 'class',
        priority: 'high',
        recipients: 'all',
        status: 'published',
        createdBy: 'Admin',
        createdAt: '2024-01-15T10:00:00',
        publishedAt: '2024-01-15T10:00:00',
        viewCount: 125,
        readByCount: 98,
        tags: ['classes', 'schedule', 'fitness'],
        attachments: []
      },
      {
        id: 'ann2',
        title: 'Gym Maintenance - Pool Area Closed',
        content: 'The pool area will be temporarily closed for maintenance and cleaning from January 20th to January 22nd. We apologize for any inconvenience. All other facilities remain open during normal hours.',
        type: 'maintenance',
        priority: 'urgent',
        recipients: 'all',
        status: 'published',
        createdBy: 'Maintenance Team',
        createdAt: '2024-01-12T14:30:00',
        publishedAt: '2024-01-12T14:30:00',
        viewCount: 89,
        readByCount: 76,
        tags: ['maintenance', 'pool', 'closure'],
        attachments: []
      },
      {
        id: 'ann3',
        title: 'January Membership Promotion - 20% Off!',
        content: 'Special New Year promotion! Get 20% off all annual membership plans when you sign up before January 31st. This offer includes access to all classes, pool, sauna, and personal training consultations.',
        type: 'promotion',
        priority: 'normal',
        recipients: 'all',
        status: 'published',
        createdBy: 'Marketing Team',
        createdAt: '2024-01-10T09:00:00',
        publishedAt: '2024-01-10T09:00:00',
        expiryDate: '2024-01-31T23:59:59',
        viewCount: 156,
        readByCount: 112,
        tags: ['promotion', 'membership', 'discount'],
        attachments: []
      },
      {
        id: 'ann4',
        title: 'Instructor Workshop: Advanced CrossFit Techniques',
        content: 'Mandatory workshop for all CrossFit instructors on advanced techniques and safety protocols. Date: January 25th, 2:00 PM - 5:00 PM. Please confirm your attendance by replying to this message.',
        type: 'event',
        priority: 'high',
        recipients: 'instructors',
        status: 'published',
        createdBy: 'Training Coordinator',
        createdAt: '2024-01-08T11:15:00',
        publishedAt: '2024-01-08T11:15:00',
        viewCount: 12,
        readByCount: 10,
        tags: ['workshop', 'training', 'instructors'],
        attachments: []
      },
      {
        id: 'ann5',
        title: 'Valentine\'s Day Couples Workout Event',
        content: 'Join us for a special Valentine\'s Day couples workout event on February 14th at 7:00 PM. Fun partner exercises, healthy refreshments, and prizes for participating couples. Registration required.',
        type: 'event',
        priority: 'normal',
        recipients: 'members',
        status: 'scheduled',
        scheduledDate: '2024-02-01T10:00:00',
        createdBy: 'Events Team',
        createdAt: '2024-01-16T16:20:00',
        viewCount: 0,
        readByCount: 0,
        tags: ['event', 'couples', 'valentine'],
        attachments: []
      },
      {
        id: 'ann6',
        title: 'New Safety Protocols Update',
        content: 'Important updates to gym safety protocols following recent health guidelines. All staff members must review and acknowledge these changes by January 30th.',
        type: 'general',
        priority: 'high',
        recipients: 'staff',
        status: 'draft',
        createdBy: 'Safety Manager',
        createdAt: '2024-01-16T13:45:00',
        viewCount: 0,
        readByCount: 0,
        tags: ['safety', 'protocols', 'staff'],
        attachments: []
      }
    ];

    setAnnouncements(mockAnnouncements);
  };

  const getFilteredAnnouncements = () => {
    return announcements.filter(announcement => {
      const matchesSearch = 
        announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = filterType === 'all' || announcement.type === filterType;
      const matchesStatus = filterStatus === 'all' || announcement.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || announcement.priority === filterPriority;
      
      return matchesSearch && matchesType && matchesStatus && matchesPriority;
    });
  };

  const handleCreateAnnouncement = async () => {
    if (newAnnouncement.title && newAnnouncement.content) {
      if (editingAnnouncement) {
        // Edit existing announcement (not implemented in backend yet)
        const updatedAnnouncement: Announcement = {
          ...editingAnnouncement,
          ...newAnnouncement,
          id: editingAnnouncement.id,
          createdBy: editingAnnouncement.createdBy,
          createdAt: editingAnnouncement.createdAt,
          viewCount: editingAnnouncement.viewCount,
          readByCount: editingAnnouncement.readByCount,
          publishedAt: editingAnnouncement.publishedAt,
        } as Announcement;
        
        setAnnouncements(announcements.map(ann => 
          ann.id === editingAnnouncement.id ? updatedAnnouncement : ann
        ));
        logActivity({
          type: 'announcement_created',
          message: `Announcement updated: ${updatedAnnouncement.title}`,
        });
        setEditingAnnouncement(null);
      } else {
        // Create new announcement via API
        try {
          const response = await fetch('http://localhost:4001/api/announcements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: newAnnouncement.title,
              content: newAnnouncement.content,
              targetAudience: newAnnouncement.recipients,
              priority: newAnnouncement.priority,
              createdBy: user?.id || '00000000-0000-0000-0000-000000000000',
            }),
          });
          
          const result = await response.json();
          
          if (result.success) {
            // Reload announcements from database
            await loadAnnouncements();
            
            logActivity({
              type: 'announcement_created',
              message: `Announcement created: ${result.data.title}`,
            });
            
            // Show success message
            alert(`✅ Success!\n\nYour announcement "${result.data.title}" has been published and is now visible to members.`);
          } else {
            console.error('Failed to create announcement:', result.error);
            
            // User-friendly error messages
            let friendlyMessage = '❌ Unable to create announcement.\n\n';
            
            if (result.error && result.error.includes('uuid')) {
              friendlyMessage += '🔧 Your account needs to be refreshed.\n\n';
              friendlyMessage += 'Please:\n';
              friendlyMessage += '1. Logout\n';
              friendlyMessage += '2. Clear demo data (red button on login)\n';
              friendlyMessage += '3. Sign up as a new demo user\n\n';
              friendlyMessage += 'This will fix the account format issue.';
            } else if (result.error && result.error.includes('priority_check')) {
              friendlyMessage += '⚠️ Invalid priority value.\n\n';
              friendlyMessage += 'Please select a valid priority:\n';
              friendlyMessage += '• Low\n';
              friendlyMessage += '• Normal\n';
              friendlyMessage += '• High\n';
              friendlyMessage += '• Urgent\n\n';
              friendlyMessage += 'If this error persists, please refresh the page.';
            } else if (result.error && result.error.includes('target_audience_check')) {
              friendlyMessage += '⚠️ Invalid target audience value.\n\n';
              friendlyMessage += 'Please select a valid recipient type:\n';
              friendlyMessage += '• All Members\n';
              friendlyMessage += '• Members Only\n';
              friendlyMessage += '• Instructors\n';
              friendlyMessage += '• Staff\n\n';
              friendlyMessage += 'If this error persists, please refresh the page.';
            } else if (result.error && result.error.includes('foreign key')) {
              friendlyMessage += '🔧 Your account is not properly set up.\n\n';
              friendlyMessage += 'Please:\n';
              friendlyMessage += '1. Logout and login again\n';
              friendlyMessage += '2. If issue persists, clear demo data and create a new account\n\n';
              friendlyMessage += 'This will ensure your account is properly registered.';
            } else {
              friendlyMessage += '💡 Something went wrong.\n\n';
              friendlyMessage += 'Technical details:\n' + result.error + '\n\n';
              friendlyMessage += 'Please try again. If the issue persists, contact support.';
            }
            
            alert(friendlyMessage);
          }
        } catch (error) {
          console.error('Failed to create announcement:', error);
          alert('❌ Unable to create announcement.\n\n' +
                '🌐 Please check your internet connection.\n' +
                '🔄 If the issue persists, try refreshing the page.');
        }
      }
      
      setNewAnnouncement({
        title: '',
        content: '',
        type: 'general',
        priority: 'normal',
        recipients: 'all',
        customRecipients: [],
        status: 'draft',
        tags: [],
        attachments: []
      });
      setShowCreateModal(false);
    }
  };

  const handlePublishAnnouncement = (id: string) => {
    setAnnouncements(announcements.map(ann => 
      ann.id === id 
        ? { 
            ...ann, 
            status: 'published' as const, 
            publishedAt: new Date().toISOString() 
          }
        : ann
    ));
    const pub = announcements.find(a => a.id === id);
    if (pub) {
      logActivity({ type: 'announcement_published', message: `Announcement published: ${pub.title}` });
    }
  };

  const handleDeleteClick = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (announcementToDelete) {
      setAnnouncements(announcements.filter(ann => ann.id !== announcementToDelete.id));
      logActivity({ 
        type: 'announcement_deleted', 
        message: `Announcement deleted: ${announcementToDelete.title}` 
      });
      setShowDeleteConfirm(false);
      setAnnouncementToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setAnnouncementToDelete(null);
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setNewAnnouncement({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      recipients: announcement.recipients,
      customRecipients: announcement.customRecipients || [],
      status: announcement.status,
      scheduledDate: announcement.scheduledDate,
      expiryDate: announcement.expiryDate,
      tags: announcement.tags,
      attachments: announcement.attachments || []
    });
    setShowCreateModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      general: '📢',
      class: '🏃‍♀️',
      maintenance: '🔧',
      event: '🎉',
      promotion: '🎁'
    };
    return icons[type as keyof typeof icons] || '📢';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#fd7e14',
      urgent: '#dc3545'
    };
    return colors[priority as keyof typeof colors] || '#6c757d';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: '#6c757d',
      published: '#28a745',
      scheduled: '#17a2b8',
      expired: '#dc3545'
    };
    return colors[status as keyof typeof colors] || '#6c757d';
  };

  const getStats = () => {
    const total = announcements.length;
    const published = announcements.filter(a => a.status === 'published').length;
    const draft = announcements.filter(a => a.status === 'draft').length;
    const scheduled = announcements.filter(a => a.status === 'scheduled').length;
    const totalViews = announcements.reduce((sum, a) => sum + a.viewCount, 0);
    const totalReads = announcements.reduce((sum, a) => sum + a.readByCount, 0);
    const engagementRate = totalViews > 0 ? Math.round((totalReads / totalViews) * 100) : 0;

    return { total, published, draft, scheduled, totalViews, totalReads, engagementRate };
  };

  const stats = getStats();

  return (
    <div className="announcement-manager">
      <div className="announcement-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Reception
        </button>
        <h2 className="announcement-title">📢 Announcement Manager</h2>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">📢</div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.total}</h3>
            <p className="stat-label">Total Announcements</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.published}</h3>
            <p className="stat-label">Published</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.draft}</h3>
            <p className="stat-label">Drafts</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.scheduled}</h3>
            <p className="stat-label">Scheduled</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.totalViews}</h3>
            <p className="stat-label">Total Views</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.engagementRate}%</h3>
            <p className="stat-label">Read Rate</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-section">
        <button className="create-btn" onClick={() => setShowCreateModal(true)}>
          ➕ Create Announcement
        </button>
        <div className="filters">
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="general">General</option>
            <option value="class">Class</option>
            <option value="maintenance">Maintenance</option>
            <option value="event">Event</option>
            <option value="promotion">Promotion</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Announcements List */}
      <div className="announcements-list">
        {getFilteredAnnouncements().length === 0 ? (
          <div className="no-announcements">
            <div className="no-data-icon">📢</div>
            <h3>No Announcements Found</h3>
            <p>Create your first announcement to get started!</p>
          </div>
        ) : (
          getFilteredAnnouncements().map(announcement => (
            <div key={announcement.id} className="announcement-card">
              <div className="announcement-card-header">
                <div className="announcement-meta">
                  <span className="type-icon">{getTypeIcon(announcement.type)}</span>
                  <h3 className="announcement-card-title">{announcement.title}</h3>
                </div>
                <div className="announcement-badges">
                  <span 
                    className="priority-badge" 
                    style={{ backgroundColor: getPriorityColor(announcement.priority) }}
                  >
                    {announcement.priority}
                  </span>
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getStatusColor(announcement.status) }}
                  >
                    {announcement.status}
                  </span>
                </div>
              </div>

              <div className="announcement-content-preview">
                {announcement.content.substring(0, 150)}
                {announcement.content.length > 150 && '...'}
              </div>

              <div className="announcement-details">
                <div className="detail-row">
                  <span className="detail-label">Recipients:</span>
                  <span className="detail-value">{announcement.recipients}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Created:</span>
                  <span className="detail-value">{formatDate(announcement.createdAt)}</span>
                </div>
                {announcement.publishedAt && (
                  <div className="detail-row">
                    <span className="detail-label">Published:</span>
                    <span className="detail-value">{formatDate(announcement.publishedAt)}</span>
                  </div>
                )}
                {announcement.scheduledDate && (
                  <div className="detail-row">
                    <span className="detail-label">Scheduled:</span>
                    <span className="detail-value">{formatDate(announcement.scheduledDate)}</span>
                  </div>
                )}
              </div>

              <div className="announcement-stats">
                <div className="stat-item">
                  <span className="stat-icon">👁️</span>
                  <span>{announcement.viewCount} views</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">📖</span>
                  <span>{announcement.readByCount} reads</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">👤</span>
                  <span>{announcement.createdBy}</span>
                </div>
              </div>

              {announcement.tags.length > 0 && (
                <div className="announcement-tags">
                  {announcement.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
              )}

              <div className="announcement-actions">
                <button 
                  className="preview-btn"
                  onClick={() => {
                    setSelectedAnnouncement(announcement);
                    setShowPreviewModal(true);
                  }}
                >
                  👁️ Preview
                </button>
                <button 
                  className="edit-btn"
                  onClick={() => handleEditAnnouncement(announcement)}
                >
                  ✏️ Edit
                </button>
                {announcement.status === 'draft' && (
                  <button 
                    className="publish-btn"
                    onClick={() => handlePublishAnnouncement(announcement.id)}
                  >
                    📤 Publish
                  </button>
                )}
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteClick(announcement)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}</h3>
              <button className="close-btn" onClick={() => {
                setShowCreateModal(false);
                setEditingAnnouncement(null);
                setNewAnnouncement({
                  title: '',
                  content: '',
                  type: 'general',
                  priority: 'normal',
                  recipients: 'all',
                  customRecipients: [],
                  status: 'draft',
                  tags: [],
                  attachments: []
                });
              }}>
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  value={newAnnouncement.title || ''}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  placeholder="Enter announcement title"
                />
              </div>
              
              <div className="form-group">
                <label>Content:</label>
                <textarea
                  value={newAnnouncement.content || ''}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                  placeholder="Enter announcement content"
                  rows={6}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Type:</label>
                  <select
                    value={newAnnouncement.type || 'general'}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, type: e.target.value as any})}
                  >
                    <option value="general">General</option>
                    <option value="class">Class</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="event">Event</option>
                    <option value="promotion">Promotion</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Priority:</label>
                  <select
                    value={newAnnouncement.priority || 'normal'}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, priority: e.target.value as any})}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Recipients:</label>
                  <select
                    value={newAnnouncement.recipients || 'all'}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, recipients: e.target.value as any})}
                  >
                    <option value="all">All Users</option>
                    <option value="members">Members Only</option>
                    <option value="instructors">Instructors Only</option>
                    <option value="staff">Staff Only</option>
                    <option value="custom">Custom Selection</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Status:</label>
                  <select
                    value={newAnnouncement.status || 'draft'}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, status: e.target.value as any})}
                  >
                    <option value="draft">Save as Draft</option>
                    <option value="published">Publish Immediately</option>
                    <option value="scheduled">Schedule for Later</option>
                  </select>
                </div>
              </div>
              
              {newAnnouncement.status === 'scheduled' && (
                <div className="form-group">
                  <label>Scheduled Date:</label>
                  <input
                    type="date"
                    value={newAnnouncement.scheduledDate || ''}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, scheduledDate: e.target.value})}
                    placeholder="Select scheduled date"
                  />
                  {newAnnouncement.scheduledDate && (
                    <div className="date-preview">
                      Preview: {formatDate(newAnnouncement.scheduledDate)}
                    </div>
                  )}
                </div>
              )}
              
              <div className="form-group">
                <label>Tags (comma-separated):</label>
                <input
                  type="text"
                  value={newAnnouncement.tags?.join(', ') || ''}
                  placeholder="e.g., classes, promotion, maintenance"
                  onChange={(e) => setNewAnnouncement({
                    ...newAnnouncement, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  })}
                />
              </div>

              <div className="form-group">
                <label>Expiry Date (optional):</label>
                <input
                  type="date"
                  value={newAnnouncement.expiryDate || ''}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, expiryDate: e.target.value})}
                  placeholder="Select expiry date"
                />
                {newAnnouncement.expiryDate && (
                  <div className="date-preview">
                    Preview: {formatDate(newAnnouncement.expiryDate)}
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleCreateAnnouncement}>
                {editingAnnouncement 
                  ? 'Update Announcement'
                  : newAnnouncement.status === 'published' ? 'Publish' : 'Save'} Announcement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedAnnouncement && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>📢 Announcement Preview</h3>
              <button className="close-btn" onClick={() => setShowPreviewModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="preview-announcement">
                <div className="preview-header">
                  <h2>{selectedAnnouncement.title}</h2>
                  <div className="preview-meta">
                    <span className="preview-type">{getTypeIcon(selectedAnnouncement.type)} {selectedAnnouncement.type}</span>
                    <span 
                      className="preview-priority" 
                      style={{ backgroundColor: getPriorityColor(selectedAnnouncement.priority) }}
                    >
                      {selectedAnnouncement.priority} priority
                    </span>
                  </div>
                </div>
                
                <div className="preview-content">
                  {selectedAnnouncement.content}
                </div>
                
                <div className="preview-details">
                  <p><strong>Recipients:</strong> {selectedAnnouncement.recipients}</p>
                  <p><strong>Created by:</strong> {selectedAnnouncement.createdBy}</p>
                  <p><strong>Created:</strong> {formatDate(selectedAnnouncement.createdAt)}</p>
                  {selectedAnnouncement.publishedAt && (
                    <p><strong>Published:</strong> {formatDate(selectedAnnouncement.publishedAt)}</p>
                  )}
                  {selectedAnnouncement.expiryDate && (
                    <p><strong>Expires:</strong> {formatDate(selectedAnnouncement.expiryDate)}</p>
                  )}
                </div>
                
                {selectedAnnouncement.tags.length > 0 && (
                  <div className="preview-tags">
                    <strong>Tags:</strong>
                    {selectedAnnouncement.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="confirm-btn" onClick={() => setShowPreviewModal(false)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && announcementToDelete && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚠️ Confirm Delete</h2>
              <button className="close-modal" onClick={handleCancelDelete}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="delete-confirm-content">
                <div className="warning-icon">🗑️</div>
                <h3>Are you sure you want to delete this announcement?</h3>
                <div className="announcement-info">
                  <p className="announcement-title-preview">
                    <strong>Title:</strong> {announcementToDelete.title}
                  </p>
                  <p className="announcement-type-preview">
                    <strong>Type:</strong> {getTypeIcon(announcementToDelete.type)} {announcementToDelete.type}
                  </p>
                  <p className="announcement-status-preview">
                    <strong>Status:</strong> {announcementToDelete.status}
                  </p>
                </div>
                <p className="warning-text">
                  This action cannot be undone. The announcement will be permanently deleted.
                </p>
              </div>
            </div>
            
            <div className="modal-footer delete-confirm-footer">
              <button className="cancel-btn" onClick={handleCancelDelete}>
                ❌ Cancel
              </button>
              <button className="confirm-delete-btn" onClick={handleConfirmDelete}>
                🗑️ Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementManager;