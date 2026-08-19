/**
 * Flavour swaps between a syrup and the liqueur that tastes like it — with proportions.
 *
 * A fruit liqueur is roughly twice as sweet per ml as a bar syrup is... the other way round:
 * a syrup carries about twice the sugar of a liqueur, and no alcohol. So swapping is two
 * corrections, not one:
 *   1. SWEETNESS — use half the volume of syrup for a given volume of liqueur.
 *   2. STRENGTH  — put back the alcohol the liqueur was carrying, as neutral spirit.
 * e.g. 30 мл Мідорі ≈ 15 мл динного сиропу + ~18 мл горілки (same volume, same sugar, same ABV).
 */
import type { Ingredient } from "@/types/cocktail";
import { abvOf, canonicalById, canonicalIdOf } from "@/data/catalog/ingredients";

/** A syrup carries ~2x the sugar of a liqueur, so half the volume matches the sweetness. */
const SWEETNESS_RATIO = 2;
/** Neutral spirit used to put the missing alcohol back. */
const NEUTRAL_ABV = 40;
/** Preferred neutral spirits, best first — we use whichever you actually own. */
const NEUTRALS = ["Горілка", "Білий ром", "Сухий джин", "Срібна текіла"];

/** Syrup ⇄ liqueur pairs that genuinely taste of the same thing. */
const PAIRS: { syrup: string; liqueur: string }[] = [
  { syrup: "melon-syrup", liqueur: "melon-liqueur" },
  { syrup: "raspberry-syrup", liqueur: "raspberry-liqueur" },
  { syrup: "strawberry-syrup", liqueur: "strawberry-liqueur" },
  { syrup: "banana-syrup", liqueur: "banana-liqueur" },
  { syrup: "orgeat-syrup", liqueur: "amaretto" },
  { syrup: "pistachio-orgeat", liqueur: "amaretto" },
  { syrup: "coconut-syrup", liqueur: "coconut-liqueur" },
  { syrup: "elderflower-syrup", liqueur: "elderflower-liqueur" },
  { syrup: "green-apple-syrup", liqueur: "apple-schnapps" },
  { syrup: "lychee-syrup", liqueur: "lychee-liqueur" },
];

const SYRUP_FOR_LIQUEUR = new Map(PAIRS.map((p) => [p.liqueur, p.syrup]));
const LIQUEUR_FOR_SYRUP = new Map(PAIRS.map((p) => [p.syrup, p.liqueur]));

const nameOf = (id: string) => canonicalById(id)?.nameUk ?? id;

export interface SwapPart {
  name: string;
  amount?: number;
  unit?: "мл";
}
export interface FlavourSwap {
  /** What the recipe asked for. */
  needName: string;
  /** Direction of the swap, for wording in the UI. */
  kind: "syrup-for-liqueur" | "liqueur-for-syrup";
  /** What to pour instead, in order. */
  parts: SwapPart[];
  note?: string;
}

/** Pick the neutral spirit to rebuild strength with — one you own, else vodka. */
function neutralFrom(owned: string[]): string {
  const ownedIds = new Set(owned.map(canonicalIdOf));
  for (const n of NEUTRALS) if (ownedIds.has(canonicalIdOf(n))) return n;
  return "Горілка";
}

/**
 * If the recipe wants something you don't have but you own its flavour twin, work out the pour.
 * Returns undefined when there's no pairing or you don't own the counterpart.
 */
export function flavourSwapFor(required: Ingredient, owned: string[]): FlavourSwap | undefined {
  const needId = canonicalIdOf(required.name);
  const ownedIds = new Set(owned.map(canonicalIdOf));
  if (ownedIds.has(needId)) return undefined; // you already have the real thing

  const ml = required.unit === "мл" ? required.amount : undefined;

  // Recipe wants a liqueur → you own the matching syrup.
  const syrupId = SYRUP_FOR_LIQUEUR.get(needId);
  if (syrupId && ownedIds.has(syrupId)) {
    const parts: SwapPart[] = [];
    if (ml) {
      const syrupMl = Math.max(5, Math.round(ml / SWEETNESS_RATIO));
      const spiritMl = Math.round((ml * (abvOf(required.name) || 24)) / NEUTRAL_ABV);
      parts.push({ name: nameOf(syrupId), amount: syrupMl, unit: "мл" });
      if (spiritMl >= 5) parts.push({ name: neutralFrom(owned), amount: spiritMl, unit: "мл" });
    } else {
      parts.push({ name: nameOf(syrupId) });
    }
    return {
      needName: required.name,
      kind: "syrup-for-liqueur",
      parts,
      note: ml ? "сироп удвічі солодший — тому вдвічі менше, а міцність повертає нейтральний алкоголь" : undefined,
    };
  }

  // Recipe wants a syrup → you own the matching liqueur.
  const liqId = LIQUEUR_FOR_SYRUP.get(needId);
  if (liqId && ownedIds.has(liqId)) {
    const parts: SwapPart[] = ml
      ? [{ name: nameOf(liqId), amount: Math.round(ml * SWEETNESS_RATIO), unit: "мл" }]
      : [{ name: nameOf(liqId) }];
    return {
      needName: required.name,
      kind: "liqueur-for-syrup",
      parts,
      note: ml ? "лікер менш солодкий — тому вдвічі більше; коктейль стане трохи міцнішим" : undefined,
    };
  }

  return undefined;
}

/** One-line rendering: "15 мл Динний сироп + 18 мл Горілка". */
export function formatSwap(swap: FlavourSwap): string {
  return swap.parts.map((p) => (p.amount ? `${p.amount} ${p.unit} ${p.name}` : p.name)).join(" + ");
}
