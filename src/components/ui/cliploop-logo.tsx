import Link from "next/link";

export function ClipLoopLogo({
  href = "/app",
  compact = false,
}: {
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-2">
      <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-bold text-white">
        CL
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
      </span>
      {!compact ? <span className="text-sm font-semibold tracking-tight text-slate-900">ClipLoop</span> : null}
    </Link>
  );
}
