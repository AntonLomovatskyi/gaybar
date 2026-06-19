import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Stepper } from "@/components/Stepper";
import { MOODS } from "@/data/catalog/moods";
import { useAllCocktails } from "@/data/useCocktails";
import { CURATED_SETS } from "@/data/sets";
import { composeParty, MIN_PEOPLE, planFromSet } from "@/domain/party";
import { useT } from "@/i18n";
import { usePartyStore } from "@/store/partyStore";
import { useTheme } from "@/theme/theme";

export default function SetsScreen() {
  const c = useTheme();
  const t = useT();
  const router = useRouter();
  const { config, setConfig, setPlan } = usePartyStore();
  const all = useAllCocktails();
  const [mood, setMood] = useState<string | null>(null);

  const Row = ({
    label,
    value,
    onChange,
    max,
    min,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    max?: number;
    min?: number;
  }) => (
    <View style={styles.cfgRow}>
      <Text style={{ color: c.color.text, fontSize: 15 }}>{label}</Text>
      <Stepper value={value} onChange={onChange} max={max} min={min} />
    </View>
  );

  const total = config.people * config.drinksPerPerson;

  const generate = () => {
    const moodTags = mood ? (MOODS.find((m) => m.key === mood)?.tags ?? []) : [];
    const items = composeParty(all, config, moodTags);
    setPlan(
      items.map((i) => ({ id: i.cocktail.id, servings: i.servings })),
      mood ? MOODS.find((m) => m.key === mood)!.labelUk : "Згенерований сет",
    );
    router.push("/set/plan");
  };

  const openCurated = (setId: string) => {
    const set = CURATED_SETS.find((s) => s.id === setId)!;
    const cocktails = set.cocktailIds
      .map((cid) => all.find((c) => c.id === cid))
      .filter((x): x is NonNullable<typeof x> => !!x);
    const items = planFromSet(cocktails, config);
    setPlan(
      items.map((i) => ({ id: i.cocktail.id, servings: i.servings })),
      set.title,
    );
    router.push("/set/plan");
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.color.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Text style={[styles.h, { color: c.color.gold }]}>{t.sets.builder}</Text>
      <View style={[styles.card, { backgroundColor: c.color.surface, borderColor: c.color.border }]}>
        <Row
          label={t.sets.people}
          value={config.people}
          onChange={(v) => setConfig({ people: v })}
          max={30}
          min={MIN_PEOPLE}
        />
        <Row label={t.sets.varieties} value={config.varieties} onChange={(v) => setConfig({ varieties: v })} max={12} />
        <Row
          label={t.sets.drinksPerPerson}
          value={config.drinksPerPerson}
          onChange={(v) => setConfig({ drinksPerPerson: v })}
          max={10}
        />
        <View style={styles.cfgRow}>
          <Text style={{ color: c.color.text, fontSize: 15, flex: 1 }}>{t.sets.localOnly}</Text>
          <Switch
            value={config.localOnly}
            onValueChange={(v) => setConfig({ localOnly: v })}
            trackColor={{ true: c.color.goldDim }}
            thumbColor={config.localOnly ? c.color.gold : undefined}
          />
        </View>
        <Text style={{ color: c.color.textDim, fontSize: 13, marginTop: 4 }}>
          {t.sets.total}: {total}
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          {MOODS.map((m) => (
            <Pressable
              key={m.key}
              onPress={() => setMood(mood === m.key ? null : m.key)}
              style={[
                styles.mood,
                {
                  backgroundColor: mood === m.key ? c.color.goldDim : c.color.surfaceAlt,
                  borderColor: mood === m.key ? c.color.gold : c.color.border,
                },
              ]}
            >
              <Text style={{ color: c.color.text }}>
                {m.emoji} {m.labelUk}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable onPress={generate} style={[styles.cta, { backgroundColor: c.color.gold }]}>
          <Text style={{ color: c.color.bg, fontWeight: "700", fontSize: 16 }}>🎉 {t.sets.generate}</Text>
        </Pressable>
      </View>

      <Text style={[styles.h, { color: c.color.gold, marginTop: 24 }]}>{t.sets.curated}</Text>
      {CURATED_SETS.map((s) => (
        <Pressable
          key={s.id}
          onPress={() => openCurated(s.id)}
          style={[styles.setRow, { backgroundColor: c.color.surface, borderColor: c.color.border }]}
        >
          <Text style={{ color: c.color.text, fontSize: 16, fontWeight: "600" }}>{s.title}</Text>
          <Text style={{ color: c.color.textDim, fontSize: 13, marginTop: 2 }}>
            {s.subtitle} · {s.cocktailIds.length} коктейлів
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  h: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14 },
  cfgRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  mood: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
  cta: { marginTop: 16, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  setRow: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
});
