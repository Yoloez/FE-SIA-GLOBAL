import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

interface Student {
  id: string;
  name: string;
  studentId: string;
  avatar: string;
}

const students: Student[] = [
  { id: "1", name: "Woody", studentId: "24/123456/SV/54321", avatar: "🐱" },
  { id: "2", name: "Buzz", studentId: "24/123456/SV/54321", avatar: "🐱" },
  { id: "3", name: "Jessie", studentId: "24/123456/SV/54321", avatar: "🐱" },
  { id: "4", name: "Lotso", studentId: "24/123456/SV/54321", avatar: "🐱" },
  { id: "5", name: "T-Rex", studentId: "24/123456/SV/54321", avatar: "🐱" },
  { id: "6", name: "Woody", studentId: "24/123456/SV/54321", avatar: "🐱" },
  { id: "7", name: "Buzz", studentId: "24/123456/SV/54321", avatar: "🐱" },
  { id: "8", name: "Jessie", studentId: "24/123456/SV/54321", avatar: "🐱" },
  { id: "9", name: "Lotso", studentId: "24/123456/SV/54321", avatar: "🐱" },
  { id: "10", name: "T-Rex", studentId: "24/123456/SV/54321", avatar: "🐱" },
];

const ChatListApp = () => {
    const router = useRouter();

  const renderChatItem = ({ item }: { item: Student }) => (
    <TouchableOpacity style={styles.chatItem}>
      
      <View style={styles.avatarContainer}>
        <Text style={styles.avatar}>{item.avatar}</Text>
      </View>

      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>{item.name}</Text>
        <Text style={styles.studentId}>{item.studentId}</Text>
      </View>

      <TouchableOpacity
        style={styles.messageIcon}
        onPress={() => router.push("/(mahasiswa)/Chat")}
      >
        <Ionicons name="chatbubble-ellipses" size={20} color="#5B4B2A" />
      </TouchableOpacity>

    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E3F" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginRight: 12,
            padding: 8,
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Chat List</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Students</Text>
          </View>
        </View>

        <FlatList
          data={students}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B5E3F",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 38, // PERBAIKAN: Padding atas lebih besar
    paddingBottom: 10, // PERBAIKAN: Padding bawah lebih besar
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    backgroundColor: "#F5EFE0",
    borderRadius: 24, // PERBAIKAN: Border radius di semua sisi
    margin: 16, // TAMBAHAN: Margin di semua sisi agar terlihat seperti card
    paddingTop: 16,
    paddingBottom: 20,
  },
  badgeContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: "#D4AF6A",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40, // PERBAIKAN: Menambah padding bawah pada list agar item terakhir tidak terpotong
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5D9C3",
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#D4C4A8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatar: {
    fontSize: 24,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C2C2C",
    marginBottom: 2,
  },
  studentId: {
    fontSize: 12,
    color: "#666666",
  },
  messageIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#E5D9C3",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ChatListApp;