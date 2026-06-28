import { EVENT } from "@/data/event";
import { Reveal } from "@/components/motion/Reveal";

type Card = {
  kicker: string;
  title: string;
  lines: { label: string; value: string }[];
  cta?: { label: string; href: string };
};

function buildCards(): Card[] {
  const [ceremony, ...rest] = EVENT.schedule;
  const dress = EVENT.details.find((d) => d.label === "Dress Code");
  const parking = EVENT.details.find((d) => d.label === "Parking");

  return [
    {
      kicker: "The Ceremony",
      title: ceremony.title,
      lines: [
        { label: "Date", value: EVENT.dateLabel },
        { label: "Time", value: ceremony.time },
        { label: "Where", value: ceremony.note || EVENT.venue.name },
      ],
    },
    {
      kicker: "The Venue",
      title: EVENT.venue.name,
      lines: [
        { label: "Location", value: EVENT.venue.area },
        ...(dress ? [{ label: "Dress Code", value: dress.value }] : []),
        ...(parking ? [{ label: "Parking", value: parking.value }] : []),
      ],
      cta: { label: "Open in Maps", href: EVENT.venue.mapsUrl },
    },
    {
      kicker: "The Reception",
      title: "Celebration",
      lines: rest.map((s) => ({
        label: s.time,
        value: s.note ? `${s.title} · ${s.note}` : s.title,
      })),
    },
  ];
}

export function InvitationCards() {
  const cards = buildCards();
  return (
    <section id="v2-details" className="relative bg-deepsage px-6 py-28 text-cream">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mb-16 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.4em] text-cream/60">
            The Invitation
          </p>
          <h2 className="font-display text-4xl sm:text-5xl">Details of the Day</h2>
        </Reveal>

        <div className="grid gap-8 md:grid-cols-3">
          {cards.map((card, i) => (
            <Reveal key={card.kicker} delay={i * 0.1}>
              <article className="group h-full overflow-hidden rounded-sm border border-cream/15 bg-cream/[0.04] p-8 transition-all duration-500 hover:-translate-y-2 hover:border-cream/40 hover:bg-cream/[0.08] hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
                <p className="mb-1 text-xs uppercase tracking-[0.3em] text-cream/50">
                  {card.kicker}
                </p>
                <h3 className="font-display text-3xl text-cream">{card.title}</h3>
                <span className="my-5 block h-px w-12 bg-cream/30 transition-all duration-500 group-hover:w-20" />
                <dl className="space-y-4">
                  {card.lines.map((line, j) => (
                    <div key={j}>
                      <dt className="text-[0.65rem] uppercase tracking-[0.25em] text-cream/50">
                        {line.label}
                      </dt>
                      <dd className="mt-0.5 text-cream/90">{line.value}</dd>
                    </div>
                  ))}
                </dl>
                {card.cta && (
                  <a
                    href={card.cta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-cream underline decoration-cream/40 underline-offset-4 transition-colors hover:decoration-cream"
                  >
                    {card.cta.label} →
                  </a>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
