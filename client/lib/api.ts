const API_BASE_URL = "/api";

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export const api = {
  get: async (url: string, options: RequestOptions = {}) => {
    return makeRequest(url, { ...options, method: "GET" });
  },
  post: async (url: string, data: any, options: RequestOptions = {}) => {
    return makeRequest(url, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(data),
    });
  },
  put: async (url: string, data: any, options: RequestOptions = {}) => {
    return makeRequest(url, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(data),
    });
  },
  delete: async (url: string, options: RequestOptions = {}) => {
    return makeRequest(url, { ...options, method: "DELETE" });
  },
};

async function makeRequest(endpoint: string, options: RequestOptions) {
  const { requiresAuth = true, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);

  // In a real app, you'd get this from a cookie or secure localStorage
  if (requiresAuth && typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Request failed with status ${response.status}`);
  }

  return data;
}
