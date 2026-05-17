import { signInWithX } from "@/lib/auth/actions";

export function ContinueWithXButton() {
  return (
    <form action={signInWithX}>
      <button
        type="submit"
        className="flex h-12 w-full items-center justify-center rounded-lg border border-slate-300 bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        Continue with X
      </button>
    </form>
  );
}

