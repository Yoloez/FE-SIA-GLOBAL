import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, Image, Modal, StatusBar, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomAlert from "../../components/CustomAlert";
import { ThemedText } from "../../components/ThemedText";
import { useAuth } from "../../context/AuthContext";
import { useStudentData } from "../../context/StudentDataContext";

const { width } = Dimensions.get("window");

const Profil = () => {
  const { logout } = useAuth();
  const { studentIdentity, isLoadingProfile } = useStudentData();
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

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleLogout = useCallback(() => {
    Animated.sequence([Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }), Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })]).start(() => {
      logout();
    });
  }, [logout, scaleAnim]);

  // Tampilkan loading indicator saat data sedang diambil
  if (isLoadingProfile || !studentIdentity) {
    return (
      <View style={[styles.container]}>
        <LinearGradient colors={["#015023", "#1C352D"]} style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#fff" />
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#015023", "#1C352D"]} style={{ flex: 1 }}>
        <SafeAreaView style={styles.safeContainer} edges={["top", "left", "right"]}>
          <StatusBar barStyle="light-content" backgroundColor="#015023" />
          <View style={styles.content}>
            <View style={styles.profileCard}>
              <ThemedText variant="semibold" style={styles.profileTitle}>
                Profile
              </ThemedText>

              <TouchableOpacity style={styles.avatarContainer} onPress={() => setShowImageModal(true)} activeOpacity={0.8}>
                <Image source={studentIdentity.profile_image ? { uri: studentIdentity.profile_image } : require("@/assets/images/unnamed.jpg")} style={styles.avatar} />
                <View style={styles.avatarOverlay}>
                  <Ionicons name="expand-outline" size={18} color="#fff" />
                </View>
              </TouchableOpacity>

              {/* --- DATA SEKARANG DINAMIS --- */}
              <View style={styles.infoContainer}>
                <ThemedText style={styles.label}>Name:</ThemedText>
                <View style={styles.infoBox}>
                  <ThemedText style={styles.infoText}>{studentIdentity.full_name}</ThemedText>
                </View>
              </View>

              <View style={styles.infoContainer}>
                <ThemedText style={styles.label}>NIM:</ThemedText>
                <View style={styles.infoBox}>
                  <ThemedText style={styles.infoText}>{studentIdentity.registration_number || "Belum diisi"}</ThemedText>
                </View>
              </View>

              <View style={styles.infoContainer}>
                <ThemedText style={styles.label}>Major:</ThemedText>
                <View style={styles.infoBox}>
                  <ThemedText style={styles.infoText}>{studentIdentity.program_name || "Belum diisi"}</ThemedText>
                </View>
              </View>

              <View style={styles.infoContainer}>
                <ThemedText style={styles.label}>Generation:</ThemedText>
                <View style={styles.infoBox}>
                  <ThemedText style={styles.infoText}>{studentIdentity.generation || "Belum diisi"}</ThemedText>
                </View>
              </View>

              {/* Tombol-tombol tidak berubah */}
              <TouchableOpacity style={styles.settingButton} onPress={() => router.push("/(mahasiswa)/edit/EditProfil")} activeOpacity={0.9}>
                <ThemedText variant="semibold" style={styles.settingButtonText}>
                  Setting
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.9} onPress={handleLogoutConfirm} style={styles.logoutButton}>
                <ThemedText variant="semibold" style={styles.logoutButtonText}>
                  Logout
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
          {/* </LinearGradient> */}

          <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} buttons={alertConfig.buttons} />

          {/* Image Modal */}
          <Modal visible={showImageModal} transparent animationType="fade" onRequestClose={() => setShowImageModal(false)}>
            <View style={styles.imageModalOverlay}>
              <TouchableOpacity style={styles.imageModalClose} onPress={() => setShowImageModal(false)} activeOpacity={1}>
                <View style={styles.imageModalContent}>
                  <TouchableOpacity style={styles.closeButton} onPress={() => setShowImageModal(false)}>
                    <Ionicons name="close-circle" size={36} color="#fff" />
                  </TouchableOpacity>
                  <Image source={studentIdentity?.profile_image ? { uri: studentIdentity.profile_image } : require("@/assets/images/unnamed.jpg")} style={styles.fullImage} resizeMode="contain" />
                  <ThemedText variant="semibold" style={styles.imageModalName}>
                    {studentIdentity?.full_name}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            </View>
          </Modal>
        </SafeAreaView>
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
  safeContainer: {
    flex: 1,
    marginBottom: 85,
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
    // backgroundColor: "#015023",
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  profileCard: {
    // backgroundColor: "#015023",
    borderRadius: 0,
    padding: 30,
    paddingTop: 10,
    paddingBottom: 40,
    flex: 1,
  },
  profileTitle: {
    color: "#ffffff",
    fontSize: 20,
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
    backgroundColor: "#F1E8C2",
    borderRadius: 25,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
  },
  settingButtonText: {
    color: "#1a1a1a",
    fontSize: 16,
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
  },
});

export default Profil;
