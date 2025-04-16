import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("sessionId");

  // Create a plain object for headers first
  const headersObj: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headersObj["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers: headersObj,
  });
}
