"use client";

import { motion } from "framer-motion";
import { FormEvent, useCallback, useMemo, useState } from "react";

type Props = {
  visible: boolean;
  slug: string;
  max: number;
  onSubmitted: () => void;
};

const PENDING_KEY = "pending-rsvp";

type Pending = {
  slug: string;
  count: number;
  names: string[];
  ts: number;
};

async function postRsvp(payload: Pending) {
  const res = await fetch("/api/rsvp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

export function RsvpForm({ visible, slug, max, onSubmitted }: Props) {
  const [count, setCount] = useState<number>(0);
  const [allNames, setAllNames] = useState<string[]>(() => Array(max).fill(""));
  const [submitting, setSubmitting] = useState(false);

  const options = useMemo(
    () => Array.from({ length: max + 1 }, (_, i) => i),
    [max],
  );

  const names = allNames.slice(0, count);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (submitting) return;
      setSubmitting(true);

      const payload: Pending = {
        slug,
        count,
        names: names.map((n) => n.trim()),
        ts: Date.now(),
      };

      try {
        await postRsvp(payload);
        try {
          localStorage.removeItem(PENDING_KEY);
        } catch {}
        onSubmitted();
      } catch {
        try {
          localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
        } catch {}
        onSubmitted();
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, slug, count, names, onSubmitted],
  );

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={visible ? { y: 0 } : { y: "100%" }}
      transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
      className="fixed inset-x-0 bottom-0 z-30 bg-bg-beige-warm rounded-t-3xl shadow-[0_-14px_40px_rgba(47,58,34,0.18)] px-6 pt-7 pb-[max(28px,env(safe-area-inset-bottom))]"
      role="dialog"
      aria-label="RSVP form"
    >
      <div className="mx-auto h-1 w-12 rounded-full bg-accent-olive/30 mb-5" />
      <h3 className="text-center font-display text-3xl text-ink-olive-deep">
        Will you join us?
      </h3>
      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.2em] text-accent-olive">
            Number of guests
          </span>
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="rounded-lg bg-bg-beige border border-accent-olive/30 px-4 py-3 text-ink-olive-deep font-display text-lg focus:outline-none focus:ring-2 focus:ring-accent-olive/40"
          >
            {options.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        {count > 0 && (
          <div className="flex flex-col gap-3">
            {names.map((value, i) => (
              <label key={i} className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-[0.2em] text-accent-olive">
                  Name of guest {i + 1}
                </span>
                <input
                  type="text"
                  required
                  value={value}
                  onChange={(e) => {
                    const next = [...allNames];
                    next[i] = e.target.value;
                    setAllNames(next);
                  }}
                  className="rounded-lg bg-bg-beige border border-accent-olive/30 px-4 py-3 text-ink-olive-deep focus:outline-none focus:ring-2 focus:ring-accent-olive/40"
                />
              </label>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-full rounded-full bg-accent-olive py-3 text-bg-beige font-display text-lg tracking-wide disabled:opacity-50 active:scale-[0.98] transition"
        >
          {submitting ? "Sending…" : "Send RSVP"}
        </button>
      </form>
    </motion.div>
  );
}
