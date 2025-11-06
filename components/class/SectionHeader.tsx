// components/class/SectionHeader.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface SectionHeaderProps {
  icon: string;
  title: string;
  onAdd: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title, onAdd }) => {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleContainer}>
        <Ionicons name={icon as any} size={24} color="white" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <TouchableOpacity style={styles.addButton} onPress={onAdd} activeOpacity={0.7}>
        <Ionicons name="add" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  addButton: {
    backgroundColor: "transparent",
    width: 40,
    height: 40,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "white",
    borderWidth: 1,
  },
});
