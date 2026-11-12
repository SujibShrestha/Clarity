import { useMemo, useState } from "react";
import { ArrowsClockwiseIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Skeleton } from "./components/ui/skeleton";
import {
  ProductCard,
  type HealthStatus,
  type Product,
} from "./components/product-card";
import { useProducts } from "./hooks/use-products";

const STATUS_OPTIONS: { value: HealthStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "healthy", label: "Healthy" },
  { value: "needs_attention", label: "Needs Attention" },
  { value: "critical", label: "Critical" },
  { value: "insufficient_data", label: "Insufficient Data" },
];

const EMPTY: Product[] = [];

function App() {
  const { state, reload } = useProducts();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<HealthStatus | "all">("all");

  const products = state.status === "ready" ? state.products : EMPTY;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery =
        !q ||
        (p.name ?? "").toLowerCase().includes(q) ||
        (p.top_complaint ?? "").toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q);
      const matchesStatus = status === "all" || p.health.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [products, query, status]);

  return (
    <main className="flex flex-col gap-8 pt-10">
      <header className="brutal flex flex-wrap items-center justify-between gap-4 bg-brutal-yellow px-5 py-4">
        <div className="text-left">
          <h1 className="text-3xl leading-none sm:text-4xl">
            Clarity <span className="text-brutal-pink">//</span> Product Health
          </h1>
          <p className="mt-2 text-xs font-bold tracking-wider uppercase">
            Review sentiment, rated product by product
          </p>
        </div>
        <Button
          onClick={reload}
          disabled={state.status === "loading"}
          className="brutal-press border-[3px] border-ink bg-brutal-blue px-4 py-5 text-sm font-extrabold tracking-wide text-foreground uppercase shadow-brutal hover:bg-brutal-blue/80"
        >
          <ArrowsClockwiseIcon
            className="size-4"
            weight="bold"
            aria-hidden="true"
          />
          Refresh
        </Button>
      </header>

      {(state.status === "ready" || state.status === "error") && (
        <section
          aria-label="Filter products"
          className="brutal flex flex-wrap items-center gap-3 bg-card px-4 py-3"
        >
          <div className="relative min-w-56 flex-1">
            <MagnifyingGlassIcon
              weight="bold"
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, category, complaint…"
              aria-label="Search products"
              className="h-10 border-[3px] border-ink bg-background pl-9 text-sm font-bold placeholder:font-normal focus-visible:ring-2 focus-visible:ring-brutal-pink"
            />
          </div>

          <div role="group" aria-label="Filter by health status" className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const active = status === opt.value;
              return (
                <Button
                  key={opt.value}
                  size="sm"
                  aria-pressed={active}
                  onClick={() => setStatus(opt.value)}
                  className={[
                    "border-2 border-ink px-3 py-4 text-xs font-extrabold tracking-wide uppercase",
                    active
                      ? "bg-ink text-white shadow-[2px_2px_0_0_#111]"
                      : "bg-background text-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  {opt.label}
                </Button>
              );
            })}
          </div>
        </section>
      )}

      {state.status === "loading" && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="brutal bg-card p-4">
              <Skeleton className="mb-3 h-6 w-3/4" />
              <Skeleton className="mb-4 h-4 w-1/3" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {state.status === "error" && (
        <div
          role="alert"
          className="brutal flex flex-col items-start gap-3 bg-brutal-red p-6 text-white"
        >
          <h2 className="text-xl">Could not load products</h2>
          <p className="text-sm font-bold">{state.message}</p>
          <Button
            onClick={reload}
            className="brutal-press border-[3px] border-ink bg-white px-4 py-5 text-sm font-extrabold tracking-wide text-foreground uppercase shadow-brutal hover:bg-white/90"
          >
            Try again
          </Button>
        </div>
      )}

      {state.status === "ready" && products.length === 0 && (
        <div className="brutal bg-card p-8 text-center">
          <h2 className="text-xl">No products found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The catalog is empty — add products to get started.
          </p>
        </div>
      )}

      {state.status === "ready" && products.length > 0 && (
        <>
          <p
            aria-live="polite"
            className="text-xs font-bold tracking-wider uppercase"
          >
            Showing {visible.length} of {products.length} products
          </p>
          {visible.length === 0 ? (
            <div className="brutal bg-card p-8 text-center">
              <h2 className="text-xl">No matches</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Nothing matches “{query.trim()}” with the current status filter.
              </p>
              <Button
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                }}
                className="brutal-press mt-4 border-[3px] border-ink bg-brutal-yellow px-4 py-5 text-sm font-extrabold tracking-wide text-foreground uppercase shadow-brutal hover:bg-brutal-yellow/80"
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((product: Product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default App;
