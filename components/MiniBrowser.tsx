"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, ArrowLeft, ArrowRight, RotateCw, X, House } from "lucide-react";
import Card from "./Card";
import { useSettings } from "@/lib/settings";

const HOME_URL = "https://www.google.com";
const STORAGE_KEY = "pult:browserLastUrl";

type WebviewEl = HTMLElement & {
  src: string;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  stop: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  loadURL: (url: string) => Promise<void>;
};

function normalizeInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return HOME_URL;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const looksLikeDomain = /^[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(trimmed);
  if (looksLikeDomain) return `https://${trimmed}`;
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

export default function MiniBrowser() {
  const webviewRef = useRef<WebviewEl | null>(null);
  const [addressInput, setAddressInput] = useState("");
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const { t } = useSettings();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const start = saved || HOME_URL;
    setCurrentUrl(start);
    setAddressInput(start);
  }, []);

  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv) return;

    function onStart() {
      setLoading(true);
    }
    function onStop() {
      setLoading(false);
      try {
        setCanGoBack(wv!.canGoBack());
        setCanGoForward(wv!.canGoForward());
      } catch {
        // webview not ready yet — ignore
      }
    }
    function onNavigate(e: Event) {
      const url = (e as unknown as { url: string }).url;
      if (!url) return;
      setAddressInput(url);
      localStorage.setItem(STORAGE_KEY, url);
    }

    wv.addEventListener("did-start-loading", onStart);
    wv.addEventListener("did-stop-loading", onStop);
    wv.addEventListener("did-navigate", onNavigate);
    wv.addEventListener("did-navigate-in-page", onNavigate);

    return () => {
      wv.removeEventListener("did-start-loading", onStart);
      wv.removeEventListener("did-stop-loading", onStop);
      wv.removeEventListener("did-navigate", onNavigate);
      wv.removeEventListener("did-navigate-in-page", onNavigate);
    };
  }, [currentUrl]);

  function go() {
    const target = normalizeInput(addressInput);
    setAddressInput(target);
    setCurrentUrl(target);
  }

  return (
    <Card title={t("browser_title")} icon={<Globe size={18} />} className="flex h-full flex-col">
      <div className="mb-2 flex items-center gap-1">
        <button
          onClick={() => webviewRef.current?.goBack()}
          disabled={!canGoBack}
          aria-label="back"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-home-dim transition-colors hover:bg-home-accentSoft hover:text-home-accent disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ArrowLeft size={14} />
        </button>
        <button
          onClick={() => webviewRef.current?.goForward()}
          disabled={!canGoForward}
          aria-label="forward"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-home-dim transition-colors hover:bg-home-accentSoft hover:text-home-accent disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ArrowRight size={14} />
        </button>
        <button
          onClick={() => (loading ? webviewRef.current?.stop() : webviewRef.current?.reload())}
          aria-label={loading ? "stop" : "reload"}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-home-dim transition-colors hover:bg-home-accentSoft hover:text-home-accent"
        >
          {loading ? <X size={14} /> : <RotateCw size={14} />}
        </button>
        <button
          onClick={() => {
            setAddressInput(HOME_URL);
            setCurrentUrl(HOME_URL);
          }}
          aria-label="home"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-home-dim transition-colors hover:bg-home-accentSoft hover:text-home-accent"
        >
          <House size={14} />
        </button>
        <input
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder={t("browser_placeholder")}
          className="min-w-0 flex-1 rounded-lg border border-home-border bg-home-bg px-2.5 py-1.5 text-xs text-home-text outline-none focus-visible:border-home-accent"
        />
      </div>
      <div
        data-no-drag
        className="min-h-0 flex-1 overflow-hidden rounded-xl border border-home-border"
      >
        {currentUrl && (
          <webview
            ref={webviewRef as unknown as React.RefObject<HTMLElement>}
            src={currentUrl}
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </div>
    </Card>
  );
}
