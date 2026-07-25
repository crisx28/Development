"use client";

import { useState } from "react";

interface Props {
  onCreate: (name: string, courts: number, target: number) => void;
}

export function SetupScreen({ onCreate }: Props) {
  const [name, setName] = useState("");
  const [courts, setCourts] = useState(2);
  const [target, setTarget] = useState(11);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <div className="mb-3 text-5xl">🥒</div>
        <h1 className="text-3xl font-black tracking-tight text-court dark:text-court-light">
          DinkQueue
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Fair court time, balanced games, no whiteboard. Run your open play
          right from your phone.
        </p>
      </div>

      <form
        className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800"
        onSubmit={(e) => {
          e.preventDefault();
          onCreate(name, courts, target);
        }}
      >
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Session name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Friday Night Open Play"
            className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2.5 text-base outline-none focus:border-court focus:ring-1 focus:ring-court dark:border-neutral-700"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <Stepper label="Courts" value={courts} min={1} max={12} onChange={setCourts} />
          <Stepper label="Play to" value={target} min={7} max={21} step={2} onChange={setTarget} suffix="pts" />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-court py-3.5 text-base font-semibold text-white transition active:scale-[0.99] hover:bg-court-dark"
        >
          Start session
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-neutral-400">
        Everything runs on this device — no account, works offline court-side.
      </p>
    </div>
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
