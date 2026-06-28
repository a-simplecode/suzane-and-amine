import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { EVENT } from "@/data/event";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const title = `${EVENT.coupleNames[0]} & ${EVENT.coupleNames[1]} · ${EVENT.dateLabel}`;

export const metadata: Metadata = {
  title,
  description: `Join us to celebrate the wedding of ${EVENT.coupleNames[0]} & ${EVENT.coupleNames[1]} at ${EVENT.venue.name}, ${EVENT.venue.area}.`,
  openGraph: { title, type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
