export type Allowed = { cmd: string; cwd: string };
export const ALLOW: Record<string, Allowed> = {
  "@dev:gym":    { cmd: "npm --workspace apps/mobile-gym run start", cwd: "." },
  "@dev:closet": { cmd: "npm --workspace apps/mobile-closet run start", cwd: "." }
};
