import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";

type ThemeState = {
  theme: "light" | "dark";
  toggleTheme: () => void;
};

export const useTheme = create<ThemeState>()(
  devtools(
    persist(
      immer((set) => ({
        theme: "light",
        toggleTheme: () => set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
      })),
      {
        name: "theme",
      }
    )
  )
);