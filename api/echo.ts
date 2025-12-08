import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Echo from "laravel-echo";
import Pusher from "pusher-js/react-native";

// Set Pusher globally untuk Laravel Echo
(window as any).Pusher = Pusher;

// Enable logging untuk debugging (disable di production)
const isDevelopment = __DEV__;
if (isDevelopment) {
  Pusher.logToConsole = true;
}

// Get environment variables
const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://api.trisuladana.com/api";
const BASE_URL = API_URL.replace("/api", ""); // Remove /api suffix untuk broadcasting endpoint

const BROADCAST_PROVIDER = process.env.EXPO_PUBLIC_BROADCAST_PROVIDER || "pusher";

// Pusher Configuration (Production)
const PUSHER_KEY = process.env.EXPO_PUBLIC_PUSHER_KEY || "6f48052a427175b2fff8";
const PUSHER_CLUSTER = process.env.EXPO_PUBLIC_PUSHER_CLUSTER || "ap1";
const PUSHER_HOST = process.env.EXPO_PUBLIC_PUSHER_HOST || "ws.pusherapp.com";
const PUSHER_PORT = parseInt(process.env.EXPO_PUBLIC_PUSHER_PORT || "443", 10);
const PUSHER_TLS = process.env.EXPO_PUBLIC_PUSHER_TLS === "true";

// Reverb Configuration (Local Development)
const REVERB_KEY = process.env.EXPO_PUBLIC_REVERB_APP_KEY || "rfmp9pmudhfkb6dvdybr";
const REVERB_HOST = process.env.EXPO_PUBLIC_REVERB_HOST || "localhost";
const REVERB_PORT = parseInt(process.env.EXPO_PUBLIC_REVERB_PORT || "9090", 10);
const REVERB_TLS = process.env.EXPO_PUBLIC_REVERB_TLS === "true";

console.log("🔧 Echo Config:", {
  provider: BROADCAST_PROVIDER,
  apiUrl: API_URL,
  baseUrl: BASE_URL,
});

// Echo configuration berdasarkan provider
const echoConfig: any =
  BROADCAST_PROVIDER === "pusher"
    ? {
        // Pusher Configuration (Production)
        broadcaster: "pusher" as const,
        key: PUSHER_KEY,
        cluster: PUSHER_CLUSTER,
        wsHost: PUSHER_HOST,
        wsPort: PUSHER_PORT,
        wssPort: PUSHER_PORT,
        forceTLS: PUSHER_TLS,
        encrypted: PUSHER_TLS,
        enabledTransports: PUSHER_TLS ? ["wss"] : ["ws"],
        disableStats: true,
        authEndpoint: `${BASE_URL}/broadcasting/auth`,
        auth: {
          headers: {
            Accept: "application/json",
          },
        },
        authorizer: (channel: any) => {
          return {
            authorize: async (socketId: string, callback: (error: Error | null, authData: any) => void) => {
              try {
                const token = await AsyncStorage.getItem("userToken");
                if (!token) {
                  throw new Error("Token otentikasi tidak ditemukan.");
                }

                console.log("🔐 Pusher Auth - Channel:", channel.name);

                const response = await axios.post(
                  `${BASE_URL}/broadcasting/auth`,
                  {
                    socket_id: socketId,
                    channel_name: channel.name,
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      Accept: "application/json",
                      "Content-Type": "application/json",
                    },
                  }
                );

                console.log("✅ Pusher Auth Success:", channel.name);
                callback(null, response.data);
              } catch (error) {
                console.error("❌ Pusher Auth Failed:", channel.name);
                if (axios.isAxiosError(error)) {
                  console.error("❌ Status:", error.response?.status);
                  console.error("❌ Data:", error.response?.data);
                } else {
                  console.error("❌ Error:", error);
                }
                callback(error as Error, null);
              }
            },
          };
        },
      }
    : {
        // Reverb Configuration (Local Development)
        broadcaster: "reverb" as const,
        key: REVERB_KEY,
        wsHost: REVERB_HOST,
        wsPort: REVERB_PORT,
        wssPort: REVERB_PORT,
        forceTLS: REVERB_TLS,
        enabledTransports: REVERB_TLS ? ["wss"] : ["ws"],
        authorizer: (channel: any) => {
          return {
            authorize: async (socketId: string, callback: (error: Error | null, authData: any) => void) => {
              try {
                const token = await AsyncStorage.getItem("userToken");
                if (!token) {
                  throw new Error("Token otentikasi tidak ditemukan.");
                }

                console.log("🔐 Reverb Auth - Channel:", channel.name);

                const response = await axios.post(
                  `${BASE_URL}/broadcasting/auth`,
                  {
                    socket_id: socketId,
                    channel_name: channel.name,
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      Accept: "application/json",
                      "Content-Type": "application/json",
                    },
                  }
                );

                console.log("✅ Reverb Auth Success:", channel.name);
                callback(null, response.data);
              } catch (error) {
                console.error("❌ Reverb Auth Failed:", channel.name);
                if (axios.isAxiosError(error)) {
                  console.error("❌ Status:", error.response?.status);
                  console.error("❌ Data:", error.response?.data);
                } else {
                  console.error("❌ Error:", error);
                }
                callback(error as Error, null);
              }
            },
          };
        },
      };

// Initialize Echo
const echo = new Echo(echoConfig);

// Log connection status
if (echo.connector && (echo.connector as any).pusher) {
  const pusherConnection = (echo.connector as any).pusher.connection;

  pusherConnection.bind("connected", () => {
    console.log("🟢 WebSocket Connected:", BROADCAST_PROVIDER.toUpperCase());
  });

  pusherConnection.bind("disconnected", () => {
    console.log("🔴 WebSocket Disconnected:", BROADCAST_PROVIDER.toUpperCase());
  });

  pusherConnection.bind("error", (error: any) => {
    console.error("❌ WebSocket Error:", error);
  });

  pusherConnection.bind("state_change", (states: any) => {
    console.log("🔄 WebSocket State Change:", states.current);
  });
}

export default echo;
