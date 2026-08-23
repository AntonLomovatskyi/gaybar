import { describe, expect, it } from "vitest";
import { newMenuId } from "../menu";

describe("newMenuId", () => {
  it("is short and URL-safe", () => {
    const id = newMenuId();
    expect(id).toHaveLength(8);
    expect(id).toMatch(/^[0-9a-z]{8}$/);
  });

  it("does not repeat", () => {
    const ids = new Set(Array.from({ length: 200 }, () => newMenuId()));
    expect(ids.size).toBe(200);
  });
});
