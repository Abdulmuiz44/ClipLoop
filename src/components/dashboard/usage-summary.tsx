export function UsageSummary({
  usage,
  limits,
  remaining,
  title = "Usage limits",
  subtitle,
}: {
  usage: {
    postsPerWeek: number;
    postsPerMonth: number;
    manualRegenerationsPerWeek: number;
    rendersPerMonth: number;
    publishesPerMonth: number;
  };
  limits: {
    activeProjects?: number;
    postsPerWeek: number;
    postsPerMonth: number;
    manualRegenerationsPerWeek: number;
    rendersPerMonth: number;
    publishesPerMonth: number;
    connectedChannels?: number;
  };
  remaining?: {
    postsPerWeek: number;
    postsPerMonth: number;
    manualRegenerationsPerWeek: number;
    rendersPerMonth: number;
    publishesPerMonth: number;
  };
  title?: string;
  subtitle?: string;
}) {
  const rows = [
    {
      label: "Weekly generation",
      used: usage.postsPerWeek,
      limit: limits.postsPerWeek,
      remaining: remaining?.postsPerWeek ?? Math.max(0, limits.postsPerWeek - usage.postsPerWeek),
    },
    {
      label: "Monthly generation",
      used: usage.postsPerMonth,
      limit: limits.postsPerMonth,
      remaining: remaining?.postsPerMonth ?? Math.max(0, limits.postsPerMonth - usage.postsPerMonth),
    },
    {
      label: "Weekly refinements",
      used: usage.manualRegenerationsPerWeek,
      limit: limits.manualRegenerationsPerWeek,
      remaining:
        remaining?.manualRegenerationsPerWeek ??
        Math.max(0, limits.manualRegenerationsPerWeek - usage.manualRegenerationsPerWeek),
    },
    {
      label: "Monthly video renders",
      used: usage.rendersPerMonth,
      limit: limits.rendersPerMonth,
      remaining: remaining?.rendersPerMonth ?? Math.max(0, limits.rendersPerMonth - usage.rendersPerMonth),
    },
    {
      label: "Monthly published posts",
      used: usage.publishesPerMonth,
      limit: limits.publishesPerMonth,
      remaining: remaining?.publishesPerMonth ?? Math.max(0, limits.publishesPerMonth - usage.publishesPerMonth),
    },
  ];

  const hasProductAccess = rows.some((row) => row.limit > 0);

  return (
    <section className="cl-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4 cl-divider">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-600 leading-relaxed">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
          {typeof limits.activeProjects === "number" ? (
            <span className="cl-badge bg-slate-100 text-slate-600">Active projects: {limits.activeProjects}</span>
          ) : null}
          {typeof limits.connectedChannels === "number" ? (
            <span className="cl-badge bg-slate-100 text-slate-600">Max channels: {limits.connectedChannels}</span>
          ) : null}
        </div>
      </div>

      {!hasProductAccess ? (
        <div className="mt-6 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-800 leading-relaxed">
          Your workspace access is currently restricted. Upgrade to Pro or request beta approval to start creating.
        </div>
      ) : null}

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <li key={row.label} className="rounded-2xl border p-4 cl-divider bg-slate-50/50">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{row.label}</span>
              <span className={`text-sm font-bold ${row.limit > 0 && row.used >= row.limit ? "text-rose-600" : "text-slate-950"}`}>
                {row.used} / {row.limit}
              </span>
            </div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
               <div 
                 className={`h-full transition-all ${row.limit > 0 && row.used >= row.limit ? "bg-rose-500" : "bg-slate-900"}`}
                 style={{ width: `${Math.min(100, (row.used / (row.limit || 1)) * 100)}%` }}
               />
            </div>
            <p className="mt-3 text-[10px] text-slate-500 font-medium uppercase tracking-tight">
               {row.remaining} credits available
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
