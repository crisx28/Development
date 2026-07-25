"use client";

import { feedbackMailto } from "@/lib/feedback";

/** A tappable "report a bug / send feedback" link that opens the user's mail app. */
export function FeedbackLink({ className }: { className?: string }) {
  return (
    <a
      href={feedbackMailto()}
      className={
        className ??
        "inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 underline-offset-2 hover:text-court hover:underline dark:hover:text-court-light"
      }
    >
      💬 Report a bug or send feedback
    </a>
  );
}
