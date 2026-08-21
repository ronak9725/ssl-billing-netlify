import { apiRequest } from '../services/api.js';

export interface GSTLookupResult {
  verification_status: 'verified' | 'invalid' | 'unavailable';
  is_live_verified: boolean;
  gstin: string;
  pan: string;
  legal_name?: string;
  trade_name?: string;
  customer_name?: string;
  name?: string; // backwards compatibility alias
  address?: string;
  city?: string;
  state: string;
  state_code: string;
  pin?: string;
  gst_status?: string;
  constitution?: string;
  taxpayer_type?: string;
  registration_date?: string;
  nature_of_business?: string[];
  message: string;
  source: 'gstverify' | 'derived' | 'none';
  valid?: boolean; // legacy alias
}

export interface PincodeLookupResult {
  valid: boolean;
  pincode: string;
  city: string;
  district: string;
  state: string;
  area?: string;
  division?: string;
  region?: string;
  post_offices?: string[];
  source?: 'postal_api' | 'fallback';
}

// In-flight lookup cache & deduplication
const inFlightGSTRequests = new Map<string, Promise<GSTLookupResult | null>>();

/**
 * Validates 15-character GSTIN format
 */
export function isValidGSTINFormat(gstin: string): boolean {
  const clean = gstin.trim().toUpperCase();
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(clean);
}

/**
 * Auto-fetches GSTIN details from backend GSTVerify service with deduplication
 */
export async function lookupGSTIN(gstin: string): Promise<GSTLookupResult | null> {
  const clean = gstin.trim().toUpperCase();
  if (!clean || clean.length < 15) return null;
  if (!isValidGSTINFormat(clean)) {
    return {
      verification_status: 'invalid',
      is_live_verified: false,
      gstin: clean,
      pan: clean.length >= 12 ? clean.substring(2, 12) : '',
      state: '',
      state_code: clean.substring(0, 2),
      message: 'Invalid 15-character GSTIN syntax.',
      source: 'none',
      valid: false,
    };
  }

  // Reuse in-flight request if already in progress for the exact same GSTIN
  if (inFlightGSTRequests.has(clean)) {
    return inFlightGSTRequests.get(clean)!;
  }

  const fetchPromise = (async () => {
    try {
      const res = await apiRequest<GSTLookupResult>(`/lookup/gst?gstin=${encodeURIComponent(clean)}`);
      // Attach backward compatibility flags
      if (res) {
        res.valid = res.verification_status === 'verified';
        res.name = res.customer_name || res.trade_name || res.legal_name || '';
      }
      return res;
    } catch (err: any) {
      console.warn('Failed to lookup GSTIN:', err);
      const fallbackResult: GSTLookupResult = {
        verification_status: 'unavailable',
        is_live_verified: false,
        gstin: clean,
        pan: clean.substring(2, 12),
        state: '',
        state_code: clean.substring(0, 2),
        message: err.message || 'Live GST lookup temporarily unreachable.',
        source: 'derived',
        valid: false,
      };
      return fallbackResult;
    } finally {
      inFlightGSTRequests.delete(clean);
    }
  })();

  inFlightGSTRequests.set(clean, fetchPromise);
  return fetchPromise;
}

/**
 * Auto-fetches City and State from Indian PIN code
 */
export async function lookupPincode(pincode: string): Promise<PincodeLookupResult | null> {
  const clean = pincode.trim();
  if (!/^[1-9][0-9]{5}$/.test(clean)) return null;

  try {
    const res = await apiRequest<PincodeLookupResult>(`/lookup/pincode?pincode=${encodeURIComponent(clean)}`);
    return res;
  } catch (err) {
    console.warn('Failed to lookup Pincode:', err);
    return null;
  }
}

