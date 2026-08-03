"use client";

import { useEffect, useRef, useState } from "react";
import { ListChecks, Check, GripVertical } from "lucide-react";
import Card from "./Card";
import { useSettings } from "@/lib/settings";

type Item = { id: string; label: string; done: boolean };

const STORAGE_KEY = "pult:checklist";

export default function GameChecklist() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [draft, setDraft] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragId = useRef<string | null>(null);
  const { t } = useSettings();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    setItems(saved ? JSON.parse(saved) : []);
  }, []);

  useEffect(() => {
    if (items) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function toggle(id: string) {
    setItems((prev) =>
      prev!.map((it) => (it.id === id ? { ...it, done: !it.done } : it))
    );
  }

  function remove(id: string) {
    setItems((prev) => prev!.filter((it) => it.id !== id));
  }

  function add() {
    const label = draft.trim();
    if (!label) return;
    setItems((prev) => [
      ...(prev ?? []),
      { id: crypto.randomUUID(), label, done: false },
    ]);
    setDraft("");
  }

  function handleDragStart(id: string) {
    dragId.current = id;
    setDraggingId(id);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(targetId: string) {
    const fromId = dragId.current;
    dragId.current = null;
    setDraggingId(null);
    if (!fromId || fromId === targetId) return;
    setItems((prev) => {
      const list = [...(prev ?? [])];
      const fromIdx = list.findIndex((it) => it.id === fromId);
      const toIdx = list.findIndex((it) => it.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return list;
      const [moved] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, moved);
      return list;
    });
  }

  return (
    <Card title={t("tasks_title")} icon={<ListChecks size={18} />}>
      <ul className="space-y-1.5">
        {items?.map((it) => (
          <li
            key={it.id}
            draggable
            data-no-drag
            onDragStart={() => handleDragStart(it.id)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(it.id)}
            onDragEnd={() => {
              dragId.current = null;
              setDraggingId(null);
            }}
            className={`group flex items-center gap-2 rounded-xl px-1 py-1.5 text-sm transition-opacity ${
              draggingId === it.id ? "opacity-40" : ""
            }`}
          >
            <span className="cursor-grab text-home-dim opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
              <GripVertical size={14} />
            </span>
            <label className="flex flex-1 cursor-pointer items-center gap-3">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  it.done
                    ? "border-home-sage bg-home-sage text-home-bg"
                    : "border-home-border bg-home-bg"
                }`}
              >
                {it.done && <Check size={13} strokeWidth={3} />}
              </span>
              <input
                type="checkbox"
                checked={it.done}
                onChange={() => toggle(it.id)}
                className="sr-only"
              />
              <span
                className={
                  it.done ? "text-home-dim line-through" : "text-home-text"
                }
              >
                {it.label}
              </span>
            </label>
            <button
              onClick={() => remove(it.id)}
              aria-label={`Удалить «${it.label}»`}
              className="text-home-dim opacity-0 transition-opacity hover:text-home-coral group-hover:opacity-100 focus-visible:opacity-100"
            >
              ×
            </button>
          </li>
        ))}
        {items?.length === 0 && (
          <li className="text-sm text-home-dim">{t("tasks_empty")}</li>
        )}
      </ul>

      <div className="mt-4 flex gap-2 border-t border-home-border pt-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={t("tasks_placeholder")}
          className="min-w-0 flex-1 rounded-xl border border-home-border bg-home-bg px-3 py-2 text-sm text-home-text placeholder:text-home-dim outline-none focus-visible:border-home-accent"
        />
        <button
          onClick={add}
          className="rounded-xl bg-home-accentSoft px-4 text-sm font-semibold text-home-accent transition-colors hover:bg-home-accent hover:text-home-bg"
        >
          +
        </button>
      </div>
    </Card>
  );
}
