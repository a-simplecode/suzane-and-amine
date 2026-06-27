import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://suzane-and-amine.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Suzane & Amine · Aug 29, 2026",
  description: "We can't wait to celebrate with you in Nahr El Kalb, Lebanon.",
  openGraph: {
    title: "Suzane & Amine · Aug 29, 2026",
    description: "We can't wait to celebrate with you in Nahr El Kalb, Lebanon.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Suzane & Amine · Aug 29, 2026",
    description: "We can't wait to celebrate with you in Nahr El Kalb, Lebanon.",
  },
};

export const viewport: Viewport = {
  themeColor: "#232a18",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // expose the notch / home-indicator insets so env(safe-area-inset-*) works
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://www.google.com" />
        <link rel="dns-prefetch" href="https://maps.google.com" />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
