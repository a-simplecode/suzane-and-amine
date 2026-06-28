import { describe, it, expect } from "vitest";
import {
  formatRsvpText,
  parseWhatsappRecipients,
  callMeBotUrl,
} from "@/lib/rsvpDelivery";

const DATE = "Saturday, August 29, 2026";

describe("formatRsvpText", () => {
  it("formats an attending RSVP with guests and message", () => {
    const t = formatRsvpText(
      { attending: true, headcount: 2, names: ["Suzane", "Amine"], message: "Yay!" },
      DATE,
    );
    expect(t).toContain("Attending");
    expect(t).toContain("Headcount: 2");
    expect(t).toContain("Guests: Suzane, Amine");
    expect(t).toContain("Message: Yay!");
    expect(t).toContain(DATE);
  });

  it("formats a regrets RSVP without guests or message", () => {
    const t = formatRsvpText(
      { attending: false, headcount: 0, names: [], message: "" },
      DATE,
    );
    expect(t).toContain("Regrets");
    expect(t).not.toContain("Guests:");
    expect(t).not.toContain("Message:");
  });
});

describe("parseWhatsappRecipients", () => {
  it("returns [] for undefined or empty", () => {
    expect(parseWhatsappRecipients(undefined)).toEqual([]);
    expect(parseWhatsappRecipients("")).toEqual([]);
    expect(parseWhatsappRecipients("  ")).toEqual([]);
  });

  it("parses a single recipient", () => {
    expect(parseWhatsappRecipients("96170123456:abc123")).toEqual([
      { phone: "96170123456", apikey: "abc123" },
    ]);
  });

  it("parses multiple recipients and trims whitespace", () => {
    expect(parseWhatsappRecipients("111:k1, 222:k2")).toEqual([
      { phone: "111", apikey: "k1" },
      { phone: "222", apikey: "k2" },
    ]);
  });

  it("splits on the first colon only (apikey may contain colons)", () => {
    expect(parseWhatsappRecipients("111:a:b:c")).toEqual([
      { phone: "111", apikey: "a:b:c" },
    ]);
  });

  it("drops malformed entries", () => {
    expect(parseWhatsappRecipients("nocolon, 111:k1, :nophone, 222:")).toEqual([
      { phone: "111", apikey: "k1" },
    ]);
  });
});

describe("callMeBotUrl", () => {
  it("builds an encoded CallMeBot URL", () => {
    const url = callMeBotUrl({ phone: "111", apikey: "k1" }, "hello world\nline2");
    expect(url).toContain("https://api.callmebot.com/whatsapp.php?");
    expect(url).toContain("phone=111");
    expect(url).toContain("apikey=k1");
    expect(url).toContain("text=hello+world%0Aline2");
  });
});
