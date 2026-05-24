import { getInvite, getAllInvites } from "@/lib/invites";
import { InvalidInvite } from "@/components/InvalidInvite";
import { Scene } from "@/components/Scene";

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

  return <Scene invite={invite} />;
}

export function generateMetadata() {
  return {
    title: "Suzane & Amine · Aug 29, 2026",
  };
}
