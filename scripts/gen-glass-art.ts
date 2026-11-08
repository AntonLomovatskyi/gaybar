/**
 * Card art for recipes without a photo: the drink's own glass, filled with colour bands in the
 * proportions of its ingredients, on a transparent background (same look as public/art).
 *
 *   pnpm tsx scripts/gen-glass-art.ts <data module> <export name> <out dir> [--force]
 *   e.g. pnpm tsx scripts/gen-glass-art.ts src/data/generated/barflyCocktails.ts barflyCocktails public/barfly
 *
 * Skips images that already exist unless --force. Writes <out dir>/<id>.webp (320×448).
 */
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { canonicalIdOf, categoryOf, familyOf } from "@/data/catalog/ingredients";
import { glassOf } from "@/domain/cocktails";
import { normalize } from "@/domain/text";
import type { Cocktail } from "@/types/cocktail";

const W = 320;
const H = 448;
const RIM = "#F1EEE2";

/** Colour by canonical ingredient id. */
const BY_ID: Record<string, string> = {
  "lemon-juice": "#F2E79B",
  "lime-juice": "#D8E89A",
  "orange-juice": "#F5A33A",
  "pineapple-juice": "#F2D24B",
  "grapefruit-juice": "#F4A49C",
  "cranberry-juice": "#B3163C",
  "tomato-juice": "#C8321E",
  "apple-juice": "#E8C46C",
  "passion-fruit-syrup": "#E9A23B",
  grenadine: "#B3172F",
  "raspberry-syrup": "#C2185B",
  "orgeat-syrup": "#EFE6D2",
  "honey-syrup": "#E3A82B",
  honey: "#E3A82B",
  "demerara-syrup": "#C98A3C",
  "simple-syrup": "#F3EFDF",
  falernum: "#E9D9A8",
  "coffee-liqueur": "#3B2318",
  espresso: "#2B1A10",
  coffee: "#2B1A10",
  "cold-brew": "#2B1A10",
  campari: "#C8102E",
  aperol: "#F0642C",
  "green-chartreuse": "#9DBF3C",
  "yellow-chartreuse": "#E6D24A",
  amaretto: "#A0522D",
  "creme-de-cacao": "#5C3A21",
  "white-creme-de-cacao": "#EFE9DD",
  "blue-curacao": "#1E88E5",
  "elderflower-liqueur": "#F1EBC0",
  "banana-liqueur": "#F3E26B",
  galliano: "#F2D21B",
  absinthe: "#A8C66C",
  "sweet-red-vermouth": "#7B1E1E",
  "dry-vermouth": "#EEF0D8",
  cream: "#F7F1E3",
  "heavy-cream": "#F7F1E3",
  "whipped-cream": "#FFFDF6",
  milk: "#F7F3EA",
  "coconut-cream": "#F5EFE0",
  "cream-of-coconut": "#F5EFE0",
  cola: "#3A1F12",
  "ginger-beer": "#E8D9A8",
  "soda-water": "#E3EEF1",
  tonic: "#E3EEF1",
  "irish-cream": "#D9C3A0",
};

/** Colour by spirit family. */
const BY_FAMILY: Record<string, string> = {
  gin: "#D6E4EA",
  vodka: "#D6E4EA",
  tequila: "#E4E6CF",
  mezcal: "#E8E0C8",
  pisco: "#E4E8E0",
  rum: "#C27A2C",
  whisky: "#B8651B",
  brandy: "#A8541A",
  vermouth: "#8E2A23",
  wine: "#8E1B2B",
  sparkling: "#F3E3A0",
  amaro: "#6B2E1A",
  "red-bitter-aperitif": "#C8102E",
  "orange-liqueur": "#E8EEF0",
  "coffee-liqueur": "#3B2318",
  "cherry-liqueur": "#7A1028",
  "cacao-liqueur": "#5C3A21",
  "berry-liqueur": "#6A1B4D",
  "stone-fruit-liqueur": "#E59A5B",
  "anise-liqueur": "#EDEBD8",
  "creme-de-menthe": "#4CAF50",
  "monastic-herbal-liqueur": "#D4A23A",
  absinthe: "#A8C66C",
};

