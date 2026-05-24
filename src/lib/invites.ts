import invitesData from "@/data/invites.json";

export type Invite = {
  slug: string;
  label: string;
  max: number;
};

const invites: Invite[] = invitesData as Invite[];

export function getInvite(slug: string): Invite | null {
  const match = invites.find((i) => i.slug === slug);
  return match ?? null;
}

export function getAllInvites(): Invite[] {
  return invites;
}
