import type { Player, Session, Round, Format } from "./types";
import { generateRound, challengeMovement, type RoundPlan } from "./rotation";
import { applyResult } from "./rating";
import { winnerFromScores } from "./score";

const STORAGE_KEY = "dinkqueue.session.v1";

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export interface NewSession {
  name: string;
  courts: number;
  target: number;
  winBy2?: boolean;
  venue?: string;
  courtNames?: string[];
  format?: Format;
}

export function defaultCourtNames(courts: number): string[] {
  return Array.from({ length: courts }, (_, i) => `Court ${i + 1}`);
}

export function createSession(opts: NewSession): Session {
  const courts = Math.max(1, opts.courts);
  const names = (opts.courtNames ?? defaultCourtNames(courts))
    .slice(0, courts)
    .map((n, i) => n.trim() || `Court ${i + 1}`);
  return {
    id: uid(),
    name: opts.name.trim() || "Open Play",
    courts,
    target: opts.target,
    winBy2: opts.winBy2 ?? true,
    venue: opts.venue?.trim() || undefined,
    courtNames: names,
    format: opts.format ?? "balanced",
    players: [],
    rounds: [],
    currentRound: -1,
    createdAt: Date.now(),
  };
}

export function courtLabel(session: Session, courtIndex: number): string {
  return session.courtNames?.[courtIndex] ?? `Court ${courtIndex + 1}`;
}

export function addPlayer(session: Session, name: string, band: number): Session {
  const trimmed = name.trim();
  if (!trimmed) return session;
  const player: Player = {
    id: uid(),
    name: trimmed,
    rating: band,
    startRating: band,
    gamesPlayed: 0,
    lastPlayedRound: -1,
    active: true,
  };
  return { ...session, players: [...session.players, player] };
}

export function togglePlayerActive(session: Session, playerId: string): Session {
  return {
    ...session,
    players: session.players.map((p) =>
      p.id === playerId ? { ...p, active: !p.active } : p
    ),
  };
}

export function removePlayer(session: Session, playerId: string): Session {
  return { ...session, players: session.players.filter((p) => p.id !== playerId) };
}

function playersById(session: Session): Map<string, Player> {
  return new Map(session.players.map((p) => [p.id, p]));
}

/**
 * Finalize a round: apply Elo-style rating changes and bump games-played /
 * last-played for every decided match. A round is only finalized once (when the
 * manager advances to the next round), which is what lets winners stay freely
 * correctable while the round is still in play. Idempotent via the `finalized`
 * flag.
 */
export function finalizeRound(session: Session, roundIndex: number): Session {
  const round = session.rounds[roundIndex];
  if (!round || round.finalized) return session;

  const byId = playersById(session);
  const ratingUpdates = new Map<string, number>();
  const seated = new Set<string>();

  for (const match of round.matches) {
    if (!match.winner) continue;
    const sideA = match.a.map((id) => byId.get(id)!).filter(Boolean);
    const sideB = match.b.map((id) => byId.get(id)!).filter(Boolean);
    if (sideA.length < 2 || sideB.length < 2) continue;
    for (const c of applyResult(sideA, sideB, match.winner)) {
      ratingUpdates.set(c.playerId, c.after);
    }
    [...match.a, ...match.b].forEach((id) => seated.add(id));
  }

  // In challenge mode, winners climb a court and losers drop one.
  const moves =
    session.format === "challenge" ? challengeMovement(round) : {};

  const players = session.players.map((p) => {
    if (!seated.has(p.id)) return p;
    return {
      ...p,
      rating: ratingUpdates.get(p.id) ?? p.rating,
      gamesPlayed: p.gamesPlayed + 1,
      lastPlayedRound: roundIndex,
      court: p.id in moves ? moves[p.id] : p.court,
    };
  });

  const rounds = session.rounds.map((r, i) =>
    i === roundIndex ? { ...r, finalized: true } : r
  );

  return { ...session, players, rounds };
}

/**
 * Advance the session: finalize the current round (applying ratings), then
 * generate and append the next one.
 */
