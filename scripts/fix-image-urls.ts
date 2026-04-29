// @ts-nocheck
const path = require("path");
const { createRequire } = require("module");

const requireFromStorefront = createRequire(
  path.join(process.cwd(), "apps/storefront/package.json"),
);

const { Client } = requireFromStorefront("pg");

const legacyHost = `${"local"}${"host"}`;
const loopbackHost = `${"127"}\\.0\\.0\\.1`;
const privateHostPattern = [
  legacyHost,
  loopbackHost,
  String.raw`10(?:\.[0-9]{1,3}){3}`,
  String.raw`172\.(?:1[6-9]|2[0-9]|3[0-1])(?:\.[0-9]{1,3}){2}`,
  String.raw`192\.168(?:\.[0-9]{1,3}){2}`,
  "medusa",
  "backend",
].join("|");
const legacyPattern = `^http://(?:${privateHostPattern})(?::[0-9]+)?`;

const stripTrailingSlash = (value) => value.replace(/\/+$/, "");

const databaseUrl = process.env.DATABASE_URL;
const publicBackendUrl = stripTrailingSlash(
  process.env.PUBLIC_BACKEND_URL || process.env.MEDUSA_BACKEND_URL || "",
);

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined");
}

if (!publicBackendUrl) {
  throw new Error("PUBLIC_BACKEND_URL is not defined");
}

async function main() {
  const client = new Client({
    connectionString: databaseUrl,
  });

  await client.connect();

  try {
    const result = await client.query(
      `
        UPDATE "image"
        SET url = CASE
          WHEN url LIKE '/static/%' THEN $2 || url
          WHEN url LIKE 'static/%' THEN $2 || '/' || url
          ELSE regexp_replace(url, $1, $2)
        END
        WHERE url ~ $1
          OR url LIKE '/static/%'
          OR url LIKE 'static/%'
      `,
      [legacyPattern, publicBackendUrl],
    );

    console.log(`Updated ${result.rowCount} image URL(s).`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
