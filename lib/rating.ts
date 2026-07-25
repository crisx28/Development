import type { Player } from "./types";

/** How reactive a rating is to a single game. */
const K = 0.08;
/** A single game can never move a rating by more than this. */
const MAX_SWING = 0.06;
/** Rating gap (in rating points) that makes one side a strong favourite. */
const SCALE = 1.0;

function expectedScore(teamRating: number, oppRating: number): number {
  return 1 / (1 + Math.pow(10, (oppRating - teamRating) / SCALE));
}

function clampSwing(delta: number): number {
  return Math.max(-MAX_SWING, Math.min(MAX_SWING, delta));
}

function avg(ratings: number[]): number {
  return ratings.reduce((s, r) => s + r, 0) / ratings.length;
}

export interface RatingChange {
  playerId: string;
  before: number;
  after: number;
}

/**
 * Apply an Elo-style update after a doubles game.
 * Returns the new ratings for the four involved players.
 */
export function applyResult(
  sideA: Player[],
  sideB: Player[],
  winner: "a" | "b"
): RatingChange[] {
  const ratingA = avg(sideA.map((p) => p.rating));
  const ratingB = avg(sideB.map((p) => p.rating));

  const expA = expectedScore(ratingA, ratingB);
  const expB = 1 - expA;

  const scoreA = winner === "a" ? 1 : 0;
  const scoreB = 1 - scoreA;

  const deltaA = clampSwing(K * (scoreA - expA));
  const deltaB = clampSwing(K * (scoreB - expB));

  const changes: RatingChange[] = [];
  for (const p of sideA) {
    changes.push({ playerId: p.id, before: p.rating, after: round2(p.rating + deltaA) });
  }
  for (const p of sideB) {
    changes.push({ playerId: p.id, before: p.rating, after: round2(p.rating + deltaB) });
  }
  return changes;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
