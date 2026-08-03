"use client";

import { useEffect, useState } from "react";
import { Quote } from "lucide-react";
import Card from "./Card";
import { quoteOfTheDay } from "@/lib/quotes";

export default function QuoteWidget() {
  const [quote, setQuote] = useState<{ text: string; author: string } | null>(
    null
  );

  useEffect(() => {
    setQuote(quoteOfTheDay(new Date()));
  }, []);

  return (
    <Card title="Цитата дня" icon={<Quote size={18} />}>
      {quote ? (
        <blockquote>
          <p className="text-lg leading-relaxed text-home-text">
            «{quote.text}»
          </p>
          <footer className="mt-3 text-sm text-home-dim">
            — {quote.author}
          </footer>
        </blockquote>
      ) : (
        <p className="text-sm text-home-dim">загрузка...</p>
      )}
    </Card>
  );
}
