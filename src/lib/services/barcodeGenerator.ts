/**
 * High-Density Standard Code 128B Barcode SVG Generator
 * Generates mathematically exact Code 128 barcodes compatible with 1D handheld laser scanners
 * (Items 22, 27)
 */

// Code 128 pattern table (107 patterns, each pattern has 6 bar/space widths summing to 11 modules, except stop which has 7 summing to 13)
const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112'                                 // 100-106 (106 is STOP)
];

const START_CODE_B = 104; // Code 128B start symbol
const STOP_CODE = 106;

/**
 * Generates an SVG string for Code 128 Barcode with human-readable text
 */
export function generateCode128Svg(text: string, height: number = 55, barWidth: number = 1.6): string {
  const cleanText = text.trim();
  if (!cleanText) return '';

  // Calculate values for Code 128B (ASCII values 32-127 map to values 0-95)
  const codes: number[] = [START_CODE_B];
  let checkSum = START_CODE_B;

  for (let i = 0; i < cleanText.length; i++) {
    const charCode = cleanText.charCodeAt(i);
    const value = charCode >= 32 && charCode <= 126 ? charCode - 32 : 0;
    codes.push(value);
    checkSum += value * (i + 1);
  }

  const checkChar = checkSum % 103;
  codes.push(checkChar);
  codes.push(STOP_CODE);

  // Build bars and spaces
  let currentX = 10; // Left quiet zone
  let rects = '';

  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    const pattern = CODE128_PATTERNS[code] || '111111';
    let isBar = true;

    for (let p = 0; p < pattern.length; p++) {
      const width = parseInt(pattern[p], 10) * barWidth;
      if (isBar) {
        rects += `<rect x="${currentX.toFixed(2)}" y="0" width="${width.toFixed(2)}" height="${height}" fill="#000000" />`;
      }
      currentX += width;
      isBar = !isBar;
    }
  }

  const totalWidth = currentX + 10; // Right quiet zone
  const totalSvgHeight = height + 16; // Add space for human readable text

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth.toFixed(0)} ${totalSvgHeight}" width="100%" height="${totalSvgHeight}" shape-rendering="crispEdges">
    <rect width="${totalWidth.toFixed(0)}" height="${totalSvgHeight}" fill="#ffffff" />
    ${rects}
    <text x="${(totalWidth / 2).toFixed(1)}" y="${height + 12}" font-family="monospace" font-size="11" font-weight="bold" fill="#000000" text-anchor="middle" letter-spacing="2">${escapeXml(cleanText)}</text>
  </svg>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
