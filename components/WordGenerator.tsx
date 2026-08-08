"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Check } from "lucide-react";
import Card from "./Card";
import { AESTHETIC_WORDS } from "@/lib/words";
import { useSettings } from "@/lib/settings";

const WORDS_PER_DRAW = 6;

function shuffled(arr: string[]) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Tries a free random-word API first for effectively unlimited variety;
// falls back to the local curated list (shuffled, no repeats until the
// bag is exhausted) if the API is slow, down, or unreachable — these
// free keyless services are known to be flaky, so the generator should
// never actually break because of them.
async function fetchWordsFromApi(count: number): Promise<string[] | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`https://random-word-api.herokuapp.com/word?number=${count}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return data.slice(0, count).map((w: string) => w.toLowerCase());
  } catch {
    return null;
  }
}

export default function WordGenerator() {
  const bag = useRef<string[]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const { t } = useSettings();

  function drawFromLocalList() {
    if (bag.current.length < WORDS_PER_DRAW) {
      bag.current = shuffled(AESTHETIC_WORDS);
    }
    setWords(bag.current.splice(0, WORDS_PER_DRAW));
  }

  async function draw() {
    setCopied(null);
    const fromApi = await fetchWordsFromApi(WORDS_PER_DRAW);
    if (fromApi && fromApi.length === WORDS_PER_DRAW) {
      setWords(fromApi);
    } else {
      drawFromLocalList();
    }
  }

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copyWord(word: string) {
    try {
      if (window.pult?.copyText) {
        window.pult.copyText(word);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(word);
      } else {
        return;
      }
      setCopied(word);
      setTimeout(() => setCopied((c) => (c === word ? null : c)), 1200);
    } catch {
      // clipboard access can fail in some contexts — fail silently
    }
  }

  return (
    <Card title={t("words_title")} icon={<Sparkles size={18} />}>
      <div className="grid grid-cols-2 gap-2">
        {words.map((w, i) => (
          <button
            key={w + i}
            onClick={() => copyWord(w)}
            className="relative min-w-0 break-words rounded-2xl bg-home-accentSoft/50 px-3 py-3 text-center font-semibold text-home-accent transition-colors hover:bg-home-accentSoft"
          >
            {w}
            {copied === w && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-home-accent text-home-bg shadow-softSm">
                <Check size={12} strokeWidth={3} />
                <span className="sr-only">{t("words_copied")}</span>
              </span>
            )}
          </button>
        ))}
      </div>
      <button
        onClick={draw}
        className="mt-4 w-full rounded-xl bg-home-accentSoft py-2.5 text-sm font-semibold text-home-accent transition-colors hover:bg-home-accent hover:text-home-bg"
      >
        {t("words_button")}
      </button>
    </Card>
  );
}
