// Settings that live in dashboards, not in the database: Supabase Auth (providers, URLs, SMTP, e-mail templates),
// Storage and API settings, and the Vercel environment variables. They are exported through the providers' own
// APIs into the encrypted backup so a rebuilt project can be configured from the file instead of from memory.
// Each source needs its own access token; a missing token is reported loudly, never silently ignored.

const get = async (fetchImpl, url, token) => {
  const res = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

async function exportSupabase(env, fetchImpl) {
  const token = env.SUPABASE_ACCESS_TOKEN;
  if (!token) return { status: "skipped", reason: "SUPABASE_ACCESS_TOKEN is not set" };
  const ref = env.SUPABASE_PROJECT_REF || new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
  const base = `https://api.supabase.com/v1/projects/${ref}`;
  const parts = { auth: `${base}/config/auth`, postgrest: `${base}/postgrest`, storage: `${base}/config/storage` };
  const data = {};
  const errors = {};
  for (const [key, url] of Object.entries(parts)) {
    try {
      data[key] = await get(fetchImpl, url, token);
    } catch (e) {
      errors[key] = e instanceof Error ? e.message : String(e);
    }
  }
  const failed = Object.keys(errors).length;
  return { status: failed === 0 ? "exported" : failed === Object.keys(parts).length ? "failed" : "partial", projectRef: ref, data, errors };
}

async function exportVercel(env, fetchImpl) {
  const token = env.VERCEL_TOKEN;
  const project = env.VERCEL_PROJECT_ID;
  if (!token || !project) return { status: "skipped", reason: "VERCEL_TOKEN / VERCEL_PROJECT_ID are not set" };
  const team = env.VERCEL_TEAM_ID ? `&teamId=${encodeURIComponent(env.VERCEL_TEAM_ID)}` : "";
  try {
    const body = await get(fetchImpl, `https://api.vercel.com/v9/projects/${encodeURIComponent(project)}/env?decrypt=true${team}`, token);
    const envs = (body.envs ?? []).map((e) => ({ key: e.key, value: e.value ?? null, target: e.target, type: e.type }));
    // "sensitive" variables cannot be read back from Vercel; keep their names so they are not forgotten.
    const unreadable = envs.filter((e) => e.value === null).map((e) => e.key);
    return { status: unreadable.length ? "partial" : "exported", count: envs.length, unreadable, envs };
  } catch (e) {
    return { status: "failed", error: e instanceof Error ? e.message : String(e) };
  }
}

/** @returns {Promise<{ file: object, summary: Record<string, string> }>} `file` goes into the archive, `summary` into the manifest. */
export async function collectExternalConfig(env = process.env, fetchImpl = fetch) {
  const [supabase, vercel] = await Promise.all([exportSupabase(env, fetchImpl), exportVercel(env, fetchImpl)]);
  return {
    file: {
      exportedAt: new Date().toISOString(),
      note: "Contains secrets. Only ever stored inside the AES-256-GCM encrypted backup. GitHub Actions secrets cannot be read back through any API; keep BACKUP_ENCRYPTION_KEY and the other secrets in a password manager.",
      supabase,
      vercel,
    },
    summary: { supabase: supabase.status, vercel: vercel.status },
  };
}
