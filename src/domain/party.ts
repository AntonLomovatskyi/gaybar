/**
 * Party planning — pure logic. Compose a set of N varieties for a number of people, preferring
 * cocktails you can make from your bar, with even servings.
 */
import type { Cocktail, CocktailTag } from "@/types/cocktail";
import {
  estimateStrength,
  filterTasted,
  isShot,
  recommendByMood,
  similarCocktails,
  usesIngredient,
  type TastedFilter,
} from "./cocktails";
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
  /** Tasting: only drinks you haven't tried yet, or only ones you have. Default "all". */
  tasted?: TastedFilter;
  /** Canonical ingredient ids that at least one drink in the set must use. */
  mustUse?: string[];
}

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

export interface SwapOptions {
  onlyMakeable?: boolean;
  owned?: string[];
  flexible?: boolean;
  tasted?: TastedFilter;
  triedIds?: ReadonlySet<string>;
  /** Must-use products: a swap never drops the last drink carrying one of them. */
  mustUse?: string[];
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
  opts: SwapOptions = {},
): PartyItem[] {
  const idx = items.findIndex((i) => i.cocktail.id === id);
  if (idx === -1) return items;
  const used = new Set(items.map((i) => i.cocktail.id));
  let candidates = filterTasted(filterKind(pool, kind), opts.tasted ?? "all", opts.triedIds ?? new Set());
  // Honour "from my bar": a swap must never bring in something you can't make.
  if (opts.onlyMakeable) {
    const makeable = new Set(
      whatCanIMake(candidates, opts.owned ?? [], opts.flexible ?? true).makeable.map((m) => m.cocktail.id),
    );
    candidates = candidates.filter((c) => makeable.has(c.id));
  }
  // If this drink is the only one carrying a must-use product, its replacement has to carry it too.
  const current = items[idx].cocktail;
  const others = items.filter((_, i) => i !== idx).map((i) => i.cocktail);
  const carried = (opts.mustUse ?? []).filter(
    (p) => usesIngredient(current, p) && !others.some((o) => usesIngredient(o, p)),
  );
  if (carried.length) candidates = candidates.filter((c) => carried.every((p) => usesIngredient(c, p)));
  const similar = similarCocktails(current, candidates, 40).filter((c) => !used.has(c.id));
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
  tasted: "all",
  mustUse: [],
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

export interface ComposeOptions {
  moodTags?: CocktailTag[];
  owned?: string[];
  flexible?: boolean;
  /** Cocktails rated or made at least once — what the tasting filter checks against. */
  triedIds?: ReadonlySet<string>;
}

export interface ComposeResult {
  items: PartyItem[];
  /** Must-use products no drink contains under the current filters (kind, tasting, bar). */
  unavailable: string[];
  /** Must-use products that exist in the pool but didn't fit into the number of varieties. */
  didNotFit: string[];
}

/**
 * Auto-compose a party: drink kind and tasting status are hard filters; with "З мого бару" only
 * makeable drinks qualify, otherwise makeable ones go first. Moods steer the ranking (matches
 * first) and must-use products are guaranteed: every one of them lands in at least one drink,
 * picking drinks that cover several at once so they fit into the set.
 */
export function composePartyPlan(pool: Cocktail[], config: PartyConfig, opts: ComposeOptions = {}): ComposeResult {
  const { moodTags = [], owned = [], flexible = true, triedIds = new Set<string>() } = opts;
  const kindPool = filterKind(pool, config.kind);
  let base = filterTasted(kindPool.length ? kindPool : pool, config.tasted ?? "all", triedIds);

  const makeable =
    config.useMyBar || owned.length
      ? new Set(whatCanIMake(base, owned, flexible).makeable.map((m) => m.cocktail.id))
      : null;
  const isMakeable = (c: Cocktail) => !makeable || makeable.has(c.id);
  // Strict: only drinks you can actually make right now. If that yields fewer than the
  // requested varieties we return a SHORTER set — never pad it with ones you can't make.
  if (config.useMyBar) base = base.filter(isMakeable);

  // Ranking: mood matches first (best score first), then everything else; makeable first inside each.
  const moodRanked = moodTags.length ? recommendByMood(base, moodTags) : [];
  const inMood = new Set(moodRanked.map((c) => c.id));
  const byBar = (list: Cocktail[]) => [...list.filter(isMakeable), ...list.filter((c) => !isMakeable(c))];
  const ranked = [...byBar(moodRanked), ...byBar(base.filter((c) => !inMood.has(c.id)))];

  const varieties = Math.max(1, config.varieties);
  const picks: Cocktail[] = [];
  const picked = new Set<string>();
  const covered = new Set<string>();
  const must = [...new Set(config.mustUse ?? [])];
  const carriers = new Map(must.map((p) => [p, ranked.filter((c) => usesIngredient(c, p))]));
  const unavailable = must.filter((p) => carriers.get(p)!.length === 0);
  const didNotFit: string[] = [];

  // Rarest product first, so a common one can't take the only slot a rare one could use.
  const order = must.filter((p) => carriers.get(p)!.length > 0);
  order.sort((a, b) => carriers.get(a)!.length - carriers.get(b)!.length);
  for (const p of order) {
    if (covered.has(p)) continue;
    if (picks.length >= varieties) {
      didNotFit.push(p);
      continue;
    }
    // Among drinks with this product, take the one covering the most still-missing products
    // (ties keep the ranking order).
    let best: Cocktail | undefined;
    let bestScore = 0;
    for (const c of carriers.get(p)!) {
      if (picked.has(c.id)) continue;
      const score = order.filter((q) => !covered.has(q) && usesIngredient(c, q)).length;
      if (score > bestScore) {
        best = c;
        bestScore = score;
      }
    }
    if (!best) continue;
    picks.push(best);
    picked.add(best.id);
    for (const q of order) if (usesIngredient(best, q)) covered.add(q);
  }

  for (const c of ranked) {
    if (picks.length >= varieties) break;
    if (picked.has(c.id)) continue;
    picks.push(c);
    picked.add(c.id);
  }

  const items = planServings(picks, config);
  return { items: config.byStrength ? sortByStrength(items) : items, unavailable, didNotFit };
}

/** Auto-compose a party from the pool: optional mood, bar filtering, even servings. */
export function composeParty(
  pool: Cocktail[],
  config: PartyConfig,
  moodTags: CocktailTag[] = [],
  owned: string[] = [],
  flexible = true,
): PartyItem[] {
  return composePartyPlan(pool, config, { moodTags, owned, flexible }).items;
}

/** Build a plan from an explicit set of cocktails, scaled to the party size. */
export function planFromSet(cocktails: Cocktail[], config: PartyConfig): PartyItem[] {
  const items = planServings(cocktails, config);
  return config.byStrength ? sortByStrength(items) : items;
}
