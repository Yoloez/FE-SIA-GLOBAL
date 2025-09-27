import React from "react";
import { StyleSheet, Text, View } from "react-native";

const schedule = () => {
  return (
    <View style={styles.container}>
      <Text>schedule</Text>
    </View>
  );
};

export default schedule;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#015023",
    alignItems: "center",
    justifyContent: "center",
  },
});
