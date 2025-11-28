import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";

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
  const [sections, setSections] = useState<GradeSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchGrades = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/student/grades");
      const data = response.data.data;
      setSections(data);
    } catch (error) {
      console.error("Error fetching grades:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchGrades();
    }, [fetchGrades])
  );

  // Get all period options
  const periodOptions = useMemo(() => {
    const periods = sections.map((s) => s.title);
    return ["all", ...periods];
  }, [sections]);

  // Filter data based on selected period
  const filteredData = useMemo(() => {
    if (selectedPeriod === "all") {
      return sections.flatMap((section) => section.data);
    }
    const section = sections.find((s) => s.title === selectedPeriod);
    return section ? section.data : [];
  }, [sections, selectedPeriod]);

  // Calculate statistics for filtered data
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

    const ipk = totalSks > 0 ? (totalBobot / totalSks).toFixed(2) : "0.00";

    return {
      ipk,
      totalSks,
      gradedCount,
      totalCount: filteredData.length,
    };
  }, [filteredData]);

  const renderItem = ({ item, index }: { item: GradeItem; index: number }) => {
    const isEven = index % 2 === 0;
    return (
      <View style={[styles.row, isEven ? styles.rowEven : styles.rowOdd]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.subjectCode}>{item.code_subject}</Text>
          <Text style={styles.subjectName}>{item.subject_name}</Text>
        </View>
        <View style={styles.gradeBox}>
          <Text style={styles.sksText}>{item.sks} SKS</Text>
          {item.grade_details ? (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreNumber}>{item.grade_details.score}</Text>
              <Text style={styles.scoreText}>{item.grade_details.letter}</Text>
            </View>
          ) : (
            <View style={styles.emptyScoreBadge}>
              <Text style={styles.emptyScore}>-</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const getPeriodLabel = (period: string) => {
    if (period === "all") return "Semua Periode";
    return period;
  };

  // Determine label: IPK for "all", IPS for specific period
  const getIndexLabel = () => {
    return selectedPeriod === "all" ? "IPK" : "IPS";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: "Kartu Hasil Studi",
          headerStyle: { backgroundColor: "#015023" },
          headerTintColor: "#fff",
        }}
      />

      {/* Header Summary */}
      <View style={styles.headerSummary}>
        <View style={styles.statItem}>
          <Text style={styles.summaryLabel}>Total SKS</Text>
          <Text style={styles.summaryValue}>{statistics.totalSks}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.summaryLabel}>{getIndexLabel()}</Text>
          <Text style={styles.summaryValue}>{statistics.ipk}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.summaryLabel}>Dinilai</Text>
          <Text style={styles.summaryValue}>
            {statistics.gradedCount}/{statistics.totalCount}
          </Text>
        </View>
      </View>

      {/* Period Filter Dropdown */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter Periode:</Text>
        <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowDropdown(!showDropdown)}>
          <Text style={styles.dropdownButtonText}>{getPeriodLabel(selectedPeriod)}</Text>
          <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={20} color="#015023" />
        </TouchableOpacity>
      </View>

      {/* Dropdown Options */}
      {showDropdown && (
        <View style={styles.dropdownList}>
          {periodOptions.map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.dropdownItem, selectedPeriod === period && styles.dropdownItemActive]}
              onPress={() => {
                setSelectedPeriod(period);
                setShowDropdown(false);
              }}
            >
              <Text style={[styles.dropdownItemText, selectedPeriod === period && styles.dropdownItemTextActive]}>{getPeriodLabel(period)}</Text>
              {selectedPeriod === period && <Ionicons name="checkmark" size={20} color="#015023" />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#015023" />
          <Text style={styles.loadingText}>Memuat data nilai...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.id_class}-${index}`}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>{selectedPeriod === "all" ? "Belum ada data akademik." : `Tidak ada mata kuliah di periode ${selectedPeriod}`}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f0f4f7" },
  headerSummary: { backgroundColor: "#015023", padding: 20, flexDirection: "row", justifyContent: "space-around", alignItems: "center", elevation: 4 },
  statItem: { alignItems: "center", flex: 1 },
  summaryLabel: { color: "#a3cfbb", fontSize: 12, textTransform: "uppercase", marginBottom: 4 },
  summaryValue: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  divider: { width: 1, height: "80%", backgroundColor: "rgba(255,255,255,0.2)" },
  filterContainer: {
    backgroundColor: "#fff",
    padding: 15,
    marginHorizontal: 15,
    marginTop: -15,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  filterLabel: { fontSize: 14, color: "#666", marginBottom: 8, fontWeight: "500" },
  dropdownButton: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f5f5f5", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#ddd" },
  dropdownButtonText: { fontSize: 16, color: "#333", fontWeight: "500" },
  dropdownList: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: -5,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 20,
    maxHeight: 300,
  },
  dropdownItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 15, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  dropdownItemActive: { backgroundColor: "#e8f5e9" },
  dropdownItemText: { fontSize: 15, color: "#333" },
  dropdownItemTextActive: { fontWeight: "600", color: "#015023" },
  listContainer: { padding: 15, paddingBottom: 40 },
  row: { flexDirection: "row", padding: 15, alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#eee", backgroundColor: "#fff" },
  rowEven: { backgroundColor: "#fff" },
  rowOdd: { backgroundColor: "#fafafa" },
  subjectCode: { fontSize: 12, color: "#666", marginBottom: 2 },
  subjectName: { fontSize: 15, color: "#333", fontWeight: "500", paddingRight: 10 },
  gradeBox: { flexDirection: "row", alignItems: "center", gap: 8 },
  sksText: { fontSize: 12, color: "#888" },
  scoreBadge: { backgroundColor: "#e8f5e9", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, minWidth: 50, alignItems: "center" },
  scoreNumber: { fontSize: 18, fontWeight: "bold", color: "#015023" },
  scoreText: { fontSize: 14, fontWeight: "600", color: "#2e7d32", marginTop: -2 },
  emptyScoreBadge: { backgroundColor: "#f5f5f5", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, minWidth: 50, alignItems: "center", borderWidth: 1, borderColor: "#ddd", borderStyle: "dashed" },
  emptyScore: { color: "#ccc", fontSize: 20, fontWeight: "bold" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 },
  loadingText: { marginTop: 10, fontSize: 14, color: "#666" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80 },
  emptyText: { textAlign: "center", color: "#666", marginTop: 20, fontSize: 16, paddingHorizontal: 40 },
});
