import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useAllCocktails } from "@/data/useCocktails";
import { formatQty } from "@/domain/cocktails";
import { buildShoppingList, type ShoppingSelection } from "@/domain/shopping";
import { useT } from "@/i18n";
import { useUserStore } from "@/store/userStore";
import { useTheme } from "@/theme/theme";

function Stepper({
  value,
  onChange,
  c,
}: {
  value: number;
  onChange: (v: number) => void;
  c: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={() => onChange(value - 1)} style={[styles.stepBtn, { borderColor: c.color.border }]}>
        <Text style={{ color: c.color.text, fontSize: 18 }}>−</Text>
      </Pressable>
      <Text style={{ color: c.color.text, minWidth: 22, textAlign: "center" }}>{value}</Text>
      <Pressable onPress={() => onChange(value + 1)} style={[styles.stepBtn, { borderColor: c.color.border }]}>
        <Text style={{ color: c.color.text, fontSize: 18 }}>＋</Text>
      </Pressable>
    </View>
  );
}

export default function ShoppingScreen() {
  const c = useTheme();
  const t = useT();
  const shopping = useUserStore((s) => s.shopping);
  const setServings = useUserStore((s) => s.setShoppingServings);
  const clear = useUserStore((s) => s.clearShopping);
  const owned = useUserStore((s) => s.ownedIngredients);
  const all = useAllCocktails();
  const units = useUserStore((s) => s.units);
  const [people, setPeople] = useState(1);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const selections = useMemo<ShoppingSelection[]>(() => {
    return Object.entries(shopping)
      .map(([id, servings]) => {
        const cocktail = all.find((c) => c.id === id);
        return cocktail ? { cocktail, servings: servings * Math.max(1, people) } : null;
      })
      .filter((x): x is ShoppingSelection => x !== null);
  }, [shopping, people, all]);

  const lines = useMemo(() => buildShoppingList(selections, owned), [selections, owned]);

  if (!selections.length) {
    return (
      <View style={styles.center}>
        <Text style={{ color: c.color.textDim, textAlign: "center", paddingHorizontal: 32 }}>{t.shopping.empty}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.color.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <View style={styles.peopleRow}>
        <Text style={{ color: c.color.text, fontSize: 16 }}>👥 {t.shopping.people}</Text>
        <Stepper value={people} onChange={(v) => setPeople(Math.max(1, v))} c={c} />
      </View>

      <Text style={[styles.h, { color: c.color.gold }]}>Коктейлі</Text>
      {selections.map((s) => (
        <View key={s.cocktail.id} style={[styles.row, { borderBottomColor: c.color.border }]}>
          <Link href={`/cocktail/${s.cocktail.id}`} asChild>
            <Pressable style={{ flex: 1 }}>
              <Text style={{ color: c.color.text, fontSize: 16 }}>{s.cocktail.name}</Text>
            </Pressable>
          </Link>
          <Stepper value={shopping[s.cocktail.id] ?? 0} onChange={(v) => setServings(s.cocktail.id, v)} c={c} />
        </View>
      ))}

      <View style={styles.neededHeader}>
        <Text style={[styles.h, { color: c.color.gold, marginBottom: 0 }]}>
          {t.shopping.needed} ({lines.length})
        </Text>
        <Pressable
          onPress={() => {
            const text =
              "Список покупок (gaybar):\n" +
              lines
                .map(
                  (l) =>
                    `• ${l.name}${l.amount != null && !l.mixedUnits ? ` — ${formatQty(l.amount, l.unit, units)}` : ""}`,
                )
                .join("\n");
            Share.share({ message: text });
          }}
        >
          <Text style={{ color: c.color.gold }}>↗ Поділитися</Text>
        </Pressable>
      </View>
      {lines.map((l) => {
        const done = checked[l.name];
        return (
          <Pressable
            key={l.name}
            onPress={() => setChecked((p) => ({ ...p, [l.name]: !p[l.name] }))}
            style={[styles.row, { borderBottomColor: c.color.border }]}
          >
            <Text style={{ color: done ? c.color.textFaint : c.color.gold, marginRight: 10 }}>{done ? "☑" : "☐"}</Text>
            <Text
              style={{
                color: done ? c.color.textFaint : c.color.text,
                fontSize: 16,
                flex: 1,
                textDecorationLine: done ? "line-through" : "none",
              }}
            >
              {l.name}
            </Text>
            <Text style={{ color: c.color.textDim }}>{l.mixedUnits ? "—" : formatQty(l.amount, l.unit, units)}</Text>
          </Pressable>
        );
      })}

      <Pressable onPress={clear} style={[styles.clear, { borderColor: c.color.border }]}>
        <Text style={{ color: c.color.textDim }}>{t.common.clear}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  peopleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  h: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  neededHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 8,
  },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepBtn: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  clear: { marginTop: 24, paddingVertical: 14, borderRadius: 12, alignItems: "center", borderWidth: 1 },
});
