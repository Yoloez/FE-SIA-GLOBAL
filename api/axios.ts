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

export default api;
