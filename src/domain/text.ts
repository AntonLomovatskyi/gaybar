/** Text normalization for search & loose ingredient matching (Ukrainian-aware). */

const APOSTROPHES = /['’ʼ`]/g;

export function normalize(s: string): string {
  return (s || "")
    .normalize("NFC")
    .toLowerCase()
    .replace(APOSTROPHES, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Ukrainian-collation comparator (А→Я) for sorting display names. */
export function compareUk(a: string, b: string): number {
  return a.localeCompare(b, "uk");
}
