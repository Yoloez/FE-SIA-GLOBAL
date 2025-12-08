import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";
import { ThemedText } from "../../components/ThemedText";

interface ContactData {
  lecturers: any[];
  classmates: any[];
}

export default function PresencePage() {
  const [totalClasses, setTotalClasses] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [classesResponse, contactsResponse] = await Promise.all([api.get("/lecturer/classes"), api.get("/chat/contacts")]);

      // Hitung total kelas aktif
      if (classesResponse.data?.data) {
        setTotalClasses(classesResponse.data.data.length);
      }

      // Hitung total mahasiswa unik dari contacts
      if (contactsResponse.data?.data?.classmates) {
        setTotalStudents(contactsResponse.data.data.classmates.length);
      }
    } catch (error) {
      console.error("Error fetching presence data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  return (
    <LinearGradient colors={["#015023", "#1C352D"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <StatusBar barStyle="light-content" backgroundColor="#015023" />

        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="bold" style={styles.headerTitle}>
            Presensi
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>Kelola kehadiran mahasiswa</ThemedText>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="calendar-outline" size={24} color="#015023" />
              </View>
              {isLoading ? (
                <ActivityIndicator size="small" color="#015023" style={{ marginVertical: 8 }} />
              ) : (
                <ThemedText variant="bold" style={styles.statValue}>
                  {totalClasses}
                </ThemedText>
              )}
              <ThemedText style={styles.statLabel}>Kelas Aktif</ThemedText>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="people-outline" size={24} color="#015023" />
              </View>
              {isLoading ? (
                <ActivityIndicator size="small" color="#015023" style={{ marginVertical: 8 }} />
              ) : (
                <ThemedText variant="bold" style={styles.statValue}>
                  {totalStudents}
                </ThemedText>
              )}
              <ThemedText style={styles.statLabel}>Total Mahasiswa</ThemedText>
            </View>
          </View>

          {/* Quick Actions Section */}
          <View style={styles.section}>
            <ThemedText variant="semibold" style={styles.sectionTitle}>
              Aksi Cepat
            </ThemedText>

            {/* Manual Attendance Card */}
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/presensi/_presencePage")} activeOpacity={0.7}>
              <View style={styles.actionIconContainer}>
                <LinearGradient colors={["#DABC4E", "#C4A83E"]} style={styles.actionIconGradient}>
                  <Ionicons name="checkmark-done" size={28} color="#015023" />
                </LinearGradient>
              </View>

              <View style={styles.actionContent}>
                <ThemedText variant="bold" style={styles.actionTitle}>
                  Presensi Manual
                </ThemedText>
                <ThemedText style={styles.actionDescription}>Kelola kehadiran mahasiswa secara manual</ThemedText>
              </View>

              <View style={styles.actionArrow}>
                <Ionicons name="chevron-forward" size={24} color="#015023" />
              </View>
            </TouchableOpacity>

            {/* History Card */}
          </View>

          {/* Info Section */}
          <View style={styles.section}>
            <ThemedText variant="semibold" style={styles.sectionTitle}>
              Informasi
            </ThemedText>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="information-circle" size={20} color="#3b82f6" />
                </View>
                <ThemedText style={styles.infoText}>Pastikan mahasiswa scan QR pada waktu yang tepat</ThemedText>
              </View>

              <View style={[styles.infoRow, { marginTop: 12 }]}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="time" size={20} color="#3b82f6" />
                </View>
                <ThemedText style={styles.infoText}>Presensi manual dapat dilakukan kapan saja</ThemedText>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    color: "#F5EFD3",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(245, 239, 211, 0.7)",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F5EFD3",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(1, 80, 35, 0.1)",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    color: "#015023",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#F5EFD3",
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5EFD3",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIconContainer: {
    marginRight: 16,
  },
  actionIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    color: "#015023",
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  actionArrow: {
    width: 32,
    height: 32,
    backgroundColor: "rgba(1, 80, 35, 0.1)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  infoCard: {
    backgroundColor: "rgba(245, 239, 211, 0.95)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#015023",
    lineHeight: 18,
  },
});
