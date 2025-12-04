import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// Install: npm install lucide-react-native
import { router } from 'expo-router';
import { ChevronRight, UserCheck } from 'lucide-react-native';
export default function PresencePage() {
  return (
    <View style={styles.container}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <Text style={styles.title}>Presence Page</Text>
        <Text style={styles.subtitle}>Tomo, S.Kom</Text>
      </View>

      {/* Menu Options */}
      <View style={styles.menuContainer}>

 <TouchableOpacity
      style={styles.menuItem}
      onPress={() => router.push('/_presencePage')} 
    >
      <View style={styles.iconContainer}>
        <UserCheck size={28} color="#000" strokeWidth={2} />
      </View>
      <Text style={styles.menuText}>Manual Attendance</Text>
      <ChevronRight size={22} color="#fff" />
    </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#015023',
    paddingTop: 64,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  headerCard: {
    backgroundColor: '#F5EFD3',
    borderRadius: 24,
    padding: 40,
    marginBottom: 32,
    minHeight: 200,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  menuContainer: {
    gap: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#fff',
  },
});