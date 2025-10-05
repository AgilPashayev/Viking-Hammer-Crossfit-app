import { ALLOW } from "./policies/allowlist";
export function resolve(tag: string) {
  const cfg = ALLOW[tag];
  if (!cfg) throw new Error(`Unknown or disallowed tag: ${tag}`);
  return cfg;
}
