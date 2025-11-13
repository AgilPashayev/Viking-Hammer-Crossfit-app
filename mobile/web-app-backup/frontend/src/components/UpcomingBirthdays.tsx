import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './UpcomingBirthdays.css';
import { formatDate, formatBirthday } from '../utils/dateFormatter';

interface BirthdayMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  membershipType: string;
  profileImage?: string;
  joinDate: string;
  age: number;
  daysUntilBirthday: number;
  isToday: boolean;
  thisWeek: boolean;
  thisMonth: boolean;
}

interface UpcomingBirthdaysProps {
  onBack: () => void;
}

const UpcomingBirthdays: React.FC<UpcomingBirthdaysProps> = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const [birthdays, setBirthdays] = useState<BirthdayMember[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<BirthdayMember | null>(null);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [celebrationTemplate, setCelebrationTemplate] = useState('default');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load mock birthday data
    loadMockBirthdayData();
  }, []);

  const toggleCard = (memberId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const loadMockBirthdayData = () => {
    const today = new Date();
    const currentYear = today.getFullYear();

    const mockMembers = [
      {
        id: 'member1',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+994501234567',
        dateOfBirth: '1990-10-08', // Tomorrow
        membershipType: 'Viking Warrior Pro',
        joinDate: '2023-01-15',
      },
      {
        id: 'member2',
        firstName: 'Mike',
        lastName: 'Thompson',
        email: 'mike.thompson@email.com',
        phone: '+994501234568',
        dateOfBirth: '1995-10-07', // Today
        membershipType: 'Monthly Unlimited',
        joinDate: '2023-03-20',
      },
      {
        id: 'member3',
        firstName: 'Elena',
        lastName: 'Rodriguez',
        email: 'elena.rodriguez@email.com',
        phone: '+994501234569',
        dateOfBirth: '1988-10-12', // This week
        membershipType: 'Single Entry',
        joinDate: '2022-07-10',
      },
      {
        id: 'member4',
        firstName: 'David',
        lastName: 'Kim',
        email: 'david.kim@email.com',
        phone: '+994501234570',
        dateOfBirth: '1992-10-15', // This week
        membershipType: 'Company Partnership',
        joinDate: '2023-05-08',
      },
      {
        id: 'member5',
        firstName: 'Anna',
        lastName: 'Petrov',
        email: 'anna.petrov@email.com',
        phone: '+994501234571',
        dateOfBirth: '1985-10-25', // This month
        membershipType: 'Viking Warrior Basic',
        joinDate: '2022-12-01',
      },
      {
        id: 'member6',
        firstName: 'James',
        lastName: 'Wilson',
        email: 'james.wilson@email.com',
        phone: '+994501234572',
        dateOfBirth: '1991-10-30', // This month
        membershipType: 'Monthly 12 Entries',
        joinDate: '2023-02-14',
      },
      {
        id: 'member7',
        firstName: 'Lisa',
        lastName: 'Chen',
        email: 'lisa.chen@email.com',
        phone: '+994501234573',
        dateOfBirth: '1993-11-03', // Next month
        membershipType: 'Viking Warrior Pro',
        joinDate: '2023-06-22',
      },
      {
        id: 'member8',
        firstName: 'Alex',
        lastName: 'Müller',
        email: 'alex.muller@email.com',
        phone: '+994501234574',
        dateOfBirth: '1987-11-18', // Next month
        membershipType: 'Company Partnership',
        joinDate: '2022-09-05',
      },
    ];

    const processedMembers: BirthdayMember[] = mockMembers.map((member) => {
      const birthDate = new Date(member.dateOfBirth);
      const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());

      // If birthday has passed this year, calculate for next year
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(currentYear + 1);
      }

      const daysUntilBirthday = Math.ceil(
        (thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      const age = currentYear - birthDate.getFullYear();

      const isToday = daysUntilBirthday === 0;
      const thisWeek = daysUntilBirthday <= 7;
      const thisMonth = daysUntilBirthday <= 31;

      return {
        ...member,
        age: age,
        daysUntilBirthday,
        isToday,
        thisWeek,
        thisMonth,
      };
    });

    // Sort by days until birthday
    processedMembers.sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
    setBirthdays(processedMembers);
  };

  const getFilteredBirthdays = () => {
    let filtered = birthdays.filter((member) => {
      // Only show birthdays within next 30 days
      if (member.daysUntilBirthday > 30) return false;

      const matchesSearch =
        member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'today' && member.isToday) ||
        (activeFilter === 'week' && member.thisWeek) ||
        (activeFilter === 'month' && member.thisMonth);

      return matchesSearch && matchesFilter;
    });

    return filtered;
  };

  const getBirthdayStatus = (member: BirthdayMember) => {
    if (member.isToday) return { text: t('admin.birthdays.status.today'), class: 'today' };
    if (member.daysUntilBirthday === 1)
      return { text: t('admin.birthdays.status.tomorrow'), class: 'tomorrow' };
    if (member.thisWeek)
      return {
        text: t('admin.birthdays.status.inDays', { count: member.daysUntilBirthday }),
        class: 'this-week',
      };
    if (member.thisMonth)
      return {
        text: t('admin.birthdays.status.inDays', { count: member.daysUntilBirthday }),
        class: 'this-month',
      };
    return {
      text: t('admin.birthdays.status.inDays', { count: member.daysUntilBirthday }),
      class: 'later',
    };
  };

  const getStats = () => {
    const today = birthdays.filter((m) => m.isToday).length;
    const thisWeek = birthdays.filter((m) => m.thisWeek && !m.isToday).length;
    const thisMonth = birthdays.filter((m) => m.thisMonth && !m.thisWeek).length;
    const total = birthdays.length;

    return { today, thisWeek, thisMonth, total };
  };

  const handleSendBirthdayWish = (member: BirthdayMember) => {
    setSelectedMember(member);
    setShowCelebrationModal(true);

    // Set default message based on template
    const defaultMessage = getBirthdayMessage(member, 'default');
    setCelebrationMessage(defaultMessage);
  };

  const getBirthdayMessage = (member: BirthdayMember, template: string) => {
    return t(`admin.birthdays.templates.${template}`, {
      firstName: member.firstName,
      lastName: member.lastName,
      membershipType: member.membershipType,
      fullDate: formatDate(member.dateOfBirth),
    });
  };

  const handleTemplateChange = (template: string) => {
    setCelebrationTemplate(template);
    if (selectedMember) {
      setCelebrationMessage(getBirthdayMessage(selectedMember, template));
    }
  };

  const sendBirthdayMessage = () => {
    if (!selectedMember) return;

    // Get selected delivery methods from checkboxes
    const emailCheckbox = document.querySelector(
      'input[type="checkbox"]:nth-of-type(1)',
    ) as HTMLInputElement;
    const smsCheckbox = document.querySelector(
      'input[type="checkbox"]:nth-of-type(2)',
    ) as HTMLInputElement;
    const whatsappCheckbox = document.querySelector(
      'input[type="checkbox"]:nth-of-type(3)',
    ) as HTMLInputElement;
    const inAppCheckbox = document.querySelector(
      'input[type="checkbox"]:nth-of-type(4)',
    ) as HTMLInputElement;

    const message = celebrationMessage || getBirthdayMessage(selectedMember, celebrationTemplate);
    let sentVia: string[] = [];

    // Send via Email (native mailto)
    if (emailCheckbox?.checked) {
      const subject = t('admin.birthdays.emailSubject', {
        firstName: selectedMember.firstName,
      });
      const mailtoLink = `mailto:${selectedMember.email}?subject=${encodeURIComponent(
        subject,
      )}&body=${encodeURIComponent(message)}`;
      window.location.href = mailtoLink;
      sentVia.push(t('admin.birthdays.channels.email'));
    }

    // Send via SMS (native sms)
    if (smsCheckbox?.checked) {
      // Format phone number (remove spaces and special characters)
      const phoneNumber = selectedMember.phone.replace(/[^0-9+]/g, '');
      const smsLink = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;

      // For Windows/Android
      if (navigator.userAgent.includes('Windows') || navigator.userAgent.includes('Android')) {
        window.location.href = smsLink;
      } else {
        // For iOS
        window.location.href = smsLink.replace('?', '&');
      }
      sentVia.push(t('admin.birthdays.channels.sms'));
    }

    // Send via WhatsApp (wa.me link)
    if (whatsappCheckbox?.checked) {
      const phoneNumber = selectedMember.phone.replace(/[^0-9]/g, ''); // Remove all non-digits
      const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappLink, '_blank');
      sentVia.push(t('admin.birthdays.channels.whatsapp'));
    }

    // Send In-App Notification (API call to notifications_outbox)
    if (inAppCheckbox?.checked) {
      sendInAppNotification(selectedMember.id, message);
      sentVia.push(t('admin.birthdays.channels.inApp'));
    }

    if (sentVia.length > 0) {
      alert(
        t('admin.birthdays.alerts.prepared', {
          channels: sentVia.join(', '),
          firstChannel: sentVia[0],
        }),
      );
    } else {
      alert(t('admin.birthdays.alerts.selectOne'));
      return;
    }

    setShowCelebrationModal(false);
    setCelebrationMessage('');
    setSelectedMember(null);
  };

  // Send in-app notification via backend API
  const sendInAppNotification = async (userId: string, message: string) => {
    try {
      const response = await fetch('http://localhost:4001/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_user_id: userId,
          payload: {
            type: 'birthday',
            title: t('admin.birthdays.notificationTitle'),
            message: message,
            timestamp: new Date().toISOString(),
          },
          channel: 'in-app',
          status: 'pending',
        }),
      });

      const result = await response.json();
      if (result.success) {
        console.log('✅ In-app notification queued successfully');
      } else {
        console.error('❌ Failed to queue notification:', result.error);
      }
    } catch (error) {
      console.error('Error sending in-app notification:', error);
    }
  };

  const stats = getStats();

  return (
    <div className="upcoming-birthdays">
      <div className="birthdays-header">
        <button className="back-button" onClick={onBack}>
          {t('admin.birthdays.back')}
        </button>
        <h2 className="birthdays-title">{t('admin.birthdays.title')}</h2>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card today-stat">
          <div className="stat-icon">🎂</div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.today}</h3>
            <p className="stat-label">{t('admin.birthdays.stats.today')}</p>
          </div>
        </div>
        <div className="stat-card week-stat">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.thisWeek}</h3>
            <p className="stat-label">{t('admin.birthdays.stats.week')}</p>
          </div>
        </div>
        <div className="stat-card month-stat">
          <div className="stat-icon">🗓️</div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.thisMonth}</h3>
            <p className="stat-label">{t('admin.birthdays.stats.month')}</p>
          </div>
        </div>
        <div className="stat-card total-stat">
          <div className="stat-icon">🎉</div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.total}</h3>
            <p className="stat-label">{t('admin.birthdays.stats.total')}</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="controls-section">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            {t('admin.birthdays.filters.all')}
          </button>
          <button
            className={`filter-btn ${activeFilter === 'today' ? 'active' : ''}`}
            onClick={() => setActiveFilter('today')}
          >
            {t('admin.birthdays.filters.today')}
          </button>
          <button
            className={`filter-btn ${activeFilter === 'week' ? 'active' : ''}`}
            onClick={() => setActiveFilter('week')}
          >
            {t('admin.birthdays.filters.week')}
          </button>
          <button
            className={`filter-btn ${activeFilter === 'month' ? 'active' : ''}`}
            onClick={() => setActiveFilter('month')}
          >
            {t('admin.birthdays.filters.month')}
          </button>
        </div>

        <div className="search-section">
          <input
            type="text"
            placeholder={t('admin.birthdays.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Birthdays List */}
      <div className="birthdays-list">
        {getFilteredBirthdays().length === 0 ? (
          <div className="no-birthdays">
            <div className="no-data-icon">🎂</div>
            <h3>{t('admin.birthdays.noResults.title')}</h3>
            <p>{t('admin.birthdays.noResults.description')}</p>
          </div>
        ) : (
          getFilteredBirthdays().map((member) => {
            const status = getBirthdayStatus(member);
            const isExpanded = expandedCards.has(member.id);

            return (
              <div
                key={member.id}
                className={`birthday-card ${status.class} ${isExpanded ? 'expanded' : 'collapsed'}`}
              >
                <div className="birthday-card-header" onClick={() => toggleCard(member.id)}>
                  <div className="member-avatar">
                    {member.firstName[0]}
                    {member.lastName[0]}
                  </div>
                  <div className="member-info">
                    <h3 className="member-name">
                      {member.firstName} {member.lastName}
                    </h3>
                    <p className="member-details-compact">
                      {formatBirthday(member.dateOfBirth)} •{' '}
                      {t('admin.birthdays.age', {
                        age: member.age,
                      })}
                    </p>
                  </div>
                  <div className="birthday-status">
                    <span className={`status-badge ${status.class}`}>{status.text}</span>
                  </div>
                  <button
                    className="expand-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCard(member.id);
                    }}
                  >
                    {isExpanded ? '−' : '+'}
                  </button>
                </div>

                {isExpanded && (
                  <>
                    <div className="birthday-details">
                      <div className="detail-row">
                        <span className="detail-icon">📧</span>
                        <span className="detail-label">{t('admin.birthdays.labels.email')}</span>
                        <span className="detail-value">{member.email}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-icon">📱</span>
                        <span className="detail-label">{t('admin.birthdays.labels.phone')}</span>
                        <span className="detail-value">{member.phone}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-icon">💳</span>
                        <span className="detail-label">
                          {t('admin.birthdays.labels.membership')}
                        </span>
                        <span className="detail-value">{member.membershipType}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-icon">🗓️</span>
                        <span className="detail-label">
                          {t('admin.birthdays.labels.memberSince')}
                        </span>
                        <span className="detail-value">{formatDate(member.joinDate)}</span>
                      </div>
                    </div>

                    <div className="birthday-actions">
                      <button className="wish-btn" onClick={() => handleSendBirthdayWish(member)}>
                        {t('admin.birthdays.actions.sendWish')}
                      </button>
                      <button className="contact-btn">{t('admin.birthdays.actions.call')}</button>
                      <button className="email-btn">{t('admin.birthdays.actions.email')}</button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Birthday Celebration Modal */}
      {showCelebrationModal && selectedMember && (
        <div className="modal-overlay">
          <div className="modal-content celebration-modal">
            <div className="modal-header">
              <h3>{t('admin.birthdays.modal.title', { name: selectedMember.firstName })}</h3>
              <button className="close-btn" onClick={() => setShowCelebrationModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="member-preview">
                <div className="member-avatar large">
                  {selectedMember.firstName[0]}
                  {selectedMember.lastName[0]}
                </div>
                <div className="member-details">
                  <h4>
                    {selectedMember.firstName} {selectedMember.lastName}
                  </h4>
                  <p>
                    {t('admin.birthdays.modal.turning', {
                      age: selectedMember.age,
                      date: formatDate(selectedMember.dateOfBirth),
                    })}
                  </p>
                  <p>{selectedMember.membershipType}</p>
                </div>
              </div>

              <div className="form-group">
                <label>{t('admin.birthdays.modal.templateLabel')}</label>
                <select
                  value={celebrationTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="template-select"
                >
                  <option value="default">{t('admin.birthdays.templateOptions.default')}</option>
                  <option value="formal">{t('admin.birthdays.templateOptions.formal')}</option>
                  <option value="casual">{t('admin.birthdays.templateOptions.casual')}</option>
                  <option value="motivational">
                    {t('admin.birthdays.templateOptions.motivational')}
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label>{t('admin.birthdays.modal.messageLabel')}</label>
                <textarea
                  value={celebrationMessage}
                  onChange={(e) => setCelebrationMessage(e.target.value)}
                  rows={8}
                  className="message-textarea"
                  placeholder={t('admin.birthdays.modal.messagePlaceholder')}
                />
              </div>

              <div className="delivery-options">
                <h4>{t('admin.birthdays.modal.deliveryTitle')}</h4>
                <div className="delivery-methods">
                  <label className="delivery-option">
                    <input type="checkbox" defaultChecked />
                    {t('admin.birthdays.delivery.email', { email: selectedMember.email })}
                  </label>
                  <label className="delivery-option">
                    <input type="checkbox" />
                    {t('admin.birthdays.delivery.sms', { phone: selectedMember.phone })}
                  </label>
                  <label className="delivery-option">
                    <input type="checkbox" />
                    {t('admin.birthdays.delivery.whatsapp', { phone: selectedMember.phone })}
                  </label>
                  <label className="delivery-option">
                    <input type="checkbox" />
                    {t('admin.birthdays.delivery.inApp')}
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowCelebrationModal(false)}>
                {t('admin.birthdays.modal.cancel')}
              </button>
              <button className="confirm-btn celebration-btn" onClick={sendBirthdayMessage}>
                {t('admin.birthdays.modal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingBirthdays;
