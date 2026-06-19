import { useWindowDimensions } from "react-native";

export const GRID_GAP = 6;

/** Responsive column count: 3 on phones, more on tablets/web. Cards use flex + maxWidth%. */
export function useGridColumns(): number {
  const { width } = useWindowDimensions();
  return Math.max(3, Math.min(7, Math.floor(width / 140)));
}
