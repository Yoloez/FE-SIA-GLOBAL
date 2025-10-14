import React from "react";
import { Dimensions, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
const { width } = Dimensions.get("window");

const Profil = () => {
//   import React from 'react';
// import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';

// export default function ProfileScreen() {
  return (
    <View style={styles.container}>
  <StatusBar barStyle="light-content" backgroundColor="#1a5f3f" />
      

      {/* Main Content */}
      <View style={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Text style={styles.profileTitle}>Profile</Text>
          
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: '' }}
              style={styles.avatar}
            />
          </View>

          {/* Info Fields */}
          <View style={styles.infoContainer}>
            <Text style={styles.label}>Name:</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Wachyoudi</Text>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.label}>NIM:</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>24/123456/SV/12345</Text>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.label}>Major:</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>D4 Teknologi Rekayasa Perangkat Lunak</Text>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.label}>Generation:</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>2024</Text>
            </View>
          </View>

          {/* Buttons */}
          <TouchableOpacity style={styles.settingButton}>
            <Text style={styles.settingButtonText}>Setting</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        
        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingHorizontal:0,
    paddingTop:0,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop:0,
  },
  profileCard: {
    backgroundColor: '#1a5f3f',
    borderRadius: 0,
    padding: 30,
    paddingBottom: 40,
    flex: 1,
  },
  profileTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8d5b7',
  },
  infoContainer: {
    marginBottom: 15,
  },
  label: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 5,
    marginLeft: 5,
  },
  infoBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoText: {
    color: '#ffffff',
    fontSize: 14,
  },
  settingButton: {
    backgroundColor: '#d4b676',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  settingButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#e8d5b7',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 10,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8d5b7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  navButtonActive: {
    transform: [{ scale: 1.1 }],
  },
});

export default Profil; 
