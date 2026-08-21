import { Router, Request, Response } from 'express';
import * as db from '../db.js';

export const lookupRouter = Router();

// Indian GST State Codes Mapping
export const GST_STATE_MAP: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman and Diu',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other Territory',
};

// PIN Code Prefix to State fallback mapping in India
export const PIN_PREFIX_STATE_MAP: Record<string, { state: string; city: string }> = {
  '11': { state: 'Delhi', city: 'New Delhi' },
  '12': { state: 'Haryana', city: 'Gurugram' },
  '13': { state: 'Haryana', city: 'Ambala' },
  '14': { state: 'Punjab', city: 'Ludhiana' },
  '15': { state: 'Punjab', city: 'Bathinda' },
  '16': { state: 'Chandigarh', city: 'Chandigarh' },
  '17': { state: 'Himachal Pradesh', city: 'Shimla' },
  '18': { state: 'Jammu and Kashmir', city: 'Jammu' },
  '19': { state: 'Jammu and Kashmir', city: 'Srinagar' },
  '20': { state: 'Uttar Pradesh', city: 'Aligarh' },
  '21': { state: 'Uttar Pradesh', city: 'Allahabad' },
  '22': { state: 'Uttar Pradesh', city: 'Lucknow' },
  '23': { state: 'Uttar Pradesh', city: 'Varanasi' },
  '24': { state: 'Uttarakhand', city: 'Dehradun' },
  '25': { state: 'Uttar Pradesh', city: 'Meerut' },
  '26': { state: 'Uttarakhand', city: 'Nainital' },
  '27': { state: 'Uttar Pradesh', city: 'Gorakhpur' },
  '28': { state: 'Uttar Pradesh', city: 'Agra' },
  '30': { state: 'Rajasthan', city: 'Jaipur' },
  '31': { state: 'Rajasthan', city: 'Udaipur' },
  '32': { state: 'Rajasthan', city: 'Kota' },
  '33': { state: 'Rajasthan', city: 'Bikaner' },
  '34': { state: 'Rajasthan', city: 'Jodhpur' },
  '36': { state: 'Gujarat', city: 'Rajkot' },
  '37': { state: 'Gujarat', city: 'Kutch / Gandhidham' },
  '38': { state: 'Gujarat', city: 'Ahmedabad' },
  '39': { state: 'Gujarat', city: 'Surat / Vadodara' },
  '40': { state: 'Maharashtra', city: 'Mumbai' },
  '41': { state: 'Maharashtra', city: 'Pune' },
  '42': { state: 'Maharashtra', city: 'Nashik / Bhiwandi' },
  '43': { state: 'Maharashtra', city: 'Aurangabad' },
  '44': { state: 'Maharashtra', city: 'Nagpur' },
  '45': { state: 'Madhya Pradesh', city: 'Indore' },
  '46': { state: 'Madhya Pradesh', city: 'Bhopal' },
  '47': { state: 'Madhya Pradesh', city: 'Gwalior' },
  '48': { state: 'Madhya Pradesh', city: 'Jabalpur' },
  '49': { state: 'Chhattisgarh', city: 'Raipur' },
  '50': { state: 'Telangana', city: 'Hyderabad' },
  '51': { state: 'Andhra Pradesh', city: 'Tirupati' },
  '52': { state: 'Andhra Pradesh', city: 'Vijayawada' },
  '53': { state: 'Andhra Pradesh', city: 'Visakhapatnam' },
  '56': { state: 'Karnataka', city: 'Bengaluru' },
  '57': { state: 'Karnataka', city: 'Mangalore' },
  '58': { state: 'Karnataka', city: 'Hubli' },
  '59': { state: 'Karnataka', city: 'Belgaum' },
  '60': { state: 'Tamil Nadu', city: 'Chennai' },
  '61': { state: 'Tamil Nadu', city: 'Tiruchirappalli' },
  '62': { state: 'Tamil Nadu', city: 'Madurai' },
  '63': { state: 'Tamil Nadu', city: 'Salem' },
  '64': { state: 'Tamil Nadu', city: 'Coimbatore' },
  '67': { state: 'Kerala', city: 'Kozhikode' },
  '68': { state: 'Kerala', city: 'Kochi' },
  '69': { state: 'Kerala', city: 'Thiruvananthapuram' },
  '70': { state: 'West Bengal', city: 'Kolkata' },
  '71': { state: 'West Bengal', city: 'Howrah' },
  '72': { state: 'West Bengal', city: 'Midnapore' },
  '73': { state: 'West Bengal', city: 'Siliguri' },
  '74': { state: 'West Bengal', city: 'Barasat' },
  '75': { state: 'Odisha', city: 'Bhubaneswar' },
  '76': { state: 'Odisha', city: 'Cuttack' },
  '77': { state: 'Odisha', city: 'Rourkela' },
  '78': { state: 'Assam', city: 'Guwahati' },
  '79': { state: 'Meghalaya', city: 'Shillong' },
  '80': { state: 'Bihar', city: 'Patna' },
  '81': { state: 'Bihar', city: 'Bhagalpur' },
  '82': { state: 'Jharkhand', city: 'Ranchi' },
  '83': { state: 'Jharkhand', city: 'Jamshedpur' },
  '84': { state: 'Bihar', city: 'Muzaffarpur' },
  '85': { state: 'Bihar', city: 'Purnia' },
};

