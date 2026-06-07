import fs from "fs";
import sharp from "sharp";

const sunshineLogoSVG = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="256" cy="256" r="256" fill="#fdf5fb"/>
  <circle cx="300" cy="200" r="130" fill="rgba(253,230,138,0.4)"/>
  <circle cx="300" cy="200" r="110" fill="#fde68a"/>
  <circle cx="300" cy="200" r="92" fill="#fde68a" stroke="#f5c842" stroke-width="6"/>
  <line x1="300" y1="60" x2="294" y2="88" stroke="#f5a623" stroke-width="10" stroke-linecap="round"/>
  <line x1="400" y1="96" x2="382" y2="116" stroke="#f5a623" stroke-width="10" stroke-linecap="round"/>
  <line x1="442" y1="196" x2="414" y2="200" stroke="#f5a623" stroke-width="10" stroke-linecap="round"/>
  <line x1="400" y1="302" x2="382" y2="282" stroke="#f5a623" stroke-width="10" stroke-linecap="round"/>
  <line x1="300" y1="340" x2="294" y2="312" stroke="#f5a623" stroke-width="10" stroke-linecap="round"/>
  <line x1="200" y1="302" x2="218" y2="282" stroke="#f5a623" stroke-width="10" stroke-linecap="round"/>
  <text x="80" y="400" font-family="Georgia, serif" font-size="320" font-weight="700" font-style="italic" fill="#2d1a2e" opacity="0.9">S</text>
</svg>`;

const svgBuffer = Buffer.from(sunshineLogoSVG);

async function generateFavicons() {
  if (!fs.existsSync("./public")) {
    fs.mkdirSync("./public");
  }

  await sharp(svgBuffer).resize(32, 32).png().toFile("./public/favicon-32.png");
  await sharp(svgBuffer).resize(16, 16).png().toFile("./public/favicon-16.png");
  await sharp(svgBuffer).resize(192, 192).png().toFile("./public/favicon-192.png");
  await sharp(svgBuffer).resize(512, 512).png().toFile("./public/favicon-512.png");
  await sharp(svgBuffer).resize(180, 180).png().toFile("./public/apple-touch-icon.png");
  await sharp(svgBuffer)
    .resize(1200, 630, { fit: "contain", background: "#fdf5fb" })
    .png()
    .toFile("./public/og-image.png");

  fs.copyFileSync("./public/favicon-32.png", "./src/app/icon.png");

  console.log("All favicon files generated in /public");
}

generateFavicons().catch((err) => {
  console.error(err);
  process.exit(1);
});
