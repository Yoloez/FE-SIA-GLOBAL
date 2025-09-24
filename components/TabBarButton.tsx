// components/TabBarButton.tsx
import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

const TabBarButton: React.FC<BottomTabBarButtonProps> = ({ children, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.button}>{children}</View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    top: -28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 1,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#48B3AF", // Anda bisa ganti warnanya
    justifyContent: "center",
    alignItems: "center",
  },
});

export default TabBarButton;
