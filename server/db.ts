import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'data', 'app_db.json');

const SUPABASE_RAW_URL = (process.env.SUPABASE_URL || '').trim();
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '').trim();

export const hasSupabase = Boolean(
  SUPABASE_RAW_URL &&
  SERVICE_KEY &&
  !SUPABASE_RAW_URL.includes('your-') &&
  !SUPABASE_RAW_URL.includes('placeholder')
);

const SUPABASE_REST_URL = hasSupabase
  ? (SUPABASE_RAW_URL.replace(/\/$/, '').endsWith('/rest/v1')
      ? SUPABASE_RAW_URL.replace(/\/$/, '')
      : SUPABASE_RAW_URL.replace(/\/$/, '') + '/rest/v1')
  : '';

if (hasSupabase) {
  console.log('[Database] Supabase is configured and ACTIVE as primary database.');
  // Ensure any app_users are present in auth.users so foreign keys on invoices/customers/payments always resolve
  syncAuthUsersToSupabase().catch(() => {});
} else {
  console.log('[Database] Supabase credentials not detected; running in local offline storage mode.');
}

export async function ensureSupabaseAuthUser(userId: string, email: string) {
  if (!hasSupabase || !userId) return;
  try {
    const authAdminUrl = SUPABASE_RAW_URL.replace(/\/$/, '') + '/auth/v1/admin/users';
    const headers: Record<string, string> = {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    };

    // Check if user already exists
    const checkRes = await fetch(`${authAdminUrl}/${userId}`, { headers });
    if (checkRes.ok) return;

    // Create user in auth.users with the exact same UUID
    await fetch(authAdminUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: userId,
        email: email || `${userId}@internal.app`,
        email_confirm: true,
        user_metadata: { source: 'app_users' }
      })
    });
  } catch (err: any) {
    // Non-fatal, just log
    console.warn(`[Database] ensureSupabaseAuthUser notice for ${userId}:`, err.message || err);
  }
}

async function syncAuthUsersToSupabase() {
  if (!hasSupabase) return;
  try {
    const users = await select('app_users');
    if (Array.isArray(users)) {
      for (const u of users) {
        if (u && u.id) {
          await ensureSupabaseAuthUser(u.id, u.email);
        }
      }
    }
  } catch (err) {
    // ignore
  }
}

let memoryDb: Record<string, any[]> = {
  app_users: [],
  password_resets: [],
  company_settings: [],
  bank_accounts: [],
  customers: [],
  invoices: [],
  payments: [],
  expenses: [],
  audit_logs: [],
};

// Load disk database if available (used ONLY when Supabase credentials are absent)
function loadDiskDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      if (raw) {
        const parsed = JSON.parse(raw);
        memoryDb = { ...memoryDb, ...parsed };
      }
    }
  } catch (e) {
    console.warn('Failed to load local DB file:', (e as Error).message);
  }
}

// Persist to disk (used ONLY when Supabase credentials are absent)
function saveDiskDb() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to persist local DB file:', (e as Error).message);
  }
}

// Initialize local DB on startup only if not using Supabase
if (!hasSupabase) {
  loadDiskDb();
}

