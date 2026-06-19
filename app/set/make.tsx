import { useKeepAwake } from "expo-keep-awake";
import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Cocktail } from "@/types/cocktail";
import { useAllCocktails } from "@/data/useCocktails";
import { formatIngredient, stepProgress } from "@/domain/cocktails";
import { useT } from "@/i18n";
import { usePartyStore } from "@/store/partyStore";
import { useUserStore } from "@/store/userStore";
import { useTheme } from "@/theme/theme";

export default function SetMakeScreen() {
  useKeepAwake();
  const c = useTheme();
  const t = useT();
  const router = useRouter();
  const items = usePartyStore((s) => s.items);
  const logPreparation = useUserStore((s) => s.logPreparation);
  const units = useUserStore((s) => s.units);
  const all = useAllCocktails();

  const seq = useMemo(
    () =>
      items
        .map((it) => {
          const cocktail = all.find((c) => c.id === it.id);
          return cocktail ? { cocktail, servings: it.servings } : null;
        })
        .filter((x): x is { cocktail: Cocktail; servings: number } => x !== null),
    [items, all],
  );

  const [cIdx, setCIdx] = useState(0);
  const [sIdx, setSIdx] = useState(-1); // -1 = mise en place
  const [done, setDone] = useState(false);

  if (!seq.length) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: t.sets.plan }} />
        <Text style={{ color: c.color.textDim }}>Порожній сет</Text>
      </View>
    );
  }

  if (done) {
    return (
      <View style={[styles.center, { padding: 24 }]}>
        <Stack.Screen options={{ title: t.sets.plan }} />
        <Text style={{ fontSize: 48 }}>🎉</Text>
        <Text style={[styles.finished, { color: c.color.text }]}>{t.stepper.finished}</Text>
        <Pressable
          style={[styles.cta, { backgroundColor: c.color.gold }]}
          onPress={() => router.dismissAll?.() ?? router.back()}
        >
          <Text style={{ color: c.color.bg, fontWeight: "700" }}>OK</Text>
        </Pressable>
      </View>
    );
  }

  const cur = seq[cIdx];
  const steps = cur.cocktail.steps;
  const isMise = sIdx < 0;
  const prog = stepProgress(steps.length, sIdx);

  const finishCocktail = () => logPreparation(cur.cocktail.id, Date.now());

  const next = () => {
    if (sIdx < steps.length - 1) {
      setSIdx(sIdx + 1);
    } else {
      finishCocktail();
      if (cIdx < seq.length - 1) {
        setCIdx(cIdx + 1);
        setSIdx(-1);
      } else {
        setDone(true);
      }
    }
  };
  const back = () => {
    if (sIdx > -1) setSIdx(sIdx - 1);
    else if (cIdx > 0) {
      const prev = seq[cIdx - 1];
      setCIdx(cIdx - 1);
      setSIdx(prev.cocktail.steps.length - 1);
    }
  };

  const atVeryStart = cIdx === 0 && isMise;
  const lastStepOfLast = cIdx === seq.length - 1 && sIdx >= steps.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: c.color.bg }}>
      <Stack.Screen options={{ title: `${cIdx + 1}/${seq.length} · ${cur.cocktail.name}` }} />
      <View style={[styles.bar, { backgroundColor: c.color.surfaceAlt }]}>
        <View style={{ width: `${isMise ? 0 : prog.pct * 100}%`, height: "100%", backgroundColor: c.color.gold }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[styles.cName, { color: c.color.text }]}>
          {cur.cocktail.name} <Text style={{ color: c.color.gold }}>×{cur.servings}</Text>
        </Text>
        {isMise ? (
          <>
            <Text style={[styles.kicker, { color: c.color.gold }]}>{t.recipe.ingredients}</Text>
            {cur.cocktail.ingredients.map((ing, i) => (
              <Text key={i} style={[styles.miseLine, { color: c.color.text }]}>
                • {formatIngredient(ing, 1, units)}
              </Text>
            ))}
            <Text style={[styles.kicker, { color: c.color.gold, marginTop: 16 }]}>{t.recipe.tools}</Text>
            <Text style={[styles.miseLine, { color: c.color.text }]}>{cur.cocktail.tools.join(", ")}</Text>
          </>
        ) : (
          <>
            <Text style={[styles.kicker, { color: c.color.gold }]}>
              {t.stepper.step} {prog.current} {t.stepper.of} {prog.total}
            </Text>
            <Text style={[styles.stepText, { color: c.color.text }]}>{steps[sIdx]}</Text>
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: c.color.border }]}>
        <Pressable
          disabled={atVeryStart}
          onPress={back}
          style={[styles.navBtn, { borderColor: c.color.border, opacity: atVeryStart ? 0.4 : 1 }]}
        >
          <Text style={{ color: c.color.text }}>← {t.stepper.back}</Text>
        </Pressable>
        <Pressable onPress={next} style={[styles.navBtn, { backgroundColor: c.color.gold, borderColor: c.color.gold }]}>
          <Text style={{ color: c.color.bg, fontWeight: "700" }}>
            {lastStepOfLast
              ? `${t.stepper.done} ✓`
              : !isMise && sIdx >= steps.length - 1
                ? `${t.sets.nextCocktail} →`
                : `${t.stepper.next} →`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  bar: { height: 4, width: "100%" },
  body: { padding: 24, paddingTop: 24, flexGrow: 1 },
  cName: { fontSize: 20, fontWeight: "700", marginBottom: 18 },
  kicker: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  stepText: { fontSize: 25, lineHeight: 36 },
  miseLine: { fontSize: 16, lineHeight: 26 },
  finished: { fontSize: 24, fontWeight: "700", marginVertical: 16 },
  footer: { flexDirection: "row", gap: 12, padding: 16, borderTopWidth: 1 },
  navBtn: { flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 12, borderWidth: 1 },
  cta: { marginTop: 24, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 },
});
