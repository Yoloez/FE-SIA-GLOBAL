import { Ionicons } from "@expo/vector-icons";
import React, { Component, ErrorInfo, ReactNode } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error dengan detail lengkap
    console.error("========================================");
    console.error("[ERROR BOUNDARY] App Crashed!");
    console.error("[ERROR BOUNDARY] Error:", error);
    console.error("[ERROR BOUNDARY] Error Message:", error.message);
    console.error("[ERROR BOUNDARY] Error Stack:", error.stack);
    console.error("[ERROR BOUNDARY] Component Stack:", errorInfo.componentStack);
    console.error("[ERROR BOUNDARY] Timestamp:", new Date().toISOString());
    console.error("========================================");

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Ionicons name="warning" size={64} color="#FF6B6B" />
            <Text style={styles.title}>Oops! Terjadi Kesalahan</Text>
            <Text style={styles.message}>Aplikasi mengalami error. Silakan restart atau hubungi tim teknis.</Text>

            <ScrollView style={styles.errorDetails}>
              <Text style={styles.errorTitle}>Error Details:</Text>
              <Text style={styles.errorText}>{this.state.error?.message}</Text>
              {__DEV__ && (
                <>
                  <Text style={styles.errorTitle}>Stack Trace:</Text>
                  <Text style={styles.errorText}>{this.state.error?.stack}</Text>
                  <Text style={styles.errorTitle}>Component Stack:</Text>
                  <Text style={styles.errorText}>{this.state.errorInfo?.componentStack}</Text>
                </>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.buttonText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#015023",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontFamily: "Urbanist-Bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    fontFamily: "Urbanist",
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  errorDetails: {
    maxHeight: 200,
    width: "100%",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 14,
    fontFamily: "Urbanist-Bold",
    color: "#333",
    marginTop: 10,
    marginBottom: 5,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Urbanist",
    color: "#666",
    lineHeight: 18,
  },
  button: {
    backgroundColor: "#015023",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Urbanist-Bold",
  },
});
