import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { ClipLoopLogo } from "@/components/ui/cliploop-logo";

export const metadata: Metadata = {
  metadataBase: new URL("https://cliploop.app"),
  title: {
    default: "ClipLoop | Short form promo content for brands, businesses, and creators",
    template: "%s | ClipLoop",
  },
  description: "ClipLoop is building a simpler way for brands, businesses, and creators to create short form promo content faster.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ClipLoop | Short form promo content for brands, businesses, and creators",
    description: "ClipLoop is building a simpler way for brands, businesses, and creators to create short form promo content faster.",
    url: "/",
    siteName: "ClipLoop",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClipLoop | Short form promo content for brands, businesses, and creators",
    description: "Short form promo content for brands, businesses, and creators.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-40 border-b cl-divider bg-white/95 backdrop-blur-sm">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 md:py-4">
            <ClipLoopLogo href="/" />
            <div className="flex items-center gap-1 text-sm text-slate-700">
              <Link href="/app" className="rounded-lg px-3 py-1.5 transition hover:bg-slate-100">
                Open App
              </Link>
              <Link href="/pricing" className="rounded-lg px-3 py-1.5 transition hover:bg-slate-100">
                Pricing
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">{children}</main>
      </body>
    </html>
  );
}
