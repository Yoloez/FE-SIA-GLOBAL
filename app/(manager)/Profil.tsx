import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, Image, Modal, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from "react-native";
import api from "../../api/axios";
import CustomAlert from "../../components/CustomAlert";
import { ThemedText } from "../../components/ThemedText";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

interface StaffData {
  full_name: string;
  employee_id_number: string | null;
  position: string | null;
}

interface ProfileData {
  id_user_si: number;
  name: string;
  username: string;
  email: string;
  profile_image: string | null;
  role: string;
  is_active: boolean;
  staff_data: StaffData;
}

const ProfilManager = () => {
  const { logout } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      message: "Apakah Anda yakin ingin keluar?",
      buttons: [
        { text: "Batal", onPress: () => {}, style: "cancel" },
        { text: "Keluar", onPress: () => handleLogout(), style: "destructive" },
      ],
    });
  };

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/profile/staff");
      setProfileData(response.data.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Gagal memuat profil:", error.response?.data);
        setAlertConfig({
          visible: true,
          title: "Error",
          message: "Gagal memuat data profil.",
          buttons: [{ text: "OK", onPress: () => {} }],
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const handleLogout = useCallback(() => {
    Animated.sequence([Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }), Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })]).start(() => {
      logout();
    });
  }, [logout, scaleAnim]);

  if (isLoading || !profileData) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#015023", "#1C352D"]} style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <ThemedText style={styles.loadingText}>Memuat profil...</ThemedText>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#015023" />
      <LinearGradient colors={["#015023", "#1C352D"]} style={styles.gradientContainer}>
        {/* Fixed Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <ThemedText variant="semibold" style={styles.headerTitle}>
            Profile Manager
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {/* Scrollable Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            {/* Avatar */}
            <TouchableOpacity style={styles.avatarContainer} onPress={() => setShowImageModal(true)} activeOpacity={0.8}>
              <Image source={profileData.profile_image ? { uri: profileData.profile_image } : require("../../assets/images/unnamed.jpg")} style={styles.avatar} />
              <View style={styles.avatarOverlay}>
                <Ionicons name="expand-outline" size={16} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* Status Badge */}
            {!profileData.is_active && (
              <View style={styles.statusBadge}>
                <ThemedText variant="semibold" style={styles.statusBadgeText}>
                  Inactive Account
                </ThemedText>
              </View>
            )}

            {/* Profile Data */}
            <View style={styles.infoContainer}>
              <ThemedText style={styles.label}>Full Name:</ThemedText>
              <View style={styles.infoBox}>
                <ThemedText style={styles.infoText}>{profileData.staff_data.full_name}</ThemedText>
              </View>
            </View>

            <View style={styles.infoContainer}>
              <ThemedText style={styles.label}>Username:</ThemedText>
              <View style={styles.infoBox}>
                <ThemedText style={styles.infoText}>{profileData.username}</ThemedText>
              </View>
            </View>

            <View style={styles.infoContainer}>
              <ThemedText style={styles.label}>Email:</ThemedText>
              <View style={styles.infoBox}>
                <ThemedText style={styles.infoText}>{profileData.email}</ThemedText>
              </View>
            </View>

            <View style={styles.infoContainer}>
              <ThemedText style={styles.label}>Employee ID (NIP):</ThemedText>
              <View style={styles.infoBox}>
                <ThemedText style={styles.infoText}>{profileData.staff_data.employee_id_number || "Belum diatur"}</ThemedText>
              </View>
            </View>

            <View style={styles.infoContainer}>
              <ThemedText style={styles.label}>Position:</ThemedText>
              <View style={styles.infoBox}>
                <ThemedText style={styles.infoText}>{profileData.staff_data.position || "Belum diatur"}</ThemedText>
              </View>
            </View>

            <View style={styles.infoContainer}>
              <ThemedText style={styles.label}>Role:</ThemedText>
              <View style={styles.infoBox}>
                <View style={styles.roleContainer}>
                  <View style={styles.roleBadge}>
                    <ThemedText variant="semibold" style={styles.roleBadgeText}>
                      {profileData.role.toUpperCase()}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>

            {/* Buttons */}
            <TouchableOpacity
              style={styles.settingButton}
              onPress={() =>
                router.push({
                  pathname: "/(manager)/EditProfil",
                  params: {
                    id_user_si: profileData.id_user_si,
                    name: profileData.staff_data.full_name,
                    email: profileData.email,
                    username: profileData.username,
                  },
                })
              }
            >
              <Ionicons name="settings-outline" size={20} color="#015023" style={{ marginRight: 8 }} />
              <ThemedText variant="semibold" style={styles.settingButtonText}>
                Edit Profile
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.9} onPress={handleLogoutConfirm} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <ThemedText variant="semibold" style={styles.logoutButtonText}>
                Logout
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>

      <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} buttons={alertConfig.buttons} />

      {/* Image Modal */}
      <Modal visible={showImageModal} transparent animationType="fade" onRequestClose={() => setShowImageModal(false)}>
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity style={styles.imageModalClose} onPress={() => setShowImageModal(false)} activeOpacity={1}>
            <View style={styles.imageModalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowImageModal(false)}>
                <Ionicons name="close-circle" size={36} color="#fff" />
              </TouchableOpacity>
              <Image source={profileData?.profile_image ? { uri: profileData.profile_image } : require("../../assets/images/unnamed.jpg")} style={styles.fullImage} resizeMode="contain" />
              <ThemedText variant="semibold" style={styles.imageModalName}>
                {profileData?.staff_data.full_name}
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#015023",
  },
  gradientContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 20,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  profileCard: {
    padding: 30,
    paddingTop: 20,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 25,
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "white",
    borderWidth: 3,
    borderColor: "#DABC4E",
  },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    right: "32%",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    padding: 4,
  },
  statusBadge: {
    backgroundColor: "#EF4444",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: "center",
    marginBottom: 20,
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: 12,
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
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  roleBadge: {
    backgroundColor: "#DABC4E",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roleBadgeText: {
    color: "#015023",
    fontSize: 12,
  },
  settingButton: {
    flexDirection: "row",
    backgroundColor: "#DABC4E",
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  settingButtonText: {
    color: "#015023",
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: "row",
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  logoutButtonText: {
    color: "#ffffff",
    fontSize: 16,
  },
  loadingText: {
    color: "#fff",
    fontSize: 14,
    marginTop: 12,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
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
    width: width * 0.9,
    alignItems: "center",
  },
  closeButton: {
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  fullImage: {
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  imageModalName: {
    color: "#fff",
    fontSize: 18,
    marginTop: 20,
    textAlign: "center",
  },
});

export default ProfilManager;
