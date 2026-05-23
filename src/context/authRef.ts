// Module-level ref so the API client interceptor can trigger logout
// without importing React hooks.
export const authRef: { logout: (() => Promise<void>) | null } = { logout: null };
