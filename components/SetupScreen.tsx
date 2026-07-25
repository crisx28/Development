"use client";

import { useEffect, useState } from "react";
import type { Format } from "@/lib/types";
import { defaultCourtNames, loadVenues, type SavedVenue, type NewSession } from "@/lib/store";
import { RulesCard } from "./RulesCard";

interface Props {
  onCreate: (opts: NewSession) => void;
}

const FORMATS: { key: Format; title: string; blurb: string }[] = [
  { key: "balanced", title: "Fair Play", blurb: "Even matchups every round — strongest paired with weakest." },
  { key: "social", title: "For Fun", blurb: "Random teams every round — levels ignored, pure luck of the draw." },
  { key: "challenge", title: "Challenge", blurb: "King of the court — winners move up, losers move down." },
];

const TARGETS = [11, 15, 21];

export function SetupScreen({ onCreate }: Props) {
  const [venue, setVenue] = useState("");
  const [name, setName] = useState("");
  const [courts, setCourts] = useState(2);
  const [target, setTarget] = useState(11);
  const [winBy2, setWinBy2] = useState(true);
  const [format, setFormat] = useState<Format>("balanced");
  const [courtNames, setCourtNames] = useState<string[]>(defaultCourtNames(2));
  const [saved, setSaved] = useState<SavedVenue[]>([]);

  useEffect(() => setSaved(loadVenues()), []);

  // Keep the court-name list in step with the court count, preserving edits.
  function setCourtCount(n: number) {
    const next = Math.min(12, Math.max(1, n));
    setCourts(next);
    setCourtNames((prev) => {
      const out = defaultCourtNames(next);
      for (let i = 0; i < next; i++) if (prev[i]) out[i] = prev[i];
      return out;
    });
  }

  function applyVenue(v: SavedVenue) {
    setVenue(v.venue);
    setCourts(v.courts);
    setTarget(v.target);
    setWinBy2(v.winBy2 ?? true);
    setFormat(v.format);
    setCourtNames(v.courtNames.slice(0, v.courts));
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-7 px-6 py-10">
      <div className="text-center">
        <div className="mb-3 text-5xl">🥒</div>
        <h1 className="text-3xl font-black tracking-tight text-court dark:text-court-light">
          DinkQueue
        </h1>
        <p className="mx-auto mt-2 max-w-[30ch] text-sm text-neutral-500 dark:text-neutral-400">
          Fair court time, balanced games, no whiteboard. Run your open play right
          from your phone.
        </p>
      </div>

      <form
        className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800"
        onSubmit={(e) => {
          e.preventDefault();
          onCreate({ name, courts, target, winBy2, venue, courtNames, format });
        }}
      >
        {saved.length > 0 && (
          <div>
            <span className="mb-1.5 block text-xs font-medium text-neutral-500">
              Recent venues
            </span>
            <div className="flex flex-wrap gap-1.5">
              {saved.map((v) => (
                <button
                  key={v.venue}
                  type="button"
                  onClick={() => applyVenue(v)}
                  className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200"
                >
                  {v.venue}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Venue</span>
          <input
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="Vantage Pickleball, Parañaque"
            className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2.5 text-base outline-none focus:border-court focus:ring-1 focus:ring-court dark:border-neutral-700"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Session name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Friday Night Open Play"
            className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2.5 text-base outline-none focus:border-court focus:ring-1 focus:ring-court dark:border-neutral-700"
          />
        </label>

        <Stepper label="Courts" value={courts} min={1} max={12} onChange={setCourtCount} />

        <div>
          <span className="mb-1.5 block text-sm font-medium">Play to</span>
          <div className="flex items-center gap-2">
            <div className="grid flex-1 grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
              {TARGETS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTarget(t)}
                  className={`rounded-lg py-2 text-sm font-semibold tabular-nums transition ${
                    target === t
                      ? "bg-white text-court shadow-sm dark:bg-neutral-900 dark:text-court-light"
                      : "text-neutral-500"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setWinBy2((w) => !w)}
              aria-pressed={winBy2}
              className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                winBy2
                  ? "border-court bg-court/10 text-court dark:text-court-light"
                  : "border-neutral-300 text-neutral-400 dark:border-neutral-700"
              }`}
            >
              Win by 2
            </button>
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">Play mode</span>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
            {FORMATS.map((f) => (
              <FormatTab
                key={f.key}
                active={format === f.key}
                title={f.title}
                onClick={() => setFormat(f.key)}
              />
            ))}
          </div>
          <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            {FORMATS.find((f) => f.key === format)?.blurb}
          </p>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">Court names</span>
          <div className="grid grid-cols-2 gap-2">
            {courtNames.map((cn, i) => (
              <input
                key={i}
                value={cn}
                onChange={(e) =>
                  setCourtNames((prev) => {
                    const out = [...prev];
                    out[i] = e.target.value;
                    return out;
                  })
                }
                placeholder={`Court ${i + 1}`}
                className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-court dark:border-neutral-700"
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-court py-3.5 text-base font-semibold text-white transition active:scale-[0.99] hover:bg-court-dark"
        >
          Start session
        </button>
      </form>

      <RulesCard />

      <p className="text-center text-xs text-neutral-400">
        Everything runs on this device — no account, works offline court-side.
      </p>
    </div>
  );
}

function FormatTab({
  active,
  title,
  onClick,
}: {
  active: boolean;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-lg py-2 text-xs font-semibold transition ${
        active
          ? "bg-white text-court shadow-sm dark:bg-neutral-900 dark:text-court-light"
          : "text-neutral-500"
      }`}
    >
      {title}
    </button>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <div className="flex items-center rounded-lg border border-neutral-300 dark:border-neutral-700">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="px-3 py-2.5 text-lg font-bold text-neutral-500 active:text-court"
          aria-label={`decrease ${label}`}
        >
          −
        </button>
        <span className="flex-1 text-center text-base font-semibold tabular-nums">
          {value}
          {suffix ? <span className="ml-0.5 text-xs text-neutral-400">{suffix}</span> : null}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          className="px-3 py-2.5 text-lg font-bold text-neutral-500 active:text-court"
          aria-label={`increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
