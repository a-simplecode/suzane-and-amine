// Flat-illustrated couple, per the story spec. Drives makeAvatarTexture.
export type Avatar = {
  id: "suzane" | "amine";
  name: string;
  skin: string;
  hair: string;
  garment: string; // dress / suit color
  beard?: string; // amine only
};

export const AVATARS: Avatar[] = [
  {
    id: "suzane",
    name: "Suzane",
    skin: "#f1cdb4",
    hair: "#5a3b28", // long straight brown
    garment: "#fbf7ee", // white dress
  },
  {
    id: "amine",
    name: "Amine",
    skin: "#cf9a6f", // tan
    hair: "#1c1712",
    garment: "#3a3f33", // dark suit
    beard: "#1c1712", // black short trimmed beard + mustache
  },
];
