/**
 * Theme tokens. Dark art-deco by default; an optional light palette. `useTheme()` is reactive
 * to the user's theme setting, so toggling it re-renders the whole app.
 */
import { useUserStore } from "@/store/userStore";

export interface Palette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  hairline: string;
  gold: string;
  goldDim: string;
  text: string;
  textDim: string;
  textFaint: string;
  danger: string;
  success: string;
  overlay: string;
}

const darkColor: Palette = {
  bg: "#0E0E10",
  surface: "#17171B",
  surfaceAlt: "#1F1F25",
  border: "#2C2C34",
  hairline: "#C9A24B",
  gold: "#D9B25A",
  goldDim: "#8A6F37",
  text: "#F3EEE3",
  textDim: "#A8A29A",
  textFaint: "#6E6A63",
  danger: "#C8553D",
  success: "#5C8A5A",
  overlay: "rgba(0,0,0,0.6)",
};

const lightColor: Palette = {
  bg: "#F5F1E8",
  surface: "#FFFFFF",
  surfaceAlt: "#ECE5D6",
  border: "#D9CFB8",
  hairline: "#B8923C",
  gold: "#9C7A2E",
  goldDim: "#E6D6AE",
  text: "#1A1714",
  textDim: "#6B6358",
  textFaint: "#9A9081",
  danger: "#B23A26",
  success: "#3F6B3D",
  overlay: "rgba(0,0,0,0.35)",
};

const shared = {
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radius: { sm: 8, md: 12, lg: 18, pill: 999 },
  font: { display: "PlayfairDisplay_700Bold", body: "System" },
  fontSize: { xs: 12, sm: 14, md: 16, lg: 20, xl: 26, xxl: 34 },
} as const;

export const darkTheme = { color: darkColor, ...shared };
export const lightTheme = { color: lightColor, ...shared };
export type Theme = typeof darkTheme;

export const theme = darkTheme; // default for any non-hook usage

export function useTheme(): Theme {
  const mode = useUserStore((s) => s.theme);
  return mode === "light" ? lightTheme : darkTheme;
}
