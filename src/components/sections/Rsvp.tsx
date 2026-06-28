"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EVENT } from "@/data/event";
import { composeRsvpMessage } from "@/lib/rsvpMessage";
import { Sprig } from "@/components/botanicals/Sprig";

type Status = "idle" | "submitting" | "success" | "error";

const inputClass =
  "w-full rounded-sm border border-sage/50 bg-cream px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-deepsage";
const labelClass = "mb-1.5 block text-xs uppercase tracking-[0.2em] text-sage";

export function Rsvp() {
  const [attending, setAttending] = useState<boolean | null>(null);
  const [count, setCount] = useState(1);
  const [names, setNames] = useState<string[]>([""]);
  const [dietary, setDietary] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  function setCountClamped(n: number) {
    const c = Math.max(1, Math.min(EVENT.maxHeadcount, n));
    setCount(c);
    setNames((prev) => {
      const next = prev.slice(0, c);
      while (next.length < c) next.push("");
      return next;
    });
  }

  function updateName(i: number, v: string) {
    setNames((prev) => prev.map((n, idx) => (idx === i ? v : n)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (attending === null) {
      setError("Please let us know if you can make it.");
      return;
    }

    const headcount = attending ? count : 0;
    const cleanNames = attending ? names.map((n) => n.trim()).filter(Boolean) : [];
    if (attending && cleanNames.length !== count) {
      setError("Please enter a name for each guest.");
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headcount,
          names: cleanNames,
          message: composeRsvpMessage(message, dietary),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <section id="v2-rsvp" className="relative bg-deepsage px-6 py-28 text-cream">
      <div className="mx-auto max-w-xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.4em] text-cream/60">
            Be There
          </p>
          <h2 className="font-display text-4xl sm:text-5xl">Will You Join Us?</h2>
          <p className="mt-4 text-cream/70">
            Kindly respond by replying below. We can&apos;t wait to celebrate with you.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              key="success"
              className="flex flex-col items-center rounded-sm border border-cream/20 bg-cream/[0.05] p-12 text-center"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 140, delay: 0.15 }}
              >
                <Sprig draw className="h-24 w-24" />
              </motion.div>
              <h3 className="mt-4 font-display text-3xl text-cream">Thank You</h3>
              <p className="mt-2 text-cream/75">
                {attending
                  ? "Your reply is in — we are so happy you'll be with us."
                  : "Thank you for letting us know. You'll be missed."}
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={submit}
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Attendance */}
              <div>
                <span className={labelClass}>Will you attend?</span>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { v: true, l: "Joyfully accepts" },
                    { v: false, l: "Regretfully declines" },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={String(opt.v)}
                      onClick={() => setAttending(opt.v)}
                      className={`rounded-sm border px-4 py-3 text-sm transition-colors ${
                        attending === opt.v
                          ? "border-cream bg-cream text-deepsage"
                          : "border-cream/30 text-cream/80 hover:border-cream/60"
                      }`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence initial={false}>
                {attending && (
                  <motion.div
                    className="space-y-6 overflow-hidden"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    <div>
                      <label className={labelClass} htmlFor="v2-count">
                        Number of guests
                      </label>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setCountClamped(count - 1)}
                          className="h-11 w-11 rounded-sm border border-cream/30 text-xl text-cream transition-colors hover:border-cream/60"
                          aria-label="Fewer guests"
                        >
                          −
                        </button>
                        <span
                          id="v2-count"
                          className="w-8 text-center font-display text-2xl"
                        >
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCountClamped(count + 1)}
                          className="h-11 w-11 rounded-sm border border-cream/30 text-xl text-cream transition-colors hover:border-cream/60"
                          aria-label="More guests"
                        >
                          +
                        </button>
                        <span className="text-xs text-cream/50">
                          up to {EVENT.maxHeadcount}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className={labelClass}>Guest name{count > 1 ? "s" : ""}</span>
                      {names.map((n, i) => (
                        <input
                          key={i}
                          type="text"
                          value={n}
                          onChange={(e) => updateName(i, e.target.value)}
                          placeholder={`Guest ${i + 1}`}
                          className={inputClass}
                          maxLength={100}
                        />
                      ))}
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="v2-dietary">
                        Dietary requirements
                      </label>
                      <input
                        id="v2-dietary"
                        type="text"
                        value={dietary}
                        onChange={(e) => setDietary(e.target.value)}
                        placeholder="Allergies, vegetarian, etc. (optional)"
                        className={inputClass}
                        maxLength={200}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className={labelClass} htmlFor="v2-message">
                  A note to the couple
                </label>
                <textarea
                  id="v2-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Share your wishes (optional)"
                  className={`${inputClass} resize-none`}
                  maxLength={500}
                />
              </div>

              {error && (
                <p className="text-sm text-[#e8c9a0]" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full rounded-full border border-cream bg-cream px-8 py-4 text-sm uppercase tracking-[0.2em] text-deepsage transition-colors duration-300 hover:bg-transparent hover:text-cream disabled:opacity-60"
              >
                {status === "submitting" ? "Sending…" : "Send RSVP"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
