import { useKeepAwake } from "expo-keep-awake";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useCocktailById } from "@/data/useCocktails";
import { formatIngredient, stepProgress } from "@/domain/cocktails";
import { useT } from "@/i18n";
import { useUserStore } from "@/store/userStore";
import { useTheme } from "@/theme/theme";

export default function MakeScreen() {
  useKeepAwake();
  const c = useTheme();
  const t = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const cocktail = useCocktailById(id);
  const logPreparation = useUserStore((s) => s.logPreparation);
  const units = useUserStore((s) => s.units);
  const [index, setIndex] = useState(-1); // -1 = mise en place
  const [done, setDone] = useState(false);

  if (!cocktail || !id) {
    return (
      <View style={styles.center}>
        <Text style={{ color: c.color.textDim }}>Коктейль не знайдено</Text>
      </View>
    );
  }

  const total = cocktail.steps.length;

  if (done) {
    return (
      <View style={[styles.center, { padding: 24 }]}>
        <Stack.Screen options={{ title: cocktail.name }} />
        <Text style={{ fontSize: 48 }}>🍸</Text>
        <Text style={[styles.finished, { color: c.color.text }]}>{t.stepper.finished}</Text>
        <Pressable style={[styles.cta, { backgroundColor: c.color.gold }]} onPress={() => router.back()}>
          <Text style={{ color: c.color.bg, fontWeight: "700" }}>OK</Text>
        </Pressable>
      </View>
    );
  }

  const isMise = index < 0;
  const prog = stepProgress(total, index);

  return (
    <View style={{ flex: 1, backgroundColor: c.color.bg }}>
      <Stack.Screen options={{ title: cocktail.name }} />
      <View style={[styles.bar, { backgroundColor: c.color.surfaceAlt }]}>
        <View style={{ width: `${isMise ? 0 : prog.pct * 100}%`, height: "100%", backgroundColor: c.color.gold }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {isMise ? (
          <>
            <Text style={[styles.kicker, { color: c.color.gold }]}>{t.recipe.ingredients}</Text>
            {cocktail.ingredients.map((ing, i) => (
              <Text key={i} style={[styles.miseLine, { color: c.color.text }]}>
                • {formatIngredient(ing, 1, units)}
              </Text>
            ))}
            <Text style={[styles.kicker, { color: c.color.gold, marginTop: 18 }]}>{t.recipe.tools}</Text>
            <Text style={[styles.miseLine, { color: c.color.text }]}>{cocktail.tools.join(", ")}</Text>
          </>
        ) : (
          <>
            <Text style={[styles.kicker, { color: c.color.gold }]}>
              {t.stepper.step} {prog.current} {t.stepper.of} {prog.total}
            </Text>
            <Text style={[styles.stepText, { color: c.color.text }]}>{cocktail.steps[index]}</Text>
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: c.color.border }]}>
        <Pressable
          disabled={isMise}
          onPress={() => setIndex((i) => Math.max(-1, i - 1))}
          style={[styles.navBtn, { borderColor: c.color.border, opacity: isMise ? 0.4 : 1 }]}
        >
          <Text style={{ color: c.color.text }}>← {t.stepper.back}</Text>
        </Pressable>
        {index >= total - 1 ? (
          <Pressable
            onPress={() => {
              logPreparation(id, Date.now());
              setDone(true);
            }}
            style={[styles.navBtn, { backgroundColor: c.color.gold, borderColor: c.color.gold }]}
          >
            <Text style={{ color: c.color.bg, fontWeight: "700" }}>{t.stepper.done} ✓</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => setIndex((i) => i + 1)}
            style={[styles.navBtn, { backgroundColor: c.color.gold, borderColor: c.color.gold }]}
          >
            <Text style={{ color: c.color.bg, fontWeight: "700" }}>{t.stepper.next} →</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  bar: { height: 4, width: "100%" },
  body: { padding: 24, paddingTop: 32, flexGrow: 1 },
  kicker: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 },
  stepText: { fontSize: 26, lineHeight: 38 },
  miseLine: { fontSize: 17, lineHeight: 28 },
  finished: { fontSize: 24, fontWeight: "700", marginVertical: 16 },
  footer: { flexDirection: "row", gap: 12, padding: 16, borderTopWidth: 1 },
  navBtn: { flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 12, borderWidth: 1 },
  cta: { marginTop: 24, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 },
});
