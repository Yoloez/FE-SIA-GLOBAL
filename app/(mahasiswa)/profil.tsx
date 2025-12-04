import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, Image, StatusBar, StyleSheet, TouchableOpacity, View } from "react-native";
import api from "../../api/axios";
import CustomAlert from "../../components/CustomAlert";
import { ThemedText } from "../../components/ThemedText";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

interface ProfileData {
  name: string;
  email: string;
  program_name: string | null;
  registration_number: string | null;
  full_name: string;
  generation: string | null;
  profile_image: string | null;
}

const Profil = () => {
  const { logout, user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/student/profile/identity");
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

  // Gunakan useFocusEffect agar data di-refresh setiap kali kembali ke halaman ini
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

  // Tampilkan loading indicator saat data sedang diambil
  if (isLoading || !profileData) {
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
        <StatusBar barStyle="light-content" backgroundColor="#015023" />
        <View style={styles.content}>
          <View style={styles.profileCard}>
            <ThemedText variant="semibold" style={styles.profileTitle}>
              Profile
            </ThemedText>

            <View style={styles.avatarContainer}>
              <Image source={profileData.profile_image ? { uri: profileData.profile_image } : require("../../assets/images/kairi.png")} style={styles.avatar} />
            </View>

            {/* --- DATA SEKARANG DINAMIS --- */}
            <View style={styles.infoContainer}>
              <ThemedText style={styles.label}>Name:</ThemedText>
              <View style={styles.infoBox}>
                <ThemedText style={styles.infoText}>{profileData.full_name}</ThemedText>
              </View>
            </View>

            <View style={styles.infoContainer}>
              <ThemedText style={styles.label}>NIM:</ThemedText>
              <View style={styles.infoBox}>
                <ThemedText style={styles.infoText}>{profileData.registration_number || "Belum diisi"}</ThemedText>
              </View>
            </View>

            <View style={styles.infoContainer}>
              <ThemedText style={styles.label}>Major:</ThemedText>
              <View style={styles.infoBox}>
                <ThemedText style={styles.infoText}>{profileData.program_name || "Belum diisi"}</ThemedText>
              </View>
            </View>

            <View style={styles.infoContainer}>
              <ThemedText style={styles.label}>Generation:</ThemedText>
              <View style={styles.infoBox}>
                <ThemedText style={styles.infoText}>{profileData.generation || "Belum diisi"}</ThemedText>
              </View>
            </View>

            {/* Tombol-tombol tidak berubah */}
            <TouchableOpacity style={styles.settingButton} onPress={() => router.push("/EditProfil")}>
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
      </LinearGradient>

      <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} buttons={alertConfig.buttons} />
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
    paddingTop: 35,
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
});

export default Profil;
