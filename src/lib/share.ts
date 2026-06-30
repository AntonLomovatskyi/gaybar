/** Web Share with clipboard fallback. */
export async function shareLink(title: string, url: string): Promise<void> {
  try {
    if (navigator.share) await navigator.share({ title, url });
    else {
      await navigator.clipboard.writeText(url);
      window.alert("Посилання скопійовано");
    }
  } catch {
    /* user cancelled / not allowed */
  }
}

export interface PlanItem {
  id: string;
  servings: number;
}

/** Compact, URL-safe encoding of a party plan: "id:qty,id:qty". */
export function encodePlan(items: PlanItem[]): string {
  return items.map((i) => `${i.id}:${i.servings}`).join(",");
}

export function decodePlan(s: string): PlanItem[] {
  return s
    .split(",")
    .map((p) => {
      const [id, sv] = p.split(":");
      return { id, servings: Math.max(1, parseInt(sv ?? "1", 10) || 1) };
    })
    .filter((x) => x.id);
}
