import { FlatCompat } from "@eslint/eslintrc"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig, globalIgnores } from "eslint/config"

const __dirname = dirname(fileURLToPath(import.meta.url))
const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["*.config.js", "check-env-variables.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
])

export default eslintConfig
