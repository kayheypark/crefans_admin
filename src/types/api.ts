// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

// Privacy toggle response data type
export interface PrivacyToggleResponse {
  id: string;
  isPublic: boolean;
}

// Privacy toggle API response type
export type PrivacyToggleApiResponse = ApiResponse<PrivacyToggleResponse>;