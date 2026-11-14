import { useEffect, useState } from "react";
import { SpinnerIcon } from "@phosphor-icons/react";

// Stages mirror what GET /api/products/:id does (SQL metrics, then two ai_gen calls).
const STEPS = [
  "Loading product details",
  "Gathering review metrics",
  "Reading complaints & sentiment",
  "Creating summary with AI",
  "Generating next steps",
];

const STEP_INTERVAL_MS = 2500;

export function DetailLoading() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => Math.min(i + 1, STEPS.length - 1)),
      STEP_INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <section
      role="status"
      aria-live="polite"
      className="brutal bg-card p-6 text-left"
    >
      <div className="mb-4 flex items-center gap-2">
        <SpinnerIcon
          weight="bold"
          aria-hidden="true"
          className="size-5 animate-spin text-brutal-pink"
        />
        <h1 className="text-xl">Crunching reviews…</h1>
      </div>

      <ol className="flex flex-col gap-2">
        {STEPS.map((step, i) => {
          const done = i < index;
          const current = i === index;
          return (
            <li
              key={step}
              className={[
                "flex items-center gap-2 border-2 px-3 py-2 text-xs font-black tracking-wide uppercase transition-colors",
                current
                  ? "border-ink bg-brutal-yellow"
                  : "border-transparent text-muted-foreground",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className={[
                  "flex size-4 shrink-0 items-center justify-center border-2 border-ink text-[10px] leading-none",
                  done ? "bg-brutal-green" : "bg-background",
                ].join(" ")}
              >
                {done ? "✓" : ""}
              </span>
              {step}
              {current && <span className="animate-pulse">…</span>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
