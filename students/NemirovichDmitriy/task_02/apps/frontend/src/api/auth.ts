import api, { setAccessToken } from "./client";
import type { ApiResponse, User } from "../types";

interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface RegisterDto {
  email: string;
  username: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export const authApi = {
  register: async (dto: RegisterDto): Promise<User> => {
    const response = await api.post<ApiResponse<AuthResponse>>("/auth/register", dto);
    const { accessToken, user } = response.data.data!;
    setAccessToken(accessToken);
    return user;
  },

  login: async (dto: LoginDto): Promise<User> => {
    const response = await api.post<ApiResponse<AuthResponse>>("/auth/login", dto);
    const { accessToken, user } = response.data.data!;
    setAccessToken(accessToken);
    return user;
  },

  refresh: async (): Promise<User | null> => {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>("/auth/refresh");
      const { accessToken, user } = response.data.data!;
      setAccessToken(accessToken);
      return user;
    } catch {
      setAccessToken(null);
      return null;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } finally {
      setAccessToken(null);
    }
  },

  me: async (): Promise<User> => {
    const response = await api.get<ApiResponse<{ user: User }>>("/users/me");
    return response.data.data!.user;
  },
};
