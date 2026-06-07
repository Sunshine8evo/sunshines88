import fs from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");

const TARGETS = [
  path.join(ROOT, "public", "assets", "sunshine-logo.png"),
  path.join(ROOT, "public", "sunshine-logo.png"),
];

function bgAlpha(r, g, b) {
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  const chroma = max - min;

  if (min >= 246) return 0;
  if (min >= 228 && chroma < 28) {
    const t = (min - 228) / (246 - 228);
    return Math.round(255 * (1 - t));
  }
  return 255;
}

async function removeWhiteBg(filePath) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    data[i + 3] = bgAlpha(r, g, b);
  }

  const tmp = `${filePath}.tmp`;
  await sharp(data, { raw: { width, height, channels } }).png().toFile(tmp);
  fs.renameSync(tmp, filePath);
  console.log(`Transparent background: ${filePath}`);
}

for (const target of TARGETS) {
  if (!fs.existsSync(target)) {
    console.warn(`Skip missing: ${target}`);
    continue;
  }
  await removeWhiteBg(target);
}
