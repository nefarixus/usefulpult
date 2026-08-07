"use client";

import { useEffect, useState } from "react";
import { Coins, Minus, Plus, ChevronDown, X } from "lucide-react";
import Card from "./Card";
import CurrencyPicker from "./CurrencyPicker";
import { useSettings } from "@/lib/settings";

const BASE_KEY = "pult:currencyBase";
const TARGETS_KEY = "pult:currencyTargets";
const DEFAULT_BASE = "EUR";
const DEFAULT_TARGETS = ["USD", "GBP", "JPY", "CHF"];
const STEP = 10;
const MAX_TARGETS = 6;

export default function CurrencyWidget() {
  const [base, setBase] = useState<string | null>(null);
  const [targets, setTargets] = useState<string[] | null>(null);
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [amount, setAmount] = useState(100);
  const [pickerMode, setPickerMode] = useState<"base" | "target" | null>(null);
  const { lang, t } = useSettings();

  useEffect(() => {
    const savedBase = localStorage.getItem(BASE_KEY);
    const savedTargets = localStorage.getItem(TARGETS_KEY);
    setBase(savedBase || DEFAULT_BASE);
    setTargets(savedTargets ? JSON.parse(savedTargets) : DEFAULT_TARGETS);
  }, []);

  useEffect(() => {
    if (base) localStorage.setItem(BASE_KEY, base);
  }, [base]);

  useEffect(() => {
    if (targets) localStorage.setItem(TARGETS_KEY, JSON.stringify(targets));
  }, [targets]);

  useEffect(() => {
    if (!base) return;
    setStatus("loading");
    fetch(`https://open.er-api.com/v6/latest/${base}`)
      .then((r) => {
        if (!r.ok) throw new Error("bad response");
        return r.json();
      })
      .then((json) => {
        if (json.result !== "success") throw new Error("api error");
        setRates(json.rates);
        setStatus("ok");
      })
      .catch(() => setStatus("error"));
  }, [base]);

  function selectBase(code: string) {
    setBase(code);
    setTargets((prev) => (prev ?? []).filter((c) => c !== code));
    setPickerMode(null);
  }

  function addTarget(code: string) {
    setTargets((prev) => [...(prev ?? []), code].slice(0, MAX_TARGETS));
    setPickerMode(null);
  }

  function removeTarget(code: string) {
    setTargets((prev) => (prev ?? []).filter((c) => c !== code));
  }

  return (
    <Card title={t("currency_title")} icon={<Coins size={18} />}>
      {base && (
        <button
          onClick={() => setPickerMode("base")}
          className="mb-4 flex items-center gap-1.5 rounded-xl bg-home-accentSoft/50 px-2.5 py-1.5 text-xs font-semibold text-home-accent transition-colors hover:bg-home-accentSoft"
        >
          {t("currency_from")}: {base}
          <ChevronDown size={12} />
        </button>
      )}

      {base && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-semibold text-home-dim">{base}</span>
          <div className="flex items-center overflow-hidden rounded-xl border border-home-border bg-home-bg">
            <button
              onClick={() => setAmount((a) => Math.max(0, a - STEP))}
              className="flex h-8 w-8 shrink-0 items-center justify-center text-home-dim transition-colors hover:bg-home-accentSoft hover:text-home-accent"
              aria-label="-"
            >
              <Minus size={14} />
            </button>
            <input
              type="number"
              value={amount}
              min={0}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="w-16 border-x border-home-border bg-transparent py-1.5 text-center text-home-accent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="amount"
            />
            <button
              onClick={() => setAmount((a) => a + STEP)}
              className="flex h-8 w-8 shrink-0 items-center justify-center text-home-dim transition-colors hover:bg-home-accentSoft hover:text-home-accent"
              aria-label="+"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}

      {status === "loading" && (
        <p className="text-sm text-home-dim">{t("currency_loading")}</p>
      )}
      {status === "error" && (
        <p className="text-sm text-home-coral">{t("currency_error")}</p>
      )}
      {status === "ok" && rates && targets && (
        <>
          <ul className="space-y-1">
            {targets.map((cur) => (
              <li
                key={cur}
                className="group flex items-center justify-between rounded-xl px-1 py-2 text-sm"
              >
                <span className="text-home-dim">{cur}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-home-text">
                    {rates[cur] !== undefined
                      ? (rates[cur] * amount).toLocaleString(
                          lang === "ru" ? "ru-RU" : "en-US",
                          { maximumFractionDigits: 2 }
                        )
                      : "—"}
                  </span>
                  <button
                    onClick={() => removeTarget(cur)}
                    aria-label={`remove ${cur}`}
                    className="text-home-dim opacity-0 transition-opacity hover:text-home-coral group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <X size={13} />
                  </button>
                </div>
              </li>
            ))}
            {targets.length === 0 && (
              <li className="text-sm text-home-dim">{t("currency_no_targets")}</li>
            )}
          </ul>

          {targets.length < MAX_TARGETS && (
            <button
              onClick={() => setPickerMode("target")}
              className="mt-3 flex w-full items-center justify-center rounded-2xl border border-dashed border-home-border py-2.5 text-home-dim transition-colors hover:border-home-accent hover:text-home-accent"
            >
              <Plus size={16} />
            </button>
          )}
        </>
      )}

      {pickerMode && base && (
        <CurrencyPicker
          exclude={pickerMode === "base" ? [] : [base, ...(targets ?? [])]}
          onSelect={(c) => (pickerMode === "base" ? selectBase(c.code) : addTarget(c.code))}
          onClose={() => setPickerMode(null)}
        />
      )}

      <p className="mt-3 text-center text-[10px] text-home-dim/70">
        Rates By{" "}
        <span className="underline decoration-dotted">exchangerate-api.com</span>
      </p>
    </Card>
  );
}
