import { NextResponse } from "next/server";

function assertDebugHeader(request: Request) {
  const header = request.headers.get("x-cliploop-debug");
  if (!header || header !== "safe") {
    return NextResponse.json(
      { error: "Debug access denied.", code: "DEBUG_ACCESS_DENIED", secretsExposed: false },
      { status: 401 },
    );
  }
  return null;
}

async function check(name: string, fn: () => Promise<void>): Promise<{ name: string; ok: boolean; errorName?: string; safeMessage?: string }> {
  try {
    await fn();
    return { name, ok: true };
  } catch (error) {
    const safe = {
      name,
      ok: false,
      errorName: error instanceof Error ? error.name : "Error",
      safeMessage: error instanceof Error ? error.message : "Import check failed",
    };
    return safe;
  }
}

export async function GET(request: Request) {
  const denied = assertDebugHeader(request);
  if (denied) return denied;

  const checks = await Promise.all([
    check("validation_import", async () => {
      await import("@/lib/validation/weekly-promo");
    }),
    check("weekly_promo_service_import", async () => {
      await import("@/domains/weekly-promo/service");
    }),
    check("render_storage_import", async () => {
      const mod = await import("@/lib/render/storage");
      if (typeof mod.prepareRenderOutput !== "function") {
        throw new Error("prepareRenderOutput not exported from render storage");
      }
    }),
    check("hyperframes_adapter_import", async () => {
      const mod = await import("@/lib/render/adapters/hyperframes");
      if (typeof mod.hyperframesRenderAdapter !== "object" || !mod.hyperframesRenderAdapter.render) {
        throw new Error("hyperframesRenderAdapter.render not available");
      }
    }),
  ]);

  return NextResponse.json({
    ok: checks.every((item) => item.ok),
    checks,
    secretsExposed: false,
  });
}

export const dynamic = "force-dynamic";
