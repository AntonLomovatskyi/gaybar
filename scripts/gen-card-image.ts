/**
 * Generate art-deco card images for recipes that have no photo (imported set).
 *   pnpm tsx scripts/gen-card-image.ts
 * Builds an on-brand SVG (frame + number badge + glass line-icon + name + tags) -> front.webp.
 * Skips any recipe that already has a front.webp (your real deck photos are untouched).
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const W = 800,
  H = 1182,
  GOLD = "#C9A24B",
  IVORY = "#EDE7D9",
  BG = "#15151A";

const norm = (s: string) => (s || "").toLowerCase().replace(/['’ʼ]/g, "");
const esc = (s: string) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function glassShape(name: string): string {
  const n = norm(name);
  if (/март|коктейльн/.test(n)) return "martini";
  if (/блюдц|купе|сауер/.test(n)) return "coupe";
  if (/рокс/.test(n)) return "rocks";
  if (/хайбол/.test(n)) return "highball";
  if (/колінз|коллінз|слінг/.test(n)) return "collins";
  if (/флюте/.test(n)) return "flute";
  if (/вин/.test(n)) return "wine";
  return "rocks";
}

function glass(shape: string): string {
  const S = `fill="none" stroke="${IVORY}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`;
  switch (shape) {
    case "martini":
      return `<path d="M300,350 L500,350 L400,455 Z" ${S}/><line x1="400" y1="455" x2="400" y2="685" ${S}/><line x1="345" y1="690" x2="455" y2="690" ${S}/>`;
    case "coupe":
      return `<path d="M312,360 Q400,475 488,360" ${S}/><line x1="312" y1="360" x2="488" y2="360" ${S}/><line x1="400" y1="465" x2="400" y2="685" ${S}/><line x1="345" y1="690" x2="455" y2="690" ${S}/>`;
    case "highball":
      return `<path d="M348,330 L452,330 L446,712 L354,712 Z" ${S}/>`;
    case "collins":
      return `<path d="M358,312 L442,312 L438,716 L362,716 Z" ${S}/>`;
    case "flute":
      return `<path d="M376,330 L424,330 L414,558 L386,558 Z" ${S}/><line x1="400" y1="558" x2="400" y2="688" ${S}/><line x1="352" y1="692" x2="448" y2="692" ${S}/>`;
    case "wine":
      return `<path d="M330,345 Q330,525 400,525 Q470,525 470,345" ${S}/><line x1="330" y1="345" x2="470" y2="345" ${S}/><line x1="400" y1="525" x2="400" y2="688" ${S}/><line x1="345" y1="692" x2="455" y2="692" ${S}/>`;
    default:
      return `<path d="M322,418 L478,418 L468,704 L332,704 Z" ${S}/>`; // rocks
  }
}

const cornerMotif = (x: number, y: number, sx: number, sy: number) => {
  const g = `stroke="${GOLD}" stroke-width="2" fill="none"`;
  return `<g transform="translate(${x},${y}) scale(${sx},${sy})"><rect width="34" height="34" ${g}/><rect x="10" y="10" width="34" height="34" ${g}/></g>`;
};

const fitSize = (name: string) => {
  const L = name.length;
  return L <= 8 ? 60 : L <= 12 ? 50 : L <= 17 ? 40 : L <= 22 ? 32 : 26;
};

function cardSvg(name: string, tags: string[], glassName: string, num: number): string {
  const tagline = tags && tags.length ? `- ${tags.join(", ")} -` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect x="34" y="34" width="${W - 68}" height="${H - 68}" rx="26" fill="none" stroke="${GOLD}" stroke-width="2"/>
  <rect x="50" y="50" width="${W - 100}" height="${H - 100}" rx="18" fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.6"/>
  ${cornerMotif(70, 70, 1, 1)}${cornerMotif(730, 70, -1, 1)}${cornerMotif(70, 1112, 1, -1)}${cornerMotif(730, 1112, -1, -1)}
  <circle cx="400" cy="150" r="34" fill="none" stroke="${GOLD}" stroke-width="2"/>
  <text x="400" y="161" font-family="Georgia, serif" font-size="30" fill="${IVORY}" text-anchor="middle">${num}</text>
  ${glass(glassShape(glassName))}
  <text x="400" y="900" font-family="Georgia, 'Times New Roman', serif" font-size="${fitSize(name)}" fill="${IVORY}" text-anchor="middle" letter-spacing="2">${esc(name.toUpperCase())}</text>
  <text x="400" y="952" font-family="Georgia, serif" font-style="italic" font-size="24" fill="${GOLD}" text-anchor="middle">${esc(tagline)}</text>
</svg>`;
}

async function main() {
  const folders = readdirSync(join(ROOT, "recipes")).filter((d) => existsSync(join(ROOT, "recipes", d, "recipe.json")));
  let made = 0;
  for (const d of folders) {
    const dir = join(ROOT, "recipes", d);
    if (existsSync(join(dir, "front.webp"))) continue; // keep real photos
    const c = JSON.parse(readFileSync(join(dir, "recipe.json"), "utf8"));
    const svg = cardSvg(c.name, c.tags || [], c.glass || "", c.cardNumber);
    await sharp(Buffer.from(svg)).webp({ quality: 90 }).toFile(join(dir, "front.webp"));
    if (!c.images) c.images = {};
    c.images.front = "front.webp";
    writeFileSync(join(dir, "recipe.json"), JSON.stringify(c, null, 2) + "\n");
    made++;
  }
  console.log(`✓ generated ${made} card images`);
}

main();
