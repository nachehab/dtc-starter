const fs = require("fs")
const path = require("path")

const root = process.cwd()
const blocked = [`${"local"}${"host"}`, `${"127"}.0.0.1`]
const allowedCommandName = `check-no-${blocked[0]}`
const blockedIpPattern = /https?:\/\/(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?/i

const ignoredDirectories = new Set([
  ".git",
  ".medusa",
  ".next",
  ".next-build-check",
  "build",
  "coverage",
  "dist",
  "docs",
  "node_modules",
])

const ignoredFiles = new Set([
  ".env",
  ".env.example",
  ".env.template",
  "AGENTS.md",
  "README.md",
  "check-medusa-health.js",
  "package-lock.json",
  "pnpm-lock.yaml",
])

const binaryExtensions = new Set([
  ".ico",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".pdf",
  ".zip",
])

const textExtensions = new Set([
  "",
  ".cjs",
  ".css",
  ".env",
  ".example",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".sh",
  ".sql",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
])

const findings = []

const shouldScan = (filePath) => {
  const basename = path.basename(filePath)
  const extension = path.extname(filePath)

  if (/^\.env(?:\..*)?(?:\.example|\.template)$/.test(basename)) {
    return false
  }

  if (ignoredFiles.has(basename)) {
    return false
  }

  if (binaryExtensions.has(extension)) {
    return false
  }

  return textExtensions.has(extension)
}

const scanFile = (filePath) => {
  if (!shouldScan(filePath)) {
    return
  }

  const relativePath = path.relative(root, filePath)
  const content = fs.readFileSync(filePath, "utf8")
  const lines = content.split(/\r?\n/)

  lines.forEach((line, index) => {
    const isDockerHealthcheck =
      ["Dockerfile", "docker-compose.yaml"].includes(
        relativePath
      ) &&
      (line.includes("HEALTHCHECK_URL") ||
        line.includes("check-medusa-health") ||
        (line.includes(`${"127"}.0.0.1`) && line.includes("http.get")))

    if (isDockerHealthcheck) {
      return
    }

    const inspectedLine = line.replaceAll(allowedCommandName, "")
    const matchedToken = blocked.find((token) =>
      inspectedLine.toLowerCase().includes(token)
    )

    if (matchedToken || blockedIpPattern.test(inspectedLine)) {
      findings.push({
        file: relativePath,
        line: index + 1,
        value: line.trim(),
      })
    }
  })
}

const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        walk(path.join(directory, entry.name))
      }

      continue
    }

    if (entry.isFile()) {
      scanFile(path.join(directory, entry.name))
    }
  }
}

walk(root)

if (findings.length > 0) {
  console.error("Blocked local or numeric URL references found:")
  findings.forEach((finding) => {
    console.error(`${finding.file}:${finding.line}: ${finding.value}`)
  })
  process.exit(1)
}

console.log("No blocked local or numeric URL references found.")
