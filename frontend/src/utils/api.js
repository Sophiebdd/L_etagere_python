const DEFAULT_API_BASE_URL = "/api";

function normalizeBaseUrl(url) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function getApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (!configuredBaseUrl) {
    return DEFAULT_API_BASE_URL;
  }

  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    configuredBaseUrl.startsWith("http://")
  ) {
    return DEFAULT_API_BASE_URL;
  }

  return normalizeBaseUrl(configuredBaseUrl);
}
