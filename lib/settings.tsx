"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, type Lang, type TranslationKey } from "./translations";

export type Theme = "amber" | "ocean" | "forest" | "rose" | "custom";

const THEME_KEY = "pult:theme";
const LANG_KEY = "pult:lang";
const CUSTOM_ACCENT_KEY = "pult:customAccent";
const DEFAULT_CUSTOM_ACCENT = "#e3a955";

// A dark reference point shared by all preset themes — close enough for
// blending a readable "soft" tint out of any arbitrary picked color.
const DARK_REF: [number, number, number] = [27, 24, 21];

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: [number, number, number], b: [number, number, number], t: number) {
  return a.map((v, i) => Math.round(v * (1 - t) + b[i] * t)) as [number, number, number];
}

function applyCustomAccent(hex: string) {
  const rgb = hexToRgb(hex);
  const soft = mix(rgb, DARK_REF, 0.75);
  document.documentElement.style.setProperty("--color-accent", rgb.join(" "));
  document.documentElement.style.setProperty("--color-accent-soft", soft.join(" "));
}

function clearCustomAccent() {
  document.documentElement.style.removeProperty("--color-accent");
  document.documentElement.style.removeProperty("--color-accent-soft");
}

type Ctx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
  customAccent: string;
  setCustomAccent: (hex: string) => void;
};

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("amber");
  const [lang, setLang] = useState<Lang>("ru");
  const [customAccent, setCustomAccentState] = useState<string>(DEFAULT_CUSTOM_ACCENT);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
    const savedLang = localStorage.getItem(LANG_KEY) as Lang | null;
    const savedAccent = localStorage.getItem(CUSTOM_ACCENT_KEY);
    if (savedAccent) setCustomAccentState(savedAccent);
    if (savedTheme) setThemeState(savedTheme);
    if (savedLang) setLang(savedLang);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme === "custom" ? "amber" : theme);
    localStorage.setItem(THEME_KEY, theme);
    if (theme === "custom") {
      applyCustomAccent(customAccent);
    } else {
      clearCustomAccent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  function setTheme(next: Theme) {
    setThemeState(next);
  }

  function setCustomAccent(hex: string) {
    setCustomAccentState(hex);
    localStorage.setItem(CUSTOM_ACCENT_KEY, hex);
    if (theme === "custom") applyCustomAccent(hex);
  }

  function t(key: TranslationKey) {
    return translations[lang][key] ?? translations.ru[key] ?? key;
  }

  return (
    <SettingsContext.Provider
      value={{ theme, setTheme, lang, setLang, t, customAccent, setCustomAccent }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
