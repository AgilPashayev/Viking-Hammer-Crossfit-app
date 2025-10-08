import React, { useState, useEffect } from 'react';
import './ClassManagement.css';

interface Instructor {
  id: string;
  name: string;
  email: string;
  specialization: string[];
  availability: string[];
  rating: number;
  experience: number;
  phone: string;
  status: 'active' | 'inactive' | 'busy';
}

interface GymClass {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  maxCapacity: number;
  currentEnrollment: number;
  instructors: string[]; // instructor IDs
  schedule: {
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    startTime: string;
    endTime: string;
  }[];
  equipment: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'Cardio' | 'Strength' | 'Flexibility' | 'Mixed' | 'Specialized';
  price: number;
  status: 'active' | 'inactive' | 'full';
}

interface ClassManagementProps {
  onBack: () => void;
}

const ClassManagement: React.FC<ClassManagementProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'instructors' | 'schedule'>('classes');
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddInstructorModal, setShowAddInstructorModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<GymClass | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // New class form state
  const [newClass, setNewClass] = useState<Partial<GymClass>>({
    name: '',
    description: '',
    duration: 60,
    maxCapacity: 20,
    instructors: [],
    schedule: [],
    equipment: [],
    difficulty: 'Beginner',
    category: 'Mixed',
    price: 0,
    status: 'active'
  });

  // New instructor form state
  const [newInstructor, setNewInstructor] = useState<Partial<Instructor>>({
    name: '',
    email: '',
    specialization: [],
    availability: [],
    phone: '',
    experience: 0,
    status: 'active'
  });

  useEffect(() => {
    // Load mock data
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Mock instructors data
    const mockInstructors: Instructor[] = [
      {
        id: 'inst1',
        name: 'Sarah Johnson',
        email: 'sarah.j@vikinggym.com',
        specialization: ['Yoga', 'Pilates', 'Flexibility'],
        availability: ['Monday', 'Wednesday', 'Friday'],
        rating: 4.8,
        experience: 5,
        phone: '+994501234567',
        status: 'active'
      },
      {
        id: 'inst2',
        name: 'Mike Thompson',
        email: 'mike.t@vikinggym.com',
        specialization: ['CrossFit', 'Strength Training', 'HIIT'],
        availability: ['Tuesday', 'Thursday', 'Saturday'],
        rating: 4.9,
        experience: 8,
        phone: '+994501234568',
        status: 'active'
      },
      {
        id: 'inst3',
        name: 'Elena Rodriguez',
        email: 'elena.r@vikinggym.com',
        specialization: ['Zumba', 'Dance', 'Cardio'],
        availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        rating: 4.7,
        experience: 3,
        phone: '+994501234569',
        status: 'active'
      },
      {
        id: 'inst4',
        name: 'David Kim',
        email: 'david.k@vikinggym.com',
        specialization: ['Boxing', 'Martial Arts', 'Self Defense'],
        availability: ['Wednesday', 'Friday', 'Saturday', 'Sunday'],
        rating: 4.6,
        experience: 6,
        phone: '+994501234570',
        status: 'busy'
      }
    ];

    // Mock classes data
    const mockClasses: GymClass[] = [
      {
        id: 'class1',
        name: 'Morning Yoga Flow',
        description: 'A gentle yoga session to start your day with energy and mindfulness.',
        duration: 60,
        maxCapacity: 15,
        currentEnrollment: 12,
        instructors: ['inst1'],
        schedule: [
          { dayOfWeek: 1, startTime: '07:00', endTime: '08:00' },
          { dayOfWeek: 3, startTime: '07:00', endTime: '08:00' },
          { dayOfWeek: 5, startTime: '07:00', endTime: '08:00' }
        ],
        equipment: ['Yoga Mats', 'Blocks', 'Straps'],
        difficulty: 'Beginner',
        category: 'Flexibility',
        price: 15,
        status: 'active'
      },
      {
        id: 'class2',
        name: 'CrossFit Intensity',
        description: 'High-intensity functional fitness workout combining strength and cardio.',
        duration: 45,
        maxCapacity: 12,
        currentEnrollment: 12,
        instructors: ['inst2'],
        schedule: [
          { dayOfWeek: 2, startTime: '18:00', endTime: '18:45' },
          { dayOfWeek: 4, startTime: '18:00', endTime: '18:45' },
          { dayOfWeek: 6, startTime: '10:00', endTime: '10:45' }
        ],
        equipment: ['Barbells', 'Kettlebells', 'Pull-up Bars', 'Boxes'],
        difficulty: 'Advanced',
        category: 'Mixed',
        price: 25,
        status: 'full'
      },
      {
        id: 'class3',
        name: 'Zumba Party',
        description: 'Fun dance fitness class with Latin and international music.',
        duration: 60,
        maxCapacity: 25,
        currentEnrollment: 18,
        instructors: ['inst3'],
        schedule: [
          { dayOfWeek: 1, startTime: '19:00', endTime: '20:00' },
          { dayOfWeek: 3, startTime: '19:00', endTime: '20:00' },
          { dayOfWeek: 5, startTime: '19:00', endTime: '20:00' }
        ],
        equipment: ['Sound System', 'Mirrors'],
        difficulty: 'Beginner',
        category: 'Cardio',
        price: 18,
        status: 'active'
      },
      {
        id: 'class4',
        name: 'Boxing Fundamentals',
        description: 'Learn basic boxing techniques and improve your fitness.',
        duration: 75,
        maxCapacity: 10,
        currentEnrollment: 7,
        instructors: ['inst4'],
        schedule: [
          { dayOfWeek: 3, startTime: '20:00', endTime: '21:15' },
          { dayOfWeek: 6, startTime: '14:00', endTime: '15:15' }
        ],
        equipment: ['Boxing Gloves', 'Heavy Bags', 'Speed Bags', 'Hand Wraps'],
        difficulty: 'Intermediate',
        category: 'Specialized',
        price: 22,
        status: 'active'
      }
    ];

    setInstructors(mockInstructors);
    setClasses(mockClasses);
  };

  const getInstructorName = (instructorId: string): string => {
    const instructor = instructors.find(inst => inst.id === instructorId);
    return instructor ? instructor.name : 'Unknown Instructor';
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const getFilteredClasses = () => {
    return classes.filter(gymClass => {
      const matchesSearch = gymClass.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           gymClass.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || gymClass.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || gymClass.status === filterStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  };

  const getFilteredInstructors = () => {
    return instructors.filter(instructor => {
      const matchesSearch = instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           instructor.specialization.some(spec => 
                             spec.toLowerCase().includes(searchTerm.toLowerCase())
                           );
      const matchesStatus = filterStatus === 'all' || instructor.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  };

  const handleAddClass = () => {
    if (newClass.name && newClass.description) {
      if (selectedClass && selectedClass.id) {
        // Edit existing class
        const updatedClasses = classes.map(c => 
          c.id === selectedClass.id ? { ...newClass, id: selectedClass.id } as GymClass : c
        );
        setClasses(updatedClasses);
      } else {
        // Add new class
        const classToAdd: GymClass = {
          ...newClass,
          id: `class${Date.now()}`,
          currentEnrollment: 0,
        } as GymClass;
        setClasses([...classes, classToAdd]);
      }
      
      setNewClass({
        name: '',
        description: '',
        duration: 60,
        maxCapacity: 20,
        instructors: [],
        schedule: [],
        equipment: [],
        difficulty: 'Beginner',
        category: 'Mixed',
        price: 0,
        status: 'active'
      });
      setSelectedClass(null);
      setShowAddClassModal(false);
    }
  };

  const handleAddInstructor = () => {
    if (newInstructor.name && newInstructor.email) {
      if (newInstructor.id) {
        // Edit existing instructor
        const updatedInstructors = instructors.map(i => 
          i.id === newInstructor.id ? newInstructor as Instructor : i
        );
        setInstructors(updatedInstructors);
      } else {
        // Add new instructor
        const instructorToAdd: Instructor = {
          ...newInstructor,
          id: `inst${Date.now()}`,
          rating: 0,
        } as Instructor;
        setInstructors([...instructors, instructorToAdd]);
      }
      
      setNewInstructor({
        name: '',
        email: '',
        specialization: [],
        availability: [],
        phone: '',
        experience: 0,
        status: 'active'
      });
      setShowAddInstructorModal(false);
    }
  };

  const handleAssignInstructor = (instructorId: string) => {
    if (selectedClass) {
      const updatedClasses = classes.map(gymClass => {
        if (gymClass.id === selectedClass.id) {
          const updatedInstructors = gymClass.instructors.includes(instructorId)
            ? gymClass.instructors.filter(id => id !== instructorId)
            : [...gymClass.instructors, instructorId];
          return { ...gymClass, instructors: updatedInstructors };
        }
        return gymClass;
      });
      
      setClasses(updatedClasses);
      setSelectedClass({
        ...selectedClass,
        instructors: selectedClass.instructors.includes(instructorId)
          ? selectedClass.instructors.filter(id => id !== instructorId)
          : [...selectedClass.instructors, instructorId]
      });
    }
  };

  const handleEditClass = (gymClass: GymClass) => {
    setNewClass(gymClass);
    setSelectedClass(gymClass);
    setShowAddClassModal(true);
  };

  const handleDeleteClass = (classId: string) => {
    if (confirm('Are you sure you want to delete this class?')) {
      setClasses(classes.filter(c => c.id !== classId));
    }
  };

  const handleEditInstructor = (instructor: Instructor) => {
    setNewInstructor(instructor);
    setShowAddInstructorModal(true);
  };

  const handleDeleteInstructor = (instructorId: string) => {
    if (confirm('Are you sure you want to delete this instructor?')) {
      setInstructors(instructors.filter(i => i.id !== instructorId));
      // Also remove from any assigned classes
      setClasses(classes.map(c => ({
        ...c,
        instructors: c.instructors.filter(id => id !== instructorId)
      })));
    }
  };

  const renderClassesTab = () => (
    <div className="tab-content">
      <div className="section-header">
        <h3>Gym Classes Management</h3>
        <button className="add-btn" onClick={() => setShowAddClassModal(true)}>
          ➕ Add New Class
        </button>
      </div>

      <div className="filters-section">
        <div className="search-filters">
          <input
            type="text"
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="Cardio">Cardio</option>
            <option value="Strength">Strength</option>
            <option value="Flexibility">Flexibility</option>
            <option value="Mixed">Mixed</option>
            <option value="Specialized">Specialized</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="full">Full</option>
          </select>
        </div>
      </div>

      <div className="classes-grid">
        {getFilteredClasses().map(gymClass => (
          <div key={gymClass.id} className="class-card">
            <div className="class-header">
              <h4 className="class-name">{gymClass.name}</h4>
              <span className={`status-badge status-${gymClass.status}`}>
                {gymClass.status}
              </span>
            </div>
            
            <p className="class-description">{gymClass.description}</p>
            
            <div className="class-details">
              <div className="detail-item">
                <span className="detail-label">Duration:</span>
                <span className="detail-value">{gymClass.duration} min</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Capacity:</span>
                <span className="detail-value">
                  {gymClass.currentEnrollment}/{gymClass.maxCapacity}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Price:</span>
                <span className="detail-value">{gymClass.price} AZN</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Difficulty:</span>
                <span className={`difficulty-badge difficulty-${gymClass.difficulty.toLowerCase()}`}>
                  {gymClass.difficulty}
                </span>
              </div>
            </div>

            <div className="instructors-section">
              <span className="detail-label">Instructors:</span>
              <div className="instructors-list">
                {gymClass.instructors.length > 0 ? (
                  gymClass.instructors.map(instructorId => (
                    <span key={instructorId} className="instructor-tag">
                      {getInstructorName(instructorId)}
                    </span>
                  ))
                ) : (
                  <span className="no-instructors">No instructors assigned</span>
                )}
              </div>
            </div>

            <div className="schedule-section">
              <span className="detail-label">Schedule:</span>
              <div className="schedule-list">
                {gymClass.schedule.map((schedule, index) => (
                  <div key={index} className="schedule-item">
                    {getDayName(schedule.dayOfWeek)} {schedule.startTime} - {schedule.endTime}
                  </div>
                ))}
              </div>
            </div>

            <div className="class-actions">
              <button 
                className="assign-btn"
                onClick={() => {
                  setSelectedClass(gymClass);
                  setShowAssignModal(true);
                }}
              >
                👥 Assign Instructors
              </button>
              <button className="edit-btn" onClick={() => handleEditClass(gymClass)}>✏️ Edit</button>
              <button className="delete-btn" onClick={() => handleDeleteClass(gymClass.id)}>🗑️ Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInstructorsTab = () => (
    <div className="tab-content">
      <div className="section-header">
        <h3>Instructors Management</h3>
        <button className="add-btn" onClick={() => setShowAddInstructorModal(true)}>
          ➕ Add New Instructor
        </button>
      </div>

      <div className="filters-section">
        <div className="search-filters">
          <input
            type="text"
            placeholder="Search instructors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="busy">Busy</option>
          </select>
        </div>
      </div>

      <div className="instructors-grid">
        {getFilteredInstructors().map(instructor => (
          <div key={instructor.id} className="instructor-card">
            <div className="instructor-header">
              <h4 className="instructor-name">{instructor.name}</h4>
              <span className={`status-badge status-${instructor.status}`}>
                {instructor.status}
              </span>
            </div>
            
            <div className="instructor-details">
              <div className="detail-item">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{instructor.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{instructor.phone}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Experience:</span>
                <span className="detail-value">{instructor.experience} years</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Rating:</span>
                <span className="detail-value">⭐ {instructor.rating}</span>
              </div>
            </div>

            <div className="specialization-section">
              <span className="detail-label">Specializations:</span>
              <div className="specialization-list">
                {instructor.specialization.map((spec, index) => (
                  <span key={index} className="specialization-tag">
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            <div className="availability-section">
              <span className="detail-label">Availability:</span>
              <div className="availability-list">
                {instructor.availability.map((day, index) => (
                  <span key={index} className="availability-tag">
                    {day}
                  </span>
                ))}
              </div>
            </div>

            <div className="instructor-actions">
              <button className="edit-btn" onClick={() => handleEditInstructor(instructor)}>✏️ Edit</button>
              <button className="schedule-btn" onClick={() => console.log('Schedule for:', instructor.name)}>📅 Schedule</button>
              <button className="delete-btn" onClick={() => handleDeleteInstructor(instructor.id)}>🗑️ Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderScheduleTab = () => (
    <div className="tab-content">
      <div className="section-header">
        <h3>Weekly Schedule</h3>
        <button className="add-btn">📅 Add Schedule Slot</button>
      </div>
      
      <div className="schedule-calendar">
        {/* Weekly calendar view would be implemented here */}
        <div className="coming-soon">
          <h4>📅 Weekly Schedule Calendar</h4>
          <p>Advanced schedule management coming soon...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="class-management">
      <div className="class-management-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Reception
        </button>
        <h2 className="class-management-title">🏋️‍♂️ Class & Instructor Management</h2>
      </div>

      <div className="tabs-navigation">
        <button 
          className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          🏃‍♀️ Classes
        </button>
        <button 
          className={`tab-btn ${activeTab === 'instructors' ? 'active' : ''}`}
          onClick={() => setActiveTab('instructors')}
        >
          👨‍🏫 Instructors
        </button>
        <button 
          className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          📅 Schedule
        </button>
      </div>

      {activeTab === 'classes' && renderClassesTab()}
      {activeTab === 'instructors' && renderInstructorsTab()}
      {activeTab === 'schedule' && renderScheduleTab()}

      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Class</h3>
              <button className="close-btn" onClick={() => setShowAddClassModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Class Name:</label>
                <input
                  type="text"
                  value={newClass.name || ''}
                  onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                  placeholder="Enter class name"
                />
              </div>
              
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={newClass.description || ''}
                  onChange={(e) => setNewClass({...newClass, description: e.target.value})}
                  placeholder="Enter class description"
                  rows={3}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Duration (minutes):</label>
                  <input
                    type="number"
                    value={newClass.duration || 60}
                    onChange={(e) => setNewClass({...newClass, duration: parseInt(e.target.value)})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Max Capacity:</label>
                  <input
                    type="number"
                    value={newClass.maxCapacity || 20}
                    onChange={(e) => setNewClass({...newClass, maxCapacity: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Category:</label>
                  <select
                    value={newClass.category || 'Mixed'}
                    onChange={(e) => setNewClass({...newClass, category: e.target.value as any})}
                  >
                    <option value="Cardio">Cardio</option>
                    <option value="Strength">Strength</option>
                    <option value="Flexibility">Flexibility</option>
                    <option value="Mixed">Mixed</option>
                    <option value="Specialized">Specialized</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Difficulty:</label>
                  <select
                    value={newClass.difficulty || 'Beginner'}
                    onChange={(e) => setNewClass({...newClass, difficulty: e.target.value as any})}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Price (AZN):</label>
                <input
                  type="number"
                  value={newClass.price || 0}
                  onChange={(e) => setNewClass({...newClass, price: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAddClassModal(false)}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleAddClass}>
                Add Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Instructor Modal */}
      {showAddInstructorModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Instructor</h3>
              <button className="close-btn" onClick={() => setShowAddInstructorModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Full Name:</label>
                <input
                  type="text"
                  value={newInstructor.name || ''}
                  onChange={(e) => setNewInstructor({...newInstructor, name: e.target.value})}
                  placeholder="Enter instructor name"
                />
              </div>
              
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={newInstructor.email || ''}
                  onChange={(e) => setNewInstructor({...newInstructor, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
              
              <div className="form-group">
                <label>Phone:</label>
                <input
                  type="tel"
                  value={newInstructor.phone || ''}
                  onChange={(e) => setNewInstructor({...newInstructor, phone: e.target.value})}
                  placeholder="+994501234567"
                />
              </div>
              
              <div className="form-group">
                <label>Experience (years):</label>
                <input
                  type="number"
                  value={newInstructor.experience || 0}
                  onChange={(e) => setNewInstructor({...newInstructor, experience: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="form-group">
                <label>Specializations (comma-separated):</label>
                <input
                  type="text"
                  placeholder="e.g., Yoga, Pilates, CrossFit"
                  onChange={(e) => setNewInstructor({
                    ...newInstructor, 
                    specialization: e.target.value.split(',').map(s => s.trim())
                  })}
                />
              </div>
              
              <div className="form-group">
                <label>Availability (comma-separated days):</label>
                <input
                  type="text"
                  placeholder="e.g., Monday, Wednesday, Friday"
                  onChange={(e) => setNewInstructor({
                    ...newInstructor, 
                    availability: e.target.value.split(',').map(s => s.trim())
                  })}
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAddInstructorModal(false)}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleAddInstructor}>
                Add Instructor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Instructor Modal */}
      {showAssignModal && selectedClass && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Assign Instructors to "{selectedClass.name}"</h3>
              <button className="close-btn" onClick={() => setShowAssignModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="instructors-assignment">
                {instructors.map(instructor => (
                  <div key={instructor.id} className="instructor-assignment-item">
                    <div className="instructor-info">
                      <h4>{instructor.name}</h4>
                      <p>⭐ {instructor.rating} | {instructor.experience} years</p>
                      <div className="specializations">
                        {instructor.specialization.map((spec, index) => (
                          <span key={index} className="spec-tag">{spec}</span>
                        ))}
                      </div>
                    </div>
                    <button
                      className={`assign-toggle ${selectedClass.instructors.includes(instructor.id) ? 'assigned' : ''}`}
                      onClick={() => handleAssignInstructor(instructor.id)}
                    >
                      {selectedClass.instructors.includes(instructor.id) ? '✓ Assigned' : '+ Assign'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="confirm-btn" onClick={() => setShowAssignModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;