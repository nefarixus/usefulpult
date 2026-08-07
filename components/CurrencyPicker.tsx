"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useSettings } from "@/lib/settings";
import { CURRENCIES, type Currency } from "@/lib/currencies";

export default function CurrencyPicker({
  exclude = [],
  onSelect,
  onClose,
}: {
  exclude?: string[];
  onSelect: (currency: Currency) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
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

  const q = query.trim().toLowerCase();
  const results = CURRENCIES.filter((c) => {
    if (exclude.includes(c.code)) return false;
    if (!q) return true;
    return (
      c.code.toLowerCase().includes(q) ||
      c.ru.toLowerCase().includes(q) ||
      c.en.toLowerCase().includes(q)
    );
  });

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
            placeholder={t("currency_search_placeholder")}
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
          {results.length === 0 && (
            <p className="px-1 py-2 text-sm text-home-dim">{t("city_search_empty")}</p>
          )}
          {results.map((c) => (
            <button
              key={c.code}
              onClick={() => onSelect(c)}
              className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm transition-colors hover:bg-home-accentSoft"
            >
              <span className="text-home-text">{c.code}</span>
              <span className="truncate pl-3 text-xs text-home-dim">
                {lang === "ru" ? c.ru : c.en}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
