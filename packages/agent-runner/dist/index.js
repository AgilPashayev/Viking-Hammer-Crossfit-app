#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const router_1 = require("./router");
const process_1 = require("./monitors/process");
const tag = process.argv[2];
if (!tag) {
    console.error("Usage: npm run agent -- <tag>   e.g., npm run agent -- @dev:gym");
    process.exit(1);
}
const { cmd, cwd } = (0, router_1.resolve)(tag);
console.log(`[agent] running ${tag}: "${cmd}" (cwd: ${cwd})`);
(0, process_1.run)(cmd, cwd);
