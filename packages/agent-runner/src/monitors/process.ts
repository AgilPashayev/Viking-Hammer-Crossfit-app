import { spawn } from "node:child_process";
export function run(cmd: string, cwd: string) {
  const child = spawn(cmd, { cwd, stdio: "inherit", shell: true });
  child.on("exit", (code) => process.exit(code ?? 0));
}
