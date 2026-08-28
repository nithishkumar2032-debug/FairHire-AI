import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FairHire — Auditable, Bias-Free Responsible AI Recruitment",
  description: "Transparent, explainable and auditable recruitment platform with human accountability and dual-score discrepancy verification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
      <body className="bg-background text-on-background antialiased font-sans selection:bg-secondary selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
