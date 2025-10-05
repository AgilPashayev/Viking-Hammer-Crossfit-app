"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const node_child_process_1 = require("node:child_process");
function run(cmd, cwd) {
    const child = (0, node_child_process_1.spawn)(cmd, { cwd, stdio: "inherit", shell: true });
    child.on("exit", (code) => process.exit(code ?? 0));
}
