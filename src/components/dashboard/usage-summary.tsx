export function UsageSummary({
  usage,
  limits,
}: {
  usage: {
    postsPerWeek: number;
    postsPerMonth: number;
    manualRegenerationsPerWeek: number;
    rendersPerMonth: number;
    publishesPerMonth: number;
  };
  limits: {
    postsPerWeek: number;
    postsPerMonth: number;
    manualRegenerationsPerWeek: number;
    rendersPerMonth: number;
    publishesPerMonth: number;
  };
}) {
  const rows = [
    { label: "Posts this week", used: usage.postsPerWeek, limit: limits.postsPerWeek },
    { label: "Posts this month", used: usage.postsPerMonth, limit: limits.postsPerMonth },
    { label: "Regenerations this week", used: usage.manualRegenerationsPerWeek, limit: limits.manualRegenerationsPerWeek },
    { label: "Renders this month", used: usage.rendersPerMonth, limit: limits.rendersPerMonth },
    { label: "Publishes this month", used: usage.publishesPerMonth, limit: limits.publishesPerMonth },
  ];

  return (
    <section className="rounded border bg-white p-4">
      <h2 className="font-semibold">Usage limits</h2>
      <ul className="mt-2 space-y-2 text-sm">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between">
            <span>{row.label}</span>
            <span className={row.used >= row.limit ? "font-semibold text-red-600" : "text-slate-700"}>
              {row.used} / {row.limit}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
