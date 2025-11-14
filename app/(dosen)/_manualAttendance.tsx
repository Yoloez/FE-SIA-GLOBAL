import { router } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


export default function AttendanceList() {
  const [students, setStudents] = useState([
    { id: 1, name: 'Woody', nim: '24/123456/SV/54321', checked: false },
    { id: 2, name: 'Buzz', nim: '24/123456/SV/54321', checked: true },
    { id: 3, name: 'Jessie', nim: '24/123456/SV/54321', checked: false },
    { id: 4, name: 'Lotso', nim: '24/123456/SV/54321', checked: false },
    { id: 5, name: 'T-Rex', nim: '24/123456/SV/54321', checked: false },
    { id: 6, name: 'Woody', nim: '24/123456/SV/54321', checked: true },
    { id: 7, name: 'Buzz', nim: '24/123456/SV/54321', checked: false },
    { id: 8, name: 'Jessie', nim: '24/123456/SV/54321', checked: false },
    { id: 9, name: 'Rex', nim: '24/123456/SV/54321', checked: false },
    { id: 10, name: 'Hamm', nim: '24/123456/SV/54321', checked: false },
    { id: 11, name: 'Woody', nim: '24/123456/SV/54321', checked: true },
    { id: 12, name: 'Buzz', nim: '24/123456/SV/54321', checked: false },
    { id: 13, name: 'Jessie', nim: '24/123456/SV/54321', checked: false },
    { id: 14, name: 'Rex', nim: '24/123456/SV/54321', checked: false },
    { id: 15, name: 'Hamm', nim: '24/123456/SV/54321', checked: false },
     { id: 16, name: 'Hamm', nim: '24/123456/SV/54321', checked: false },
    { id: 17, name: 'Woody', nim: '24/123456/SV/54321', checked: true },
    { id: 18, name: 'Buzz', nim: '24/123456/SV/54321', checked: false },
    { id: 19, name: 'Jessie', nim: '24/123456/SV/54321', checked: false },
    { id: 20, name: 'Rex', nim: '24/123456/SV/54321', checked: false },
    { id: 21, name: 'Hamm', nim: '24/123456/SV/54321', checked: false },
  ]);

  const toggleStudent = (id) => {
    setStudents(students.map(student => 
      student.id === id ? { ...student, checked: !student.checked } : student
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}
         onPress={() => router.push('/_presencePage')}
        >
          <ArrowLeft size={24} color="#fff" />
          <Text style={styles.headerText}>Attendance</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Student List Card */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            {/* Course Info */}
            <View style={styles.courseInfo}>
              <Text style={styles.courseTitle}>Analisis dan Desain Perangkat Lunak</Text>
              <Text style={styles.courseDetail}>Class: PL3BB</Text>
              <Text style={styles.courseDetail}>Student: 50</Text>
            </View>

            {/* Student List */}
            <View style={styles.studentList}>
              {students.map((student) => (
                <TouchableOpacity
                  key={student.id}
                  style={styles.studentItem}
                  onPress={() => toggleStudent(student.id)}
                  activeOpacity={0.7}
                >
                  {/* Avatar */}
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>?</Text>
                  </View>
                  
                  {/* Info */}
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentNim}>{student.nim}</Text>
                  </View>

                  {/* Checkbox */}
                  <View style={styles.checkbox}>
                    {student.checked && (
                      <Check size={18} strokeWidth={3} color="#000" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#015023',
    paddingTop: 20,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Padding besar untuk navigasi bottom
  },
  cardContainer: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#F5EFD3',
    borderRadius: 24,
    padding: 20,
  },
  courseInfo: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  courseDetail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  studentList: {
    // Hapus flex: 1
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingVertical: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: '#d1d5db',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  studentNim: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  saveButton: {
    backgroundColor: '#DABC4E',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
});