export type GatewayConfig = {
  enabled: boolean;
  mode: "local_app" | "hosted";
  requireApiKey: boolean;
  defaultRateLimitPerMinute: number;
};

export function getGatewayConfig(): GatewayConfig {
  const mode = process.env.CLIPLANE_GATEWAY_MODE === "hosted" ? "hosted" : "local_app";
  return {
    enabled: process.env.CLIPLANE_GATEWAY_ENABLED === "true",
    mode,
    requireApiKey: process.env.CLIPLANE_GATEWAY_REQUIRE_API_KEY === "true",
    defaultRateLimitPerMinute: Number(process.env.CLIPLANE_GATEWAY_RATE_LIMIT_PER_MINUTE ?? 60),
  };
}

