# 🥒 DinkQueue

**The live rotation manager for pickleball open play.** Fair court time,
balanced games, no whiteboard.

Reclub and Sports360 (the apps Philippine players already use) get you *onto* a
court and take your payment — then do nothing for the two hours you're actually
playing. DinkQueue owns that gap: the in-session rotation, skill-balanced
matchups, and a local skill rating that compounds over time.

See [`docs/PRD.md`](docs/PRD.md) for the full product rationale, the market gap,
the rotation algorithm, and the roadmap.

## What it does (v1)

- **Create a session** — name, number of courts, points to win.
- **Check players in** and tag each with a skill band (2.0–5.0).
- **Auto-balanced rounds** — seats the players who've rested longest, then pairs
  strongest-with-weakest on each court to kill blowouts.
- **Live queue** — who's on which court, who's resting, games-played counts.
- **Tap the winner** — records the result and updates ratings.
- **Local ratings & standings** — an Elo-style rating nudges after every game.
- **Runs on-device** — state lives in `localStorage`, installs as a PWA, and
  keeps working on flaky court Wi-Fi. No account needed.

## Tech

Next.js 14 (App Router) · TypeScript · Tailwind CSS · PWA (manifest + service
worker). No backend in v1 — everything is client-side.

The rotation and rating logic is pure and unit-tested in
[`lib/rotation.ts`](lib/rotation.ts) and [`lib/rating.ts`](lib/rating.ts).

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build
npm run start    # serve the production build
npm test         # run the rotation/rating unit tests
```

> `npm test` runs the unit tests with Node's built-in runner and TypeScript
> type-stripping: `node --experimental-strip-types --test lib/*.test.ts`.

## Roadmap (short version)

- **v2** — accounts + cloud sync, portable player ratings, a shareable session
  link so players watch the live queue on their own phones.
- **v3** — point-by-point game intelligence ("why you lose points").
- **v4** — club dashboard, recurring sessions, and integration with the
  booking apps for the half of the problem they already own.
