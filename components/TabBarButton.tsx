// components/TabBarButton.tsx
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

const TabBarButton = ({ children, onPress, bgColor }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.9}>
      <View style={[styles.button, { backgroundColor: bgColor }]}>{children}</View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    top: -25, // Mengangkat tombol ke atas
    justifyContent: "center",
    alignItems: "center",
    // --- Shadow ---
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4.65,
    elevation: 8,
  },
  button: {
    borderWidth: 1,
    width: 70, // Lebih besar dari tombol lain
    height: 70,
    borderColor: "#DABC4E",
    borderRadius: 35, // Setengah dari width/height agar bulat sempurna
    justifyContent: "center",
    alignItems: "center",
  },
});

export default TabBarButton;