const PAN_ENTITY_TYPES: Record<string, string> = {
  C: 'Company (Pvt Ltd / Ltd)',
  P: 'Individual / Proprietorship',
  H: 'Hindu Undivided Family (HUF)',
  F: 'Partnership Firm / LLP',
  A: 'Association of Persons (AOP)',
  T: 'Trust',
  B: 'Body of Individuals (BOI)',
  L: 'Local Authority',
  J: 'Artificial Juridical Person',
  G: 'Government Agency',
};

// Helper to parse and normalize GSTVerify API responses
function parseGstVerifyResponse(
  data: any,
  rawGstin: string,
  fallbackStateName: string,
  fallbackStateCode: string,
  fallbackPan: string,
  fallbackEntityType: string
) {
  if (!data || typeof data !== 'object') return null;

  // Handle nested data structures (GSTVerify data payload or root)
  const d = data.data || data.result || data.taxpayerInfo || data.body || data;
  if (!d || typeof d !== 'object') return null;

  // 1. Extract Addresses (building, street, locality, landmark)
  const pradr = d.pradr || d.principal_place_of_business || d.principalAddress || {};
  const addrObj = pradr.addr || d.address || (typeof pradr === 'object' && !pradr.addr ? pradr : {});

  let fullAddress = '';
  if (typeof addrObj === 'string' && addrObj.trim()) {
    fullAddress = addrObj.trim();
  } else if (typeof d.address === 'string' && d.address.trim()) {
    fullAddress = d.address.trim();
  } else if (typeof addrObj === 'object') {
    const addrParts = [
      addrObj.bno || addrObj.building_no || addrObj.door_no || addrObj.flat_no,
      addrObj.bnm || addrObj.building_name || addrObj.premise_name,
      addrObj.st || addrObj.street || addrObj.road,
      addrObj.loc || addrObj.locality || addrObj.location,
      addrObj.landMark || addrObj.landmark,
    ].filter(Boolean);
    fullAddress = addrParts.join(', ');
  }

  // 2. City & PIN
  const city = addrObj.dst || addrObj.city || addrObj.district || d.city || d.district || d.dst || '';
  const pin = addrObj.pncd || addrObj.pincode || addrObj.pin || d.pincode || d.pin || d.pncd || '';

  // 3. Names
  const legalName = d.legal_name || d.lgnm || d.legalName || d.lName || d.name || '';
  const tradeName = d.trade_name || d.tradeNam || d.tradeName || d.business_name || d.tName || '';
  const customerName = tradeName || legalName || '';

  // 4. Status & Constitution
  const rawStatus = d.status || d.sts || d.gst_status || d.gstin_status || 'Active';
  const status = typeof rawStatus === 'string' ? rawStatus : 'Active';
  const constitution = d.constitution || d.ctb || d.constitution_of_business || fallbackEntityType;
  const taxpayerType = d.taxpayer_type || d.dty || d.taxpayerType || 'Regular';
  const registrationDate = d.registration_date || d.rgdt || d.reg_date || '';

  // 5. State & State Code
  const rawStateCode = d.state_code || d.stcd || (addrObj.stcd ? String(addrObj.stcd) : '') || fallbackStateCode;
  const normalizedStateCode = String(rawStateCode).padStart(2, '0');
  const state = d.state || GST_STATE_MAP[normalizedStateCode] || fallbackStateName;

  // 6. Nature of Business
  let natureOfBusiness: string[] = [];
  if (Array.isArray(d.nature_of_business)) {
    natureOfBusiness = d.nature_of_business;
  } else if (Array.isArray(d.nba)) {
    natureOfBusiness = d.nba;
  } else if (typeof d.nature_of_business === 'string') {
    natureOfBusiness = [d.nature_of_business];
  } else if (typeof d.nba === 'string') {
    natureOfBusiness = [d.nba];
  }

  return {
    verification_status: 'verified' as const,
    is_live_verified: true,
    gstin: rawGstin,
    pan: d.pan || fallbackPan,
    legal_name: legalName,
    trade_name: tradeName,
    customer_name: customerName,
    address: fullAddress,
    city: city,
    state: state,
    state_code: normalizedStateCode,
    pin: pin,
    gst_status: status,
    constitution: constitution,
    taxpayer_type: taxpayerType,
    registration_date: registrationDate,
    nature_of_business: natureOfBusiness,
    message: `Verified: ${customerName || legalName || 'Registered Taxpayer'} (${state}) · Status: ${status}`,
    source: 'gstverify' as const,
  };
}

