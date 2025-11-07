import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/axios";

interface LecturerClass {
  id_class: number;
  code_class: string;
  subject: {
    name_subject: string;
    sks: number;
  };
  academic_period: {
    name: string;
  };
  room?: string;
  schedule?: string;
  student_count?: number;
}

export default function LecturerClassesScreen() {
  const [classes, setClasses] = useState<LecturerClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/lecturer/classes");
      setClasses(response.data.data);
    } catch (error) {
      alert("Gagal memuat daftar kelas Anda.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchClasses();
    }, [fetchClasses])
  );

  const renderItem = ({ item }: { item: LecturerClass }) => (
    <TouchableOpacity
      style={styles.classCard}
      onPress={() => router.push(`/(dosen)/class-grades/${item.id_class}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.leftSection}>
          <View style={styles.courseBadge}>
            <Text style={styles.courseBadgeText}>Kelas</Text>
          </View>
        </View>
        
        <View style={styles.rightSection}>
          <Text style={styles.scheduleText}>
            {item.schedule || "09:15 - 10:55"}
          </Text>
        </View>
      </View>
      
      <View style={styles.classDetails}>
        <Text style={styles.className}>{item.subject.name_subject}</Text>
        <Text style={styles.classCode}>
          Class: {item.code_class}, SKS: {item.subject.sks || 2}
        </Text>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="people" size={16} color="#8B7355" />
            <Text style={styles.infoText}>
              {item.student_count || 80} Student
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="location" size={16} color="#8B7355" />
            <Text style={styles.infoText}>
              {item.room || "R.Kelas CU 207"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen 
        options={{ 
          headerShown: false 
        }} 
      />
      
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backText}>Kelas</Text>
        </TouchableOpacity>
      </View>

      {/* Class List Section */}
      <View style={styles.listContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2d5f3f" />
          </View>
        ) : (
          <FlatList
            data={classes}
            renderItem={renderItem}
            keyExtractor={(item) => item.id_class.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>
                  Anda belum ditugaskan untuk mengajar di kelas manapun.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#015023',
  },
  headerContainer: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  classCard: {
    backgroundColor: '#F5EFD3',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseBadge: {
    backgroundColor: '#D4A574',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  courseBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  scheduleText: {
    fontSize: 13,
    color: '#8B7355',
    fontWeight: '500',
  },
  classDetails: {
    marginTop: 4,
  },
  className: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: 4,
  },
  classCode: {
    fontSize: 13,
    color: '#8B7355',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#8B7355',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 15,
    marginTop: 16,
    lineHeight: 22,
  },
});