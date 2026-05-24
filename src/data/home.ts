export type HomeContent = {
  title: string;
  subtitle: string;
  cta: { label: string; href: string };
};

export const homeContent: HomeContent = {
  title: "Title goes here",
  subtitle: "Subtitle goes here.",
  cta: { label: "Action", href: "#" },
};
