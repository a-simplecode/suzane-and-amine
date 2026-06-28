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

  // "Two places. One love." — the journey map. x/y are percentage
  // positions on the stylized SVG map (0 = left/top, 100 = right/bottom).
  cities: {
    vancouver: {
      name: "Vancouver",
      country: "Canada",
      x: 16,
      y: 40,
      blurb:
        "Where the groom built his world — between the mountains and the Pacific, the half of the story that looks west.",
    },
    beirut: {
      name: "Beirut",
      country: "Lebanon",
      x: 56,
      y: 52,
      blurb:
        "Where the bride's heart beats — sea, cedar, and warmth on the Mediterranean, the half of the story that looks east.",
    },
  },

  // Our Story timeline, ordered Vancouver -> Beirut.
  // `photo` is a path under /public; the section renders an elegant
  // placeholder frame until the real image is dropped in.
  story: [
    {
      place: "Vancouver, Canada",
      year: "Where it began",
      title: "Two cities, one sky",
      text: "Eight thousand kilometres apart — a coast of cedar and a coast of pine. Two lives running in parallel, not yet knowing they pointed at each other.",
      photo: "/story/1.jpg",
    },
    {
      place: "Across the world",
      year: "The distance",
      title: "Letters across an ocean",
      text: "Time zones learned by heart. Good-mornings that arrived at midnight. A love that refused to be measured in miles.",
      photo: "/story/2.jpg",
    },
    {
      place: "Beirut, Lebanon",
      year: "Forever",
      title: "Where two became one",
      text: "From two cities to one forever. This August, the journey ends where it always meant to — together, beneath a Lebanese sky.",
      photo: "/story/3.jpg",
    },
  ],
} as const;
