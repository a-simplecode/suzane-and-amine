import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Suzane & Amine - Wedding Invitation",
  description: "You're invited to celebrate the wedding of Suzane & Amine on August 8th, 2026",
  keywords: ["wedding", "invitation", "Suzane", "Amine", "August 8th 2026"],
  authors: [{ name: "Suzane & Amine" }],
  openGraph: {
    title: "Suzane & Amine - Wedding Invitation",
    description: "You're invited to celebrate our special day on August 8th, 2026",
    type: "website",
    images: [
      {
        url: "/background.jpeg",
        width: 1200,
        height: 630,
        alt: "Wedding Invitation Background",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Suzane & Amine - Wedding Invitation",
    description: "You're invited to celebrate our special day on August 8th, 2026",
    images: ["/background.jpeg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          minHeight: "100vh",
          backgroundAttachment: "fixed",
        }}
      >
        {children}
      </body>
    </html>
  );
}
