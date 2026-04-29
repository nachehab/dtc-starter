const fs = require("fs");
const path = require("path");

const root = process.cwd();

const backendKeys = [
  "PUBLIC_BACKEND_URL",
  "MEDUSA_BACKEND_URL",
  "MEDUSA_ADMIN_BACKEND_URL",
  "PUBLIC_ASSET_BASE_URL",
  "DATABASE_URL",
  "REDIS_URL",
  "CACHE_REDIS_URL",
  "LOCKING_REDIS_URL",
  "STORE_CORS",
  "ADMIN_CORS",
  "AUTH_CORS",
  "JWT_SECRET",
  "COOKIE_SECRET",
  "VITE_HOST",
  "VITE_ORIGIN",
  "VITE_ALLOWED_HOSTS",
  "VITE_PUBLIC_HOST",
  "VITE_PUBLIC_ADMIN_BASE_URL",
  "VITE_PUBLIC_BACKEND_URL",
  "VITE_PUBLIC_ASSET_BASE_URL",
  "VITE_HMR_PROTOCOL",
  "VITE_HMR_HOST",
  "VITE_HMR_CLIENT_PORT",
  "VITE_DEV_PORT",
  "INTERNAL_MEDUSA_URL",
  "DB_NAME",
  "MEDUSA_ADMIN_ONBOARDING_TYPE",
  "DISABLE_MEDUSA_ADMIN",
  "MEDUSA_WORKER_MODE",
  "PORT",
  "PAYPAL_CLIENT_ID",
  "PAYPAL_CLIENT_SECRET",
  "PAYPAL_WEBHOOK_ID",
  "PAYPAL_API_BASE_URL",
  "PAYPAL_ENVIRONMENT",
  "PAYPAL_AUTO_CAPTURE",
  "EMAIL_PROVIDER",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "SITE_PUBLIC_URL",
  "ADMIN_PUBLIC_URL",
  "CONTACT_TO_EMAIL",
  "EMAIL_ENABLED",
  "SEED_IMAGE_BASE_URL",
];

const keysAllowedInBothApps = ["MEDUSA_BACKEND_URL"];

const storefrontKeys = [
  "NEXT_PUBLIC_MEDUSA_BACKEND_URL",
  "NEXT_PUBLIC_ASSET_BASE_URL",
  "MEDUSA_BACKEND_URL",
  "NEXT_PUBLIC_BASE_URL",
  "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_DEFAULT_REGION",
  "NEXT_PUBLIC_STRIPE_KEY",
  "NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID",
  "NEXT_PUBLIC_PAYPAL_CLIENT_ID",
  "NEXT_PUBLIC_VERCEL_URL",
  "MEDUSA_CLOUD_S3_HOSTNAME",
  "MEDUSA_CLOUD_S3_PATHNAME",
];

