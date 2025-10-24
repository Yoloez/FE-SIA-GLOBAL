import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ImageBackground, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ScheduleScreen() {
  const [selectedDate, setSelectedDate] = useState(25);
  
  const dates = [
    { day: 'MON', date: 22 },
    { day: 'TUE', date: 23 },
    { day: 'WED', date: 24 },
    { day: 'THU', date: 25, active: true },
    { day: 'FRI', date: 26 },
    { day: 'SAT', date: 27 },
    { day: 'SUN', date: 28 },
  ];

  const schedules = [
    {
      id: 1,
      time: '09:15 - 10:55',
      title: 'Analisis dan Desain Perangkat Lunak',
      code: 'Calab JLR20 SAC 2',
      lecturer: 'Fahrudin Mukti Wibowo, S.Kom., M.Cs',
      room: 'R. Kuliah CU 207',
    },
    {
      id: 2,
      time: '09:15 - 10:55',
      title: 'Analisis dan Desain Perangkat Lunak',
      code: 'Calab JLR20 SAC 2',
      lecturer: 'Fahrudin Mukti Wibowo, S.Kom., M.Cs',
      room: 'R. Kuliah CU 207',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#015023" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Schedule</Text>
        <TouchableOpacity style={styles.calendarButton}>
          <Ionicons name="calendar-outline" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Week Navigation */}
        <View style={styles.weekNav}>
          <TouchableOpacity>
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.weekText}>This Week</Text>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Date Display */}
        <View style={styles.dateDisplay}>
          <Text style={styles.dateNumber}>25</Text>
          <View>
            <Text style={styles.dayName}>Thursday</Text>
            <Text style={styles.monthYear}>September 2025</Text>
          </View>
        </View>

        {/* Date Selector */}
        <View style={styles.dateSelector}>
          {dates.map((item) => (
            <TouchableOpacity
              key={item.date}
              style={[
                styles.dateItem,
                item.active && styles.dateItemActive,
              ]}
              onPress={() => setSelectedDate(item.date)}
            >
              <Text style={[
                styles.dateDay,
                item.active && styles.dateDayActive,
              ]}>
                {item.day}
              </Text>
              <Text style={[
                styles.dateNum,
                item.active && styles.dateNumActive,
              ]}>
                {item.date}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Schedule Cards with Image Background */}
        <View style={styles.scheduleList}>
          {schedules.map((schedule) => (
            <ImageBackground
              key={schedule.id}
              source={require('../../assets/images/batik.png') }
              style={styles.scheduleCard}
              imageStyle={styles.scheduleCardImage}
            >
              {/* Overlay */}
              <View style={styles.cardOverlay}>
                <View style={styles.cardHeader}>
                  <View style={styles.scheduleLabel}>
                    <Text style={styles.scheduleLabelText}>Schedule</Text>
                  </View>
                  <Text style={styles.scheduleTime}>{schedule.time}</Text>
                </View>
                
                <Text style={styles.scheduleTitle}>{schedule.title}</Text>
                <Text style={styles.scheduleCode}>{schedule.code}</Text>
                
                <View style={styles.scheduleInfo}>
                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={16} color="#1a1a1a" style={styles.infoIcon} />
                    <Text style={styles.infoText}>{schedule.lecturer}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color="#1a1a1a" style={styles.infoIcon} />
                    <Text style={styles.infoText}>{schedule.room}</Text>
                  </View>
                </View>
              </View>
            </ImageBackground>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#015023',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop:30,
  },
  backButton: {
    width: 35,
  },
  backIcon: {
    color: '#ffffff',
    fontSize: 24,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  calendarButton: {
    width: 35,
    alignItems: 'flex-end',
  },
  calendarIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
  },
  navArrow: {
    color: '#ffffff',
    fontSize: 24,
    paddingHorizontal: 20,
  },
  weekText: {
    color: '#ffffff',
    fontSize: 16,
    paddingHorizontal: 20,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center',

  },
  dateNumber: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: 'bold',
    marginRight: 15,
  },
  dayName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  monthYear: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.8,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateItem: {
    backgroundColor: '#F5EFD3',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  dateItemActive: {
    backgroundColor: '#DABC4E',
  },
  dateDay: {
    color: '#015023',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  dateDayActive: {
    color: '#1a1a1a',
  },
  dateNum: {
    color: '#015023',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateNumActive: {
    color: '#1a1a1a',
  },
  scheduleList: {
    paddingBottom: 20,
  },
  scheduleCard: {
    borderRadius: 20,
    marginBottom: 15,
    overflow: 'hidden'
  },
  scheduleCardImage: {
    borderRadius: 20,
    opacity: 0.2, // Atur opacity gambar (0.1 - 1.0)
  },
  cardOverlay: {
    backgroundColor: 'rgba(232, 213, 183, 0.85)', // Overlay semi-transparent
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleLabel: {
    backgroundColor: '#d4b676',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scheduleLabelText: {
    color: '#015023',
    fontSize: 12,
    fontWeight: '600',
  },
  scheduleTime: {
    color: '#015023',
    fontSize: 14,
    fontWeight: '600',
  },
  scheduleTitle: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scheduleCode: {
    color: '#666',
    fontSize: 12,
    marginBottom: 12,
  },
  scheduleInfo: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    color: '#1a1a1a',
    fontSize: 13,
    flex: 1,
  },
});