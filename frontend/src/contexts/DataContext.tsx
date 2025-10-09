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
}

interface DataContextType {
  members: Member[];
  stats: Stats;
  addMember: (member: Omit<Member, 'id'>) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  checkInMember: (id: string) => void;
  refreshStats: () => void;
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
  });

  // Calculate real-time stats whenever members change
  useEffect(() => {
    refreshStats();
  }, [members]);

  const refreshStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const totalMembers = members.length;
    const checkedInToday = members.filter((m) => m.lastCheckIn === today).length;
    const instructors = members.filter((m) => m.role === 'instructor').length;
    const activeMembers = members.filter((m) => m.status === 'active').length;
    const pendingMembers = members.filter((m) => m.status === 'pending').length;
    const inactiveMembers = members.filter((m) => m.status === 'inactive').length;

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

    // Mock data for other stats that would come from other systems
    const activeClasses = 12; // This would come from class management system
    const expiringMemberships = Math.floor(totalMembers * 0.1); // 10% of members with expiring memberships

    setStats({
      totalMembers,
      checkedInToday,
      instructors,
      activeClasses,
      expiringMemberships,
      upcomingBirthdays,
      activeMembers,
      pendingMembers,
      inactiveMembers,
    });
  };

  const addMember = (memberData: Omit<Member, 'id'>) => {
    const newMember: Member = {
      ...memberData,
      id: Date.now().toString(),
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active',
    };
    setMembers((prev) => [...prev, newMember]);
  };

  const updateMember = (id: string, updates: Partial<Member>) => {
    setMembers((prev) =>
      prev.map((member) => (member.id === id ? { ...member, ...updates } : member)),
    );
  };

  const deleteMember = (id: string) => {
    setMembers((prev) => prev.filter((member) => member.id !== id));
  };

  const checkInMember = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    updateMember(id, { lastCheckIn: today });
  };

  const value: DataContextType = {
    members,
    stats,
    addMember,
    updateMember,
    deleteMember,
    checkInMember,
    refreshStats,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
