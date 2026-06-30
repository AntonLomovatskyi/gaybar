import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** A small inline countdown for a recipe step (shake/stir/chill). Vibrates when it hits zero. */
export function StepTimer({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    ref.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (ref.current) window.clearInterval(ref.current);
          setRunning(false);
          if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([200, 100, 200]);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (ref.current) window.clearInterval(ref.current);
    };
  }, [running]);

  const done = remaining === 0;
  const label = `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, "0")}`;

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        onClick={() => {
          if (done) {
            setRemaining(seconds);
            setRunning(true);
          } else setRunning((v) => !v);
        }}
        className="flex items-center gap-1.5 rounded-full border border-gold/60 px-3 py-1 text-sm text-gold tabular-nums"
      >
        {running ? <Pause size={14} /> : <Play size={14} />}
        <Timer size={14} /> {label}
      </button>
      {(remaining !== seconds || done) && (
        <button
          onClick={() => {
            setRunning(false);
            setRemaining(seconds);
          }}
          aria-label="Скинути таймер"
          className="text-text-faint hover:text-text"
        >
          <RotateCcw size={15} />
        </button>
      )}
    </div>
  );
}

/** Suggest a timer length (seconds) for a step, or null if it doesn't need one. */
export function stepTimerSeconds(step: string): number | null {
  const s = step.toLowerCase();
  const min = s.match(/(\d+)\s*(хвилин\w*|хв)/);
  if (min) return Math.min(parseInt(min[1], 10) * 60, 3600);
  const sec = s.match(/(\d+)\s*(секунд\w*|сек|с)(?![а-яіїєґ'])/);
  if (sec) return Math.min(parseInt(sec[1], 10), 3600);
  if (/збий|шейк|труси|стряс/.test(s)) return 15;
  if (/перемішай|розмішай|помішай|мішай|стир/.test(s)) return 30;
  if (/настоюй|охолод|заморозь|почекай|зачекай/.test(s)) return 60;
  return null;
}
