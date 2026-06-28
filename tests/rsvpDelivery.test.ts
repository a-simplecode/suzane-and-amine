import { describe, it, expect } from "vitest";
import {
  formatRsvpText,
  parsePhoneList,
  toWhatsappAddress,
  twilioEndpoint,
  twilioMessageBody,
  twilioTemplateBody,
  buildRsvpVariables,
  twilioAuthHeader,
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

describe("parsePhoneList", () => {
  it("returns [] for undefined or empty", () => {
    expect(parsePhoneList(undefined)).toEqual([]);
    expect(parsePhoneList("")).toEqual([]);
    expect(parsePhoneList("  ")).toEqual([]);
  });

  it("parses and trims a comma-separated list", () => {
    expect(parsePhoneList("+96176466341, +96179174361")).toEqual([
      "+96176466341",
      "+96179174361",
    ]);
  });
});

describe("toWhatsappAddress", () => {
  it("prefixes a bare number", () => {
    expect(toWhatsappAddress("+9617646")).toBe("whatsapp:+9617646");
  });
  it("leaves an already-prefixed number unchanged", () => {
    expect(toWhatsappAddress("whatsapp:+9617646")).toBe("whatsapp:+9617646");
  });
});

describe("twilioEndpoint", () => {
  it("builds the Messages endpoint for the account", () => {
    expect(twilioEndpoint("AC123")).toBe(
      "https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json",
    );
  });
});

describe("twilioMessageBody", () => {
  it("encodes From, To (whatsapp-prefixed) and Body", () => {
    const b = twilioMessageBody("+14155238886", "+96176466341", "hi\nthere");
    expect(b.get("From")).toBe("whatsapp:+14155238886");
    expect(b.get("To")).toBe("whatsapp:+96176466341");
    expect(b.get("Body")).toBe("hi\nthere");
    expect(b.toString()).toContain("Body=hi%0Athere");
  });
});

describe("buildRsvpVariables", () => {
  it("packs an attending RSVP into a single {{1}} details block", () => {
    expect(
      buildRsvpVariables({ attending: true, headcount: 2, names: ["Suzane", "Amine"], message: "Yay" }),
    ).toEqual({ "1": "Attending · 2 guests\nGuests: Suzane, Amine\nMessage: Yay" });
  });

  it("omits guests/message lines when empty and singularizes 1 guest", () => {
    expect(
      buildRsvpVariables({ attending: true, headcount: 1, names: ["Amine"], message: "" }),
    ).toEqual({ "1": "Attending · 1 guest\nGuests: Amine" });
  });

  it("handles regrets", () => {
    expect(
      buildRsvpVariables({ attending: false, headcount: 0, names: [], message: "" }),
    ).toEqual({ "1": "Not attending · 0 guests" });
  });
});

describe("twilioTemplateBody", () => {
  it("encodes From, To, ContentSid and ContentVariables", () => {
    const b = twilioTemplateBody("+14155238886", "+96176466341", "HX123", { "1": "Attending", "2": "2" });
    expect(b.get("From")).toBe("whatsapp:+14155238886");
    expect(b.get("To")).toBe("whatsapp:+96176466341");
    expect(b.get("ContentSid")).toBe("HX123");
    expect(b.get("ContentVariables")).toBe('{"1":"Attending","2":"2"}');
  });
});

describe("twilioAuthHeader", () => {
  it("builds a Basic auth header from sid:token", () => {
    expect(twilioAuthHeader("AC123", "secret")).toBe(
      "Basic " + Buffer.from("AC123:secret").toString("base64"),
    );
  });
});
