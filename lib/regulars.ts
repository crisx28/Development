import type { Session } from "./types";

/**
 * Cross-session "regulars" registry. v1 keeps this on the organizer's device
 * (localStorage), keyed by normalized player name, so it answers "who always
 * shows up and plays?" across every session run on this phone. It is the local
 * stepping stone toward the v2 portable player profile.
 */

const REGULARS_KEY = "dinkqueue.regulars.v1";

/** One player's accumulated history, stored per distinct session so re-syncing
 * the same session is idempotent (it overwrites that session's slot). */
export interface RegularRecord {
  /** Latest display casing seen for this player. */
  name: string;
  /** sessionId -> what the player did in that session. */
  sessions: Record<
    string,
    { games: number; wins: number; playedAt: number; rating?: number }
  >;
}

export type RegularsStore = Record<string, RegularRecord>;

/** How to rank the leaderboard. */
export type LeaderboardSort = "loyal" | "wins" | "winRate" | "rating";

/** Flattened, ranked view for the leaderboard UI. */
export interface RegularStats {
  name: string;
  sessionsAttended: number;
  totalGames: number;
  wins: number;
  losses: number;
  /** 0..1; 0 when no games. */
  winRate: number;
  /** Rating from the player's most recent session (0 if never recorded). */
  latestRating: number;
  /** ms epoch of the most recent session they played. */
  lastSeen: number;
}

function nameKey(name: string): string {
  return name.trim().toLowerCase();
}

/** Count wins per player id from the finalized rounds of a session. */
export function winsByPlayer(session: Session): Record<string, number> {
  const wins: Record<string, number> = {};
  for (const round of session.rounds) {
    if (!round.finalized) continue;
    for (const m of round.matches) {
      if (!m.winner) continue;
      const winners = m.winner === "a" ? m.a : m.b;
      for (const id of winners) wins[id] = (wins[id] ?? 0) + 1;
    }
  }
  return wins;
}

/**
 * Merge a session's per-player contribution into the registry. Only players who
 * actually played (>=1 game) are recorded. Idempotent: re-syncing the same
 * session id just overwrites that session's slot, so this is safe to call on
 * every save without inflating counts.
 */
export function syncSessionToRegulars(
  session: Session,
  store: RegularsStore = loadRegulars()
): RegularsStore {
  const wins = winsByPlayer(session);
  let changed = false;

  for (const p of session.players) {
    if (p.gamesPlayed <= 0) continue;
    const key = nameKey(p.name);
    if (!key) continue;
    const rec = store[key] ?? { name: p.name.trim(), sessions: {} };
    rec.name = p.name.trim();
    rec.sessions[session.id] = {
      games: p.gamesPlayed,
      wins: wins[p.id] ?? 0,
      playedAt: session.createdAt,
      rating: p.rating,
    };
    store[key] = rec;
    changed = true;
  }

  if (changed) saveRegulars(store);
  return store;
}

/**
 * Flatten the registry into a ranked leaderboard. `sortBy` chooses the ranking:
 *  - "loyal"   most sessions attended (the "who always shows up" answer)
 *  - "wins"    most games won
 *  - "winRate" best win %
 *  - "rating"  highest most-recent rating
 * Every ordering falls back to sensible tiebreaks so the list is stable.
 */
export function regularsLeaderboard(
  store: RegularsStore = loadRegulars(),
  sortBy: LeaderboardSort = "loyal"
): RegularStats[] {
  const rows: RegularStats[] = Object.values(store).map((rec) => {
    const slots = Object.values(rec.sessions);
    const totalGames = slots.reduce((s, x) => s + x.games, 0);
    const wins = slots.reduce((s, x) => s + x.wins, 0);
    const attended = slots.filter((x) => x.games > 0).length;
    const lastSeen = slots.reduce((s, x) => Math.max(s, x.playedAt), 0);
    const latest = slots.reduce(
      (best, x) => (x.playedAt >= best.playedAt ? x : best),
      { playedAt: -1, rating: 0 } as { playedAt: number; rating?: number }
    );
    return {
      name: rec.name,
      sessionsAttended: attended,
      totalGames,
      wins,
      losses: totalGames - wins,
      winRate: totalGames > 0 ? wins / totalGames : 0,
      latestRating: latest.rating ?? 0,
      lastSeen,
    };
  });

  const byName = (a: RegularStats, b: RegularStats) => a.name.localeCompare(b.name);
  const comparators: Record<LeaderboardSort, (a: RegularStats, b: RegularStats) => number> = {
    loyal: (a, b) =>
      b.sessionsAttended - a.sessionsAttended ||
      b.totalGames - a.totalGames ||
      b.winRate - a.winRate ||
      byName(a, b),
    wins: (a, b) =>
      b.wins - a.wins || b.winRate - a.winRate || b.totalGames - a.totalGames || byName(a, b),
    winRate: (a, b) =>
      b.winRate - a.winRate || b.wins - a.wins || b.totalGames - a.totalGames || byName(a, b),
    rating: (a, b) =>
      b.latestRating - a.latestRating || b.wins - a.wins || byName(a, b),
  };

  rows.sort(comparators[sortBy]);
  return rows;
}

// --- persistence ---

export function loadRegulars(): RegularsStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(REGULARS_KEY);
    return raw ? (JSON.parse(raw) as RegularsStore) : {};
  } catch {
    return {};
  }
}

function saveRegulars(store: RegularsStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REGULARS_KEY, JSON.stringify(store));
  } catch {
    /* storage full or unavailable — ignore for v1 */
  }
}

export function clearRegulars(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(REGULARS_KEY);
  } catch {
    /* ignore */
  }
}
