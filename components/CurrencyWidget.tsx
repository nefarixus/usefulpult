"use client";

import { useEffect, useState } from "react";
import { Coins, Minus, Plus } from "lucide-react";
import Card from "./Card";
import { useSettings } from "@/lib/settings";

const TARGETS = ["USD", "GBP", "JPY", "CHF"];
const STEP = 10;

export default function CurrencyWidget() {
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [amount, setAmount] = useState(100);
  const { lang, t } = useSettings();

  useEffect(() => {
    const url = `https://api.frankfurter.dev/v1/latest?base=EUR&symbols=${TARGETS.join(",")}`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("bad response");
        return r.json();
      })
      .then((json) => {
        setRates(json.rates);
        setStatus("ok");
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <Card title={t("currency_title")} icon={<Coins size={18} />}>
      {status === "loading" && (
        <p className="text-sm text-home-dim">{t("currency_loading")}</p>
      )}
      {status === "error" && (
        <p className="text-sm text-home-coral">{t("currency_error")}</p>
      )}
      {status === "ok" && rates && (
        <>
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-home-dim">€</span>
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
          <ul className="space-y-1">
            {TARGETS.map((cur) => (
              <li
                key={cur}
                className="flex items-center justify-between rounded-xl px-1 py-2 text-sm"
              >
                <span className="text-home-dim">{cur}</span>
                <span className="font-semibold text-home-text">
                  {(rates[cur] * amount).toLocaleString(lang === "ru" ? "ru-RU" : "en-US", {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
