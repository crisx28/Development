import type { Player, Session, Round } from "./types";
import { generateRound, type RoundPlan } from "./rotation";
import { applyResult } from "./rating";

const STORAGE_KEY = "dinkqueue.session.v1";

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function createSession(
  name: string,
  courts: number,
  target: number
): Session {
  return {
    id: uid(),
    name: name.trim() || "Open Play",
    courts: Math.max(1, courts),
    target,
    players: [],
    rounds: [],
    currentRound: -1,
    createdAt: Date.now(),
  };
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

/** Generate and append the next round, advancing currentRound. */
export function startNextRound(session: Session): {
  session: Session;
  plan: RoundPlan;
} {
  const nextIndex = session.rounds.length;
  const plan = generateRound(session.players, session.courts, nextIndex);
  if (!plan.round) return { session, plan };
  return {
    session: {
      ...session,
      rounds: [...session.rounds, plan.round],
      currentRound: nextIndex,
    },
    plan,
  };
}

function playersById(session: Session): Map<string, Player> {
  return new Map(session.players.map((p) => [p.id, p]));
}

/**
 * Record the winner of a match in a round. Applies rating changes and, the
 * first time a match is decided, bumps games played / last-played for the
 * four players involved. Re-deciding a match updates ratings idempotently
 * relative to the pre-match ratings is out of scope for v1 — winners are final
 * once tapped, but can be corrected before the next round is generated.
 */
export function recordResult(
  session: Session,
  roundIndex: number,
  courtIndex: number,
  winner: "a" | "b"
): Session {
  const round = session.rounds[roundIndex];
  if (!round) return session;
  const match = round.matches.find((m) => m.courtIndex === courtIndex);
  if (!match || match.winner) return session; // already decided; ignore re-taps

  const byId = playersById(session);
  const sideA = match.a.map((id) => byId.get(id)!).filter(Boolean);
  const sideB = match.b.map((id) => byId.get(id)!).filter(Boolean);
  if (sideA.length < 2 || sideB.length < 2) return session;

  const changes = applyResult(sideA, sideB, winner);
  const changeById = new Map(changes.map((c) => [c.playerId, c.after]));
  const seated = new Set([...match.a, ...match.b]);

  const players = session.players.map((p) => {
    if (!seated.has(p.id)) return p;
    return {
      ...p,
      rating: changeById.get(p.id) ?? p.rating,
      gamesPlayed: p.gamesPlayed + 1,
      lastPlayedRound: roundIndex,
    };
  });

  const rounds = session.rounds.map((r, i) => {
    if (i !== roundIndex) return r;
    return {
      ...r,
      matches: r.matches.map((m) =>
        m.courtIndex === courtIndex ? { ...m, winner } : m
      ),
    } as Round;
  });

  return { ...session, players, rounds };
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
