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
// Broadcasting endpoint uses same base as API
const BASE_URL = API_URL;

const BROADCAST_PROVIDER = process.env.EXPO_PUBLIC_BROADCAST_PROVIDER || "pusher";

// Pusher Configuration (Production)
// DEFAULT KEY MUST MATCH LARAVEL BACKEND! App ID: 2087883
const PUSHER_KEY = process.env.EXPO_PUBLIC_PUSHER_KEY || "6f48052a427175b2fff8";
const PUSHER_CLUSTER = process.env.EXPO_PUBLIC_PUSHER_CLUSTER || "ap1";
const PUSHER_HOST = process.env.EXPO_PUBLIC_PUSHER_HOST || "ws.pusherapp.com";
const PUSHER_PORT = parseInt(process.env.EXPO_PUBLIC_PUSHER_PORT || "443", 10);
const PUSHER_TLS = (process.env.EXPO_PUBLIC_PUSHER_TLS || "true") === "true";

// Reverb Configuration (Local Development)
const REVERB_KEY = process.env.EXPO_PUBLIC_REVERB_APP_KEY || process.env.EXPO_PUBLIC_REVERB_KEY || "rfmp9pmudhfkb6dvdybr";
const REVERB_HOST = process.env.EXPO_PUBLIC_REVERB_HOST || "localhost";
const REVERB_PORT = parseInt(process.env.EXPO_PUBLIC_REVERB_PORT || "9090", 10);
const REVERB_TLS = (process.env.EXPO_PUBLIC_REVERB_TLS || "false") === "true";

console.log("🔧 Echo Config:", {
  provider: BROADCAST_PROVIDER,
  apiUrl: API_URL,
  baseUrl: BASE_URL,
  pusherKey: PUSHER_KEY.substring(0, 8) + "...",
  cluster: PUSHER_CLUSTER,
});

// Echo configuration berdasarkan provider
const echoConfig: any =
  BROADCAST_PROVIDER === "pusher"
    ? {
        // Pusher Configuration (Production) - Matches Next.js echo.js structure
        broadcaster: "pusher" as const,
        key: PUSHER_KEY,
        cluster: PUSHER_CLUSTER,
        forceTLS: true, // Always true for Pusher cloud
        authorizer: (channel: any) => ({
          authorize: async (socketId: string, callback: (error: boolean | Error, authData?: any) => void) => {
            try {
              const token = await AsyncStorage.getItem("userToken");
              if (!token) {
                console.error("❌ [Pusher Auth] No token found via AsyncStorage");
                return callback(true, { error: "Token otentikasi tidak ditemukan." });
              }

              console.log("🔐 [Pusher Auth] Channel:", channel.name, "| SocketID:", socketId);
              console.log("🔐 [Pusher Auth] Endpoint:", `${BASE_URL}/broadcasting/auth`);
              console.log("🔐 [Pusher Auth] Has Token:", !!token);

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
                  timeout: 15000,
                }
              );

              console.log("✅ [Pusher Auth] Success:", channel.name);
              console.log("✅ [Pusher Auth] Response:", JSON.stringify(response.data));
              callback(false, response.data);
            } catch (error) {
              console.error("❌ [Pusher Auth] Failed:", channel.name);
              if (axios.isAxiosError(error)) {
                console.error("❌ [Pusher Auth] Status:", error.response?.status);
                console.error("❌ [Pusher Auth] Data:", JSON.stringify(error.response?.data));
                console.error("❌ [Pusher Auth] Message:", error.message);
                return callback(true, { status: error.response?.status, error: error.message });
              }
              console.error("❌ [Pusher Auth] Error:", error);
              callback(true, { error: String(error) });
            }
          },
        }),
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
                  console.error("❌ [Reverb Auth] No token found via AsyncStorage");
                  const error = new Error("Token otentikasi tidak ditemukan.");
                  callback(error, null);
                  return;
                }

                console.log("🔐 [Reverb Auth] Channel:", channel.name, "| SocketID:", socketId);
                console.log("🔐 [Reverb Auth] Endpoint:", `${BASE_URL}/broadcasting/auth`);

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
                    timeout: 15000, // 15 second timeout
                  }
                );

                console.log("✅ [Reverb Auth] Success:", channel.name);
                console.log("✅ [Reverb Auth] Response:", JSON.stringify(response.data));
                callback(null, response.data);
              } catch (error) {
                console.error("❌ [Reverb Auth] Failed:", channel.name);
                if (axios.isAxiosError(error)) {
                  console.error("❌ [Reverb Auth] Status:", error.response?.status);
                  console.error("❌ [Reverb Auth] Data:", JSON.stringify(error.response?.data));
                  console.error("❌ [Reverb Auth] Message:", error.message);
                  callback(new Error(`Auth failed: ${error.response?.status || error.message}`), null);
                } else {
                  console.error("❌ [Reverb Auth] Error:", error);
                  callback(error as Error, null);
                }
              }
            },
          };
        },
      };

// Initialize Echo
const echo = new Echo(echoConfig);

// Log connection status with enhanced monitoring
if (echo.connector && (echo.connector as any).pusher) {
  const pusherConnection = (echo.connector as any).pusher.connection;
  const pusherInstance = (echo.connector as any).pusher;

  // Log Pusher config untuk debugging
  console.log("🔍 [DEBUG] Pusher Instance Config:", {
    key: pusherInstance.key,
    cluster: pusherInstance.config.cluster,
    encrypted: pusherInstance.config.encrypted,
    forceTLS: pusherInstance.config.forceTLS,
    authEndpoint: pusherInstance.config.authEndpoint,
    wsHost: pusherInstance.config.wsHost,
    wsPort: pusherInstance.config.wsPort,
    wssPort: pusherInstance.config.wssPort,
  });

  pusherConnection.bind("connected", () => {
    console.log("🟢 WebSocket Connected:", BROADCAST_PROVIDER.toUpperCase());
    console.log("🆔 Socket ID:", pusherConnection.socket_id);
  });

  pusherConnection.bind("connecting", () => {
    console.log("🔄 WebSocket Connecting...");
  });

  pusherConnection.bind("disconnected", () => {
    console.log("🔴 WebSocket Disconnected:", BROADCAST_PROVIDER.toUpperCase());
  });

  pusherConnection.bind("unavailable", () => {
    console.warn("⚠️ WebSocket Unavailable - will retry");
  });

  pusherConnection.bind("failed", () => {
    console.error("❌ WebSocket Connection Failed");
    console.error("🔍 [DEBUG] Connection Error Details:", {
      state: pusherConnection.state,
      socketId: pusherConnection.socket_id,
      activityTimeout: pusherConnection.activityTimeout,
    });
  });

  pusherConnection.bind("error", (error: any) => {
    console.error("❌ WebSocket Error:", JSON.stringify(error, null, 2));
    console.error("🔍 [DEBUG] Error Type:", error?.type || "unknown");
    console.error("🔍 [DEBUG] Error Data:", error?.data || "no data");
    console.error("🔍 [DEBUG] Error Error:", error?.error || "no error object");
  });

  pusherConnection.bind("state_change", (states: any) => {
    console.log(`🔄 WebSocket State: ${states.previous} → ${states.current}`);
    if (states.current === "failed") {
      console.error("🔍 [DEBUG] Failed State Info:", {
        previous: states.previous,
        current: states.current,
        key: PUSHER_KEY.substring(0, 10) + "...",
        cluster: PUSHER_CLUSTER,
        endpoint: `${BASE_URL}/broadcasting/auth`,
      });
    }
  });

  // Log initial connection state
  console.log("📡 Initial WebSocket State:", pusherConnection.state);
}

export default echo;
