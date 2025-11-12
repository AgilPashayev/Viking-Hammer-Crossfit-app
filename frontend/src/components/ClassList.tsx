import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { classService, GymClass } from '../services/classManagementService';
import ClassDetailsModal from './ClassDetailsModal';
import './ClassList.css';

interface ClassListProps {
  onNavigate?: (page: string) => void;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    membershipType: string;
    joinDate: string;
    isAuthenticated: boolean;
  } | null;
}

const ClassList: React.FC<ClassListProps> = ({ onNavigate, user }) => {
  const { t } = useTranslation();
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<GymClass | null>(null);
  const [selectedClassDate, setSelectedClassDate] = useState<string>('');
  const [selectedClassTime, setSelectedClassTime] = useState<string>('');
  const [selectedClassDayOfWeek, setSelectedClassDayOfWeek] = useState<number | undefined>(
    undefined,
  );
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  // Load all classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        setIsLoading(true);
        const classesData = await classService.getAll();
        setClasses(classesData.filter((cls) => cls.status === 'active'));
      } catch (error) {
        console.error('Failed to load classes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadClasses();
  }, []);

  // Helper function to get instructor name
  const getInstructorName = (cls: GymClass): string => {
    if (cls.instructorNames && cls.instructorNames.length > 0) {
      return cls.instructorNames[0];
    }
    if (cls.instructors && cls.instructors.length > 0) {
      return 'Instructor';
    }
    return 'TBA';
  };

  // Helper function to get next available time for a class
  const getNextAvailableTime = (cls: GymClass) => {
    if (!cls.schedule || cls.schedule.length === 0) return null;

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);

    // Find next available slot
    let nextSchedule = cls.schedule.find((sch) => {
      if (sch.dayOfWeek === currentDay) {
        return sch.startTime > currentTime;
      }
      return sch.dayOfWeek > currentDay;
    });

    if (!nextSchedule && cls.schedule.length > 0) {
      nextSchedule = [...cls.schedule].sort((a, b) => a.dayOfWeek - b.dayOfWeek)[0];
    }

    return nextSchedule;
  };

  // Handle class booking modal
  const handleClassClick = (gymClass: GymClass) => {
    const nextSchedule = getNextAvailableTime(gymClass);
    if (!nextSchedule) return;

    const targetDay = nextSchedule.dayOfWeek;
    const now = new Date();
    const currentDay = now.getDay();

    // Calculate days until target day
    let daysUntilClass = targetDay - currentDay;

    // If target day is in the past or today (and time might have passed), go to next week
    if (
      daysUntilClass < 0 ||
      (daysUntilClass === 0 && now.toTimeString().slice(0, 5) >= nextSchedule.startTime)
    ) {
      daysUntilClass += 7;
    }

    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + daysUntilClass);

    setSelectedClass(gymClass);
    setSelectedClassDate(nextDate.toISOString().split('T')[0]);
    setSelectedClassTime(nextSchedule.startTime);
    setSelectedClassDayOfWeek(nextSchedule.dayOfWeek);
  };

  const handleCloseModal = () => {
    setSelectedClass(null);
    setSelectedClassDate('');
    setSelectedClassTime('');
    setSelectedClassDayOfWeek(undefined);
  };

  // Filter classes
  const filteredClasses = classes.filter((cls) => {
    if (filterCategory !== 'all' && cls.category !== filterCategory) return false;
    if (filterDifficulty !== 'all' && cls.difficulty !== filterDifficulty) return false;
    return true;
  });

  const getDayName = (dayOfWeek: number): string => {
    const days = [
      t('common.sunday') || 'Sunday',
      t('common.monday') || 'Monday',
      t('common.tuesday') || 'Tuesday',
      t('common.wednesday') || 'Wednesday',
      t('common.thursday') || 'Thursday',
      t('common.friday') || 'Friday',
      t('common.saturday') || 'Saturday',
    ];
    return days[dayOfWeek] || '';
  };

  if (isLoading) {
    return (
      <div className="class-list">
        <div className="class-list-header">
          <h1>🏋️ {t('classes.allClasses')}</h1>
        </div>
        <div className="loading-state">
          <div className="loading-spinner">🔄</div>
          <p>{t('classes.loadingClasses')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="class-list">
      <div className="class-list-header">
        <h1>🏋️ {t('classes.allClasses')}</h1>
        <p>{t('classes.browseClasses')}</p>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>{t('classes.filters.category')}:</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">{t('classes.filters.allCategories')}</option>
            <option value="Cardio">{t('classes.filters.cardio')}</option>
            <option value="Strength">{t('classes.filters.strength')}</option>
            <option value="Flexibility">{t('classes.filters.flexibility')}</option>
            <option value="Mixed">{t('classes.filters.mixed')}</option>
            <option value="Specialized">{t('classes.filters.specialized')}</option>
          </select>
        </div>
        <div className="filter-group">
          <label>{t('classes.filters.difficulty')}:</label>
          <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}>
            <option value="all">{t('classes.filters.allLevels')}</option>
            <option value="Beginner">{t('classes.filters.beginner')}</option>
            <option value="Intermediate">{t('classes.filters.intermediate')}</option>
            <option value="Advanced">{t('classes.filters.advanced')}</option>
          </select>
        </div>
      </div>

      {/* Class Grid */}
      <div className="classes-grid">
        {filteredClasses.length === 0 ? (
          <div className="no-classes">
            <p>{t('classes.noClassesFound')}</p>
          </div>
        ) : (
          filteredClasses.map((cls) => {
            const nextSchedule = getNextAvailableTime(cls);
            return (
              <div key={cls.id} className="class-card" onClick={() => handleClassClick(cls)}>
                <div className="class-card-header">
                  <h3>{cls.name}</h3>
                  <span className={`difficulty-badge ${cls.difficulty.toLowerCase()}`}>
                    {cls.difficulty}
                  </span>
                </div>
                <div className="class-card-body">
                  <p className="class-description">{cls.description}</p>
                  <div className="class-details">
                    <span className="class-category">{cls.category}</span>
                    <span className="class-duration">
                      {t('classes.minutes', { count: cls.duration })}
                    </span>
                    <span className="class-instructor">{getInstructorName(cls)}</span>
                  </div>
                  {nextSchedule && (
                    <div className="next-session">
                      <strong>
                        {t('classes.next')}: {getDayName(nextSchedule.dayOfWeek)}{' '}
                        {t('classes.time').toLowerCase()} {nextSchedule.startTime}
                      </strong>
                    </div>
                  )}
                  <div className="class-capacity">
                    {cls.currentEnrollment}/{cls.maxCapacity} {t('classes.enrolled')}
                  </div>
                </div>
                <div className="class-card-footer">
                  <button className="btn btn-primary">{t('classes.bookClass')}</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Class Details Modal */}
      {selectedClass && (
        <ClassDetailsModal
          gymClass={selectedClass}
          selectedDate={selectedClassDate}
          selectedTime={selectedClassTime}
          isBooked={false} // TODO: Implement booking check
          onClose={handleCloseModal}
          onBook={() => {}} // TODO: Implement booking
          isBooking={false}
        />
      )}
    </div>
  );
};

export default ClassList;
