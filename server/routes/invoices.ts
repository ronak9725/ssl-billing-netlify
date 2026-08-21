import { Router, Request, Response } from 'express';
import * as db from '../db.js';
import * as calc from '../calc.js';
import { authMiddleware, requireModule } from '../auth.js';

export const invoiceRouter = Router();
invoiceRouter.use(authMiddleware);

function fyLabel(dateStr: string): string {
  const d = new Date(dateStr || new Date());
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-indexed
  const fyStart = month >= 4 ? year : year - 1;
  const fyEnd = ((fyStart + 1) % 100).toString().padStart(2, '0');
  return `${fyStart}-${fyEnd}`;
}

async function nextInvoiceNumber(invoiceDate: string): Promise<string> {
  const company = (await db.selectOne('company_settings')) || {};
  const prefix = (company.invoice_prefix || 'SSL').trim();
  const fy = fyLabel(invoiceDate);
  const existingInvoices = await db.select('invoices');
  const existingNumbers = new Set<string>(existingInvoices.map((r: any) => String(r.invoice_no || '')).filter(Boolean));

  let used: number[] = [];
  for (const num of existingNumbers) {
    if (num.startsWith(`${prefix}/${fy}/`)) {
      const parts = num.split('/');
      const seqStr = parts[parts.length - 1];
      if (/^\d+$/.test(seqStr)) {
        used.push(parseInt(seqStr, 10));
      }
    }
  }

  let seq = used.length > 0 ? Math.max(company.next_number || 1, Math.max(...used) + 1) : (company.next_number || 1);
  while (existingNumbers.has(`${prefix}/${fy}/${seq.toString().padStart(4, '0')}`)) {
    seq += 1;
  }
  return `${prefix}/${fy}/${seq.toString().padStart(4, '0')}`;
}

