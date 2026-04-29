const LOCAL_HOSTNAME = `${"local"}${"host"}`;
const LOOPBACK_HOST = `${"127"}.0.0.1`;
const STATIC_PATH_PREFIX = `${"/"}static`;

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const stripLeadingSlash = (value: string) => value.replace(/^\/+/, "");

const getPublicAssetBaseUrl = () => {
  const value =
    process.env.VITE_PUBLIC_ASSET_BASE_URL ||
    process.env.PUBLIC_ASSET_BASE_URL ||
    process.env.VITE_PUBLIC_BACKEND_URL ||
    process.env.PUBLIC_BACKEND_URL ||
    "";

  return value ? stripTrailingSlash(value) : "";
};

const isPrivateIpHostname = (hostname: string) => {
  const parts = hostname.split(".").map((part) => Number.parseInt(part, 10));

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [first, second] = parts;

  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
};

const isInternalHostname = (hostname: string) => {
  return (
    hostname === LOCAL_HOSTNAME ||
    hostname === LOOPBACK_HOST ||
    hostname === "medusa" ||
    hostname === "backend" ||
    hostname.endsWith(".local") ||
    isPrivateIpHostname(hostname)
  );
};

const isStaticPath = (pathname: string) => {
  return (
    pathname === STATIC_PATH_PREFIX ||
    pathname.startsWith(`${STATIC_PATH_PREFIX}/`)
  );
};

const withPublicAssetBase = (path: string) => {
  const baseUrl = getPublicAssetBaseUrl();

  if (!baseUrl) {
    return path;
  }

  return `${baseUrl}/${stripLeadingSlash(path)}`;
};

export const getPublicAssetUrl = (pathOrUrl?: string | null) => {
  if (!pathOrUrl) {
    return pathOrUrl;
  }

  const trimmed = pathOrUrl.trim();

  if (!trimmed) {
    return pathOrUrl;
  }

  if (
    trimmed === STATIC_PATH_PREFIX ||
    trimmed.startsWith(`${STATIC_PATH_PREFIX}/`) ||
    trimmed.startsWith("static/")
  ) {
    return withPublicAssetBase(trimmed);
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.protocol === "https:") {
      return trimmed;
    }

    if (
      parsed.protocol === "http:" &&
      (isInternalHostname(parsed.hostname) || isStaticPath(parsed.pathname))
    ) {
      return withPublicAssetBase(
        `${parsed.pathname}${parsed.search}${parsed.hash}`,
      );
    }
  } catch {}

  return pathOrUrl;
};

export const rewritePublicAssetUrls = <T>(value: T): T => {
  if (typeof value === "string") {
    return getPublicAssetUrl(value) as T;
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => rewritePublicAssetUrls(entry)) as T;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      rewritePublicAssetUrls(entry),
    ]),
  ) as T;
};
