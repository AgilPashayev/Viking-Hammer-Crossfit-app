import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../contexts/DataContext';
import {
  classService,
  instructorService,
  scheduleService,
  type GymClass,
  type Instructor,
  type ScheduleSlot,
  type ScheduleEnrollment,
} from '../services/classManagementService';
import { getAllMembers, type Member } from '../services/memberService';
import { isSparta } from '../services/authService';
import { formatDate } from '../utils/dateFormatter';
import { showConfirmDialog } from '../utils/confirmDialog';
import './ClassManagement.css';

interface ClassManagementProps {
  onBack: () => void;
}

const ClassManagement: React.FC<ClassManagementProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const { setActiveClassesCount, logActivity } = useData();
  const [activeTab, setActiveTab] = useState<'classes' | 'instructors' | 'schedule'>('classes');
  const [classes, setClasses] = useState<GymClass[]>([]);

  // Debug logging
  console.log('ClassManagement rendering, classes:', classes.length);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    schedule: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }, // Monday
      { dayOfWeek: 3, startTime: '09:00', endTime: '10:00' }, // Wednesday
      { dayOfWeek: 5, startTime: '09:00', endTime: '10:00' }, // Friday
    ],
    equipment: [],
    difficulty: 'Beginner',
    category: 'Mixed',
    price: 0,
    status: 'active',
  });

  // New instructor form state
  const [newInstructor, setNewInstructor] = useState<Partial<Instructor>>({
    name: '',
    email: '',
    specialization: [],
    availability: [],
    phone: '',
    experience: 0,
    status: 'active',
    certifications: [],
    bio: '',
    avatarUrl: '',
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
    status: 'scheduled',
  });

  const [editingScheduleSlot, setEditingScheduleSlot] = useState<ScheduleSlot | null>(null);
  const [rosterModalSlot, setRosterModalSlot] = useState<ScheduleSlot | null>(null);
  const [rosterModalOpen, setRosterModalOpen] = useState(false);
  const [rosterEntries, setRosterEntries] = useState<ScheduleEnrollment[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);

  // New states for enhanced instructor management
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showScheduleAssignModal, setShowScheduleAssignModal] = useState(false);
  const [instructorToSchedule, setInstructorToSchedule] = useState<Instructor | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [instructorToDelete, setInstructorToDelete] = useState<Instructor | null>(null);

  // Enhanced class deletion states
  const [showClassDeleteModal, setShowClassDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState<GymClass | null>(null);
  const [classDeleteInfo, setClassDeleteInfo] = useState<{
    hasScheduleSlots: boolean;
    hasInstructors: boolean;
    hasBookings: boolean;
    canForceDelete: boolean;
    details: string;
  } | null>(null);

  // Notification modal state
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('info');

  // Class enrolled members modal state
  const [showClassEnrolledModal, setShowClassEnrolledModal] = useState(false);
  const [selectedClassForEnrollment, setSelectedClassForEnrollment] = useState<GymClass | null>(
    null,
  );
  const [classEnrolledMembers, setClassEnrolledMembers] = useState<ScheduleEnrollment[]>([]);

  // Schedule expansion state
  const [expandedSchedules, setExpandedSchedules] = useState<Set<string>>(new Set());

  // Last refresh timestamp
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    // Load all data from API
    loadData();

    // Set up polling to keep data in sync with member bookings (every 10 seconds for better real-time updates)
    const pollInterval = setInterval(loadData, 10000);

    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    // Update active classes count when classes change
    const activeCount = classes.filter((c) => c.status === 'active').length;
    setActiveClassesCount(activeCount);
  }, [classes]);

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
    setError(null);
    try {
      const [classesData, instructorsData, scheduleData, membersData] = await Promise.all([
        classService.getAll(),
        instructorService.getAll(),
        scheduleService.getAll(),
        getAllMembers(),
      ]);

      // Validate data
      if (!Array.isArray(classesData)) {
        throw new Error('Invalid classes data format');
      }
      if (!Array.isArray(instructorsData)) {
        throw new Error('Invalid instructors data format');
      }
      if (!Array.isArray(scheduleData)) {
        throw new Error('Invalid schedule data format');
      }
      if (!Array.isArray(membersData)) {
        throw new Error('Invalid members data format');
      }

      setClasses(classesData);
      setInstructors(instructorsData);
      setScheduleSlots(scheduleData);
      setMembers(membersData);
      setLastRefresh(new Date());

      // Log successful data load (optional - using console instead)
      console.log(
        `Loaded ${classesData.length} classes, ${instructorsData.length} instructors, ${scheduleData.length} schedule slots, ${membersData.length} members`,
      );
    } catch (error: any) {
      // Function to refresh instructors list from backend
      const refreshInstructors = async () => {
        try {
          const instructorsData = await instructorService.getAll();
          if (Array.isArray(instructorsData)) {
            setInstructors(instructorsData);
            console.log(`✅ Refreshed ${instructorsData.length} instructors`);
          }
        } catch (error) {
          console.error('Error refreshing instructors:', error);
        }
      };

      // Function to refresh classes list from backend
      const refreshClasses = async () => {
        try {
          const classesData = await classService.getAll();
          if (Array.isArray(classesData)) {
            setClasses(classesData);
            console.log(`✅ Refreshed ${classesData.length} classes`);
          }
        } catch (error) {
          console.error('Error refreshing classes:', error);
        }
      };
      console.error('Error loading data:', error);
      setError(error.message || 'Failed to load data. Please try again.');
      // Show user-friendly error
      alert(`Error loading data: ${error.message || 'Unknown error'}. Please refresh the page.`);
    } finally {
      setLoading(false);
    }
  };

  // Utility functions for enhanced instructor management
  const getActiveMembers = () => {
    return members.filter((member) => member.status === 'active');
  };

  const getFilteredMembers = () => {
    const activeMembers = getActiveMembers();
    if (!memberSearchTerm) return activeMembers;

    return activeMembers.filter(
      (member) =>
        member.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(memberSearchTerm.toLowerCase()),
    );
  };

  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
    setMemberSearchTerm(member.name);
    setShowMemberDropdown(false);

    // Auto-fill instructor form with member data
    setNewInstructor({
      ...newInstructor,
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      avatarUrl: member.avatar_url || '',
    });
  };

  const resetInstructorForm = () => {
    setNewInstructor({
      name: '',
      email: '',
      specialization: [],
      availability: [],
      phone: '',
      experience: 0,
      status: 'active',
      certifications: [],
      bio: '',
      avatarUrl: '',
    });
    setSelectedMember(null);
    setMemberSearchTerm('');
    setShowMemberDropdown(false);
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotificationModal(true);
  };

  const handleViewRoster = async (slot: ScheduleSlot) => {
    setRosterModalSlot(slot);
    setRosterModalOpen(true);
    setRosterLoading(true);
    setRosterError(null);

    try {
      const roster = await scheduleService.getRoster(slot.id);
      setRosterEntries(roster);

      // Sync schedule state so counts stay accurate across tabs
      setScheduleSlots((prev) =>
        prev.map((existing) =>
          existing.id === slot.id ? { ...existing, enrolledMembers: roster } : existing,
        ),
      );

      setRosterModalSlot((prev) =>
        prev && prev.id === slot.id
          ? { ...prev, enrolledMembers: roster }
          : { ...slot, enrolledMembers: roster },
      );
    } catch (error) {
      console.error('Error loading roster:', error);
      setRosterError('Failed to load enrolled members. Please try again.');
    } finally {
      setRosterLoading(false);
    }
  };

  const handleRefreshRoster = async () => {
    if (!rosterModalSlot) return;
    await handleViewRoster(rosterModalSlot);
  };

  const handleCloseRosterModal = () => {
    setRosterModalOpen(false);
    setRosterModalSlot(null);
    setRosterEntries([]);
    setRosterError(null);
  };

  // Handler for showing class enrolled members
  const handleShowClassEnrollment = async (gymClass: GymClass) => {
    setSelectedClassForEnrollment(gymClass);
    setShowClassEnrolledModal(true);

    // Show loading state
    setClassEnrolledMembers([]);

    try {
      // Collect all enrolled members from all schedule slots for this class
      const allEnrolledMembers: ScheduleEnrollment[] = [];

      // Get schedule slots for this class
      const classScheduleSlots = scheduleSlots.filter((slot) => slot.classId === gymClass.id);

      console.log(
        `📋 Fetching roster for class "${gymClass.name}" with ${classScheduleSlots.length} schedule slots`,
      );

      // Fetch roster for each schedule slot
      for (const slot of classScheduleSlots) {
        try {
          console.log(`  Fetching roster for slot ${slot.id}...`);
          const roster = await scheduleService.getRoster(slot.id);
          console.log(`  ✅ Found ${roster.length} bookings for slot ${slot.id}`);

          if (roster && roster.length > 0) {
            allEnrolledMembers.push(...roster);
          }
        } catch (error) {
          console.error(`  ❌ Error fetching roster for slot ${slot.id}:`, error);
        }
      }

      console.log(`📊 Total enrolled members found: ${allEnrolledMembers.length}`);

      // Remove duplicates based on memberId
      const uniqueMembers = allEnrolledMembers.filter(
        (member, index, self) => index === self.findIndex((m) => m.memberId === member.memberId),
      );

      console.log(`📊 Unique members after deduplication: ${uniqueMembers.length}`);
      setClassEnrolledMembers(uniqueMembers);
    } catch (error) {
      console.error('Error loading class enrollment:', error);
      setClassEnrolledMembers([]);
    }
  };

  const handleCloseClassEnrollmentModal = () => {
    setShowClassEnrolledModal(false);
    setSelectedClassForEnrollment(null);
    setClassEnrolledMembers([]);
  };

  // Handler for toggling schedule expansion
  const toggleScheduleExpansion = (classId: string) => {
    setExpandedSchedules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(classId)) {
        newSet.delete(classId);
      } else {
        newSet.add(classId);
      }
      return newSet;
    });
  };

  // Mock data loading function removed - all data loaded from database

  const getInstructorName = (instructorId: string): string => {
    const instructor = instructors.find((inst) => inst.id === instructorId);
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
    return classes.filter((gymClass) => {
      const matchesSearch =
        gymClass.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gymClass.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || gymClass.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || gymClass.status === filterStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  };

  const getFilteredInstructors = () => {
    return instructors.filter((instructor) => {
      const matchesSearch =
        instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.specialization.some((spec) =>
          spec.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      const matchesStatus = filterStatus === 'all' || instructor.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  };

  const handleAddClass = async () => {
    // Enhanced validation with user-friendly error notifications
    if (!newClass.name || newClass.name.trim() === '') {
      showNotification('Please enter class name', 'error');
      return;
    }

    if (!newClass.description || newClass.description.trim() === '') {
      showNotification('Please enter class description', 'error');
      return;
    }

    if (!newClass.duration || newClass.duration <= 0) {
      showNotification('Please enter a valid duration', 'error');
      return;
    }

    if (!newClass.maxCapacity || newClass.maxCapacity <= 0) {
      showNotification('Please enter a valid max capacity', 'error');
      return;
    }

    try {
      if (editingClass) {
        // Update existing class
        const result = await classService.update(editingClass.id, newClass);
        if (result.success) {
          // Refresh classes list from backend
          await refreshClasses();

          logActivity({
            type: 'class_updated',
            message: `Class updated: ${result.data!.name}`,
          });
          showNotification(
            `Class "${result.data!.name}" has been updated successfully!`,
            'success',
          );
        } else {
          const errorMsg = result.message || 'Failed to update class';
          console.error('Update class error:', result);
          showNotification(`Update failed: ${errorMsg}`, 'error');
        }
      } else {
        // Create new class
        const classToAdd = {
          ...newClass,
          currentEnrollment: 0,
          status: newClass.status || 'active',
        };
        const result = await classService.create(classToAdd);
        if (result.success) {
          // Refresh classes list from backend
          await refreshClasses();

          logActivity({
            type: 'class_created',
            message: `Class created: ${result.data!.name}`,
          });
          showNotification(
            `Class "${result.data!.name}" has been created successfully!`,
            'success',
          );
        } else {
          const errorMsg = result.message || 'Failed to create class';
          console.error('Create class error:', result);
          showNotification(`Creation failed: ${errorMsg}`, 'error');
        }
      }

      // Reset form
      setNewClass({
        name: '',
        description: '',
        duration: 60,
        maxCapacity: 20,
        instructors: [],
        schedule: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }, // Monday
          { dayOfWeek: 3, startTime: '09:00', endTime: '10:00' }, // Wednesday
          { dayOfWeek: 5, startTime: '09:00', endTime: '10:00' }, // Friday
        ],
        equipment: [],
        difficulty: 'Beginner',
        category: 'Mixed',
        price: 0,
        status: 'active',
      });
      setEditingClass(null);
      setShowAddClassModal(false);
    } catch (error: any) {
      console.error('Error adding/updating class:', error);
      const errorMsg =
        error.message || 'An unexpected error occurred while processing your request';
      showNotification(`System Error: ${errorMsg}`, 'error');
    }
  };

  const handleAddInstructor = async () => {
    // Enhanced validation
    if (!newInstructor.name || newInstructor.name.trim() === '') {
      showNotification('Please enter instructor name', 'error');
      return;
    }

    if (!newInstructor.email || newInstructor.email.trim() === '') {
      showNotification('Please enter instructor email', 'error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newInstructor.email)) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }

    // For new instructors, ensure member is selected
    if (!editingInstructor && !selectedMember) {
      showNotification('Please select an active member from the search dropdown', 'error');
      return;
    }

    try {
      if (editingInstructor) {
        // Update existing instructor
        const result = await instructorService.update(editingInstructor.id, newInstructor);
        if (result.success) {
          // Refresh instructors list from backend
          await refreshInstructors();

          logActivity({
            type: 'instructor_updated',
            message: `Instructor updated: ${result.data!.name}`,
          });
          showNotification(
            `Instructor "${result.data!.name}" has been updated successfully!`,
            'success',
          );

          // Reset form and close modal
          resetInstructorForm();
          setEditingInstructor(null);
          setShowAddInstructorModal(false);
        } else {
          const errorMsg = result.message || 'Failed to update instructor';
          console.error('Update instructor error:', result);
          showNotification(`Update failed: ${errorMsg}`, 'error');
        }
      } else {
        // Create new instructor
        const instructorToAdd = {
          ...newInstructor,
          rating: 0,
          status: newInstructor.status || 'active',
          // Ensure experience is a number
          experience: Number(newInstructor.experience) || 0,
        };

        console.log('Creating instructor:', instructorToAdd);
        const result = await instructorService.create(instructorToAdd);

        if (result.success) {
          // Refresh instructors list from backend
          await refreshInstructors();

          logActivity({
            type: 'instructor_created',
            message: `Instructor created: ${result.data!.name}`,
          });
          showNotification(
            `Instructor "${result.data!.name}" has been added successfully!`,
            'success',
          );

          // Reset form and close modal
          resetInstructorForm();
          setEditingInstructor(null);
          setShowAddInstructorModal(false);
        } else {
          const errorMsg = result.message || 'Failed to create instructor';
          console.error('Create instructor error:', result);
          showNotification(`Creation failed: ${errorMsg}`, 'error');
        }
      }
    } catch (error: any) {
      console.error('Error adding/updating instructor:', error);
      const errorMsg =
        error.message || 'An unexpected error occurred while processing your request';
      showNotification(`System Error: ${errorMsg}`, 'error');
    }
  };

  const handleAssignInstructor = async (instructorId: string) => {
    if (selectedClass) {
      // Toggle instructor assignment (max 5 instructors per class)
      const isCurrentlyAssigned = selectedClass.instructors.includes(instructorId);
      let updatedInstructors: string[];

      if (isCurrentlyAssigned) {
        // Remove instructor
        updatedInstructors = selectedClass.instructors.filter((id) => id !== instructorId);
      } else {
        // Add instructor (check limit)
        if (selectedClass.instructors.length >= 5) {
          showNotification('Maximum of 5 instructors allowed per class', 'error');
          return;
        }
        updatedInstructors = [...selectedClass.instructors, instructorId];
      }

      // Update class via API - use instructorIds to match backend
      try {
        const result = await classService.update(selectedClass.id, {
          instructorIds: updatedInstructors,
        } as any);
        if (result.success) {
          // Refresh the class list to get updated data with instructors
          await loadData();
          // Update selected class with new instructor list
          const updatedClass = classes.find((c) => c.id === selectedClass.id);
          if (updatedClass) {
            setSelectedClass(updatedClass);
          }
          logActivity({
            type: 'class_updated',
            message: `Instructor ${
              updatedInstructors.length > selectedClass.instructors.length
                ? 'assigned to'
                : 'removed from'
            } class: ${selectedClass.name}`,
          });
        }
      } catch (error) {
        console.error('Error assigning instructor:', error);
      }
    }
  };

  const handleEditClass = (gymClass: GymClass) => {
    console.log('=== EDITING CLASS ===');
    console.log('Class data:', gymClass);
    console.log('Schedule data:', gymClass.schedule);
    setNewClass(gymClass);
    setEditingClass(gymClass);
    setShowAddClassModal(true);
  };

  const handleDeleteClass = async (classId: string) => {
    const targetClass = classes.find((c) => c.id === classId);
    if (!targetClass) return;

    // Analyze class dependencies
    const hasScheduleSlots = targetClass.schedule && targetClass.schedule.length > 0;
    const hasInstructors = targetClass.instructors && targetClass.instructors.length > 0;
    const hasBookings = targetClass.currentEnrollment > 0;
    const canForceDelete = isSparta(); // Only Sparta can force delete

    let details = `Class: "${targetClass.name}"\n\n`;

    if (hasScheduleSlots) {
      details += `⚠️ Active Schedule Slots: ${targetClass.schedule.length}\n`;
    }
    if (hasInstructors) {
      details += `👨‍🏫 Assigned Instructors: ${targetClass.instructors.length}\n`;
    }
    if (hasBookings) {
      details += `👥 Current Enrollment: ${targetClass.currentEnrollment}/${targetClass.maxCapacity} members\n`;
    }

    if (!hasScheduleSlots && !hasInstructors && !hasBookings) {
      details += `✅ No dependencies found - safe to delete\n`;
    }

    setClassToDelete(targetClass);
    setClassDeleteInfo({
      hasScheduleSlots,
      hasInstructors,
      hasBookings,
      canForceDelete,
      details,
    });
    setShowClassDeleteModal(true);
  };

  const confirmDeleteClass = async (forceDelete = false) => {
    if (!classToDelete || !classDeleteInfo) return;

    try {
      // Check if deletion is blocked by dependencies
      const hasDependencies =
        classDeleteInfo.hasScheduleSlots ||
        classDeleteInfo.hasInstructors ||
        classDeleteInfo.hasBookings;

      if (hasDependencies && !forceDelete) {
        setNotificationMessage(
          '❌ Cannot delete class with active dependencies. Only Sparta can force delete classes with active schedules, instructors, or bookings.',
        );
        setNotificationType('error');
        setShowNotificationModal(true);
        return;
      }

      if (hasDependencies && forceDelete && !classDeleteInfo.canForceDelete) {
        setNotificationMessage(
          '❌ Access denied. Only Sparta users can force delete classes with active dependencies.',
        );
        setNotificationType('error');
        setShowNotificationModal(true);
        return;
      }

      const result = await classService.delete(classToDelete.id, forceDelete);

      if (result.success) {
        // Refresh classes list from backend
        await refreshClasses();

        logActivity({
          type: 'class_deleted',
          message: `Class ${forceDelete ? 'force-' : ''}deleted: ${classToDelete.name}`,
        });

        setNotificationMessage(`✅ Class "${classToDelete.name}" deleted successfully!`);
        setNotificationType('success');
        setShowNotificationModal(true);
      } else {
        setNotificationMessage(`❌ Failed to delete class: ${result.message || 'Unknown error'}`);
        setNotificationType('error');
        setShowNotificationModal(true);
      }
    } catch (error: any) {
      console.error('Error deleting class:', error);
      setNotificationMessage(
        `❌ Error deleting class: ${error.message || 'An unexpected error occurred'}`,
      );
      setNotificationType('error');
      setShowNotificationModal(true);
    } finally {
      setShowClassDeleteModal(false);
      setClassToDelete(null);
      setClassDeleteInfo(null);
    }
  };

  const handleEditInstructor = (instructor: Instructor) => {
    setNewInstructor(instructor);
    setEditingInstructor(instructor);
    setShowAddInstructorModal(true);
  };

  const handleDeleteInstructor = (instructorId: string) => {
    const instructor = instructors.find((i) => i.id === instructorId);
    if (instructor) {
      setInstructorToDelete(instructor);
      setShowDeleteConfirmModal(true);
    }
  };

  const confirmDeleteInstructor = async () => {
    if (!instructorToDelete) return;

    try {
      const result = await instructorService.delete(instructorToDelete.id);
      if (result.success) {
        // Refresh instructors list from backend
        await refreshInstructors();

        // Also remove from any assigned classes
        for (const gymClass of classes) {
          if (gymClass.instructors.includes(instructorToDelete.id)) {
            await classService.update(gymClass.id, {
              instructors: gymClass.instructors.filter((id) => id !== instructorToDelete.id),
            });
          }
        }
        // Reload classes to reflect changes
        const updatedClasses = await classService.getAll();
        setClasses(updatedClasses);

        logActivity({
          type: 'instructor_deleted',
          message: `Instructor deleted: ${instructorToDelete.name}`,
        });

        alert('✅ Instructor deleted successfully!');
      } else {
        alert(`❌ Error: ${result.message || 'Failed to delete instructor'}`);
      }
    } catch (error: any) {
      console.error('Error deleting instructor:', error);
      alert(`❌ Error: ${error.message || 'An unexpected error occurred'}`);
    } finally {
      setShowDeleteConfirmModal(false);
      setInstructorToDelete(null);
    }
  };

  const handleScheduleInstructor = (instructor: Instructor) => {
    setInstructorToSchedule(instructor);
    setShowScheduleAssignModal(true);
  };

  const handleAssignClassToInstructor = async (classId: string, assign: boolean) => {
    if (!instructorToSchedule) return;

    try {
      const targetClass = classes.find((c) => c.id === classId);
      if (!targetClass) return;

      const updatedInstructors = assign
        ? [...targetClass.instructors, instructorToSchedule.id]
        : targetClass.instructors.filter((id) => id !== instructorToSchedule.id);

      const result = await classService.update(classId, {
        instructorIds: updatedInstructors,
      } as any);

      if (result.success) {
        // Reload classes to reflect changes
        const updatedClasses = await classService.getAll();
        setClasses(updatedClasses);

        logActivity({
          type: 'class_updated',
          message: `Instructor ${assign ? 'assigned to' : 'removed from'} class: ${
            targetClass.name
          }`,
        });

        alert(
          `✅ ${assign ? 'Assigned' : 'Removed'} instructor ${assign ? 'to' : 'from'} "${
            targetClass.name
          }" successfully!`,
        );
      } else {
        alert(`❌ Error: ${result.message || 'Failed to update class assignment'}`);
      }
    } catch (error: any) {
      console.error('Error updating class assignment:', error);
      alert(`❌ Error: ${error.message || 'An unexpected error occurred'}`);
    }
  };

  const handleAddScheduleSlot = async () => {
    if (
      newScheduleSlot.classId &&
      newScheduleSlot.instructorId &&
      newScheduleSlot.startTime &&
      newScheduleSlot.endTime
    ) {
      try {
        if (editingScheduleSlot) {
          // Update existing schedule slot
          const result = await scheduleService.update(editingScheduleSlot.id, newScheduleSlot);
          if (result.success) {
            setScheduleSlots(
              scheduleSlots.map((s) => (s.id === editingScheduleSlot.id ? result.data! : s)),
            );
            logActivity({
              type: 'schedule_updated',
              message: `Schedule slot updated`,
            });
          }
        } else {
          // Create new schedule slot
          const result = await scheduleService.create(newScheduleSlot);
          if (result.success) {
            setScheduleSlots([...scheduleSlots, result.data!]);
            logActivity({
              type: 'schedule_created',
              message: `Schedule slot created`,
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
          status: 'scheduled',
        });
        setEditingScheduleSlot(null);
        setShowScheduleModal(false);
      } catch (error) {
        console.error('Error saving schedule slot:', error);
      }
    } else {
      await showConfirmDialog({
        title: '⚠️ Missing Information',
        message:
          'Please fill in all required fields:\n\n• Class\n• Instructor\n• Start Time\n• End Time',
        confirmText: 'OK',
        cancelText: '',
        type: 'warning',
      });
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
      activeClasses: classes.filter((c) => c.status === 'active').length,
      fullClasses: classes.filter((c) => c.status === 'full').length,
      totalCapacity: classes.reduce((sum, c) => sum + c.maxCapacity, 0),
      currentEnrollment: classes.reduce((sum, c) => sum + c.currentEnrollment, 0),
    };

    return (
      <div className="tab-content">
        {/* Statistics Overview */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.totalClasses}</h3>
              <p className="stat-label">{t('admin.classManagement.classes.stats.totalClasses')}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.activeClasses}</h3>
              <p className="stat-label">{t('admin.classManagement.classes.stats.activeClasses')}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3 className="stat-number">
                {stats.currentEnrollment}/{stats.totalCapacity}
              </h3>
              <p className="stat-label">{t('admin.classManagement.classes.stats.totalEnrollment')}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.fullClasses}</h3>
              <p className="stat-label">{t('admin.classManagement.classes.stats.fullClasses')}</p>
            </div>
          </div>
        </div>

        <div className="section-header">
          <div>
            <h3>{t('admin.classManagement.classes.title')}</h3>
            <p
              style={{
                margin: '5px 0 0 0',
                fontSize: '0.8em',
                color: '#6c757d',
                fontStyle: 'italic',
              }}
            >
              {t('admin.classManagement.classes.lastUpdated', { time: lastRefresh.toLocaleTimeString() })}
            </p>
          </div>
          <div className="header-actions">
            <button
              className="refresh-btn"
              onClick={loadData}
              disabled={loading}
              title="Refresh data to sync with member bookings"
              style={{
                background: loading ? '#6c757d' : 'linear-gradient(135deg, #17a2b8, #138496)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.9em',
                fontWeight: '500',
                marginRight: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              🔄 {loading ? t('admin.classManagement.common.loading') : t('admin.classManagement.classes.refresh')}
            </button>
            <button
              className="add-btn"
              onClick={() => {
                setNewClass({
                  name: '',
                  description: '',
                  duration: 60,
                  maxCapacity: 20,
                  instructors: [],
                  schedule: [
                    { dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }, // Monday
                    { dayOfWeek: 3, startTime: '09:00', endTime: '10:00' }, // Wednesday
                    { dayOfWeek: 5, startTime: '09:00', endTime: '10:00' }, // Friday
                  ],
                  equipment: [],
                  difficulty: 'Beginner',
                  category: 'Mixed',
                  price: 0,
                  status: 'active',
                });
                setEditingClass(null);
                setShowAddClassModal(true);
              }}
            >
              ➕ {t('admin.classManagement.classes.addButton')}
            </button>
          </div>
        </div>

        <div className="filters-section">
          <div className="search-filters">
            <input
              type="text"
              placeholder={t('admin.classManagement.classes.search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">{t('admin.classManagement.classes.filters.allCategories')}</option>
              <option value="Cardio">{t('admin.classManagement.classes.filters.cardio')}</option>
              <option value="Strength">{t('admin.classManagement.classes.filters.strength')}</option>
              <option value="Flexibility">{t('admin.classManagement.classes.filters.flexibility')}</option>
              <option value="Mixed">{t('admin.classManagement.classes.filters.mixed')}</option>
              <option value="Specialized">Specialized</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">{t('admin.classManagement.classes.filters.allStatus')}</option>
              <option value="active">{t('admin.classManagement.classes.filters.active')}</option>
              <option value="inactive">{t('admin.classManagement.classes.filters.inactive')}</option>
              <option value="full">Full</option>
            </select>
          </div>
        </div>

        <div className="classes-grid">
          {getFilteredClasses().map((gymClass) => {
            const categoryIcons: Record<string, string> = {
              Cardio: '🏃',
              Strength: '💪',
              Flexibility: '🧘',
              Mixed: '🔄',
              Specialized: '⚡',
            };

            const capacityPercentage = (gymClass.currentEnrollment / gymClass.maxCapacity) * 100;
            const spotsLeft = gymClass.maxCapacity - gymClass.currentEnrollment;

            return (
              <div
                key={gymClass.id}
                className={`class-card-modern class-${gymClass.category.toLowerCase()}`}
              >
                {/* Card Header with Category Badge */}
                <div className="card-header-modern">
                  <div className="category-badge-modern">
                    <span className="category-icon-large">{categoryIcons[gymClass.category]}</span>
                    <span className="category-text">{gymClass.category}</span>
                  </div>
                  <div className={`status-pill status-${gymClass.status}`}>
                    {gymClass.status === 'active' ? '🟢' : gymClass.status === 'full' ? '🔴' : '⚫'}{' '}
                    {gymClass.status === 'active' ? t('admin.classManagement.classes.filters.active') : gymClass.status === 'inactive' ? t('admin.classManagement.classes.filters.inactive') : gymClass.status}
                  </div>
                </div>

                {/* Class Title */}
                <h3 className="class-title-modern">{gymClass.name}</h3>
                <p className="class-description-modern">{gymClass.description}</p>

                {/* Key Stats Row */}
                <div className="stats-row-modern">
                  <div className="stat-pill">
                    <span className="stat-icon">⏱️</span>
                    <span className="stat-text">{gymClass.duration} {t('admin.classManagement.common.minutes')}</span>
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
                    <div
                      className="enrollment-info clickable"
                      onClick={() => handleShowClassEnrollment(gymClass)}
                      title="Click to view enrolled members"
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="enrollment-icon">👥</span>
                      <span className="enrollment-text">
                        <strong>{gymClass.currentEnrollment}</strong> / {gymClass.maxCapacity}
                      </span>
                    </div>
                    <span
                      className={`spots-badge ${spotsLeft <= 5 ? 'spots-low' : ''} clickable`}
                      onClick={() => handleShowClassEnrollment(gymClass)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        loadData(); // Force refresh on double-click
                      }}
                      title="Click to view enrolled members, double-click to refresh data"
                      style={{ cursor: 'pointer' }}
                    >
                      {t('admin.classManagement.classes.spotsLeft', { count: spotsLeft })}
                    </span>
                  </div>
                  <div className="enrollment-bar-modern">
                    <div
                      className="enrollment-fill-modern"
                      style={{
                        width: `${capacityPercentage}%`,
                        background:
                          capacityPercentage >= 90
                            ? 'linear-gradient(90deg, #e74c3c, #c0392b)'
                            : capacityPercentage >= 70
                            ? 'linear-gradient(90deg, #f39c12, #e67e22)'
                            : 'linear-gradient(90deg, #27ae60, #229954)',
                      }}
                    ></div>
                  </div>
                </div>

                {/* Instructors Section */}
                <div className="instructors-section-modern">
                  <div className="section-label-modern">
                    <span className="label-icon">👨‍🏫</span>
                    <span>{t('admin.classManagement.classes.table.instructorsColumn')}</span>
                  </div>
                  <div className="instructors-tags-modern">
                    {gymClass.instructors.length > 0 ? (
                      gymClass.instructors.map((instructorId) => (
                        <span key={instructorId} className="instructor-badge-modern">
                          {getInstructorName(instructorId)}
                        </span>
                      ))
                    ) : (
                      <span className="no-data-text">{t('admin.classManagement.classes.noInstructors')}</span>
                    )}
                  </div>
                </div>

                {/* Schedule Section */}
                {gymClass.schedule && gymClass.schedule.length > 0 && (
                  <div className="schedule-section-modern">
                    <div className="section-label-modern">
                      <span className="label-icon">📅</span>
                      <span>{t('admin.classManagement.classModal.form.schedule')} (24h)</span>
                    </div>
                    <div className="schedule-tags-modern">
                      {(expandedSchedules.has(gymClass.id)
                        ? gymClass.schedule
                        : gymClass.schedule.slice(0, 3)
                      ).map((schedule, index) => (
                        <div key={index} className="schedule-badge-modern">
                          <span className="day-badge">
                            {getDayName(schedule.dayOfWeek).slice(0, 3)}
                          </span>
                          <span className="time-text">
                            {formatTime24h(schedule.startTime)}-{formatTime24h(schedule.endTime)}
                          </span>
                        </div>
                      ))}
                      {gymClass.schedule.length > 3 && (
                        <span
                          className="more-badge clickable"
                          onClick={() => toggleScheduleExpansion(gymClass.id)}
                          style={{ cursor: 'pointer' }}
                          title={
                            expandedSchedules.has(gymClass.id) ? 'Show less' : 'Show more days'
                          }
                        >
                          {expandedSchedules.has(gymClass.id)
                            ? 'Show less'
                            : `+${gymClass.schedule.length - 3} more`}
                        </span>
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
                    title={t('admin.classManagement.classes.actions.assign')}
                  >
                    <span className="btn-icon">👥</span>
                    <span className="btn-text">{t('admin.classManagement.assignModal.title')}</span>
                  </button>
                  <button
                    className="action-btn-modern action-edit"
                    onClick={() => handleEditClass(gymClass)}
                    title={t('admin.classManagement.classes.actions.edit')}
                  >
                    <span className="btn-icon">✏️</span>
                    <span className="btn-text">{t('admin.classManagement.classes.actions.edit')}</span>
                  </button>
                  <button
                    className="action-btn-modern action-delete"
                    onClick={() => handleDeleteClass(gymClass.id)}
                    title={t('admin.classManagement.classes.actions.delete')}
                  >
                    <span className="btn-icon">🗑️</span>
                    <span className="btn-text">{t('admin.classManagement.classes.actions.delete')}</span>
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
      activeInstructors: instructors.filter((i) => i.status === 'active').length,
      specializations: [...new Set(instructors.flatMap((i) => i.specialization))].length,
      avgRating:
        instructors.length > 0
          ? (instructors.reduce((sum, i) => sum + i.rating, 0) / instructors.length).toFixed(1)
          : '0.0',
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
          {isSparta() ? (
            <button
              className="add-btn"
              onClick={() => {
                setNewInstructor({
                  name: '',
                  email: '',
                  specialization: [],
                  availability: [],
                  phone: '',
                  experience: 0,
                  status: 'active',
                  certifications: [],
                  bio: '',
                  avatarUrl: '',
                });
                setEditingInstructor(null);
                resetInstructorForm();
                setShowAddInstructorModal(true);
              }}
            >
              ➕ Add New Instructor
            </button>
          ) : (
            <div
              className="sparta-only-message"
              style={{
                padding: '8px 16px',
                background: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '4px',
                color: '#856404',
                fontSize: '0.9em',
              }}
            >
              🔒 SPARTA role required for instructor management
            </div>
          )}
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
          {getFilteredInstructors().length === 0 ? (
            <div
              className="empty-state"
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '60px 20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                border: '2px dashed #dee2e6',
              }}
            >
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>👨‍🏫</div>
              <h3 style={{ fontSize: '24px', marginBottom: '8px', color: '#495057' }}>
                No Instructors Found
              </h3>
              <p style={{ color: '#6c757d', marginBottom: '24px' }}>
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Add your first instructor to get started.'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button
                  className="add-btn"
                  onClick={() => {
                    setNewInstructor({
                      name: '',
                      email: '',
                      specialization: [],
                      availability: [],
                      phone: '',
                      experience: 0,
                      status: 'active',
                      certifications: [],
                      bio: '',
                      avatarUrl: '',
                    });
                    setEditingInstructor(null);
                    setShowAddInstructorModal(true);
                  }}
                >
                  ➕ Add Your First Instructor
                </button>
              )}
            </div>
          ) : (
            getFilteredInstructors().map((instructor) => (
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
                    {(Array.isArray(instructor.specialization)
                      ? instructor.specialization
                      : []
                    ).map((spec, index) => (
                      <span key={index} className="specialization-tag">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="availability-section">
                  <span className="detail-label">Availability:</span>
                  <div className="availability-list">
                    {(Array.isArray(instructor.availability) ? instructor.availability : []).map(
                      (day, index) => (
                        <span key={index} className="availability-tag">
                          {day}
                        </span>
                      ),
                    )}
                  </div>
                </div>

                <div className="instructor-actions">
                  {isSparta() ? (
                    <>
                      <button className="edit-btn" onClick={() => handleEditInstructor(instructor)}>
                        ✏️ Edit
                      </button>
                      <button
                        className="schedule-btn"
                        onClick={() => handleScheduleInstructor(instructor)}
                      >
                        📅 Schedule
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteInstructor(instructor.id)}
                      >
                        🗑️ Delete
                      </button>
                    </>
                  ) : (
                    <div
                      className="sparta-required-actions"
                      style={{
                        padding: '6px 12px',
                        background: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        color: '#6c757d',
                        fontSize: '0.8em',
                        textAlign: 'center',
                      }}
                    >
                      🔒 SPARTA access required
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderScheduleTab = () => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Group schedule slots by day of week
    const scheduleByDay: Record<number, ScheduleSlot[]> = {};
    dayNames.forEach((_, index) => {
      scheduleByDay[index] = scheduleSlots.filter((slot) => slot.dayOfWeek === index);
    });

    const stats = {
      totalSlots: scheduleSlots.length,
      scheduledSlots: scheduleSlots.filter((s) => s.status === 'scheduled').length,
      completedSlots: scheduleSlots.filter((s) => s.status === 'completed').length,
      totalEnrollments: scheduleSlots.reduce((sum, s) => sum + s.enrolledMembers.length, 0),
    };

    const getClassName = (classId: string): string => {
      const gymClass = classes.find((c) => c.id === classId);
      return gymClass ? gymClass.name : 'Unknown Class';
    };

    const getInstructorName = (instructorId: string): string => {
      const instructor = instructors.find((i) => i.id === instructorId);
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
                    scheduleByDay[dayIndex].map((slot) => (
                      <div key={slot.id} className={`schedule-slot-card status-${slot.status}`}>
                        <div className="slot-time">
                          <span className="time-icon">⏰</span>
                          <span>
                            {slot.startTime} - {slot.endTime}
                          </span>
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
                            className="roster-btn-small"
                            onClick={() => handleViewRoster(slot)}
                            title="View Members"
                          >
                            👥
                          </button>
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
    const slotToDelete = scheduleSlots.find((s) => s.id === slotId);
    const slotInfo = slotToDelete
      ? `\n• Class: ${
          classes.find((c) => c.id === slotToDelete.classId)?.name || 'Unknown'
        }\n• Date: ${slotToDelete.date}\n• Time: ${slotToDelete.startTime}-${slotToDelete.endTime}`
      : '';

    if (
      confirm(
        `⚠️ Delete Schedule Slot\n\nAre you sure you want to permanently delete this schedule slot?${slotInfo}\n\nThis action cannot be undone and will:\n• Cancel the scheduled session\n• Remove enrolled members from this slot\n\nClick OK to confirm deletion or Cancel to keep the schedule slot.`,
      )
    ) {
      try {
        const result = await scheduleService.delete(slotId);
        if (result.success) {
          setScheduleSlots(scheduleSlots.filter((s) => s.id !== slotId));
          logActivity({
            type: 'schedule_deleted',
            message: `Schedule slot deleted`,
          });
        }
      } catch (error) {
        console.error('Error deleting schedule slot:', error);
      }
    }
  };

  const rosterClassDetails = rosterModalSlot
    ? classes.find((c) => c.id === rosterModalSlot.classId)
    : null;
  const rosterInstructor = rosterModalSlot
    ? instructors.find((i) => i.id === rosterModalSlot.instructorId)
    : null;
  const rosterCapacity = rosterClassDetails?.maxCapacity ?? null;
  const rosterCount = rosterEntries.length;

  return (
    <div className="class-management">
      <div className="class-management-header">
        <button className="back-button" onClick={onBack}>
          ← {t('admin.classManagement.backButton')}
        </button>
        <h2 className="class-management-title">🏋️‍♂️ {t('admin.classManagement.pageTitle')}</h2>
      </div>

      <div className="tabs-navigation">
        <button
          className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          🏃‍♀️ {t('admin.classManagement.tabs.classes')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'instructors' ? 'active' : ''}`}
          onClick={() => setActiveTab('instructors')}
        >
          👨‍🏫 {t('admin.classManagement.tabs.instructors')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          📅 {t('admin.classManagement.tabs.schedule')}
        </button>
      </div>

      {activeTab === 'classes' && renderClassesTab()}
      {activeTab === 'instructors' && renderInstructorsTab()}
      {activeTab === 'schedule' && renderScheduleTab()}

      {/* Add/Edit Class Modal */}
      {showAddClassModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div
              className="modal-header"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '20px 25px',
                borderRadius: '12px 12px 0 0',
                marginBottom: '0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5em' }}>{editingClass ? '✏️' : '➕'}</span>
                <h3 style={{ margin: 0, fontSize: '1.4em', fontWeight: '600' }}>
                  {editingClass ? t('admin.classManagement.classModal.titleEdit') : t('admin.classManagement.classModal.titleAdd')}
                </h3>
              </div>
              <button
                className="close-btn"
                onClick={() => {
                  setShowAddClassModal(false);
                  setEditingClass(null);
                }}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  width: '35px',
                  height: '35px',
                  borderRadius: '50%',
                  fontSize: '1.2em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
              >
                ✕
              </button>
            </div>

            <div
              className="modal-body"
              style={{
                padding: '25px',
                background: '#fafafa',
                maxHeight: '70vh',
                overflowY: 'auto',
              }}
            >
              <div className="form-group">
                <label>{t('admin.classManagement.classModal.form.className')}:</label>
                <input
                  type="text"
                  value={newClass.name || ''}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  placeholder={t('admin.classManagement.classModal.form.classNamePlaceholder')}
                />
              </div>

              <div className="form-group">
                <label>{t('admin.classManagement.classModal.form.description')}:</label>
                <textarea
                  value={newClass.description || ''}
                  onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                  placeholder={t('admin.classManagement.classModal.form.descriptionPlaceholder')}
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('admin.classManagement.classModal.form.duration')}:</label>
                  <input
                    type="number"
                    value={newClass.duration || 60}
                    onChange={(e) =>
                      setNewClass({ ...newClass, duration: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>{t('admin.classManagement.classModal.form.maxCapacity')}:</label>
                  <input
                    type="number"
                    value={newClass.maxCapacity || 20}
                    onChange={(e) =>
                      setNewClass({ ...newClass, maxCapacity: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('admin.classManagement.classModal.form.category')}:</label>
                  <select
                    value={newClass.category || 'Mixed'}
                    onChange={(e) => setNewClass({ ...newClass, category: e.target.value as any })}
                  >
                    <option value="Cardio">{t('admin.classManagement.classes.filters.cardio')}</option>
                    <option value="Strength">{t('admin.classManagement.classes.filters.strength')}</option>
                    <option value="Flexibility">{t('admin.classManagement.classes.filters.flexibility')}</option>
                    <option value="Mixed">{t('admin.classManagement.classes.filters.mixed')}</option>
                    <option value="Specialized">Specialized</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{t('admin.classManagement.classModal.form.difficulty')}:</label>
                  <select
                    value={newClass.difficulty || 'Beginner'}
                    onChange={(e) =>
                      setNewClass({ ...newClass, difficulty: e.target.value as any })
                    }
                  >
                    <option value="Beginner">{t('admin.classManagement.classModal.form.beginner')}</option>
                    <option value="Intermediate">{t('admin.classManagement.classModal.form.intermediate')}</option>
                    <option value="Advanced">{t('admin.classManagement.classModal.form.advanced')}</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>{t('admin.classManagement.classModal.form.price')}:</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newClass.price ?? 0}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Handle empty input or invalid input
                    if (value === '' || value === null) {
                      setNewClass({ ...newClass, price: 0 });
                    } else {
                      const numValue = parseFloat(value);
                      setNewClass({ ...newClass, price: isNaN(numValue) ? 0 : numValue });
                    }
                  }}
                  placeholder={t('admin.classManagement.classModal.form.pricePlaceholder')}
                />
              </div>

              {/* Schedule Section */}
              <div className="form-group schedule-builder">
                <label className="schedule-builder-label">{t('admin.classManagement.classModal.form.schedule')}:</label>
                <p className="schedule-helper-text">
                  {t('admin.classManagement.classModal.form.scheduleHelper')}
                </p>

                {/* Weekday Checkboxes */}
                <div className="weekday-checkboxes">
                  {[
                    { name: 'Monday', key: 'monday' },
                    { name: 'Tuesday', key: 'tuesday' },
                    { name: 'Wednesday', key: 'wednesday' },
                    { name: 'Thursday', key: 'thursday' },
                    { name: 'Friday', key: 'friday' },
                    { name: 'Saturday', key: 'saturday' },
                    { name: 'Sunday', key: 'sunday' },
                  ].map((day, arrayIndex) => {
                    // Map display order to actual dayOfWeek values (0=Sunday, 1=Monday... 6=Saturday)
                    const dayOfWeekValue = arrayIndex === 6 ? 0 : arrayIndex + 1;
                    const isChecked =
                      newClass.schedule?.some((s) => s.dayOfWeek === dayOfWeekValue) || false;
                    return (
                      <label
                        key={dayOfWeekValue}
                        className={`weekday-checkbox ${isChecked ? 'checked' : ''}`}
                      >
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
                                  {
                                    dayOfWeek: dayOfWeekValue,
                                    startTime: '09:00',
                                    endTime: '10:00',
                                  },
                                ],
                              });
                            } else {
                              // Remove all schedule slots for this day
                              setNewClass({
                                ...newClass,
                                schedule: currentSchedule.filter(
                                  (s) => s.dayOfWeek !== dayOfWeekValue,
                                ),
                              });
                            }
                          }}
                        />
                        <span className="weekday-label">{t(`admin.classManagement.schedule.days.${day.key}`).slice(0, 3)}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Time Inputs for Selected Days */}
                {newClass.schedule && newClass.schedule.length > 0 && (
                  <div className="schedule-times">
                    <div className="schedule-times-header">
                      <span>⏰ {t('admin.classManagement.classModal.form.setTimeHelper')}:</span>
                    </div>
                    {(() => {
                      console.log(
                        'Rendering schedule times. newClass.schedule:',
                        newClass.schedule,
                      );
                      return newClass.schedule.map((scheduleItem, idx) => {
                        const dayNames = [
                          t('admin.classManagement.schedule.days.sunday'),
                          t('admin.classManagement.schedule.days.monday'),
                          t('admin.classManagement.schedule.days.tuesday'),
                          t('admin.classManagement.schedule.days.wednesday'),
                          t('admin.classManagement.schedule.days.thursday'),
                          t('admin.classManagement.schedule.days.friday'),
                          t('admin.classManagement.schedule.days.saturday'),
                        ];
                        return (
                        <div key={idx} className="schedule-time-row">
                          <span className="day-name-in-schedule">
                            {dayNames[scheduleItem.dayOfWeek].slice(0, 3)}
                          </span>
                          <div className="time-inputs-group">
                            <input
                              type="time"
                              value={scheduleItem.startTime}
                              required
                              min="00:00"
                              max="23:59"
                              pattern="[0-9]{2}:[0-9]{2}"
                              style={{
                                fontFamily: "'Courier New', monospace",
                                fontSize: '1rem',
                                fontWeight: '700',
                              }}
                              onChange={(e) => {
                                const updatedSchedule = [...(newClass.schedule || [])];
                                updatedSchedule[idx] = {
                                  ...updatedSchedule[idx],
                                  startTime: e.target.value,
                                };
                                setNewClass({ ...newClass, schedule: updatedSchedule });
                              }}
                            />
                            <span className="time-separator">{t('admin.classManagement.classModal.form.timeTo')}</span>
                            <input
                              type="time"
                              value={scheduleItem.endTime}
                              required
                              min="00:00"
                              max="23:59"
                              pattern="[0-9]{2}:[0-9]{2}"
                              style={{
                                fontFamily: "'Courier New', monospace",
                                fontSize: '1rem',
                                fontWeight: '700',
                              }}
                              onChange={(e) => {
                                const updatedSchedule = [...(newClass.schedule || [])];
                                updatedSchedule[idx] = {
                                  ...updatedSchedule[idx],
                                  endTime: e.target.value,
                                };
                                setNewClass({ ...newClass, schedule: updatedSchedule });
                              }}
                            />
                          </div>
                        </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div
              className="modal-footer"
              style={{
                padding: '20px 25px',
                background: 'white',
                borderTop: '1px solid #e9ecef',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                borderRadius: '0 0 12px 12px',
              }}
            >
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowAddClassModal(false);
                  setEditingClass(null);
                }}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.95em',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#5a6268')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#6c757d')}
              >
                {t('admin.classManagement.classModal.actions.cancel')}
              </button>
              <button
                className="confirm-btn"
                onClick={handleAddClass}
                style={{
                  background: 'linear-gradient(135deg, #28a745, #20c997)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.95em',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(40, 167, 69, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(40, 167, 69, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(40, 167, 69, 0.2)';
                }}
              >
                {editingClass ? `✏️ ${t('admin.classManagement.classModal.actions.update')}` : `➕ ${t('admin.classManagement.classModal.actions.save')}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Instructor Modal */}
      {showAddInstructorModal && isSparta() && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="modal-header">
              <h3>{editingInstructor ? 'Edit Instructor' : 'Add New Instructor'}</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowAddInstructorModal(false);
                  setEditingInstructor(null);
                  resetInstructorForm();
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Member Selection (for new instructors only) */}
              {!editingInstructor && (
                <div className="form-group">
                  <label>👤 Select Active Member:</label>
                  <div className="member-search-container" style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={memberSearchTerm}
                      onChange={(e) => {
                        setMemberSearchTerm(e.target.value);
                        setShowMemberDropdown(true);
                      }}
                      onFocus={() => setShowMemberDropdown(true)}
                      placeholder="Search member by name or email..."
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                      }}
                    />

                    {showMemberDropdown && getFilteredMembers().length > 0 && (
                      <div
                        className="member-dropdown"
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: 'white',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          zIndex: 1000,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                      >
                        {getFilteredMembers()
                          .slice(0, 10)
                          .map((member) => (
                            <div
                              key={member.id}
                              className="member-option"
                              onClick={() => handleMemberSelect(member)}
                              style={{
                                padding: '12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #eee',
                                transition: 'background-color 0.2s',
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = '#f5f5f5')
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor = 'white')
                              }
                            >
                              <div style={{ fontWeight: 'bold' }}>{member.name}</div>
                              <div style={{ fontSize: '0.9em', color: '#666' }}>{member.email}</div>
                              <div style={{ fontSize: '0.8em', color: '#888' }}>{member.phone}</div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {selectedMember && (
                    <div
                      className="selected-member-info"
                      style={{
                        marginTop: '10px',
                        padding: '12px',
                        background: '#e8f5e8',
                        borderRadius: '4px',
                        border: '1px solid #c3e6c3',
                      }}
                    >
                      <div style={{ fontWeight: 'bold', color: '#2d5016' }}>
                        ✅ Selected: {selectedMember.name}
                      </div>
                      <div style={{ fontSize: '0.9em', color: '#4a7c2a' }}>
                        {selectedMember.email} | {selectedMember.phone}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label>Full Name:</label>
                <input
                  type="text"
                  value={newInstructor.name || ''}
                  onChange={(e) => setNewInstructor({ ...newInstructor, name: e.target.value })}
                  placeholder="Enter instructor name"
                  readOnly={!editingInstructor && selectedMember !== null}
                  style={{
                    backgroundColor: !editingInstructor && selectedMember ? '#f9f9f9' : 'white',
                    cursor: !editingInstructor && selectedMember ? 'not-allowed' : 'text',
                  }}
                />
              </div>

              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={newInstructor.email || ''}
                  onChange={(e) => setNewInstructor({ ...newInstructor, email: e.target.value })}
                  placeholder="Enter email address"
                  readOnly={!editingInstructor && selectedMember !== null}
                  style={{
                    backgroundColor: !editingInstructor && selectedMember ? '#f9f9f9' : 'white',
                    cursor: !editingInstructor && selectedMember ? 'not-allowed' : 'text',
                  }}
                />
              </div>

              <div className="form-group">
                <label>Phone:</label>
                <input
                  type="tel"
                  value={newInstructor.phone || ''}
                  onChange={(e) => setNewInstructor({ ...newInstructor, phone: e.target.value })}
                  placeholder="+994501234567"
                  readOnly={!editingInstructor && selectedMember !== null}
                  style={{
                    backgroundColor: !editingInstructor && selectedMember ? '#f9f9f9' : 'white',
                    cursor: !editingInstructor && selectedMember ? 'not-allowed' : 'text',
                  }}
                />
              </div>

              <div className="form-group">
                <label>Experience (years):</label>
                <input
                  type="number"
                  value={newInstructor.experience === 0 ? '' : newInstructor.experience || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewInstructor({
                      ...newInstructor,
                      experience: value === '' ? 0 : parseInt(value) || 0,
                    });
                  }}
                  placeholder="Enter years of experience"
                  min="0"
                  max="50"
                />
              </div>

              <div className="form-group">
                <label>Specializations (comma-separated):</label>
                <input
                  type="text"
                  value={
                    newInstructor.specialization ? newInstructor.specialization.join(', ') : ''
                  }
                  placeholder="e.g., Yoga, Pilates, CrossFit"
                  onChange={(e) =>
                    setNewInstructor({
                      ...newInstructor,
                      specialization: e.target.value.split(',').map((s) => s.trim()),
                    })
                  }
                />
              </div>

              {/* Enhanced Weekday Availability Selector */}
              <div className="form-group schedule-builder">
                <label className="schedule-builder-label">📅 Weekly Availability:</label>
                <p className="schedule-helper-text">Select weekdays when instructor is available</p>

                {/* Weekday Checkboxes */}
                <div className="weekday-checkboxes">
                  {[
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                    'Sunday',
                  ].map((day, arrayIndex) => {
                    // Map display order to actual dayOfWeek values (0=Sunday, 1=Monday... 6=Saturday)
                    const dayOfWeekValue = arrayIndex === 6 ? 0 : arrayIndex + 1;
                    const availabilityArray = newInstructor.availability || [];
                    const isChecked = availabilityArray.includes(day);

                    return (
                      <label
                        key={dayOfWeekValue}
                        className={`weekday-checkbox ${isChecked ? 'checked' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const currentAvailability = newInstructor.availability || [];
                            if (e.target.checked) {
                              // Add day to availability
                              setNewInstructor({
                                ...newInstructor,
                                availability: [...currentAvailability, day],
                              });
                            } else {
                              // Remove day from availability
                              setNewInstructor({
                                ...newInstructor,
                                availability: currentAvailability.filter((d) => d !== day),
                              });
                            }
                          }}
                        />
                        <span className="weekday-label">{day.slice(0, 3)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label>Certifications (comma-separated):</label>
                <input
                  type="text"
                  value={
                    newInstructor.certifications ? newInstructor.certifications.join(', ') : ''
                  }
                  placeholder="e.g., CPR Certified, Personal Trainer Level 3"
                  onChange={(e) =>
                    setNewInstructor({
                      ...newInstructor,
                      certifications: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter((s) => s),
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Bio / Description:</label>
                <textarea
                  value={newInstructor.bio || ''}
                  onChange={(e) => setNewInstructor({ ...newInstructor, bio: e.target.value })}
                  placeholder="Brief description about the instructor..."
                  rows={4}
                  style={{
                    width: '100%',
                    resize: 'vertical',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                  }}
                />
              </div>

              <div className="form-group">
                <label>Status:</label>
                <select
                  value={newInstructor.status || 'active'}
                  onChange={(e) =>
                    setNewInstructor({
                      ...newInstructor,
                      status: e.target.value as 'active' | 'inactive' | 'busy',
                    })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="busy">Busy</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowAddInstructorModal(false);
                  setEditingInstructor(null);
                  resetInstructorForm();
                }}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={handleAddInstructor}
                disabled={!editingInstructor && !selectedMember}
                style={{
                  opacity: !editingInstructor && !selectedMember ? 0.5 : 1,
                  cursor: !editingInstructor && !selectedMember ? 'not-allowed' : 'pointer',
                }}
              >
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
            <div
              className="modal-header"
              style={{
                background: 'linear-gradient(135deg, #fd7e14 0%, #e67e22 100%)',
                color: 'white',
                padding: '20px 25px',
                borderRadius: '12px 12px 0 0',
                marginBottom: '0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5em' }}>👨‍🏫</span>
                <h3 style={{ margin: 0, fontSize: '1.4em', fontWeight: '600' }}>
                  Assign Instructors to "{selectedClass.name}"
                </h3>
              </div>
              <button
                className="close-btn"
                onClick={() => setShowAssignModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  width: '35px',
                  height: '35px',
                  borderRadius: '50%',
                  fontSize: '1.2em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div
                className="assignment-status"
                style={{
                  background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '1.1em', fontWeight: 'bold' }}>
                    👨‍🏫 Instructors: {selectedClass.instructors.length} / 5
                  </div>
                  <div style={{ opacity: 0.9, fontSize: '0.9em' }}>
                    {selectedClass.instructors.length >= 5
                      ? 'Maximum instructors assigned'
                      : `${5 - selectedClass.instructors.length} more can be assigned`}
                  </div>
                </div>
                <div
                  style={{
                    background: selectedClass.instructors.length >= 5 ? '#dc3545' : '#28a745',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '0.9em',
                    fontWeight: 'bold',
                  }}
                >
                  {selectedClass.instructors.length >= 5 ? 'FULL' : 'AVAILABLE'}
                </div>
              </div>
              <div className="instructors-assignment">
                {instructors.map((instructor) => (
                  <div key={instructor.id} className="instructor-assignment-item">
                    <div className="instructor-info">
                      <h4>{instructor.name}</h4>
                      <p>
                        ⭐ {instructor.rating} | {instructor.experience} years
                      </p>
                      <div className="specializations">
                        {(Array.isArray(instructor.specialization)
                          ? instructor.specialization
                          : []
                        ).map((spec, index) => (
                          <span key={index} className="spec-tag">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      className={`assign-toggle ${
                        selectedClass.instructors.includes(instructor.id) ? 'assigned' : ''
                      }`}
                      onClick={() => handleAssignInstructor(instructor.id)}
                      disabled={
                        !selectedClass.instructors.includes(instructor.id) &&
                        selectedClass.instructors.length >= 5
                      }
                      title={
                        !selectedClass.instructors.includes(instructor.id) &&
                        selectedClass.instructors.length >= 5
                          ? 'Maximum of 5 instructors allowed'
                          : ''
                      }
                    >
                      {selectedClass.instructors.includes(instructor.id)
                        ? '✓ Assigned'
                        : '+ Assign'}
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

      {/* Enhanced Schedule Assignment Modal */}
      {showScheduleAssignModal && instructorToSchedule && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{ maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto' }}
          >
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5em' }}>👤</span>
                <div>
                  <div>Class Assignment for {instructorToSchedule.name}</div>
                  <div style={{ fontSize: '0.9em', fontWeight: 'normal', color: '#666' }}>
                    Manage instructor's class schedule
                  </div>
                </div>
              </h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowScheduleAssignModal(false);
                  setInstructorToSchedule(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Summary Bar */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '1.1em', fontWeight: 'bold' }}>
                    📚 Available Classes: {classes.length}
                  </div>
                  <div style={{ opacity: 0.9, fontSize: '0.9em' }}>
                    Click to assign or remove classes from this instructor
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.3em', fontWeight: 'bold' }}>
                    {classes.filter((c) => c.instructors.includes(instructorToSchedule.id)).length}
                  </div>
                  <div style={{ fontSize: '0.8em', opacity: 0.9 }}>Currently Assigned</div>
                </div>
              </div>

              <div className="class-assignment-list">
                {classes.length === 0 ? (
                  <div
                    className="empty-state"
                    style={{
                      textAlign: 'center',
                      padding: '60px 20px',
                      background: '#f8f9fa',
                      borderRadius: '12px',
                      border: '2px dashed #dee2e6',
                    }}
                  >
                    <div style={{ fontSize: '3em', marginBottom: '10px' }}>📋</div>
                    <h4 style={{ color: '#6c757d', marginBottom: '10px' }}>No Classes Available</h4>
                    <p style={{ color: '#868e96' }}>
                      Create classes first to assign them to instructors.
                    </p>
                  </div>
                ) : (
                  classes.map((classItem) => {
                    const isAssigned = classItem.instructors.includes(instructorToSchedule.id);
                    return (
                      <div
                        key={classItem.id}
                        className="class-assignment-item"
                        style={{
                          display: 'block',
                          padding: '20px',
                          border: `2px solid ${isAssigned ? '#28a745' : '#e9ecef'}`,
                          borderRadius: '12px',
                          marginBottom: '15px',
                          backgroundColor: isAssigned ? '#f8fff9' : 'white',
                          boxShadow: isAssigned
                            ? '0 2px 8px rgba(40, 167, 69, 0.1)'
                            : '0 1px 3px rgba(0,0,0,0.1)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          position: 'relative',
                        }}
                        onClick={() => handleAssignClassToInstructor(classItem.id, !isAssigned)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = isAssigned
                            ? '0 4px 12px rgba(40, 167, 69, 0.2)'
                            : '0 4px 12px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = isAssigned
                            ? '0 2px 8px rgba(40, 167, 69, 0.1)'
                            : '0 1px 3px rgba(0,0,0,0.1)';
                        }}
                      >
                        {/* Assignment Status Badge */}
                        <div
                          style={{
                            position: 'absolute',
                            top: '15px',
                            right: '15px',
                            background: isAssigned ? '#28a745' : '#6c757d',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75em',
                            fontWeight: 'bold',
                          }}
                        >
                          {isAssigned ? '✓ ASSIGNED' : 'AVAILABLE'}
                        </div>

                        {/* Class Header */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '12px',
                          }}
                        >
                          <div
                            style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: '10px',
                              background: isAssigned
                                ? 'linear-gradient(135deg, #28a745, #20c997)'
                                : 'linear-gradient(135deg, #6c757d, #495057)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '1.5em',
                            }}
                          >
                            🏃‍♂️
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4
                              style={{
                                margin: '0 0 4px 0',
                                color: isAssigned ? '#155724' : '#333',
                                fontSize: '1.2em',
                                fontWeight: 'bold',
                              }}
                            >
                              {classItem.name}
                            </h4>
                            <div
                              style={{
                                display: 'flex',
                                gap: '15px',
                                fontSize: '0.9em',
                                color: '#666',
                              }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>🏷️</span> {classItem.category}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>👥</span> {classItem.maxCapacity} max
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>💰</span> ${classItem.price}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Schedule Information */}
                        {classItem.schedule && classItem.schedule.length > 0 && (
                          <div
                            style={{
                              background: isAssigned ? '#e8f5e8' : '#f8f9fa',
                              padding: '12px',
                              borderRadius: '8px',
                              marginTop: '12px',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '0.85em',
                                fontWeight: 'bold',
                                color: '#495057',
                                marginBottom: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <span>📅</span> Weekly Schedule:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {classItem.schedule.map((scheduleItem, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    background: isAssigned ? '#d4edda' : '#e9ecef',
                                    color: isAssigned ? '#155724' : '#495057',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.8em',
                                    fontWeight: '500',
                                    border: `1px solid ${isAssigned ? '#c3e6cb' : '#dee2e6'}`,
                                  }}
                                >
                                  <span style={{ fontWeight: 'bold' }}>
                                    {
                                      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
                                        scheduleItem.dayOfWeek
                                      ]
                                    }
                                  </span>
                                  <span style={{ margin: '0 4px' }}>•</span>
                                  <span>
                                    {scheduleItem.startTime} - {scheduleItem.endTime}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <div style={{ marginTop: '15px', textAlign: 'center' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '10px 20px',
                              borderRadius: '25px',
                              background: isAssigned
                                ? 'linear-gradient(135deg, #dc3545, #c82333)'
                                : 'linear-gradient(135deg, #28a745, #20c997)',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.9em',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            }}
                          >
                            {isAssigned ? (
                              <>
                                <span>✕</span>
                                <span>Click to Remove</span>
                              </>
                            ) : (
                              <>
                                <span>✓</span>
                                <span>Click to Assign</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div
              className="modal-footer"
              style={{
                borderTop: '1px solid #dee2e6',
                padding: '20px',
                background: '#f8f9fa',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ color: '#6c757d', fontSize: '0.9em' }}>
                  <span style={{ fontWeight: 'bold' }}>
                    {classes.filter((c) => c.instructors.includes(instructorToSchedule.id)).length}
                  </span>{' '}
                  of {classes.length} classes assigned
                </div>
                <button
                  className="confirm-btn"
                  onClick={() => {
                    showNotification(
                      `Class assignments updated for ${instructorToSchedule.name}`,
                      'success',
                    );
                    setShowScheduleAssignModal(false);
                    setInstructorToSchedule(null);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  ✅ Complete Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Instructor Confirmation Modal */}
      {showDeleteConfirmModal && instructorToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>🗑️ Delete Instructor</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setInstructorToDelete(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div
                className="warning-message"
                style={{
                  background: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                  <span style={{ fontSize: '2em', marginRight: '10px' }}>⚠️</span>
                  <h4 style={{ margin: 0, color: '#856404' }}>Permanent Action Warning</h4>
                </div>
                <p style={{ margin: '0 0 10px 0', color: '#856404' }}>
                  You are about to permanently delete instructor:
                </p>
                <div
                  style={{
                    background: 'white',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ffeaa7',
                    fontWeight: 'bold',
                  }}
                >
                  👤 {instructorToDelete.name} ({instructorToDelete.email})
                </div>
              </div>

              <div className="consequences-list" style={{ color: '#666', fontSize: '0.95em' }}>
                <p>
                  <strong>This action will:</strong>
                </p>
                <ul style={{ paddingLeft: '20px' }}>
                  <li>Permanently remove the instructor from the system</li>
                  <li>Remove them from all assigned classes</li>
                  <li>Cannot be undone</li>
                </ul>
              </div>

              <div
                style={{
                  marginTop: '20px',
                  padding: '15px',
                  background: '#f8f9fa',
                  borderRadius: '4px',
                }}
              >
                <p style={{ margin: 0, fontSize: '0.9em', color: '#495057' }}>
                  <strong>💡 Alternative:</strong> Consider setting the instructor status to
                  "Inactive" instead of deleting.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setInstructorToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className="delete-btn"
                onClick={confirmDeleteInstructor}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                🗑️ Delete Permanently
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
              <button
                className="close-btn"
                onClick={() => {
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
                    status: 'scheduled',
                  });
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Class: *</label>
                <select
                  value={newScheduleSlot.classId || ''}
                  onChange={(e) =>
                    setNewScheduleSlot({ ...newScheduleSlot, classId: e.target.value })
                  }
                >
                  <option value="">Select a class</option>
                  {classes.map((gymClass) => (
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
                  onChange={(e) =>
                    setNewScheduleSlot({ ...newScheduleSlot, instructorId: e.target.value })
                  }
                >
                  <option value="">Select an instructor</option>
                  {instructors.map((instructor) => (
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
                  onChange={(e) =>
                    setNewScheduleSlot({ ...newScheduleSlot, dayOfWeek: parseInt(e.target.value) })
                  }
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
                  onChange={(e) => setNewScheduleSlot({ ...newScheduleSlot, date: e.target.value })}
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
                    style={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: '1rem',
                      fontWeight: '700',
                    }}
                    onChange={(e) =>
                      setNewScheduleSlot({ ...newScheduleSlot, startTime: e.target.value })
                    }
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
                    style={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: '1rem',
                      fontWeight: '700',
                    }}
                    onChange={(e) =>
                      setNewScheduleSlot({ ...newScheduleSlot, endTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Status:</label>
                <select
                  value={newScheduleSlot.status || 'scheduled'}
                  onChange={(e) =>
                    setNewScheduleSlot({ ...newScheduleSlot, status: e.target.value as any })
                  }
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => {
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
                    status: 'scheduled',
                  });
                }}
              >
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleAddScheduleSlot}>
                {editingScheduleSlot ? 'Update Schedule Slot' : 'Add Schedule Slot'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roster Modal */}
      {rosterModalOpen && rosterModalSlot && (
        <div className="modal-overlay">
          <div className="modal-content roster-modal">
            <div className="modal-header">
              <div>
                <h3>Enrolled Members</h3>
                <p className="roster-subtitle">
                  {rosterClassDetails?.name || 'Unknown Class'} • {rosterModalSlot.startTime} -{' '}
                  {rosterModalSlot.endTime}
                </p>
                <p className="roster-subtitle">
                  Instructor: {rosterInstructor?.name || 'Unassigned'}
                </p>
              </div>
              <button className="close-btn" onClick={handleCloseRosterModal}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="roster-summary">
                <span>📅 {formatDate(rosterModalSlot.date)}</span>
                <span>
                  👥 {rosterCount}
                  {typeof rosterCapacity === 'number' && rosterCapacity > 0
                    ? ` / ${rosterCapacity} seats`
                    : ' enrolled'}
                </span>
                <button
                  className="refresh-btn"
                  onClick={handleRefreshRoster}
                  disabled={rosterLoading}
                >
                  {rosterLoading ? 'Refreshing...' : '🔄 Refresh'}
                </button>
              </div>

              {rosterError && <div className="roster-error">{rosterError}</div>}

              {rosterLoading ? (
                <div className="roster-loading">Loading roster...</div>
              ) : rosterEntries.length === 0 ? (
                <div className="roster-empty">No members have booked this slot yet.</div>
              ) : (
                <div className="roster-table-wrapper">
                  <table className="roster-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Booked On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rosterEntries.map((entry) => (
                        <tr key={entry.bookingId}>
                          <td>{entry.name}</td>
                          <td>{entry.email || '—'}</td>
                          <td className={`status-pill status-${entry.status}`}>
                            {entry.status.replace('_', ' ')}
                          </td>
                          <td>
                            {entry.bookedAt ? new Date(entry.bookedAt).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={handleCloseRosterModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Class Deletion Modal */}
      {showClassDeleteModal && classToDelete && classDeleteInfo && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 style={{ color: '#dc3545', display: 'flex', alignItems: 'center', gap: '10px' }}>
                ⚠️ Delete Class Confirmation
              </h3>
              <button className="close-btn" onClick={() => setShowClassDeleteModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div style={{ padding: '20px', lineHeight: '1.6' }}>
                <pre
                  style={{
                    fontFamily: 'system-ui',
                    fontSize: '1em',
                    whiteSpace: 'pre-wrap',
                    marginBottom: '20px',
                    backgroundColor: '#f8f9fa',
                    padding: '15px',
                    borderRadius: '4px',
                    border: '1px solid #dee2e6',
                  }}
                >
                  {classDeleteInfo.details}
                </pre>

                {classDeleteInfo.hasScheduleSlots ||
                classDeleteInfo.hasInstructors ||
                classDeleteInfo.hasBookings ? (
                  <div
                    style={{
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffeaa7',
                      borderRadius: '4px',
                      padding: '15px',
                      marginBottom: '20px',
                    }}
                  >
                    <h4 style={{ color: '#856404', marginTop: 0 }}>
                      ⚠️ Warning: Class Has Active Dependencies
                    </h4>
                    <p style={{ color: '#856404', marginBottom: '10px' }}>
                      This class cannot be deleted normally because it has active dependencies that
                      would be affected:
                    </p>
                    <ul style={{ color: '#856404', marginBottom: '15px' }}>
                      {classDeleteInfo.hasScheduleSlots && (
                        <li>Active schedule slots will be removed</li>
                      )}
                      {classDeleteInfo.hasInstructors && (
                        <li>Instructor assignments will be unlinked</li>
                      )}
                      {classDeleteInfo.hasBookings && <li>Member bookings will be cancelled</li>}
                    </ul>

                    {classDeleteInfo.canForceDelete ? (
                      <div
                        style={{
                          backgroundColor: '#d4edda',
                          border: '1px solid #c3e6cb',
                          borderRadius: '4px',
                          padding: '10px',
                          marginTop: '15px',
                        }}
                      >
                        <p style={{ color: '#155724', margin: 0, fontWeight: 'bold' }}>
                          🔑 Sparta Access Detected: You can force delete this class if needed
                        </p>
                      </div>
                    ) : (
                      <div
                        style={{
                          backgroundColor: '#f8d7da',
                          border: '1px solid #f5c6cb',
                          borderRadius: '4px',
                          padding: '10px',
                          marginTop: '15px',
                        }}
                      >
                        <p style={{ color: '#721c24', margin: 0, fontWeight: 'bold' }}>
                          🚫 Access Denied: Only Sparta users can force delete classes with
                          dependencies
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      backgroundColor: '#d4edda',
                      border: '1px solid #c3e6cb',
                      borderRadius: '4px',
                      padding: '15px',
                      marginBottom: '20px',
                    }}
                  >
                    <h4 style={{ color: '#155724', marginTop: 0 }}>✅ Safe to Delete</h4>
                    <p style={{ color: '#155724', margin: 0 }}>
                      This class has no active dependencies and can be safely deleted.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowClassDeleteModal(false)}>
                Cancel
              </button>

              {!classDeleteInfo.hasScheduleSlots &&
              !classDeleteInfo.hasInstructors &&
              !classDeleteInfo.hasBookings ? (
                <button
                  className="confirm-btn"
                  onClick={() => confirmDeleteClass(false)}
                  style={{ backgroundColor: '#dc3545', color: 'white' }}
                >
                  🗑️ Delete Class
                </button>
              ) : classDeleteInfo.canForceDelete ? (
                <>
                  <button
                    className="confirm-btn"
                    onClick={() => confirmDeleteClass(true)}
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      fontWeight: 'bold',
                      border: '2px solid #a71e2a',
                    }}
                  >
                    ⚠️ FORCE DELETE
                  </button>
                </>
              ) : (
                <button
                  className="confirm-btn"
                  disabled
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    cursor: 'not-allowed',
                    opacity: 0.6,
                  }}
                >
                  🚫 Cannot Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Notification Modal */}
      {showNotificationModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3
                style={{
                  color:
                    notificationType === 'success'
                      ? '#28a745'
                      : notificationType === 'error'
                      ? '#dc3545'
                      : '#17a2b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                {notificationType === 'success' && '✅'}
                {notificationType === 'error' && '❌'}
                {notificationType === 'info' && 'ℹ️'}
                {notificationType === 'success'
                  ? 'Success'
                  : notificationType === 'error'
                  ? 'Error'
                  : 'Information'}
              </h3>
              <button className="close-btn" onClick={() => setShowNotificationModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div
                style={{
                  padding: '20px',
                  fontSize: '1.1em',
                  lineHeight: '1.5',
                  textAlign: 'center',
                  color: notificationType === 'error' ? '#721c24' : '#333',
                }}
              >
                {notificationMessage}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className={`confirm-btn ${notificationType === 'error' ? 'error-btn' : ''}`}
                onClick={() => setShowNotificationModal(false)}
                style={{
                  backgroundColor:
                    notificationType === 'success'
                      ? '#28a745'
                      : notificationType === 'error'
                      ? '#dc3545'
                      : '#17a2b8',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Enrolled Members Modal */}
      {showClassEnrolledModal && selectedClassForEnrollment && (
        <div className="modal-overlay">
          <div className="modal-content roster-modal">
            <div className="modal-header">
              <div>
                <h3>Enrolled Members</h3>
                <p className="roster-subtitle">{selectedClassForEnrollment.name}</p>
                <p className="roster-subtitle">
                  Total Enrollment: {classEnrolledMembers.length} /{' '}
                  {selectedClassForEnrollment.maxCapacity}
                </p>
              </div>
              <button className="close-btn" onClick={handleCloseClassEnrollmentModal}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="roster-summary">
                <span>📊 Class: {selectedClassForEnrollment.name}</span>
                <span>
                  👥 {classEnrolledMembers.length} enrolled
                  {selectedClassForEnrollment.maxCapacity > 0
                    ? ` / ${selectedClassForEnrollment.maxCapacity} max capacity`
                    : ''}
                </span>
                <span>🎯 Category: {selectedClassForEnrollment.category}</span>
              </div>

              {classEnrolledMembers.length === 0 ? (
                <div className="roster-empty">No members are enrolled in this class yet.</div>
              ) : (
                <div className="roster-table-wrapper">
                  <table className="roster-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Status</th>
                        <th>Enrolled On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classEnrolledMembers.map((member, index) => (
                        <tr key={`${member.memberId}-${index}`}>
                          <td>{member.name}</td>
                          <td>{member.phone || '—'}</td>
                          <td>
                            <span className={`status-badge status-${member.status}`}>
                              {member.status}
                            </span>
                          </td>
                          <td>
                            {member.bookedAt
                              ? (() => {
                                  const date = new Date(member.bookedAt);
                                  const dateStr = new Intl.DateTimeFormat('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    timeZone: 'Asia/Baku',
                                  }).format(date);
                                  const timeStr = new Intl.DateTimeFormat('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false,
                                    timeZone: 'Asia/Baku',
                                  }).format(date);
                                  return `${dateStr} ${timeStr}`;
                                })()
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={handleCloseClassEnrollmentModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
