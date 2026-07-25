"use client";

/**
 * A collapsible "How to play" quick-reference, summarised from the official
 * USA Pickleball rulebook. Handy for newcomers at an open-play session.
 */
export function RulesCard() {
  return (
    <details className="group rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold">
        <span>📖 How to play pickleball</span>
        <span className="text-neutral-400 transition group-open:rotate-180">⌄</span>
      </summary>
      <div className="space-y-3 border-t border-neutral-100 px-5 py-4 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
        <Rule term="Serve">
          Underhand, contact below the wrist (or a drop serve). Hit it{" "}
          <b>crosscourt</b> into the diagonal box, clearing the kitchen and its line.
        </Rule>
        <Rule term="Two-bounce rule">
          The serve must bounce, the return must bounce — <b>then</b> volleys are
          allowed.
        </Rule>
        <Rule term="The kitchen">
          The 7 ft non-volley zone at the net. You can&rsquo;t hit the ball out of
          the air while standing in it.
        </Rule>
        <Rule term="Scoring">
          Traditional: only the <b>serving team</b> scores. Games to <b>11, win by
          2</b> (tournaments 15 or 21). Rally scoring — every rally counts — is the
          faster newer option.
        </Rule>
        <Rule term="Skill levels">
          2.0–2.5 Beginner · 3.0 Adv. Beginner · 3.5 Intermediate · 4.0 Adv.
          Intermediate · 4.5 Advanced · 5.0+ Expert.
        </Rule>
        <p className="pt-1 text-xs text-neutral-400">
          Summarised from the official USA Pickleball rulebook — usapickleball.org/rules.
        </p>
      </div>
    </details>
  );
}

function Rule({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <p>
      <span className="font-semibold text-court dark:text-court-light">{term}. </span>
      {children}
    </p>
  );
}
