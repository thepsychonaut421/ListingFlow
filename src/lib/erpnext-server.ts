// =============================
// 2) src/lib/erpnext-server.ts
// Minimal server-only wrapper to call ERPNext directly (reuses env of existing proxy).
// =============================

'use server';

const ERPNEXT_BASE_URL = process.env.ERPNEXT_BASE_URL || process.env.NEXT_PUBLIC_ERPNEXT_BASE_URL; // be tolerant
const ERPNEXT_API_KEY = process.env.ERPNEXT_API_KEY;
const ERPNEXT_API_SECRET = process.env.ERPNEXT_API_SECRET;

if (!ERPNEXT_BASE_URL) {
  console.warn('[erpnext-server] ERPNEXT_BASE_URL (or NEXT_PUBLIC_ERPNEXT_BASE_URL) is not set.');
}

async function erpFetch<T>(endpoint: string, init?: RequestInit): Promise<T> {
  if (!ERPNEXT_BASE_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
    throw new Error('ERPNext credentials missing: ERPNEXT_BASE_URL, ERPNEXT_API_KEY, ERPNEXT_API_SECRET');
  }

  const url = ERPNEXT_BASE_URL.replace(/\/$/, '') + endpoint;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
      ...(init?.headers || {}),
    },
    cache: 'no-store'
  });

  if (res.status === 204) return undefined as unknown as T;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ERPNext ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

// ERPNext utility: find first document by filters
export async function erpFindOne(doctype: string, filters: [string, string, any][] | Record<string, any>) {
    const params = new URLSearchParams({
        fields: JSON.stringify(["name"]),
        limit_page_length: '1',
        filters: JSON.stringify(Array.isArray(filters) ? filters : Object.entries(filters).map(([key, value]) => [key, '=', value])),
    });
    const data = await erpFetch<{ data: Array<{ name: string }> }>(
        `/api/resource/${encodeURIComponent(doctype)}?${params.toString()}`,
        { method: 'GET' }
    );
    return data.data?.[0]?.name || null;
}


export async function erpCreate(doctype: string, doc: any) {
  const data = await erpFetch<{ data: any }>(`/api/resource/${encodeURIComponent(doctype)}`, {
    method: 'POST',
    body: JSON.stringify(doc),
  });
  return data.data;
}

export async function erpUpdate(doctype: string, name: string, doc: any) {
  const data = await erpFetch<{ data: any }>(`/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify(doc),
  });
  return data.data;
}

export { erpFetch };
