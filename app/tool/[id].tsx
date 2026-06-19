import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { TOOL_BY_ID } from "@/data/catalog/tools";
import { useTheme } from "@/theme/theme";

export default function ToolDetail() {
  const c = useTheme();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const info = id ? TOOL_BY_ID[id] : undefined;
  const title = info?.nameUk ?? name ?? "Інструмент";
  const icon = info?.icon ?? "silverware-variant";

  return (
    <View style={[styles.c, { backgroundColor: c.color.bg }]}>
      <Stack.Screen options={{ title }} />
      <View style={[styles.badge, { borderColor: c.color.border, backgroundColor: c.color.surface }]}>
        <MaterialCommunityIcons name={icon as never} size={120} color={c.color.gold} />
      </View>
      <Text style={[styles.title, { color: c.color.text }]}>{title}</Text>
      {info?.desc ? <Text style={[styles.desc, { color: c.color.textDim }]}>{info.desc}</Text> : null}
      {name && info && name !== info.nameUk ? (
        <Text style={[styles.alias, { color: c.color.textFaint }]}>на картці: {name}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, alignItems: "center", paddingTop: 48, paddingHorizontal: 28 },
  badge: { width: 200, height: 200, borderRadius: 24, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "700", marginTop: 24, textAlign: "center" },
  desc: { fontSize: 16, lineHeight: 24, marginTop: 12, textAlign: "center" },
  alias: { fontSize: 13, marginTop: 16 },
});
