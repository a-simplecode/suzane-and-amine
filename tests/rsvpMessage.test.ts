import { describe, it, expect } from "vitest";
import { composeRsvpMessage } from "@/lib/rsvpMessage";

describe("composeRsvpMessage", () => {
  it("returns the trimmed message when no dietary note", () => {
    expect(composeRsvpMessage("  hello  ", "")).toBe("hello");
    expect(composeRsvpMessage("hello", "   ")).toBe("hello");
  });

  it("returns only the dietary line when message is empty", () => {
    expect(composeRsvpMessage("", "vegan")).toBe("Dietary: vegan");
    expect(composeRsvpMessage("   ", "  nut allergy ")).toBe("Dietary: nut allergy");
  });

  it("appends the dietary line after the message", () => {
    expect(composeRsvpMessage("See you there", "gluten free")).toBe(
      "See you there\n\nDietary: gluten free",
    );
  });

  it("returns empty string when both are empty", () => {
    expect(composeRsvpMessage("", "")).toBe("");
  });
});
