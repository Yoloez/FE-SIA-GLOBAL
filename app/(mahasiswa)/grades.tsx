import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

interface GradeItem {
  id_class: number;
  code_class: string;
  subject_name: string;
  code_subject: string;
  sks: number;
  grade_details: {
    score: number;
    letter: string;
    ip: number;
  } | null;
}

interface GradeSection {
  title: string;
  data: GradeItem[];
}

export default function GradesScreen() {
  const { user } = useAuth();
  const [sections, setSections] = useState<GradeSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"plan" | "results">("results");

  const fetchGrades = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/student/grades");
      const responseData = response.data.data;
      const gradesData = responseData.grade || {};

      let gradesArray: any[] = [];
      if (Array.isArray(gradesData)) {
        gradesArray = gradesData;
      } else if (typeof gradesData === "object" && gradesData !== null) {
        gradesArray = Object.values(gradesData);
      }

      if (gradesArray.length === 0) {
        setSections([]);
        return;
      }

      const groupedByPeriod: { [key: string]: GradeItem[] } = {};

      gradesArray.forEach((item: any) => {
        const period = item.academic_period || "Lainnya";
        if (!groupedByPeriod[period]) {
          groupedByPeriod[period] = [];
        }
        groupedByPeriod[period].push(item);
      });

      const sectionsData: GradeSection[] = Object.keys(groupedByPeriod).map((period) => ({
        title: period,
        data: groupedByPeriod[period],
      }));

      setSections(sectionsData);

      // Auto-select first period if available
      if (sectionsData.length > 0 && selectedPeriod === "all") {
        setSelectedPeriod(sectionsData[0].title);
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
      setSections([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchGrades();
    }, [fetchGrades])
  );

  const periodOptions = useMemo(() => {
    if (!Array.isArray(sections)) return [];
    return sections.map((s) => s.title);
  }, [sections]);

  const filteredData = useMemo(() => {
    if (!Array.isArray(sections)) return [];

    if (selectedPeriod === "all") {
      return sections.flatMap((section) => section.data || []);
    }
    const section = sections.find((s) => s.title === selectedPeriod);
    return section ? section.data || [] : [];
  }, [sections, selectedPeriod]);

  const statistics = useMemo(() => {
    let totalSks = 0;
    let totalBobot = 0;
    let gradedCount = 0;

    filteredData.forEach((item) => {
      if (item.grade_details) {
        const sks = item.sks;
        const ip = item.grade_details.ip;
        totalSks += sks;
        totalBobot += sks * ip;
        gradedCount++;
      }
    });

    const ips = totalSks > 0 ? (totalBobot / totalSks).toFixed(2) : "0.00";

    // Calculate IPK (all periods)
    let totalSksAll = 0;
    let totalBobotAll = 0;

    sections.forEach((section) => {
      section.data.forEach((item) => {
        if (item.grade_details) {
          totalSksAll += item.sks;
          totalBobotAll += item.sks * item.grade_details.ip;
        }
      });
    });

    const ipk = totalSksAll > 0 ? (totalBobotAll / totalSksAll).toFixed(2) : "0.00";

    return {
      ips,
      ipk,
      totalSks,
      gradedCount,
      totalCount: filteredData.length,
    };
  }, [filteredData, sections]);

  const renderGradeCard = ({ item, index }: { item: GradeItem; index: number }) => {
    return (
      <View style={styles.gradeCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.codeChip}>
              <Text style={styles.codeChipText}>{item.code_subject}</Text>
            </View>
            <View style={styles.sksChipSmall}>
              <Text style={styles.sksChipText}>SKS: {item.sks}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.menuIcon}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subjectTitle} numberOfLines={2}>
          {item.subject_name}
        </Text>
        <Text style={styles.classCode}>Class: {item.code_class}</Text>

        <View style={styles.gradeFooter}>
          <View style={styles.gradeItem}>
            <Text style={styles.gradeLabel}>Nilai</Text>
            <Text style={styles.gradeValueLarge}>{item.grade_details ? item.grade_details.letter : "-"}</Text>
          </View>

          <View style={styles.gradeDivider} />

          <View style={styles.gradeItem}>
            <Text style={styles.gradeLabel}>Skor</Text>
            <Text style={styles.gradeValue}>{item.grade_details ? item.grade_details.score.toFixed(2) : "-"}</Text>
          </View>

          <View style={styles.gradeDivider} />

          <View style={styles.gradeItem}>
            <Text style={styles.gradeLabel}>Credit Score</Text>
            <Text style={styles.gradeValue}>{item.grade_details ? (item.grade_details.score * 0.01 * item.sks).toFixed(2) : "-"}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={["#015023", "#1C352D"]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Study</Text>
              <Text style={styles.headerSubtitle}>{selectedPeriod === "all" ? "All Periods" : selectedPeriod}</Text>
            </View>
          </View>
          <TouchableOpacity>
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === "plan" && styles.tabActive]} onPress={() => setActiveTab("plan")}>
            <Text style={[styles.tabText, activeTab === "plan" && styles.tabTextActive]}>Study Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === "results" && styles.tabActive]} onPress={() => setActiveTab("results")}>
            <Text style={[styles.tabText, activeTab === "results" && styles.tabTextActive]}>Study Results</Text>
          </TouchableOpacity>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.userInfo}></View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={styles.statIconWrapper}>
                <Ionicons name="trophy" size={16} color="#015023" />
              </View>
              <View>
                <Text style={styles.statLabel}>SKS</Text>
                <View style={styles.statValueRow}>
                  <Text style={styles.statValue}>{statistics.totalSks} SKS</Text>
                </View>
              </View>
            </View>

            <View style={styles.statBox}>
              <View style={styles.statIconWrapper}>
                <Ionicons name="trophy" size={16} color="#015023" />
              </View>
              <View>
                <Text style={styles.statLabel}>IPK</Text>
                <View style={styles.statValueRow}>
                  <Text style={styles.statValue}>{statistics.ipk}</Text>
                </View>
              </View>
            </View>

            <View style={styles.statBox}>
              <View style={styles.statIconWrapper}>
                <Ionicons name="trophy" size={16} color="#015023" />
              </View>
              <View>
                <Text style={styles.statLabel}>IPS</Text>
                <View style={styles.statValueRow}>
                  <Text style={styles.statValue}>{statistics.ips}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* DPM & Tomo Section */}
        </View>

        {/* Period Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollContainer} contentContainerStyle={styles.chipScrollContent}>
          {periodOptions.map((period) => (
            <TouchableOpacity key={period} style={[styles.periodChip, selectedPeriod === period && styles.periodChipActive]} onPress={() => setSelectedPeriod(period)}>
              <Text style={[styles.periodChipText, selectedPeriod === period && styles.periodChipTextActive]}>{period}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Grade Cards List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DABC4E" />
            <Text style={styles.loadingText}>Loading grades...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredData}
            renderItem={renderGradeCard}
            keyExtractor={(item, index) => `${item.id_class}-${index}`}
            contentContainerStyle={styles.gradesList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={64} color="rgba(255,255,255,0.3)" />
                <Text style={styles.emptyText}>No grades available</Text>
                <Text style={styles.emptySubtext}>Grades will appear here once your lecturers input them</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerTextContainer: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: "#DABC4E",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
  },
  tabTextActive: {
    color: "#015023",
  },
  userCard: {
    backgroundColor: "#F5EFD3",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "black",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  userInfo: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#DABC4E",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  userMeta: {
    fontSize: 11,
    color: "#666",
    marginBottom: 4,
  },
  userCourse: {
    fontSize: 10,
    color: "#999",
    lineHeight: 14,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f8f8f8",
    padding: 10,
    borderRadius: 12,
  },
  statIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DABC4E",
    justifyContent: "center",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    color: "#999",
    marginBottom: 2,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
  },
  dpmSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  dpmChip: {
    backgroundColor: "#DABC4E",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dpmText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#015023",
  },
  dpmUser: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dpmAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  dpmName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  chatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 12,
  },
  searchIcon: {},
  searchPlaceholder: {
    fontSize: 14,
    color: "#999",
  },
  chipScrollContainer: {
    marginTop: 16,
    maxHeight: 50,
  },
  chipScrollContent: {
    paddingHorizontal: 20,
    gap: 2,
    paddingBottom: 12,
  },
  periodChip: {
    backgroundColor: "rgba(218, 188, 78, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(218, 188, 78, 0.3)",
  },
  periodChipActive: {
    backgroundColor: "#DABC4E",
    borderColor: "#DABC4E",
  },
  periodChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  periodChipTextActive: {
    color: "#015023",
  },
  gradesList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  gradeCard: {
    backgroundColor: "#F5EFD3",
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: "black",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    gap: 8,
  },
  codeChip: {
    backgroundColor: "#DABC4E",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  codeChipText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#015023",
  },
  sksChipSmall: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sksChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
  },
  menuIcon: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  subjectTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
    lineHeight: 20,
  },
  classCode: {
    fontSize: 12,
    color: "#999",
    marginBottom: 16,
  },
  gradeFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  gradeItem: {
    flex: 1,
    alignItems: "center",
  },
  gradeLabel: {
    fontSize: 11,
    color: "#999",
    marginBottom: 6,
  },
  gradeValueLarge: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#015023",
  },
  gradeValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  gradeDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e0e0e0",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 20,
  },
});