/** Colour by catalog category (last resort). */
const BY_CATEGORY: Record<string, string> = {
  juice: "#F2C14E",
  syrup: "#E9C46A",
  spirit: "#D6E4EA",
  liqueur: "#C77D3A",
  wine: "#8E1B2B",
  beer: "#E0A63A",
  dairy: "#F5F0E6",
  egg: "#F8F6EE",
  mixer: "#E3EEF1",
  fruit: "#E76F51",
  bitters: "#7A1F1F",
};

function colourOf(name: string): string {
  const n = normalize(name);
  // Names the catalog groups broadly but that read clearly by colour.
  if (/темн\w* ром|чорн\w* ром|ямайськ/.test(n)) return "#6B3A1E";
  if (/білий ром|срібн|бланко/.test(n)) return "#E4E6CF";
  const id = canonicalIdOf(name);
  if (BY_ID[id]) return BY_ID[id];
  const fam = familyOf(name);
  if (fam && BY_FAMILY[fam]) return BY_FAMILY[fam];
  return BY_CATEGORY[categoryOf(name) ?? ""] ?? "#D9CBB0";
}

const isFoam = (name: string) => /білок|аквафаб|збиті вершки|піна/.test(normalize(name));

interface Band {
  colour: string;
  ml: number;
}

function bandsOf(c: Cocktail): { bands: Band[]; foam: boolean } {
  const bands: Band[] = [];
  let foam = false;
  for (const i of c.ingredients) {
    const n = normalize(i.name);
    if (n.includes("лід")) continue;
    if (isFoam(i.name)) {
      foam = true;
      continue;
    }
    if (i.unit !== "мл" || !i.amount || i.amount < 4) continue; // dashes and garnish don't show
    bands.push({ colour: colourOf(i.name), ml: i.amount });
  }
  if (!bands.length) bands.push({ colour: "#D9CBB0", ml: 1 });
  return { bands, foam };
}

/** Interior path (the liquid's clip), the rim outline and the liquid's vertical span. */
interface Glass {
  inner: string;
  outline: string;
  top: number;
  bottom: number;
}

const stemFoot = (from: number) => `M160,${from} L160,352 M118,356 L202,356`;

const GLASSES: Record<string, Glass> = {
  "glass-coupe": {
    inner: "M88,124 L232,124 Q228,222 160,226 Q92,222 88,124 Z",
    outline: `M80,116 L240,116 Q236,232 160,234 Q84,232 80,116 Z ${stemFoot(234)}`,
    top: 132,
    bottom: 226,
  },
  "glass-martini": {
    inner: "M82,118 L238,118 L160,226 Z",
    outline: `M70,110 L250,110 L160,234 Z ${stemFoot(234)}`,
    top: 128,
    bottom: 226,
  },
  "glass-flute": {
    inner: "M138,86 L182,86 L176,250 Q160,262 144,250 Z",
    outline: `M130,78 L190,78 L183,256 Q160,272 137,256 Z ${stemFoot(266)}`,
    top: 100,
    bottom: 258,
  },
  "glass-wine": {
    inner: "M110,124 L210,124 Q214,250 160,252 Q106,250 110,124 Z",
    outline: `M102,116 L218,116 Q224,260 160,262 Q96,260 102,116 Z ${stemFoot(262)}`,
    top: 160,
    bottom: 252,
  },
  "glass-collins": {
    inner: "M122,88 L198,88 L194,322 Q160,336 126,322 Z",
    outline: "M114,80 L206,80 L202,328 Q160,346 118,328 Z",
    top: 96,
    bottom: 334,
  },
  "glass-highball": {
    inner: "M110,126 L210,126 L205,322 Q160,336 115,322 Z",
    outline: "M102,118 L218,118 L213,328 Q160,346 107,328 Z",
    top: 136,
    bottom: 334,
  },
  "glass-sling": {
    inner: "M118,86 L202,86 L184,300 Q160,312 136,300 Z",
    outline: `M110,78 L210,78 L191,306 Q160,322 129,306 Z M160,318 L160,342 M120,346 L200,346`,
    top: 98,
    bottom: 310,
  },
  "glass-rocks": {
    inner: "M100,196 L220,196 L214,322 Q160,334 106,322 Z",
    outline: "M92,188 L228,188 L222,328 Q160,344 98,328 Z",
    top: 210,
    bottom: 332,
  },
  "glass-shot": {
    inner: "M128,236 L192,236 L186,324 Q160,332 134,324 Z",
    outline: "M120,228 L200,228 L193,330 Q160,342 127,330 Z",
    top: 244,
    bottom: 330,
  },
  "glass-hurricane": {
    inner: "M118,90 Q100,150 134,200 Q120,260 128,318 Q160,330 192,318 Q200,260 186,200 Q220,150 202,90 Z",
    outline:
      "M110,82 Q90,150 126,200 Q110,262 120,324 Q160,342 200,324 Q210,262 194,200 Q230,150 210,82 Z M160,336 L160,350 M118,354 L202,354",
    top: 104,
    bottom: 326,
  },
  "glass-mug": {
    inner: "M112,170 L208,170 L208,316 Q208,330 194,330 L126,330 Q112,330 112,316 Z",
    outline:
      "M104,162 L216,162 L216,318 Q216,338 196,338 L124,338 Q104,338 104,318 Z M216,196 Q262,196 262,240 Q262,284 216,284",
    top: 186,
    bottom: 330,
  },
  "glass-julep": {
    inner: "M108,170 L212,170 L200,326 L120,326 Z",
    outline: "M100,162 L220,162 L207,334 L113,334 Z M106,200 L214,200",
    top: 182,
    bottom: 326,
  },
  "glass-tiki": {
    inner: "M112,120 Q104,220 116,322 Q160,334 204,322 Q216,220 208,120 Z",
    outline: "M104,112 Q94,220 108,328 Q160,346 212,328 Q226,220 216,112 Z",
    top: 132,
    bottom: 330,
  },
};

