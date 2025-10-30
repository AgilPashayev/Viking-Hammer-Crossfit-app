import React from 'react';
import { GymClass } from '../services/classManagementService';
import './ClassDetailsModal.css';

interface ClassDetailsModalProps {
  gymClass: GymClass;
  selectedDate: string;
  selectedTime: string;
  onClose: () => void;
  onBook: () => void;
  isBooked: boolean;
  isBooking: boolean;
}

const ClassDetailsModal: React.FC<ClassDetailsModalProps> = ({
  gymClass,
  selectedDate,
  selectedTime,
  onClose,
  onBook,
  isBooked,
  isBooking,
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'var(--viking-success)';
      case 'Intermediate':
        return 'var(--viking-warning)';
      case 'Advanced':
        return 'var(--viking-error)';
      default:
        return 'var(--viking-primary)';
    }
  };

  const spotsRemaining = gymClass.maxCapacity - gymClass.currentEnrollment;
  const isClassFull = spotsRemaining <= 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="modal-header">
          <div className="modal-category">{gymClass.category}</div>
          <h2>{gymClass.name}</h2>
          <div className="modal-difficulty" style={{ color: getDifficultyColor(gymClass.difficulty) }}>
            {gymClass.difficulty}
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <h3>📅 Schedule</h3>
            <div className="schedule-details">
              <p>
                <strong>Date:</strong> {formatDate(selectedDate)}
              </p>
              <p>
                <strong>Time:</strong> {selectedTime} ({gymClass.duration} minutes)
              </p>
            </div>
          </div>

          <div className="modal-section">
            <h3>📝 Description</h3>
            <p className="class-description">{gymClass.description}</p>
          </div>

          <div className="modal-section">
            <h3>👨‍🏫 Instructors</h3>
            <div className="instructors-list">
              {gymClass.instructors.map((instructor, index) => (
                <div key={index} className="instructor-badge">
                  {instructor}
                </div>
              ))}
            </div>
          </div>

          {gymClass.equipment && gymClass.equipment.length > 0 && (
            <div className="modal-section">
              <h3>🏋️ Equipment</h3>
              <div className="equipment-list">
                {gymClass.equipment.map((item, index) => (
                  <span key={index} className="equipment-tag">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="modal-section">
            <h3>👥 Capacity</h3>
            <div className="capacity-info">
              <div className="capacity-bar">
                <div
                  className="capacity-fill"
                  style={{
                    width: `${(gymClass.currentEnrollment / gymClass.maxCapacity) * 100}%`,
                    background:
                      spotsRemaining <= 5
                        ? 'var(--viking-error)'
                        : spotsRemaining <= 10
                        ? 'var(--viking-warning)'
                        : 'var(--viking-success)',
                  }}
                />
              </div>
              <p className="capacity-text">
                <strong>{gymClass.currentEnrollment}</strong> / {gymClass.maxCapacity} enrolled
                {spotsRemaining > 0 && (
                  <span
                    className="spots-remaining"
                    style={{
                      color:
                        spotsRemaining <= 5
                          ? 'var(--viking-error)'
                          : spotsRemaining <= 10
                          ? 'var(--viking-warning)'
                          : 'var(--viking-success)',
                    }}
                  >
                    ({spotsRemaining} spots left)
                  </span>
                )}
              </p>
            </div>
          </div>

          {gymClass.price > 0 && (
            <div className="modal-section">
              <h3>💰 Price</h3>
              <p className="price-info">${gymClass.price.toFixed(2)}</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            className={`btn ${isBooked ? 'btn-success' : 'btn-primary'}`}
            onClick={onBook}
            disabled={isBooking || (isClassFull && !isBooked)}
          >
            {isBooking ? (
              <>🔄 Processing...</>
            ) : isBooked ? (
              <>✅ Booked (Click to Cancel)</>
            ) : isClassFull ? (
              <>🚫 Class Full</>
            ) : (
              <>📅 Book Now</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassDetailsModal;
