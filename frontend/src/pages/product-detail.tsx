import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  FlagBannerIcon,
  StarIcon,
} from "@phosphor-icons/react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { DetailLoading } from "../components/detail-loading";
import { Stat } from "../components/product-card";
import {
  putProductFlag,
  useProductDetail,
  type ProductDetail,
} from "../hooks/use-product-detail";

const sentimentColor: Record<string, string> = {
  positive: "bg-brutal-green",
  neutral: "bg-brutal-blue",
  negative: "bg-brutal-red text-white",
};

function sentimentBadge(sentiment: string) {
  return sentimentColor[sentiment] ?? "bg-muted";
}

function Box({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className="brutal bg-card p-4">
      <h2
        className={`mb-2 inline-block border-2 border-ink px-2 py-1 text-xs font-black tracking-wider uppercase ${accent}`}
      >
        {title}
      </h2>
      <div className="whitespace-pre-line text-left text-sm leading-relaxed font-medium">
        {children}
      </div>
    </section>
  );
}

function DetailBody({ detail }: { detail: ProductDetail }) {
  const [flagged, setFlagged] = useState(detail.flagged);
  const [toggling, setToggling] = useState(false);
  const [flagError, setFlagError] = useState<string | null>(null);

  useEffect(() => {
    setFlagged(detail.flagged);
  }, [detail.flagged]);

  async function toggleFlag() {
    const next = !flagged;
    setFlagged(next);
    setFlagError(null);
    setToggling(true);
    try {
      const saved = await putProductFlag(detail.productId, next);
      setFlagged(saved);
    } catch {
      setFlagged(!next);
      setFlagError("Could not save the flag — try again.");
    } finally {
      setToggling(false);
    }
  }

  const sentimentTotal =
    detail.sentimentBreakDown.reduce((sum, s) => sum + s.count, 0) || 1;
  const categoryMax =
    Math.max(...detail.topCategories.map((c) => c.count), 1);

  return (
    <div className="flex flex-col gap-6">
      <header className="brutal flex flex-wrap items-start justify-between gap-4 bg-brutal-yellow px-5 py-4">
        <div className="text-left">
          <Link
            to="/"
            className="mb-2 inline-flex items-center gap-1 text-xs font-black tracking-wider uppercase hover:underline"
          >
            <ArrowLeftIcon weight="bold" className="size-3.5" aria-hidden="true" />
            Back to products
          </Link>
          <h1 className="text-2xl leading-tight break-words sm:text-3xl">
            {detail.name ?? "Unnamed product"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {detail.category && (
              <Badge
                variant="outline"
                className="border-2 border-ink bg-brutal-pink px-2 font-bold text-foreground uppercase"
              >
                {detail.category}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge
            className={`border-2 border-ink px-3 py-1 text-sm font-black tracking-wide uppercase shadow-[2px_2px_0_0_#111] ${healthClass(detail.health.status)}`}
          >
            {detail.health.label}
          </Badge>
          <Button
            onClick={toggleFlag}
            disabled={toggling}
            aria-pressed={flagged}
            className={`brutal-press border-[3px] border-ink px-4 py-5 text-xs font-black tracking-wide uppercase shadow-brutal ${
              flagged
                ? "bg-brutal-yellow text-foreground"
                : "bg-card text-foreground hover:bg-muted"
            }`}
          >
            <FlagBannerIcon weight="bold" className="size-4" aria-hidden="true" />
            {flagged ? "Flagged" : "Flag product"}
          </Button>
          {flagError && (
            <p role="alert" className="text-xs font-bold text-brutal-red">
              {flagError}
            </p>
          )}
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Reviews" value={detail.metrics.reviewCount} />
        <Stat
          label="Rating"
          value={
            detail.metrics.avgRating != null
              ? `${detail.metrics.avgRating.toFixed(1)}★`
              : "—"
          }
        />
        <Stat
          label="Negative"
          value={
            detail.metrics.negativePct != null
              ? `${detail.metrics.negativePct.toFixed(0)}%`
              : "—"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Box title="Summary" accent="bg-brutal-blue">
          {detail.summary}
        </Box>
        <Box title="Next step" accent="bg-brutal-green">
          {detail.nextStep}
        </Box>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="brutal bg-card p-4 text-left">
          <h2 className="mb-3 text-xs font-black tracking-wider uppercase">
            Highlight review
          </h2>
          {detail.highlightReview ? (
            <figure className="border-l-[6px] border-ink pl-3">
              <blockquote className="text-sm leading-relaxed font-medium italic">
                “{detail.highlightReview.text}”
              </blockquote>
              <figcaption className="mt-2 flex items-center gap-2">
                <Badge
                  className={`${sentimentBadge(detail.highlightReview.sentiment)} border-2 border-ink px-2 font-bold uppercase shadow-[2px_2px_0_0_#111]`}
                >
                  {detail.highlightReview.sentiment}
                </Badge>
                <span className="flex items-center gap-1 text-xs font-black">
                  <StarIcon weight="fill" className="size-3.5" aria-hidden="true" />
                  {Number(detail.highlightReview.rating).toFixed(1)}/5
                </span>
              </figcaption>
            </figure>
          ) : (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          )}
        </section>

        <section className="brutal bg-card p-4 text-left">
          <h2 className="mb-3 text-xs font-black tracking-wider uppercase">
            Sentiment breakdown
          </h2>
          <div className="flex flex-col gap-3">
            {detail.sentimentBreakDown.length === 0 && (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            )}
            {detail.sentimentBreakDown.map((s) => (
              <div key={s.sentiment}>
                <div className="mb-1 flex justify-between text-[11px] font-black tracking-wide uppercase">
                  <span>{s.sentiment}</span>
                  <span>{s.count}</span>
                </div>
                <div className="h-5 border-2 border-ink bg-muted">
                  <div
                    className={`h-full ${sentimentBadge(s.sentiment)}`}
                    style={{
                      width: `${Math.round((s.count / sentimentTotal) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="brutal bg-card p-4 text-left">
        <h2 className="mb-3 text-xs font-black tracking-wider uppercase">
          Top complaint categories
        </h2>
        {detail.topCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No complaints recorded.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {detail.topCategories.map((c) => (
              <div key={c.category ?? "general"}>
                <div className="mb-1 flex justify-between text-[11px] font-black tracking-wide uppercase">
                  <span>{c.category ?? "general"}</span>
                  <span>{c.count}</span>
                </div>
                <div className="h-5 border-2 border-ink bg-muted">
                  <div
                    className="h-full bg-brutal-pink"
                    style={{ width: `${Math.round((c.count / categoryMax) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function healthClass(status: ProductDetail["health"]["status"]) {
  switch (status) {
    case "healthy":
      return "bg-brutal-green text-foreground";
    case "needs_attention":
      return "bg-brutal-yellow text-foreground";
    case "critical":
      return "bg-brutal-red text-white";
    case "insufficient_data":
      return "bg-brutal-blue text-foreground";
  }
}

export function ProductDetailPage() {
  const { productId = "" } = useParams();
  const { state, reload } = useProductDetail(productId);

  if (state.status === "loading") {
    return (
      <main className="flex flex-col gap-6 pt-10">
        <DetailLoading />
      </main>
    );
  }

  if (state.status === "not_found") {
    return (
      <main className="flex flex-col items-start gap-4 pt-10">
        <div className="brutal w-full bg-card p-8 text-center">
          <h1 className="text-2xl">Product not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            It may have been removed from the catalog.
          </p>
        </div>
        <Link to="/">
          <Button className="brutal-press border-[3px] border-ink bg-brutal-blue px-4 py-5 text-sm font-black tracking-wide uppercase shadow-brutal">
            <ArrowLeftIcon weight="bold" className="size-4" aria-hidden="true" />
            Back to products
          </Button>
        </Link>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="flex flex-col items-start gap-4 pt-10">
        <div
          role="alert"
          className="brutal w-full bg-brutal-red p-6 text-white"
        >
          <h1 className="text-xl">Could not load product</h1>
          <p className="mt-2 text-sm font-bold">{state.message}</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={reload}
            className="brutal-press border-[3px] border-ink bg-white px-4 py-5 text-sm font-black tracking-wide text-foreground uppercase shadow-brutal"
          >
            Try again
          </Button>
          <Link to="/">
            <Button className="brutal-press border-[3px] border-ink bg-brutal-blue px-4 py-5 text-sm font-black tracking-wide text-foreground uppercase shadow-brutal">
              <ArrowLeftIcon weight="bold" className="size-4" aria-hidden="true" />
              Back to products
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-10">
      <DetailBody detail={state.detail} />
    </main>
  );
}
