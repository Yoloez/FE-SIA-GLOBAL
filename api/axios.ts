import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const IP_ADDRESS = "192.168.0.159"; // Ganti dengan IP laptop Anda
const API_BASE_URL = `http://${IP_ADDRESS}:8000/api`;

// 1. Buat instance axios baru
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

// 2. Buat "Interceptor" atau "Pencegat"
// Kode ini akan berjalan SECARA OTOMATIS sebelum SETIAP request dikirim
api.interceptors.request.use(
  async (config) => {
    // Ambil token dari AsyncStorage
    const token = await AsyncStorage.getItem("userToken");
    if (token) {
      // Jika token ada, tempelkan ke header Authorization
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Lakukan sesuatu jika ada error saat menyiapkan request
    return Promise.reject(error);
  }
);

export default api;
