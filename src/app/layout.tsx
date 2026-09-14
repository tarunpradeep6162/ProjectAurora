import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import ReducedMotionRoot from "@/components/ReducedMotionRoot";
import MotionSafetyNet from "@/components/MotionSafetyNet";
import SmoothScroll from "@/components/SmoothScroll";
import CosmicAtmosphere from "@/components/cosmic/CosmicAtmosphere";
import CinematicCursor from "@/components/CinematicCursor";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const SITE_TITLE = "Project Aurora — For Dheepika";
const SITE_DESCRIPTION =
  "A cinematic love letter from Tarun to Dheepika — an interactive journey through the story they built together.";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  // Absolute, production origin — never a localhost URL, so the social
  // card and canonical link resolve correctly wherever this is shared.
  metadataBase: new URL("https://project-aurora-v2.vercel.app"),
  applicationName: "Project Aurora",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: SITE_TITLE,
    description:
      "Created with love by Tarun, for Dheepika. An interactive journey through their story.",
    siteName: "Project Aurora",
    url: "/",
    locale: "en_US",
    type: "website",
    // Image comes from `app/opengraph-image.tsx` (1200x630) automatically.
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description:
      "Created with love by Tarun, for Dheepika. An interactive journey through their story.",
    // Image comes from `app/twitter-image.tsx` (1200x630) automatically.
  },
};

export const viewport: Viewport = {
  themeColor: "#160b2d",
  colorScheme: "dark",
  // Lets the layout reach the physical screen edges on notched phones;
  // every fixed control and edge-anchored block pads itself with
  // env(safe-area-inset-*) in return.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${jost.variable} h-full antialiased`}
      // Some browser extensions inject attributes (e.g. a wallet/bridge
      // extension adding "webcrx") onto <html> before React hydrates,
      // which is otherwise reported as a hydration mismatch even though
      // nothing this app rendered actually differs. Scoped to this one
      // element only — it does not hide a real mismatch anywhere else.
      suppressHydrationWarning
    >
      {/* No background utility on <body> on purpose: an opaque background
          here would paint over every negative z-index layer and hide the
          cosmic sky entirely. The document's dark base lives on <html>
          (globals.css), which paints beneath everything. */}
      <body className="min-h-full flex flex-col text-foreground">
        <ReducedMotionRoot />
        <MotionSafetyNet />
        <SmoothScroll />
        {/* Graded CSS sky + scene transitions. Always mounted — it is the
            base layer under the WebGL canvas and, unchanged, the complete
            fallback whenever that canvas is absent. */}
        <CosmicAtmosphere />
        <a href="#main-content" className="sr-only-focusable">
          Skip to content
        </a>
        <div className="vignette" aria-hidden="true" />
        <div className="film-grain" aria-hidden="true" />
        <CinematicCursor />
        {children}
      </body>
    </html>
  );
}
