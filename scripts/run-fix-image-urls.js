const fs = require("fs")
const path = require("path")

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return
  }

  const content = fs.readFileSync(filePath, "utf8")

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith("#")) {
      return
    }

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)

    if (!match) {
      return
    }

    const [, key, rawValue] = match

    if (Object.prototype.hasOwnProperty.call(process.env, key)) {
      return
    }

    process.env[key] = rawValue.replace(/^["']|["']$/g, "")
  })
}

loadEnvFile(path.join(process.cwd(), "apps/backend/.env"))

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: "CommonJS",
  moduleResolution: "Node",
})

require("../apps/backend/node_modules/ts-node/register/transpile-only")
require("./fix-image-urls.ts")
