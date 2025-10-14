import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Bell, ChevronRight, Edit3, GraduationCap, Heart, LogOut, MapPin, Moon, Settings, Shield, User } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import { Animated, Dimensions, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

const ProfilMahasiswa = () => {
  // [Saran 3] Ambil data 'user' dari context
  const { logout, user } = useAuth();
  const [activeSection, setActiveSection] = useState(null);

  // [Saran 2] Gunakan useRef untuk Animated.Value
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // [Saran 2] Bungkus fungsi dengan useCallback
  const handleLogout = useCallback(() => {
    Animated.sequence([Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }), Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })]).start(() => {
      logout();
    });
  }, [logout, scaleAnim]);

  // [Saran 1 & 2] Perbaiki logika switch dan bungkus dengan useCallback
  const handleMenuPress = useCallback(
    (section) => {
      setActiveSection(section);

      switch (section) {
        case "edit":
          router.push("/editProfile"); // Pastikan rute ini ada
          break;
        // case "personal":
        //   router.push("/personalInfo"); // Contoh rute
        //   break;
        // case "academic":
        //   router.push("/academicInfo"); // Contoh rute
        //   break;
        // case "contact":
        //   router.push("/contactInfo"); // Contoh rute
        //   break;
        // case "notifications":
        //   router.push("/notifications"); // Contoh rute
        //   break;
        // case "privacy":
        //   router.push("/privacy"); // Contoh rute
        //   break;
        // case "appearance":
        //   router.push("/appearance"); // Contoh rute
        //   break;
        default:
          console.warn(`Rute untuk section "${section}" belum diatur.`);
          break;
      }
    },
    [router]
  );

  const menuSections = [
    // ... data menuSections tetap sama
    {
      title: "Account",
      items: [
        {
          icon: <Edit3 size={20} color="#6366f1" />,
          label: "Edit Profile",
          sublabel: "Update your information",
          color: "#eef2ff",
          section: "edit",
        },
        {
          icon: <User size={20} color="#8b5cf6" />,
          label: "Personal Info",
          sublabel: "Manage your data",
          color: "#f3e8ff",
          section: "personal",
        },
      ],
    },
    {
      title: "Academic",
      items: [
        {
          icon: <GraduationCap size={20} color="#10b981" />,
          label: "Academic Info",
          sublabel: "Grades, schedule & more",
          color: "#d1fae5",
          section: "academic",
        },
        {
          icon: <MapPin size={20} color="#f59e0b" />,
          label: "Contact & Address",
          sublabel: "Your contact details",
          color: "#fed7aa",
          section: "contact",
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          icon: <Bell size={20} color="#3b82f6" />,
          label: "Notifications",
          sublabel: "Manage preferences",
          color: "#dbeafe",
          section: "notifications",
        },
        {
          icon: <Shield size={20} color="#14b8a6" />,
          label: "Privacy & Security",
          sublabel: "Protect your account",
          color: "#ccfbf1",
          section: "privacy",
        },
        {
          icon: <Moon size={20} color="#64748b" />,
          label: "Appearance",
          sublabel: "Theme & display",
          color: "#e2e8f0",
          section: "appearance",
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={["#6366f1", "#8b5cf6", "#a855f7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
        <View style={styles.headerPattern} pointerEvents="none">
          {[...Array(6)].map((_, i) => (
            <View key={i} style={[styles.circle, { top: Math.random() * 200 - 100, left: Math.random() * width, width: Math.random() * 100 + 50, height: Math.random() * 100 + 50 }]} />
          ))}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.push("/")}>
            <Settings size={22} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Heart size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          {/* [Saran 3] Gunakan data dinamis untuk avatar jika ada */}
          <Image source={user?.avatar || require("../../assets/images/kairi.png")} style={styles.avatar} />
          <View style={styles.onlineIndicator} />
          <TouchableOpacity style={styles.editAvatarButton} onPress={() => router.push("/editProfile")}>
            <Edit3 size={14} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* [Saran 3] Tampilkan data pengguna dari context */}
        <Text style={styles.name}>{user?.name || "Hanan Fijananto"}</Text>
        <Text style={styles.nim}>{user?.nim || "23/123456/TK/56789"}</Text>

        {/* <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>3.85</Text>
            <Text style={styles.statLabel}>GPA</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>6</Text>
            <Text style={styles.statLabel}>Semester</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>120</Text>
            <Text style={styles.statLabel}>Credits</Text>
          </View>
        </View> */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {menuSections.map((section, sectionIdx) => (
          <View key={sectionIdx} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.menuItem, activeSection === item.section && styles.menuItemActive, idx === section.items.length - 1 && styles.menuItemLast]}
                  activeOpacity={0.7}
                  onPress={() => handleMenuPress(item.section)}
                >
                  <View style={[styles.iconWrapper, { backgroundColor: item.color }]}>{item.icon}</View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuSublabel}>{item.sublabel}</Text>
                  </View>
                  <ChevronRight size={20} color="#94a3b8" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Animated.View style={[styles.logoutContainer, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity activeOpacity={0.9} onPress={handleLogout}>
            <LinearGradient colors={["#ef4444", "#dc2626"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.logoutButton}>
              <LogOut size={20} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>App Version 2.0.1</Text>
          <Text style={styles.footerSubtext}>© 2024 Student Portal</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ... Styles tetap sama
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  headerGradient: {
    height: 280,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
  },
  headerPattern: {
    ...StyleSheet.absoluteFillObject,
  },
  circle: {
    position: "absolute",
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 50,
    paddingHorizontal: 20,
    gap: 12,
    zIndex: 5,
    position: "absolute",
    right: 0,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    // paddingTop: 120,
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: "center",
    marginTop: 50,
    // marginBottom: 32,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#10b981",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 5,
    right: -5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  name: {
    fontSize: 28,
    fontWeight: "800",
    color: "white",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  nim: {
    fontSize: 15,
    color: "white",
    fontWeight: "500",
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    alignItems: "center",
    gap: 24,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#e2e8f0",
  },
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  menuItemActive: {
    backgroundColor: "#f8fafc",
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 2,
  },
  menuSublabel: {
    fontSize: 13,
    color: "#94a3b8",
  },
  logoutContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  logoutButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 10,
  },
  footerText: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 11,
    color: "#cbd5e1",
  },
});

export default ProfilMahasiswa;
