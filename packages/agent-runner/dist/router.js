"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolve = resolve;
const allowlist_1 = require("./policies/allowlist");
function resolve(tag) {
    const cfg = allowlist_1.ALLOW[tag];
    if (!cfg)
        throw new Error(`Unknown or disallowed tag: ${tag}`);
    return cfg;
}
