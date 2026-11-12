import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted (from @fontsource-variable, OFL) so builds never depend on reaching Google Fonts.
const inter = localFont({
  src: "./fonts/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  weight: "100 900",
});

const newsreader = localFont({
  src: [
    { path: "./fonts/newsreader-latin-wght-normal.woff2", style: "normal" },
    { path: "./fonts/newsreader-latin-wght-italic.woff2", style: "italic" },
  ],
  variable: "--font-newsreader",
  weight: "200 800",
});

export const metadata: Metadata = {
  title: "StudySync",
  description:
    "Combine every syllabus into one timeline and spot overlapping deadlines early.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable} antialiased`}>
      <body>
        <div className="studysync-demo app-shell">{children}</div>
      </body>
    </html>
  );
}
