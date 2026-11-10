import type { Metadata } from "next";
import { Manrope, Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["600", "700", "800"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Kastoria Longevity Performance Engine",
  description:
    "Daily longevity briefs, personalized protocols, and branded content generation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${manrope.variable}`}>
        <style>{`
          :root {
            --font-display: var(--font-syne), "Avenir Next", sans-serif;
            --font-body: var(--font-manrope), "Gill Sans", sans-serif;
          }
        `}</style>
        {children}
      </body>
    </html>
  );
}
