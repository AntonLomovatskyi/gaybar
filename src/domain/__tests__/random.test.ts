import { describe, expect, it } from "vitest";
import { dailySeed, mulberry32, pickAtStep, shuffleSeeded } from "../random";

const nums = Array.from({ length: 50 }, (_, i) => i);

describe("mulberry32", () => {
  it("is deterministic and stays in [0,1)", () => {
    const a = Array.from({ length: 20 }, mulberry32(42));
    const b = Array.from({ length: 20 }, mulberry32(42));
    expect(a).toEqual(b);
    expect(a.every((n) => n >= 0 && n < 1)).toBe(true);
  });
});

describe("shuffleSeeded", () => {
  it("keeps every item exactly once and leaves the input alone", () => {
    const input = [...nums];
    const out = shuffleSeeded(input, 7);
    expect([...out].sort((x, y) => x - y)).toEqual(nums);
    expect(input).toEqual(nums);
  });

  it("repeats for the same seed and differs for another", () => {
    expect(shuffleSeeded(nums, 7)).toEqual(shuffleSeeded(nums, 7));
    expect(shuffleSeeded(nums, 8)).not.toEqual(shuffleSeeded(nums, 7));
  });

  it("does not leave the pool in its original order", () => {
    expect(shuffleSeeded(nums, 1)).not.toEqual(nums);
  });

  it("handles empty and single-item pools", () => {
    expect(shuffleSeeded([], 3)).toEqual([]);
    expect(shuffleSeeded(["a"], 3)).toEqual(["a"]);
  });
});

describe("pickAtStep", () => {
  const order = shuffleSeeded(nums, 5);

  it("shows every drink once per lap", () => {
    const lap = Array.from({ length: order.length }, (_, i) => pickAtStep(order, i));
    expect(new Set(lap).size).toBe(order.length);
  });

  it("wraps in both directions", () => {
    expect(pickAtStep(order, order.length)).toBe(pickAtStep(order, 0));
    expect(pickAtStep(order, -1)).toBe(pickAtStep(order, order.length - 1));
    expect(pickAtStep(order, -order.length - 1)).toBe(pickAtStep(order, order.length - 1));
  });

  it("never repeats between neighbouring steps of a multi-item pool", () => {
    for (let i = 0; i < order.length; i++) expect(pickAtStep(order, i)).not.toBe(pickAtStep(order, i + 1));
  });

  it("returns null for an empty pool", () => {
    expect(pickAtStep([], 3)).toBeNull();
  });
});

describe("dailySeed", () => {
  it("is stable within a day and moves the next", () => {
    const noon = Date.UTC(2026, 7, 23, 12);
    expect(dailySeed(noon)).toBe(dailySeed(noon + 6 * 3600_000));
    expect(dailySeed(noon + 24 * 3600_000)).toBe(dailySeed(noon) + 1);
  });
});
