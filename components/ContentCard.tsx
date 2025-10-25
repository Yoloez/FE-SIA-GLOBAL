import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type ContentCardProps = {
  label?: string;
  title?: string;
  contents?: string[];
  route?: string; // biar bisa kirim array teks
};

const ContentCard: React.FC<ContentCardProps> = ({ label = "Label", title = "SVPL", contents = ["Konten Tambahan 1", "Konten Tambahan 2"] }) => {
  return (
    <View style={styles.contentSection}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.contentCard}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={styles.titleText}>{title}</Text>
          <Ionicons name="notifications-outline" size={24} color="#DABC4E" />
        </View>

        {contents.map((item, index) => (
          <Text key={index} style={styles.contentText}>
            {item}
          </Text>
        ))}
      </View>
    </View>
  );
};

export default ContentCard;

const styles = StyleSheet.create({
  contentSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginBottom: 8,
  },
  contentCard: {
    backgroundColor: "#F5EFD3",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contentText: {
    fontFamily: "Urbanist_400Regular",
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 4,
  },

  titleText: {
    fontFamily: "Urbanist_600SemiBold",
    fontSize: 15,
    backgroundColor: "#DABC4E",
    borderRadius: 50,
    paddingHorizontal: 12,
    marginBottom: 15,
    fontWeight: "400",
    color: "white",
  },
});
