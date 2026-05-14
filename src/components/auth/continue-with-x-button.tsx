import { signInWithX } from "@/lib/auth/actions";

export function ContinueWithXButton() {
  return (
    <form action={signInWithX}>
      <button
        type="submit"
        className="flex h-12 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        Continue with X
      </button>
    </form>
  );
}

