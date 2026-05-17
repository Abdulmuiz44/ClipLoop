import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { env } from "@/lib/env";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!env.MOCK_MODE) {
    const session = await auth();
    if (!session?.user) redirect("/signin?callbackUrl=/dashboard");
  }

  return children;
}
