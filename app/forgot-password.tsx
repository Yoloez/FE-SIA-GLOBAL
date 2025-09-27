import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function ForgotPassword() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Halaman Lupa Password</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    color: "white",
  },
});
