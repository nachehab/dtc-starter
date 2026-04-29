const fs = require("fs");
const path = require("path");

const root = process.cwd();
const httpPrefix = `${"http"}://`;
const loopHostToken = `${"local"}${"host"}`;
const blockedHmrPort = [":", "379", "63"].join("");

const scanTargets = [
  "apps/backend/medusa-config.ts",
  "apps/backend/src",
  "apps/backend/.medusa/server/public/admin",
  "apps/storefront/next.config.js",
  "apps/storefront/src",
  "apps/storefront/.next/static",
  "apps/storefront/.next/server/app",
];

const ignoredDirectories = new Set([".git", ".turbo", "cache", "node_modules"]);

const textExtensions = new Set([
  "",
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".mjs",
  ".ts",
  ".tsx",
]);

const forbidden = [
  {
    label: "private LAN address",
    pattern: /192[.]168[.]/i,
  },
  {
    label: "browser loopback URL",
    pattern: new RegExp(`${loopHostToken}(?::[0-9]+|/)`, "i"),
  },
  {
    label: "random Vite HMR port",
    pattern: new RegExp(`${blockedHmrPort}\\b`),
  },
  {
    label: "internal Medusa service URL",
    pattern: new RegExp(`${httpPrefix}medusa(?::|/)`, "i"),
  },
  {
    label: "internal backend service URL",
    pattern: new RegExp(`${httpPrefix}backend(?::|/)`, "i"),
  },
  {
    label: "private .local URL",
    pattern: new RegExp(`${httpPrefix}[^\\s"'<>]+[.]local(?::|/|\\b)`, "i"),
  },
];

const findings = [];

const shouldScan = (filePath) => {
  return textExtensions.has(path.extname(filePath));
};

const scanFile = (filePath) => {
  if (!shouldScan(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    forbidden.forEach(({ label, pattern }) => {
      if (pattern.test(line)) {
        findings.push({
          file: path.relative(root, filePath),
          line: index + 1,
          label,
          value: line.trim(),
        });
      }
    });
  });
};

const walk = (targetPath) => {
  if (!fs.existsSync(targetPath)) {
    return;
  }

  const stats = fs.statSync(targetPath);

  if (stats.isFile()) {
    scanFile(targetPath);
    return;
  }

  for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        walk(path.join(targetPath, entry.name));
      }

      continue;
    }

    if (entry.isFile()) {
      scanFile(path.join(targetPath, entry.name));
    }
  }
};

scanTargets.forEach((target) => walk(path.join(root, target)));

if (findings.length > 0) {
  console.error("Forbidden public URL values found in client-facing files:");
  findings.forEach((finding) => {
    console.error(
      `${finding.file}:${finding.line} [${finding.label}] ${finding.value}`,
    );
  });
  process.exit(1);
}

console.log("No forbidden public URL values found in client-facing files.");
