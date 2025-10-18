import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { classService, instructorService, scheduleService, type GymClass, type Instructor, type ScheduleSlot } from '../services/classManagementService';
import './ClassManagement.css';

interface ClassManagementProps {
  onBack: () => void;
}

const ClassManagement: React.FC<ClassManagementProps> = ({ onBack }) => {
  const { setActiveClassesCount, logActivity } = useData();
  const [activeTab, setActiveTab] = useState<'classes' | 'instructors' | 'schedule'>('classes');
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddInstructorModal, setShowAddInstructorModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<GymClass | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [editingClass, setEditingClass] = useState<GymClass | null>(null);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
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

  // New schedule slot form state
  const [newScheduleSlot, setNewScheduleSlot] = useState<Partial<ScheduleSlot>>({
    classId: '',
    instructorId: '',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00',
    date: new Date().toISOString().split('T')[0],
    enrolledMembers: [],
    status: 'scheduled'
  });

  const [editingScheduleSlot, setEditingScheduleSlot] = useState<ScheduleSlot | null>(null);

  useEffect(() => {
    // Load all data from API
    loadData();
  }, []);

  useEffect(() => {
    // Update active classes count when classes change
    const activeCount = classes.filter(c => c.status === 'active').length;
    setActiveClassesCount(activeCount);
  }, [classes, setActiveClassesCount]);

  // Force 24-hour time format on all time inputs
  useEffect(() => {
    const forceTimeFormat = () => {
      const timeInputs = document.querySelectorAll('input[type="time"]');
      timeInputs.forEach((input: any) => {
        // Remove step to show hours without minutes restriction
        input.removeAttribute('step');
        // Set max to enforce 24h range
        input.setAttribute('max', '23:59');
        input.setAttribute('min', '00:00');
        // Force value to be in HH:MM format
        if (input.value && !input.value.match(/^\d{2}:\d{2}$/)) {
          input.value = '09:00';
        }
      });
    };

    // Run immediately and after a short delay for modal renders
    forceTimeFormat();
    const timer = setTimeout(forceTimeFormat, 100);
    return () => clearTimeout(timer);
  }, [showAddClassModal, showScheduleModal, newClass.schedule]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [classesData, instructorsData, scheduleData] = await Promise.all([
        classService.getAll(),
        instructorService.getAll(),
        scheduleService.getAll()
      ]);
      
      setClasses(classesData);
      setInstructors(instructorsData);
      setScheduleSlots(scheduleData);
      
      // Log successful data load (optional - using console instead)
      console.log(`Loaded ${classesData.length} classes, ${instructorsData.length} instructors, ${scheduleData.length} schedule slots`);
    } catch (error) {
      console.error('Error loading data:', error);
      // Log error (optional - using console instead)
    } finally {
      setLoading(false);
    }
  };

  const loadMockData_DEPRECATED = () => {
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
    // Classes are now managed by DataContext - no need to set them here
  };

  const getInstructorName = (instructorId: string): string => {
    const instructor = instructors.find(inst => inst.id === instructorId);
    return instructor ? instructor.name : 'Unknown Instructor';
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  // Format time to ensure 24-hour format display
  const formatTime24h = (time: string): string => {
    // If time is already in HH:MM format, return as is
    if (time && time.match(/^\d{2}:\d{2}$/)) {
      return time;
    }
    // Handle any edge cases
    return time || '00:00';
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

  const handleAddClass = async () => {
    if (newClass.name && newClass.description) {
      try {
        if (editingClass) {
          // Update existing class
          const result = await classService.update(editingClass.id, newClass);
          if (result.success) {
            setClasses(classes.map(c => c.id === editingClass.id ? result.data! : c));
            logActivity({
              type: 'class_updated',
              message: `Class updated: ${result.data!.name}`
            });
          }
        } else {
          // Create new class
          const classToAdd = {
            ...newClass,
            currentEnrollment: 0,
            status: newClass.status || 'active'
          };
          const result = await classService.create(classToAdd);
          if (result.success) {
            setClasses([...classes, result.data!]);
            logActivity({
              type: 'class_created',
              message: `Class created: ${result.data!.name}`
            });
          }
        }
        
        // Reset form
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
        setEditingClass(null);
        setShowAddClassModal(false);
      } catch (error) {
        console.error('Error adding/updating class:', error);
      }
    }
  };

  const handleAddInstructor = async () => {
    if (newInstructor.name && newInstructor.email) {
      try {
        if (editingInstructor) {
          // Update existing instructor
          const result = await instructorService.update(editingInstructor.id, newInstructor);
          if (result.success) {
            setInstructors(instructors.map(i => i.id === editingInstructor.id ? result.data! : i));
            logActivity({
              type: 'instructor_updated',
              message: `Instructor updated: ${result.data!.name}`
            });
          }
        } else {
          // Create new instructor
          const instructorToAdd = {
            ...newInstructor,
            rating: 0,
            status: newInstructor.status || 'active'
          };
          const result = await instructorService.create(instructorToAdd);
          if (result.success) {
            setInstructors([...instructors, result.data!]);
            logActivity({
              type: 'instructor_created',
              message: `Instructor created: ${result.data!.name}`
            });
          }
        }
        
        // Reset form
        setNewInstructor({
          name: '',
          email: '',
          specialization: [],
          availability: [],
          phone: '',
          experience: 0,
          status: 'active'
        });
        setEditingInstructor(null);
        setShowAddInstructorModal(false);
      } catch (error) {
        console.error('Error adding/updating instructor:', error);
      }
    }
  };

  const handleAssignInstructor = async (instructorId: string) => {
    if (selectedClass) {
      // Toggle instructor assignment
      const updatedInstructors = selectedClass.instructors.includes(instructorId)
        ? selectedClass.instructors.filter(id => id !== instructorId)
        : [...selectedClass.instructors, instructorId];
      
      // Update class via API
      try {
        const result = await classService.update(selectedClass.id, { instructors: updatedInstructors });
        if (result.success) {
          setClasses(classes.map(c => c.id === selectedClass.id ? result.data! : c));
          setSelectedClass(result.data!);
        }
      } catch (error) {
        console.error('Error assigning instructor:', error);
      }
    }
  };

  const handleEditClass = (gymClass: GymClass) => {
    setNewClass(gymClass);
    setEditingClass(gymClass);
    setShowAddClassModal(true);
  };

  const handleDeleteClass = async (classId: string) => {
    const classToDelete = classes.find(c => c.id === classId);
    const className = classToDelete ? classToDelete.name : 'this class';
    const enrollmentInfo = classToDelete ? `\n• Current enrollment: ${classToDelete.currentEnrollment}/${classToDelete.maxCapacity} members` : '';
    
    if (confirm(`⚠️ Delete Class\n\nAre you sure you want to permanently delete "${className}"?${enrollmentInfo}\n\nThis action cannot be undone and will:\n• Remove the class from the schedule\n• Cancel all future sessions\n• Remove instructor assignments\n\nClick OK to confirm deletion or Cancel to keep the class.`)) {
      try {
        const result = await classService.delete(classId);
        if (result.success) {
          setClasses(classes.filter(c => c.id !== classId));
          logActivity({
            type: 'class_deleted',
            message: `Class deleted: ${className}`
          });
        }
      } catch (error) {
        console.error('Error deleting class:', error);
      }
    }
  };

  const handleEditInstructor = (instructor: Instructor) => {
    setNewInstructor(instructor);
    setEditingInstructor(instructor);
    setShowAddInstructorModal(true);
  };

  const handleDeleteInstructor = async (instructorId: string) => {
    const instructorToDelete = instructors.find(i => i.id === instructorId);
    const instructorName = instructorToDelete ? instructorToDelete.name : 'this instructor';
    
    if (confirm(`⚠️ Delete Instructor\n\nAre you sure you want to permanently delete "${instructorName}"?\n\nThis action cannot be undone and will:\n• Remove the instructor from all assigned classes\n• Delete all instructor records\n\nClick OK to confirm deletion or Cancel to keep the instructor.`)) {
      try {
        const result = await instructorService.delete(instructorId);
        if (result.success) {
          setInstructors(instructors.filter(i => i.id !== instructorId));
          
          // Also remove from any assigned classes
          for (const gymClass of classes) {
            if (gymClass.instructors.includes(instructorId)) {
              await classService.update(gymClass.id, {
                instructors: gymClass.instructors.filter(id => id !== instructorId)
              });
            }
          }
          // Reload classes to reflect changes
          const updatedClasses = await classService.getAll();
          setClasses(updatedClasses);
          
          logActivity({
            type: 'instructor_deleted',
            message: `Instructor deleted: ${instructorName}`
          });
        }
      } catch (error) {
        console.error('Error deleting instructor:', error);
      }
    }
  };

  const handleAddScheduleSlot = async () => {
    if (newScheduleSlot.classId && newScheduleSlot.instructorId && newScheduleSlot.startTime && newScheduleSlot.endTime) {
      try {
        if (editingScheduleSlot) {
          // Update existing schedule slot
          const result = await scheduleService.update(editingScheduleSlot.id, newScheduleSlot);
          if (result.success) {
            setScheduleSlots(scheduleSlots.map(s => s.id === editingScheduleSlot.id ? result.data! : s));
            logActivity({
              type: 'schedule_updated',
              message: `Schedule slot updated`
            });
          }
        } else {
          // Create new schedule slot
          const result = await scheduleService.create(newScheduleSlot);
          if (result.success) {
            setScheduleSlots([...scheduleSlots, result.data!]);
            logActivity({
              type: 'schedule_created',
              message: `Schedule slot created`
            });
          }
        }
        
        // Reset form and close modal
        setNewScheduleSlot({
          classId: '',
          instructorId: '',
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:00',
          date: new Date().toISOString().split('T')[0],
          enrolledMembers: [],
          status: 'scheduled'
        });
        setEditingScheduleSlot(null);
        setShowScheduleModal(false);
      } catch (error) {
        console.error('Error saving schedule slot:', error);
      }
    } else {
      alert('Please fill in all required fields (Class, Instructor, Start Time, End Time)');
    }
  };

  const handleEditScheduleSlot = (slot: ScheduleSlot) => {
    setNewScheduleSlot(slot);
    setEditingScheduleSlot(slot);
    setShowScheduleModal(true);
  };

  const renderClassesTab = () => {
    const stats = {
      totalClasses: classes.length,
      activeClasses: classes.filter(c => c.status === 'active').length,
      fullClasses: classes.filter(c => c.status === 'full').length,
      totalCapacity: classes.reduce((sum, c) => sum + c.maxCapacity, 0),
      currentEnrollment: classes.reduce((sum, c) => sum + c.currentEnrollment, 0)
    };

    return (
      <div className="tab-content">
        {/* Statistics Overview */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.totalClasses}</h3>
              <p className="stat-label">Total Classes</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.activeClasses}</h3>
              <p className="stat-label">Active Classes</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.currentEnrollment}/{stats.totalCapacity}</h3>
              <p className="stat-label">Total Enrollment</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.fullClasses}</h3>
              <p className="stat-label">Full Classes</p>
            </div>
          </div>
        </div>

        <div className="section-header">
          <h3>Gym Classes Management</h3>
          <button className="add-btn" onClick={() => {
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
            setEditingClass(null);
            setShowAddClassModal(true);
          }}>
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
        {getFilteredClasses().map(gymClass => {
          const categoryIcons: Record<string, string> = {
            'Cardio': '🏃',
            'Strength': '💪',
            'Flexibility': '🧘',
            'Mixed': '🔄',
            'Specialized': '⚡'
          };
          
          const capacityPercentage = (gymClass.currentEnrollment / gymClass.maxCapacity) * 100;
          const spotsLeft = gymClass.maxCapacity - gymClass.currentEnrollment;
          
          return (
          <div key={gymClass.id} className={`class-card-modern class-${gymClass.category.toLowerCase()}`}>
            {/* Card Header with Category Badge */}
            <div className="card-header-modern">
              <div className="category-badge-modern">
                <span className="category-icon-large">{categoryIcons[gymClass.category]}</span>
                <span className="category-text">{gymClass.category}</span>
              </div>
              <div className={`status-pill status-${gymClass.status}`}>
                {gymClass.status === 'active' ? '🟢' : gymClass.status === 'full' ? '🔴' : '⚫'} {gymClass.status}
              </div>
            </div>

            {/* Class Title */}
            <h3 className="class-title-modern">{gymClass.name}</h3>
            <p className="class-description-modern">{gymClass.description}</p>

            {/* Key Stats Row */}
            <div className="stats-row-modern">
              <div className="stat-pill">
                <span className="stat-icon">⏱️</span>
                <span className="stat-text">{gymClass.duration} min</span>
              </div>
              <div className="stat-pill">
                <span className="stat-icon">💰</span>
                <span className="stat-text">{gymClass.price} AZN</span>
              </div>
              <div className={`stat-pill difficulty-${gymClass.difficulty.toLowerCase()}`}>
                <span className="stat-icon">📊</span>
                <span className="stat-text">{gymClass.difficulty}</span>
              </div>
            </div>

            {/* Enrollment Section */}
            <div className="enrollment-section-modern">
              <div className="enrollment-header">
                <div className="enrollment-info">
                  <span className="enrollment-icon">👥</span>
                  <span className="enrollment-text">
                    <strong>{gymClass.currentEnrollment}</strong> / {gymClass.maxCapacity}
                  </span>
                </div>
                <span className={`spots-badge ${spotsLeft <= 5 ? 'spots-low' : ''}`}>
                  {spotsLeft} spots left
                </span>
              </div>
              <div className="enrollment-bar-modern">
                <div 
                  className="enrollment-fill-modern" 
                  style={{ 
                    width: `${capacityPercentage}%`,
                    background: capacityPercentage >= 90 
                      ? 'linear-gradient(90deg, #e74c3c, #c0392b)' 
                      : capacityPercentage >= 70 
                        ? 'linear-gradient(90deg, #f39c12, #e67e22)' 
                        : 'linear-gradient(90deg, #27ae60, #229954)'
                  }}
                ></div>
              </div>
            </div>

            {/* Instructors Section */}
            <div className="instructors-section-modern">
              <div className="section-label-modern">
                <span className="label-icon">👨‍🏫</span>
                <span>Instructors</span>
              </div>
              <div className="instructors-tags-modern">
                {gymClass.instructors.length > 0 ? (
                  gymClass.instructors.map(instructorId => (
                    <span key={instructorId} className="instructor-badge-modern">
                      {getInstructorName(instructorId)}
                    </span>
                  ))
                ) : (
                  <span className="no-data-text">No instructors assigned</span>
                )}
              </div>
            </div>

            {/* Schedule Section */}
            {gymClass.schedule && gymClass.schedule.length > 0 && (
              <div className="schedule-section-modern">
                <div className="section-label-modern">
                  <span className="label-icon">📅</span>
                  <span>Weekly Schedule (24h)</span>
                </div>
                <div className="schedule-tags-modern">
                  {gymClass.schedule.slice(0, 3).map((schedule, index) => (
                    <div key={index} className="schedule-badge-modern">
                      <span className="day-badge">{getDayName(schedule.dayOfWeek).slice(0, 3)}</span>
                      <span className="time-text">{formatTime24h(schedule.startTime)}-{formatTime24h(schedule.endTime)}</span>
                    </div>
                  ))}
                  {gymClass.schedule.length > 3 && (
                    <span className="more-badge">+{gymClass.schedule.length - 3} more</span>
                  )}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="card-divider-modern"></div>

            {/* Action Buttons */}
            <div className="actions-row-modern">
              <button 
                className="action-btn-modern action-assign"
                onClick={() => {
                  setSelectedClass(gymClass);
                  setShowAssignModal(true);
                }}
                title="Assign Instructors"
              >
                <span className="btn-icon">👥</span>
                <span className="btn-text">Assign</span>
              </button>
              <button 
                className="action-btn-modern action-edit" 
                onClick={() => handleEditClass(gymClass)}
                title="Edit Class"
              >
                <span className="btn-icon">✏️</span>
                <span className="btn-text">Edit</span>
              </button>
              <button 
                className="action-btn-modern action-delete" 
                onClick={() => handleDeleteClass(gymClass.id)}
                title="Delete Class"
              >
                <span className="btn-icon">🗑️</span>
                <span className="btn-text">Delete</span>
              </button>
            </div>
          </div>
          );
        })}
      </div>
    </div>
    );
  };

  const renderInstructorsTab = () => {
    const stats = {
      totalInstructors: instructors.length,
      activeInstructors: instructors.filter(i => i.status === 'active').length,
      specializations: [...new Set(instructors.flatMap(i => i.specialization))].length,
      avgRating: instructors.length > 0 
        ? (instructors.reduce((sum, i) => sum + i.rating, 0) / instructors.length).toFixed(1)
        : '0.0'
    };

    return (
      <div className="tab-content">
        {/* Statistics Overview */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">👨‍🏫</div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.totalInstructors}</h3>
              <p className="stat-label">Total Instructors</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.activeInstructors}</h3>
              <p className="stat-label">Active Instructors</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.avgRating}</h3>
              <p className="stat-label">Average Rating</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.specializations}</h3>
              <p className="stat-label">Specializations</p>
            </div>
          </div>
        </div>

        <div className="section-header">
          <h3>Instructors Management</h3>
          <button className="add-btn" onClick={() => {
            setNewInstructor({
              name: '',
              email: '',
              specialization: [],
              availability: [],
              phone: '',
              experience: 0,
              status: 'active'
            });
            setEditingInstructor(null);
            setShowAddInstructorModal(true);
          }}>
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
              <div className="instructor-avatar">
                <span className="avatar-icon">👨‍🏫</span>
              </div>
              <div className="instructor-info-header">
                <h4 className="instructor-name">{instructor.name}</h4>
                <div className="instructor-rating">
                  <span className="rating-stars">⭐</span>
                  <span className="rating-value">{instructor.rating.toFixed(1)}</span>
                  <span className="experience-badge">{instructor.experience}y exp</span>
                </div>
              </div>
              <span className={`status-badge status-${instructor.status}`}>
                {instructor.status}
              </span>
            </div>
            
            <div className="instructor-details">
              <div className="detail-item">
                <span className="detail-icon">📧</span>
                <div className="detail-content">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{instructor.email}</span>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon">📱</span>
                <div className="detail-content">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{instructor.phone}</span>
                </div>
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
  };

  const renderScheduleTab = () => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Group schedule slots by day of week
    const scheduleByDay: Record<number, ScheduleSlot[]> = {};
    dayNames.forEach((_, index) => {
      scheduleByDay[index] = scheduleSlots.filter(slot => slot.dayOfWeek === index);
    });

    const stats = {
      totalSlots: scheduleSlots.length,
      scheduledSlots: scheduleSlots.filter(s => s.status === 'scheduled').length,
      completedSlots: scheduleSlots.filter(s => s.status === 'completed').length,
      totalEnrollments: scheduleSlots.reduce((sum, s) => sum + s.enrolledMembers.length, 0)
    };

    const getClassName = (classId: string): string => {
      const gymClass = classes.find(c => c.id === classId);
      return gymClass ? gymClass.name : 'Unknown Class';
    };

    const getInstructorName = (instructorId: string): string => {
      const instructor = instructors.find(i => i.id === instructorId);
      return instructor ? instructor.name : 'Unknown Instructor';
    };

    return (
      <div className="tab-content">
        {/* Stats Overview */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.totalSlots}</h3>
              <p className="stat-label">Total Slots</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.scheduledSlots}</h3>
              <p className="stat-label">Scheduled</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.completedSlots}</h3>
              <p className="stat-label">Completed</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.totalEnrollments}</h3>
              <p className="stat-label">Total Enrollments</p>
            </div>
          </div>
        </div>

        <div className="section-header">
          <h3>Weekly Schedule</h3>
          <button className="add-btn" onClick={() => setShowScheduleModal(true)}>
            ➕ Add Schedule Slot
          </button>
        </div>

        {loading ? (
          <div className="loading-state">Loading schedule...</div>
        ) : (
          <div className="weekly-schedule-grid">
            {dayNames.map((dayName, dayIndex) => (
              <div key={dayIndex} className="day-column">
                <div className="day-header">
                  <h4>{dayName}</h4>
                  <span className="slot-count">{scheduleByDay[dayIndex].length} slots</span>
                </div>
                <div className="day-slots">
                  {scheduleByDay[dayIndex].length === 0 ? (
                    <div className="no-slots">No classes scheduled</div>
                  ) : (
                    scheduleByDay[dayIndex].map(slot => (
                      <div key={slot.id} className={`schedule-slot-card status-${slot.status}`}>
                        <div className="slot-time">
                          <span className="time-icon">⏰</span>
                          <span>{slot.startTime} - {slot.endTime}</span>
                        </div>
                        <div className="slot-class">
                          <strong>{getClassName(slot.classId)}</strong>
                        </div>
                        <div className="slot-instructor">
                          <span className="instructor-icon">👨‍🏫</span>
                          <span>{getInstructorName(slot.instructorId)}</span>
                        </div>
                        <div className="slot-enrollment">
                          <span className="enrollment-icon">👥</span>
                          <span>{slot.enrolledMembers.length} enrolled</span>
                        </div>
                        <div className="slot-actions">
                          <button 
                            className="edit-btn-small" 
                            onClick={() => handleEditScheduleSlot(slot)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button 
                            className="delete-btn-small" 
                            onClick={() => handleDeleteScheduleSlot(slot.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleDeleteScheduleSlot = async (slotId: string) => {
    const slotToDelete = scheduleSlots.find(s => s.id === slotId);
    const slotInfo = slotToDelete 
      ? `\n• Class: ${classes.find(c => c.id === slotToDelete.classId)?.name || 'Unknown'}\n• Date: ${slotToDelete.date}\n• Time: ${slotToDelete.startTime}-${slotToDelete.endTime}` 
      : '';
    
    if (confirm(`⚠️ Delete Schedule Slot\n\nAre you sure you want to permanently delete this schedule slot?${slotInfo}\n\nThis action cannot be undone and will:\n• Cancel the scheduled session\n• Remove enrolled members from this slot\n\nClick OK to confirm deletion or Cancel to keep the schedule slot.`)) {
      try {
        const result = await scheduleService.delete(slotId);
        if (result.success) {
          setScheduleSlots(scheduleSlots.filter(s => s.id !== slotId));
          logActivity({
            type: 'schedule_deleted',
            message: `Schedule slot deleted`
          });
        }
      } catch (error) {
        console.error('Error deleting schedule slot:', error);
      }
    }
  };

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

      {/* Add/Edit Class Modal */}
      {showAddClassModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingClass ? 'Edit Class' : 'Add New Class'}</h3>
              <button className="close-btn" onClick={() => {
                setShowAddClassModal(false);
                setEditingClass(null);
              }}>
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

              {/* Schedule Section */}
              <div className="form-group schedule-builder">
                <label className="schedule-builder-label">Weekly Schedule:</label>
                <p className="schedule-helper-text">Select weekdays and set time for recurring classes (24-hour format)</p>
                
                {/* Weekday Checkboxes */}
                <div className="weekday-checkboxes">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, arrayIndex) => {
                    // Map display order to actual dayOfWeek values (0=Sunday, 1=Monday... 6=Saturday)
                    const dayOfWeekValue = arrayIndex === 6 ? 0 : arrayIndex + 1;
                    const isChecked = newClass.schedule?.some(s => s.dayOfWeek === dayOfWeekValue) || false;
                    return (
                      <label key={dayOfWeekValue} className={`weekday-checkbox ${isChecked ? 'checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const currentSchedule = newClass.schedule || [];
                            if (e.target.checked) {
                              // Add new schedule slot for this day
                              setNewClass({
                                ...newClass,
                                schedule: [
                                  ...currentSchedule,
                                  { dayOfWeek: dayOfWeekValue, startTime: '09:00', endTime: '10:00' }
                                ]
                              });
                            } else {
                              // Remove all schedule slots for this day
                              setNewClass({
                                ...newClass,
                                schedule: currentSchedule.filter(s => s.dayOfWeek !== dayOfWeekValue)
                              });
                            }
                          }}
                        />
                        <span className="weekday-label">{day.slice(0, 3)}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Time Inputs for Selected Days */}
                {newClass.schedule && newClass.schedule.length > 0 && (
                  <div className="schedule-times">
                    <div className="schedule-times-header">
                      <span>⏰ Set time for selected days (24-hour format):</span>
                    </div>
                    {newClass.schedule.map((scheduleItem, idx) => (
                      <div key={idx} className="schedule-time-row">
                        <span className="day-name-in-schedule">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][scheduleItem.dayOfWeek]}
                        </span>
                        <div className="time-inputs-group">
                          <input
                            type="time"
                            value={scheduleItem.startTime}
                            required
                            min="00:00"
                            max="23:59"
                            pattern="[0-9]{2}:[0-9]{2}"
                            style={{ fontFamily: "'Courier New', monospace", fontSize: "1rem", fontWeight: "700" }}
                            onChange={(e) => {
                              const updatedSchedule = [...(newClass.schedule || [])];
                              updatedSchedule[idx] = { ...updatedSchedule[idx], startTime: e.target.value };
                              setNewClass({ ...newClass, schedule: updatedSchedule });
                            }}
                          />
                          <span className="time-separator">to</span>
                          <input
                            type="time"
                            value={scheduleItem.endTime}
                            required
                            min="00:00"
                            max="23:59"
                            pattern="[0-9]{2}:[0-9]{2}"
                            style={{ fontFamily: "'Courier New', monospace", fontSize: "1rem", fontWeight: "700" }}
                            onChange={(e) => {
                              const updatedSchedule = [...(newClass.schedule || [])];
                              updatedSchedule[idx] = { ...updatedSchedule[idx], endTime: e.target.value };
                              setNewClass({ ...newClass, schedule: updatedSchedule });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => {
                setShowAddClassModal(false);
                setEditingClass(null);
              }}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleAddClass}>
                {editingClass ? 'Update Class' : 'Add Class'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Instructor Modal */}
      {showAddInstructorModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingInstructor ? 'Edit Instructor' : 'Add New Instructor'}</h3>
              <button className="close-btn" onClick={() => {
                setShowAddInstructorModal(false);
                setEditingInstructor(null);
              }}>
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
                  value={newInstructor.specialization ? newInstructor.specialization.join(', ') : ''}
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
                  value={newInstructor.availability ? newInstructor.availability.join(', ') : ''}
                  placeholder="e.g., Monday, Wednesday, Friday"
                  onChange={(e) => setNewInstructor({
                    ...newInstructor, 
                    availability: e.target.value.split(',').map(s => s.trim())
                  })}
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => {
                setShowAddInstructorModal(false);
                setEditingInstructor(null);
              }}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleAddInstructor}>
                {editingInstructor ? 'Update Instructor' : 'Add Instructor'}
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

      {/* Add/Edit Schedule Slot Modal */}
      {showScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingScheduleSlot ? 'Edit Schedule Slot' : 'Add New Schedule Slot'}</h3>
              <button className="close-btn" onClick={() => {
                setShowScheduleModal(false);
                setEditingScheduleSlot(null);
                setNewScheduleSlot({
                  classId: '',
                  instructorId: '',
                  dayOfWeek: 1,
                  startTime: '09:00',
                  endTime: '10:00',
                  date: new Date().toISOString().split('T')[0],
                  enrolledMembers: [],
                  status: 'scheduled'
                });
              }}>
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Class: *</label>
                <select
                  value={newScheduleSlot.classId || ''}
                  onChange={(e) => setNewScheduleSlot({...newScheduleSlot, classId: e.target.value})}
                >
                  <option value="">Select a class</option>
                  {classes.map(gymClass => (
                    <option key={gymClass.id} value={gymClass.id}>
                      {gymClass.name} ({gymClass.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Instructor: *</label>
                <select
                  value={newScheduleSlot.instructorId || ''}
                  onChange={(e) => setNewScheduleSlot({...newScheduleSlot, instructorId: e.target.value})}
                >
                  <option value="">Select an instructor</option>
                  {instructors.map(instructor => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name} - {instructor.specialization.join(', ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Day of Week:</label>
                <select
                  value={newScheduleSlot.dayOfWeek || 1}
                  onChange={(e) => setNewScheduleSlot({...newScheduleSlot, dayOfWeek: parseInt(e.target.value)})}
                >
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date:</label>
                <input
                  type="date"
                  value={newScheduleSlot.date || ''}
                  onChange={(e) => setNewScheduleSlot({...newScheduleSlot, date: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time (24h): *</label>
                  <input
                    type="time"
                    value={newScheduleSlot.startTime || '09:00'}
                    required
                    min="00:00"
                    max="23:59"
                    pattern="[0-9]{2}:[0-9]{2}"
                    style={{ fontFamily: "'Courier New', monospace", fontSize: "1rem", fontWeight: "700" }}
                    onChange={(e) => setNewScheduleSlot({...newScheduleSlot, startTime: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>End Time (24h): *</label>
                  <input
                    type="time"
                    value={newScheduleSlot.endTime || '10:00'}
                    required
                    min="00:00"
                    max="23:59"
                    pattern="[0-9]{2}:[0-9]{2}"
                    style={{ fontFamily: "'Courier New', monospace", fontSize: "1rem", fontWeight: "700" }}
                    onChange={(e) => setNewScheduleSlot({...newScheduleSlot, endTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Status:</label>
                <select
                  value={newScheduleSlot.status || 'scheduled'}
                  onChange={(e) => setNewScheduleSlot({...newScheduleSlot, status: e.target.value as any})}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => {
                setShowScheduleModal(false);
                setEditingScheduleSlot(null);
                setNewScheduleSlot({
                  classId: '',
                  instructorId: '',
                  dayOfWeek: 1,
                  startTime: '09:00',
                  endTime: '10:00',
                  date: new Date().toISOString().split('T')[0],
                  enrolledMembers: [],
                  status: 'scheduled'
                });
              }}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleAddScheduleSlot}>
                {editingScheduleSlot ? 'Update Schedule Slot' : 'Add Schedule Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;