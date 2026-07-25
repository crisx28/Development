/** Where bug reports and feedback go. */
export const FEEDBACK_EMAIL = "maricris.rodriguez28@gmail.com";

/**
 * A mailto: link that opens the user's mail app pre-filled with a light
 * bug/feedback template addressed to the DinkQueue inbox.
 */
export function feedbackMailto(): string {
  const subject = "DinkQueue — Bug / Feedback";
  const body = [
    "What happened, or your idea:",
    "",
    "",
    "If it's a bug, what did you do just before?",
    "1. ",
    "2. ",
    "",
    "Phone / browser: ",
    "",
    "— sent from DinkQueue",
  ].join("\n");
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
