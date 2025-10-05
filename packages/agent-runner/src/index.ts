#!/usr/bin/env node
import { resolve } from "./router";
import { run } from "./monitors/process";
const tag = process.argv[2];
if (!tag) {
  console.error("Usage: npm run agent -- <tag>   e.g., npm run agent -- @dev:gym");
  process.exit(1);
}
const { cmd, cwd } = resolve(tag);
console.log(`[agent] running ${tag}: "${cmd}" (cwd: ${cwd})`);
run(cmd, cwd);
