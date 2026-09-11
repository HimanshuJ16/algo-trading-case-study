import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, JetBrains_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { site } from "@/content/caseStudy";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import SessionHUD from "@/components/SessionHUD";

/** UI grotesk: labels, buttons, small caps. */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

/** Values, code and captions. */
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

/** Text serif for headlines and prose, with optical sizing and true italics. */
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});

export const metadata: Metadata = {
  title: site.title,
  description: site.description,
  authors: [{ name: site.author }],
  openGraph: {
    title: site.title,
    description: site.description,
    type: "article",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf9f5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="ivory"
      className={`${geistSans.variable} ${jetbrainsMono.variable} ${newsreader.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* Stamp data-js before hydration so reveal gating never hides
            content for a client that cannot run scripts. */}
        <Script id="js-flag" strategy="beforeInteractive">
          {"document.documentElement.setAttribute('data-js','1')"}
        </Script>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SmoothScroll>
          {children}
          <SessionHUD />
        </SmoothScroll>
        <Cursor />
      </body>
    </html>
  );
}
