"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, type Lang, type TranslationKey } from "./translations";

export type Theme = "amber" | "ocean" | "forest" | "rose" | "custom";

const THEME_KEY = "pult:theme";
const LANG_KEY = "pult:lang";
const CUSTOM_ACCENT_KEY = "pult:customAccent";
const DEFAULT_CUSTOM_ACCENT = "#e3a955";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

// Every role below (bg, card, text...) uses the saturation/lightness the
// "amber" preset actually uses at that role, just re-hued to whatever the
// person picks — so a custom color gets a genuinely cohesive dark shell
// built around it, the same way the 4 preset themes work, instead of a
// single accent color floating on top of a fixed unrelated background.
const ROLES: Record<string, [number, number]> = {
  "--color-bg": [0.13, 0.09],
  "--color-card": [0.18, 0.12],
  "--color-card-hover": [0.18, 0.14],
  "--color-border": [0.2, 0.17],
  "--color-text": [0.3, 0.9],
  "--color-dim": [0.16, 0.59],
  "--color-accent-soft": [0.3, 0.18],
};

function applyCustomPalette(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  const [h] = rgbToHsl(r, g, b);
  const root = document.documentElement.style;
  for (const [cssVar, [s, l]] of Object.entries(ROLES)) {
    root.setProperty(cssVar, hslToRgb(h, s, l).join(" "));
  }
  // The accent itself keeps the exact color the person picked.
  root.setProperty("--color-accent", `${r} ${g} ${b}`);
}

function clearCustomPalette() {
  const root = document.documentElement.style;
  for (const cssVar of Object.keys(ROLES)) root.removeProperty(cssVar);
  root.removeProperty("--color-accent");
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
      applyCustomPalette(customAccent);
    } else {
      clearCustomPalette();
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
    if (theme === "custom") applyCustomPalette(hex);
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
