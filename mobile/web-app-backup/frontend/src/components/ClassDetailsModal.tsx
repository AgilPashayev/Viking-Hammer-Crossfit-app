import React from 'react';
import { GymClass } from '../services/classManagementService';
import './ClassDetailsModal.css';
import { useTranslation } from 'react-i18next';

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
  const { t, i18n } = useTranslation();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const currentLang = i18n.language;

    // Use locale-specific formatting
    if (currentLang === 'az') {
      const dayNames = [
        'Bazar',
        'Bazar ertəsi',
        'Çərşənbə axşamı',
        'Çərşənbə',
        'Cümə axşamı',
        'Cümə',
        'Şənbə',
      ];
      const monthNames = [
        'Yan',
        'Fev',
        'Mar',
        'Apr',
        'May',
        'İyn',
        'İyl',
        'Avq',
        'Sen',
        'Okt',
        'Noy',
        'Dek',
      ];
      return `${dayNames[date.getDay()]}, ${
        monthNames[date.getMonth()]
      } ${date.getDate()}, ${date.getFullYear()}`;
    } else if (currentLang === 'ru') {
      const dayNames = [
        'Воскресенье',
        'Понедельник',
        'Вторник',
        'Среда',
        'Четверг',
        'Пятница',
        'Суббота',
      ];
      const monthNames = [
        'Янв',
        'Фев',
        'Мар',
        'Апр',
        'Май',
        'Июн',
        'Июл',
        'Авг',
        'Сен',
        'Окт',
        'Ноя',
        'Дек',
      ];
      return `${dayNames[date.getDay()]}, ${
        monthNames[date.getMonth()]
      } ${date.getDate()}, ${date.getFullYear()}`;
    }

    // English (default)
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

  // Translate difficulty level
  const translateDifficulty = (difficulty: string): string => {
    const difficultyMap: { [key: string]: string } = {
      Beginner: t('classes.difficulty.beginner'),
      Intermediate: t('classes.difficulty.intermediate'),
      Advanced: t('classes.difficulty.advanced'),
      Mixed: t('classes.difficulty.mixed'),
    };
    return difficultyMap[difficulty] || difficulty;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="modal-header">
          <div className="modal-category">{gymClass.category}</div>
          <h2>{gymClass.name}</h2>
          <div
            className="modal-difficulty"
            style={{ color: getDifficultyColor(gymClass.difficulty) }}
          >
            {translateDifficulty(gymClass.difficulty)}
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <h3>📅 {t('classes.modal.schedule')}</h3>
            <div className="schedule-details">
              <p>
                <strong>{t('classes.modal.date')}:</strong> {formatDate(selectedDate)}
              </p>
              <p>
                <strong>{t('classes.modal.time')}:</strong> {selectedTime} ({gymClass.duration}{' '}
                {t('common.minutes', 'minutes')})
              </p>
            </div>
          </div>

          <div className="modal-section">
            <h3>📝 {t('classes.modal.description')}</h3>
            <p className="class-description">
              {gymClass.description || t('classes.modal.addDescription')}
            </p>
          </div>

          <div className="modal-section">
            <h3>👨‍🏫 {t('classes.modal.instructors')}</h3>
            <div className="instructors-list">
              {gymClass.instructorNames && gymClass.instructorNames.length > 0 ? (
                gymClass.instructorNames.map((name, index) => (
                  <div key={index} className="instructor-badge">
                    {name}
                  </div>
                ))
              ) : (
                <p className="text-muted">{t('classes.modal.noInstructors')}</p>
              )}
            </div>
          </div>

          {gymClass.equipment && gymClass.equipment.length > 0 && (
            <div className="modal-section">
              <h3>🏋️ {t('classes.modal.equipment')}</h3>
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
            <h3>👥 {t('classes.modal.capacity')}</h3>
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
                <strong>{gymClass.currentEnrollment}</strong> / {gymClass.maxCapacity}{' '}
                {t('classes.modal.enrolled')}
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
                    ({spotsRemaining} {t('classes.modal.spotsLeft')})
                  </span>
                )}
              </p>
            </div>
          </div>

          {gymClass.price > 0 && (
            <div className="modal-section">
              <h3>💰 {t('classes.modal.price')}</h3>
              <p className="price-info">${gymClass.price.toFixed(2)}</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            {t('classes.modal.close')}
          </button>
          <button
            className={`btn ${isBooked ? 'btn-success' : 'btn-primary'}`}
            onClick={onBook}
            disabled={isBooking || (isClassFull && !isBooked)}
          >
            {isBooking ? (
              <>🔄 {t('classes.modal.processing')}</>
            ) : isBooked ? (
              <>✅ {t('classes.modal.booked')}</>
            ) : isClassFull ? (
              <>🚫 {t('classes.modal.classFull')}</>
            ) : (
              <>📅 {t('classes.modal.bookNow')}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassDetailsModal;
