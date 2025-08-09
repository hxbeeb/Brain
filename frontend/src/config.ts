export const BACKEND_URL: string = (import.meta as any).env?.VITE_BACKEND_URL || '';

if (!BACKEND_URL) {
  // eslint-disable-next-line no-console
  console.warn('VITE_BACKEND_URL is not set. Please define it in your .env file.');
}