function svgFor(c: Cocktail): string {
  const g = GLASSES[glassOf(c)?.id ?? ""] ?? GLASSES["glass-rocks"];
  const { bands, foam } = bandsOf(c);
  const span = g.bottom - g.top;
  const foamH = foam ? Math.round(span * 0.12) : 0;
  const liquid = span - foamH;
  const total = bands.reduce((s, b) => s + b.ml, 0);
  // Every band gets at least 7% so a 15 ml syrup still shows next to 120 ml of soda.
  const min = 0.07;
  const raw = bands.map((b) => Math.max(min, b.ml / total));
  const scale = raw.reduce((s, x) => s + x, 0);
  let y = g.bottom;
  const rects: string[] = [];
  bands.forEach((b, i) => {
    const h = (raw[i] / scale) * liquid;
    rects.push(
      `<rect x="0" y="${(y - h).toFixed(1)}" width="${W}" height="${(h + 0.6).toFixed(1)}" fill="${b.colour}" fill-opacity="0.95"/>`,
    );
    y -= h;
  });
  if (foam) rects.push(`<rect x="0" y="${g.top}" width="${W}" height="${foamH + 0.6}" fill="#FBF8EF"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs><clipPath id="in"><path d="${g.inner}"/></clipPath></defs>
  <g clip-path="url(#in)">${rects.join("")}</g>
  <path d="${g.outline}" fill="none" stroke="${RIM}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round" stroke-opacity="0.95"/>
</svg>`;
}

async function main() {
  const [modPath, exportName, outDir] = process.argv.slice(2);
  const force = process.argv.includes("--force");
  if (!modPath || !exportName || !outDir) {
    console.error("usage: tsx scripts/gen-glass-art.ts <module> <export> <out dir> [--force]");
    process.exit(1);
  }
  const mod = (await import(pathToFileURL(resolve(modPath)).href)) as Record<string, Cocktail[]>;
  const list = mod[exportName];
  if (!Array.isArray(list)) throw new Error(`${exportName} is not exported from ${modPath}`);
  mkdirSync(outDir, { recursive: true });
  let made = 0;
  for (const c of list) {
    const file = join(outDir, `${c.id}.webp`);
    if (!force && existsSync(file)) continue;
    await sharp(Buffer.from(svgFor(c)))
      .webp({ quality: 82, alphaQuality: 90 })
      .toFile(file);
    made++;
  }
  console.log(`✓ ${made} images → ${outDir} (${list.length} recipes)`);
}

main();
