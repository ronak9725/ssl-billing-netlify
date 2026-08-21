/**
 * Single source of truth for freight, discount, GST calculations, and Indian amount in words.
 */

export function num(v: any): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

export function r2(v: number): number {
  return Math.round((v + 1e-9) * 100) / 100;
}

export function extrasList(extra: any): { label: string; amount: number }[] {
  const out: { label: string; amount: number }[] = [];
  if (Array.isArray(extra)) {
    for (const e of extra) {
      if (typeof e === 'object' && e !== null) {
        out.push({
          label: e.label || e.name || 'Additional charge',
          amount: num(e.amount || e.value || e.amt),
        });
      } else {
        out.push({
          label: 'Additional charge',
          amount: num(e),
        });
      }
    }
  } else if (typeof extra === 'object' && extra !== null) {
    for (const [k, v] of Object.entries(extra)) {
      out.push({
        label: k,
        amount: num(typeof v === 'object' && v !== null ? (v as any).amount : v),
      });
    }
  }
  return out.filter(e => e.amount > 0);
}

export function normaliseGstType(t: any): 'intra' | 'igst' | 'exempt' {
  const s = String(t || 'intra').trim().toLowerCase();
  if (['igst', 'inter', 'inter_state', 'interstate'].includes(s)) {
    return 'igst';
  }
  if (['exempt', 'nil', 'none', 'exempted'].includes(s)) {
    return 'exempt';
  }
  return 'intra';
}

export function compute(inv: Record<string, any>) {
  const extras = extrasList(inv.extra_charges);
  const extrasSum = extras.reduce((acc, e) => acc + e.amount, 0);

  let freight = 0;
  let fuel = 0;
  let hike = 0;
  let additional = 0;

  if (inv.freight !== undefined && inv.freight !== null && inv.freight !== '') {
    freight = num(inv.freight);
    additional = extrasSum + num(inv.processing) + num(inv.insurance_amt);
  } else {
    const base = num(inv.weight) * num(inv.rate_kg);
    fuel = (base * num(inv.fuel_surcharge_pct)) / 100;
    hike = (base * num(inv.fuel_hike_pct)) / 100;
    freight = base + fuel + hike;
    additional = extrasSum + num(inv.processing) + num(inv.insurance_amt);
  }

  freight = r2(freight);
  additional = r2(additional);
  const gross = r2(freight + additional);

  const dtype = String(inv.discount_type || 'percent').toLowerCase();
  let dval = num(inv.discount_value);
  let discount = 0;

  if (dtype === 'fixed') {
    discount = Math.min(r2(dval), gross);
  } else {
    dval = Math.max(0, Math.min(dval, 100));
    discount = r2((gross * dval) / 100);
  }

  const taxable = r2(gross - discount);
  const gstType = normaliseGstType(inv.gst_type);
  const rate = gstType === 'exempt' ? 0 : num(inv.gst_rate ?? 18);
  const gst = r2((taxable * rate) / 100);

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (gstType === 'igst') {
    igst = gst;
  } else if (gstType === 'intra') {
    cgst = r2(gst / 2);
    sgst = r2(gst - cgst);
  }

  const preRound = r2(taxable + gst);
  const grand = Math.round(preRound);
  const roundOff = r2(grand - preRound);

  return {
    freight,
    fuel_surcharge: r2(fuel),
    fuel_hike: r2(hike),
    additional_items: extras,
    additional_total: additional,
    gross_amount: gross,
    discount_type: dtype === 'fixed' ? 'fixed' : 'percent',
    discount_value: r2(dval),
    discount_amount: discount,
    taxable_amount: taxable,
    gst_type: gstType,
    gst_rate: rate,
    gst_amount: gst,
    cgst,
    sgst,
    igst,
    round_off: roundOff,
    grand_total: grand,
  };
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
  'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  return (TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '')).trim();
}

export function amountInWords(amount: number | string): string {
  let n = Math.round(num(amount));
  if (n === 0) return 'Rupees Zero Only';

  const parts: string[] = [];

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = Math.floor(n / 100);
  const rest = n % 100;

  if (crore) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) parts.push(twoDigits(rest));

  return `Rupees ${parts.join(' ')} Only`;
}

export function displayStatus(inv: Record<string, any>, paidAmount: number, totals: { grand_total: number }): 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled' {
  const stored = String(inv.status || '').trim().toLowerCase();
  if (['cancelled', 'canceled'].includes(stored)) return 'cancelled';
  if (stored === 'draft') return 'draft';

  const total = totals.grand_total;
  if (total > 0 && paidAmount >= total - 1) return 'paid';

  const due = inv.due_date || inv.invoice_date;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = Boolean(due) && String(due).slice(0, 10) < today;

  if (paidAmount > 0) {
    return overdue ? 'overdue' : 'partially_paid';
  }
  return overdue ? 'overdue' : 'issued';
}
