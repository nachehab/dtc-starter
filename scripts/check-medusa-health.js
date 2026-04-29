#!/usr/bin/env node

const http = require("http")
const https = require("https")

const target = process.env.HEALTHCHECK_URL || "http://127.0.0.1:9000/health"
const timeoutMs = Number.parseInt(process.env.HEALTHCHECK_TIMEOUT_MS || "5000", 10)

const client = target.startsWith("https:") ? https : http

const request = client.get(target, { timeout: timeoutMs }, (response) => {
  response.resume()

  if (response.statusCode && response.statusCode >= 200 && response.statusCode < 400) {
    process.exit(0)
  }

  console.error(`Healthcheck failed: ${target} returned ${response.statusCode}`)
  process.exit(1)
})

request.on("timeout", () => {
  request.destroy(new Error(`Healthcheck timed out after ${timeoutMs}ms`))
})

request.on("error", (error) => {
  console.error(`Healthcheck failed: ${error.message}`)
  process.exit(1)
})
