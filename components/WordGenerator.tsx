"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Check } from "lucide-react";
import Card from "./Card";
import { WORD_LISTS, type WordTopic } from "@/lib/words";
import { useSettings } from "@/lib/settings";

const WORDS_PER_DRAW = 6;
const TOPIC_KEY = "pult:wordTopic";
const TOPICS: WordTopic[] = ["mixed", "aesthetic", "nature", "emotions", "space"];

function shuffled(arr: string[]) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function poolFor(topic: WordTopic): string[] {
  if (topic === "mixed") return Object.values(WORD_LISTS).flat();
  return WORD_LISTS[topic];
}

// Tries a free random-word API first for the "mixed" topic — effectively
// unlimited variety, but these free keyless services are known to be
// flaky, so callers fall back to the local list if it's slow/down. Topic
// filtering isn't something the API supports, so specific topics always
// draw from the local curated lists.
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
  const bagTopic = useRef<WordTopic | null>(null);
  const [topic, setTopicState] = useState<WordTopic>("aesthetic");
  const [topicLoaded, setTopicLoaded] = useState(false);
  const [words, setWords] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const { t } = useSettings();

  useEffect(() => {
    const saved = localStorage.getItem(TOPIC_KEY) as WordTopic | null;
    if (saved && TOPICS.includes(saved)) setTopicState(saved);
    setTopicLoaded(true);
  }, []);

  function drawFromLocalList(forTopic: WordTopic) {
    if (bag.current.length < WORDS_PER_DRAW || bagTopic.current !== forTopic) {
      bag.current = shuffled(poolFor(forTopic));
      bagTopic.current = forTopic;
    }
    setWords(bag.current.splice(0, WORDS_PER_DRAW));
  }

  async function draw() {
    setCopied(null);
    if (topic === "mixed") {
      const fromApi = await fetchWordsFromApi(WORDS_PER_DRAW);
      if (fromApi && fromApi.length === WORDS_PER_DRAW) {
        setWords(fromApi);
        return;
      }
    }
    drawFromLocalList(topic);
  }

  useEffect(() => {
    if (!topicLoaded) return;
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, topicLoaded]);

  function setTopic(next: WordTopic) {
    setTopicState(next);
    localStorage.setItem(TOPIC_KEY, next);
  }

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
      <div className="mb-3 flex flex-wrap gap-1.5">
        {TOPICS.map((tp) => (
          <button
            key={tp}
            onClick={() => setTopic(tp)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              topic === tp
                ? "bg-home-accent text-home-bg"
                : "bg-home-accentSoft text-home-accent hover:bg-home-accent hover:text-home-bg"
            }`}
          >
            {t(`words_topic_${tp}` as const)}
          </button>
        ))}
      </div>

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
