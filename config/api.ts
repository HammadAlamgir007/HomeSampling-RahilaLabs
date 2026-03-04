/**
 * API configuration — single source of truth for the backend base URL.
 * Override with NEXT_PUBLIC_API_URL environment variable in production.
 */
export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
