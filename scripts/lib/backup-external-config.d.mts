export function collectExternalConfig(
  env?: Record<string, string | undefined>,
  fetchImpl?: (url: string, init?: RequestInit) => Promise<Response>,
): Promise<{ file: Record<string, unknown>; summary: Record<string, string> }>;
