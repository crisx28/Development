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
  sessions: Record<string, { games: number; wins: number; playedAt: number }>;
}

export type RegularsStore = Record<string, RegularRecord>;

/** Flattened, ranked view for the leaderboard UI. */
export interface RegularStats {
  name: string;
  sessionsAttended: number;
  totalGames: number;
  wins: number;
  losses: number;
  /** 0..1; 0 when no games. */
  winRate: number;
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
    };
    store[key] = rec;
    changed = true;
  }

  if (changed) saveRegulars(store);
  return store;
}

/**
 * Flatten the registry into a ranked leaderboard: most loyal first (sessions
 * attended), then most games, then win rate. This is the "who always visits
 * and plays" answer.
 */
export function regularsLeaderboard(
  store: RegularsStore = loadRegulars()
): RegularStats[] {
  const rows: RegularStats[] = Object.values(store).map((rec) => {
    const slots = Object.values(rec.sessions);
    const totalGames = slots.reduce((s, x) => s + x.games, 0);
    const wins = slots.reduce((s, x) => s + x.wins, 0);
    const attended = slots.filter((x) => x.games > 0).length;
    const lastSeen = slots.reduce((s, x) => Math.max(s, x.playedAt), 0);
    return {
      name: rec.name,
      sessionsAttended: attended,
      totalGames,
      wins,
      losses: totalGames - wins,
      winRate: totalGames > 0 ? wins / totalGames : 0,
      lastSeen,
    };
  });

  rows.sort(
    (a, b) =>
      b.sessionsAttended - a.sessionsAttended ||
      b.totalGames - a.totalGames ||
      b.winRate - a.winRate ||
      a.name.localeCompare(b.name)
  );
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
