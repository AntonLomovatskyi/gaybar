import { describe, expect, it } from "vitest";
import type { Cocktail } from "@/types/cocktail";
import { cookedCocktails, filterByRating, foldMakeRatings, sortCooked } from "@/domain/journal";
import { useUserStore } from "@/store/userStore";

const mk = (id: string, name = id): Cocktail => ({
  id,
  cardNumber: 1,
  name,
  tags: [],
  ingredients: [],
  tools: [],
  steps: [],
  images: {},
  source: {},
});
const all = [mk("daiquiri", "Дайкірі"), mk("negroni", "Негроні"), mk("mojito", "Мохіто")];

describe("journal: what you've cooked, rated on the cocktail", () => {
  const history = [
    { cocktailId: "negroni", at: 300 },
    { cocktailId: "daiquiri", at: 200 },
    { cocktailId: "negroni", at: 100 },
    { cocktailId: "deleted-recipe", at: 50 },
  ];

  it("one row per cocktail, counting makes, newest first, unknown ids skipped", () => {
    const rows = cookedCocktails(all, history, { negroni: 5 });
    expect(rows.map((r) => [r.cocktail.id, r.times, r.lastAt, r.rating])).toEqual([
      ["negroni", 2, 300, 5],
      ["daiquiri", 1, 200, 0],
    ]);
  });

  it("filters by the stars you gave the cocktail", () => {
    const rows = cookedCocktails(all, history, { negroni: 5, daiquiri: 3 });
    expect(filterByRating(rows, 5).map((r) => r.cocktail.id)).toEqual(["negroni"]);
    expect(filterByRating(rows, 3).map((r) => r.cocktail.id)).toEqual(["daiquiri"]);
    expect(filterByRating(rows, 4)).toEqual([]);
    expect(filterByRating(rows, "all")).toHaveLength(2);
    expect(filterByRating(cookedCocktails(all, history, {}), "unrated")).toHaveLength(2);
  });

  it("sorts by recency, rating or how often you made it", () => {
    const rows = cookedCocktails(
      all,
      [...history, { cocktailId: "daiquiri", at: 10 }, { cocktailId: "daiquiri", at: 20 }],
      {
        negroni: 2,
        daiquiri: 4,
      },
    );
    expect(sortCooked(rows, "recent")[0].cocktail.id).toBe("negroni");
    expect(sortCooked(rows, "rating")[0].cocktail.id).toBe("daiquiri");
    expect(sortCooked(rows, "times")[0].cocktail.id).toBe("daiquiri"); // 3 makes vs 2
  });

  it("old per-make ratings move onto the cocktail without overriding a real rating", () => {
    const old = [
      { cocktailId: "negroni", at: 300, rating: 4 },
      { cocktailId: "negroni", at: 100, rating: 2 },
      { cocktailId: "daiquiri", at: 200, rating: 1 },
    ];
    const { history: h, ratings } = foldMakeRatings(old, { daiquiri: 5 });
    expect(ratings).toEqual({ negroni: 4, daiquiri: 5 }); // newest make wins; existing rating kept
    expect(h.every((e) => !("rating" in e))).toBe(true);
    expect(foldMakeRatings(h, ratings).ratings).toEqual(ratings); // idempotent
  });

  it("importing an old backup folds its per-make ratings in", () => {
    useUserStore.getState().importData({
      ratings: {},
      history: [{ cocktailId: "mojito", at: 1, rating: 5 }],
    });
    const s = useUserStore.getState();
    expect(s.ratings.mojito).toBe(5);
    expect(s.history[0].rating).toBeUndefined();
  });
});