export function startNextRound(session: Session): {
  session: Session;
  plan: RoundPlan;
} {
  const base =
    session.currentRound >= 0
      ? finalizeRound(session, session.currentRound)
      : session;

  const nextIndex = base.rounds.length;
  const prevRound =
    session.currentRound >= 0 ? base.rounds[session.currentRound] : null;
  const plan = generateRound(base.players, base.courts, nextIndex, {
    format: base.format,
    prevRound,
  });
  if (!plan.round) return { session: base, plan };

  // Challenge mode records each seated player's ladder position for next round.
  const players = plan.courtOf
    ? base.players.map((p) =>
        plan.courtOf && p.id in plan.courtOf
          ? { ...p, court: plan.courtOf[p.id] }
          : p
      )
    : base.players;

  return {
    session: {
      ...base,
      players,
      rounds: [...base.rounds, plan.round],
      currentRound: nextIndex,
    },
    plan,
  };
}

/**
 * Set (or clear) the winner of a court in a round. No rating side effects —
 * those are deferred to {@link finalizeRound} — so a manager can freely correct
 * a mis-tap. Tapping the side that already won clears the result.
 */
export function setWinner(
  session: Session,
  roundIndex: number,
  courtIndex: number,
  winner: "a" | "b"
): Session {
  const round = session.rounds[roundIndex];
  if (!round || round.finalized) return session;

  const rounds = session.rounds.map((r, i) => {
    if (i !== roundIndex) return r;
    return {
      ...r,
      matches: r.matches.map((m) =>
        m.courtIndex === courtIndex
          ? { ...m, winner: m.winner === winner ? null : winner }
          : m
      ),
    } as Round;
  });

  return { ...session, rounds };
}

/**
 * Set (or clear) one side's score for a court. When both sides have a score,
 * the winner is derived automatically from the higher one (win-by-margin);
 * an indeterminate score (missing or tied) leaves any tapped winner intact.
 * Pass null to clear a score. No rating side effects until finalize.
 */
export function setScore(
  session: Session,
  roundIndex: number,
  courtIndex: number,
  side: "a" | "b",
  value: number | null
): Session {
  const round = session.rounds[roundIndex];
  if (!round || round.finalized) return session;

  const rounds = session.rounds.map((r, i) => {
    if (i !== roundIndex) return r;
    return {
      ...r,
      matches: r.matches.map((m) => {
        if (m.courtIndex !== courtIndex) return m;
        const clean = value == null || Number.isNaN(value) ? undefined : value;
        const scoreA = side === "a" ? clean : m.scoreA;
        const scoreB = side === "b" ? clean : m.scoreB;
        const derived = winnerFromScores(scoreA, scoreB);
        return { ...m, scoreA, scoreB, winner: derived ?? m.winner };
      }),
    } as Round;
  });

  return { ...session, rounds };
}

export function currentRoundComplete(session: Session): boolean {
  if (session.currentRound < 0) return false;
  const round = session.rounds[session.currentRound];
  if (!round) return false;
  return round.matches.every((m) => m.winner !== null);
}

// --- persistence ---

export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session | null): void {
  if (typeof window === "undefined") return;
  try {
    if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage full or unavailable — ignore for v1 */
  }
}

// --- saved venues (reuse setups) ---

const VENUES_KEY = "dinkqueue.venues.v1";
const MAX_VENUES = 8;

export interface SavedVenue {
  venue: string;
  courts: number;
  courtNames: string[];
  target: number;
  winBy2: boolean;
  format: Format;
}

export function loadVenues(): SavedVenue[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(VENUES_KEY);
    return raw ? (JSON.parse(raw) as SavedVenue[]) : [];
  } catch {
    return [];
  }
}

/** Remember a session's setup so it can be reused, most-recent first. */
export function rememberVenue(session: Session): void {
  if (typeof window === "undefined" || !session.venue) return;
  try {
    const entry: SavedVenue = {
      venue: session.venue,
      courts: session.courts,
      courtNames: session.courtNames ?? defaultCourtNames(session.courts),
      target: session.target,
      winBy2: session.winBy2 ?? true,
      format: session.format,
    };
    const rest = loadVenues().filter(
      (v) => v.venue.toLowerCase() !== entry.venue.toLowerCase()
    );
    const next = [entry, ...rest].slice(0, MAX_VENUES);
    window.localStorage.setItem(VENUES_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
