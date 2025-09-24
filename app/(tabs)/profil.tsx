import { ChevronRight, GraduationCap, Mail, User } from "lucide-react-native";
import React from "react";
import { Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Profil = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* --- Glassmorphism Header --- */}
      <View style={styles.headerBackground}>
        <Image source={require("../../assets/images/lofi-4k.png")} style={StyleSheet.absoluteFillObject} blurRadius={20} />
        <Image source={require("../../assets/images/kairi.png")} style={styles.avatar} />
        <View style={styles.glassOverlay} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.profileCard}>
          {/* --- Profile Card --- */}
          <Text style={styles.name}>Hanan Fijananto</Text>
          <Text style={styles.nim}>23/123456/TK/56789</Text>
        </View>

        {/* --- Menu List --- */}
        <View style={styles.menuContainer}>
          {[
            { icon: <User size={20} color="#3b82f6" />, label: "Edit Profil" },
            { icon: <GraduationCap size={20} color="#10b981" />, label: "Info Akademik" },
            { icon: <Mail size={20} color="#f59e0b" />, label: "Kontak & Alamat" },
          ].map((item, idx) => (
            <TouchableOpacity key={idx} style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.iconWrapper}>{item.icon}</View>
              <Text style={styles.menuText}>{item.label}</Text>
              <ChevronRight size={18} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        {/* --- Logout Button --- */}
        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  headerBackground: {
    height: 260,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  scrollContainer: {
    paddingTop: 180,
    paddingBottom: 40,
    alignItems: "center",
  },
  profileCard: {
    backgroundColor: "red",
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: "center",
    marginBottom: 24,
    width: "86%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#ffffff",
    marginBottom: 12,
  },
  name: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
  },
  nim: {
    fontSize: 15,
    color: "#6b7280",
    marginTop: 4,
  },
  menuContainer: {
    width: "86%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  logoutButton: {
    marginTop: 24,
    width: "86%",
    backgroundColor: "#ef4444",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  logoutButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default Profil;
