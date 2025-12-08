import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// 1. Baca URL API dari environment variable.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_BASE_URL) {
  alert("Error: Alamat API belum diatur di file .env");
}

// 2. Buat instance axios baru dengan konfigurasi terpusat.
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

// 3. Buat "Interceptor" untuk menambahkan token secara otomatis.
// Kode ini akan berjalan sebelum SETIAP request dikirim.
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("userToken");
    if (token) {
      // Jika token ada, tempelkan ke header Authorization
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 4. Response interceptor untuk handle 401 Unauthorized (auto logout)
api.interceptors.response.use(
  (response) => {
    // Request berhasil, return response
    return response;
  },
  async (error) => {
    console.log("========================================");
    console.log("[AXIOS INTERCEPTOR] Response Error Detected");
    console.log("[AXIOS INTERCEPTOR] Status:", error.response?.status);
    console.log("[AXIOS INTERCEPTOR] Message:", error.response?.data?.message);
    console.log("========================================");

    // Jika error 401 (Unauthorized), auto logout
    if (error.response?.status === 401) {
      console.log("[AXIOS INTERCEPTOR] 401 Unauthorized - Auto logout triggered");

      // Clear storage
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userData");

      // Set flag untuk trigger re-render di AuthContext
      await AsyncStorage.setItem("forceLogout", "true");

      console.log("[AXIOS INTERCEPTOR] User data cleared, redirecting to login...");
    }

    return Promise.reject(error);
  }
);

export default api;
