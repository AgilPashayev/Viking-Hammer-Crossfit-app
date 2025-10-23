import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  getAllMembers as fetchAllMembers,
  createMember as apiCreateMember,
  updateMember as apiUpdateMember,
  deleteMember as apiDeleteMember,
  Member as ApiMember,
  CreateMemberData as ApiCreateMemberData,
  UpdateMemberData as ApiUpdateMemberData,
} from '../services/memberService';
import { isAuthenticated, isAdmin } from '../services/authService';

const DEFAULT_MEMBERSHIP_TYPES = ['Single', 'Monthly', 'Monthly Unlimited', 'Company'];

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  membershipType: string;
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  lastCheckIn?: string;
  role: 'member' | 'instructor' | 'admin' | 'reception' | 'sparta';
  company?: string;
  dateOfBirth?: string;
  gender?: string;
  emergencyContact?: string;
  address?: string;
}

export interface CheckIn {
  id: string;
  memberId: string;
  memberName: string;
  membershipType: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  checkInTime: string;
  checkOutTime?: string;
  duration?: number;
  role?: 'member' | 'instructor' | 'admin' | 'reception' | 'sparta';
}

export interface Stats {
  totalMembers: number;
  checkedInToday: number;
  instructors: number;
  activeClasses: number;
  expiringMemberships: number;
  upcomingBirthdays: number;
  activeMembers: number;
  pendingMembers: number;
  inactiveMembers: number;
  weeklyCheckIns: number;
  plansCount: number;
}

// Class types
export interface GymClass {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  maxCapacity: number;
  currentEnrollment: number;
  instructors: string[]; // instructor IDs or names
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

// Activity feed types
export type ActivityType =
  | 'checkin'
  | 'member_added'
  | 'member_updated'
  | 'membership_changed'
  | 'announcement_created'
  | 'announcement_published'
  | 'announcement_deleted'
  | 'birthday_upcoming'
  | 'class_created'
  | 'class_updated'
  | 'class_deleted'
  | 'instructor_created'
  | 'instructor_updated'
  | 'instructor_deleted'
  | 'schedule_created'
  | 'schedule_updated'
  | 'schedule_deleted';

export interface Activity {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: string; // ISO string
  memberId?: string;
  metadata?: Record<string, any>;
}

type CreateMemberInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  membershipType: string;
  status?: Member['status'];
  role?: Member['role'];
  company?: string;
  dateOfBirth?: string;
  joinDate?: string | Date;
};

type UpdateMemberInput = Partial<Member> & {
  firstName?: string;
  lastName?: string;
  membershipType?: string;
  company?: string;
  joinDate?: string | Date;
  lastCheckIn?: string | Date;
  dateOfBirth?: string;
};

