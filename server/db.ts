import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'data', 'app_db.json');

const SUPABASE_URL = process.env.SUPABASE_URL ? process.env.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1' : '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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

// Load disk database if available
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

// Persist to disk
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

// Initialize on startup
loadDiskDb();

const hasSupabase = Boolean(SUPABASE_URL && SERVICE_KEY && !SUPABASE_URL.includes('your-') && !SUPABASE_URL.includes('placeholder'));

export async function request(method: string, table: string, options: { params?: Record<string, any>; json?: any; prefer?: string } = {}) {
  if (hasSupabase) {
    try {
      const headers: Record<string, string> = {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      };
      if (options.prefer) {
        headers['Prefer'] = options.prefer;
      }

      let url = `${SUPABASE_URL}/${table}`;
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

      const res = await fetch(url, {
        method,
        headers,
        body: options.json ? JSON.stringify(options.json) : undefined,
      });

      if (res.ok) {
        if (res.status === 204) return [];
        const text = await res.text();
        return text ? JSON.parse(text) : [];
      } else {
        console.warn(`Supabase REST ${method} ${table} error (${res.status}): using local disk DB`);
      }
    } catch (err) {
      console.warn(`Supabase connection error: ${(err as Error).message}. Using local disk DB.`);
    }
  }

  // Local Memory + Disk DB Engine
  if (!memoryDb[table]) {
    memoryDb[table] = [];
  }
  const items = memoryDb[table];

  if (method === 'GET') {
    let result = [...items];
    const params = options.params || {};

    for (const [key, val] of Object.entries(params)) {
      if (val === undefined || val === null) continue;
      const strVal = String(val);
      if (key === 'limit') {
        const lim = parseInt(strVal, 10);
        result = result.slice(0, lim);
      } else if (key === 'order') {
        const [col, dir] = strVal.split('.');
        result.sort((a, b) => {
          const va = a[col] ?? '';
          const vb = b[col] ?? '';
          if (dir === 'desc') return va > vb ? -1 : va < vb ? 1 : 0;
          return va > vb ? 1 : va < vb ? -1 : 0;
        });
      } else if (strVal.startsWith('eq.')) {
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
  return rows && rows.length > 0 ? rows[0] : null;
}

export async function update(table: string, params: Record<string, any>, data: any) {
  const rows = await request('PATCH', table, { params, json: data, prefer: 'return=representation' });
  return rows && rows.length > 0 ? rows[0] : null;
}

export async function remove(table: string, params: Record<string, any>) {
  return await request('DELETE', table, { params });
}
