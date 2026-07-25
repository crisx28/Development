"use client";

import type { Session, Match } from "@/lib/types";
import { nameOf, playerOf, RatingBadge } from "./ui";

interface Props {
  session: Session;
  message?: string;
  onGenerate: () => void;
  onPickWinner: (courtIndex: number, winner: "a" | "b") => void;
}

export function LiveRound({ session, message, onGenerate, onPickWinner }: Props) {
  const round =
    session.currentRound >= 0 ? session.rounds[session.currentRound] : undefined;
  const complete = round?.matches.every((m) => m.winner !== null) ?? false;

  return (
    <div className="space-y-4">
      {round ? (
        <>
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold">Round {round.index + 1}</h2>
            <span className="text-sm text-neutral-500">
              {round.matches.filter((m) => m.winner).length}/{round.matches.length} done
            </span>
          </div>

          <div className="space-y-3">
            {round.matches.map((m) => (
              <CourtCard
                key={m.courtIndex}
                session={session}
                match={m}
                target={session.target}
                onPick={(w) => onPickWinner(m.courtIndex, w)}
              />
            ))}
          </div>

          {round.resting.length > 0 && (
            <div className="rounded-xl bg-neutral-100 p-3 text-sm dark:bg-neutral-800/60">
              <span className="font-semibold text-neutral-500">Resting: </span>
              {round.resting.map((id) => nameOf(session.players, id)).join(", ")}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-300 py-10 text-center dark:border-neutral-700">
          <p className="text-sm text-neutral-400">No round yet.</p>
        </div>
      )}

      {message && (
        <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
          {message}
        </p>
      )}

      <button
        onClick={onGenerate}
        disabled={round != null && !complete}
        className="w-full rounded-xl bg-court py-3.5 text-base font-semibold text-white transition active:scale-[0.99] enabled:hover:bg-court-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        {round == null
          ? "Generate first round"
          : complete
            ? "Next round →"
            : "Finish all courts to continue"}
      </button>
    </div>
  );
}

function CourtCard({
  session,
  match,
  target,
  onPick,
}: {
  session: Session;
  match: Match;
  target: number;
  onPick: (w: "a" | "b") => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
      <div className="flex items-center justify-between bg-court px-4 py-2 text-white">
        <span className="text-sm font-bold">Court {match.courtIndex + 1}</span>
        <span className="text-xs opacity-80">to {target}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
        <SideButton
          session={session}
          ids={match.a}
          selected={match.winner === "a"}
          dimmed={match.winner === "b"}
          onClick={() => onPick("a")}
        />
        <div className="grid place-items-center px-2 text-xs font-bold text-neutral-300">
          VS
        </div>
        <SideButton
          session={session}
          ids={match.b}
          selected={match.winner === "b"}
          dimmed={match.winner === "a"}
          onClick={() => onPick("b")}
        />
      </div>
    </div>
  );
}

function SideButton({
  session,
  ids,
  selected,
  dimmed,
  onClick,
}: {
  session: Session;
  ids: string[];
  selected: boolean;
  dimmed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-1.5 p-3 text-left transition ${
        selected
          ? "bg-court/10 ring-2 ring-inset ring-court"
          : dimmed
            ? "opacity-40"
            : "active:bg-neutral-100 dark:active:bg-neutral-800"
      }`}
    >
      {ids.map((id) => {
        const p = playerOf(session.players, id);
        return (
          <div key={id} className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium">{p?.name ?? "?"}</span>
            {p && <RatingBadge rating={p.rating} />}
          </div>
        );
      })}
      {selected && (
        <span className="mt-1 text-xs font-bold text-court dark:text-court-light">
          ✓ Winner
        </span>
      )}
    </button>
  );
}
