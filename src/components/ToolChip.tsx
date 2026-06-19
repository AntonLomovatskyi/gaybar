import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { toolInfo } from "@/data/catalog/tools";
import { useTheme } from "@/theme/theme";

export function ToolChip({ name }: { name: string }) {
  const c = useTheme();
  const router = useRouter();
  const info = toolInfo(name);
  return (
    <Pressable
      onPress={() => router.push(`/tool/${info.id}?name=${encodeURIComponent(name)}`)}
      style={[styles.chip, { borderColor: c.color.border, backgroundColor: c.color.surfaceAlt }]}
    >
      <MaterialCommunityIcons name={info.icon as never} size={16} color={c.color.gold} />
      <Text style={{ color: c.color.text, marginLeft: 6, fontSize: 13 }}>{name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
});
