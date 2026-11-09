import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SiMotion — Sinsay Motion Studio",
  description: "Studio produkcji wideo i lookbooków Sinsay.",
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
