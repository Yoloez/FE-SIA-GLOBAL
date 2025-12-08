import api from "@/api/axios";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ClassItem {
  id_class: number;
  code_class: string;
  name_subject: string;
  code_subject: string;
  sks: number;
  academic_period: string;
  id_academic_period: number;
}

interface AcademicPeriod {
  id: number;
  name: string;
}

export default function NotificationScreen() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [showPeriodModal, setShowPeriodModal] = useState(false);

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/lecturer/classes");
      const fetchedClasses = response.data.data || [];
      setClasses(fetchedClasses);

      // Set default selected period to the first one if available
      if (fetchedClasses.length > 0 && selectedPeriod === null) {
        setSelectedPeriod(fetchedClasses[0].id_academic_period);
      }
    } catch (error: any) {
      console.error("Gagal memuat kelas:", error);
      Alert.alert("Error", "Gagal memuat daftar kelas");
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod]);

  useFocusEffect(
    useCallback(() => {
      fetchClasses();
    }, [fetchClasses])
  );

  // Get unique academic periods
  const academicPeriods = React.useMemo<AcademicPeriod[]>(() => {
    const periodsMap = new Map<number, string>();
    classes.forEach((item) => {
      if (!periodsMap.has(item.id_academic_period)) {
        periodsMap.set(item.id_academic_period, item.academic_period);
      }
    });
    return Array.from(periodsMap.entries()).map(([id, name]) => ({ id, name }));
  }, [classes]);

  // Filter classes by selected academic period
  const filteredClasses = React.useMemo(() => {
    if (selectedPeriod === null) return classes;
    return classes.filter((item) => item.id_academic_period === selectedPeriod);
  }, [classes, selectedPeriod]);

  // Get selected period name
  const selectedPeriodName = React.useMemo(() => {
    const period = academicPeriods.find((p) => p.id === selectedPeriod);
    return period ? period.name : "Pilih Periode";
  }, [academicPeriods, selectedPeriod]);

  // Handle period selection
  const handlePeriodSelect = (periodId: number) => {
    setSelectedPeriod(periodId);
    setShowPeriodModal(false);
  };

  const handleClassPress = (classItem: ClassItem) => {
    router.push({
      pathname: "/(dosen)/buatNotif",
      params: {
        id_class: classItem.id_class,
        code_class: classItem.code_class,
        name_subject: classItem.name_subject,
        code_subject: classItem.code_subject,
      },
    });
  };

  const renderClassItem = ({ item }: { item: ClassItem }) => (
    <TouchableOpacity onPress={() => handleClassPress(item)} activeOpacity={0.7}>
      <View style={styles.classCard}>
        <View style={styles.cardHeader}>
          <View style={styles.codeChip}>
            <ThemedText style={styles.codeText}>{item.code_subject}</ThemedText>
          </View>
          <View style={styles.sksChip}>
            <ThemedText variant="bold" style={styles.sksText}>
              {item.sks} SKS
            </ThemedText>
          </View>
        </View>

        <ThemedText variant="bold" style={styles.subjectName} numberOfLines={2}>
          {item.name_subject}
        </ThemedText>

        <View style={styles.infoRow}>
          <Ionicons name="business-outline" size={14} color="#666" />
          <ThemedText style={styles.infoText}>Kelas {item.code_class}</ThemedText>
        </View>

        <View style={styles.periodChip}>
          <ThemedText style={styles.periodText}>{item.academic_period}</ThemedText>
        </View>

        <View style={styles.actionRow}>
          <ThemedText style={styles.actionText}>Tap untuk buat pengumuman</ThemedText>
          <Ionicons name="chevron-forward" size={20} color="#015023" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPeriodModal = () => (
    <Modal visible={showPeriodModal} transparent={true} animationType="fade" onRequestClose={() => setShowPeriodModal(false)}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPeriodModal(false)}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText variant="semibold" style={styles.modalTitle}>
              Pilih Periode Akademik
            </ThemedText>
            <TouchableOpacity onPress={() => setShowPeriodModal(false)}>
              <Ionicons name="close" size={24} color="#015023" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.periodList}>
            {academicPeriods.map((period) => (
              <TouchableOpacity key={period.id} style={[styles.periodItem, selectedPeriod === period.id && styles.periodItemSelected]} onPress={() => handlePeriodSelect(period.id)}>
                <ThemedText variant="semibold" style={[styles.periodItemText, selectedPeriod === period.id && styles.periodItemTextSelected]}>
                  {period.name}
                </ThemedText>
                {selectedPeriod === period.id && <Ionicons name="checkmark-circle" size={20} color="#015023" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <LinearGradient colors={["#015023", "#1C352D"]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <ThemedText variant="semibold" style={styles.headerTitle}>
            Buat Pengumuman
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {/* Academic Period Filter */}
        {!isLoading && academicPeriods.length > 0 && (
          <View style={styles.filterContainer}>
            <TouchableOpacity style={styles.periodSelector} onPress={() => setShowPeriodModal(true)}>
              <View style={styles.periodSelectorContent}>
                <Ionicons name="calendar" size={18} color="#F5EFD3" />
                <ThemedText style={styles.periodSelectorText} numberOfLines={1}>
                  {selectedPeriodName}
                </ThemedText>
              </View>
              <Ionicons name="chevron-down" size={20} color="#F5EFD3" />
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DABC4E" />
            <ThemedText style={styles.loadingText}>Memuat daftar kelas...</ThemedText>
          </View>
        ) : filteredClasses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={64} color="rgba(255,255,255,0.5)" />
            <ThemedText style={styles.emptyText}>{selectedPeriod ? "Tidak ada kelas pada periode ini" : "Belum ada kelas yang diampu"}</ThemedText>
          </View>
        ) : (
          <FlatList data={filteredClasses} renderItem={renderClassItem} keyExtractor={(item) => item.id_class.toString()} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} />
        )}

        {/* Period Modal */}
        {renderPeriodModal()}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
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
    color: "#ffffff",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
  },
  classCard: {
    backgroundColor: "#F5EFD3",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  codeChip: {
    backgroundColor: "#015023",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  codeText: {
    fontSize: 11,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  sksChip: {
    backgroundColor: "#DABC4E",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sksText: {
    fontSize: 11,
    color: "#015023",
  },
  subjectName: {
    fontSize: 17,
    color: "#015023",
    marginBottom: 10,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  periodChip: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(1, 80, 35, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  periodText: {
    fontSize: 11,
    color: "#015023",
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  actionText: {
    fontSize: 13,
    color: "#015023",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 12,
    textAlign: "center",
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  periodSelector: {
    backgroundColor: "rgba(245, 239, 211, 0.15)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(245, 239, 211, 0.3)",
  },
  periodSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  periodSelectorText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F5EFD3",
    flex: 1,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#F5EFD3",
    borderRadius: 20,
    width: "85%",
    maxHeight: "70%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(1, 80, 35, 0.1)",
  },
  modalTitle: {
    fontSize: 18,
    color: "#015023",
  },
  periodList: {
    maxHeight: 400,
  },
  periodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(1, 80, 35, 0.05)",
  },
  periodItemSelected: {
    backgroundColor: "rgba(1, 80, 35, 0.08)",
  },
  periodItemText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },
  periodItemTextSelected: {
    color: "#015023",
  },
});
