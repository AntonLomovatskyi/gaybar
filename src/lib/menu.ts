/**
 * Shareable guest menus.
 *
 * The `?m=id~id~id` link embeds every drink id, which grows past 2 KB on a well-stocked bar —
 * too long to paste into a chat. Instead we publish the id list to a tiny public Firestore doc
 * (`menus/{id}`) and share a short `?id=…` link. The doc holds nothing but cocktail ids, so it
 * is safe to read publicly — unlike `users/{uid}`, which carries the Anthropic key and stays
 * owner-only. Re-publishing reuses the same menu id, so a link you've already sent keeps working
 * and shows the updated bar.
 */
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, firebaseEnabled } from "./firebase";

export interface GuestMenu {
  ids: string[];
  title?: string;
  updatedAt: number;
}

/** Short, unguessable-enough id for an unlisted menu link. */
export function newMenuId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 8);
}

export class MenuError extends Error {}

export async function publishMenu(menuId: string, ids: string[], title?: string): Promise<void> {
  if (!firebaseEnabled || !db) throw new MenuError("Хмара не налаштована — скористайся довгим посиланням.");
  try {
    await setDoc(doc(db, "menus", menuId), { ids, title: title ?? "", updatedAt: Date.now() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/permission|insufficient/i.test(msg)) {
      throw new MenuError(
        "Firestore не дозволяє запис у menus. Увійди через Google і додай правило для колекції menus (див. налаштування).",
      );
    }
    throw new MenuError(msg);
  }
}

export async function fetchMenu(menuId: string): Promise<GuestMenu | null> {
  if (!firebaseEnabled || !db) return null;
  const snap = await getDoc(doc(db, "menus", menuId));
  if (!snap.exists()) return null;
  const d = snap.data() as Partial<GuestMenu>;
  return { ids: Array.isArray(d.ids) ? d.ids : [], title: d.title, updatedAt: d.updatedAt ?? 0 };
}
