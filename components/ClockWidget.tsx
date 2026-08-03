"use client";

import { useEffect, useState } from "react";
import { Clock, Plus, X } from "lucide-react";
import Card from "./Card";
import CityPicker, { type CityResult } from "./CityPicker";
import { useSettings } from "@/lib/settings";
import { DAYS, MONTHS } from "@/lib/translations";

const STORAGE_KEY = "pult:extraClocks";
const MAX_EXTRA = 2;

export default function ClockWidget() {
  const [now, setNow] = useState<Date | null>(null);
  const [extra, setExtra] = useState<CityResult[] | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { lang, t } = useSettings();

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    setExtra(saved ? JSON.parse(saved) : []);
  }, []);

  useEffect(() => {
    if (extra) localStorage.setItem(STORAGE_KEY, JSON.stringify(extra));
  }, [extra]);

  function addCity(city: CityResult) {
    setExtra((prev) => [...(prev ?? []), city].slice(0, MAX_EXTRA));
    setPickerOpen(false);
  }

  function removeCity(id: string) {
    setExtra((prev) => (prev ?? []).filter((c) => c.id !== id));
  }

  const pad = (n: number) => n.toString().padStart(2, "0");

  function formatCityTime(tz: string) {
    if (!now) return "--:--";
    try {
      return new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-US", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now);
    } catch {
      return "--:--";
    }
  }

  return (
    <Card title={t("clock_title")} icon={<Clock size={18} />} className="relative">
      <div className="text-5xl font-extrabold tracking-tight text-home-accent">
        {now ? (
          <>
            {pad(now.getHours())}:{pad(now.getMinutes())}
            <span className="ml-2 text-xl font-semibold text-home-dim">
              {pad(now.getSeconds())}
            </span>
          </>
        ) : (
          "--:--"
        )}
      </div>
      <p className="mt-2 text-base text-home-dim">
        {now
          ? `${DAYS[lang][now.getDay()]}, ${now.getDate()} ${MONTHS[lang][now.getMonth()]} ${now.getFullYear()}`
          : "\u00A0"}
      </p>

      {extra && extra.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 border-t border-home-border pt-4">
          {extra.map((c) => (
            <div
              key={c.id}
              className="group flex items-center justify-between rounded-2xl bg-home-accentSoft/40 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-home-text">{c.name}</p>
                <p className="truncate text-xs text-home-dim">{c.country}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-lg font-bold text-home-accent">
                  {formatCityTime(c.timezone)}
                </span>
                <button
                  onClick={() => removeCity(c.id)}
                  aria-label="remove"
                  className="text-home-dim opacity-0 transition-opacity hover:text-home-coral group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {extra && extra.length < MAX_EXTRA && (
        <button
          onClick={() => setPickerOpen(true)}
          aria-label="add city clock"
          className="mt-3 flex w-full items-center justify-center rounded-2xl border border-dashed border-home-border py-3 text-home-dim transition-colors hover:border-home-accent hover:text-home-accent"
        >
          <Plus size={18} />
        </button>
      )}

      {pickerOpen && (
        <CityPicker onSelect={addCity} onClose={() => setPickerOpen(false)} />
      )}
    </Card>
  );
}
