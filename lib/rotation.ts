import type { Player, Round, Match } from "./types";

/**
 * Order players for seating so court time stays fair:
 *   1. fewest games played first (nobody rots on the bench)
 *   2. then longest time since they last played
 *   3. then a stable tiebreak by id
 */
export function seatingOrder(players: Player[]): Player[] {
  return [...players].sort((x, y) => {
    if (x.gamesPlayed !== y.gamesPlayed) return x.gamesPlayed - y.gamesPlayed;
    if (x.lastPlayedRound !== y.lastPlayedRound)
      return x.lastPlayedRound - y.lastPlayedRound;
    return x.id.localeCompare(y.id);
  });
}

/**
 * Split four players into two balanced doubles pairs.
 * Pairs the strongest with the weakest so the two sides' combined ratings are
 * as close as possible — this is what kills blowouts.
 */
export function balanceFour(four: Player[]): { a: string[]; b: string[] } {
  const sorted = [...four].sort((x, y) => y.rating - x.rating); // desc
  // sorted: [strongest, 2nd, 3rd, weakest]
  // Side A = strongest + weakest, Side B = the middle two.
  return {
    a: [sorted[0].id, sorted[3].id],
    b: [sorted[1].id, sorted[2].id],
  };
}

export interface RoundPlan {
  round: Round | null;
  /** Human-readable reason when a round can't be generated */
  message?: string;
}

/**
 * Build the next round: seat as many full courts of 4 as possible, prioritising
 * the players who've rested the longest, and balance each court.
 */
export function generateRound(
  players: Player[],
  courts: number,
  roundIndex: number
): RoundPlan {
  const available = players.filter((p) => p.active);

  if (available.length < 4) {
    return {
      round: null,
      message: `Need at least 4 active players to start a round (have ${available.length}).`,
    };
  }

  const capacity = courts * 4;
  const ordered = seatingOrder(available);

  // Largest multiple of 4 that fits both the queue and the courts.
  const seatable = Math.min(capacity, available.length);
  const numSeated = seatable - (seatable % 4);

  const seated = ordered.slice(0, numSeated);
  const resting = ordered.slice(numSeated).map((p) => p.id);

  const matches: Match[] = [];
  for (let c = 0; c < numSeated / 4; c++) {
    const four = seated.slice(c * 4, c * 4 + 4);
    const { a, b } = balanceFour(four);
    matches.push({ courtIndex: c, a, b, winner: null });
  }

  return { round: { index: roundIndex, matches, resting } };
}
