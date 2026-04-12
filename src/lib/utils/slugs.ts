export function toSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function buildTrackingSlug(base: string, suffix: string): string {
  return `${toSlug(base)}-${toSlug(suffix)}-${Date.now().toString(36)}`;
}
