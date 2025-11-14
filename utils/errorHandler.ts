import axios from "axios";

export interface ApiError {
  message: string;
  status?: number;
  isNetworkError?: boolean;
}

/**
 * Handle error dari API dengan konsisten
 */
export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.message || `Error ${error.response.status}`,
        status: error.response.status,
      };
    } else if (error.request) {
      // Request made but no response
      return {
        message: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
        isNetworkError: true,
      };
    }
  }

  // Unknown error
  return {
    message: "Terjadi kesalahan yang tidak diketahui.",
  };
};

/**
 * Wrapper untuk abort requests saat component unmount
 */
export const createAbortController = () => {
  if (typeof AbortController !== "undefined") {
    return new AbortController();
  }
  return null;
};

/**
 * Check apakah request dibatalkan
 */
export const isAbortError = (error: unknown): boolean => {
  return axios.isAxiosError(error) && error.code === "ERR_CANCELED";
};
