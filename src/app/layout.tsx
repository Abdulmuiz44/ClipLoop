import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { ClipLoopLogo } from "@/components/ui/cliploop-logo";

export const metadata: Metadata = {
  metadataBase: new URL("https://cliploop.app"),
  title: {
    default: "ClipLoop | Localized Short-Form Engine for Businesses, Creators, and Apps",
    template: "%s | ClipLoop",
  },
  description: "ClipLoop helps businesses, creators, and apps generate, render, approve, schedule, track, and improve localized weekly short-form promo packs.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ClipLoop | Localized Short-Form Engine for Businesses, Creators, and Apps",
    description:
      "Generate the week, render the posts, schedule the pack, track outcomes, then build the next cycle from what worked.",
    url: "/",
    siteName: "ClipLoop",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClipLoop | Localized Short-Form Engine for Businesses, Creators, and Apps",
    description: "A practical weekly content loop for Nigerian businesses, creators, and product teams.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <ClipLoopLogo href="/" />
            <div className="flex items-center gap-1.5 text-sm text-slate-700">
              <Link href="/app" className="rounded-lg px-3 py-1.5 hover:bg-slate-100">
                Open App
              </Link>
              <Link href="/pricing" className="rounded-lg px-3 py-1.5 hover:bg-slate-100">
                Pricing
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 md:py-10">{children}</main>
      </body>
    </html>
  );
}