const files = [
  {
    label: "backend env",
    file: "apps/backend/.env",
    requiredKeys: backendKeys,
    forbiddenKeys: storefrontKeys.filter(
      (key) => !keysAllowedInBothApps.includes(key),
    ),
  },
  {
    label: "backend template",
    file: "apps/backend/.env.template",
    requiredKeys: backendKeys,
    forbiddenKeys: storefrontKeys.filter(
      (key) => !keysAllowedInBothApps.includes(key),
    ),
  },
  {
    label: "backend example",
    file: "apps/backend/.env.example",
    requiredKeys: backendKeys,
    forbiddenKeys: storefrontKeys.filter(
      (key) => !keysAllowedInBothApps.includes(key),
    ),
  },
  {
    label: "backend development template",
    file: "apps/backend/.env.development.template",
    requiredKeys: backendKeys,
    forbiddenKeys: storefrontKeys.filter(
      (key) => !keysAllowedInBothApps.includes(key),
    ),
  },
  {
    label: "backend production template",
    file: "apps/backend/.env.production.template",
    requiredKeys: backendKeys,
    forbiddenKeys: storefrontKeys.filter(
      (key) => !keysAllowedInBothApps.includes(key),
    ),
  },
  {
    label: "storefront env",
    file: "apps/storefront/.env",
    requiredKeys: storefrontKeys.filter((key) => key !== "MEDUSA_BACKEND_URL"),
    forbiddenKeys: backendKeys.filter(
      (key) => !keysAllowedInBothApps.includes(key),
    ),
  },
  {
    label: "storefront example",
    file: "apps/storefront/.env.example",
    requiredKeys: storefrontKeys,
    forbiddenKeys: backendKeys.filter(
      (key) => !keysAllowedInBothApps.includes(key),
    ),
  },
  {
    label: "storefront development template",
    file: "apps/storefront/.env.development.template",
    requiredKeys: storefrontKeys,
    forbiddenKeys: backendKeys.filter(
      (key) => !keysAllowedInBothApps.includes(key),
    ),
  },
  {
    label: "storefront production template",
    file: "apps/storefront/.env.production.template",
    requiredKeys: storefrontKeys,
    forbiddenKeys: backendKeys.filter(
      (key) => !keysAllowedInBothApps.includes(key),
    ),
  },
  {
    label: "storefront template",
    file: "apps/storefront/.env.template",
    requiredKeys: storefrontKeys,
    forbiddenKeys: backendKeys.filter(
      (key) => !keysAllowedInBothApps.includes(key),
    ),
  },
  {
    label: "root example",
    file: ".env.example",
    requiredKeys: Array.from(new Set([...backendKeys, ...storefrontKeys])),
    forbiddenKeys: [],
  },
  {
    label: "root env",
    file: ".env",
    requiredKeys: [],
    forbiddenKeys: Array.from(new Set([...backendKeys, ...storefrontKeys])),
  },
];

const defaultSecretPattern = /^(change-me|changeme|supersecret|your-secret)$/i;

const parseEnvFile = (relativeFile) => {
  const filePath = path.join(root, relativeFile);
  const content = fs.readFileSync(filePath, "utf8");
  const keys = [];
  const values = new Map();
  const duplicates = [];
  const seen = new Set();

  content.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);

    if (!match) {
      return;
    }

    const key = match[1];

    if (seen.has(key)) {
      duplicates.push({ key, line: index + 1 });
    }

    seen.add(key);
    keys.push(key);
    values.set(key, trimmed.slice(trimmed.indexOf("=") + 1));
  });

  return {
    keySet: seen,
    values,
    duplicates,
  };
};

const failures = [];

files.forEach(({ label, file, requiredKeys, forbiddenKeys }) => {
  const { keySet, values, duplicates } = parseEnvFile(file);

  duplicates.forEach(({ key, line }) => {
    failures.push(`${file}:${line} duplicates ${key}`);
  });

  requiredKeys.forEach((key) => {
    if (!keySet.has(key)) {
      failures.push(`${file} is missing ${key} required by ${label}`);
    }
  });

  forbiddenKeys.forEach((key) => {
    if (keySet.has(key)) {
      failures.push(`${file} contains ${key}, which belongs to another app`);
    }
  });

  if (file === "apps/backend/.env") {
    ["JWT_SECRET", "COOKIE_SECRET"].forEach((key) => {
      const value = values.get(key);

      if (!value || defaultSecretPattern.test(value)) {
        failures.push(`${file} must set a non-default ${key}`);
      }
    });
  }

  if (file.startsWith("apps/backend/.env")) {
    const publicBackendUrl = values.get("PUBLIC_BACKEND_URL");

    ["MEDUSA_BACKEND_URL", "MEDUSA_ADMIN_BACKEND_URL"].forEach((key) => {
      const value = values.get(key);

      if (value !== publicBackendUrl) {
        failures.push(`${file} ${key} must match PUBLIC_BACKEND_URL`);
      }
    });
  }
});

if (failures.length > 0) {
  console.error("Environment file validation failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Environment files are complete and app-scoped.");
