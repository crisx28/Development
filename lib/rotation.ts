import type { Player, Round, Match, Format } from "./types";

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

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
  /**
   * Challenge mode only: the ladder position (court index) each seated player
   * should be recorded at after this round is drawn. The store persists these
   * onto players so the next round's movement is computed from the right spot.
   */
  courtOf?: Record<string, number>;
}

export interface GenerateOptions {
  format?: Format;
  /** The round just finalized, used to compute challenge-mode movement. */
  prevRound?: Round | null;
}

/**
 * Build the next round. Dispatches on format:
 *  - "balanced" (default): seat the longest-rested players and pair each court
 *    strongest-with-weakest to minimise blowouts.
 *  - "challenge": king-of-the-court — winners move up a court, losers move down,
 *    resters cycle in at the bottom.
 */
export function generateRound(
  players: Player[],
  courts: number,
  roundIndex: number,
  opts: GenerateOptions = {}
): RoundPlan {
  if (opts.format === "challenge") {
    return generateChallenge(players, courts, roundIndex);
  }

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

/**
 * Challenge-court generation. Reads each player's `court` ladder position
 * (set by the store from the previous round's win/loss movement), seats the
 * highest courts first, and cycles the longest-rested players in at the bottom.
 */
function generateChallenge(
  players: Player[],
  courts: number,
  roundIndex: number
): RoundPlan {
  const active = players.filter((p) => p.active);
  const effCourts = Math.min(courts, Math.floor(active.length / 4));

  if (effCourts < 1) {
    return {
      round: null,
      message: `Need at least 4 active players to start a round (have ${active.length}).`,
    };
  }

  const maxCourt = effCourts - 1;

  // Ladder position for each active player. On the very first round nobody has
  // a court yet, so seed the tiers by rating; otherwise honour movement and
  // drop late arrivals in at the bottom.
  const ladder = new Map<string, number>();
  const allNull = active.every((p) => p.court == null);
  if (allNull) {
    const ranked = [...active].sort(
      (a, b) => b.rating - a.rating || a.id.localeCompare(b.id)
    );
    ranked.forEach((p, i) => ladder.set(p.id, Math.min(Math.floor(i / 4), maxCourt)));
  } else {
    active.forEach((p) =>
      ladder.set(p.id, p.court == null ? maxCourt : clamp(p.court, 0, maxCourt))
    );
  }

  // Seat highest courts first; within a tier, give the longest-rested priority
  // so resters cycle back in, then the stronger player.
  const order = [...active].sort((a, b) => {
    const ca = ladder.get(a.id)!;
    const cb = ladder.get(b.id)!;
    if (ca !== cb) return ca - cb;
    if (a.lastPlayedRound !== b.lastPlayedRound)
      return a.lastPlayedRound - b.lastPlayedRound;
    if (b.rating !== a.rating) return b.rating - a.rating;
    return a.id.localeCompare(b.id);
  });

  const seats = effCourts * 4;
  const seated = order.slice(0, seats);
  const resting = order.slice(seats).map((p) => p.id);

  const matches: Match[] = [];
  const courtOf: Record<string, number> = {};
  for (let c = 0; c < effCourts; c++) {
    const four = seated.slice(c * 4, c * 4 + 4);
    four.forEach((p) => (courtOf[p.id] = c));
    const { a, b } = balanceFour(four);
    matches.push({ courtIndex: c, a, b, winner: null });
  }
  // Park resters at the bottom court so they re-enter there next round.
  resting.forEach((id) => (courtOf[id] = maxCourt));

  return { round: { index: roundIndex, matches, resting }, courtOf };
}

/**
 * Challenge-mode ladder movement after a round is decided: winners rise a
 * court, losers drop a court (clamped to the range of courts that played).
 * Returns playerId -> new court index for every player that played.
 */
export function challengeMovement(round: Round): Record<string, number> {
  const maxCourt = round.matches.length - 1;
  const moves: Record<string, number> = {};
  for (const m of round.matches) {
    if (!m.winner) continue;
    const winners = m.winner === "a" ? m.a : m.b;
    const losers = m.winner === "a" ? m.b : m.a;
    winners.forEach((id) => (moves[id] = Math.max(m.courtIndex - 1, 0)));
    losers.forEach((id) => (moves[id] = Math.min(m.courtIndex + 1, maxCourt)));
  }
  return moves;
}
