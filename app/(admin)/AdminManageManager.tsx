import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


interface Contact {
  id: string;
  name: string;
  nim: string;
  highlight: boolean;
}

export default function ManagerScreen() {
  const [contacts, setContacts] = useState<Contact[]>([
    { id: '1', name: 'Antonio', nim: '12345678910', highlight: false },
    { id: '2', name: 'Georgino', nim: '12345678910', highlight: true },
    { id: '3', name: 'Antonio', nim: '12345678910', highlight: false },
    { id: '4', name: 'Antonio', nim: '12345678910', highlight: false },
    { id: '5', name: 'Bambang', nim: '12345678910', highlight: false },
    { id: '6', name: 'Citra', nim: '12345678910', highlight: false },
    { id: '7', name: 'Doni', nim: '12345678910', highlight: false },
    { id: '8', name: 'Eka', nim: '12345678910', highlight: false },
  ]);

 

  const deleteContact = (id: string): void => {
    setContacts(contacts.filter((contact) => contact.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a5f3f" />
      
      {/* Header */}
      <View style={styles.header}>
  <Text style={styles.headerTitle}>Manager</Text>
  <TouchableOpacity style={styles.addButton} onPress={() => console.log("Tambah data")}>
    <Ionicons
      name="add-outline"  // ikon plus
      size={28}                  // ukuran ikon 
      color="#000"               // warna ikon
    />
  </TouchableOpacity>
</View>


      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
        {contacts.map((contact) => (
          <View
            key={contact.id}
            style={[
              styles.contactCard,
              contact.highlight && styles.contactCardHighlight,
            ]}
          >
            {/* Avatar */}
            <Image source={require('../../assets/images/Rectangle.png')} style={styles.avatar} />

            {/* Info */}
            <View style={styles.contactInfo}>
              <Text style={[
                styles.contactName,
                contact.highlight && styles.contactNameHighlight,
              ]}>
                {contact.name}
              </Text>
              <Text style={[
                styles.contactnim,
                contact.highlight && styles.contactnimHighlight,
              ]}>
                {contact.nim}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionButton}>
                  <Ionicons
                    name="create-outline"   // nama icon (ikon pensil/edit)
                    size={22}               // ukuran icon
                    color={contact.highlight ? "#fff" : "#000"} // warna berubah kalau highlight
                  />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => deleteContact(contact.id)}
              >
              <Ionicons
      name="trash-outline"   // nama icon (ikon pensil/edit)
      size={22}               // ukuran icon
      color={contact.highlight ? "#fff" : "#000"} // warna berubah kalau highlight
    />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#015023',
    paddingTop:20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '300',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    color: '#1a5f3f',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5EFD3',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  contactCardHighlight: {
    backgroundColor: '#DABC4E',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: '#1a1a1a',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactNameHighlight: {
    color: '#ffffff',
  },
  contactnim: {
    color: '#666',
    fontSize: 12,
  },
  contactnimHighlight: {
    color: '#fff9e6',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 20,
  },
  actionIconHighlight: {
    color: '#ffffff',
  },
  iconImage: {
  width: 22,
  height: 22,
  tintColor: '#000', 
},

iconImageHighlight: {
  tintColor: '#fff', // biar warna berubah saat highlight
},

});
