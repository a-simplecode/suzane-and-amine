import { getInvite, getAllInvites } from "@/lib/invites";
import { InvalidInvite } from "@/components/InvalidInvite";
import { Countdown } from "@/components/Countdown";
import { Monogram } from "@/components/Monogram";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllInvites().map((invite) => ({ slug: invite.slug }));
}

export const dynamicParams = true;

export default async function InvitePage({ params }: Props) {
  const { slug } = await params;
  const invite = getInvite(slug);

  if (!invite) {
    return <InvalidInvite />;
  }

  return (
    <main className="relative min-h-dvh bg-bg-beige text-ink-olive-deep">
      <header className="fixed inset-x-0 top-0 flex items-start justify-between px-5 pt-5 z-20">
        <Countdown mode="corner" />
      </header>
      <section className="min-h-dvh grid place-items-center px-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <Monogram className="w-24 h-auto" />
          <p className="font-display text-3xl">{invite.label}</p>
          <p className="text-xs uppercase tracking-[0.25em] opacity-60">
            Scene coming next.
          </p>
        </div>
      </section>
    </main>
  );
}

export function generateMetadata() {
  return {
    title: "Suzane & Amine · Aug 29, 2026",
  };
}
