import type { ButtonHTMLAttributes } from "react";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    "inline-flex items-center justify-center rounded-lg bg-blue-600 px-3.5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50";
  return (
    <button {...props} className={`${base} ${props.className ?? ""}`} />
  );
}
