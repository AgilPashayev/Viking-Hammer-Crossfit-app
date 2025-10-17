import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  role: 'member' | 'instructor' | 'admin';
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
  role?: 'member' | 'instructor' | 'admin';
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

// Activity feed types
export type ActivityType =
  | 'checkin'
  | 'member_added'
  | 'member_updated'
  | 'membership_changed'
  | 'announcement_created'
  | 'announcement_published'
  | 'announcement_deleted'
  | 'birthday_upcoming';

export interface Activity {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: string; // ISO string
  memberId?: string;
  metadata?: Record<string, any>;
}

interface DataContextType {
  members: Member[];
  stats: Stats;
  checkIns: CheckIn[];
  activities: Activity[];
  membershipTypes: string[];
  roles: Array<{ value: 'member' | 'instructor' | 'admin'; label: string }>;
  addMember: (member: Omit<Member, 'id'>) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
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
  const [membershipTypes, setMembershipTypes] = useState<string[]>([
    'Single',
    'Monthly',
    'Monthly Unlimited',
    'Company',
  ]);

  const roles: Array<{ value: 'member' | 'instructor' | 'admin'; label: string }> = [
    { value: 'member', label: '🛡️ Viking (Member)' },
    { value: 'instructor', label: '⚔️ Warrior (Instructor)' },
    { value: 'admin', label: '👑 Commander (Admin)' },
  ];

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

  const setActiveClassesCount = (count: number) => {
    setStats((prev) => ({ ...prev, activeClasses: count }));
  };

  const setPlansCount = (count: number) => {
    setStats((prev) => ({ ...prev, plansCount: count }));
  };

  const updateMembershipTypes = (types: string[]) => {
    // Update membership types when plans are created/updated in MembershipManager
    setMembershipTypes(types);
  };

  const addMember = (memberData: Omit<Member, 'id'>) => {
    const newMember: Member = {
      ...memberData,
      id: Date.now().toString(),
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active',
    };
    setMembers((prev) => [...prev, newMember]);

    // Log activity
    logActivity({
      type: 'member_added',
      message: `New member ${newMember.firstName} ${newMember.lastName} registered`,
      memberId: newMember.id,
    });
  };

  const updateMember = (id: string, updates: Partial<Member>) => {
    const before = members.find((m) => m.id === id);
    setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, ...updates } : member)));

    // Log generic update
    const memberName = before ? `${before.firstName} ${before.lastName}` : `Member ${id}`;
    logActivity({ type: 'member_updated', message: `${memberName} profile updated`, memberId: id });

    // Special case: membership type changed
    if (before && updates.membershipType && updates.membershipType !== before.membershipType) {
      logActivity({
        type: 'membership_changed',
        message: `${memberName} membership changed to ${updates.membershipType}`,
        memberId: id,
        metadata: { from: before.membershipType, to: updates.membershipType },
      });
    }
  };

  const deleteMember = (id: string) => {
    setMembers((prev) => prev.filter((member) => member.id !== id));
  };

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
    stats,
    checkIns,
    activities,
    membershipTypes,
    roles,
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
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
