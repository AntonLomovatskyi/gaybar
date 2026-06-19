import { Link, Stack, useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stepper } from "@/components/Stepper";
import { cocktailAvailability } from "@/data/catalog/availability";
import { useAllCocktails } from "@/data/useCocktails";
import { formatQty } from "@/domain/cocktails";
import { buildShoppingList, type ShoppingSelection } from "@/domain/shopping";
import { useT } from "@/i18n";
import { usePartyStore } from "@/store/partyStore";
import { useUserStore } from "@/store/userStore";
import { useTheme } from "@/theme/theme";

const AVAIL = {
  common: { label: "є локально", color: "#5C8A5A" },
  specialty: { label: "спец. магазин", color: "#D9B25A" },
  rare: { label: "рідкісне", color: "#C8553D" },
} as const;

export default function PlanScreen() {
  const c = useTheme();
  const t = useT();
  const router = useRouter();
  const { title, items, bumpServings } = usePartyStore();
  const owned = useUserStore((s) => s.ownedIngredients);
  const units = useUserStore((s) => s.units);
  const all = useAllCocktails();

  const selections = useMemo<ShoppingSelection[]>(
    () =>
      items
        .map((it) => {
          const cocktail = all.find((c) => c.id === it.id);
          return cocktail ? { cocktail, servings: it.servings } : null;
        })
        .filter((x): x is ShoppingSelection => x !== null),
    [items, all],
  );

  const lines = useMemo(() => buildShoppingList(selections, owned), [selections, owned]);
  const totalDrinks = selections.reduce((n, s) => n + s.servings, 0);

  if (!selections.length) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: t.sets.plan }} />
        <Text style={{ color: c.color.textDim }}>Порожній сет</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.color.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Stack.Screen options={{ title: title || t.sets.plan }} />
      <Text style={{ color: c.color.textDim, marginBottom: 12 }}>
        {t.sets.cocktails}: {selections.length} · {t.sets.total}: {totalDrinks}
      </Text>

      {selections.map((s) => {
        const av = cocktailAvailability(s.cocktail);
        return (
          <View key={s.cocktail.id} style={[styles.row, { borderBottomColor: c.color.border }]}>
            <Link href={`/cocktail/${s.cocktail.id}`} asChild>
              <Pressable style={{ flex: 1 }}>
                <Text style={{ color: c.color.text, fontSize: 16 }}>{s.cocktail.name}</Text>
                <Text style={{ color: AVAIL[av.tier].color, fontSize: 12, marginTop: 2 }}>
                  ● {AVAIL[av.tier].label}
                </Text>
              </Pressable>
            </Link>
            <Stepper value={s.servings} onChange={(v) => bumpServings(s.cocktail.id, v - s.servings)} />
          </View>
        );
      })}

      <Text style={[styles.h, { color: c.color.gold, marginTop: 24 }]}>
        {t.sets.shoppingFor} ({lines.length})
      </Text>
      {lines.map((l) => (
        <View key={l.name} style={[styles.lineRow, { borderBottomColor: c.color.border }]}>
          <Text style={{ color: c.color.text, fontSize: 15, flex: 1 }}>{l.name}</Text>
          <Text style={{ color: c.color.textDim }}>{l.mixedUnits ? "—" : formatQty(l.amount, l.unit, units)}</Text>
        </View>
      ))}

      <Pressable style={[styles.cta, { backgroundColor: c.color.gold }]} onPress={() => router.push("/set/make")}>
        <Text style={{ color: c.color.bg, fontWeight: "700", fontSize: 16 }}>▶ {t.sets.start}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  h: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  lineRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1 },
  cta: { marginTop: 28, paddingVertical: 15, borderRadius: 12, alignItems: "center" },
});
