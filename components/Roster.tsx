"use client";

import { useState } from "react";
import type { Session } from "@/lib/types";
import { SKILL_BANDS } from "@/lib/types";
import { RatingBadge } from "./ui";

interface Props {
  session: Session;
  onAdd: (name: string, band: number) => void;
  onToggle: (playerId: string) => void;
  onRemove: (playerId: string) => void;
}

export function Roster({ session, onAdd, onToggle, onRemove }: Props) {
  const [name, setName] = useState("");
  const [band, setBand] = useState(3.0);

  const activeCount = session.players.filter((p) => p.active).length;

  return (
    <div className="space-y-4">
      <form
        className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800"
        onSubmit={(e) => {
          e.preventDefault();
          onAdd(name, band);
          setName("");
        }}
      >
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Add player…"
            className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-transparent px-3 py-2.5 text-base outline-none focus:border-court dark:border-neutral-700"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-court px-4 py-2.5 font-semibold text-white active:scale-95 hover:bg-court-dark"
          >
            Add
          </button>
        </div>
        <div className="mt-3">
          <span className="mb-1.5 block text-xs font-medium text-neutral-500">
            Skill band
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SKILL_BANDS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBand(b)}
                className={`rounded-full px-3 py-1 text-sm font-semibold tabular-nums transition ${
                  band === b
                    ? "bg-court text-white"
                    : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                }`}
              >
                {b.toFixed(1)}
              </button>
            ))}
          </div>
        </div>
      </form>

      <div className="flex items-center justify-between px-1 text-sm text-neutral-500">
        <span>
          {session.players.length} player{session.players.length === 1 ? "" : "s"}
        </span>
        <span>{activeCount} checked in</span>
      </div>

      <ul className="space-y-2">
        {session.players.length === 0 && (
          <li className="rounded-xl border border-dashed border-neutral-300 py-8 text-center text-sm text-neutral-400 dark:border-neutral-700">
            Add everyone who showed up tonight.
          </li>
        )}
        {session.players.map((p) => (
          <li
            key={p.id}
            className={`flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800 ${
              p.active ? "" : "opacity-50"
            }`}
          >
            <button
              onClick={() => onToggle(p.id)}
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
                p.active
                  ? "bg-court text-white"
                  : "bg-neutral-200 text-neutral-500 dark:bg-neutral-700"
              }`}
              aria-label={p.active ? "check out" : "check in"}
            >
              {p.active ? "✓" : "–"}
            </button>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{p.name}</div>
              <div className="text-xs text-neutral-400">
                {p.gamesPlayed} game{p.gamesPlayed === 1 ? "" : "s"} · started{" "}
                {p.startRating.toFixed(1)}
              </div>
            </div>
            <RatingBadge rating={p.rating} />
            <button
              onClick={() => onRemove(p.id)}
              className="shrink-0 px-2 text-neutral-300 hover:text-red-500"
              aria-label="remove player"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
