/**
 * Human labels for the numeric skill bands, following USA Pickleball's
 * self-rating ladder (2.0 Beginner … 5.0+ Expert). These are what turn an
 * abstract "3.5" into something a new organizer actually recognizes.
 */

export function skillLabel(rating: number): string {
  if (rating < 3.0) return "Beginner";
  if (rating < 3.5) return "Advanced Beginner";
  if (rating < 4.0) return "Intermediate";
  if (rating < 4.5) return "Advanced Intermediate";
  if (rating < 5.0) return "Advanced";
  return "Expert";
}

/** Shorter label for tight spaces (chips, table cells). */
export function skillLabelShort(rating: number): string {
  if (rating < 3.0) return "Beginner";
  if (rating < 3.5) return "Adv. Beginner";
  if (rating < 4.0) return "Intermediate";
  if (rating < 4.5) return "Adv. Interm.";
  if (rating < 5.0) return "Advanced";
  return "Expert";
}
