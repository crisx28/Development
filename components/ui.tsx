import type { Player } from "@/lib/types";

export function ratingLabel(rating: number): string {
  return rating.toFixed(2);
}

/** A small colored pill showing a player's current rating. */
export function RatingBadge({ rating }: { rating: number }) {
  const tone =
    rating >= 4.0
      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200"
      : rating >= 3.5
        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
        : rating >= 3.0
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
          : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${tone}`}>
      {ratingLabel(rating)}
    </span>
  );
}

export function nameOf(players: Player[], id: string): string {
  return players.find((p) => p.id === id)?.name ?? "?";
}

export function playerOf(players: Player[], id: string): Player | undefined {
  return players.find((p) => p.id === id);
}
