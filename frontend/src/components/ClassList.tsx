import React, { useState, useEffect } from 'react';
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
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<GymClass | null>(null);
  const [selectedClassDate, setSelectedClassDate] = useState<string>('');
  const [selectedClassTime, setSelectedClassTime] = useState<string>('');
  const [selectedClassDayOfWeek, setSelectedClassDayOfWeek] = useState<number | undefined>(undefined);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  // Load all classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        setIsLoading(true);
        const classesData = await classService.getAll();
        setClasses(classesData.filter(cls => cls.status === 'active'));
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
    let nextSchedule = cls.schedule.find(sch => {
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
    let daysUntilClass = targetDay - now.getDay();
    if (daysUntilClass <= 0) {
      daysUntilClass += 7;
    }
    
    const nextDate = new Date();
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
  const filteredClasses = classes.filter(cls => {
    if (filterCategory !== 'all' && cls.category !== filterCategory) return false;
    if (filterDifficulty !== 'all' && cls.difficulty !== filterDifficulty) return false;
    return true;
  });

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || '';
  };

  if (isLoading) {
    return (
      <div className="class-list">
        <div className="class-list-header">
          <h1>🏋️ All Classes</h1>
        </div>
        <div className="loading-state">
          <div className="loading-spinner">🔄</div>
          <p>Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="class-list">
      <div className="class-list-header">
        <h1>🏋️ All Classes</h1>
        <p>Browse and book any of our available classes</p>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>Category:</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">All Categories</option>
            <option value="Cardio">Cardio</option>
            <option value="Strength">Strength</option>
            <option value="Flexibility">Flexibility</option>
            <option value="Mixed">Mixed</option>
            <option value="Specialized">Specialized</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Difficulty:</label>
          <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}>
            <option value="all">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Class Grid */}
      <div className="classes-grid">
        {filteredClasses.length === 0 ? (
          <div className="no-classes">
            <p>No classes found matching your filters.</p>
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
                    <span className="class-duration">{cls.duration} min</span>
                    <span className="class-instructor">{getInstructorName(cls)}</span>
                  </div>
                  {nextSchedule && (
                    <div className="next-session">
                      <strong>Next: {getDayName(nextSchedule.dayOfWeek)} at {nextSchedule.startTime}</strong>
                    </div>
                  )}
                  <div className="class-capacity">
                    {cls.currentEnrollment}/{cls.maxCapacity} enrolled
                  </div>
                </div>
                <div className="class-card-footer">
                  <button className="btn btn-primary">
                    Book Class
                  </button>
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