// GET /api/lookup/gst?gstin=...
lookupRouter.get('/lookup/gst', async (req: Request, res: Response) => {
  try {
    const raw = String(req.query.gstin || '').trim().toUpperCase();
    if (!raw) {
      return res.status(400).json({
        verification_status: 'invalid',
        is_live_verified: false,
        gstin: '',
        message: 'Please provide a GSTIN parameter.',
        source: 'none',
      });
    }

    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    const isValidFormat = gstinRegex.test(raw);

    const stateCode = raw.substring(0, 2);
    const stateName = GST_STATE_MAP[stateCode] || 'Gujarat';
    const pan = raw.length >= 12 ? raw.substring(2, 12) : '';
    const entityLetter = pan.length >= 4 ? pan.charAt(3) : '';
    const entityType = PAN_ENTITY_TYPES[entityLetter] || 'Registered Taxpayer';

    // If invalid syntax format
    if (!isValidFormat) {
      return res.status(400).json({
        verification_status: 'invalid',
        is_live_verified: false,
        gstin: raw,
        pan,
        state: stateName,
        state_code: stateCode,
        constitution: entityType,
        message: 'Invalid 15-character GSTIN format. Must follow standard Indian GST format.',
        source: 'none',
      });
    }

    // Check backend environment for GSTVERIFY_API_KEY (or GST_API_KEY fallback)
    const apiKey = (process.env.GSTVERIFY_API_KEY || process.env.GST_API_KEY || '').trim();

    // If no API key configured on server
    if (!apiKey) {
      return res.json({
        verification_status: 'unavailable',
        is_live_verified: false,
        gstin: raw,
        pan,
        legal_name: '',
        trade_name: '',
        customer_name: '',
        address: '',
        city: '',
        state: stateName,
        state_code: stateCode,
        pin: '',
        gst_status: 'Unverified',
        constitution: entityType,
        taxpayer_type: 'Regular',
        registration_date: '',
        nature_of_business: [],
        message: 'Live verification unavailable (GSTVERIFY_API_KEY not configured on server). State & PAN derived from GSTIN.',
        source: 'derived',
      });
    }

    // Call official GSTVerify endpoint: GET https://gstverify.co.in/api/v1/verify/{GSTIN}
    const targetUrl = `https://gstverify.co.in/api/v1/verify/${encodeURIComponent(raw)}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json',
          'User-Agent': 'LogisticsInvoiceManager/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const statusCode = response.status;
      const respData: any = await response.json().catch(() => null);

      // Check for successful 200 response
      if (response.ok && respData) {
        // Check if provider returned success data or an inner error message
        if (respData.status === false || respData.error || respData.message?.toLowerCase()?.includes('not found')) {
          return res.json({
            verification_status: 'invalid',
            is_live_verified: false,
            gstin: raw,
            pan,
            state: stateName,
            state_code: stateCode,
            constitution: entityType,
            message: respData.message || 'GSTIN not found in official GST registry.',
            source: 'none',
          });
        }

        const normalized = parseGstVerifyResponse(respData, raw, stateName, stateCode, pan, entityType);
        if (normalized) {
          return res.json(normalized);
        }
      }

      // Handle specific HTTP Status errors from provider
      if (statusCode === 401 || statusCode === 403) {
        console.warn('GSTVerify auth failure (401/403) - verify GSTVERIFY_API_KEY');
        return res.json({
          verification_status: 'unavailable',
          is_live_verified: false,
          gstin: raw,
          pan,
          state: stateName,
          state_code: stateCode,
          constitution: entityType,
          message: 'Live verification unavailable: GSTVerify authentication failed. Please check server API key.',
          source: 'derived',
        });
      }

      if (statusCode === 404) {
        return res.json({
          verification_status: 'invalid',
          is_live_verified: false,
          gstin: raw,
          pan,
          state: stateName,
          state_code: stateCode,
          constitution: entityType,
          message: 'GSTIN not found in official GST registry.',
          source: 'none',
        });
      }

      if (statusCode === 429 || statusCode === 402) {
        return res.json({
          verification_status: 'unavailable',
          is_live_verified: false,
          gstin: raw,
          pan,
          state: stateName,
          state_code: stateCode,
          constitution: entityType,
          message: 'Live verification unavailable: GSTVerify API request quota exceeded or rate limited.',
          source: 'derived',
        });
      }

      // Other 5xx or unhandled response
      return res.json({
        verification_status: 'unavailable',
        is_live_verified: false,
        gstin: raw,
        pan,
        state: stateName,
        state_code: stateCode,
        constitution: entityType,
        message: `Live verification unavailable (Provider returned status ${statusCode}). State & PAN derived from GSTIN.`,
        source: 'derived',
      });
    } catch (networkErr: any) {
      console.warn('GSTVerify request network timeout or failure:', networkErr?.message || networkErr);
      return res.json({
        verification_status: 'unavailable',
        is_live_verified: false,
        gstin: raw,
        pan,
        state: stateName,
        state_code: stateCode,
        constitution: entityType,
        message: 'Live verification unavailable (Network timeout / provider unreachable). State & PAN derived from GSTIN.',
        source: 'derived',
      });
    }
  } catch (err: any) {
    res.status(500).json({
      verification_status: 'unavailable',
      is_live_verified: false,
      message: err.message,
      source: 'none',
    });
  }
});

// POST /api/lookup/test-gst-api - Test API key directly with a sample GSTIN
lookupRouter.post('/lookup/test-gst-api', async (req: Request, res: Response) => {
  try {
    const { apiKey = (process.env.GSTVERIFY_API_KEY || process.env.GST_API_KEY || ''), gstin = '24AABCS1429B1Z8' } = req.body;
    if (!apiKey) {
      return res.status(400).json({ success: false, message: 'GSTVERIFY_API_KEY is not configured on the server.' });
    }

    const cleanGst = String(gstin).trim().toUpperCase();
    const testUrl = `https://gstverify.co.in/api/v1/verify/${encodeURIComponent(cleanGst)}`;

    const headers: Record<string, string> = {
      'X-API-Key': apiKey,
      'Accept': 'application/json',
      'User-Agent': 'LogisticsInvoiceManager/1.0',
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const resp = await fetch(testUrl, { method: 'GET', headers, signal: controller.signal });
    clearTimeout(timeout);

    const rawData = await resp.json().catch(() => null);

    if (resp.ok && rawData) {
      const parsed = parseGstVerifyResponse(rawData, cleanGst, 'Gujarat', '24', cleanGst.substring(2, 12), 'Company');
      return res.json({
        success: true,
        message: 'GSTVerify connection successful! Live verified data retrieved.',
        data: parsed,
      });
    } else {
      return res.status(resp.status || 400).json({
        success: false,
        status: resp.status,
        message: `GSTVerify returned HTTP ${resp.status}`,
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Connection test failed: ${err.message}`,
    });
  }
});

// GET /api/lookup/pincode?pincode=...
lookupRouter.get('/lookup/pincode', async (req: Request, res: Response) => {
  try {
    const pincode = String(req.query.pincode || '').trim();
    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      return res.status(400).json({ error: 'Please enter a valid 6-digit Indian PIN Code.' });
    }

    const prefix = pincode.substring(0, 2);
    const fallback = PIN_PREFIX_STATE_MAP[prefix] || { state: 'Gujarat', city: 'Ahmedabad' };

    let result = {
      valid: true,
      pincode,
      city: fallback.city,
      district: fallback.city,
      state: fallback.state,
      division: '',
      region: '',
      area: '',
      post_offices: [] as string[],
      source: 'fallback',
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0]?.PostOffice)) {
          const poList = data[0].PostOffice;
          const firstPO = poList[0];

          const district = firstPO.District || firstPO.Division || fallback.city;
          const state = firstPO.State || fallback.state;
          const officeNames = poList.map((p: any) => p.Name).filter(Boolean);

          result = {
            valid: true,
            pincode,
            city: district,
            district: district,
            state: state,
            division: firstPO.Division || '',
            region: firstPO.Region || '',
            area: firstPO.Name || '',
            post_offices: officeNames,
            source: 'postal_api',
          };
        }
      }
    } catch (fetchErr) {
      console.warn('Postal pincode API fetch error, using mapped state/city:', fetchErr);
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
