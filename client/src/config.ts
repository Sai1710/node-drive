const trimSlash = (url: string) => url.replace(/\/+$/, "");

export const AUTH_API_URL = trimSlash(import.meta.env.VITE_AUTH_API_URL || "http://localhost:3000");
export const FILE_API_URL = trimSlash(import.meta.env.VITE_FILE_API_URL || "http://localhost:3001");
