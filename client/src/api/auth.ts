import { AUTH_API_URL } from "../config";
import { request } from "./http";

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface RegisteredUser {
  _id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export const authApi = {
  signup: (email: string, password: string) =>
    request<RegisteredUser>(`${AUTH_API_URL}/auth/signup`, { method: "POST", body: { email, password } }),

  login: (email: string, password: string) =>
    request<AuthTokens>(`${AUTH_API_URL}/auth/login`, { method: "POST", body: { email, password } }),

  logout: () => request<Record<string, never>>(`${AUTH_API_URL}/auth/logout`, { method: "POST", auth: true }),
};
