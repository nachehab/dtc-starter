const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME
const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const ASSET_BASE_URL =
  process.env.NEXT_PUBLIC_ASSET_BASE_URL || MEDUSA_BACKEND_URL
const NEXT_DIST_DIR = process.env.NEXT_DIST_DIR

const getRemotePatternFromUrl = (value) => {
  const parsed = new URL(value)
  const pattern = {
    protocol: parsed.protocol.replace(":", ""),
    hostname: parsed.hostname,
    pathname: "/**",
  }

  if (parsed.port) {
    pattern.port = parsed.port
  }

  return pattern
}

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  ...(NEXT_DIST_DIR ? { distDir: NEXT_DIST_DIR } : {}),
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      getRemotePatternFromUrl(MEDUSA_BACKEND_URL),
      getRemotePatternFromUrl(ASSET_BASE_URL),
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
    ],
  },
}

module.exports = nextConfig
