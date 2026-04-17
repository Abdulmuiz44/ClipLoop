import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

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
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="font-semibold tracking-tight text-slate-950">
              ClipLoop
            </Link>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700">
              <Link href="/pricing">Pricing</Link>
              <Link href="/request-access">Request access</Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/dashboard/projects/new">New Project</Link>
              <Link href="/dashboard/settings">Settings</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
      </body>
    </html>
  );
}
