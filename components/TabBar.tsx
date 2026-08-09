"use client";

import { Clock, CloudSun, Coins, ListChecks, Sparkles, Settings, Globe } from "lucide-react";
import { useSettings } from "@/lib/settings";
import type { TranslationKey } from "@/lib/translations";

const TABS = [
  { id: "clock", labelKey: "tab_clock", Icon: Clock },
  { id: "weather", labelKey: "tab_weather", Icon: CloudSun },
  { id: "currency", labelKey: "tab_currency", Icon: Coins },
  { id: "tasks", labelKey: "tab_tasks", Icon: ListChecks },
  { id: "words", labelKey: "tab_words", Icon: Sparkles },
  { id: "browser", labelKey: "tab_browser", Icon: Globe },
  { id: "settings", labelKey: "tab_settings", Icon: Settings },
] as const satisfies { id: string; labelKey: TranslationKey; Icon: typeof Clock }[];

export type TabId = (typeof TABS)[number]["id"];

export default function TabBar({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (id: TabId) => void;
}) {
  const { t } = useSettings();

  return (
    <nav className="flex flex-wrap items-center justify-end gap-1 rounded-2xl bg-home-card p-1 shadow-softSm">
      {TABS.map(({ id, labelKey, Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          aria-label={t(labelKey)}
          aria-current={active === id}
          title={t(labelKey)}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
            active === id
              ? "bg-home-accent text-home-bg"
              : "text-home-dim hover:bg-home-accentSoft hover:text-home-accent"
          }`}
        >
          <Icon size={17} strokeWidth={2} />
        </button>
      ))}
    </nav>
  );
}
