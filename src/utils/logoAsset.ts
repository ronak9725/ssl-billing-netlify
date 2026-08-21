/**
 * Utility to provide rasterized Base64 Data URL for jsPDF invoice printing
 */

let cachedLogoDataUrl: string | null = null;

export const LOGO_SVG_STRING = `<svg viewBox="0 0 620 180" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sslOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF7A00" />
      <stop offset="100%" stop-color="#E65100" />
    </linearGradient>
    <linearGradient id="sslGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00A859" />
      <stop offset="100%" stop-color="#007A3D" />
    </linearGradient>
    <linearGradient id="sslTruckRed" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EF4444" />
      <stop offset="100%" stop-color="#C62828" />
    </linearGradient>
  </defs>

  <g id="ssl-left-swoosh">
    <path d="M38 122 C 22 118, 12 105, 14 88 C 16 68, 38 52, 48 48 C 38 58, 25 76, 27 94 C 29 108, 45 116, 76 120 C 112 124, 150 123, 172 121 C 136 125, 68 127, 38 122 Z" fill="url(#sslGreenGrad)" />
    <path d="M48 48 C 36 62, 28 80, 32 98 C 36 112, 54 118, 86 121 C 62 119, 44 112, 40 100 C 37 86, 42 70, 48 48 Z" fill="#005A2B" opacity="0.85" />
    <polygon points="46,47 28,58 58,52" fill="#29B6F6" />
    <polygon points="46,47 58,52 68,44 54,49" fill="#0288D1" />
  </g>

  <g id="ssl-orange-chevron">
    <polygon points="82,98 178,54 156,54 68,88" fill="url(#sslOrangeGrad)" />
    <polygon points="62,99 176,99 158,88 100,88" fill="url(#sslOrangeGrad)" />
  </g>

  <g id="ssl-green-warehouse">
    <polygon points="186,52 216,36 246,52 246,99 186,99" fill="url(#sslGreenGrad)" />
    <path d="M204,99 L204,74 L216,66 L228,74 L228,99 Z" fill="#FFFFFF" />
    <polygon points="208,75 216,69 224,75 220,77 216,74 212,77" fill="#007A3D" />
  </g>

  <g id="ssl-city-and-truck">
    <polygon points="252,99 346,99 340,94 258,94" fill="url(#sslOrangeGrad)" />
    <rect x="272" y="52" width="13" height="42" fill="#4FC3F7" />
    <rect x="275" y="57" width="2.5" height="4" fill="#FFFFFF" />
    <rect x="280" y="57" width="2.5" height="4" fill="#FFFFFF" />
    <rect x="275" y="65" width="2.5" height="4" fill="#FFFFFF" />
    <rect x="280" y="65" width="2.5" height="4" fill="#FFFFFF" />
    <rect x="275" y="73" width="2.5" height="4" fill="#FFFFFF" />
    <rect x="280" y="73" width="2.5" height="4" fill="#FFFFFF" />

    <rect x="288" y="24" width="15" height="70" fill="#0288D1" />
    <polygon points="288,24 295.5,14 303,24" fill="#01579B" />
    <rect x="292" y="30" width="2.5" height="4.5" fill="#FFFFFF" />
    <rect x="297" y="30" width="2.5" height="4.5" fill="#FFFFFF" />
    <rect x="292" y="39" width="2.5" height="4.5" fill="#FFFFFF" />
    <rect x="297" y="39" width="2.5" height="4.5" fill="#FFFFFF" />
    <rect x="292" y="48" width="2.5" height="4.5" fill="#FFFFFF" />
    <rect x="297" y="48" width="2.5" height="4.5" fill="#FFFFFF" />
    <rect x="292" y="57" width="2.5" height="4.5" fill="#FFFFFF" />
    <rect x="297" y="57" width="2.5" height="4.5" fill="#FFFFFF" />

    <rect x="306" y="38" width="13" height="56" fill="#29B6F6" />
    <polygon points="306,38 319,28 319,38" fill="#0288D1" />
    <rect x="309" y="44" width="2.5" height="4" fill="#FFFFFF" />
    <rect x="314" y="44" width="2.5" height="4" fill="#FFFFFF" />
    <rect x="309" y="53" width="2.5" height="4" fill="#FFFFFF" />
    <rect x="314" y="53" width="2.5" height="4" fill="#FFFFFF" />
    <rect x="309" y="62" width="2.5" height="4" fill="#FFFFFF" />
    <rect x="314" y="62" width="2.5" height="4" fill="#FFFFFF" />

    <line x1="250" y1="84" x2="265" y2="84" stroke="#DC2626" stroke-width="2" stroke-linecap="round" />
    <line x1="254" y1="89" x2="267" y2="89" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round" />
    <line x1="248" y1="94" x2="262" y2="94" stroke="#DC2626" stroke-width="1.8" stroke-linecap="round" />

    <polygon points="268,68 308,68 308,95 268,95" fill="url(#sslTruckRed)" />
    <line x1="270" y1="70" x2="306" y2="70" stroke="#FFFFFF" stroke-width="1" opacity="0.6" />
    <line x1="280" y1="70" x2="280" y2="93" stroke="#991B1B" stroke-width="1" />
    <line x1="294" y1="70" x2="294" y2="93" stroke="#991B1B" stroke-width="1" />

    <path d="M308,74 L322,74 L328,84 L328,95 L308,95 Z" fill="#DC2626" />
    <polygon points="311,76 320,76 325,84 311,84" fill="#E1F5FE" />
    <circle cx="325" cy="89" r="1.8" fill="#FEF08A" />
    <rect x="306" y="93" width="24" height="3.5" rx="1" fill="#1E293B" />

    <circle cx="280" cy="97" r="5" fill="#1E293B" />
    <circle cx="280" cy="97" r="2.2" fill="#94A3B8" />
    <circle cx="318" cy="97" r="5" fill="#1E293B" />
    <circle cx="318" cy="97" r="2.2" fill="#94A3B8" />
  </g>

  <g id="ssl-krishna-mascot" transform="translate(348, 22)">
    <g transform="translate(18, 0) rotate(18 6 10)">
      <ellipse cx="6" cy="10" rx="5.5" ry="9" fill="#00C853" />
      <ellipse cx="6" cy="10" rx="3.8" ry="6" fill="#0288D1" />
      <ellipse cx="6" cy="10" rx="2" ry="3.5" fill="#FFD600" />
      <circle cx="6" cy="10" r="1.2" fill="#1A237E" />
    </g>

    <circle cx="16" cy="22" r="12" fill="#0F172A" />
    <path d="M4 22 Q16 10 28 22 Q16 18 4 22" fill="#F59E0B" />
    <ellipse cx="16" cy="28" rx="10" ry="11" fill="#4FC3F7" />
    <path d="M15 20 Q16 26 17 20 Z" fill="#DC2626" />
    <circle cx="16" cy="26" r="0.8" fill="#F59E0B" />
    <circle cx="12" cy="27" r="1.1" fill="#0F172A" />
    <circle cx="20" cy="27" r="1.1" fill="#0F172A" />
    <path d="M13.5 33 Q16 36 18.5 33" stroke="#DC2626" stroke-width="0.9" fill="none" stroke-linecap="round" />

    <line x1="-3" y1="39" x2="16" y2="28" stroke="#D97706" stroke-width="2.2" stroke-linecap="round" />
    <path d="M9 37 Q16 45 23 37" stroke="#FFFFFF" stroke-width="1.4" stroke-dasharray="2 1.2" fill="none" />
    <path d="M10 39 Q16 38 22 39 L21 54 Q16 55 11 54 Z" fill="#38BDF8" />
    <path d="M9 51 Q16 49 23 51 L25 72 Q16 77 7 72 Z" fill="#FBC02D" />
    <path d="M11 51 Q16 57 21 51 L19 66 Q16 70 13 66 Z" fill="#DC2626" />

    <g transform="translate(18, 40)">
      <ellipse cx="6" cy="7" rx="5.5" ry="6" fill="#8D6E63" />
      <ellipse cx="6" cy="2.5" rx="4.5" ry="2" fill="#5D4037" />
      <ellipse cx="6" cy="2" rx="3.5" ry="1.5" fill="#FFFFFF" />
    </g>

    <rect x="11" y="72" width="2.5" height="5" rx="1" fill="#38BDF8" />
    <rect x="18" y="72" width="2.5" height="5" rx="1" fill="#38BDF8" />
  </g>

  <g id="ssl-typography">
    <text x="240" y="142" text-anchor="middle" font-family="'Cinzel', 'Georgia', 'Playfair Display', serif" font-weight="800" font-size="23" letter-spacing="1.8" fill="#005696">
      SHREE SANWARIYA LOGISTICS
    </text>
    <text x="240" y="160" text-anchor="middle" font-family="'Inter', Arial, sans-serif" font-weight="700" font-size="9" letter-spacing="4.2" fill="#E65100">
      SAFE – RELIABLE – ON TIME FREIGHT
    </text>
  </g>
</svg>`;

/**
 * Converts the SVG logo to a raster PNG data URI for jsPDF insertion.
 */
export async function getLogoPngDataUrl(): Promise<string> {
  if (cachedLogoDataUrl) {
    return cachedLogoDataUrl;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      const svgBlob = new Blob([LOGO_SVG_STRING], { type: 'image/svg+xml;charset=utf-8' });
      const blobUrl = window.URL.createObjectURL(svgBlob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 620;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 620, 180);
          cachedLogoDataUrl = canvas.toDataURL('image/png');
          window.URL.revokeObjectURL(blobUrl);
          resolve(cachedLogoDataUrl);
        } else {
          window.URL.revokeObjectURL(blobUrl);
          resolve('');
        }
      };

      img.onerror = () => {
        window.URL.revokeObjectURL(blobUrl);
        resolve('');
      };

      img.src = blobUrl;
    } catch {
      resolve('');
    }
  });
}
