/**
 * Ingredient families for flexible substitution: a generic you own (e.g. "ром") should
 * satisfy a recipe that asks for a specific variant ("білий ром"), and vice-versa.
 *
 * This is a HEURISTIC stand-in (keyword → family) until the curated canonical dictionary
 * (I draft, you review) carries exact family ids. `resolveFamily()` is the single seam the
 * matcher uses, so swapping the heuristic for the dictionary won't touch callers.
 */
import { normalize } from "@/domain/text";

// familyId -> keywords (normalized, lowercase, apostrophes stripped) found within the name
const BASE_FAMILIES: Record<string, string[]> = {
  rum: ["ром"],
  tequila: ["текіла", "текила"],
  gin: ["джин"],
  whisky: ["віскі", "виски", "бурбон", "скотч"],
  vodka: ["горілка"],
  brandy: ["коньяк", "бренді", "кальвадос"],
  pisco: ["піско", "писко"],
  mezcal: ["мескаль"],
  vermouth: ["вермут"],
  sparkling: ["просекко", "ігрист", "шампанськ"], // sparkling wine variants
  wine: ["вино", "херес", "портвейн"],
  absinthe: ["абсент"],
};

/**
 * Returns a family id for spirits/wines where substitution is meaningful, else the
 * normalized name itself (so non-spirit ingredients only match their own kind).
 */
export function resolveFamily(name: string): string {
  const n = normalize(name);
  for (const [family, keys] of Object.entries(BASE_FAMILIES)) {
    if (keys.some((k) => n.includes(k))) return family;
  }
  return n;
}
