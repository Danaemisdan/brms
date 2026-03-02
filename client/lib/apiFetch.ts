/**
 * apiFetch - a drop-in replacement for fetch() that automatically refreshes
 * the access token when a 401 is received, then retries the original request.
 *
 * Usage: replace every  fetch(`...`, { headers: { Authorization: ... } })
 *        with             apiFetch(`...`, { headers: { Authorization: ... } })
 *
 * The function reads the token from localStorage("token") automatically.
 * You do NOT need to pass Authorization headers manually — they are injected.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
}

function setToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("token", token);
}

async function tryRefreshToken(): Promise<string | null> {
    try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
            method: "POST",
            credentials: "include", // sends the httpOnly refreshToken cookie
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return null;
        const data = await res.json();
        // The refresh endpoint returns the new token in the JSON body
        if (data.token) {
            setToken(data.token);
            return data.token;
        }
        return null;
    } catch {
        return null;
    }
}

export async function apiFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const token = getToken();

    // Always inject Authorization header
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string> || {}),
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        credentials: "include",
        headers,
    });

    // On 401, attempt token refresh and retry once
    if (response.status === 401) {
        const newToken = await tryRefreshToken();
        if (newToken) {
            const retryHeaders: Record<string, string> = {
                ...headers,
                "Authorization": `Bearer ${newToken}`,
            };
            return fetch(url, {
                ...options,
                credentials: "include",
                headers: retryHeaders,
            });
        }
        // Refresh failed — redirect to login
        if (typeof window !== "undefined") {
            const currentPath = window.location.pathname;
            window.location.href = `/login?returnUrl=${encodeURIComponent(currentPath)}`;
        }
    }

    return response;
}
