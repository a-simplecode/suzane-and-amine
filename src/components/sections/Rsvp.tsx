"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { EVENT } from "@/data/event";
import { Reveal } from "@/components/motion/Reveal";

type Status = "idle" | "submitting" | "success" | "error";

export function Rsvp() {
  const [headcount, setHeadcount] = useState(0);
  const [names, setNames] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  function changeHeadcount(n: number) {
    setHeadcount(n);
    setNames((prev) => {
      const next = prev.slice(0, n);
      while (next.length < n) next.push("");
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ headcount, names, message }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Something went wrong.");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    }
  }

  return (
    <section className="px-6 py-28">
      <div className="mx-auto max-w-md">
        <Reveal>
          <h2 className="mb-3 text-center font-display text-4xl text-ink sm:text-5xl">RSVP</h2>
          <p className="mb-12 text-center text-deepsage">Kindly reply below.</p>
        </Reveal>

        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              key="thanks"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-sage/30 bg-deepsage/5 px-8 py-14 text-center"
            >
              <p className="font-display text-3xl text-ink">Thank you!</p>
              <p className="mt-3 text-deepsage">
                {headcount > 0
                  ? "We can't wait to celebrate with you."
                  : "We'll miss you, but thank you for letting us know."}
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={submit}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-6"
            >
              <label className="flex flex-col gap-2">
                <span className="text-sm uppercase tracking-widest text-sage">Number of guests</span>
                <select
                  value={headcount}
                  onChange={(e) => changeHeadcount(Number(e.target.value))}
                  className="rounded-lg border border-sage/40 bg-cream px-4 py-3 text-ink"
                >
                  {Array.from({ length: EVENT.maxHeadcount + 1 }, (_, i) => (
                    <option key={i} value={i}>
                      {i === 0 ? "Regretfully cannot attend" : i}
                    </option>
                  ))}
                </select>
              </label>

              <AnimatePresence>
                {names.map((name, i) => (
                  <motion.label
                    key={i}
                    className="flex flex-col gap-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 120, damping: 18 }}
                  >
                    <span className="text-sm uppercase tracking-widest text-sage">
                      Guest {i + 1} name
                    </span>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) =>
                        setNames((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))
                      }
                      className="rounded-lg border border-sage/40 bg-cream px-4 py-3 text-ink"
                    />
                  </motion.label>
                ))}
              </AnimatePresence>

              <label className="flex flex-col gap-2">
                <span className="text-sm uppercase tracking-widest text-sage">Message (optional)</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="rounded-lg border border-sage/40 bg-cream px-4 py-3 text-ink"
                />
              </label>

              {status === "error" && <p className="text-sm text-red-700">{error}</p>}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="rounded-full bg-deepsage py-3 text-sm uppercase tracking-widest text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
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
