import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Navbar } from "@/components/Navbar";
import { ParticleField } from "@/components/ParticleField";
import { Footer } from "@/components/Footer";
import { buildStructuredDataDocument } from "@/data/structuredData";
import { site } from "@/data/site";
import "./globals.css";

const geist = localFont({
  variable: "--font-geist-sans",
  style: "normal",
  weight: "300 800",
  src: [
    {
      path: "../../public/fonts/geist-latin.woff2",
      weight: "300 800",
      style: "normal",
    },
    {
      path: "../../public/fonts/geist-latin-ext.woff2",
      weight: "300 800",
      style: "normal",
    },
  ],
});

const geistMono = localFont({
  variable: "--font-geist-mono",
  style: "normal",
  weight: "400 500",
  src: [
    {
      path: "../../public/fonts/geist-mono-latin.woff2",
      weight: "400 500",
      style: "normal",
    },
    {
      path: "../../public/fonts/geist-mono-latin-ext.woff2",
      weight: "400 500",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.domain),
  /**
   * `template` applies to every child page that sets its own `title`; the home
   * page's title is `default`. A product page passing `"Hilbras SDK"` renders
   * `"Hilbras SDK — Hilbras"` without the child repeating the company name.
   */
  title: {
    default: site.searchTitle,
    template: "%s — Hilbras",
  },
  description: site.searchDescription,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: { url: "/favicon.svg", type: "image/svg+xml" },
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    siteName: site.name,
    url: "/",
    title: site.searchTitle,
    description: site.searchDescription,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: site.imageAlt,
      },
    ],
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
    title: site.searchTitle,
    description: site.searchDescription,
    creator: site.socialHandle,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0b09" },
  ],
  colorScheme: "light dark",
};

/**
 * Applies the stored theme before first paint. The hidden-state rules in
 * globals.css are gated on `html.has-js`, so this script is what makes the
 * scroll reveal opt-in for visitors who can run it, and a no-op for everyone
 * else.
 */
const themeInit = `
(function () {
  document.documentElement.classList.add('has-js');
  try {
    var stored = localStorage.getItem('hilbras-theme');
    var theme = stored || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.dataset.theme = theme;
  } catch (error) {
    document.documentElement.dataset.theme = 'dark';
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const structuredData = buildStructuredDataDocument();

  return (
    <html lang="en" data-theme="dark" className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: structuredData.replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body className="min-h-dvh bg-bg font-sans text-text antialiased">
        <ParticleField />
        <Navbar />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
