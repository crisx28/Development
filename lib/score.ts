/**
 * Derive the winning side from two scores. Returns null when the result is
 * indeterminate (either score missing, or a tie) so the caller can fall back to
 * a manually tapped winner.
 */
export function winnerFromScores(
  scoreA?: number,
  scoreB?: number
): "a" | "b" | null {
  if (typeof scoreA !== "number" || typeof scoreB !== "number") return null;
  if (scoreA === scoreB) return null;
  return scoreA > scoreB ? "a" : "b";
}
