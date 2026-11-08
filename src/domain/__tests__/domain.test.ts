import { describe, expect, it } from "vitest";
import type { Cocktail, Ingredient } from "@/types/cocktail";
import {
  applyFilters,
  baseSpiritOf,
  estimateStrength,
  filterDrinkKind,
  filterTasted,
  formatIngredient,
  formatQty,
  ingredientUsage,
  isShot,
  search,
  sortBy,
  stepProgress,
  strengthBucket,
  usesIngredient,
} from "@/domain/cocktails";
import {
  classifyIngredient,
  hasAllTools,
  isIgnorable,
  smartShoppingPlan,
  suggestPurchases,
  whatCanIMake,
} from "@/domain/inventory";
import { recommendForYou } from "@/domain/recommend";
import { buildShoppingList } from "@/domain/shopping";
import {
  composeParty,
  composePartyPlan,
  distributeServings,
  filterKind,
  replaceWithSimilar,
  sortByStrength,
  type PartyConfig,
} from "@/domain/party";
import { normalize } from "@/domain/text";

const mk = (id: string, tags: string[], ingredients: Ingredient[], extra: Partial<Cocktail> = {}): Cocktail => ({
  id,
  cardNumber: 1,
  name: id,
  tags: tags as Cocktail["tags"],
  ingredients,
  tools: extra.tools ?? ["Шейкер", "Стрейнер"],
  steps: extra.steps ?? ["Збий", "Перелий"],
  images: {},
  source: {},
  ...extra,
});

const ml = (name: string, amount: number): Ingredient => ({ name, amount, unit: "мл" });

const margarita = mk(
  "margarita",
  ["міцні", "кислі", "на текілі"],
  [ml("Срібна текіла", 50), ml("Лаймовий сік", 30), { name: "Лід в кубиках", amount: 200, unit: "г" }],
);
const daiquiri = mk(
  "daiquiri",
  ["міцні", "цитрусові"],
  [ml("Білий ром", 60), ml("Лаймовий сік", 30), ml("Цукровий сироп", 15)],
);
const martini = mk("martini", ["міцні", "сухі"], [ml("Джин", 60), ml("Сухий вермут", 10)]);

describe("text.normalize", () => {
  it("lowercases, strips apostrophes and punctuation", () => {
    expect(normalize("М'ЯТА, Свіжа!")).toBe("мята свіжа");
  });
});

describe("cocktails.search", () => {
  it("matches by name and ingredient", () => {
    const all = [margarita, daiquiri];
    expect(search(all, "ром").map((c) => c.id)).toEqual(["daiquiri"]);
    expect(search(all, "marga").map((c) => c.id)).toEqual(["margarita"]);
    expect(search(all, "лайм")).toHaveLength(2);
  });
});

describe("cocktails.applyFilters", () => {
  it("ORs within an axis, ANDs across axes", () => {
    const all = [margarita, daiquiri, martini];
    expect(applyFilters(all, { tags: ["кислі"] }).map((c) => c.id)).toEqual(["margarita"]);
    // strength(міцні) AND taste(сухі) -> only martini
    expect(applyFilters(all, { tags: ["міцні", "сухі"] }).map((c) => c.id)).toEqual(["martini"]);
  });
  it("matches a derived base spirit even without an explicit base tag", () => {
    expect(baseSpiritOf(daiquiri)).toBe("на ромі");
    expect(applyFilters([daiquiri], { tags: ["на ромі"] })).toHaveLength(1);
  });
});

describe("cocktails.sortBy", () => {
  it("sorts by name (uk) and ingredient count", () => {
    expect(sortBy([martini, daiquiri], "name").map((c) => c.id)).toEqual(["daiquiri", "martini"]);
    expect(sortBy([daiquiri, martini], "ingredients")[0].id).toBe("martini"); // fewer ingredients first
  });
});

