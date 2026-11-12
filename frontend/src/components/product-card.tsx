import { Badge } from "./ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";

export type HealthStatus =
  | "healthy"
  | "needs_attention"
  | "critical"
  | "insufficient_data";

export type Product = {
  product_id: string;
  name: string | null;
  category: string | null;
  top_complaint: string | null;
  metrics: {
    reviewCount: number;
    avgRating: number | null;
    negativePct: number | null;
  };
  health: { status: HealthStatus; label: string };
};

const healthStyles: Record<HealthStatus, string> = {
  healthy: "bg-brutal-green",
  needs_attention: "bg-brutal-yellow",
  critical: "bg-brutal-red text-white",
  insufficient_data: "bg-brutal-blue",
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-2 border-ink bg-muted px-1 py-2 text-center">
      <div className="text-[10px] font-bold tracking-wider uppercase">
        {label}
      </div>
      <div className="text-lg leading-tight font-extrabold">{value}</div>
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { metrics, health } = product;

  return (
    <Card className="brutal-press gap-3 border-[3px] border-ink shadow-brutal ring-0">
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug font-extrabold break-words uppercase">
            {product.name ?? "Unnamed product"}
          </CardTitle>
          <Badge
            className={`${healthStyles[health.status]} shrink-0 border-2 border-ink px-2 py-0.5 text-[11px] font-bold tracking-wide text-foreground uppercase shadow-[2px_2px_0_0_#111]`}
          >
            {health.label}
          </Badge>
        </div>
        {product.category && (
          <Badge
            variant="outline"
            className="w-fit border-2 border-ink bg-brutal-pink px-2 text-[11px] font-bold text-foreground uppercase"
          >
            {product.category}
          </Badge>
        )}
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Reviews" value={metrics.reviewCount} />
          <Stat
            label="Rating"
            value={metrics.avgRating != null ? `${metrics.avgRating.toFixed(1)}★` : "—"}
          />
          <Stat
            label="Negative"
            value={metrics.negativePct != null ? `${metrics.negativePct.toFixed(0)}%` : "—"}
          />
        </div>
      </CardContent>

      <CardFooter className="flex-wrap items-center gap-1.5 border-t-[3px] border-ink pt-3">
        <span className="text-[10px] font-bold tracking-wider uppercase">
          Top complaint:
        </span>
        {product.top_complaint ? (
          <Badge
            variant="outline"
            className="border-2 border-ink bg-brutal-yellow px-2 font-bold text-foreground uppercase"
          >
            {product.top_complaint}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">none</span>
        )}
      </CardFooter>
    </Card>
  );
}
