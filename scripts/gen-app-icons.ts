/**
 * Generate app icon / adaptive icon / splash / favicon (art-deco glass mark).  pnpm gen:icons
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ASSETS = join(ROOT, "assets");
mkdirSync(ASSETS, { recursive: true });

const BG = "#0E0E10";
const GOLD = "#D9B25A";
const IVORY = "#EDE7D9";

// martini glass + deco frame, drawn in a 1024 viewBox
function mark(opts: { bg?: string; frame?: boolean; scale?: number }) {
  const { bg, frame = true, scale = 1 } = opts;
  const S = `fill="none" stroke="${IVORY}" stroke-width="${26 / scale}" stroke-linejoin="round" stroke-linecap="round"`;
  const cx = 512;
  const glass = `
    <g transform="translate(${cx - cx * scale}, ${cx - cx * scale}) scale(${scale})">
      <path d="M332,360 L692,360 L512,548 Z" ${S}/>
      <line x1="512" y1="548" x2="512" y2="760" ${S}/>
      <line x1="404" y1="768" x2="620" y2="768" ${S}/>
      <circle cx="600" cy="372" r="20" fill="${GOLD}" stroke="none"/>
    </g>`;
  const deco = frame
    ? `<rect x="70" y="70" width="884" height="884" rx="120" fill="none" stroke="${GOLD}" stroke-width="14"/>
       <rect x="104" y="104" width="816" height="816" rx="96" fill="none" stroke="${GOLD}" stroke-width="6" opacity="0.6"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${bg ? `<rect width="1024" height="1024" rx="${frame ? 0 : 0}" fill="${bg}"/>` : ""}
    ${deco}
    ${glass}
  </svg>`;
}

async function png(svg: string, size: number, out: string) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(ASSETS, out));
}

async function main() {
  await png(mark({ bg: BG, frame: true, scale: 1 }), 1024, "icon.png");
  await png(mark({ frame: false, scale: 0.66 }), 1024, "adaptive-icon.png"); // transparent, safe-zone inset
  await png(mark({ frame: false, scale: 0.8 }), 512, "splash-icon.png"); // transparent, centered
  await png(mark({ bg: BG, frame: true, scale: 1 }), 96, "favicon.png");
  console.log("✓ wrote assets/{icon,adaptive-icon,splash-icon,favicon}.png");
}

main();
