import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "./AuthContext";

interface StudentIdentity {
  name: string;
  username: string;
  profile_image: string | null;
  full_name: string;
  email: string;
  program_name: string | null;
  generation: string | null;
  gender: string | null;
  registration_number: string | null;
}

interface GradeItem {
  id_class: number;
  code_class: string;
  subject_name: string;
  code_subject: string;
  sks: number;
  academic_period: string;
  grade_details: {
    score: number;
    letter: string;
    ip: number;
  } | null;
}

interface AcademicStats {
  totalSks: number;
  ipk: string;
  currentIps: string;
  currentPeriod: string;
}

interface ClassScheduleItem {
  id_class: number;
  code_class: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  member_class: number;
  total_meetings: number;
  subject: {
    id_subject: number;
    name_subject: string;
  };
  academic_period?: {
    id: number;
    name: string;
  };
  lecturer_name?: string;
}

interface AttendanceClass {
  id_class: number;
  kelas: string;
  nama_matkul: string;
  dosen: string;
  attendance_stats: {
    total_pertemuan: number;
    sudah_presensi: number;
    persentase_kehadiran: number;
  };
}

interface NotificationItem {
  id_notification: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  sent_at: string;
  sender: string;
  read_at: string | null;
  metadata: any;
}

interface StudentDataContextType {
  // Data
  studentIdentity: StudentIdentity | null;
  grades: GradeItem[];
  academicStats: AcademicStats;
  schedules: ClassScheduleItem[];
  attendanceClasses: AttendanceClass[];
  notifications: NotificationItem[];
  unreadCount: number;

  // Loading states
  isLoadingProfile: boolean;
  isLoadingGrades: boolean;
  isLoadingSchedules: boolean;
  isLoadingAttendance: boolean;
  isLoadingNotifications: boolean;

  // Methods
  refreshAllData: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshGrades: () => Promise<void>;
  refreshSchedules: () => Promise<void>;
  refreshAttendance: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  updateNotification: (id: number, updates: Partial<NotificationItem>) => void;
  removeNotification: (id: number) => void;
}

const StudentDataContext = createContext<StudentDataContextType | undefined>(undefined);

