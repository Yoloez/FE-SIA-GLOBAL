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
  };
  academic_period: {
    name: string;
  };
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
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Ionicons name="book-outline" size={28} color="#666" />
        </View>
      </View>
      
      <View style={styles.classInfo}>
        <Text style={styles.className}>{item.subject.name_subject}</Text>
        <Text style={styles.classDetails}>
          Kelas {item.code_class} - {item.academic_period.name}
        </Text>
      </View>
      
      <View style={styles.arrowButton}>
        <Ionicons name="chevron-forward" size={24} color="#2d5f3f" />
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
          <Ionicons name="arrow-back" size={24} color="#2d2d2d" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.courseBadge}>
            <Text style={styles.courseBadgeText}>course</Text>
          </View>
          <Text style={styles.headerTitle}>SVPL</Text>
          <Text style={styles.headerSubtitle}>kelas: PLBB, SKS 2</Text>
          <View style={styles.classCount}>
            <Ionicons name="school-outline" size={16} color="#666" />
            <Text style={styles.classCountText}>{classes.length} Mahasiswa</Text>
          </View>
        </View>
      </View>

      {/* Class List Section */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Daftar Nilai Mahasiswa</Text>
        </View>
        
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
    backgroundColor: '#F5EFD3',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderTopLeftRadius:24,
    borderTopRightRadius:24,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    marginBottom: 12,
  },
  headerContent: {
    marginTop: 8,
  },
  courseBadge: {
    backgroundColor: '#015023',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  courseBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  classCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  classCountText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  listContainer: {
    flex: 1,
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#F5EFD3',
    borderRadius: 20,
    overflow: 'hidden',
  },
  listHeader: {
    backgroundColor: '#DABC4E',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d2d2d',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexGrow: 1,
  },
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d2d2d',
    marginBottom: 4,
  },
  classDetails: {
    fontSize: 13,
    color: '#666',
  },
  arrowButton: {
    padding: 8,
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
    color: '#666',
    fontSize: 15,
    marginTop: 16,
    lineHeight: 22,
  },
});