describe("cocktails.formatIngredient / formatQty", () => {
  it("formats ml and converts to oz", () => {
    expect(formatIngredient(ml("Джин", 60))).toBe("Джин — 60 мл");
    expect(formatIngredient(ml("Джин", 60), 2)).toBe("Джин — 120 мл");
    expect(formatQty(60, "мл", "oz")).toBe("2 oz");
    expect(formatIngredient({ name: "Сіль", note: "за смаком" })).toBe("Сіль — за смаком");
  });
});

describe("stepProgress", () => {
  it("computes current/total/pct", () => {
    expect(stepProgress(4, 1)).toEqual({ current: 2, total: 4, pct: 0.5 });
  });
});

describe("inventory matching", () => {
  it("classifies exact / substitute / missing", () => {
    expect(classifyIngredient(ml("Білий ром", 60), ["Білий ром"], true).tier).toBe("exact");
    // own white rum, recipe wants gold rum -> substitute (same family), only when flexible
    expect(classifyIngredient(ml("Золотий ром", 60), ["Білий ром"], true).tier).toBe("substitute");
    expect(classifyIngredient(ml("Золотий ром", 60), ["Білий ром"], false).tier).toBe("missing");
  });
  it("isIgnorable skips ice and to-taste", () => {
    expect(isIgnorable({ name: "Лід в кубиках", amount: 200, unit: "г" })).toBe(true);
    expect(isIgnorable({ name: "Сіль", note: "за смаком" })).toBe(true);
    expect(isIgnorable(ml("Джин", 60))).toBe(false);
  });
  it("whatCanIMake: makeable when all owned; 'almost' only when have >= missing", () => {
    const all = [martini];
    expect(whatCanIMake(all, ["Джин", "Сухий вермут"], true).makeable.map((m) => m.cocktail.id)).toEqual(["martini"]);
    // missing both of a 2-ingredient drink -> NOT almost (the bug we fixed)
    expect(whatCanIMake(all, [], true).almost).toHaveLength(0);
    // own one of two -> almost
    expect(whatCanIMake(all, ["Джин"], true).almost.map((m) => m.cocktail.id)).toEqual(["martini"]);
  });
  it("suggestPurchases ranks ingredients that unlock the most", () => {
    const all = [daiquiri, mk("mojito", ["міцні"], [ml("Білий ром", 50), ml("Лаймовий сік", 30)])];
    // own everything except white rum -> buying it unlocks both
    const out = suggestPurchases(all, ["Лаймовий сік", "Цукровий сироп"], true);
    expect(out[0].cocktails.length).toBe(2);
  });
  it("hasAllTools ignores glassware, checks real tools", () => {
    const c = mk("x", ["міцні"], [ml("Джин", 60)], { tools: ["Шейкер", "Рокс"] });
    expect(hasAllTools(c, ["Шейкер"])).toBe(true); // Рокс is glass -> ignored
    expect(hasAllTools(c, [])).toBe(false);
  });
  it("smartShoppingPlan sequences purchases, accounting for earlier steps", () => {
    const all = [
      mk("daiquiri2", ["міцні"], [ml("Білий ром", 60), ml("Лаймовий сік", 30), ml("Цукровий сироп", 15)]),
      mk("mojito", ["міцні"], [ml("Білий ром", 50), ml("Лаймовий сік", 30)]),
      mk("navy", ["міцні"], [ml("Білий ром", 40), ml("Джин", 20)]), // 2-away until rum is bought
    ];
    const plan = smartShoppingPlan(all, ["Лаймовий сік", "Цукровий сироп"], true, 3);
    expect(plan[0].name).toBe("Білий ром"); // unlocks the two 1-away cocktails first (+2)
    expect(plan[0].cocktails.length).toBe(2);
    expect(plan.map((p) => p.name)).toContain("Джин"); // navy becomes 1-away only after step 1
    expect(plan.reduce((n, p) => n + p.cocktails.length, 0)).toBe(3);
  });
});

