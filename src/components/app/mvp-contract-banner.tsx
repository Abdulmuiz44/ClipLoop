import { MVP_CONTRACT_POINTS } from "@/lib/mvp-contract";

export function MvpContractBanner() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">MVP contract</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {MVP_CONTRACT_POINTS.map((point) => (
          <div key={point.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{point.label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{point.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

