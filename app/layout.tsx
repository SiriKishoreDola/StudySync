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
        <div className="studysync-demo app-shell">
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          <Topbar />
          <main className="demo-main" id="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
