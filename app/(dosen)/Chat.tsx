import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function ChatRoom() {
  const router = useRouter();
  const [message, setMessage] = useState('');

  const chatData = [
    {
      id: 1,
      name: 'Tomo. S.Kom',
      message: 'Halo halo namaku tomo, hanan is my love',
      time: '25/09/2025 0:23',
      isUser: false
    },
    {
      id: 2,
      name: 'revaldos',
      message: 'hehe not bad',
      time: '25/09/2025 0:24',
      isUser: true
    }
  ];

  return (
    <>
      {/* SEMBUNYIKAN TAB BAR KHUSUS HALAMAN INI */}
      <Stack.Screen
        options={{
          headerShown: false,
         
        }}
      />

      <View style={{ flex: 1, backgroundColor: '#015023' }}>
        <StatusBar barStyle="light-content" backgroundColor="#015023" />

        {/* HEADER */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
         paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 8 : 8,

          backgroundColor: '#015023',
          elevation: 4,
        }}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.push("/(dosen)/ListChat")}
            style={{
              marginRight: 12,
              padding: 8,
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={{
            width: 40,
            height: 40,
            backgroundColor: '#fff3e0',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 20,
            marginRight: 12
          }}>
            <Text style={{ fontSize: 20 }}>🐱</Text>
          </View>

          <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
            Tomo. S.Kom
          </Text>
        </View>

        {/* MAIN CONTENT */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >

          {/* CHAT LIST */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingTop: 26, paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
          >
            {chatData.map(chat => (
              <View key={chat.id} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>

                  <View style={{
                    width: 32,
                    height: 32,
                    backgroundColor: chat.isUser ? '#e3f2fd' : '#fff3e0',
                    borderRadius: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 10,
                    marginTop: 2
                  }}>
                    <Text style={{ fontSize: 16 }}>{chat.isUser ? '👤' : '🐱'}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                      <Text style={{ color: 'white', fontWeight: '700', marginRight: 8, fontSize: 15 }}>
                        {chat.name}
                      </Text>
                      <Text style={{ color: '#90caa8', fontSize: 12 }}>{chat.time}</Text>
                    </View>

                    <Text style={{ color: 'white', lineHeight: 22, fontSize: 15 }}>
                      {chat.message}
                    </Text>
                  </View>

                </View>
              </View>
            ))}
          </ScrollView>

          {/* INPUT AREA FIXED */}
          <View style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#015023",
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: Platform.OS === 'ios' ? 20 : 12,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.1)'
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'white',
              borderRadius: 25,
              paddingLeft: 16,
              paddingRight: 6,
              paddingVertical: 6,
              elevation: 3
            }}>
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 15,
                  paddingVertical: 8,
                  paddingRight: 8,
                  color: '#333'
                }}
                placeholder="Message"
                placeholderTextColor="#999"
                value={message}
                onChangeText={setMessage}
              />

              <TouchableOpacity
                style={{
                  backgroundColor: '#e8a54f',
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="send" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </View>

        </KeyboardAvoidingView>
      </View>
    </>
  );
}
