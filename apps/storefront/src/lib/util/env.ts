const stripTrailingSlashes = (value: string) => {
  return value.replace(/\/+$/, "")
}

const getRequiredPublicEnv = (key: string) => {
  const value = process.env[key]

  if (!value) {
    throw new Error(`${key} is not defined`)
  }

  return stripTrailingSlashes(value)
}

export const getBaseURL = () => {
  return getRequiredPublicEnv("NEXT_PUBLIC_BASE_URL")
}

export const getPublicMedusaBackendURL = () => {
  return getRequiredPublicEnv("NEXT_PUBLIC_MEDUSA_BACKEND_URL")
}

export const getMedusaBackendURL = () => {
  const serverBackendUrl =
    typeof window === "undefined" ? process.env.MEDUSA_BACKEND_URL : undefined

  return serverBackendUrl
    ? stripTrailingSlashes(serverBackendUrl)
    : getPublicMedusaBackendURL()
}

export const getMedusaAdminURL = (path: string) => {
  return new URL(path, `${getPublicMedusaBackendURL()}/`).toString()
}
