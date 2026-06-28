import { describe, it, expect } from "vitest";
import { parseRsvp } from "@/lib/rsvp";

describe("parseRsvp", () => {
  it("accepts a valid attending payload", () => {
    const r = parseRsvp({ headcount: 2, names: ["Suzane", "Amine"], message: "Can't wait!" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.headcount).toBe(2);
      expect(r.value.names).toEqual(["Suzane", "Amine"]);
      expect(r.value.attending).toBe(true);
    }
  });

  it("accepts a regrets (0 headcount) payload with no names", () => {
    const r = parseRsvp({ headcount: 0, names: [], message: "" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.attending).toBe(false);
  });

  it("rejects headcount above the max", () => {
    const r = parseRsvp({ headcount: 99, names: [], message: "" });
    expect(r.ok).toBe(false);
  });

  it("rejects when names count does not match headcount", () => {
    const r = parseRsvp({ headcount: 2, names: ["Only One"], message: "" });
    expect(r.ok).toBe(false);
  });

  it("rejects blank names", () => {
    const r = parseRsvp({ headcount: 1, names: ["   "], message: "" });
    expect(r.ok).toBe(false);
  });

  it("trims names and message", () => {
    const r = parseRsvp({ headcount: 1, names: ["  Amine  "], message: "  hi  " });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.names[0]).toBe("Amine");
      expect(r.value.message).toBe("hi");
    }
  });
});
