"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useSettings } from "@/lib/settings";
import type { Lang } from "@/lib/translations";

export type CityResult = {
  id: string;
  name: string;
  country: string;
  timezone: string;
  latitude: number;
  longitude: number;
};

const POPULAR_CITIES: Record<Lang, CityResult[]> = {
  ru: [
    { id: "moscow", name: "Москва", country: "Россия", timezone: "Europe/Moscow", latitude: 55.7558, longitude: 37.6173 },
    { id: "london", name: "Лондон", country: "Великобритания", timezone: "Europe/London", latitude: 51.5074, longitude: -0.1278 },
    { id: "newyork", name: "Нью-Йорк", country: "США", timezone: "America/New_York", latitude: 40.7128, longitude: -74.006 },
    { id: "losangeles", name: "Лос-Анджелес", country: "США", timezone: "America/Los_Angeles", latitude: 34.0522, longitude: -118.2437 },
    { id: "tokyo", name: "Токио", country: "Япония", timezone: "Asia/Tokyo", latitude: 35.6762, longitude: 139.6503 },
    { id: "paris", name: "Париж", country: "Франция", timezone: "Europe/Paris", latitude: 48.8566, longitude: 2.3522 },
    { id: "dubai", name: "Дубай", country: "ОАЭ", timezone: "Asia/Dubai", latitude: 25.2048, longitude: 55.2708 },
    { id: "sydney", name: "Сидней", country: "Австралия", timezone: "Australia/Sydney", latitude: -33.8688, longitude: 151.2093 },
  ],
  en: [
    { id: "moscow", name: "Moscow", country: "Russia", timezone: "Europe/Moscow", latitude: 55.7558, longitude: 37.6173 },
    { id: "london", name: "London", country: "United Kingdom", timezone: "Europe/London", latitude: 51.5074, longitude: -0.1278 },
    { id: "newyork", name: "New York", country: "United States", timezone: "America/New_York", latitude: 40.7128, longitude: -74.006 },
    { id: "losangeles", name: "Los Angeles", country: "United States", timezone: "America/Los_Angeles", latitude: 34.0522, longitude: -118.2437 },
    { id: "tokyo", name: "Tokyo", country: "Japan", timezone: "Asia/Tokyo", latitude: 35.6762, longitude: 139.6503 },
    { id: "paris", name: "Paris", country: "France", timezone: "Europe/Paris", latitude: 48.8566, longitude: 2.3522 },
    { id: "dubai", name: "Dubai", country: "UAE", timezone: "Asia/Dubai", latitude: 25.2048, longitude: 55.2708 },
    { id: "sydney", name: "Sydney", country: "Australia", timezone: "Australia/Sydney", latitude: -33.8688, longitude: 151.2093 },
  ],
};

function getUtcOffset(timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    const raw = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    return raw.replace("GMT", "UTC") || "UTC";
  } catch {
    return "UTC";
  }
}

// Open-Meteo's geocoding API doesn't always have a translation for every
// city in every language and silently falls back to another script —
// this filters those stragglers out so results stay in the chosen
// language instead of a mix of Cyrillic and Latin names.
function matchesLanguage(name: string, lang: Lang): boolean {
  const hasCyrillic = /[а-яёА-ЯЁ]/.test(name);
  return lang === "ru" ? hasCyrillic : !hasCyrillic;
}

export default function CityPicker({
  onSelect,
  onClose,
}: {
  onSelect: (city: CityResult) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const { lang, t } = useSettings();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    const handle = setTimeout(() => {
      fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          query
        )}&count=10&language=${lang}&format=json`
      )
        .then((r) => r.json())
        .then((json) => {
          const list: CityResult[] = (json.results ?? [])
            .map(
              (r: {
                id: number;
                name: string;
                country?: string;
                timezone: string;
                latitude: number;
                longitude: number;
              }) => ({
                id: String(r.id),
                name: r.name,
                country: r.country ?? "",
                timezone: r.timezone,
                latitude: r.latitude,
                longitude: r.longitude,
              })
            )
            .filter((r: CityResult) => matchesLanguage(r.name, lang));
          setResults(list);
          setStatus("idle");
        })
        .catch(() => setStatus("error"));
    }, 350);
    return () => clearTimeout(handle);
  }, [query, lang]);

  const popular = POPULAR_CITIES[lang];

  return (
    <div
      data-no-drag
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-6 pt-14"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-2xl border border-home-border bg-home-card p-4 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-home-border bg-home-bg px-3 py-2">
          <Search size={15} className="shrink-0 text-home-dim" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("city_search_placeholder")}
            className="min-w-0 flex-1 bg-transparent text-sm text-home-text outline-none placeholder:text-home-dim"
          />
          <button
            onClick={onClose}
            aria-label="close"
            className="shrink-0 text-home-dim hover:text-home-coral"
          >
            <X size={15} />
          </button>
        </div>

        <div className="max-h-56 overflow-y-auto">
          {query.trim().length < 2 && (
            <>
              <p className="px-1 pb-1 text-xs font-semibold text-home-dim">
                {t("city_search_popular")}
              </p>
              {popular.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onSelect(r)}
                  className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm transition-colors hover:bg-home-accentSoft"
                >
                  <span className="text-home-text">{r.name}</span>
                  <span className="text-xs text-home-dim">{getUtcOffset(r.timezone)}</span>
                </button>
              ))}
            </>
          )}
          {status === "loading" && (
            <p className="px-1 py-2 text-sm text-home-dim">{t("city_search_loading")}</p>
          )}
          {status === "error" && (
            <p className="px-1 py-2 text-sm text-home-coral">{t("city_search_error")}</p>
          )}
          {status === "idle" && query.trim().length >= 2 && results.length === 0 && (
            <p className="px-1 py-2 text-sm text-home-dim">{t("city_search_empty")}</p>
          )}
          {query.trim().length >= 2 &&
            results.map((r) => (
              <button
                key={r.id}
                onClick={() => onSelect(r)}
                className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm transition-colors hover:bg-home-accentSoft"
              >
                <span className="text-home-text">{r.name}</span>
                <span className="text-xs text-home-dim">{getUtcOffset(r.timezone)}</span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
