import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export type UserRole = "client" | "freelancer" | "admin";

export type User = {
  id: string;
  name: string;
  phoneNumber: string;
  country: string;
  email: string;
  avatar?: string;
  role?: UserRole;
  createdAt?: string;
  updatedAt?: string;
  bio?: string;
  company?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  phone?: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  login: (user: User, token: string) => void;
  register: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  clearError: () => void;
};

export const useAuth = create<AuthState>()(
  devtools(
    persist(
      immer((set) => ({
        user: null,
        token: null,
        isLoading: false,
        error: null,
        isLoggedIn: false,

        login: (user, token) =>
          set((state) => {
            state.user = user;
            state.token = token;
            state.isLoggedIn = true;
            state.isLoading = false;
            state.error = null;
          }),

        register: (user, token) =>
          set((state) => {
            state.user = user;
            state.token = token;
            state.isLoggedIn = true;
            state.isLoading = false;
            state.error = null;
          }),

        logout: () =>
          set((state) => {
            state.user = null;
            state.token = null;
            state.isLoading = false;
            state.isLoggedIn = false;
            state.error = null;
          }),

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading;
          }),

        setError: (error) =>
          set((state) => {
            state.error = error;
          }),

        clearError: () =>
          set((state) => {
            state.error = null;
          }),
      })),
      {
        name: "auth-storage",
        partialize: (state) => ({ 
          user: state.user, 
          token: state.token, 
          isLoggedIn: state.isLoggedIn 
        }),
      }
    ),
    { name: "AuthStore" }
  )
);