invoiceRouter.get('/invoices/next-number', requireModule('invoices'), async (req: Request, res: Response) => {
  try {
    const invDate = (req.query.invoice_date as string) || new Date().toISOString().slice(0, 10);
    const invoice_no = await nextInvoiceNumber(invDate);
    res.json({ invoice_no });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

invoiceRouter.post('/invoices/calculate', requireModule('invoices'), async (req: Request, res: Response) => {
  try {
    const result = calc.compute({
      ...req.body,
      extra_charges: req.body.extra_charges || [],
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

invoiceRouter.get('/invoices', requireModule('invoices'), async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const customerId = req.query.customer_id as string;
    const fromDate = req.query.from_date as string;
    const toDate = req.query.to_date as string;
    const search = req.query.search as string;
    const sort = (req.query.sort as string) || 'invoice_date';
    const order = (req.query.order as string) || 'desc';
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.page_size as string, 10) || 20;

    let rows = await db.select('invoices', { order: `${sort}.${order}` });
    const payments = await db.select('payments');

    const paidMap: Record<string, number> = {};
    for (const p of payments) {
      paidMap[p.invoice_id] = (paidMap[p.invoice_id] || 0) + calc.num(p.amount);
    }

    if (customerId) {
      rows = rows.filter((r: any) => r.customer_id === customerId);
    }
    if (fromDate) {
      rows = rows.filter((r: any) => (r.invoice_date || '') >= fromDate);
    }
    if (toDate) {
      rows = rows.filter((r: any) => (r.invoice_date || '') <= toDate);
    }
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter((r: any) =>
        (r.invoice_no || '').toLowerCase().includes(s) ||
        String(r.lr_no || '').toLowerCase().includes(s) ||
        ((r.buyer || {}).name || '').toLowerCase().includes(s)
      );
    }

    let items = rows.map((r: any) => {
      const paid = paidMap[r.id] || 0;
      const t = calc.compute(r);
      const display_status = calc.displayStatus(r, paid, t);
      const balance = calc.r2(Math.max(0, t.grand_total - paid));
      return {
        ...r,
        totals: t,
        paid: calc.r2(paid),
        balance,
        display_status,
      };
    });

    if (status && status !== 'all') {
      if (status === 'pending') {
        items = items.filter((i: any) => ['issued', 'partially_paid', 'overdue'].includes(i.display_status));
      } else {
        items = items.filter((i: any) => i.display_status === status);
      }
    }

    const validItems = items.filter((i: any) => i.display_status !== 'cancelled');
    const summary = {
      count: items.length,
      grand_total: calc.r2(validItems.reduce((acc: number, i: any) => acc + i.totals.grand_total, 0)),
      taxable: calc.r2(validItems.reduce((acc: number, i: any) => acc + i.totals.taxable_amount, 0)),
      gst: calc.r2(validItems.reduce((acc: number, i: any) => acc + i.totals.gst_amount, 0)),
      balance: calc.r2(validItems.reduce((acc: number, i: any) => acc + i.balance, 0)),
    };

    const start = Math.max(0, (page - 1) * pageSize);
    res.json({
      total: items.length,
      page,
      page_size: pageSize,
      summary,
      items: items.slice(start, start + pageSize),
    });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

invoiceRouter.get('/invoices/export', requireModule('invoices'), async (_req: Request, res: Response) => {
  try {
    const rows = await db.select('invoices', { order: 'invoice_date.desc' });
    const payments = await db.select('payments');
    const paidMap: Record<string, number> = {};
    for (const p of payments) {
      paidMap[p.invoice_id] = (paidMap[p.invoice_id] || 0) + calc.num(p.amount);
    }

    const headers = ['Invoice No', 'Date', 'Customer', 'GSTIN', 'LR No', 'Freight', 'Additional', 'Discount', 'Taxable', 'CGST', 'SGST', 'IGST', 'Round Off', 'Grand Total', 'Paid', 'Balance', 'Status'];
    let csv = headers.join(',') + '\n';

    for (const r of rows) {
      const t = calc.compute(r);
      const paid = paidMap[r.id] || 0;
      const balance = calc.r2(Math.max(0, t.grand_total - paid));
      const status = calc.displayStatus(r, paid, t);
      const buyer = r.buyer || {};

      const line = [
        r.invoice_no,
        r.invoice_date,
        `"${String(buyer.name || '').replace(/"/g, '""')}"`,
        buyer.gstin || '',
        r.lr_no || '',
        t.freight,
        t.additional_total,
        t.discount_amount,
        t.taxable_amount,
        t.cgst,
        t.sgst,
        t.igst,
        t.round_off,
        t.grand_total,
        calc.r2(paid),
        balance,
        status,
      ];
      csv += line.join(',') + '\n';
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=invoices.csv');
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

invoiceRouter.get('/invoices/overdue', requireModule('invoices'), async (_req: Request, res: Response) => {
  try {
    const company = (await db.selectOne('company_settings')) || {};
    const rows = await db.select('invoices', { order: 'invoice_date.asc' });
    const payments = await db.select('payments');
    const paidMap: Record<string, number> = {};
    for (const p of payments) {
      paidMap[p.invoice_id] = (paidMap[p.invoice_id] || 0) + calc.num(p.amount);
    }

    const customers = await db.select('customers');
    const custMap: Record<string, any> = {};
    for (const c of customers) {
      custMap[c.id] = c;
    }

    const today = new Date().toISOString().slice(0, 10);
    const out: any[] = [];

    for (const r of rows) {
      const paid = paidMap[r.id] || 0;
      const t = calc.compute(r);
      const status = calc.displayStatus(r, paid, t);
      if (status !== 'overdue') continue;

      const due = String(r.due_date || r.invoice_date || today).slice(0, 10);
      const diffMs = new Date(today).getTime() - new Date(due).getTime();
      const days = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      const cust = custMap[r.customer_id] || {};
      const balance = calc.r2(Math.max(0, t.grand_total - paid));
      const name = (r.buyer || {}).name || cust.name || 'Customer';

      const message = `Dear ${name}, our invoice ${r.invoice_no} dated ${String(r.invoice_date).slice(0, 10)} for Rs. ${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} was due on ${due} and is now ${days} day(s) overdue. Kindly arrange the payment at your earliest convenience. Thank you — ${company.name || 'SHREE SANWARIYA LOGISTICS'}.`;

      out.push({
        id: r.id,
        invoice_no: r.invoice_no,
        invoice_date: r.invoice_date,
        due_date: due,
        days_overdue: days,
        customer_id: r.customer_id,
        customer_name: name,
        phone: cust.phone,
        whatsapp: cust.whatsapp || cust.phone,
        email: cust.email,
        grand_total: t.grand_total,
        paid: calc.r2(paid),
        balance,
        message,
      });
    }

    out.sort((a, b) => b.days_overdue - a.days_overdue);
    res.json({
      count: out.length,
      total_overdue: calc.r2(out.reduce((acc, o) => acc + o.balance, 0)),
      items: out,
    });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

invoiceRouter.get('/invoices/:invoice_id', requireModule('invoices'), async (req: Request, res: Response) => {
  try {
    const inv = await db.selectOne('invoices', { id: `eq.${req.params.invoice_id}` });
    if (!inv) {
      return res.status(404).json({ detail: 'This invoice could not be found.' });
    }
    const payments = await db.select('payments', { invoice_id: `eq.${inv.id}` });
    const paid = calc.r2(payments.reduce((acc: number, p: any) => acc + calc.num(p.amount), 0));
    const t = calc.compute(inv);
    const balance = calc.r2(Math.max(0, t.grand_total - paid));
    const display_status = calc.displayStatus(inv, paid, t);

    res.json({
      ...inv,
      totals: t,
      paid,
      balance,
      display_status,
    });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

invoiceRouter.post('/invoices', requireModule('invoices'), async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const cust = await db.selectOne('customers', { id: `eq.${body.customer_id}` });
    if (!cust) {
      return res.status(400).json({ detail: 'Please select a valid customer before saving the invoice.' });
    }

    const company = (await db.selectOne('company_settings')) || {};
    const invoiceDate = body.invoice_date || new Date().toISOString().slice(0, 10);
    const invoiceNo = body.invoice_no || (await nextInvoiceNumber(invoiceDate));

    const extras = calc.extrasList(body.extra_charges);
    const totals = calc.compute({ ...body, extra_charges: extras });

    const buyer = {
      name: cust.name,
      address: cust.address,
      city: cust.city,
      state: cust.state,
      pin: cust.pin,
      gstin: cust.gstin,
      pan: cust.pan,
      phone: cust.phone,
    };
    const shipTo = body.same_as_buyer === false && body.ship_to
      ? {
          name: body.ship_to.name || cust.name,
          address: body.ship_to.address || cust.shipping_address || cust.address,
          city: body.ship_to.city || cust.city,
          state: body.ship_to.state || cust.state,
          pin: body.ship_to.pin || cust.pin,
          gstin: body.ship_to.gstin || '',
          phone: body.ship_to.phone || cust.phone || '',
        }
      : {
          name: cust.name,
          address: cust.shipping_address || cust.address,
          city: cust.city,
          state: cust.state,
          pin: cust.pin,
          gstin: cust.gstin || '',
          phone: cust.phone || '',
        };

    let dueDate = body.due_date;
    if (!dueDate && cust.credit_days) {
      const d = new Date(invoiceDate);
      d.setDate(d.getDate() + parseInt(cust.credit_days, 10));
      dueDate = d.toISOString().slice(0, 10);
    }

    const effectivePlaceOfSupply = body.place_of_supply || shipTo?.state || cust.state || 'Gujarat';

    const user = (req as any).user;
    const userId = user?.id || '5fecd6f5-7c32-488c-b1bc-b2a5f80b6927';

    const row = {
      user_id: userId,
      customer_id: body.customer_id,
      invoice_date: invoiceDate,
      invoice_no: invoiceNo,
      buyer,
      ship_to: shipTo,
      same_as_buyer: body.same_as_buyer ?? true,
      lr_no: body.lr_no || '',
      shipment_date: body.shipment_date || null,
      origin: body.origin || '',
      destination: body.destination || '',
      weight: calc.num(body.weight),
      rate_kg: calc.num(body.rate_kg),
      dimensions: body.dimensions || '',
      sac: body.sac || '996511',
      place_of_supply: effectivePlaceOfSupply,
      freight: totals.freight,
      extra_charges: extras,
      additional_total: totals.additional_total,
      discount_type: totals.discount_type,
      discount_value: totals.discount_value,
      discount_amount: totals.discount_amount,
      gst_type: totals.gst_type === 'igst' ? 'inter' : totals.gst_type,
      gst_rate: totals.gst_rate,
      taxable_amount: totals.taxable_amount,
      gst_amount: totals.gst_amount,
      cgst: totals.cgst,
      sgst: totals.sgst,
      igst: totals.igst,
      round_off: totals.round_off,
      grand_total: totals.grand_total,
      payment_terms: body.payment_terms || cust.payment_terms || '',
      due_date: dueDate,
      terms: body.terms || company.terms || '',
      notes: body.notes || '',
      status: body.status || 'pending',
      seller: {
        name: company.name || 'SHREE SANWARIYA LOGISTICS',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        pin: company.pin || '',
        gstin: company.gstin || '',
        pan: company.pan || '',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const created = await db.insert('invoices', row);

    // Increment next_number in company settings if sequence number matched
    const seqPart = invoiceNo.split('/').pop();
    if (seqPart && /^\d+$/.test(seqPart) && company.id) {
      await db.update('company_settings', { id: `eq.${company.id}` }, {
        next_number: parseInt(seqPart, 10) + 1,
      });
    }

    if (user && user.email) {
      await db.insert('audit_logs', {
        user_email: user.email,
        action: 'Invoice created',
        entity: 'invoices',
        entity_id: created.id,
        new_value: { invoice_no: created.invoice_no, grand_total: created.grand_total },
        created_at: new Date().toISOString(),
      });
    }

    res.status(201).json({
      ...created,
      totals,
      paid: 0,
      balance: totals.grand_total,
      display_status: calc.displayStatus(created, 0, totals),
    });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

invoiceRouter.put('/invoices/:invoice_id', requireModule('invoices'), async (req: Request, res: Response) => {
  try {
    const invId = req.params.invoice_id;
    const old = await db.selectOne('invoices', { id: `eq.${invId}` });
    if (!old) {
      return res.status(404).json({ detail: 'This invoice could not be found.' });
    }
    if (String(old.status).toLowerCase() === 'cancelled') {
      return res.status(400).json({ detail: 'A cancelled invoice cannot be edited.' });
    }

    const body = req.body;
    const customerId = body.customer_id || old.customer_id;
    const cust = await db.selectOne('customers', { id: `eq.${customerId}` });

    let buyer = old.buyer;
    if (cust) {
      buyer = {
        name: cust.name,
        address: cust.address,
        city: cust.city,
        state: cust.state,
        pin: cust.pin,
        gstin: cust.gstin,
        pan: cust.pan,
        phone: cust.phone,
      };
    }

    const sameAsBuyer = body.same_as_buyer ?? old.same_as_buyer ?? true;
    let shipTo = old.ship_to;
    if (sameAsBuyer && cust) {
      shipTo = {
        name: cust.name,
        address: cust.shipping_address || cust.address,
        city: cust.city,
        state: cust.state,
        pin: cust.pin,
        gstin: cust.gstin || '',
        phone: cust.phone || '',
      };
    } else if (body.ship_to) {
      shipTo = body.ship_to;
    }

    const extras = calc.extrasList(body.extra_charges);
    const totals = calc.compute({ ...body, extra_charges: extras });

    const data: any = {
      customer_id: customerId,
      invoice_date: body.invoice_date || old.invoice_date,
      invoice_no: body.invoice_no || old.invoice_no,
      buyer,
      ship_to: shipTo,
      same_as_buyer: sameAsBuyer,
      lr_no: body.lr_no !== undefined ? body.lr_no : old.lr_no,
      shipment_date: body.shipment_date !== undefined ? body.shipment_date : old.shipment_date,
      origin: body.origin !== undefined ? body.origin : old.origin,
      destination: body.destination !== undefined ? body.destination : old.destination,
      weight: body.weight !== undefined ? calc.num(body.weight) : old.weight,
      rate_kg: body.rate_kg !== undefined ? calc.num(body.rate_kg) : old.rate_kg,
      dimensions: body.dimensions !== undefined ? body.dimensions : old.dimensions,
      sac: body.sac || old.sac || '996511',
      place_of_supply: body.place_of_supply || shipTo?.state || (cust ? cust.state : 'Gujarat') || old.place_of_supply,
      freight: totals.freight,
      extra_charges: extras,
      additional_total: totals.additional_total,
      discount_type: totals.discount_type,
      discount_value: totals.discount_value,
      discount_amount: totals.discount_amount,
      gst_type: totals.gst_type === 'igst' ? 'inter' : totals.gst_type,
      gst_rate: totals.gst_rate,
      taxable_amount: totals.taxable_amount,
      gst_amount: totals.gst_amount,
      cgst: totals.cgst,
      sgst: totals.sgst,
      igst: totals.igst,
      round_off: totals.round_off,
      grand_total: totals.grand_total,
      payment_terms: body.payment_terms !== undefined ? body.payment_terms : old.payment_terms,
      due_date: body.due_date !== undefined ? body.due_date : old.due_date,
      notes: body.notes !== undefined ? body.notes : old.notes,
      updated_at: new Date().toISOString(),
    };

    const updated = await db.update('invoices', { id: `eq.${invId}` }, data);
    const payments = await db.select('payments', { invoice_id: `eq.${invId}` });
    const paid = calc.r2(payments.reduce((acc: number, p: any) => acc + calc.num(p.amount), 0));

    const user = (req as any).user;
    if (user) {
      await db.insert('audit_logs', {
        user_email: user.email,
        action: 'Invoice updated',
        entity: 'invoices',
        entity_id: invId,
        old_value: { invoice_no: old.invoice_no, grand_total: old.grand_total },
        new_value: { invoice_no: updated.invoice_no, grand_total: updated.grand_total },
        created_at: new Date().toISOString(),
      });
    }

    res.json({
      ...updated,
      totals,
      paid,
      balance: calc.r2(Math.max(0, totals.grand_total - paid)),
      display_status: calc.displayStatus(updated, paid, totals),
    });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

invoiceRouter.post('/invoices/:invoice_id/cancel', requireModule('invoices'), async (req: Request, res: Response) => {
  try {
    const invId = req.params.invoice_id;
    const old = await db.selectOne('invoices', { id: `eq.${invId}` });
    if (!old) {
      return res.status(404).json({ detail: 'This invoice could not be found.' });
    }

    const payments = await db.select('payments', { invoice_id: `eq.${invId}` });
    const force = req.body?.force === true;
    if (payments && payments.length > 0 && !force) {
      // If force wasn't passed, notify but allow user to confirm with force
      return res.status(400).json({ 
        detail: `This invoice has ${payments.length} payment receipt(s) recorded against it. Please confirm if you wish to cancel the invoice.`,
        has_payments: true,
        payment_count: payments.length 
      });
    }

    const updated = await db.update('invoices', { id: `eq.${invId}` }, {
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    });

    const user = (req as any).user;
    if (user && user.email) {
      await db.insert('audit_logs', {
        user_email: user.email,
        action: 'Invoice cancelled',
        entity: 'invoices',
        entity_id: invId,
        old_value: { status: old.status, invoice_no: old.invoice_no },
        new_value: { status: 'cancelled' },
        created_at: new Date().toISOString(),
      });
    }

    const totals = calc.compute(updated);
    res.json({
      ...updated,
      totals,
      paid: 0,
      balance: 0,
      display_status: 'cancelled',
      message: `Invoice ${old.invoice_no} has been cancelled.`,
    });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

invoiceRouter.delete('/invoices/:invoice_id', requireModule('invoices'), async (req: Request, res: Response) => {
  try {
    const invId = req.params.invoice_id;
    const old = await db.selectOne('invoices', { id: `eq.${invId}` });
    if (!old) {
      return res.status(404).json({ detail: 'This invoice could not be found.' });
    }

    // Clean up any linked payments so we don't leave orphaned records
    const payments = await db.select('payments', { invoice_id: `eq.${invId}` });
    for (const p of payments) {
      await db.remove('payments', { id: `eq.${p.id}` });
    }

    // Delete invoice permanently
    await db.remove('invoices', { id: `eq.${invId}` });

    const user = (req as any).user;
    if (user && user.email) {
      await db.insert('audit_logs', {
        user_email: user.email,
        action: 'Invoice permanently deleted',
        entity: 'invoices',
        entity_id: invId,
        old_value: { 
          invoice_no: old.invoice_no, 
          grand_total: old.grand_total,
          buyer_name: (old.buyer || {}).name,
          payments_deleted: payments.length 
        },
        new_value: null,
        created_at: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      message: `Invoice ${old.invoice_no} was permanently deleted.`,
    });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});
