import { EVENT } from "@/data/event";
import { Monogram } from "@/components/botanicals/Monogram";
import { Reveal } from "@/components/motion/Reveal";

export function Footer() {
  return (
    <footer className="flex flex-col items-center gap-4 px-6 py-20 text-center">
      <Reveal>
        <Monogram className="w-24" />
        <p className="mt-2 text-sm uppercase tracking-[0.3em] text-sage">
          {EVENT.dateLabel}
        </p>
      </Reveal>
    </footer>
  );
}
