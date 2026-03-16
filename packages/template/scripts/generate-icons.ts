/**
 * Generate PWA icons for {{PROJECT_NAME_TITLE}}
 * Produces: icon-192.png, icon-512.png, icon-512-maskable.png, apple-touch-icon.png
 * Run: npm run generate-icons
 */

import { createCanvas } from "canvas";
import * as fs from "fs";
import * as path from "path";

const PRIMARY = "#1B5E4F";
const WHITE = "#FFFFFF";
// Use first 2 chars of project name as initials
const INITIALS = "{{PROJECT_INITIALS}}";

function drawIcon(size: number, maskable: boolean, bgColor: string = PRIMARY): Buffer {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  const safeZone = maskable ? size * 0.8 : size;
  const offset = maskable ? (size - safeZone) / 2 : 0;

  ctx.fillStyle = bgColor;
  if (maskable) {
    ctx.fillRect(0, 0, size, size);
  } else {
    const radius = size * 0.2;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();
  }

  const fontSize = safeZone * (INITIALS.length > 1 ? 0.36 : 0.52);
  ctx.fillStyle = WHITE;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillText(INITIALS, size / 2, size / 2 + offset * 0.1);

  return canvas.toBuffer("image/png");
}

const iconsDir = path.join(__dirname, "../public/icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const icons = [
  { name: "icon-192.png", size: 192, maskable: false },
  { name: "icon-512.png", size: 512, maskable: false },
  { name: "icon-512-maskable.png", size: 512, maskable: true },
  { name: "apple-touch-icon.png", size: 180, maskable: false },
];

for (const icon of icons) {
  const buf = drawIcon(icon.size, icon.maskable);
  fs.writeFileSync(path.join(iconsDir, icon.name), buf);
  console.log(`✓ ${icon.name}`);
}

// favicon (32px)
const faviconBuf = drawIcon(32, false);
fs.writeFileSync(path.join(iconsDir, "favicon-32.png"), faviconBuf);
console.log("✓ favicon-32.png");

fs.copyFileSync(
  path.join(iconsDir, "favicon-32.png"),
  path.join(__dirname, "../public/favicon.ico")
);
console.log("✓ favicon.ico");

console.log("\nAll icons generated in public/icons/");
