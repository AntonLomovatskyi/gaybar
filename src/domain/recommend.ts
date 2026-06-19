/** "Для тебе" — score cocktails from the user's favourites, high ratings and liked tags. Pure. */
import type { Cocktail } from "@/types/cocktail";

export interface TasteSignals {
  favourites: string[];
  ratings: Record<string, number>;
  likedTags: string[];
  dislikedTags: string[];
}

export function recommendForYou(cocktails: Cocktail[], s: TasteSignals): Cocktail[] {
  const weight = new Map<string, number>();
  const bump = (tags: readonly string[], w: number) => tags.forEach((t) => weight.set(t, (weight.get(t) ?? 0) + w));
  const byId = new Map(cocktails.map((c) => [c.id, c]));

  for (const id of s.favourites) {
    const c = byId.get(id);
    if (c) bump(c.tags, 2);
  }
  for (const [id, r] of Object.entries(s.ratings)) {
    const c = byId.get(id);
    if (c && r >= 4) bump(c.tags, r - 3); // 4★ → +1, 5★ → +2
  }
  for (const t of s.likedTags) weight.set(t, (weight.get(t) ?? 0) + 3);
  for (const t of s.dislikedTags) weight.set(t, (weight.get(t) ?? 0) - 4);

  if (weight.size === 0) return [];
  const known = new Set([...s.favourites, ...Object.keys(s.ratings)]);
  return cocktails
    .map((c) => ({ c, score: c.tags.reduce((sum, t) => sum + (weight.get(t) ?? 0), 0) }))
    .filter((x) => x.score > 0 && !known.has(x.c.id))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map((x) => x.c);
}
