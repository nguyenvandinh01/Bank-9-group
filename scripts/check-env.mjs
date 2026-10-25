#!/usr/bin/env node
/**
 * Local development preflight.
 *
 * Vite 8 needs Node 20.19+ / 22.12+. An older Node makes `npm run dev` exit
 * immediately, which shows up in the browser as ERR_CONNECTION_REFUSED.
 */
import { copyFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [major, minor] = process.versions.node.split(".").map(Number);

if (major < 22 || (major === 22 && minor < 12)) {
  console.error(`
Node.js ${process.versions.node} is too old. Vite 8 requires Node 22.12+ (24 recommended).

Install Node 24 from https://nodejs.org/ then run "npm install" and "npm run dev" again.
If you use nvm-windows: nvm install 24 && nvm use 24
`);
  process.exit(1);
}

if (!existsSync(join(root, ".dev.vars"))) {
  if (existsSync(join(root, ".dev.vars.example"))) {
    copyFileSync(join(root, ".dev.vars.example"), join(root, ".dev.vars"));
    console.log("Created .dev.vars from .dev.vars.example (local demo credentials).");
  } else {
    console.error("Missing .dev.vars and .dev.vars.example; cannot start the Worker locally.");
    process.exit(1);
  }
}

console.log(`Node ${process.versions.node} OK. Starting local server...`);
