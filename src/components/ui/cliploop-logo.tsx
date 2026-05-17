import Link from "next/link";

export function ClipLoopLogo({
  href = "/app",
  compact = false,
}: {
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 rounded-lg">
      <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-md border border-blue-200 bg-blue-600 text-[10px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.08)]">
        CL
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full border border-white bg-emerald-500" />
      </span>
      {!compact ? <span className="text-sm font-semibold tracking-tight text-slate-900">ClipLoop</span> : null}
    </Link>
  );
}
