"use client";

import { useEffect, useState } from "react";
import { Home as HomeIcon, Settings } from "lucide-react";
import DragHandle from "@/components/DragHandle";
import TabBar, { TabId } from "@/components/TabBar";
import Card from "@/components/Card";
import ClockWidget from "@/components/ClockWidget";
import WeatherWidget from "@/components/WeatherWidget";
import CurrencyWidget from "@/components/CurrencyWidget";
import GameChecklist from "@/components/GameChecklist";
import WordGenerator from "@/components/WordGenerator";
import MiniBrowser from "@/components/MiniBrowser";
import SettingsPanel from "@/components/SettingsPanel";
import { useSettings } from "@/lib/settings";

export default function Home() {
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<TabId>("clock");
  const { t } = useSettings();

  useEffect(() => setReady(true), []);

  const isBrowser = active === "browser";

  return (
    <DragHandle>
      <main
        className={`mx-auto flex flex-col gap-4 overflow-y-auto px-4 py-5 transition-opacity duration-500 ${
          isBrowser ? "max-w-none" : "max-w-md"
        } ${
          isBrowser ? "h-screen" : "min-h-screen justify-center"
        } ${ready ? "opacity-100" : "opacity-0"}`}
      >
        <div className="flex shrink-0 items-center justify-between gap-2">
          <div className="flex items-center gap-2 py-1 pr-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-home-accentSoft text-home-accent">
              <HomeIcon size={16} />
            </span>
            <span className="text-sm font-bold text-home-text">
              {t("app_title")}
            </span>
          </div>
          <TabBar
            active={active}
            onChange={(id) => {
              setActive(id);
              window.pult?.nudgeAcrylic?.();
            }}
          />
        </div>

        <div className={isBrowser ? "min-h-0 flex-1" : ""}>
          {active === "clock" && <ClockWidget />}
          {active === "weather" && <WeatherWidget />}
          {active === "currency" && <CurrencyWidget />}
          {active === "tasks" && <GameChecklist />}
          {active === "words" && <WordGenerator />}
          {active === "browser" && <MiniBrowser />}
          {active === "settings" && (
            <Card title={t("settings_title")} icon={<Settings size={18} />}>
              <SettingsPanel />
            </Card>
          )}
        </div>
      </main>
    </DragHandle>
  );
}
