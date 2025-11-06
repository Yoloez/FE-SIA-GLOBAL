// components/class/ClassHeader.tsx
import { ClassDetails } from "@/types/class.types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface ClassHeaderProps {
  classDetails: ClassDetails;
}

export const ClassHeader: React.FC<ClassHeaderProps> = ({ classDetails }) => {
  return (
    <View style={styles.headerCard}>
      <View style={styles.headerTop}>
        <View style={styles.codeBadge}>
          <Text style={styles.codeText}>{classDetails.code_class}</Text>
        </View>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {classDetails.subject?.name_subject ?? "Tidak ada data"}
      </Text>
      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={16} color="#666" />
        <Text style={styles.infoText}>{classDetails.academic_period?.name ?? "Tidak ada data"}</Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="time-outline" size={16} color="#666" />
        <Text style={styles.infoText}>{classDetails.schedule || "Belum ada jadwal"}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: "#F5EFD3",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  codeBadge: {
    backgroundColor: "#015023",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  codeText: {
    color: "#DABC4E",
    fontSize: 14,
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
});
