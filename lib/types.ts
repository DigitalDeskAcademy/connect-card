// API response type for server actions
export type ApiResponse<T = never> = {
  status: "success" | "error";
  message: string;
  shouldRefresh?: boolean; // Optional flag to refresh page after success
  data?: T; // Optional data returned from successful operations (e.g., created entities)
};
