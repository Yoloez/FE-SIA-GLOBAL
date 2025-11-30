import api from "@/api/axios";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CustomAlert from "../../components/CustomAlert";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

interface LecturerProfileData {
  name: string;
  full_name: string;
  email: string;
  employee_id_number: string | null;
  position: string;
  profile_image: string | null;
}

const ProfilDosen = () => {
  const { logout, user } = useAuth();

  const [profileData, setProfileData] = useState<LecturerProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    buttons: [] as { text: string; onPress: () => void; style?: "cancel" | "destructive" }[],
  });

  const handleLogoutConfirm = () => {
    setAlertConfig({
      visible: true,
      title: "Konfirmasi Logout",
      message: "Apakah kamu yakin ingin keluar?",
      buttons: [
        { text: "Batal", onPress: () => {}, style: "cancel" },
        { text: "Keluar", onPress: () => handleLogout(), style: "destructive" },
      ],
    });
  };

  // --- Fungsi untuk mengambil data profil dari API ---
  const fetchProfile = useCallback(async () => {
    // Jangan fetch jika sedang logout
    if (isLoggingOut) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get("/lecturer/profile");

      if (response.data.status === "success" && response.data.data) {
        setProfileData(response.data.data);
      } else {
        throw new Error(response.data.message || "Gagal memuat profil");
      }
    } catch (error) {
      // Jangan tampilkan error jika sedang logout
      if (isLoggingOut) return;

      let errorMessage = "Gagal memuat data profil";

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message;

        if (status === 403) {
          errorMessage = message || "Akses ditolak. Anda bukan dosen.";
          setAlertConfig({
            visible: true,
            title: "Akses Ditolak",
            message: errorMessage,
            buttons: [{ text: "OK", onPress: () => logout() }],
          });
        } else if (status === 404) {
          errorMessage = message || "Data profil tidak ditemukan";
        } else {
          errorMessage = message || errorMessage;
        }

        console.error("Gagal memuat profil:", error.response?.data);
      }

      setError(errorMessage);
      setAlertConfig({
        visible: true,
        title: "Error",
        message: errorMessage,
        buttons: [{ text: "OK", onPress: () => {} }],
      });
    } finally {
      setIsLoading(false);
    }
  }, [logout, isLoggingOut]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const handleLogout = useCallback(() => {
    // Set flag bahwa sedang logout
    setIsLoggingOut(true);

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Panggil logout tanpa menunggu response API
      logout();
    });
  }, [logout, scaleAnim]);

  const handleRetry = useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#015023", "#1C352D"]} style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Memuat profil...</Text>
        </LinearGradient>
      </View>
    );
  }

  // Error state
  if (error || !profileData) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#015023", "#1C352D"]} style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error || "Data tidak tersedia"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Coba Lagi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutConfirm}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  // Success state
  return (
    <View style={styles.container}>
      <LinearGradient colors={["#015023", "#1C352D"]} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" backgroundColor="#015023" />
        <View style={styles.content}>
          <View style={styles.profileCard}>
            <Text style={styles.profileTitle}>Profile</Text>

            <View style={styles.avatarContainer}>
              <Image source={profileData.profile_image ? { uri: profileData.profile_image } : require("../../assets/images/kairi.png")} style={styles.avatar} defaultSource={require("../../assets/images/kairi.png")} />
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.label}>Name:</Text>
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>{profileData.full_name}</Text>
              </View>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.label}>Email:</Text>
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>{profileData.email}</Text>
              </View>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.label}>NIP:</Text>
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>{profileData.employee_id_number || "Belum diisi"}</Text>
              </View>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.label}>Position:</Text>
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>{profileData.position}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.settingButton} onPress={() => router.push("/EditProfilDosen")}>
              <Text style={styles.settingButtonText}>Setting</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.9} onPress={handleLogoutConfirm} style={styles.logoutButton}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
        <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} buttons={alertConfig.buttons} />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: "#DABC4E",
    borderRadius: 25,
    padding: 15,
    paddingHorizontal: 40,
    marginBottom: 12,
  },
  retryButtonText: {
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  profileCard: {
    borderRadius: 0,
    padding: 30,
    paddingTop: 35,
    paddingBottom: 40,
    flex: 1,
  },
  profileTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 25,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
  },
  infoContainer: {
    marginBottom: 15,
  },
  label: {
    color: "#ffffff",
    fontSize: 14,
    marginBottom: 5,
    marginLeft: 5,
  },
  infoBox: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  infoText: {
    color: "#ffffff",
    fontSize: 14,
  },
  settingButton: {
    backgroundColor: "#DABC4E",
    borderRadius: 25,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  LogoutButton: {
    backgroundColor: "#D4AF37",
    borderRadius: 25,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
  },
  settingButtonText: {
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#D4AF37",
    borderRadius: 25,
    padding: 15,
    marginTop: 15,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 20,
    paddingBottom: 10,
  },
  navButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  navIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e8d5b7",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 24,
  },
  navButtonActive: {
    transform: [{ scale: 1.1 }],
  },
});

export default ProfilDosen;