interface DataContextType {
  members: Member[];
  membersLoading: boolean;
  membersSaving: boolean;
  membersError: string | null;
  stats: Stats;
  checkIns: CheckIn[];
  activities: Activity[];
  membershipTypes: string[];
  roles: Array<{ value: 'member' | 'instructor' | 'admin'; label: string }>;
  classes: GymClass[];
  refreshMembers: () => Promise<void>;
  addMember: (member: CreateMemberInput) => Promise<Member>;
  updateMember: (id: string, updates: UpdateMemberInput) => Promise<Member>;
  deleteMember: (id: string) => Promise<void>;
  checkInMember: (id: string) => void;
  refreshStats: () => void;
  getWeeklyCheckIns: () => number;
  getTodayCheckIns: () => CheckIn[];
  getMemberVisitsThisMonth: (memberId: string) => number;
  getMemberTotalVisits: (memberId: string) => number;
  logActivity: (entry: Omit<Activity, 'id' | 'timestamp'> & { timestamp?: string }) => void;
  getUpcomingBirthdays: () => Member[];
  setActiveClassesCount: (count: number) => void;
  setPlansCount: (count: number) => void;
  updateMembershipTypes: (types: string[]) => void;
  getClasses: () => GymClass[];
  getUpcomingClasses: () => GymClass[];
  addClass: (classData: Omit<GymClass, 'id'>) => void;
  updateClass: (id: string, updates: Partial<GymClass>) => void;
  deleteClass: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [members, setMembers] = useState<Member[]>([
    {
      id: '1',
      firstName: 'Thor',
      lastName: 'Hammer',
      email: 'thor@vikinghammer.com',
      phone: '🇦🇿 +994 50 333 33 33',
      membershipType: 'Monthly Unlimited',
      status: 'active',
      joinDate: '2024-01-15',
      lastCheckIn: '2024-10-07',
      role: 'member',
    },
    {
      id: '2',
      firstName: 'Freya',
      lastName: 'Viking',
      email: 'freya@vikinghammer.com',
      phone: '🇺🇸 +1 555 333 3333',
      membershipType: 'Single',
      status: 'active',
      joinDate: '2024-02-20',
      lastCheckIn: '2024-10-06',
      role: 'member',
      company: 'TechCorp',
    },
    {
      id: '3',
      firstName: 'Odin',
      lastName: 'Hammer',
      email: 'odin@vikinghammer.com',
      phone: '🇦🇿 +994 55 333 33 33',
      membershipType: 'Monthly',
      status: 'pending',
      joinDate: '2024-10-01',
      role: 'instructor',
    },
    {
      id: '4',
      firstName: 'Loki',
      lastName: 'Viking',
      email: 'loki@vikinghammer.com',
      phone: '🇬🇧 +44 7700 333333',
      membershipType: 'Company',
      status: 'active',
      joinDate: '2024-09-15',
      lastCheckIn: '2024-10-07',
      role: 'member',
      company: 'Innovation Labs',
    },
    {
      id: '5',
      firstName: 'Ragnar',
      lastName: 'Hammer',
      email: 'ragnar@vikinghammer.com',
      phone: '🇩🇪 +49 30 33333333',
      membershipType: 'Monthly Unlimited',
      status: 'active',
      joinDate: '2024-08-01',
      lastCheckIn: '2024-10-06',
      role: 'instructor',
    },
    {
      id: '6',
      firstName: 'Astrid',
      lastName: 'Viking',
      email: 'astrid@vikinghammer.com',
      phone: '🇫🇷 +33 1 33 33 33 33',
      membershipType: 'Single',
      status: 'active',
      joinDate: '2024-09-10',
      lastCheckIn: '2024-10-08',
      role: 'member',
      company: 'Digital Solutions',
    },
    {
      id: '7',
      firstName: 'Bjorn',
      lastName: 'Hammer',
      email: 'bjorn@vikinghammer.com',
      phone: '🇦🇿 +994 70 333 33 33',
      membershipType: 'Monthly',
      status: 'active',
      joinDate: '2024-07-20',
      lastCheckIn: '2024-10-07',
      role: 'admin',
    },
  ]);
  const [membersLoading, setMembersLoading] = useState<boolean>(false);
  const [membersSaving, setMembersSaving] = useState<boolean>(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  const [checkIns, setCheckIns] = useState<CheckIn[]>([
    {
      id: 'checkin1',
      memberId: '1',
      memberName: 'Thor Hammer',
      membershipType: 'Monthly Unlimited',
      phone: '🇦🇿 +994 50 333 33 33',
      status: 'active',
      checkInTime: new Date().toISOString(),
      role: 'member',
    },
    {
      id: 'checkin2',
      memberId: '2',
      memberName: 'Freya Viking',
      membershipType: 'Single',
      phone: '🇺🇸 +1 555 333 3333',
      status: 'active',
      checkInTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      role: 'member',
    },
  ]);

  // Classes state
  const [classes, setClasses] = useState<GymClass[]>([]);

  const [stats, setStats] = useState<Stats>({
    totalMembers: 247,
    checkedInToday: 48,
    instructors: 12,
    activeClasses: 8,
    expiringMemberships: 5,
    upcomingBirthdays: 3,
    activeMembers: 231,
    pendingMembers: 16,
    inactiveMembers: 0,
    weeklyCheckIns: 0,
    plansCount: 4,
  });

  const [activities, setActivities] = useState<Activity[]>([]);

  // Centralized membership types and roles
  const [membershipTypes, setMembershipTypes] = useState<string[]>(DEFAULT_MEMBERSHIP_TYPES);

  const roles: Array<{ value: 'member' | 'instructor' | 'admin'; label: string }> = [
    { value: 'member', label: '🛡️ Viking (Member)' },
    { value: 'instructor', label: '⚔️ Warrior (Instructor)' },
    { value: 'admin', label: '👑 Commander (Admin)' },
  ];

  const transformApiMember = useCallback(
    (apiMember: ApiMember): Member => {
      const rawName = (apiMember.name || '').trim();
      const nameParts = rawName ? rawName.split(' ') : [];
      const fallbackName = apiMember.email?.split('@')[0] || 'Member';
      const firstName = nameParts[0] || fallbackName;
      const lastName = nameParts.slice(1).join(' ');

      const membershipType = apiMember.membership_type || membershipTypes[0] || 'Monthly Unlimited';
      const joinDateSource = apiMember.join_date || apiMember.created_at;
      const joinDate = joinDateSource
        ? new Date(joinDateSource).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const lastCheckIn = apiMember.last_check_in ? new Date(apiMember.last_check_in).toISOString() : undefined;

      const normalizedStatus = (apiMember.status as Member['status']) || 'active';
      const normalizedRole = (apiMember.role as Member['role']) || 'member';

      return {
        id: apiMember.id,
        firstName,
        lastName,
        email: apiMember.email,
        phone: apiMember.phone || '',
        membershipType,
        status: normalizedStatus,
        joinDate,
        lastCheckIn,
        role: normalizedRole,
        company: apiMember.company || undefined,
        dateOfBirth: apiMember.dob || undefined,
      };
    },
    [membershipTypes],
  );

  const loadMembers = useCallback(async () => {
    if (!isAuthenticated() || !isAdmin()) {
      return;
    }

    try {
      setMembersLoading(true);
      setMembersError(null);
      const apiMembers = await fetchAllMembers();
      const normalized = Array.isArray(apiMembers)
        ? apiMembers.map(transformApiMember)
        : [];
      setMembers(normalized);
    } catch (error) {
      console.error('Failed to load members:', error);
      setMembersError(error instanceof Error ? error.message : 'Failed to load members');
    } finally {
      setMembersLoading(false);
    }
  }, [transformApiMember]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Calculate real-time stats whenever members or checkIns change
  useEffect(() => {
    refreshStats();
  }, [members, checkIns]);

  // Initialize activity feed once from existing check-ins on first mount
  useEffect(() => {
    setActivities((prev) => {
      if (prev.length > 0) return prev;
      const initial: Activity[] = checkIns.map((c) => ({
        id: `act_${c.id}`,
        type: 'checkin',
        message: `${c.memberName} checked in`,
        timestamp: c.checkInTime,
        memberId: c.memberId,
        metadata: { checkInId: c.id },
      }));
      return initial;
    });
    // run only once
  }, []);

  const refreshStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const totalMembers = members.length;
    const checkedInToday = getTodayCheckIns().length;
    const instructors = members.filter((m) => m.role === 'instructor').length;
    const activeMembers = members.filter((m) => m.status === 'active').length;
    const pendingMembers = members.filter((m) => m.status === 'pending').length;
    const inactiveMembers = members.filter((m) => m.status === 'inactive').length;
    const weeklyCheckIns = getWeeklyCheckIns();

    // Calculate upcoming birthdays (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingBirthdays = members.filter((m) => {
      if (!m.dateOfBirth) return false;
      const birthday = new Date(m.dateOfBirth);
      const thisYear = new Date().getFullYear();
      const birthdayThisYear = new Date(thisYear, birthday.getMonth(), birthday.getDate());
      return birthdayThisYear >= new Date() && birthdayThisYear <= nextWeek;
    }).length;

