import { test } from "node:test";
import assert from "node:assert/strict";
import { winnerFromScores } from "./score.ts";

test("winnerFromScores picks the higher side", () => {
  assert.equal(winnerFromScores(11, 9), "a");
  assert.equal(winnerFromScores(7, 11), "b");
});

test("winnerFromScores is null when indeterminate", () => {
  assert.equal(winnerFromScores(11, 11), null); // tie
  assert.equal(winnerFromScores(11, undefined), null); // missing
  assert.equal(winnerFromScores(undefined, undefined), null);
});
