/** Active UI strings, reactive to the user's language setting. Domain text stays Ukrainian. */
import { useUserStore } from "@/store/userStore";
import { en } from "./en";
import { t as uk, type Strings } from "./uk";

export type { Strings };

export function useT(): Strings {
  const lang = useUserStore((s) => s.language);
  return lang === "en" ? en : uk;
}
