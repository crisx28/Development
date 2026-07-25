"use client";

import type { Session } from "@/lib/types";
import { RatingBadge } from "./ui";

export function Standings({ session }: Props) {
  const ranked = [...session.players].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.gamesPlayed - a.gamesPlayed;
  });

  if (ranked.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 py-10 text-center text-sm text-neutral-400 dark:border-neutral-700">
        Standings appear once players are added.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-400 dark:border-neutral-800">
            <th className="px-3 py-2 font-semibold">#</th>
            <th className="px-3 py-2 font-semibold">Player</th>
            <th className="px-3 py-2 text-center font-semibold">GP</th>
            <th className="px-3 py-2 text-right font-semibold">Δ</th>
            <th className="px-3 py-2 text-right font-semibold">Rating</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((p, i) => {
            const delta = p.rating - p.startRating;
            return (
              <tr
                key={p.id}
                className="border-b border-neutral-100 last:border-0 dark:border-neutral-800/60"
              >
                <td className="px-3 py-2.5 tabular-nums text-neutral-400">{i + 1}</td>
                <td className="px-3 py-2.5 font-medium">{p.name}</td>
                <td className="px-3 py-2.5 text-center tabular-nums text-neutral-500">
                  {p.gamesPlayed}
                </td>
                <td
                  className={`px-3 py-2.5 text-right tabular-nums ${
                    delta > 0.001
                      ? "text-emerald-600 dark:text-emerald-400"
                      : delta < -0.001
                        ? "text-red-500"
                        : "text-neutral-400"
                  }`}
                >
                  {delta > 0 ? "+" : ""}
                  {delta.toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <RatingBadge rating={p.rating} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface Props {
  session: Session;
}
