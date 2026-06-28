import { EVENT } from "@/data/event";

export const MAX_NAME_LENGTH = 100;
export const MAX_MESSAGE_LENGTH = 500;

export type Rsvp = {
  headcount: number;
  names: string[];
  message: string;
  attending: boolean;
};

export type ParseResult =
  | { ok: true; value: Rsvp }
  | { ok: false; error: string };

export function parseRsvp(input: unknown): ParseResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "Invalid payload." };
  }
  const { headcount, names, message } = input as Record<string, unknown>;

  if (typeof headcount !== "number" || !Number.isInteger(headcount)) {
    return { ok: false, error: "Headcount must be a whole number." };
  }
  if (headcount < 0 || headcount > EVENT.maxHeadcount) {
    return { ok: false, error: `Headcount must be between 0 and ${EVENT.maxHeadcount}.` };
  }
  if (!Array.isArray(names)) {
    return { ok: false, error: "Names must be a list." };
  }
  if (names.length !== headcount) {
    return { ok: false, error: "Please provide a name for each guest." };
  }
  const trimmedNames: string[] = [];
  for (const n of names) {
    if (typeof n !== "string" || n.trim().length === 0) {
      return { ok: false, error: "Guest names cannot be blank." };
    }
    const trimmed = n.trim();
    if (trimmed.length > MAX_NAME_LENGTH) {
      return { ok: false, error: "Guest names are too long." };
    }
    trimmedNames.push(trimmed);
  }
  const msg = typeof message === "string" ? message.trim() : "";
  if (msg.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: "Message is too long." };
  }

  return {
    ok: true,
    value: {
      headcount,
      names: trimmedNames,
      message: msg,
      attending: headcount > 0,
    },
  };
}
