/**
 * Generates the printable Google review QR code for Dr Igić Clinic.
 *
 *   npm i -D qrcode --no-save && npm run qr:google
 *
 * `qrcode` is intentionally not a tracked dependency: the generated assets are
 * committed, so it is only needed when the QR has to be regenerated.
 *
 * Output: public/assets/qr/google-review-qr.svg (vector, for print)
 *         public/assets/qr/google-review-qr.png (2x raster)
 *
 * Design notes:
 * - modules are plain squares on an integer pixel grid; rounded/gapped "dots"
 *   look nicer but fail strict decoders (verified with jsQR and ZXing).
 * - error correction level H so the centered Google logo knockout stays safe.
 */
import fs from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import sharp from "sharp";

const PLACE_ID = "ChIJ6491w7WxVUcR_0VL_FC5jOg";
const REVIEW_URL = `https://search.google.com/local/writereview?placeid=${PLACE_ID}`;

const OUT_DIR = path.join(process.cwd(), "public", "assets", "qr");
const INK = "#101418";

const qr = QRCode.create(REVIEW_URL, { errorCorrectionLevel: "H" });
const size = qr.modules.size;
const data = qr.modules.data;

const cell = 20; // integer px per module keeps the pixel grid aligned
const QR_PX = size * cell;
const PAD = cell * 5; // quiet zone
const W = QR_PX + PAD * 2;
const H = W + 190;

const logoModules = Math.round(size * 0.22);
const logoStart = Math.floor((size - logoModules) / 2);
const logoEnd = logoStart + logoModules;

let modules = "";
for (let r = 0; r < size; r++) {
  for (let c = 0; c < size; c++) {
    if (!data[r * size + c]) continue;
    if (r >= logoStart && r < logoEnd && c >= logoStart && c < logoEnd) continue;
    modules += `<rect x="${PAD + c * cell}" y="${PAD + r * cell}" width="${cell}" height="${cell}"/>`;
  }
}

const logoR = (logoModules * cell) / 2 - cell * 0.35;
const cx = PAD + QR_PX / 2;
const cy = PAD + QR_PX / 2;
const gScale = (logoR * 1.5) / 48;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="QR kod za Google recenziju — Dr Igić Clinic">
  <rect width="${W}" height="${H}" rx="56" fill="#ffffff"/>
  <g fill="${INK}">${modules}</g>
  <circle cx="${cx}" cy="${cy}" r="${logoR.toFixed(2)}" fill="#ffffff"/>
  <g transform="translate(${(cx - (48 * gScale) / 2).toFixed(2)} ${(cy - (48 * gScale) / 2).toFixed(2)}) scale(${gScale.toFixed(4)})">
    <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
    <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
    <path fill="#FBBC05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/>
    <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
  </g>
  <text x="${W / 2}" y="${H - 66}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="62" letter-spacing="2" fill="${INK}">Dr Igić Clinic</text>
</svg>
`;

fs.mkdirSync(OUT_DIR, { recursive: true });
const svgPath = path.join(OUT_DIR, "google-review-qr.svg");
fs.writeFileSync(svgPath, svg, "utf8");

const pngPath = path.join(OUT_DIR, "google-review-qr.png");
const info = await sharp(Buffer.from(svg), { density: 144 }).png().toFile(pngPath);

console.log(`QR modules: ${size}x${size}`);
console.log(`wrote ${svgPath}`);
console.log(`wrote ${pngPath} (${info.width}x${info.height})`);
