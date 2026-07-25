import { test } from "node:test";
import assert from "node:assert/strict";
import { balanceFour, generateRound, seatingOrder } from "./rotation.ts";
import { applyResult } from "./rating.ts";
import type { Player } from "./types.ts";

function mkPlayer(id: string, rating: number, opts: Partial<Player> = {}): Player {
  return {
    id,
    name: id,
    rating,
    startRating: rating,
    gamesPlayed: 0,
    lastPlayedRound: -1,
    active: true,
    ...opts,
  };
}

test("balanceFour pairs strongest with weakest", () => {
  const four = [
    mkPlayer("a", 4.0),
    mkPlayer("b", 3.0),
    mkPlayer("c", 3.5),
    mkPlayer("d", 2.5),
  ];
  const { a, b } = balanceFour(four);
  // strongest (a, 4.0) with weakest (d, 2.5) = 6.5; other side (c 3.5 + b 3.0) = 6.5
  assert.deepEqual(new Set(a), new Set(["a", "d"]));
  assert.deepEqual(new Set(b), new Set(["c", "b"]));
});

test("seatingOrder puts fewest-games players first", () => {
  const players = [
    mkPlayer("veteran", 3, { gamesPlayed: 5 }),
    mkPlayer("fresh", 3, { gamesPlayed: 0 }),
    mkPlayer("mid", 3, { gamesPlayed: 2 }),
  ];
  const order = seatingOrder(players).map((p) => p.id);
  assert.deepEqual(order, ["fresh", "mid", "veteran"]);
});

test("generateRound seats full courts and rests the extras", () => {
  const players = Array.from({ length: 6 }, (_, i) => mkPlayer(`p${i}`, 3 + i * 0.1));
  const { round, message } = generateRound(players, 2, 0);
  assert.equal(message, undefined);
  assert.ok(round);
  // 6 players, 2 courts (cap 8): seat 4 (one court), rest 2.
  assert.equal(round!.matches.length, 1);
  assert.equal(round!.resting.length, 2);
});

test("generateRound refuses fewer than four", () => {
  const players = [mkPlayer("a", 3), mkPlayer("b", 3), mkPlayer("c", 3)];
  const { round, message } = generateRound(players, 1, 0);
  assert.equal(round, null);
  assert.match(message!, /at least 4/);
});

test("generateRound respects court capacity", () => {
  const players = Array.from({ length: 10 }, (_, i) => mkPlayer(`p${i}`, 3));
  const { round } = generateRound(players, 2, 0); // cap 8 -> 2 courts, 2 rest
  assert.equal(round!.matches.length, 2);
  assert.equal(round!.resting.length, 2);
});

test("applyResult raises winners, lowers losers, within swing cap", () => {
  const a = [mkPlayer("a1", 3.5), mkPlayer("a2", 3.5)];
  const b = [mkPlayer("b1", 3.5), mkPlayer("b2", 3.5)];
  const changes = applyResult(a, b, "a");
  const byId = new Map(changes.map((c) => [c.playerId, c]));
  assert.ok(byId.get("a1")!.after > 3.5);
  assert.ok(byId.get("b1")!.after < 3.5);
  // even ratings, K=0.08 -> ±0.04, under the 0.06 cap
  assert.ok(Math.abs(byId.get("a1")!.after - 3.5) <= 0.06);
});

test("upset winner gains more than expected winner", () => {
  const underdog = [mkPlayer("u1", 3.0), mkPlayer("u2", 3.0)];
  const favorite = [mkPlayer("f1", 4.0), mkPlayer("f2", 4.0)];
  const upset = applyResult(underdog, favorite, "a");
  const gain = upset.find((c) => c.playerId === "u1")!;
  assert.ok(gain.after - gain.before > 0.03);
});
