export const MVP_CONTRACT = {
  activeProjects: 1,
  connectedChannels: 1,
  weeklyPackSize: 5,
  primaryChannel: "instagram",
} as const;

export const MVP_CONTRACT_POINTS = [
  {
    label: "One project",
    detail: "Keep every account focused on a single active workspace until the core loop is proven.",
  },
  {
    label: "One channel",
    detail: "Ship with Instagram first so generation, rendering, and publishing stay opinionated.",
  },
  {
    label: "One weekly pack",
    detail: "Aim for five posts per week so the output is small enough to finish and inspect.",
  },
] as const;

