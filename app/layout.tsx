import type { Metadata } from "next";
import { Gowun_Batang } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

const gowunBatang = Gowun_Batang({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-gowun-batang",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BeaconGate — Evidence-first ads enforcement",
  description:
    "Policy-as-code and LLM advisory checks with a reviewer queue and audit-ready case files.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={gowunBatang.variable}>
      <body className="min-h-screen font-sans">
        <Nav />
        {children}
      </body>
    </html>
  );
}