  // Values from other modules (kept from current stats, updated by their modules)
  const activeClasses = stats.activeClasses;
  const plansCount = stats.plansCount;
    const expiringMemberships = Math.floor(totalMembers * 0.1); // 10% of members with expiring memberships

    setStats({
      totalMembers,
      checkedInToday,
      instructors,
      activeClasses,
      plansCount,
      expiringMemberships,
      upcomingBirthdays,
      activeMembers,
      pendingMembers,
      inactiveMembers,
      weeklyCheckIns,
    });
  };

  const setActiveClassesCount = useCallback((count: number) => {
    setStats((prev) => ({ ...prev, activeClasses: count }));
  }, []);

  const setPlansCount = useCallback((count: number) => {
    setStats((prev) => ({ ...prev, plansCount: count }));
  }, []);

  const updateMembershipTypes = (types: string[]) => {
    // Update membership types when plans are created/updated in MembershipManager
    setMembershipTypes(types);
  };

  // Classes Management Functions
  const getClasses = (): GymClass[] => {
    return classes;
  };

  const getUpcomingClasses = (): GymClass[] => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    // Filter active classes that are upcoming
    return classes.filter(cls => {
      if (cls.status !== 'active') return false;
      
      // Check if class has upcoming schedule
      return cls.schedule.some(sch => {
        // If class is today and hasn't started yet, or it's on a future day this week
        if (sch.dayOfWeek === currentDay) {
          return sch.startTime > currentTime;
        }
        // Future days this week
        return sch.dayOfWeek > currentDay;
      });
    }).slice(0, 5); // Return max 5 upcoming classes
  };

  const addClass = (classData: Omit<GymClass, 'id'>) => {
    const newClass: GymClass = {
      ...classData,
      id: `class_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
    setClasses(prev => [...prev, newClass]);
    
    // Update active classes count
    if (newClass.status === 'active') {
      setActiveClassesCount(classes.filter(c => c.status === 'active').length + 1);
    }
    
    // Log activity
    logActivity({
      type: 'member_added', // Using existing type as proxy
      message: `New class added: ${newClass.name}`,
      metadata: { classId: newClass.id, className: newClass.name }
    });
  };

  const updateClass = (id: string, updates: Partial<GymClass>) => {
    setClasses(prev => {
      const updated = prev.map(cls => 
        cls.id === id ? { ...cls, ...updates } : cls
      );
      
      // Update active classes count if status changed
      const activeCount = updated.filter(c => c.status === 'active').length;
      setActiveClassesCount(activeCount);
      
      return updated;
    });
    
    // Log activity
    const updatedClass = classes.find(c => c.id === id);
    if (updatedClass) {
      logActivity({
        type: 'member_updated', // Using existing type as proxy
        message: `Class updated: ${updatedClass.name}`,
        metadata: { classId: id, updates }
      });
    }
  };

  const deleteClass = (id: string) => {
    const classToDelete = classes.find(c => c.id === id);
    setClasses(prev => {
      const filtered = prev.filter(cls => cls.id !== id);
      
      // Update active classes count
      const activeCount = filtered.filter(c => c.status === 'active').length;
      setActiveClassesCount(activeCount);
      
      return filtered;
    });
    
    // Log activity
    if (classToDelete) {
      logActivity({
        type: 'announcement_deleted', // Using existing type as proxy
        message: `Class deleted: ${classToDelete.name}`,
        metadata: { classId: id, className: classToDelete.name }
      });
    }
  };

  // Update stats when classes change
  useEffect(() => {
    const activeCount = classes.filter(c => c.status === 'active').length;
    setStats(prev => ({ ...prev, activeClasses: activeCount }));
  }, [classes]);

  // Initial load: populate with some mock data
  useEffect(() => {
    if (classes.length === 0) {
      // Add initial mock classes
      setClasses([
        {
          id: 'class1',
          name: 'Morning CrossFit WOD',
          description: 'High-intensity CrossFit workout to start your day',
          duration: 60,
          maxCapacity: 20,
          currentEnrollment: 15,
          instructors: ['Thor Hansen'],
          schedule: [
            { dayOfWeek: 1, startTime: '06:00', endTime: '07:00' }, // Monday
            { dayOfWeek: 3, startTime: '06:00', endTime: '07:00' }, // Wednesday
            { dayOfWeek: 5, startTime: '06:00', endTime: '07:00' }, // Friday
          ],
          equipment: ['Barbell', 'Pull-up Bar', 'Kettlebell'],
          difficulty: 'Intermediate',
          category: 'Mixed',
          price: 25,
          status: 'active'
        },
        {
          id: 'class2',
          name: 'Strength Training',
          description: 'Build muscle and increase strength with guided weightlifting',
          duration: 75,
          maxCapacity: 15,
          currentEnrollment: 12,
          instructors: ['Freya Nielsen'],
          schedule: [
            { dayOfWeek: 2, startTime: '18:00', endTime: '19:15' }, // Tuesday
            { dayOfWeek: 4, startTime: '18:00', endTime: '19:15' }, // Thursday
          ],
          equipment: ['Barbell', 'Dumbbells', 'Bench'],
          difficulty: 'Intermediate',
          category: 'Strength',
          price: 30,
          status: 'active'
        },
        {
          id: 'class3',
          name: 'HIIT Cardio',
          description: 'High-Intensity Interval Training for maximum calorie burn',
          duration: 45,
          maxCapacity: 25,
          currentEnrollment: 20,
          instructors: ['Erik Larsen'],
          schedule: [
            { dayOfWeek: 1, startTime: '07:00', endTime: '07:45' }, // Monday
            { dayOfWeek: 3, startTime: '07:00', endTime: '07:45' }, // Wednesday
            { dayOfWeek: 5, startTime: '07:00', endTime: '07:45' }, // Friday
          ],
          equipment: ['Jump Rope', 'Medicine Ball'],
          difficulty: 'Beginner',
          category: 'Cardio',
          price: 20,
          status: 'active'
        },
      ]);
    }
  }, []);

  const refreshMembers = useCallback(async () => {
    await loadMembers();
  }, [loadMembers]);

  const addMember = useCallback(
    async (memberData: CreateMemberInput): Promise<Member> => {
      if (!isAuthenticated() || !isAdmin()) {
        throw new Error('You are not authorized to add members');
      }

      setMembersSaving(true);
      setMembersError(null);

      try {
        const payload: ApiCreateMemberData = {
          firstName: memberData.firstName.trim(),
          lastName: memberData.lastName.trim(),
          email: memberData.email.trim(),
          phone: memberData.phone?.trim(),
          role: memberData.role || 'member',
          status: memberData.status || 'active',
          dob: memberData.dateOfBirth,
          membershipType: memberData.membershipType,
          company: memberData.company,
          joinDate: memberData.joinDate,
        };

        const created = await apiCreateMember(payload);
        const transformed = transformApiMember(created);
        setMembers((prev) => [...prev, transformed]);

        logActivity({
          type: 'member_added',
          message: `New member ${transformed.firstName} ${transformed.lastName} registered`,
          memberId: transformed.id,
        });

        return transformed;
      } catch (error) {
        console.error('Failed to add member:', error);
        const message = error instanceof Error ? error.message : 'Failed to add member';
        setMembersError(message);
        throw error;
      } finally {
        setMembersSaving(false);
      }
    },
    [transformApiMember],
  );

  const updateMember = useCallback(
    async (id: string, updates: UpdateMemberInput): Promise<Member> => {
      if (!isAuthenticated() || !isAdmin()) {
        throw new Error('You are not authorized to update members');
      }

      setMembersSaving(true);
      setMembersError(null);

      try {
        const payload: ApiUpdateMemberData = {
          firstName: updates.firstName?.trim(),
          lastName: updates.lastName?.trim(),
          email: updates.email?.trim(),
          phone: updates.phone?.trim(),
          status: updates.status,
          dob: updates.dateOfBirth,
          membershipType: updates.membershipType,
          company: updates.company,
          joinDate: updates.joinDate,
          lastCheckIn: updates.lastCheckIn,
          role: updates.role,
        };

        const before = members.find((member) => member.id === id);
        const updated = await apiUpdateMember(id, payload);
        const transformed = transformApiMember(updated);
        setMembers((prev) => prev.map((member) => (member.id === id ? transformed : member)));

        const memberName = `${transformed.firstName} ${transformed.lastName}`.trim();
        logActivity({ type: 'member_updated', message: `${memberName} profile updated`, memberId: id });

        if (before && transformed.membershipType !== before.membershipType) {
          logActivity({
            type: 'membership_changed',
            message: `${memberName} membership changed to ${transformed.membershipType}`,
            memberId: id,
            metadata: { from: before.membershipType, to: transformed.membershipType },
          });
        }

        return transformed;
      } catch (error) {
        console.error('Failed to update member:', error);
        const message = error instanceof Error ? error.message : 'Failed to update member';
        setMembersError(message);
        throw error;
      } finally {
        setMembersSaving(false);
      }
    },
    [members, transformApiMember],
  );

  const deleteMember = useCallback(
    async (id: string): Promise<void> => {
      if (!isAuthenticated() || !isAdmin()) {
        throw new Error('You are not authorized to delete members');
      }

      setMembersSaving(true);
      setMembersError(null);

      try {
        await apiDeleteMember(id);
        setMembers((prev) => prev.filter((member) => member.id !== id));
      } catch (error) {
        console.error('Failed to delete member:', error);
        const message = error instanceof Error ? error.message : 'Failed to delete member';
        setMembersError(message);
        throw error;
      } finally {
        setMembersSaving(false);
      }
    },
    [],
  );

  const checkInMember = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const member = members.find(m => m.id === id);
    if (member) {
      // Update member's last check-in
      updateMember(id, { lastCheckIn: today });
      
      // Add new check-in record
      const newCheckIn: CheckIn = {
        id: `checkin_${Date.now()}`,
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        membershipType: member.membershipType,
        phone: member.phone,
        status: member.status,
        checkInTime: new Date().toISOString(),
        role: member.role,
      };
      setCheckIns(prev => [newCheckIn, ...prev]);

      // Log activity
      logActivity({
        type: 'checkin',
        message: `${newCheckIn.memberName} checked in`,
        memberId: member.id,
        metadata: { checkInId: newCheckIn.id },
      });
    }
  };

  // Get weekly check-ins (Monday 2am to Sunday 11:59pm)
  const getWeeklyCheckIns = (): number => {
    const now = new Date();
    
    // Calculate Monday 2am of current week
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay; // If Sunday, go back 6 days
    const monday = new Date(now);
    monday.setDate(now.getDate() + daysToMonday);
    monday.setHours(2, 0, 0, 0);
    
    // If it's Monday before 2am, go back to previous Monday
    if (currentDay === 1 && now.getHours() < 2) {
      monday.setDate(monday.getDate() - 7);
    }
    
    // Count check-ins since Monday 2am
    return checkIns.filter(checkIn => {
      const checkInDate = new Date(checkIn.checkInTime);
      return checkInDate >= monday;
    }).length;
  };

  // Get today's check-ins
  const getTodayCheckIns = (): CheckIn[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return checkIns.filter(checkIn => {
      const checkInDate = new Date(checkIn.checkInTime);
      return checkInDate >= today && checkInDate < tomorrow;
    });
  };

  // Get member visits this month
  const getMemberVisitsThisMonth = (memberId: string): number => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    return checkIns.filter(checkIn => {
      const checkInDate = new Date(checkIn.checkInTime);
      return checkIn.memberId === memberId && checkInDate >= firstDayOfMonth;
    }).length;
  };

  // Get member total visits
  const getMemberTotalVisits = (memberId: string): number => {
    return checkIns.filter(checkIn => checkIn.memberId === memberId).length;
  };

  // Activity helpers
  const logActivity = (entry: Omit<Activity, 'id' | 'timestamp'> & { timestamp?: string }) => {
    const activity: Activity = {
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      type: entry.type,
      message: entry.message,
      memberId: entry.memberId,
      metadata: entry.metadata,
    };
    setActivities((prev) => [activity, ...prev].slice(0, 200)); // keep last 200
  };

  const getUpcomingBirthdays = (): Member[] => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    return members.filter((m) => {
      if (!m.dateOfBirth) return false;
      const dob = new Date(m.dateOfBirth);
      const thisYear = today.getFullYear();
      const birthdayThisYear = new Date(thisYear, dob.getMonth(), dob.getDate());
      return birthdayThisYear >= today && birthdayThisYear <= nextWeek;
    });
  };

  const value: DataContextType = {
    members,
    membersLoading,
    membersSaving,
    membersError,
    stats,
    checkIns,
    activities,
    membershipTypes,
    roles,
    classes,
    refreshMembers,
    addMember,
    updateMember,
    deleteMember,
    checkInMember,
    refreshStats,
    getWeeklyCheckIns,
    getTodayCheckIns,
    getMemberVisitsThisMonth,
    getMemberTotalVisits,
    logActivity,
    getUpcomingBirthdays,
    setActiveClassesCount,
    setPlansCount,
    updateMembershipTypes,
    getClasses,
    getUpcomingClasses,
    addClass,
    updateClass,
    deleteClass,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
