"use client";

/**
 * A collapsible "how to use the app" quick-start, mapped to the four tabs so a
 * first-time organizer knows exactly where to go. Sits on the setup screen.
 */
export function HowToUse() {
  return (
    <details className="group rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold">
        <span>👋 New here? How DinkQueue works</span>
        <span className="text-neutral-400 transition group-open:rotate-180">⌄</span>
      </summary>
      <div className="space-y-3 border-t border-neutral-100 px-5 py-4 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
        <Step n="1" title="Set up your session">
          Name it, pick how many courts you have, the points to play to, and a{" "}
          <b>Play mode</b> — Fair Play (balanced teams), For Fun (random), or
          Challenge (king of the court). Then <b>Start session</b>.
        </Step>
        <Step n="2" title="👥 Players tab — check people in">
          Type each player&rsquo;s name, tap their <b>skill level</b>, and hit Add.
          As people arrive or leave, tap the <b>✓</b> to check them in or out.
        </Step>
        <Step n="3" title="🎾 Rounds tab — play">
          Tap <b>Start Round</b> and DinkQueue seats every court fairly. When a game
          ends, <b>tap the winning side</b> on that court, then <b>Next round</b>.
          Everyone gets fair court time automatically.
        </Step>
        <Step n="4" title="🏆 Standings tab — this session">
          Live rankings and rating changes for tonight. Tap <b>Email results</b> to
          share the final standings.
        </Step>
        <Step n="5" title="🏅 Leaderboard tab — all-time">
          Everyone who&rsquo;s played on this phone, ranked by <b>Loyal</b> (most
          sessions), <b>Wins</b>, <b>Win %</b>, or <b>Rating</b>.
        </Step>
        <p className="pt-1 text-xs text-neutral-400">
          Everything saves on your phone — refresh-safe, works offline, no login.
        </p>
      </div>
    </details>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-court/10 text-xs font-bold text-court dark:text-court-light">
        {n}
      </span>
      <p className="flex-1">
        <span className="font-semibold text-neutral-800 dark:text-neutral-100">{title}. </span>
        {children}
      </p>
    </div>
  );
}
