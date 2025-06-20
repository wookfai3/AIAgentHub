import { apiRequest } from "./queryClient";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    username: string;
  };
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    return response.json();
  },

  logout: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiRequest("POST", "/api/auth/logout");
    return response.json();
  },

  checkAuth: async (): Promise<{ authenticated: boolean }> => {
    const response = await apiRequest("GET", "/api/auth/me");
    return response.json();
  },
};
