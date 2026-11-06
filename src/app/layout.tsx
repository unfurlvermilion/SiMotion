import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SiMotion — Fashion & Video Creative Studio",
  description: "Autonomiczne studio kreacji wideo i lookbooków: Seedance, Higgsfield, ElevenLabs, Smart Crop i Microsoft Excel Online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body>{children}</body>
    </html>
  );
}
