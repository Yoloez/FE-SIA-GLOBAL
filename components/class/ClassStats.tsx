// components/class/ClassStats.tsx
import { ClassDetails } from "@/types/class.types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface ClassStatsProps {
  classDetails: ClassDetails;
}

export const ClassStats: React.FC<ClassStatsProps> = ({ classDetails }) => {
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statBox}>
        <Ionicons name="people" size={32} color="#015023" />
        <Text style={styles.statNumber}>
          {classDetails.students?.length || 0}/{classDetails.member_class}
        </Text>
        <Text style={styles.statLabel}>Mahasiswa</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statBox}>
        <Ionicons name="person" size={32} color="#015023" />
        <Text style={styles.statNumber}>{classDetails.lecturers?.length || 0}</Text>
        <Text style={styles.statLabel}>Dosen</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#F5EFD3",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 16,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#015023",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
});
