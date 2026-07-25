"use client";

import { useEffect, useMemo, useState } from "react";
import {
  clearRegulars,
  loadRegulars,
  regularsLeaderboard,
  type LeaderboardSort,
  type RegularsStore,
} from "@/lib/regulars";
import { RatingBadge } from "./ui";

const SORTS: { key: LeaderboardSort; label: string; banner: string }[] = [
  { key: "loyal", label: "Loyal", banner: "Most loyal regular" },
  { key: "wins", label: "Wins", banner: "Most wins" },
  { key: "winRate", label: "Win %", banner: "Best win rate" },
  { key: "rating", label: "Rating", banner: "Highest rated" },
];

/**
 * Cross-session leaderboard built from every session run on this device.
 * Answers "who always shows up and plays" (Loyal) and "who's winning" (Wins /
 * Win % / Rating) from the same local registry.
 */
export function Leaderboard() {
  const [store, setStore] = useState<RegularsStore | null>(null);
  const [sortBy, setSortBy] = useState<LeaderboardSort>("loyal");

  useEffect(() => setStore(loadRegulars()), []);

  const rows = useMemo(
    () => (store ? regularsLeaderboard(store, sortBy) : []),
    [store, sortBy]
  );

  if (store === null) return null; // avoid hydration flash

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 py-10 text-center text-sm text-neutral-400 dark:border-neutral-700">
        The leaderboard fills in once players have logged some games.
      </div>
    );
  }

  const active = SORTS.find((s) => s.key === sortBy)!;
  const top = rows[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
        {SORTS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSortBy(s.key)}
            className={`rounded-lg py-1.5 text-xs font-semibold transition ${
              sortBy === s.key
                ? "bg-white text-court shadow-sm dark:bg-neutral-900 dark:text-court-light"
                : "text-neutral-500"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-court px-4 py-3 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
          {active.banner}
        </p>
        <p className="mt-0.5 text-xl font-black leading-tight">{top.name}</p>
        <p className="text-sm text-white/85">{bannerDetail(top, sortBy)}</p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-400 dark:border-neutral-800">
              <th className="px-3 py-2 font-semibold">#</th>
              <th className="px-3 py-2 font-semibold">Player</th>
              <th className="px-3 py-2 text-center font-semibold" title="Sessions attended">Sess</th>
              <th className="px-3 py-2 text-center font-semibold" title="Wins / games">W-L</th>
              <th className="px-3 py-2 text-right font-semibold">Rating</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.name + i}
                className="border-b border-neutral-100 last:border-0 dark:border-neutral-800/60"
              >
                <td className="px-3 py-2.5 tabular-nums text-neutral-400">{i + 1}</td>
                <td className="px-3 py-2.5 font-medium">
                  {r.name}
                  <span className="ml-2 text-xs font-normal text-neutral-400">
                    {r.totalGames > 0 ? `${Math.round(r.winRate * 100)}% · ` : ""}
                    last {fmtLastSeen(r.lastSeen)}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center tabular-nums font-semibold text-court dark:text-court-light">
                  {r.sessionsAttended}
                </td>
                <td className="px-3 py-2.5 text-center tabular-nums text-neutral-500">
                  {r.wins}-{r.losses}
                </td>
                <td className="px-3 py-2.5 text-right">
                  {r.latestRating > 0 ? <RatingBadge rating={r.latestRating} /> : <span className="text-neutral-300">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-neutral-400">
          Tracked on this device across {countAppearances(rows)} appearances.
        </p>
        <button
          onClick={() => {
            if (confirm("Clear all leaderboard history on this device? This can't be undone.")) {
              clearRegulars();
              setStore({});
            }
          }}
          className="rounded-lg px-2 py-1 text-xs font-medium text-neutral-400 hover:text-red-500"
        >
          Clear history
        </button>
      </div>
    </div>
  );
}

function bannerDetail(r: { sessionsAttended: number; totalGames: number; wins: number; losses: number; winRate: number; latestRating: number }, sortBy: LeaderboardSort): string {
  switch (sortBy) {
    case "wins":
      return `${r.wins} win${r.wins === 1 ? "" : "s"} · ${r.totalGames} game${r.totalGames === 1 ? "" : "s"}`;
    case "winRate":
      return `${Math.round(r.winRate * 100)}% · ${r.wins}-${r.losses}`;
    case "rating":
      return `${r.latestRating.toFixed(2)} rating · ${r.wins}-${r.losses}`;
    default:
      return `${r.sessionsAttended} session${r.sessionsAttended === 1 ? "" : "s"} · ${r.totalGames} game${r.totalGames === 1 ? "" : "s"} played`;
  }
}

function countAppearances(rows: { sessionsAttended: number }[]): number {
  return rows.reduce((s, r) => s + r.sessionsAttended, 0);
}

function fmtLastSeen(ms: number): string {
  if (!ms) return "—";
  const days = Math.floor((Date.now() - ms) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(ms).toLocaleDateString();
}
