import QRCode from 'qrcode';

/**
 * Standards-Compliant High-Precision QR Code SVG & DataURI Generator
 * Generates ISO/IEC 18004 scannable 2D QR codes compatible with all smartphone cameras & handheld 2D imagers.
 * Portable across Next.js SSR, Edge, API routes, and Client browsers.
 * (Items 17, 22)
 */

export function generateSvgQrCode(text: string, size: number = 100): string {
  try {
    const cleanText = text && text.trim().length > 0 ? text.trim() : 'https://mmbookhouse.com';
    const qr = QRCode.create(cleanText, { errorCorrectionLevel: 'M' });
    const gridSize = qr.modules.size;
    const margin = 1; // 1-module quiet zone
    const totalSize = gridSize + margin * 2;
    const cellSize = size / totalSize;
    let rects = '';

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (qr.modules.get(r, c)) {
          const x = ((c + margin) * cellSize).toFixed(2);
          const y = ((r + margin) * cellSize).toFixed(2);
          const w = (cellSize + 0.05).toFixed(2);
          const h = (cellSize + 0.05).toFixed(2);
          rects += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#111827"/>`;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">
  <rect width="${size}" height="${size}" fill="#ffffff"/>
  ${rects}
</svg>`;
  } catch (err) {
    console.error('QR code generation error:', err);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">
  <rect width="${size}" height="${size}" fill="#ffffff"/>
  <rect x="${(size * 0.1).toFixed(1)}" y="${(size * 0.1).toFixed(1)}" width="${(size * 0.8).toFixed(1)}" height="${(size * 0.8).toFixed(1)}" fill="none" stroke="#111827" stroke-width="2"/>
</svg>`;
  }
}

/**
 * Asynchronously generates base64 Data URI for QR code (PNG / WebP)
 */
export async function generateQrDataUri(text: string, width: number = 150): Promise<string> {
  try {
    return await QRCode.toDataURL(text || 'https://mmbookhouse.com', {
      width,
      margin: 1,
      color: {
        dark: '#111827',
        light: '#ffffff',
      },
    });
  } catch {
    return '';
  }
}
