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
      label: "Generation credits used this week",
      used: usage.postsPerWeek,
      limit: limits.postsPerWeek,
      remaining: remaining?.postsPerWeek ?? Math.max(0, limits.postsPerWeek - usage.postsPerWeek),
    },
    {
      label: "Generation credits used this month",
      used: usage.postsPerMonth,
      limit: limits.postsPerMonth,
      remaining: remaining?.postsPerMonth ?? Math.max(0, limits.postsPerMonth - usage.postsPerMonth),
    },
    {
      label: "Manual regenerations this week",
      used: usage.manualRegenerationsPerWeek,
      limit: limits.manualRegenerationsPerWeek,
      remaining:
        remaining?.manualRegenerationsPerWeek ??
        Math.max(0, limits.manualRegenerationsPerWeek - usage.manualRegenerationsPerWeek),
    },
    {
      label: "Render credits used this month",
      used: usage.rendersPerMonth,
      limit: limits.rendersPerMonth,
      remaining: remaining?.rendersPerMonth ?? Math.max(0, limits.rendersPerMonth - usage.rendersPerMonth),
    },
    {
      label: "Published posts this month",
      used: usage.publishesPerMonth,
      limit: limits.publishesPerMonth,
      remaining: remaining?.publishesPerMonth ?? Math.max(0, limits.publishesPerMonth - usage.publishesPerMonth),
    },
  ];

  const hasProductAccess = rows.some((row) => row.limit > 0);

  return (
    <section className="cl-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold tracking-tight">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {typeof limits.activeProjects === "number" ? (
            <span className="cl-badge">Active projects: {limits.activeProjects}</span>
          ) : null}
          {typeof limits.connectedChannels === "number" ? (
            <span className="cl-badge">Channels: {limits.connectedChannels}</span>
          ) : null}
        </div>
      </div>

      {!hasProductAccess ? (
        <p className="mt-3 text-sm text-slate-600">
          Product access is currently blocked. Upgrade to Pro or request access to continue.
        </p>
      ) : null}

      <ul className="mt-3 space-y-2 text-sm">
        {rows.map((row) => (
          <li key={row.label} className="rounded-xl border border-slate-200 bg-slate-50/40 px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <span>{row.label}</span>
              <span className={row.limit > 0 && row.used >= row.limit ? "font-semibold text-red-600" : "text-slate-700"}>
                {row.used} / {row.limit}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{row.remaining} remaining in the current window</p>
            {row.limit > 0 && row.used >= row.limit ? (
              <p className="mt-1 text-xs font-medium text-red-600">Limit reached for this window.</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
