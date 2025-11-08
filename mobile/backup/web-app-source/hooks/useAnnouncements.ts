import { useState, useEffect } from 'react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'info' | 'warning' | 'success';
  readBy?: string[];
}

interface UseAnnouncementsOptions {
  userId: string | undefined;
  role: 'member' | 'instructor' | 'staff';
  enabled?: boolean;
}

export const useAnnouncements = ({ userId, role, enabled = true }: UseAnnouncementsOptions) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState<Announcement[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  // Get localStorage key for dismissed announcements
  const getStorageKey = () => `viking_dismissed_announcements_${userId || 'guest'}`;

  // Get dismissed announcement IDs from localStorage
  const getDismissedIds = (): string[] => {
    try {
      const stored = localStorage.getItem(getStorageKey());
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Add announcement ID to dismissed list in localStorage
  const addDismissedId = (announcementId: string) => {
    try {
      const dismissed = getDismissedIds();
      if (!dismissed.includes(announcementId)) {
        dismissed.push(announcementId);
        localStorage.setItem(getStorageKey(), JSON.stringify(dismissed));
        console.log(`💾 [${role.toUpperCase()}] Saved #${announcementId} to dismissed cache`);
      }
    } catch (error) {
      console.error('❌ Failed to save to localStorage:', error);
    }
  };

  // Determine API endpoint based on role
  const getEndpoint = () => {
    switch (role) {
      case 'member':
        return 'http://localhost:4001/api/announcements/member';
      case 'instructor':
        return 'http://localhost:4001/api/announcements/instructor';
      case 'staff':
        return 'http://localhost:4001/api/announcements/staff';
      default:
        return 'http://localhost:4001/api/announcements/member';
    }
  };

  // Load announcements from API
  const loadAnnouncements = async () => {
    if (!enabled || !userId) return;

    try {
      setIsLoading(true);
      const response = await fetch(getEndpoint());
      const result = await response.json();

      if (result.success && result.data) {
        console.log(`📢 [${role.toUpperCase()}] Loaded announcements:`, result.data.length);

        // Transform API data
        const transformed: Announcement[] = result.data.map((ann: any) => ({
          id: String(ann.id),
          title: ann.title,
          message: ann.content,
          date: ann.published_at || ann.created_at,
          type:
            ann.priority === 'urgent' ? 'warning' : ann.priority === 'high' ? 'success' : 'info',
          readBy: ann.read_by_users || [],
        }));

        setAnnouncements(transformed);

        // Filter unread for current user
        console.log(`👤 [${role.toUpperCase()}] Current user ID:`, userId);

        // Get dismissed IDs from localStorage (backup check)
        const dismissedIds = getDismissedIds();
        console.log(`💾 [${role.toUpperCase()}] Dismissed cache:`, dismissedIds);

        const unread = transformed.filter((ann) => {
          const isRead = ann.readBy && ann.readBy.includes(userId);
          const isDismissed = dismissedIds.includes(ann.id);
          const shouldShow = !isRead && !isDismissed;

          console.log(
            `  Announcement #${ann.id} "${ann.title}": ${isRead ? 'READ(DB) ✓' : 'UNREAD(DB) ⚠'} ${
              isDismissed ? '+ DISMISSED(CACHE) ✓' : ''
            } → ${shouldShow ? 'SHOW' : 'HIDE'}`,
          );

          return shouldShow;
        });

        console.log(
          `📊 [${role.toUpperCase()}] Total: ${transformed.length}, Unread: ${unread.length}`,
        );

        if (unread.length > 0) {
          console.log(`🔔 [${role.toUpperCase()}] Showing popup with ${unread.length} unread`);
          setUnreadAnnouncements(unread);
          setShowPopup(true);
        } else {
          console.log(`✅ [${role.toUpperCase()}] All announcements read - no popup`);
          setShowPopup(false);
        }
      }
    } catch (error) {
      console.error(`❌ [${role.toUpperCase()}] Failed to load announcements:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark announcement as read
  const markAnnouncementAsRead = async (announcementId: string): Promise<boolean> => {
    if (!userId) {
      console.error('❌ Cannot mark as read: No user ID');
      return false;
    }

    console.log(
      `📝 [${role.toUpperCase()}] Marking announcement #${announcementId} as read for user ${userId}`,
    );

    try {
      const response = await fetch(
        `http://localhost:4001/api/announcements/${announcementId}/mark-read`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API error:', errorData);
        throw new Error(errorData.error || 'Failed to mark as read');
      }

      const result = await response.json();
      console.log(
        `✅ [${role.toUpperCase()}] Announcement #${announcementId} marked as read:`,
        result,
      );

      return true;
    } catch (error) {
      console.error(`❌ [${role.toUpperCase()}] Failed to mark #${announcementId}:`, error);
      return false;
    }
  };

  // Handle closing popup (mark all as read)
  const handleClosePopup = async () => {
    console.log(
      `🚪 [${role.toUpperCase()}] Closing popup, marking ${
        unreadAnnouncements.length
      } announcements`,
    );

    setIsMarking(true);

    // Mark all unread as read in backend
    const markPromises = unreadAnnouncements.map((ann) => markAnnouncementAsRead(ann.id));
    await Promise.all(markPromises);

    console.log(`✅ [${role.toUpperCase()}] All announcements marked as read in database`);

    // Save to localStorage cache as backup
    unreadAnnouncements.forEach((ann) => addDismissedId(ann.id));
    console.log(
      `💾 [${role.toUpperCase()}] Saved ${unreadAnnouncements.length} IDs to dismissed cache`,
    );

    // Update local state
    if (userId) {
      const updated = announcements.map((ann) => {
        if (unreadAnnouncements.some((unread) => unread.id === ann.id)) {
          return {
            ...ann,
            readBy: [...(ann.readBy || []), userId],
          };
        }
        return ann;
      });
      setAnnouncements(updated);
      console.log(`🔄 [${role.toUpperCase()}] Local state updated`);
    }

    // Close popup
    setShowPopup(false);
    setUnreadAnnouncements([]);
    setIsMarking(false);

    // Force reload from database to verify
    console.log(`🔄 [${role.toUpperCase()}] Force reloading from database to verify...`);
    setTimeout(() => {
      loadAnnouncements();
    }, 500);
  };

  // Dismiss/hide announcement for current user
  const dismissAnnouncement = async (announcementId: string): Promise<boolean> => {
    if (!userId) {
      console.error('❌ Cannot dismiss: No user ID');
      return false;
    }

    console.log(
      `🗑️ [${role.toUpperCase()}] Dismissing announcement #${announcementId} for user ${userId}`,
    );

    try {
      // First mark as read in backend
      const marked = await markAnnouncementAsRead(announcementId);

      if (!marked) {
        throw new Error('Failed to mark as read');
      }

      // Save to localStorage cache
      addDismissedId(announcementId);

      // Remove from local announcements list (UI update)
      setAnnouncements((prev) => prev.filter((ann) => ann.id !== announcementId));
      setUnreadAnnouncements((prev) => prev.filter((ann) => ann.id !== announcementId));

      console.log(
        `✅ [${role.toUpperCase()}] Announcement #${announcementId} dismissed successfully`,
      );
      return true;
    } catch (error) {
      console.error(`❌ [${role.toUpperCase()}] Failed to dismiss #${announcementId}:`, error);
      return false;
    }
  };

  // Load on mount and set up refresh interval
  useEffect(() => {
    if (userId && enabled) {
      loadAnnouncements();

      // Refresh every 5 minutes
      const interval = setInterval(loadAnnouncements, 300000);
      return () => clearInterval(interval);
    }
  }, [userId, enabled, role]);

  return {
    announcements,
    unreadAnnouncements,
    showPopup,
    isLoading,
    isMarking,
    handleClosePopup,
    dismissAnnouncement,
    refreshAnnouncements: loadAnnouncements,
  };
};
