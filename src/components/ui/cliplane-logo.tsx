import Link from "next/link";
import Image from "next/image";

export function ClipLaneLogo({
  href = "/app",
  compact = false,
  textClassName,
}: {
  href?: string;
  compact?: boolean;
  textClassName?: string;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 rounded-lg">
      <Image
        src="/assets/cliplane-logo.jpg"
        alt="ClipLane logo"
        width={28}
        height={28}
        className="h-7 w-7 rounded-md border border-slate-200 object-cover"
        priority
      />
      {!compact ? <span className={`text-sm font-semibold tracking-tight ${textClassName ?? "text-slate-900 dark:text-slate-100"}`}>ClipLane</span> : null}
    </Link>
  );
}
