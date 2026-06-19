import clsx from "clsx";

export function Chip({ label, selected, onClick }: { label: string; selected?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "shrink-0 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap transition",
        selected
          ? "border-gold bg-gold/15 text-text"
          : "border-border bg-surface-alt text-text-dim hover:border-gold/60",
      )}
    >
      {label}
    </button>
  );
}