describe("party: kind filter, strength order, similar swap", () => {
  const shot = mk("kamikaze-shot", ["шоти"], [ml("Горілка", 20), ml("Тріпл сек", 20)], { glass: "Чарка" });
  const long = mk("long-drink", ["лонги"], [ml("Горілка", 40), ml("Апельсиновий сік", 120)], { glass: "Хайбол" });

  it("filterKind keeps only shots (by tag or shot glass)", () => {
    expect(filterKind([shot, long, martini], "shots").map((c) => c.id)).toEqual(["kamikaze-shot"]);
    expect(filterKind([shot, long, martini], "cocktails").map((c) => c.id)).toEqual(["long-drink", "martini"]);
    expect(filterKind([shot, long], "any")).toHaveLength(2);
  });

  it("sortByStrength orders lightest first", () => {
    const items = [
      { cocktail: martini, servings: 1 },
      { cocktail: long, servings: 1 },
    ];
    expect(sortByStrength(items)[0].cocktail.id).toBe("long-drink"); // juice-heavy long drink is weaker
  });

  it("useMyBar returns a SHORTER set rather than padding with drinks you cannot make", () => {
    // own only what daiquiri needs; asking for 3 varieties must not pull in the others
    const owned = ["Білий ром", "Лаймовий сік", "Цукровий сироп"];
    const cfg = {
      people: 2,
      varieties: 3,
      drinksPerPerson: 2,
      useMyBar: true,
      everyoneTries: true,
      kind: "any" as const,
      byStrength: false,
    };
    const items = composeParty([daiquiri, margarita, martini], cfg, [], owned, true);
    expect(items.map((i) => i.cocktail.id)).toEqual(["daiquiri"]);
  });

  it("replaceWithSimilar honours onlyMakeable", () => {
    const owned = ["Білий ром", "Лаймовий сік", "Цукровий сироп"];
    const items = [{ cocktail: margarita, servings: 1 }];
    const out = replaceWithSimilar(items, "margarita", [margarita, daiquiri, martini], "any", 0, {
      onlyMakeable: true,
      owned,
      flexible: true,
    });
    expect(out[0].cocktail.id).toBe("daiquiri"); // the only one the bar can actually make
  });

  it("replaceWithSimilar swaps in a drink that is not already in the set", () => {
    const items = [{ cocktail: daiquiri, servings: 2 }];
    const out = replaceWithSimilar(items, "daiquiri", [daiquiri, margarita, martini], "any", 0);
    expect(out).toHaveLength(1);
    expect(out[0].cocktail.id).not.toBe("daiquiri");
    expect(out[0].servings).toBe(2); // servings are preserved
  });
});

describe("cocktails.strengthBucket", () => {
  it("buckets by estimated ABV", () => {
    expect(strengthBucket(mk("juice", [], [ml("Апельсиновий сік", 150)]))).toBe("zero");
    expect(strengthBucket(martini)).toBe("strong"); // spirit-forward, low dilution
  });
});

describe("shopping.buildShoppingList", () => {
  it("sums by ingredient × servings and subtracts owned", () => {
    const lines = buildShoppingList([{ cocktail: daiquiri, servings: 2 }], ["Цукровий сироп"]);
    const lime = lines.find((l) => l.name === "Лаймовий сік");
    expect(lime?.amount).toBe(60); // 30 × 2
    expect(lines.find((l) => l.name === "Цукровий сироп")).toBeUndefined(); // owned -> excluded
  });
});

describe("party", () => {
  it("distributes servings evenly with a floor of 1", () => {
    const items = distributeServings([margarita, daiquiri, martini], 6);
    expect(items.reduce((n, i) => n + i.servings, 0)).toBe(6);
  });
  it("composeParty picks the requested number of varieties", () => {
    const items = composeParty([margarita, daiquiri, martini], {
      people: 2,
      varieties: 2,
      drinksPerPerson: 2,
      useMyBar: false,
      everyoneTries: true,
      kind: "any",
      byStrength: false,
    });
    expect(items).toHaveLength(2);
  });
});

