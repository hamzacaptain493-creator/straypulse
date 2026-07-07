import { useEffect, useState } from "react";

export type AccentTheme = {
  id: string;
  name: string;
  hue: number;
  chroma: number;
  lightness: number;
  swatch: string;
};

export const ACCENT_THEMES: AccentTheme[] = [
  { id: "default", name: "Default", hue: 25, chroma: 0.18, lightness: 0.68, swatch: "#F97316" },
  { id: "sunset", name: "Sunset Glow", hue: 15, chroma: 0.2, lightness: 0.7, swatch: "#FB7185" },
  { id: "ocean", name: "Ocean Wave", hue: 230, chroma: 0.15, lightness: 0.62, swatch: "#3B82F6" },
  { id: "leaf", name: "Leaf", hue: 145, chroma: 0.15, lightness: 0.6, swatch: "#22C55E" },
  { id: "pastel", name: "Pastel Bloom", hue: 320, chroma: 0.11, lightness: 0.75, swatch: "#F0ABFC" },
  { id: "neon", name: "Neon Pulse", hue: 295, chroma: 0.24, lightness: 0.6, swatch: "#A855F7" },
];

const ACCENT_KEY = "straypulse:accent";
const DARK_KEY = "straypulse:dark";

function applyAccent(theme: AccentTheme) {
  const root = document.documentElement;
  root.style.setProperty("--accent-hue", String(theme.hue));
  root.style.setProperty("--accent-chroma", String(theme.chroma));
  root.style.setProperty("--accent-lightness", String(theme.lightness));
}

function applyDark(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

export function useTheme() {
  const [accentId, setAccentId] = useState<string>("default");
  const [dark, setDark] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const savedAccent = localStorage.getItem(ACCENT_KEY) ?? "default";
    const savedDark = localStorage.getItem(DARK_KEY) === "1";
    setAccentId(savedAccent);
    setDark(savedDark);
    setHydrated(true);
    const theme = ACCENT_THEMES.find((t) => t.id === savedAccent) ?? ACCENT_THEMES[0];
    applyAccent(theme);
    applyDark(savedDark);
  }, []);

  const selectAccent = (id: string) => {
    const theme = ACCENT_THEMES.find((t) => t.id === id) ?? ACCENT_THEMES[0];
    setAccentId(id);
    localStorage.setItem(ACCENT_KEY, id);
    applyAccent(theme);
  };

  const toggleDark = (value?: boolean) => {
    const next = value ?? !dark;
    setDark(next);
    localStorage.setItem(DARK_KEY, next ? "1" : "0");
    applyDark(next);
  };

  return { accentId, dark, hydrated, selectAccent, toggleDark };
}
