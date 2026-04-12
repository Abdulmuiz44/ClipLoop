import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-xl border bg-white p-8">
        <h1 className="text-3xl font-bold">Weekly growth content, without the chaos.</h1>
        <p className="mt-4 text-slate-700">
          ClipLoop helps indie SaaS teams generate a focused weekly strategy and 5 conversion-driven post
          drafts in minutes.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
        >
          Start in dashboard
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded border bg-white p-4">1) Add your product context</div>
        <div className="rounded border bg-white p-4">2) Generate weekly strategy</div>
        <div className="rounded border bg-white p-4">3) Generate + refine 5 post drafts</div>
      </section>
    </div>
  );
}
