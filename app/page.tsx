"use client";

import { useEffect, useState } from "react";
import type { Session } from "@/lib/types";
import {
  addPlayer,
  createSession,
  loadSession,
  removePlayer,
  saveSession,
  setWinner,
  startNextRound,
  togglePlayerActive,
} from "@/lib/store";
import { SetupScreen } from "@/components/SetupScreen";
import { Roster } from "@/components/Roster";
import { LiveRound } from "@/components/LiveRound";
import { Standings } from "@/components/Standings";

type Tab = "players" | "rounds" | "standings";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<Tab>("players");
  const [message, setMessage] = useState<string | undefined>();

  // Load any in-progress session on first mount.
  useEffect(() => {
    setSession(loadSession());
    setHydrated(true);
  }, []);

  // Persist on every change.
  useEffect(() => {
    if (hydrated) saveSession(session);
  }, [session, hydrated]);

  if (!hydrated) return null; // avoid hydration flash

  if (!session) {
    return (
      <SetupScreen
        onCreate={(name, courts, target) => {
          setSession(createSession(name, courts, target));
          setTab("players");
        }}
      />
    );
  }

  const generate = () => {
    setMessage(undefined);
    const result = startNextRound(session);
    if (!result.plan.round) {
      setMessage(result.plan.message);
      return;
    }
    setSession(result.session);
    setTab("rounds");
  };

  const endSession = () => {
    if (confirm("End this session? All local data will be cleared.")) {
      setSession(null);
      setMessage(undefined);
    }
  };

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-24">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-50/90 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-black leading-tight text-court dark:text-court-light">
              {session.name}
            </h1>
            <p className="text-xs text-neutral-400">
              {session.courts} court{session.courts === 1 ? "" : "s"} · to{" "}
              {session.target} · round {Math.max(session.currentRound + 1, 0)}
            </p>
          </div>
          <button
            onClick={endSession}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-neutral-400 hover:text-red-500"
          >
            End
          </button>
        </div>
      </header>

      <main className="px-4 py-4">
        {tab === "players" && (
          <Roster
            session={session}
            onAdd={(name, band) => setSession(addPlayer(session, name, band))}
            onToggle={(id) => setSession(togglePlayerActive(session, id))}
            onRemove={(id) => setSession(removePlayer(session, id))}
            onStart={generate}
          />
        )}
        {tab === "rounds" && (
          <LiveRound
            session={session}
            message={message}
            onGenerate={generate}
            onPickWinner={(court, winner) =>
              setSession(setWinner(session, session.currentRound, court, winner))
            }
          />
        )}
        {tab === "standings" && <Standings session={session} />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md border-t border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
        <TabButton label="Players" icon="👥" active={tab === "players"} onClick={() => setTab("players")} />
        <TabButton label="Rounds" icon="🎾" active={tab === "rounds"} onClick={() => setTab("rounds")} />
        <TabButton label="Standings" icon="🏆" active={tab === "standings"} onClick={() => setTab("standings")} />
      </nav>
    </div>
  );
}

function TabButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${
        active ? "text-court dark:text-court-light" : "text-neutral-400"
      }`}
    >
      <span className="text-lg leading-none">{icon}</span>
      {label}
    </button>
  );
}
