import type { Project, SiteContent, TeamMember, WorkProcessStep } from '@qalor/shared';

// http→https is coerced because hosts like Render answer http with a 301, and browsers
// drop the Authorization header across a redirect — so an admin write would silently 401.
// Not applied to localhost: there's no TLS server to redirect to there, and in normal dev
// this constant is never used anyway (VITE_API_URL is unset — see HAS_API below — because
// vite.config.ts proxies /api to the local API instead).
const RAW_BASE = import.meta.env.VITE_API_URL ?? '';
const BASE = /^http:\/\/(localhost|127\.0\.0\.1)/.test(RAW_BASE)
  ? RAW_BASE
  : RAW_BASE.replace(/^http:\/\//, 'https://');

/**
 * Whether there is an API to talk to at all.
 *
 * Running this site with no API configured is a supported state — the content is in the
 * bundle and the prerendered HTML, so the site is complete without a backend, just not
 * editable. In that case VITE_API_URL is unset and `/api/content` would resolve against the
 * static host, which can only ever 404: handled in JS, but still logged by the browser as a
 * failed request.
 *
 * Dev is exempt: there VITE_API_URL is normally unset because Vite proxies /api to the
 * locally running packages/api instead (see vite.config.ts).
 */
export const HAS_API = import.meta.env.DEV || BASE !== '';

const TOKEN_KEY = 'admin_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/** Every admin request funnels through here so a revoked token logs out once, not per call. */
async function authed(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${getToken() ?? ''}`,
      ...init.headers,
    },
  });
  if (res.status === 401) {
    clearToken();
    throw new Error('unauthorized');
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `${init.method ?? 'GET'} ${path} failed: ${res.status}`);
  }
  return res;
}

export async function apiLogin(password: string): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error('Invalid credentials');
  const { token } = (await res.json()) as { token: string };
  return token;
}

export async function apiRevokeAll(): Promise<void> {
  await authed('/api/auth/revoke-all', { method: 'POST' });
}

export async function apiGetContent(): Promise<SiteContent> {
  const res = await fetch(`${BASE}/api/content`);
  if (!res.ok) throw new Error('Failed to fetch content');
  return res.json() as Promise<SiteContent>;
}

/** Singleton sections: hero, about, workProcessIntro, projectsIntro, teamIntro, footer. */
export async function apiUpdateSite(id: string, data: Record<string, unknown>): Promise<void> {
  await authed(`/api/content/site/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export type ListName = 'projects' | 'team' | 'workProcessSteps';
export type ListItem = Project | TeamMember | WorkProcessStep;

/**
 * Creates a list item, optionally with its content already filled in.
 *
 * The portal composes a new item in the browser and sends it on Save, so the fields travel with
 * the creation rather than as a second request. Without a body the API falls back to its own
 * placeholder template, which is what the old click-to-create behaviour relied on.
 */
export async function apiCreateItem(
  list: ListName,
  data?: Record<string, unknown>,
): Promise<ListItem> {
  const res = await authed(`/api/content/${list}`, {
    method: 'POST',
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  return res.json() as Promise<ListItem>;
}

export async function apiUpdateItem(
  list: ListName,
  id: string | number,
  data: Record<string, unknown>,
): Promise<void> {
  await authed(`/api/content/${list}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function apiDeleteItem(list: ListName, id: string | number): Promise<void> {
  await authed(`/api/content/${list}/${id}`, { method: 'DELETE' });
}

/**
 * Uploads an image or (for team members) a CV PDF, returns the stored URL. Not scoped to a
 * section — the caller puts the returned URL into whatever field it belongs to with a
 * normal apiUpdateSite/apiUpdateItem call.
 */
export async function apiUploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await authed('/api/content/upload', { method: 'POST', body: form });
  const { url } = (await res.json()) as { url: string };
  return url;
}