describe("recommend.recommendForYou", () => {
  it("returns nothing without signals, and scores by tag overlap", () => {
    const all = [margarita, daiquiri, martini];
    expect(recommendForYou(all, { favourites: [], ratings: {}, likedTags: [], dislikedTags: [] })).toEqual([]);
    const recs = recommendForYou(all, { favourites: ["margarita"], ratings: {}, likedTags: [], dislikedTags: [] });
    expect(recs.map((c) => c.id)).not.toContain("margarita"); // excludes known
    expect(recs[0].id).toBe("daiquiri"); // shares міцні/цитрусові-ish with margarita's tags
  });
});

describe("estimateStrength", () => {
  it("rates a spirit-forward drink stronger than a diluted one", () => {
    const martiniAbv = estimateStrength(martini).abv;
    const margaritaAbv = estimateStrength(margarita).abv;
    expect(martiniAbv).toBeGreaterThan(margaritaAbv);
    expect(martiniAbv).toBeGreaterThan(20);
    expect(estimateStrength(martini).standardDrinks).toBeGreaterThan(0);
  });
});

describe("sortBy rating", () => {
  it("orders by your rating, highest first", () => {
    expect(sortBy([margarita, daiquiri], "rating", { daiquiri: 5, margarita: 2 })[0].id).toBe("daiquiri");
  });
});

describe("search English synonyms", () => {
  it("matches Ukrainian ingredients from latin terms", () => {
    expect(search([daiquiri, martini], "rum").map((c) => c.id)).toEqual(["daiquiri"]); // rum → ром (Білий ром)
    expect(search([daiquiri, martini], "gin").map((c) => c.id)).toEqual(["martini"]); // gin → джин
  });
});

describe("drink kind and tasting filters", () => {
  const shot = mk("b-52", ["шоти"], [ml("Кавовий лікер", 15)], { glass: "Чарка" });
  const shotByGlass = mk("sangrita", [], [ml("Томатний сік", 30)], { glass: "Чарка 2 шт." });
  const longDrink = mk("screwdriver", ["лонги"], [ml("Горілка", 50), ml("Апельсиновий сік", 150)], {
    glass: "Хайбол",
  });

  it("isShot catches the tag and any shot-glass spelling", () => {
    expect(isShot(shot)).toBe(true);
    expect(isShot(shotByGlass)).toBe(true);
    expect(isShot(longDrink)).toBe(false);
  });

  it("filterDrinkKind splits shots from cocktails", () => {
    const all = [shot, shotByGlass, longDrink, martini];
    expect(filterDrinkKind(all, "shots").map((c) => c.id)).toEqual(["b-52", "sangrita"]);
    expect(filterDrinkKind(all, "cocktails").map((c) => c.id)).toEqual(["screwdriver", "martini"]);
    expect(filterDrinkKind(all, "all")).toHaveLength(4);
  });

  it("filterTasted keeps tried or untried drinks", () => {
    const tried = new Set(["martini"]);
    expect(filterTasted([martini, daiquiri], "tried", tried).map((c) => c.id)).toEqual(["martini"]);
    expect(filterTasted([martini, daiquiri], "untried", tried).map((c) => c.id)).toEqual(["daiquiri"]);
    expect(filterTasted([martini, daiquiri], "all", tried)).toHaveLength(2);
  });

  it("usesIngredient matches on the canonical ingredient, not the spelling", () => {
    const fresh = mk("fresh", [], [ml("Апельсиновий фреш", 100)]);
    expect(usesIngredient(fresh, "orange-juice")).toBe(true);
    expect(usesIngredient(martini, "orange-juice")).toBe(false);
  });

  it("ingredientUsage counts drinks per ingredient and skips ice", () => {
    const usage = ingredientUsage([margarita, daiquiri, martini]);
    expect(usage.find((u) => u.id === "lime-juice")?.count).toBe(2);
    expect(usage.some((u) => u.name === "Лід в кубиках")).toBe(false);
  });
});

