"use client";

import { useEffect, useState } from "react";
import { CloudSun, MapPin, ChevronDown } from "lucide-react";
import Card from "./Card";
import CityPicker, { type CityResult } from "./CityPicker";
import { describeWeather } from "@/lib/weatherCodes";
import { useSettings } from "@/lib/settings";
import { DAYS_SHORT } from "@/lib/translations";

const STORAGE_KEY = "pult:weatherCity";

// Fallback coordinates used only if no city is chosen and browser
// geolocation also fails/is denied. Electron's built-in geolocation
// needs a Google API key to work reliably in packaged apps, so it
// often silently falls through to this — pick a city above instead
// for accurate results.
const FALLBACK_COORDS = { lat: 49.4521, lon: 11.0767 };

type WeatherState = {
  temp: number;
  feelsLike: number;
  code: number;
  hourly: { hour: number; temp: number; code: number }[];
  daily: { day: string; max: number; min: number; code: number }[];
} | null;

export default function WeatherWidget() {
  const [data, setData] = useState<WeatherState>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [city, setCity] = useState<CityResult | null>(null);
  const [cityLoaded, setCityLoaded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { lang, t } = useSettings();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setCity(JSON.parse(saved));
      } catch {
        // ignore corrupt storage
      }
    }
    setCityLoaded(true);
  }, []);

  useEffect(() => {
    if (!cityLoaded) return;
    let cancelled = false;
    setStatus("loading");

    function fetchWeather(lat: number, lon: number) {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,apparent_temperature,weather_code` +
        `&hourly=temperature_2m,weather_code` +
        `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
        `&forecast_days=4&timezone=auto`;
      fetch(url)
        .then((r) => r.json())
        .then((json) => {
          if (cancelled) return;

          // Open-Meteo returns naive local-time strings for the queried
          // city (e.g. "2026-08-08T19:00"), not UTC — parsing those with
          // `new Date(iso)` interprets them in the *viewer's* timezone,
          // which is wrong for any city other than the viewer's own. All
          // the parsing below works on the string digits directly instead.

          const daily = json.daily.time.slice(0, 4).map((iso: string, i: number) => {
            const [y, m, d] = iso.split("-").map(Number);
            const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
            return {
              day: DAYS_SHORT[lang][dow],
              max: Math.round(json.daily.temperature_2m_max[i]),
              min: Math.round(json.daily.temperature_2m_min[i]),
              code: json.daily.weather_code[i],
            };
          });

          const cityNowKey = new Intl.DateTimeFormat("en-US", {
            timeZone: json.timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            hour12: false,
          })
            .formatToParts(new Date())
            .reduce((acc, p) => {
              if (p.type === "year") acc.y = p.value;
              if (p.type === "month") acc.m = p.value;
              if (p.type === "day") acc.d = p.value;
              if (p.type === "hour") acc.h = p.value === "24" ? "00" : p.value;
              return acc;
            }, {} as Record<string, string>);
          const nowKey = `${cityNowKey.y}-${cityNowKey.m}-${cityNowKey.d}T${cityNowKey.h}`;

          const hourlyTimes: string[] = json.hourly.time;
          let startIdx = hourlyTimes.findIndex((t: string) => t.slice(0, 13) >= nowKey);
          if (startIdx === -1) startIdx = 0;
          const hourly = hourlyTimes.slice(startIdx, startIdx + 10).map((iso, i) => ({
            hour: Number(iso.slice(11, 13)),
            temp: Math.round(json.hourly.temperature_2m[startIdx + i]),
            code: json.hourly.weather_code[startIdx + i],
          }));

          setData({
            temp: Math.round(json.current.temperature_2m),
            feelsLike: Math.round(json.current.apparent_temperature),
            code: json.current.weather_code,
            hourly,
            daily,
          });
          setStatus("ok");
        })
        .catch(() => !cancelled && setStatus("error"));
    }

    if (city) {
      fetchWeather(city.latitude, city.longitude);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(FALLBACK_COORDS.lat, FALLBACK_COORDS.lon),
        { timeout: 5000 }
      );
    } else {
      fetchWeather(FALLBACK_COORDS.lat, FALLBACK_COORDS.lon);
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, cityLoaded, lang]);

  function selectCity(c: CityResult) {
    setCity(c);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    setPickerOpen(false);
  }

  const current = data ? describeWeather(data.code) : null;

  return (
    <Card title={t("weather_title")} icon={<CloudSun size={18} />}>
      <button
        onClick={() => setPickerOpen(true)}
        className="mb-4 flex items-center gap-1.5 rounded-xl bg-home-accentSoft/50 px-2.5 py-1.5 text-xs font-semibold text-home-accent transition-colors hover:bg-home-accentSoft"
      >
        <MapPin size={12} />
        {city ? city.name : t("weather_auto_location")}
        <ChevronDown size={12} />
      </button>

      {status === "loading" && (
        <p className="text-sm text-home-dim">{t("weather_locating")}</p>
      )}
      {status === "error" && (
        <p className="text-sm text-home-coral">{t("weather_error")}</p>
      )}
      {status === "ok" && data && current && (
        <>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-home-accentSoft text-home-accent">
              <current.Icon size={32} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-4xl font-extrabold text-home-text">
                {data.temp}°
              </p>
              <p className="text-sm text-home-dim">
                {t(`weather_${current.key}`)} · {t("weather_feels_like")} {data.feelsLike}°
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {data.hourly.map((h, i) => {
              const { Icon } = describeWeather(h.code);
              return (
                <div
                  key={i}
                  className="flex shrink-0 flex-col items-center gap-1 rounded-2xl bg-home-accentSoft/30 px-3 py-2 text-center"
                >
                  <p className="text-xs text-home-dim">
                    {i === 0 ? t("weather_now") : `${h.hour}:00`}
                  </p>
                  <Icon size={16} className="text-home-accent" strokeWidth={1.75} />
                  <p className="text-sm text-home-text">{h.temp}°</p>
                </div>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {data.daily.map((d, i) => {
              const { Icon } = describeWeather(d.code);
              return (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1 rounded-2xl bg-home-accentSoft/40 py-3 text-center"
                >
                  <p className="text-xs text-home-dim">{d.day}</p>
                  <Icon size={18} className="text-home-accent" strokeWidth={1.75} />
                  <p className="text-sm text-home-text">{d.max}°</p>
                  <p className="text-xs text-home-dim">{d.min}°</p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {pickerOpen && (
        <CityPicker onSelect={selectCity} onClose={() => setPickerOpen(false)} />
      )}
    </Card>
  );
}
