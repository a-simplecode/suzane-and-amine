export const EVENT = {
  coupleNames: ["Suzane", "Amine"] as const,
  // Local Lebanon time (UTC+3) for the ceremony start.
  dateISO: "2026-08-29T19:00:00+03:00",
  dateLabel: "Saturday, August 29, 2026",
  dateDigits: { month: "08", day: "29", year: "2026" },
  venue: {
    name: "L'Heritage Venue",
    area: "Nahr El Kalb, Lebanon",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=L%27Heritage+Venue+Nahr+El+Kalb+Lebanon",
  },
  schedule: [
    { time: "7:00 PM", title: "Arabic Mass", note: "Outdoor section" },
    { time: "8:00 PM", title: "Welcome Drink", note: "" },
    { time: "8:30 PM", title: "Dinner & Party", note: "" },
  ],
  details: [
    { label: "Dress Code", value: "Formal attire" },
    { label: "Parking", value: "Valet parking available" },
  ],
  maxHeadcount: 8,
} as const;
