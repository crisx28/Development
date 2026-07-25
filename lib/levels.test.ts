import { test } from "node:test";
import assert from "node:assert/strict";
import { skillLabel } from "./levels.ts";

test("skillLabel maps bands to USA Pickleball labels", () => {
  assert.equal(skillLabel(2.0), "Beginner");
  assert.equal(skillLabel(2.5), "Beginner");
  assert.equal(skillLabel(3.0), "Advanced Beginner");
  assert.equal(skillLabel(3.5), "Intermediate");
  assert.equal(skillLabel(4.0), "Advanced Intermediate");
  assert.equal(skillLabel(4.5), "Advanced");
  assert.equal(skillLabel(5.0), "Expert");
  assert.equal(skillLabel(5.5), "Expert");
});
