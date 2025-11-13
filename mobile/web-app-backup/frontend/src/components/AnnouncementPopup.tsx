import React from 'react';
import { formatDate } from '../utils/dateFormatter';
import './AnnouncementPopup.css';

interface Announcement {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'info' | 'warning' | 'success';
}

interface AnnouncementPopupProps {
  announcements: Announcement[];
  onClose: () => Promise<void>;
  isLoading?: boolean;
}

const AnnouncementPopup: React.FC<AnnouncementPopupProps> = ({
  announcements,
  onClose,
  isLoading = false,
}) => {
  if (announcements.length === 0) return null;

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onClose();
  };

  const handleOverlayClick = async (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      await onClose();
    }
  };

  return (
    <div className="announcement-popup-overlay" onClick={handleOverlayClick}>
      <div className="announcement-popup" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <button className="close-btn" onClick={handleClose} disabled={isLoading}>
            ✕
          </button>
          <h2>📢 New Announcements</h2>
          <p className="subtitle">You have {announcements.length} new announcement{announcements.length > 1 ? 's' : ''}</p>
        </div>

        <div className="popup-content">
          {announcements.map((announcement) => (
            <div key={announcement.id} className={`announcement-item ${announcement.type}`}>
              <div className="announcement-header">
                <h3>{announcement.title}</h3>
                <span className="announcement-date">
                  {formatDate(announcement.date)}
                </span>
              </div>
              <p className="announcement-message">{announcement.message}</p>
            </div>
          ))}
        </div>

        <div className="popup-footer">
          <button 
            className="btn-acknowledge" 
            onClick={handleClose}
            disabled={isLoading}
          >
            {isLoading ? 'Marking as read...' : 'Got it!'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementPopup;
