import type { Metadata } from "next";
import { Bangers, Inter } from "next/font/google";
import "./globals.css";

const bangers = Bangers({ weight: "400", subsets: ["latin"], variable: "--font-comic" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Ben Gary Leo | Portfolio",
  description: "Projects, skills and contact details.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bangers.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
