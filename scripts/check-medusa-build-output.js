#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

const root = process.cwd()
const backend = path.join(root, "apps", "backend")

const expected = path.join(backend, ".medusa/server/public/admin/index.html")

console.log("Checking Medusa admin build output...")

if (!fs.existsSync(expected)) {
  console.error("Missing admin build:", expected)
  process.exit(1)
}

console.log("OK: admin build present")
