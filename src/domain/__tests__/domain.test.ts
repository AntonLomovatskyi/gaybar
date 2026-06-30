import { describe, expect, it } from "vitest";
import type { Cocktail, Ingredient } from "@/types/cocktail";
import {
  applyFilters,
  baseSpiritOf,
  estimateStrength,
  formatIngredient,
  formatQty,
  search,
  sortBy,
  stepProgress,
} from "@/domain/cocktails";
import { classifyIngredient, hasAllTools, isIgnorable, suggestPurchases, whatCanIMake } from "@/domain/inventory";
import { recommendForYou } from "@/domain/recommend";
import { buildShoppingList } from "@/domain/shopping";
import { composeParty, distributeServings } from "@/domain/party";
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
      localOnly: false,
      useMyBar: false,
      everyoneTries: true,
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