describe("composePartyPlan: tasting and must-use products", () => {
  const cfg = (extra: Partial<PartyConfig> = {}): PartyConfig => ({
    people: 2,
    varieties: 2,
    drinksPerPerson: 2,
    useMyBar: false,
    everyoneTries: true,
    kind: "any",
    byStrength: false,
    ...extra,
  });
  const screwdriver = mk("screwdriver", ["лонги"], [ml("Горілка", 50), ml("Апельсиновий сік", 150)]);
  const creamy = mk("creamy", ["десерти"], [ml("Кавовий лікер", 30), { name: "Збиті вершки", note: "шапка" }]);
  const both = mk("orange-cream", ["десерти"], [ml("Апельсиновий сік", 60), { name: "Збиті вершки", note: "шапка" }]);
  const pool = [margarita, daiquiri, martini, screwdriver, creamy];

  it("puts a drink with each must-use product into the set", () => {
    const { items, unavailable, didNotFit } = composePartyPlan(pool, cfg({ mustUse: ["orange-juice"] }));
    const ids = items.map((i) => i.cocktail.id);
    expect(ids).toContain("screwdriver"); // last in the pool, but it's the only one with orange juice
    expect(ids).toHaveLength(2);
    expect(unavailable).toEqual([]);
    expect(didNotFit).toEqual([]);
  });

  it("covers two products with one drink when that is what makes them fit", () => {
    const { items, didNotFit } = composePartyPlan(
      [...pool, both],
      cfg({ varieties: 1, mustUse: ["orange-juice", "whipped-cream"] }),
    );
    expect(items.map((i) => i.cocktail.id)).toEqual(["orange-cream"]);
    expect(didNotFit).toEqual([]);
  });

  it("reports products nothing contains, and ones that don't fit the set size", () => {
    const missing = composePartyPlan(pool, cfg({ mustUse: ["whipped-cream", "tomato-juice"] }));
    expect(missing.unavailable).toEqual(["tomato-juice"]);
    expect(missing.items.map((i) => i.cocktail.id)).toContain("creamy");

    const tooSmall = composePartyPlan(pool, cfg({ varieties: 1, mustUse: ["orange-juice", "whipped-cream"] }));
    expect(tooSmall.items).toHaveLength(1);
    expect(tooSmall.didNotFit).toHaveLength(1);
  });

  it("the tasting filter is strict: untried only, or a shorter set of tried ones", () => {
    const triedIds = new Set(["margarita"]);
    const untried = composePartyPlan(pool, cfg({ tasted: "untried" }), { triedIds });
    expect(untried.items.map((i) => i.cocktail.id)).not.toContain("margarita");
    const tried = composePartyPlan(pool, cfg({ tasted: "tried", varieties: 3 }), { triedIds });
    expect(tried.items.map((i) => i.cocktail.id)).toEqual(["margarita"]);
  });

  it("a must-use product respects the tasting filter", () => {
    const triedIds = new Set(["screwdriver"]);
    const { items, unavailable } = composePartyPlan(pool, cfg({ tasted: "untried", mustUse: ["orange-juice"] }), {
      triedIds,
    });
    expect(items.map((i) => i.cocktail.id)).not.toContain("screwdriver");
    expect(unavailable).toEqual(["orange-juice"]);
  });

  it("moods still lead the ranking, then the rest fills the set", () => {
    const { items } = composePartyPlan(pool, cfg({ varieties: 2 }), { moodTags: ["десерти"] });
    expect(items[0].cocktail.id).toBe("creamy");
    expect(items).toHaveLength(2);
  });

  it("a swap keeps the only drink with a must-use product replaced by another one with it", () => {
    const juicy = mk("juicy", ["лонги"], [ml("Білий ром", 40), ml("Апельсиновий сік", 120)]);
    const items = [
      { cocktail: screwdriver, servings: 2 },
      { cocktail: martini, servings: 2 },
    ];
    const out = replaceWithSimilar(items, "screwdriver", [...pool, juicy], "any", 0, { mustUse: ["orange-juice"] });
    expect(out[0].cocktail.id).toBe("juicy");
  });
});
