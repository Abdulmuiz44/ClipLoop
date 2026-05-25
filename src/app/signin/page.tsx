import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ContinueWithGoogleButton } from "@/components/auth/continue-with-x-button";
import { ClipLoopLogo } from "@/components/ui/cliploop-logo";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (session?.user) {
    redirect(params?.callbackUrl || "/app");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-md items-center justify-center">
      <section className="w-full rounded-xl border border-slate-200 bg-white p-7">
        <div>
          <ClipLoopLogo href="/" />
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Sign in</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use Google to access your ClipLoop workspace.
          </p>
        </div>

        {params?.error ? (
          <div className="mt-5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
            Google sign-in failed. Check your account access and try again.
          </div>
        ) : null}

        <div className="mt-6">
          <ContinueWithGoogleButton />
        </div>

        <p className="mt-5 text-center text-sm text-slate-500">
          Need beta access?{" "}
          <Link href="/request-access" className="font-medium text-slate-900 hover:underline">
            Request access
          </Link>
        </p>
      </section>
    </div>
  );
}
