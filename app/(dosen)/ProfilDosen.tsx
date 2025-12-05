import api from "@/api/axios";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, Image, Modal, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  const { logout, forceLogout, user } = useAuth();

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
  const [showImageModal, setShowImageModal] = useState(false);

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

        // Auto logout jika Unauthenticated
        if (status === 401 || message === "Unauthenticated.") {
          console.log("[PROFILE] Token invalid/expired, auto logout...");
          await forceLogout();
          return; // Stop execution
        }

        if (status === 403) {
          errorMessage = message || "Akses ditolak. Anda bukan dosen.";
          setAlertConfig({
            visible: true,
            title: "Akses Ditolak",
            message: errorMessage,
            buttons: [{ text: "OK", onPress: () => forceLogout() }],
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
      // Panggil forceLogout untuk memastikan benar-benar logout
      forceLogout();
    });
  }, [forceLogout, scaleAnim]);

  const handleRetry = useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#015023", "#1C352D"]} style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <ThemedText style={styles.loadingText}>Memuat profil...</ThemedText>
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
          <Text style={styles.errorSubtext}>Token mungkin sudah tidak valid</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Coba Lagi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.forceLogoutButton} onPress={() => forceLogout()}>
            <Text style={styles.forceLogoutButtonText}>🔴 FORCE LOGOUT</Text>
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

            <TouchableOpacity style={styles.avatarContainer} onPress={() => setShowImageModal(true)} activeOpacity={0.8}>
              <Image source={profileData.profile_image ? { uri: profileData.profile_image } : require("../../assets/images/unnamed.jpg")} style={styles.avatar} defaultSource={require("../../assets/images/unnamed.jpg")} />
              <View style={styles.avatarOverlay}>
                <Ionicons name="expand-outline" size={24} color="#fff" />
              </View>
            </TouchableOpacity>

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

        {/* Image Modal */}
        <Modal visible={showImageModal} transparent animationType="fade" onRequestClose={() => setShowImageModal(false)}>
          <View style={styles.imageModalOverlay}>
            <TouchableOpacity style={styles.imageModalClose} onPress={() => setShowImageModal(false)} activeOpacity={1}>
              <View style={styles.imageModalContent}>
                <TouchableOpacity style={styles.closeButton} onPress={() => setShowImageModal(false)}>
                  <Ionicons name="close-circle" size={36} color="#fff" />
                </TouchableOpacity>
                <Image source={profileData?.profile_image ? { uri: profileData.profile_image } : require("../../assets/images/kairi.png")} style={styles.fullImage} resizeMode="contain" />
                <Text style={styles.imageModalName}>{profileData?.full_name}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Modal>
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
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  errorSubtext: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
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
  forceLogoutButton: {
    backgroundColor: "#DC2626",
    borderRadius: 25,
    padding: 15,
    paddingHorizontal: 40,
    marginTop: 8,
  },
  forceLogoutButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
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
    position: "relative",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
  },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    right: "35%",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    padding: 4,
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
    backgroundColor: "#e8d5b7",
    borderRadius: 25,
    padding: 15,
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
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalClose: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalContent: {
    width: "90%",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: -50,
    right: 0,
    zIndex: 10,
  },
  fullImage: {
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: 20,
    backgroundColor: "white",
  },
  imageModalName: {
    color: "#fff",
    fontSize: 18,
    marginTop: 20,
    textAlign: "center",
    fontWeight: "600",
  },
});

export default ProfilDosen;
