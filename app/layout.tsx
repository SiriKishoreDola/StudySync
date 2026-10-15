import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Topbar from "@/components/Topbar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "StudySync",
  description:
    "Combine every syllabus into one timeline and spot overlapping deadlines early.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body>
        <main className="app-shell text-zinc-900">
          <div className="ambient ambient-one" />
          <div className="ambient ambient-two" />

          <Topbar />

          <div className="app-content">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
