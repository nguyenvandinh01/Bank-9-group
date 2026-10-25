#!/usr/bin/env node
/**
 * Pre-deploy sanity check.
 *
 * The repo ships with a placeholder D1 database_id so that local development
 * works out of the box. Deploying with that placeholder fails with a confusing
 * Cloudflare API error, so fail early with actionable instructions instead.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = readFileSync(join(root, "wrangler.jsonc"), "utf8");

const databaseId = config.match(/"database_id"\s*:\s*"([^"]*)"/)?.[1] ?? "";
const bucketName = config.match(/"bucket_name"\s*:\s*"([^"]*)"/)?.[1] ?? "";
const problems = [];

if (!databaseId) {
  problems.push("wrangler.jsonc is missing d1_databases[0].database_id.");
} else if (/^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(databaseId)) {
  problems.push(
    "wrangler.jsonc still contains the placeholder D1 database_id (00000000-0000-0000-0000-000000000000).",
  );
}

if (!bucketName) {
  problems.push("wrangler.jsonc is missing r2_buckets[0].bucket_name.");
}

if (problems.length > 0) {
  console.error("\nCannot deploy yet:\n");
  for (const problem of problems) console.error(`  - ${problem}`);

  console.error(`
Create the Cloudflare resources first (once per account):

  1. npx wrangler login
  2. npx wrangler d1 create bank9-db
  3. Copy the "database_id" printed by step 2 into wrangler.jsonc
  4. npx wrangler r2 bucket create bank9-images

Then configure production secrets:

  npx wrangler secret put ADMIN_EMAIL
  npx wrangler secret put ADMIN_PASSWORD
  npx wrangler secret put SESSION_SECRET

Apply the schema and demo data on the remote database:

  npm run db:migrate:remote
  npm run db:seed:remote

Finally deploy:

  npm run deploy

Important: deploy this project as a Cloudflare Worker (Workers Builds or
"wrangler deploy"), NOT as a Cloudflare Pages site. The app needs the Worker
runtime, D1, R2 and a cron trigger; a static Pages deployment only serves the
source files and shows a blank page.
`);
  process.exit(1);
}

console.log("Deploy preflight OK: D1 database_id and R2 bucket are configured.");
