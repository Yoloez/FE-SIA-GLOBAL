import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Notification {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  time: string;
}

const NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    category: "COURSE",
    title: "Analisis dan Desain Perangkat Lunak",
    subtitle: "NIL Tugas 2 telah dibuka - Pengumpulan : Raport",
    time: "2h ago",
  },
  // Tambahkan notifikasi lain di sini jika diperlukan
];

export default function NotificationScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {NOTIFICATIONS.map((notification) => (
            <View key={notification.id} style={styles.notificationCard}>
              {/* Category Badge */}
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{notification.category}</Text>
              </View>

              {/* Title */}
              <Text style={styles.notificationTitle}>{notification.title}</Text>

              {/* Subtitle */}
              <Text style={styles.notificationSubtitle}>{notification.subtitle}</Text>

              {/* Time */}
              <Text style={styles.notificationTime}>{notification.time}</Text>
            </View>
          ))}

          <TouchableOpacity onPress={() => router.push("/buatNotif")}>
            <View style={styles.notifButton}>
              <Text>Buat Pengumuman</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#015023",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  notificationCard: {
    backgroundColor: "#F5EFD3",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#DABC4E",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#015023",
    letterSpacing: 0.5,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#015023",
    marginBottom: 8,
    lineHeight: 22,
  },
  notificationSubtitle: {
    fontSize: 13,
    color: "#4a4a4a",
    lineHeight: 18,
    marginBottom: 12,
  },
  notificationTime: {
    fontSize: 11,
    color: "#7a7a7a",
    fontStyle: "italic",
  },
  notifButton: {
    backgroundColor: "#DABC4E",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
  },
});
