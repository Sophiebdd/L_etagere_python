const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "X-CSRF-Token";

let refreshPromise = null;

const getCookie = (name) => {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie ? document.cookie.split("; ") : [];
  const target = `${name}=`;
  const match = cookies.find((cookie) => cookie.startsWith(target));
  return match ? decodeURIComponent(match.slice(target.length)) : null;
};

const withCredentials = (options = {}) => {
  const nextOptions = {
    ...options,
    credentials: "include",
  };
  const method = (nextOptions.method || "GET").toUpperCase();

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = getCookie(CSRF_COOKIE_NAME);
    if (csrfToken) {
      nextOptions.headers = {
        ...(nextOptions.headers || {}),
        [CSRF_HEADER_NAME]: csrfToken,
      };
    }
  }

  return nextOptions;
};

export const redirectToLogin = (navigate) => {
  navigate("/login", { replace: true });
};

export async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch(
      `${API_BASE_URL}/auth/refresh`,
      withCredentials({
        method: "POST",
      })
    )
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiFetch(url, options = {}) {
  const { skipRefresh = false, ...fetchOptions } = options;
  const response = await fetch(url, withCredentials(fetchOptions));

  if (response.status !== 401 || skipRefresh) {
    return response;
  }

  const refreshed = await refreshSession();
  if (!refreshed) {
    return response;
  }

  return fetch(url, withCredentials(fetchOptions));
}

export async function logout(navigate) {
  try {
    await fetch(
      `${API_BASE_URL}/auth/logout`,
      withCredentials({
        method: "POST",
      })
    );
  } catch {
    // Ignore network errors on logout and still redirect locally.
  }

  redirectToLogin(navigate);
}
