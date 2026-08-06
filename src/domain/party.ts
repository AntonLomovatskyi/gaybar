/**
 * Party planning — pure logic. Compose a set of N varieties for a number of people, preferring
 * cocktails you can make from your bar, with even servings.
 */
import type { Cocktail, CocktailTag } from "@/types/cocktail";
import { estimateStrength, recommendByMood, similarCocktails } from "./cocktails";
import { whatCanIMake } from "./inventory";

/** What kind of drinks a party set is built from. */
export type PartyKind = "any" | "shots" | "cocktails" | "venue";

export interface PartyConfig {
  people: number;
  varieties: number; // number of different cocktails
  drinksPerPerson: number;
  useMyBar: boolean; // prefer cocktails makeable from the ingredients you already own
  everyoneTries: boolean; // make enough of EACH variety for everyone to try it
  kind: PartyKind; // restrict the pool: only shots, only long drinks, only the bar menu…
  byStrength: boolean; // order the plan from lightest to strongest
}

const isShot = (c: Cocktail) => c.tags.includes("шоти") || c.glass === "Чарка";

/** Narrow the candidate pool to the requested kind of drink. */
export function filterKind(pool: Cocktail[], kind: PartyKind): Cocktail[] {
  switch (kind) {
    case "shots":
      return pool.filter(isShot);
    case "cocktails":
      return pool.filter((c) => !isShot(c));
    case "venue":
      return pool.filter((c) => c.tags.includes("Шоти Там"));
    default:
      return pool;
  }
}

/** Lightest first — a tasting order that ramps up instead of starting at 40%. */
export function sortByStrength(items: PartyItem[]): PartyItem[] {
  return [...items].sort((a, b) => estimateStrength(a.cocktail).abv - estimateStrength(b.cocktail).abv);
}

/**
 * Swap one pick for a similar drink that isn't already in the set (same flavour/base family).
 * Falls back to the same kind of drink when nothing similar is free.
 */
export function replaceWithSimilar(
  items: PartyItem[],
  id: string,
  pool: Cocktail[],
  kind: PartyKind,
  seed: number,
  opts: { onlyMakeable?: boolean; owned?: string[]; flexible?: boolean } = {},
): PartyItem[] {
  const idx = items.findIndex((i) => i.cocktail.id === id);
  if (idx === -1) return items;
  const used = new Set(items.map((i) => i.cocktail.id));
  let candidates = filterKind(pool, kind);
  // Honour "from my bar": a swap must never bring in something you can't make.
  if (opts.onlyMakeable) {
    const makeable = new Set(
      whatCanIMake(candidates, opts.owned ?? [], opts.flexible ?? true).makeable.map((m) => m.cocktail.id),
    );
    candidates = candidates.filter((c) => makeable.has(c.id));
  }
  const similar = similarCocktails(items[idx].cocktail, candidates, 40).filter((c) => !used.has(c.id));
  const fallback = candidates.filter((c) => !used.has(c.id));
  const from = similar.length ? similar : fallback;
  if (!from.length) return items;
  const pick = from[Math.abs(Math.floor(seed)) % from.length];
  const next = [...items];
  next[idx] = { cocktail: pick, servings: items[idx].servings };
  return next;
}

export interface PartyItem {
  cocktail: Cocktail;
  servings: number;
}

export const MIN_PEOPLE = 2; // a set is for company — at least 2 people
export const DEFAULT_PARTY_CONFIG: PartyConfig = {
  people: 2,
  varieties: 3,
  drinksPerPerson: 2,
  useMyBar: false,
  everyoneTries: true,
  kind: "any",
  byStrength: true,
};

/** Spread `total` servings across the picks as evenly as possible (min 1 each). */
export function distributeServings(picks: Cocktail[], total: number): PartyItem[] {
  const n = picks.length || 1;
  const base = Math.floor(total / n);
  const rem = total - base * n;
  return picks.map((c, i) => ({ cocktail: c, servings: Math.max(1, base + (i < rem ? 1 : 0)) }));
}

/**
 * Servings per pick. With `everyoneTries`, make `people` of EACH variety (min 2) so everyone
 * can taste every cocktail; otherwise spread people×drinksPerPerson evenly across the picks.
 */
function planServings(picks: Cocktail[], config: PartyConfig): PartyItem[] {
  if (config.everyoneTries) {
    const per = Math.max(config.people, MIN_PEOPLE);
    return picks.map((c) => ({ cocktail: c, servings: per }));
  }
  return distributeServings(picks, Math.max(picks.length, config.people * config.drinksPerPerson));
}

/** Auto-compose a party from the pool: optional mood, bar filtering, even servings. */
export function composeParty(
  pool: Cocktail[],
  config: PartyConfig,
  moodTags: CocktailTag[] = [],
  owned: string[] = [],
  flexible = true,
): PartyItem[] {
  const kindPool = filterKind(pool, config.kind);
  const base = kindPool.length ? kindPool : pool;
  const candidates = moodTags.length ? recommendByMood(base, moodTags) : [...base];
  let chosen = candidates.length >= config.varieties ? candidates : [...base];
  if (config.useMyBar) {
    // Strict: only drinks you can actually make right now. If that yields fewer than the
    // requested varieties we return a SHORTER set — never pad it with ones you can't make.
    const makeable = new Set(whatCanIMake(chosen, owned, flexible).makeable.map((m) => m.cocktail.id));
    chosen = chosen.filter((c) => makeable.has(c.id));
  } else if (owned.length) {
    // Soft preference: makeable first, the rest after.
    const makeable = new Set(whatCanIMake(chosen, owned, flexible).makeable.map((m) => m.cocktail.id));
    chosen = [...chosen.filter((c) => makeable.has(c.id)), ...chosen.filter((c) => !makeable.has(c.id))];
  }
  const picks = chosen.slice(0, Math.max(1, config.varieties));
  const items = planServings(picks, config);
  return config.byStrength ? sortByStrength(items) : items;
}

/** Build a plan from an explicit set of cocktails, scaled to the party size. */
export function planFromSet(cocktails: Cocktail[], config: PartyConfig): PartyItem[] {
  const items = planServings(cocktails, config);
  return config.byStrength ? sortByStrength(items) : items;
}
