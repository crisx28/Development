import type { Session } from "./types";
import { winsByPlayer } from "./regulars";

/**
 * Build a plain-text session summary for sharing. Used by the "Email results"
 * button, which hands this to the organizer's own mail app via a mailto: link —
 * no backend, no stored addresses, works on the static site.
 */
export function sessionSummaryText(session: Session): string {
  const wins = winsByPlayer(session);
  const ranked = [...session.players].sort(
    (a, b) => b.rating - a.rating || b.gamesPlayed - a.gamesPlayed
  );
  const roundsPlayed = session.rounds.filter((r) => r.finalized).length;
  const date = new Date(session.createdAt).toLocaleDateString();

  const lines: string[] = [];
  lines.push(session.name);
  if (session.venue) lines.push(session.venue);
  lines.push(
    `${date} · ${session.format === "challenge" ? "Challenge" : "Balanced"} · to ${session.target} · ${roundsPlayed} round${roundsPlayed === 1 ? "" : "s"}`
  );
  lines.push("");
  lines.push("STANDINGS");

  ranked.forEach((p, i) => {
    const w = wins[p.id] ?? 0;
    const delta = p.rating - p.startRating;
    const sign = delta >= 0 ? "+" : "";
    lines.push(
      `${i + 1}. ${p.name} — ${p.rating.toFixed(2)} (${sign}${delta.toFixed(2)}) · ${p.gamesPlayed} GP · ${w} W`
    );
  });

  const mvp = [...session.players]
    .filter((p) => p.gamesPlayed > 0)
    .sort(
      (a, b) =>
        b.gamesPlayed - a.gamesPlayed || (wins[b.id] ?? 0) - (wins[a.id] ?? 0)
    )[0];
  if (mvp) {
    lines.push("");
    lines.push(`Most active: ${mvp.name} (${mvp.gamesPlayed} games)`);
  }

  lines.push("");
  lines.push("— via DinkQueue");
  return lines.join("\n");
}

/** A mailto: URL that opens the organizer's mail app with the results pre-filled. */
export function resultsMailto(session: Session): string {
  const subject = `${session.name} — results`;
  const body = sessionSummaryText(session);
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