export const StudentDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoggedIn } = useAuth();

  // Data states
  const [studentIdentity, setStudentIdentity] = useState<StudentIdentity | null>(null);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [academicStats, setAcademicStats] = useState<AcademicStats>({
    totalSks: 0,
    ipk: "0.00",
    currentIps: "0.00",
    currentPeriod: "-",
  });
  const [schedules, setSchedules] = useState<ClassScheduleItem[]>([]);
  const [attendanceClasses, setAttendanceClasses] = useState<AttendanceClass[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Loading states
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!isLoggedIn) return;
    setIsLoadingProfile(true);
    try {
      const response = await api.get("/student/profile/identity");
      setStudentIdentity(response.data.data);
    } catch (error) {
      console.error("[StudentData] Error fetching profile:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [isLoggedIn]);

  const refreshGrades = useCallback(async () => {
    if (!isLoggedIn) return;
    setIsLoadingGrades(true);
    try {
      const response = await api.get("/student/grades");
      const responseData = response.data.data;
      const gradesData = responseData.grade || {};

      let gradesArray: GradeItem[] = [];
      if (Array.isArray(gradesData)) {
        gradesArray = gradesData;
      } else if (typeof gradesData === "object" && gradesData !== null) {
        gradesArray = Object.values(gradesData);
      }

      setGrades(gradesArray);

      // Calculate IPK
      let totalSksAll = 0;
      let totalBobotAll = 0;
      gradesArray.forEach((item) => {
        if (item.grade_details?.ip && item.sks) {
          totalSksAll += item.sks;
          totalBobotAll += item.grade_details.ip * item.sks;
        }
      });
      const ipk = totalSksAll > 0 ? (totalBobotAll / totalSksAll).toFixed(2) : "0.00";

      // Calculate IPS (current period)
      const periods = [...new Set(gradesArray.map((item) => item.academic_period))].filter(Boolean).sort().reverse();
      const currentPeriod = periods[0] || "-";
      const currentPeriodGrades = gradesArray.filter((item) => item.academic_period === currentPeriod);
      let totalSksCurrent = 0;
      let totalBobotCurrent = 0;
      currentPeriodGrades.forEach((item) => {
        if (item.grade_details?.ip && item.sks) {
          totalSksCurrent += item.sks;
          totalBobotCurrent += item.grade_details.ip * item.sks;
        }
      });
      const currentIps = totalSksCurrent > 0 ? (totalBobotCurrent / totalSksCurrent).toFixed(2) : "0.00";

      setAcademicStats({
        totalSks: totalSksAll,
        ipk,
        currentIps,
        currentPeriod,
      });
    } catch (error) {
      console.error("[StudentData] Error fetching grades:", error);
    } finally {
      setIsLoadingGrades(false);
    }
  }, [isLoggedIn]);

  const refreshSchedules = useCallback(async () => {
    if (!isLoggedIn) return;
    setIsLoadingSchedules(true);
    try {
      const response = await api.get("/student/schedules");
      const schedulesData = response.data.data || [];
      setSchedules(schedulesData);
    } catch (error) {
      console.error("[StudentData] Error fetching schedules:", error);
    } finally {
      setIsLoadingSchedules(false);
    }
  }, [isLoggedIn]);

  const refreshAttendance = useCallback(async () => {
    if (!isLoggedIn) return;
    setIsLoadingAttendance(true);
    try {
      const response = await api.get("/student/attendance/classes");
      const classesData = response.data.data || [];

      // Fetch attendance stats for top 2 classes only
      const limitedClasses = classesData.slice(0, 2);
      const classesWithStats = await Promise.all(
        limitedClasses.map(async (classItem: any) => {
          try {
            const historyResponse = await api.get(`/student/attendance/classes/${classItem.id_class}/history`);
            const stats = historyResponse.data.data.statistics;
            return {
              ...classItem,
              attendance_stats: stats,
            };
          } catch (error) {
            console.error(`[StudentData] Error fetching stats for class ${classItem.id_class}:`, error);
            return {
              ...classItem,
              attendance_stats: {
                total_pertemuan: 0,
                sudah_presensi: 0,
                persentase_kehadiran: 0,
              },
            };
          }
        })
      );

      setAttendanceClasses(classesWithStats);
    } catch (error) {
      console.error("[StudentData] Error fetching attendance:", error);
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [isLoggedIn]);

  const refreshNotifications = useCallback(async () => {
    if (!isLoggedIn) return;
    setIsLoadingNotifications(true);
    try {
      const [notifResponse, countResponse] = await Promise.all([api.get("/notifications", { params: { limit: 5 } }), api.get("/notifications/unread-count")]);

      if (notifResponse.data.status === "success") {
        const notifData = notifResponse.data.data.notifications || [];
        setNotifications(notifData);
      }

      if (countResponse.data.status === "success") {
        setUnreadCount(countResponse.data.data.unread_count);
      }
    } catch (error) {
      console.error("[StudentData] Error fetching notifications:", error);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [isLoggedIn]);

  const refreshAllData = useCallback(async () => {
    if (!isLoggedIn) return;
    await Promise.all([refreshProfile(), refreshGrades(), refreshSchedules(), refreshAttendance(), refreshNotifications()]);
  }, [isLoggedIn, refreshProfile, refreshGrades, refreshSchedules, refreshAttendance, refreshNotifications]);

  const updateNotification = useCallback((id: number, updates: Partial<NotificationItem>) => {
    setNotifications((prev) => prev.map((n) => (n.id_notification === id ? { ...n, ...updates } : n)));
    if (updates.is_read === true) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => {
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
      console.log("[StudentData] User authenticated, fetching all data...");
      refreshAllData();
    } else {
      // Clear data on logout
      setStudentIdentity(null);
      setGrades([]);
      setAcademicStats({
        totalSks: 0,
        ipk: "0.00",
        currentIps: "0.00",
        currentPeriod: "-",
      });
      setSchedules([]);
      setAttendanceClasses([]);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isLoggedIn, user, refreshAllData]);

  return (
    <StudentDataContext.Provider
      value={{
        studentIdentity,
        grades,
        academicStats,
        schedules,
        attendanceClasses,
        notifications,
        unreadCount,
        isLoadingProfile,
        isLoadingGrades,
        isLoadingSchedules,
        isLoadingAttendance,
        isLoadingNotifications,
        refreshAllData,
        refreshProfile,
        refreshGrades,
        refreshSchedules,
        refreshAttendance,
        refreshNotifications,
        updateNotification,
        removeNotification,
      }}
    >
      {children}
    </StudentDataContext.Provider>
  );
};

export const useStudentData = () => {
  const context = useContext(StudentDataContext);
  if (context === undefined) {
    throw new Error("useStudentData must be used within a StudentDataProvider");
  }
  return context;
};
