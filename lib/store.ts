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

  const players = session.players.map((p) => {
    if (!seated.has(p.id)) return p;
    return {
      ...p,
      rating: ratingUpdates.get(p.id) ?? p.rating,
      gamesPlayed: p.gamesPlayed + 1,
      lastPlayedRound: roundIndex,
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
  const plan = generateRound(base.players, base.courts, nextIndex);
  if (!plan.round) return { session: base, plan };

  return {
    session: {
      ...base,
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
