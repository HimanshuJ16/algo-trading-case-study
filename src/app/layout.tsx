import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Bricolage_Grotesque, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { site } from "@/content/caseStudy";
import SmoothScroll from "@/components/SmoothScroll";
import Rail from "@/components/Rail";
import Grain from "@/components/Grain";

/**
 * Display and text face. The width and optical-size axes are loaded because
 * the chapter titles run narrowed (wdth 88) and the hero narrower still at
 * display optical size.
 */
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  display: "swap",
});

/** Labels, values, code paths, and every number that has to line up. */
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
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
  themeColor: "#0f0f0d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bricolage.variable} ${plexMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        {/* Stamp data-js before hydration so reveal gating never hides
            content from a client that cannot run scripts. */}
        <Script id="js-flag" strategy="beforeInteractive">
          {"document.documentElement.setAttribute('data-js','1')"}
        </Script>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Grain />
        <SmoothScroll>
          {children}
          <Rail />
        </SmoothScroll>
      </body>
    </html>
  );
}
