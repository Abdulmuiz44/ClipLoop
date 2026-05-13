export { getGatewayConfig } from "@/gateway/config";
export {
  getGatewayAuth,
  getGatewayCreditGuard,
  getGatewayOrchestrator,
  getGatewayProviderAccess,
  getGatewayRenderExecutor,
} from "@/gateway/local-adapters";
export type {
  GatewayAuth,
  GatewayCapability,
  GatewayCreditGuard,
  GatewayIdentity,
  GatewayOrchestrator,
  GatewayProviderAccess,
  GatewayRenderExecutor,
} from "@/gateway/contracts";

