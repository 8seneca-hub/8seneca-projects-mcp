import { AsyncLocalStorage } from "node:async_hooks";

// In http mode the caller's own Plane token arrives on every request, so the
// key cannot live in the process environment the way it does under stdio. It is
// held here for the life of the request instead, which keeps the change to one
// read in request-helper rather than a parameter threaded through 54 tools.
const apiKeyStore = new AsyncLocalStorage<string>();

export function withApiKey<T>(apiKey: string, fn: () => T): T {
  return apiKeyStore.run(apiKey, fn);
}

// stdio never enters the store, so it falls through to the env var. http mode
// refuses the request before reaching here when the header is missing, so the
// env fallback is unreachable there — see src/http.ts.
export function getApiKey(): string {
  return apiKeyStore.getStore() ?? process.env.PLANE_API_KEY ?? "";
}
