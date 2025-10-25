import api from "@/api/axios";
import axios from "axios";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

// Interface untuk mendefinisikan bentuk data profil yang kita harapkan dari API
interface LecturerProfileData {
  full_name: string;
  email: string;
  employee_id_number: string | null;
  position: string;
  profile_image: string;
}

const ProfilDosen = () => {
  const { logout, user, token } = useAuth();

  const [profileData, setProfileData] = useState<LecturerProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // --- Fungsi untuk mengambil data profil dari API ---
  const fetchProfile = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      // --- PERBAIKAN: Panggil endpoint yang benar ---
      const response = await api.get("/lecturer/profile");
      setProfileData(response.data.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Gagal memuat profil:", error.response?.data);
        alert(`Gagal memuat data profil. Error: ${error.response?.status}`);
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

  // Tampilkan loading indicator saat data sedang diambil
  if (isLoading || !profileData) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", backgroundColor: "#015023" }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#015023" />
      <View style={styles.content}>
        <View style={styles.profileCard}>
          <Text style={styles.profileTitle}>Profile</Text>

          <View style={styles.avatarContainer}>
            <Image source={{ uri: profileData.profile_image }} style={styles.avatar} />
          </View>

          {/* --- DATA SEKARANG DINAMIS --- */}
          <View style={styles.infoContainer}>
            <Text style={styles.label}>Name:</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>{profileData.full_name}</Text>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.label}>NIP:</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>{profileData.employee_id_number || "Belum diisi"}</Text>
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.9} onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// --- STYLESHEET ANDA TIDAK SAYA UBAH SAMA SEKALI ---
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
    backgroundColor: "#015023",
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  profileCard: {
    backgroundColor: "#015023",
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
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#e8d5b7",
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
