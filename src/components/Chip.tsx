import { Pressable, StyleSheet, Text } from "react-native";
import { useTheme } from "@/theme/theme";

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.chip,
        {
          borderColor: selected ? c.color.gold : c.color.border,
          backgroundColor: selected ? c.color.goldDim : c.color.surfaceAlt,
        },
      ]}
    >
      <Text style={[styles.label, { color: selected ? c.color.text : c.color.textDim }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  label: { fontSize: 13 },
});
