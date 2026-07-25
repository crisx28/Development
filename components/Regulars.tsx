"use client";

import { useEffect, useState } from "react";
import {
  clearRegulars,
  regularsLeaderboard,
  type RegularStats,
} from "@/lib/regulars";

/**
 * "Who always shows up and plays?" — a leaderboard built from every session run
 * on this device. Reads the local registry on mount (client-only), so the
 * current in-progress session is already reflected.
 */
export function Regulars() {
  const [rows, setRows] = useState<RegularStats[] | null>(null);

  useEffect(() => {
    setRows(regularsLeaderboard());
  }, []);

  if (rows === null) return null; // avoid hydration flash

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 py-10 text-center text-sm text-neutral-400 dark:border-neutral-700">
        Your regulars show up here once players have logged some games.
      </div>
    );
  }

  const top = rows[0];

  return (
    <div className="space-y-4">
      {top.sessionsAttended >= 1 && (
        <div className="rounded-2xl bg-court px-4 py-3 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
            Most loyal regular
          </p>
          <p className="mt-0.5 text-xl font-black leading-tight">{top.name}</p>
          <p className="text-sm text-white/85">
            {top.sessionsAttended} session{top.sessionsAttended === 1 ? "" : "s"} ·{" "}
            {top.totalGames} game{top.totalGames === 1 ? "" : "s"} played
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-400 dark:border-neutral-800">
              <th className="px-3 py-2 font-semibold">#</th>
              <th className="px-3 py-2 font-semibold">Player</th>
              <th className="px-3 py-2 text-center font-semibold" title="Sessions attended">
                Sess
              </th>
              <th className="px-3 py-2 text-center font-semibold" title="Games played">
                GP
              </th>
              <th className="px-3 py-2 text-right font-semibold" title="Win rate">
                Win%
              </th>
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
                    last {fmtLastSeen(r.lastSeen)}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center tabular-nums font-semibold text-court dark:text-court-light">
                  {r.sessionsAttended}
                </td>
                <td className="px-3 py-2.5 text-center tabular-nums text-neutral-500">
                  {r.totalGames}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-neutral-500">
                  {r.totalGames > 0 ? `${Math.round(r.winRate * 100)}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-neutral-400">
          Tracked on this device across {countSessions(rows)} recorded appearances.
        </p>
        <button
          onClick={() => {
            if (
              confirm(
                "Clear all regulars history on this device? This can't be undone."
              )
            ) {
              clearRegulars();
              setRows([]);
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

function countSessions(rows: RegularStats[]): number {
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
