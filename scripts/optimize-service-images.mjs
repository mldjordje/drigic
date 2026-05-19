import sharp from "sharp";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const SRC_DIR = "C:/Users/PC/Desktop/Projekti/Projekti/drigic/igic services";
const OUT_DIR = "./public/assets/img/services";

const IMAGES = [
  { src: "Hijaluronski fileri.tiff", slug: "hijaluronski-fileri" },
  { src: "botox.jpeg", slug: "botox" },
  { src: "Skinbusteri.tiff", slug: "skinbusteri" },
  { src: "Skinbusteri2.tiff", slug: "skinbusteri-2" },
  { src: "mezoterapija.tiff", slug: "mezoterapija" },
  { src: "Juvelook i Lenisna.jpeg", slug: "polinukleotidi-i-egzozomi" },
];

// Two output sizes per image
const VARIANTS = [
  { suffix: "", width: 1600, height: 900, quality: 82 },   // hero / full-width
  { suffix: "-card", width: 740, height: 500, quality: 80 }, // card thumbnail
];

if (!existsSync(OUT_DIR)) {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Created ${OUT_DIR}`);
}

for (const { src, slug } of IMAGES) {
  const srcPath = path.join(SRC_DIR, src);
  console.log(`\nProcessing: ${src}`);

  for (const { suffix, width, height, quality } of VARIANTS) {
    const outPath = path.join(OUT_DIR, `${slug}${suffix}.webp`);
    try {
      const info = await sharp(srcPath)
        .rotate()               // honour EXIF orientation
        .resize(width, height, { fit: "cover", position: "centre" })
        .webp({ quality })
        .toFile(outPath);

      const sizekb = Math.round(info.size / 1024);
      console.log(`  ✓ ${slug}${suffix}.webp  ${width}×${height}  ${sizekb} KB`);
    } catch (err) {
      console.error(`  ✗ ${slug}${suffix}: ${err.message}`);
    }
  }
}

console.log("\nDone.");
