import { describe, expect, it } from "vitest";
import { canonicalIdOf, familyOf } from "@/data/catalog/ingredients";
import { classifyIngredient } from "@/domain/inventory";
import { flavourSwapFor, formatSwap } from "@/domain/substitutes";

describe("syrup ⇄ liqueur swaps carry the proportions", () => {
  it("melon syrup stands in for melon liqueur: half the syrup + spirit to rebuild strength", () => {
    const swap = flavourSwapFor({ name: "Динний лікер", amount: 30, unit: "мл" }, ["Динний сироп", "Горілка"]);
    expect(swap).toBeDefined();
    expect(swap!.kind).toBe("syrup-for-liqueur");
    // 30 мл liqueur -> 15 мл syrup (syrup is ~2x sweeter) + vodka for the lost alcohol
    expect(swap!.parts[0]).toMatchObject({ name: "Динний сироп", amount: 15, unit: "мл" });
    expect(swap!.parts[1]?.name).toBe("Горілка");
    expect(formatSwap(swap!)).toContain("15 мл Динний сироп");
  });

  it("uses a neutral spirit you actually own", () => {
    const swap = flavourSwapFor({ name: "Малиновий лікер", amount: 20, unit: "мл" }, ["Малиновий сироп", "Білий ром"]);
    expect(swap!.parts[1]?.name).toBe("Білий ром");
  });

  it("works in reverse — a liqueur can cover a syrup, at double the volume", () => {
    const swap = flavourSwapFor({ name: "Малиновий сироп", amount: 10, unit: "мл" }, ["Малиновий лікер"]);
    expect(swap!.kind).toBe("liqueur-for-syrup");
    expect(swap!.parts[0]).toMatchObject({ name: "Малиновий лікер", amount: 20 });
  });

  it("no swap when you own the real thing, or when nothing pairs", () => {
    expect(flavourSwapFor({ name: "Динний лікер", amount: 30, unit: "мл" }, ["Динний лікер"])).toBeUndefined();
    expect(flavourSwapFor({ name: "Сухий джин", amount: 60, unit: "мл" }, ["Динний сироп"])).toBeUndefined();
  });
});

describe("herbal liqueurs substitute for each other", () => {
  it("Jägermeister and Becherovka share the amaro family", () => {
    expect(familyOf("Єгермейстер")).toBe("amaro");
    expect(familyOf("Бехерівка")).toBe(familyOf("Єгермейстер"));
  });

  it("owning Becherovka covers a recipe that calls for Jägermeister (flexible matching)", () => {
    const m = classifyIngredient({ name: "Єгермейстер", amount: 25, unit: "мл" }, ["Бехерівка"], true);
    expect(m.tier).toBe("substitute");
    expect(m.have).toBe("Бехерівка");
  });

  it("melon syrup is now a real catalog ingredient", () => {
    expect(canonicalIdOf("Динний сироп")).toBe("melon-syrup");
  });
});
