import { router } from 'expo-router';
import { ArrowLeft, Calendar, ChevronDown, Clock } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';


export default function ManualAttendanceForm() {
  const [course, setCourse] = useState('Analisis Desain Perangkat Lunak-PL3BB');
  const [date, setDate] = useState('25. Sept 2025');
  const [time, setTime] = useState('09:15 - 10:55');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/presensi')}
        >
          <ArrowLeft size={24} color="#fff" />
          <Text style={styles.headerText}>Presence Page</Text>
        </TouchableOpacity>
      </View>

      {/* Form Card */}
      <View style={styles.formWrapper}>
        <View style={styles.formCard}>
          {/* Course-Class */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Course-Class</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={course}
                onChangeText={setCourse}
              />
              <ChevronDown size={20} color="#000" style={styles.icon} />
            </View>
          </View>

          {/* Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
              />
              <Calendar size={20} color="#000" style={styles.icon} />
            </View>
          </View>

          {/* Time */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Time</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={time}
                onChangeText={setTime}
              />
              <Clock size={20} color="#000" style={styles.icon} />
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton}
            onPress={() => router.push('/presensi')}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneButton}
            onPress={() => router.push('/_manualAttendance')}
            >
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#015023',
  },
  header: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 8,
  },
  formWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  formCard: {
    backgroundColor: '#F5EFD3',
    borderRadius: 24,
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingRight: 44,
    fontSize: 14,
    backgroundColor: 'transparent',
  },
  icon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 32,
  },
  cancelButton: {
    backgroundColor: '#b91c1c',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  doneButton: {
    backgroundColor: '#15803d',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});