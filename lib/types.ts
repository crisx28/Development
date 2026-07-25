export interface Player {
  id: string;
  name: string;
  /** Current local (Elo-style) rating, e.g. 3.52 */
  rating: number;
  /** Self-declared starting band, e.g. 3.5 */
  startRating: number;
  gamesPlayed: number;
  /** Index of the last round this player was seated in; -1 if never */
  lastPlayedRound: number;
  /** Checked in and available to be seated */
  active: boolean;
  /**
   * Ladder position for challenge-court mode: the court index the player is
   * currently on (0 = top court). Undefined in balanced mode.
   */
  court?: number;
}

/** How the app assigns players to courts each round. */
export type Format = "balanced" | "challenge";

export interface Match {
  courtIndex: number;
  /** Two player ids on side A */
  a: string[];
  /** Two player ids on side B */
  b: string[];
  winner: "a" | "b" | null;
}

export interface Round {
  index: number;
  matches: Match[];
  /** Player ids sitting out this round */
  resting: string[];
  /** Once true, ratings and games-played for this round have been applied. */
  finalized?: boolean;
}

export interface Session {
  id: string;
  name: string;
  courts: number;
  /** Points to win a game */
  target: number;
  /** Optional venue label, e.g. "Vantage Pickleball, Parañaque" */
  venue?: string;
  /** Optional per-court labels; index i is the name for court i. */
  courtNames?: string[];
  /** Court-assignment format. Defaults to "balanced". */
  format: Format;
  players: Player[];
  rounds: Round[];
  /** Index of the round currently in play, or -1 if none generated yet */
  currentRound: number;
  createdAt: number;
}

/** Standard DUPR-style skill bands offered at check-in. */
export const SKILL_BANDS = [2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0] as const;
