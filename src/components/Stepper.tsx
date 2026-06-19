import { Minus, Plus } from "lucide-react";

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="grid h-8 w-8 place-items-center rounded-full border border-border text-text disabled:opacity-40"
        disabled={value <= min}
        aria-label="−"
      >
        <Minus size={16} />
      </button>
      <span className="w-6 text-center text-text tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="grid h-8 w-8 place-items-center rounded-full border border-border text-text disabled:opacity-40"
        disabled={value >= max}
        aria-label="+"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
