import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "./AuthContext";

interface LecturerProfileData {
  name: string;
  full_name: string;
  email: string;
  employee_id_number: string | null;
  position: string;
  profile_image: string | null;
}

interface ClassScheduleItem {
  id_class: number;
  code_class: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  subject: {
    name_subject: string;
  };
}

interface LecturerClass {
  id_class: number;
  code_class: string;
  subject: {
    name_subject: string;
    sks: number;
  };
  student_count?: number;
}

interface NotificationItem {
  id_notification: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  sent_at: string;
}

interface LecturerDataContextType {
  // Data
  lecturerProfile: LecturerProfileData | null;
  todaySchedules: ClassScheduleItem[];
  classes: LecturerClass[];
  recentNotifications: NotificationItem[];
  unreadCount: number;

  // Loading states
  isLoadingProfile: boolean;
  isLoadingDashboard: boolean;

  // Methods
  refreshAllData: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  updateNotification: (id: number, updates: Partial<NotificationItem>) => void;
  removeNotification: (id: number) => void;
}

const LecturerDataContext = createContext<LecturerDataContextType | undefined>(undefined);

export const LecturerDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoggedIn } = useAuth();

  // Data states
  const [lecturerProfile, setLecturerProfile] = useState<LecturerProfileData | null>(null);
  const [todaySchedules, setTodaySchedules] = useState<ClassScheduleItem[]>([]);
  const [classes, setClasses] = useState<LecturerClass[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Loading states
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!isLoggedIn) return;
    setIsLoadingProfile(true);
    try {
      const response = await api.get("/lecturer/profile");
      if (response.data.status === "success") {
        setLecturerProfile(response.data.data);
      }
    } catch (error) {
      console.error("[LecturerData] Error fetching profile:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [isLoggedIn]);

  const refreshDashboard = useCallback(async () => {
    if (!isLoggedIn) return;
    setIsLoadingDashboard(true);
    try {
      // Fetch schedules, notifications, and classes in parallel
      const [schedulesRes, notificationsRes, classesRes] = await Promise.all([api.get("/lecturer/schedules"), api.get("/notifications", { params: { limit: 3 } }), api.get("/lecturer/classes")]);

      // Filter today's schedules
      const today = new Date().getDay();
      const apiDayOfWeek = today === 0 ? 7 : today;
      const todaySchedule = (schedulesRes.data.data || []).filter((schedule: ClassScheduleItem) => schedule.day_of_week === apiDayOfWeek);
      setTodaySchedules(todaySchedule.slice(0, 2)); // Limit to 2

      // Get recent notifications
      if (notificationsRes.data.status === "success") {
        setRecentNotifications(notificationsRes.data.data.notifications.slice(0, 2));
        setUnreadCount(notificationsRes.data.data.unread_count);
      }

      // Get classes
      setClasses((classesRes.data.data || []).slice(0, 2)); // Limit to 2
    } catch (error) {
      console.error("[LecturerData] Error fetching dashboard:", error);
    } finally {
      setIsLoadingDashboard(false);
    }
  }, [isLoggedIn]);

  const refreshAllData = useCallback(async () => {
    if (!isLoggedIn) return;
    await Promise.all([refreshProfile(), refreshDashboard()]);
  }, [isLoggedIn, refreshProfile, refreshDashboard]);

  const updateNotification = useCallback((id: number, updates: Partial<NotificationItem>) => {
    setRecentNotifications((prev) => prev.map((n) => (n.id_notification === id ? { ...n, ...updates } : n)));
    if (updates.is_read === true) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  }, []);

  const removeNotification = useCallback((id: number) => {
    setRecentNotifications((prev) => {
      const deletedNotif = prev.find((n) => n.id_notification === id);
      if (deletedNotif && !deletedNotif.is_read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.filter((n) => n.id_notification !== id);
    });
  }, []);

  // Auto-fetch all data when user logs in
  useEffect(() => {
    if (isLoggedIn && user) {
      console.log("[LecturerData] User authenticated, fetching all data...");
      refreshAllData();
    } else {
      // Clear data on logout
      setLecturerProfile(null);
      setTodaySchedules([]);
      setClasses([]);
      setRecentNotifications([]);
      setUnreadCount(0);
    }
  }, [isLoggedIn, user, refreshAllData]);

  return (
    <LecturerDataContext.Provider
      value={{
        lecturerProfile,
        todaySchedules,
        classes,
        recentNotifications,
        unreadCount,
        isLoadingProfile,
        isLoadingDashboard,
        refreshAllData,
        refreshProfile,
        refreshDashboard,
        updateNotification,
        removeNotification,
      }}
    >
      {children}
    </LecturerDataContext.Provider>
  );
};

export const useLecturerData = () => {
  const context = useContext(LecturerDataContext);
  if (context === undefined) {
    throw new Error("useLecturerData must be used within a LecturerDataProvider");
  }
  return context;
};