export async function request(
  method: string,
  table: string,
  options: { params?: Record<string, any>; json?: any; prefer?: string } = {}
) {
  // If Supabase is configured, all operations MUST go to Supabase.
  // DO NOT fall back to local in-memory DB if Supabase returns an error or fails.
  if (hasSupabase) {
    const headers: Record<string, string> = {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    };
    if (options.prefer) {
      headers['Prefer'] = options.prefer;
    }

    let url = `${SUPABASE_REST_URL}/${table}`;
    if (options.params) {
      const query = new URLSearchParams();
      for (const [k, v] of Object.entries(options.params)) {
        if (v !== undefined && v !== null) {
          query.append(k, String(v));
        }
      }
      const qs = query.toString();
      if (qs) url += `?${qs}`;
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: options.json ? JSON.stringify(options.json) : undefined,
      });
    } catch (networkErr: any) {
      // Safe logging: Never log secrets, keys, or auth headers
      console.error(`[Supabase Connection Error] Method: ${method} | Table: ${table} | Error:`, networkErr.message || networkErr);
      throw new Error(`Supabase Connection Error (${method} ${table}): ${networkErr.message || 'Network request failed'}`);
    }

    if (res.ok) {
      if (res.status === 204) return [];
      const text = await res.text();
      return text ? JSON.parse(text) : [];
    }

    // Supabase HTTP Error response
    const errorText = await res.text();
    let errorBody: any = errorText;
    try {
      errorBody = JSON.parse(errorText);
    } catch {
      // Keep as string if not JSON
    }

    // Safe server-side logging: Method, Table, HTTP Status, and Error Body.
    // Secrets like SERVICE_ROLE_KEY and JWT_SECRET are strictly NOT logged.
    console.error(
      `[Supabase Error] Method: ${method} | Table: ${table} | Status: ${res.status} | Body:`,
      typeof errorBody === 'object' ? JSON.stringify(errorBody) : errorBody
    );

    let detailMessage = `Supabase request failed with status ${res.status}`;
    if (typeof errorBody === 'object' && errorBody !== null) {
      const parts = [errorBody.message, errorBody.details, errorBody.hint, errorBody.error].filter(Boolean);
      if (parts.length > 0) {
        detailMessage = parts.join(' - ');
      }
    } else if (typeof errorText === 'string' && errorText.trim()) {
      detailMessage = errorText;
    }

    const err = new Error(`Supabase Error (${res.status}): ${detailMessage}`);
    (err as any).status = res.status;
    (err as any).supabaseError = errorBody;
    throw err;
  }

  // Local Memory + Disk DB Engine (ONLY for local offline development when Supabase credentials are absent)
  if (!memoryDb[table]) {
    memoryDb[table] = [];
  }
  const items = memoryDb[table];

  if (method === 'GET') {
    let result = [...items];
    const params = options.params || {};

    // 1. Apply filters first
    for (const [key, val] of Object.entries(params)) {
      if (val === undefined || val === null) continue;
      if (key === 'limit' || key === 'order' || key === 'select') continue;
      const strVal = String(val);
      if (strVal.startsWith('eq.')) {
        const target = strVal.slice(3);
        result = result.filter(item => String(item[key] ?? '') === target);
      } else if (strVal.startsWith('neq.')) {
        const target = strVal.slice(4);
        result = result.filter(item => String(item[key] ?? '') !== target);
      } else if (strVal.startsWith('gte.')) {
        const target = strVal.slice(4);
        result = result.filter(item => String(item[key] || '') >= target);
      } else if (strVal.startsWith('lte.')) {
        const target = strVal.slice(4);
        result = result.filter(item => String(item[key] || '') <= target);
      } else if (strVal.startsWith('gt.')) {
        const target = strVal.slice(3);
        result = result.filter(item => String(item[key] || '') > target);
      } else if (strVal.startsWith('lt.')) {
        const target = strVal.slice(3);
        result = result.filter(item => String(item[key] || '') < target);
      } else if (strVal.startsWith('ilike.*')) {
        const target = strVal.slice(7).replace(/\*$/, '').toLowerCase();
        result = result.filter(item => String(item[key] || '').toLowerCase().includes(target));
      }
    }

    // 2. Apply sorting
    if (params.order) {
      const [col, dir] = String(params.order).split('.');
      result.sort((a, b) => {
        const va = a[col] ?? '';
        const vb = b[col] ?? '';
        if (va !== vb) {
          if (dir === 'desc') return va > vb ? -1 : 1;
          return va > vb ? 1 : -1;
        }
        // Tie-breaker: created_at desc
        const ca = a.created_at || '';
        const cb = b.created_at || '';
        return ca > cb ? -1 : ca < cb ? 1 : 0;
      });
    }

    // 3. Apply limit last
    if (params.limit) {
      const lim = parseInt(String(params.limit), 10);
      if (!isNaN(lim) && lim > 0) {
        result = result.slice(0, lim);
      }
    }

    return result;
  }

  if (method === 'POST') {
    const data = { ...options.json };
    if (!data.id) {
      data.id = crypto.randomUUID();
    }
    if (!data.created_at) {
      data.created_at = new Date().toISOString();
    }
    items.push(data);
    saveDiskDb();
    return [data];
  }

  if (method === 'PATCH') {
    const params = options.params || {};
    let targetId = '';
    for (const [k, v] of Object.entries(params)) {
      if (k === 'id' && String(v).startsWith('eq.')) {
        targetId = String(v).slice(3);
      }
    }
    const idx = items.findIndex(item => item.id === targetId);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...options.json, updated_at: new Date().toISOString() };
      saveDiskDb();
      return [items[idx]];
    }
    return [];
  }

  if (method === 'DELETE') {
    const params = options.params || {};
    let targetId = '';
    for (const [k, v] of Object.entries(params)) {
      if (k === 'id' && String(v).startsWith('eq.')) {
        targetId = String(v).slice(3);
      }
    }
    const idx = items.findIndex(item => item.id === targetId);
    if (idx !== -1) {
      items.splice(idx, 1);
      saveDiskDb();
    }
    return [];
  }

  return [];
}

export async function select(table: string, params: Record<string, any> = {}) {
  const p = { select: '*', ...params };
  return await request('GET', table, { params: p });
}

export async function selectOne(table: string, params: Record<string, any> = {}) {
  const rows = await select(table, { ...params, limit: 1 });
  return rows && rows.length > 0 ? rows[0] : null;
}

export async function insert(table: string, data: any) {
  const rows = await request('POST', table, { json: data, prefer: 'return=representation' });
  const created = rows && rows.length > 0 ? rows[0] : null;
  if (created && table === 'app_users' && created.id) {
    ensureSupabaseAuthUser(created.id, created.email).catch(() => {});
  }
  return created;
}

export async function update(table: string, params: Record<string, any>, data: any) {
  const rows = await request('PATCH', table, { params, json: data, prefer: 'return=representation' });
  return rows && rows.length > 0 ? rows[0] : null;
}

export async function remove(table: string, params: Record<string, any>) {
  return await request('DELETE', table, { params, prefer: 'return=representation' });
}
