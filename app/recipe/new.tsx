import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Chip } from "@/components/Chip";
import { TAG_GROUPS } from "@/data/catalog/taxonomy";
import { useAllCocktails } from "@/data/useCocktails";
import { normalize } from "@/domain/text";
import { useUserStore } from "@/store/userStore";
import { useTheme } from "@/theme/theme";
import { UNITS, type Cocktail, type CocktailTag, type Unit } from "@/types/cocktail";

interface IngRow {
  name: string;
  amount: string;
  unit: Unit | "";
}

export default function NewRecipeScreen() {
  const c = useTheme();
  const router = useRouter();
  const all = useAllCocktails();
  const addUserRecipe = useUserStore((s) => s.addUserRecipe);
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const editing = edit ? useUserStore.getState().userRecipes.find((r) => r.id === edit) : undefined;

  const [name, setName] = useState(editing?.name ?? "");
  const [glass, setGlass] = useState(editing?.glass ?? "");
  const [toolsStr, setToolsStr] = useState(editing?.tools.join(", ") ?? "");
  const [tags, setTags] = useState<CocktailTag[]>(editing?.tags ?? []);
  const [ings, setIngs] = useState<IngRow[]>(
    editing
      ? editing.ingredients.map((i) => ({
          name: i.name,
          amount: i.amount != null ? String(i.amount) : "",
          unit: (i.unit ?? "") as Unit | "",
        }))
      : [{ name: "", amount: "", unit: "мл" }],
  );
  const [steps, setSteps] = useState<string[]>(editing?.steps.length ? editing.steps : [""]);

  const toggleTag = (t: CocktailTag) => setTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
  const setIng = (i: number, patch: Partial<IngRow>) =>
    setIngs((p) => p.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const cycleUnit = (i: number) => {
    const opts: (Unit | "")[] = [...UNITS, ""];
    setIngs((p) => p.map((r, j) => (j === i ? { ...r, unit: opts[(opts.indexOf(r.unit) + 1) % opts.length] } : r)));
  };

  const save = () => {
    const cleanIngs = ings.filter((r) => r.name.trim());
    const cleanSteps = steps.map((s) => s.trim()).filter(Boolean);
    if (!name.trim() || !cleanIngs.length || !cleanSteps.length) {
      Alert.alert("Заповни рецепт", "Потрібні назва, хоча б один інгредієнт і один крок.");
      return;
    }
    let id = editing?.id ?? (normalize(name).replace(/\s+/g, "-") || "recipe");
    if (!editing) {
      const existing = new Set(all.map((x) => x.id));
      const base = id;
      let n = 2;
      while (existing.has(id)) id = `${base}-${n++}`;
    }

    const cocktail: Cocktail = {
      id,
      cardNumber: editing?.cardNumber ?? 900 + useUserStore.getState().userRecipes.length + 1,
      name: name.trim(),
      tags,
      ingredients: cleanIngs.map((r) => {
        const amt = parseFloat(r.amount.replace(",", "."));
        return {
          name: r.name.trim(),
          ...(Number.isFinite(amt) ? { amount: amt } : {}),
          ...(r.unit ? { unit: r.unit } : {}),
        };
      }),
      tools: toolsStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      steps: cleanSteps,
      ...(glass.trim() ? { glass: glass.trim() } : {}),
      images: {},
      source: {},
    };
    addUserRecipe(cocktail);
    router.replace(`/cocktail/${id}`);
  };

  const input = [
    styles.input,
    { backgroundColor: c.color.surfaceAlt, color: c.color.text, borderColor: c.color.border },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.color.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
    >
      <Stack.Screen options={{ title: editing ? "Редагувати рецепт" : "Новий рецепт" }} />

      <Text style={[styles.label, { color: c.color.gold }]}>Назва</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Напр. Мій спешл"
        placeholderTextColor={c.color.textFaint}
        style={input}
      />

      <Text style={[styles.label, { color: c.color.gold }]}>Теги</Text>
      {TAG_GROUPS.map((g) => (
        <View key={g.key} style={{ marginBottom: 6 }}>
          <Text style={{ color: c.color.textFaint, fontSize: 12, marginBottom: 4 }}>{g.labelUk}</Text>
          <View style={styles.wrap}>
            {g.tags.map((tag) => (
              <Chip key={tag} label={tag} selected={tags.includes(tag)} onPress={() => toggleTag(tag)} />
            ))}
          </View>
        </View>
      ))}

      <Text style={[styles.label, { color: c.color.gold }]}>Інгредієнти</Text>
      {ings.map((r, i) => (
        <View key={i} style={styles.ingRow}>
          <TextInput
            value={r.name}
            onChangeText={(v) => setIng(i, { name: v })}
            placeholder="інгредієнт"
            placeholderTextColor={c.color.textFaint}
            style={[input, { flex: 1, marginBottom: 0 }]}
          />
          <TextInput
            value={r.amount}
            onChangeText={(v) => setIng(i, { amount: v })}
            placeholder="к-сть"
            placeholderTextColor={c.color.textFaint}
            keyboardType="numeric"
            style={[input, { width: 64, marginBottom: 0 }]}
          />
          <Pressable onPress={() => cycleUnit(i)} style={[styles.unit, { borderColor: c.color.border }]}>
            <Text style={{ color: c.color.gold }}>{r.unit || "—"}</Text>
          </Pressable>
          <Pressable
            onPress={() => setIngs((p) => p.filter((_, j) => j !== i))}
            hitSlop={8}
            style={{ paddingHorizontal: 4 }}
          >
            <Text style={{ color: c.color.danger, fontSize: 18 }}>✕</Text>
          </Pressable>
        </View>
      ))}
      <Pressable
        onPress={() => setIngs((p) => [...p, { name: "", amount: "", unit: "мл" }])}
        style={[styles.add, { borderColor: c.color.border }]}
      >
        <Text style={{ color: c.color.text }}>＋ інгредієнт</Text>
      </Pressable>

      <Text style={[styles.label, { color: c.color.gold }]}>Кроки</Text>
      {steps.map((s, i) => (
        <View key={i} style={styles.ingRow}>
          <Text style={{ color: c.color.textDim, width: 20 }}>{i + 1}.</Text>
          <TextInput
            value={s}
            onChangeText={(v) => setSteps((p) => p.map((x, j) => (j === i ? v : x)))}
            placeholder="опиши крок"
            placeholderTextColor={c.color.textFaint}
            multiline
            style={[input, { flex: 1, marginBottom: 0 }]}
          />
          <Pressable
            onPress={() => setSteps((p) => p.filter((_, j) => j !== i))}
            hitSlop={8}
            style={{ paddingHorizontal: 4 }}
          >
            <Text style={{ color: c.color.danger, fontSize: 18 }}>✕</Text>
          </Pressable>
        </View>
      ))}
      <Pressable onPress={() => setSteps((p) => [...p, ""])} style={[styles.add, { borderColor: c.color.border }]}>
        <Text style={{ color: c.color.text }}>＋ крок</Text>
      </Pressable>

      <Text style={[styles.label, { color: c.color.gold }]}>Келих</Text>
      <TextInput
        value={glass}
        onChangeText={setGlass}
        placeholder="Напр. Рокс"
        placeholderTextColor={c.color.textFaint}
        style={input}
      />

      <Text style={[styles.label, { color: c.color.gold }]}>Інструменти (через кому)</Text>
      <TextInput
        value={toolsStr}
        onChangeText={setToolsStr}
        placeholder="Шейкер, Стрейнер, Джигер"
        placeholderTextColor={c.color.textFaint}
        style={input}
      />

      <Pressable onPress={save} style={[styles.cta, { backgroundColor: c.color.gold }]}>
        <Text style={{ color: c.color.bg, fontWeight: "700", fontSize: 16 }}>Зберегти рецепт</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 15, fontWeight: "700", marginTop: 20, marginBottom: 8 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 10,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap" },
  ingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  unit: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    minWidth: 52,
    alignItems: "center",
  },
  add: { borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center", marginBottom: 4 },
  cta: { marginTop: 28, paddingVertical: 15, borderRadius: 12, alignItems: "center" },
});
