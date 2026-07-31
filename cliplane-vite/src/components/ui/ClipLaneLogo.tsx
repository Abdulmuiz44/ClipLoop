import { Link } from "react-router-dom";

type LogoProps = {
  href?: string;
  compact?: boolean;
  light?: boolean;
};

export function ClipLaneLogo({ href = "/app", compact, light }: LogoProps) {
  const textClass = light ? "text-white" : "text-white text-white";
  const logo = (
    <span className="inline-flex items-center gap-2.5 rounded-lg">
      <img
        src="/assets/cliplane-logo.jpg"
        alt="ClipLane logo"
        className="h-7 w-7 rounded-md border border-[#1F1F1F] object-cover border-[#1F1F1F]"
      />
      {!compact ? (
        <span className={`text-sm font-semibold tracking-tight ${textClass}`}>
          ClipLane
        </span>
      ) : null}
    </span>
  );

  return <Link to={href}>{logo}</Link>;
}
