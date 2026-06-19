import type { ReactNode } from "react";

/**
 * Bespoke line-icons for every canonical bar tool / glass (keyed by ToolInfo.id).
 * Pure SVG with stroke=currentColor so they inherit theme colours; no licensing.
 */
const ICONS: Record<string, ReactNode> = {
  // ---- glassware ----
  "glass-flute": (
    <>
      <path d="M10 3h4l-.6 10a1.4 1.4 0 0 1-2.8 0z" />
      <path d="M12 13v7" />
      <path d="M9.5 20h5" />
    </>
  ),
  "glass-coupe": (
    <>
      <path d="M5 6h14c-.5 5-4.5 6.5-7 6.5S5.5 11 5 6Z" />
      <path d="M12 12.5V20" />
      <path d="M8 20h8" />
    </>
  ),
  "glass-martini": (
    <>
      <path d="M4.5 5h15L12 13Z" />
      <path d="M12 13v7" />
      <path d="M8 20h8" />
    </>
  ),
  "glass-wine": (
    <>
      <path d="M8 4h8c0 5.5-1.3 7.5-4 7.5S8 9.5 8 4Z" />
      <path d="M12 11.5V19.5" />
      <path d="M8.5 20h7" />
    </>
  ),
  "glass-collins": (
    <>
      <path d="M8 3h8l-.6 18H8.6Z" />
      <path d="M8.2 7h7.6" />
    </>
  ),
  "glass-rocks": (
    <>
      <path d="M7 9h10l-.5 11h-9Z" />
      <path d="M7.3 13h9.4" />
    </>
  ),
  "glass-tiki": (
    <>
      <path d="M9.5 3c-1.5 4-1.5 8 0 11v6h5v-6c1.5-3 1.5-7 0-11Z" />
      <path d="M9.2 8h5.6" />
    </>
  ),
  "glass-shot": (
    <>
      <path d="M9 11h6l-.6 9h-4.8Z" />
    </>
  ),
  // ---- tools ----
  shaker: (
    <>
      <path d="M10.4 2.6h3.2l.3 2.4h-3.8z" />
      <path d="M9 5h6l1.2 15H7.8z" />
      <path d="M8.3 9.5h7.4" />
    </>
  ),
  jigger: (
    <>
      <path d="M7.5 4h9l-4.5 8 4.5 8h-9l4.5-8z" />
    </>
  ),
  strainer: (
    <>
      <circle cx="9.5" cy="9.5" r="5.5" />
      <path d="M13.9 13.4 19.5 18.6" />
      <path d="M5 13.4c1 1.4 2-1.4 3 0s2-1.4 3 0" />
    </>
  ),
  "fine-strainer": (
    <>
      <path d="M5 7h14l-7 9z" />
      <path d="M19 7l3-1" />
      <path d="M7.5 9.5h9M9.4 12h5.2" />
    </>
  ),
  muddler: (
    <>
      <path d="M12 3v11" />
      <ellipse cx="12" cy="16.5" rx="2.7" ry="3" />
      <path d="M10.4 5.5h3.2M10.4 8h3.2" />
    </>
  ),
  "bar-spoon": (
    <>
      <path d="M12 3v15" />
      <ellipse cx="12" cy="19" rx="3" ry="1.6" />
      <path d="M10.5 6l3 1M10.5 9l3 1M10.5 12l3 1" />
    </>
  ),
  "citrus-press": (
    <>
      <path d="M4 13a8 8 0 0 1 16 0Z" />
      <path d="M12 6v7M7.5 13 12 7.5 16.5 13" />
      <path d="M9 16v1.5M15 16v1.5" />
    </>
  ),
  knife: (
    <>
      <path d="M4 15 16 7l1.6 2L6 16.5z" />
      <path d="M17.6 9 21 6.7" />
    </>
  ),
  blender: (
    <>
      <path d="M8 3h8l-1 10H9z" />
      <path d="M8.6 13h6.8l-.6 5H9.2z" />
      <path d="M11 8l2 2M13 8l-2 2" />
      <path d="M9.5 20h5" />
    </>
  ),
  torch: (
    <>
      <path d="M12 3c-2.5 3.5-2 7 0 7s2.5-3.5 0-7Z" />
      <path d="M9.5 12h5l-1 8h-3z" />
      <path d="M10.5 12v-2h3v2" />
    </>
  ),
  "ice-scoop": (
    <>
      <path d="M4 11h11a3 3 0 0 1 0 6l-7 1a4 4 0 0 1-4-4z" />
      <path d="M15 11l5-1.2" />
    </>
  ),
  pitcher: (
    <>
      <path d="M7 7h7l1 12H6z" />
      <path d="M14 7l3 1-1 3" />
      <path d="M15 10c3 0 3 6 0 6" />
    </>
  ),
  straws: (
    <>
      <path d="M8 21 12 6l2-2" />
      <path d="M12 21 16 7" />
    </>
  ),
  pick: (
    <>
      <path d="M12 21V6" />
      <circle cx="12" cy="5.5" r="2.6" />
    </>
  ),
  grater: (
    <>
      <path d="M9 3c0-1.4 6-1.4 6 0" />
      <path d="M8 3h8l1.5 16h-11z" />
      <path d="M9.6 7.5l1 .8M12 7.5l1 .8M9 11l1 .8M11.4 11l1 .8M13.8 11l1 .8" />
    </>
  ),
  sprayer: (
    <>
      <path d="M9 9h6v11H9z" />
      <path d="M10.5 9V6h3v3" />
      <path d="M10.5 6H7.5" />
      <path d="M9 11l-2 1" />
      <path d="M5.5 5.5h.01M5 7.5h.01M6 9h.01" />
      <path d="M9.5 15h5" />
    </>
  ),
};

const FALLBACK_GLASS = ICONS["glass-collins"];
const FALLBACK_TOOL = ICONS["bar-spoon"];

export function ToolIcon({ id, size = 22, className }: { id: string; size?: number; className?: string }) {
  const icon = ICONS[id] ?? (id.startsWith("glass-") ? FALLBACK_GLASS : FALLBACK_TOOL);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {icon}
    </svg>
  );
}
