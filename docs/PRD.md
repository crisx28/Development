# DinkQueue — Product Requirements (v1)

> Working name. The open-play rotation manager for Philippine pickleball.

## 1. Problem

Pickleball is booming in the Philippines, but the app market is stuck on the
*before* and *after* of a session. **Reclub** (community + open-play organizing,
payment-first) and **Sports360** (court-booking marketplace, e-wallet payments,
coaching) both get a player *onto* a court and take their money — then do
nothing for the two hours they're actually there.

During open play, the rotation — who plays next, who's waiting, who's up on
which court — is still run on a **whiteboard or a piece of paper**. It's manual,
error-prone, and the source of the two biggest complaints at any open-play
session:

1. **"How long until I play again?"** — no visibility into the queue.
2. **"That game was a blowout."** — no skill-balancing, so matches are lopsided
   and the weaker player has a bad time.

Nobody owns the on-court experience. That's the gap.

## 2. Why this wedge

- **Complementary, not competitive.** Reclub/Sports360 own booking and payment.
  DinkQueue owns the session itself. It can sit *alongside* them rather than
  trying to replace two funded incumbents on their own turf.
- **Adoption is bottom-up.** One organizer starts using it at one court. Every
  player at that session sees the live queue on their phone. It spreads by word
  of mouth, session by session — no marketing spend required.
- **It's a data wedge into ratings.** Every rotation round is a logged match
  outcome. Over time that produces a **local skill rating** — the thing neither
  incumbent has, and the thing that makes matchmaking fair. Ratings are the moat.

## 3. Target users

| User | Need |
|------|------|
| **Organizer / host** | Run the session without a whiteboard. Fair, fast rotations. Less arguing. |
| **Player** | Know when they're up, on which court, against whom. Fair games. |
| **(Later) Club owner** | Aggregate ratings, recurring sessions, retention data. |

## 4. v1 scope (this build)

The v1 is a **mobile-first web app (PWA)** — no app store, works on any phone,
installable to the home screen, and runs the whole session **on-device** (state
in `localStorage`) so it works even on flaky court Wi-Fi and needs no backend to
demo.

### In scope
- Create a session: name, number of courts, scoring target.
- Check players in; assign each a skill level (2.0–5.0, DUPR-style bands).
- **Auto-balanced round generation** across all courts (algorithm below).
- **Live queue view**: who's playing on each court, who's next, who's resting,
  and a "games played" count so rotation stays fair.
- Tap the winning side → record result → auto-generate the next round.
- **Local rating**: each player's skill nudges up/down from results (Elo-style).
- Persist everything locally; resume a session after a refresh.

### Explicitly out of scope for v1
- Accounts / login / cloud sync (v2).
- Court booking or payments — that's Reclub/Sports360's job; we integrate later.
- Point-by-point game intelligence (kitchen faults etc.) — v3.
- Native apps.

## 5. Rotation algorithm (v1)

Goal: **fair court time** + **balanced matches**, doubles-first.

On each "generate round":
1. **Prioritize by rest.** Sort checked-in, available players by games played
   ascending (fewest games first), breaking ties by longest time since last
   game. This guarantees nobody rots on the bench.
2. **Seat the courts.** Take the top `4 × (#courts)` players from that queue.
   Remaining players wait this round.
3. **Balance each court.** Within each group of 4, split into two pairs so the
   sum of the two players' ratings on each side is as close as possible
   (pair the strongest with the weakest). Minimizes blowouts.
4. Anyone not seated is marked **resting** and floats to the front of the next
   round's priority.

Edge cases handled: player count not divisible by 4 (extras rest), fewer than 4
available (session pauses with a message), a player checking out mid-session
(removed from future rounds, current game finishes).

## 6. Local rating (v1)

Start every new player at their self-declared band (e.g. 3.5 → 3.50 rating).
After each game, apply a small Elo-style adjustment based on the result and the
rating gap between the two sides, clamped so a single game can't swing a rating
more than ±0.06. Ratings are **per-session-persisted** in v1; v2 makes them a
portable player profile — the real product.

## 7. Success metrics

- **Activation:** an organizer completes a full session (≥3 rounds) with it.
- **Retention:** the same organizer runs a *second* session within 2 weeks.
- **Spread:** a player from one session starts organizing their own.
- **North star:** rounds logged per week (proxy for both usage and rating data).

## 8. Roadmap

- **v1 (now):** on-device rotation manager + local rating. Demo at a real session.
- **v2:** accounts + cloud sync, portable player ratings, shareable session link
  so players watch the queue live on their own phones.
- **v3:** point-by-point game intelligence; "why you lose points" analytics.
- **v4:** club dashboard, recurring sessions, retention analytics; explore
  integration/hand-off with Reclub & Sports360 for the booking half.

## 9. Competitive summary

| Capability | Reclub | Sports360 | DinkQueue |
|------------|:------:|:---------:|:---------:|
| Court booking | – | ✅ | – |
| Payments / e-wallet | ✅ | ✅ | – |
| Open-play discovery | ✅ | ✅ | – |
| **Live in-session rotation** | – | – | ✅ |
| **Skill-balanced matchups** | partial | – | ✅ |
| **Local skill rating** | – | – | ✅ |
| **On-court game intelligence** | – | – | ✅ (v3) |

The bet: own the two hours everyone else ignores, and let the rating data
compound into the thing nobody else has.
