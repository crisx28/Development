import { test } from "node:test";
import assert from "node:assert/strict";
import {
  regularsLeaderboard,
  syncSessionToRegulars,
  winsByPlayer,
  type RegularsStore,
} from "./regulars.ts";
import type { Player, Round, Session } from "./types.ts";

function mkPlayer(id: string, opts: Partial<Player> = {}): Player {
  return {
    id,
    name: id,
    rating: 3.5,
    startRating: 3.5,
    gamesPlayed: 0,
    lastPlayedRound: -1,
    active: true,
    ...opts,
  };
}

function mkSession(
  id: string,
  players: Player[],
  rounds: Round[] = [],
  createdAt = 1_000
): Session {
  return {
    id,
    name: "Open Play",
    courts: 1,
    target: 11,
    format: "balanced",
    players,
    rounds,
    currentRound: rounds.length - 1,
    createdAt,
  };
}

test("winsByPlayer counts only finalized rounds", () => {
  const rounds: Round[] = [
    {
      index: 0,
      resting: [],
      finalized: true,
      matches: [{ courtIndex: 0, a: ["p1", "p2"], b: ["p3", "p4"], winner: "a" }],
    },
    {
      index: 1,
      resting: [],
      finalized: false, // not finalized -> ignored
      matches: [{ courtIndex: 0, a: ["p1", "p2"], b: ["p3", "p4"], winner: "b" }],
    },
  ];
  const wins = winsByPlayer(mkSession("s", [], rounds));
  assert.equal(wins["p1"], 1);
  assert.equal(wins["p2"], 1);
  assert.equal(wins["p3"], undefined);
});

test("sync records only players who played, keyed by normalized name", () => {
  const players = [
    mkPlayer("p1", { name: "Juan", gamesPlayed: 3 }),
    mkPlayer("p2", { name: "Maria", gamesPlayed: 0 }), // never played -> skipped
  ];
  const store: RegularsStore = {};
  syncSessionToRegulars(mkSession("s1", players), store);

  assert.deepEqual(Object.keys(store), ["juan"]);
  assert.equal(store["juan"].sessions["s1"].games, 3);
});

test("re-syncing the same session is idempotent (no double counting)", () => {
  const players = [mkPlayer("p1", { name: "Juan", gamesPlayed: 2 })];
  const store: RegularsStore = {};
  const s = mkSession("s1", players);

  syncSessionToRegulars(s, store);
  syncSessionToRegulars(s, store); // again
  // bump games as the live session progresses, then sync once more
  players[0].gamesPlayed = 4;
  syncSessionToRegulars(s, store);

  const board = regularsLeaderboard(store);
  assert.equal(board.length, 1);
  assert.equal(board[0].sessionsAttended, 1); // still one session
  assert.equal(board[0].totalGames, 4); // reflects latest, not summed
});

test("leaderboard ranks by sessions attended, then games", () => {
  const store: RegularsStore = {};
  // Ana: 2 sessions, 5 games total
  syncSessionToRegulars(
    mkSession("s1", [mkPlayer("a", { name: "Ana", gamesPlayed: 3 })], [], 1_000),
    store
  );
  syncSessionToRegulars(
    mkSession("s2", [mkPlayer("a", { name: "Ana", gamesPlayed: 2 })], [], 2_000),
    store
  );
  // Ben: 1 session, 8 games
  syncSessionToRegulars(
    mkSession("s3", [mkPlayer("b", { name: "Ben", gamesPlayed: 8 })], [], 3_000),
    store
  );

  const board = regularsLeaderboard(store);
  assert.equal(board[0].name, "Ana"); // more sessions wins over more games
  assert.equal(board[0].sessionsAttended, 2);
  assert.equal(board[0].totalGames, 5);
  assert.equal(board[1].name, "Ben");
  assert.equal(board[1].lastSeen, 3_000);
});

test("leaderboard sort=wins ranks by wins; latestRating tracks newest session", () => {
  const rounds = (winner: "a" | "b"): Round[] => [
    {
      index: 0,
      resting: [],
      finalized: true,
      matches: [{ courtIndex: 0, a: ["a", "x"], b: ["y", "z"], winner }],
    },
  ];
  const store: RegularsStore = {};
  // Loyal but low wins: Ana, 2 sessions, 0 wins, latest rating 3.40
  syncSessionToRegulars(
    mkSession("s1", [mkPlayer("a", { name: "Ana", gamesPlayed: 1, rating: 3.5 })], rounds("b"), 1_000),
    store
  );
  syncSessionToRegulars(
    mkSession("s2", [mkPlayer("a", { name: "Ana", gamesPlayed: 1, rating: 3.4 })], rounds("b"), 2_000),
    store
  );
  // Fewer sessions, more wins: Ben, 1 session, 1 win
  syncSessionToRegulars(
    mkSession("s3", [mkPlayer("a", { name: "Ben", gamesPlayed: 1, rating: 4.1 })], rounds("a"), 3_000),
    store
  );

  const byLoyal = regularsLeaderboard(store, "loyal");
  assert.equal(byLoyal[0].name, "Ana"); // more sessions

  const byWins = regularsLeaderboard(store, "wins");
  assert.equal(byWins[0].name, "Ben"); // more wins

  const ana = byLoyal.find((r) => r.name === "Ana")!;
  assert.equal(ana.latestRating, 3.4); // newest session's rating, not the older 3.5
});

test("win rate aggregates across sessions", () => {
  const rounds = (winner: "a" | "b"): Round[] => [
    {
      index: 0,
      resting: [],
      finalized: true,
      matches: [{ courtIndex: 0, a: ["a", "x"], b: ["y", "z"], winner }],
    },
  ];
  const store: RegularsStore = {};
  // session 1: Ana wins her 1 game
  syncSessionToRegulars(
    mkSession(
      "s1",
      [mkPlayer("a", { name: "Ana", gamesPlayed: 1 })],
      rounds("a"),
      1_000
    ),
    store
  );
  // session 2: Ana loses her 1 game
  syncSessionToRegulars(
    mkSession(
      "s2",
      [mkPlayer("a", { name: "Ana", gamesPlayed: 1 })],
      rounds("b"),
      2_000
    ),
    store
  );

  const ana = regularsLeaderboard(store)[0];
  assert.equal(ana.totalGames, 2);
  assert.equal(ana.wins, 1);
  assert.equal(ana.losses, 1);
  assert.equal(ana.winRate, 0.5);
});
