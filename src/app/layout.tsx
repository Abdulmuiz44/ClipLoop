import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClipLoop",
  description: "Lean AI-powered growth automation for indie apps",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold text-slate-900">
              ClipLoop
            </Link>
            <div className="flex gap-4 text-sm">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/dashboard/projects/new">New Project</Link>
              <Link href="/dashboard/settings">Settings</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
