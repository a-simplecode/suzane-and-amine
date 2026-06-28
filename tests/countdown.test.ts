import { describe, it, expect } from "vitest";
import { computeCountdown } from "@/lib/countdown";

describe("computeCountdown", () => {
  const target = new Date("2026-08-29T19:00:00+03:00").getTime();

  it("returns positive parts before the event", () => {
    const now = new Date("2026-08-28T19:00:00+03:00").getTime();
    const c = computeCountdown(target, now);
    expect(c.days).toBe(1);
    expect(c.hours).toBe(0);
    expect(c.minutes).toBe(0);
    expect(c.seconds).toBe(0);
    expect(c.isPast).toBe(false);
  });

  it("breaks down mixed durations", () => {
    const now = new Date("2026-08-28T16:30:45+03:00").getTime();
    const c = computeCountdown(target, now);
    expect(c.days).toBe(1);
    expect(c.hours).toBe(2);
    expect(c.minutes).toBe(29);
    expect(c.seconds).toBe(15);
  });

  it("clamps to zero and flags past once the event has passed", () => {
    const now = new Date("2026-08-30T19:00:00+03:00").getTime();
    const c = computeCountdown(target, now);
    expect(c).toMatchObject({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
  });
});
