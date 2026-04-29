#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

const root = process.cwd()
const backend = path.join(root, "apps", "backend")

const candidates = [
  path.join(backend, ".medusa", "admin", "index.html"),
  path.join(backend, ".medusa", "server", "public", "admin", "index.html"),
]

console.log("Checking Medusa admin build output...")

const found = candidates.find((candidate) => fs.existsSync(candidate))

if (!found) {
  console.error("Missing Medusa admin build. Checked:")
  for (const candidate of candidates) {
    console.error(`- ${candidate}`)
  }
  console.error("Run `pnpm --filter @dtc/backend build` before starting production, and keep DISABLE_MEDUSA_ADMIN=false when the admin should be served by Medusa.")
  process.exit(1)
}

console.log(`OK: admin build present at ${found}`)
