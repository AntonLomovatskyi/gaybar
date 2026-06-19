import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { availabilityOf } from "@/data/catalog/availability";
import { TOOL_BY_ID } from "@/data/catalog/tools";
import { useAllCocktails } from "@/data/useCocktails";
import { hasAllTools, suggestPurchases, whatCanIMake, type MakeResult } from "@/domain/inventory";
import { normalize } from "@/domain/text";
import { useT } from "@/i18n";
import { useUserStore } from "@/store/userStore";
import { useTheme } from "@/theme/theme";

const AVAIL_COLOR = { common: "#5C8A5A", specialty: "#D9B25A", rare: "#C8553D" } as const;
const CANON_TOOLS = Object.values(TOOL_BY_ID)
  .filter((x) => x.kind === "tool")
  .sort((a, b) => a.nameUk.localeCompare(b.nameUk, "uk"));

export default function BarScreen() {
  const c = useTheme();
  const t = useT();
  const all = useAllCocktails();
  const owned = useUserStore((s) => s.ownedIngredients);
  const addOwned = useUserStore((s) => s.addOwnedIngredient);
  const removeOwned = useUserStore((s) => s.removeOwnedIngredient);
  const ownedTools = useUserStore((s) => s.ownedTools);
  const toggleTool = useUserStore((s) => s.toggleOwnedTool);
  const flexible = useUserStore((s) => s.flexibleMatching);
  const setFlexible = useUserStore((s) => s.setFlexibleMatching);
  const [q, setQ] = useState("");
  const [onlyMyTools, setOnlyMyTools] = useState(false);

  const allNames = useMemo(() => {
    const set = new Set<string>();
    for (const ck of all) for (const ing of ck.ingredients) set.add(ing.name);
    return [...set].sort((a, b) => a.localeCompare(b, "uk"));
  }, [all]);
  const suggestions = useMemo(() => {
    if (normalize(q).length < 2) return [];
    const nq = normalize(q);
    return allNames.filter((n) => normalize(n).includes(nq) && !owned.includes(n)).slice(0, 8);
  }, [q, allNames, owned]);

  const { makeable, almost } = useMemo(() => {
    const r = whatCanIMake(all, owned, flexible);
    if (!onlyMyTools) return r;
    return {
      makeable: r.makeable.filter((m) => hasAllTools(m.cocktail, ownedTools)),
      almost: r.almost.filter((m) => hasAllTools(m.cocktail, ownedTools)),
    };
  }, [all, owned, flexible, onlyMyTools, ownedTools]);

  const buy = useMemo(() => suggestPurchases(all, owned, flexible).slice(0, 8), [all, owned, flexible]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.color.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Text style={[styles.h, { color: c.color.gold }]}>{t.bar.ingredients}</Text>
      {owned.length ? (
        <View style={styles.wrap}>
          {owned.map((name) => (
            <Pressable
              key={name}
              onPress={() => removeOwned(name)}
              style={[styles.owned, { borderColor: c.color.gold, backgroundColor: c.color.goldDim }]}
            >
              <Text style={{ color: c.color.text }}>{name} ✕</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={{ color: c.color.textDim, marginBottom: 8 }}>{t.bar.empty}</Text>
      )}
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder={t.bar.addIngredient}
        placeholderTextColor={c.color.textFaint}
        style={[
          styles.input,
          { backgroundColor: c.color.surfaceAlt, color: c.color.text, borderColor: c.color.border },
        ]}
      />
      {suggestions.map((s) => (
        <Pressable
          key={s}
          onPress={() => {
            addOwned(s);
            setQ("");
          }}
          style={[styles.sugg, { borderBottomColor: c.color.border }]}
        >
          <Text style={{ color: c.color.text }}>＋ {s}</Text>
        </Pressable>
      ))}

      <Text style={[styles.h, { color: c.color.gold, marginTop: 22 }]}>{t.bar.tools}</Text>
      <View style={styles.wrap}>
        {CANON_TOOLS.map((tool) => {
          const on = ownedTools.includes(tool.nameUk);
          return (
            <Pressable
              key={tool.id}
              onPress={() => toggleTool(tool.nameUk)}
              style={[
                styles.tool,
                {
                  borderColor: on ? c.color.gold : c.color.border,
                  backgroundColor: on ? c.color.goldDim : c.color.surfaceAlt,
                },
              ]}
            >
              <Text style={{ color: on ? c.color.text : c.color.textDim, fontSize: 13 }}>{tool.nameUk}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.flexRow}>
        <Text style={{ color: c.color.textDim, flex: 1 }}>Гнучкий підбір (заміни схожим)</Text>
        <Switch
          value={flexible}
          onValueChange={setFlexible}
          trackColor={{ true: c.color.goldDim }}
          thumbColor={flexible ? c.color.gold : undefined}
        />
      </View>
      <View style={styles.flexRow}>
        <Text style={{ color: c.color.textDim, flex: 1 }}>Лише з моїми інструментами</Text>
        <Switch
          value={onlyMyTools}
          onValueChange={setOnlyMyTools}
          trackColor={{ true: c.color.goldDim }}
          thumbColor={onlyMyTools ? c.color.gold : undefined}
        />
      </View>

      <Text style={[styles.h, { color: c.color.gold, marginTop: 24 }]}>
        {t.bar.makeable} ({makeable.length})
      </Text>
      {makeable.map((r) => (
        <MakeRow key={r.cocktail.id} r={r} c={c} />
      ))}

      {buy.length ? (
        <>
          <Text style={[styles.h, { color: c.color.gold, marginTop: 24 }]}>Що купити, щоб відкрити більше</Text>
          {buy.map((b) => (
            <View key={b.canonicalId} style={[styles.row, { borderBottomColor: c.color.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={[styles.dot, { backgroundColor: AVAIL_COLOR[availabilityOf(b.name)] }]} />
                <Text style={{ color: c.color.text, fontSize: 16, flex: 1 }}>{b.name}</Text>
                <Text style={{ color: c.color.gold }}>+{b.cocktails.length}</Text>
              </View>
              <Text style={{ color: c.color.textFaint, fontSize: 12, marginTop: 3 }} numberOfLines={1}>
                {b.cocktails
                  .slice(0, 4)
                  .map((x) => x.name)
                  .join(", ")}
                {b.cocktails.length > 4 ? "…" : ""}
              </Text>
            </View>
          ))}
        </>
      ) : null}

      <Text style={[styles.h, { color: c.color.gold, marginTop: 24 }]}>
        {t.bar.almost} ({almost.length})
      </Text>
      {almost.map((r) => (
        <MakeRow key={r.cocktail.id} r={r} c={c} showMissing />
      ))}
    </ScrollView>
  );
}

function MakeRow({ r, c, showMissing }: { r: MakeResult; c: ReturnType<typeof useTheme>; showMissing?: boolean }) {
  const t = useT();
  return (
    <Link href={`/cocktail/${r.cocktail.id}`} asChild>
      <Pressable style={[styles.row, { borderBottomColor: c.color.border }]}>
        <Text style={{ color: c.color.text, fontSize: 16 }}>{r.cocktail.name}</Text>
        {showMissing && r.missing.length ? (
          <Text style={{ color: c.color.danger, fontSize: 13, marginTop: 2 }}>
            {t.bar.missing}: {r.missing.map((m) => m.name).join(", ")}
          </Text>
        ) : null}
        {r.substitutions.length ? (
          <Text style={{ color: c.color.textDim, fontSize: 13, marginTop: 2 }}>
            заміни: {r.substitutions.map((s) => `${s.have} → ${s.required.name}`).join("; ")}
          </Text>
        ) : null}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  h: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  wrap: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  owned: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tool: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  input: { height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontSize: 15, marginTop: 4 },
  sugg: { paddingVertical: 12, borderBottomWidth: 1 },
  flexRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 },
  row: { paddingVertical: 12, borderBottomWidth: 1 },
  dot: { width: 9, height: 9, borderRadius: 5, marginRight: 8 },
});
