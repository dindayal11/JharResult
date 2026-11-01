export function makeSlug(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim()
    .replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 240) || `notice-${Date.now()}`;
}
