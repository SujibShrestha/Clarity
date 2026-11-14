import { useCallback, useEffect, useState } from "react";
import type { HealthStatus } from "../components/product-card";

export type ProductDetail = {
  productId: string;
  name: string | null;
  category: string | null;
  metrics: {
    reviewCount: number;
    avgRating: number | null;
    negativePct: number | null;
  };
  health: { status: HealthStatus; label: string };
  flagged: boolean;
  summary: string;
  nextStep: string;
  highlightReview: {
    text: string;
    rating: number;
    sentiment: string;
  } | null;
  topComplaint: string | null;
  topCategories: { category: string | null; count: number }[];
  sentimentBreakDown: { sentiment: string; count: number }[];
};

export type ProductDetailState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "error"; message: string }
  | { status: "ready"; detail: ProductDetail };

export function useProductDetail(productId: string) {
  const [state, setState] = useState<ProductDetailState>({ status: "loading" });

  const reload = useCallback(() => {
    setState({ status: "loading" });
    fetch(`/api/products/${productId}`)
      .then(async (res) => {
        if (res.status === 404) {
          setState({ status: "not_found" });
          return;
        }
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const detail: ProductDetail = await res.json();
        setState({ status: "ready", detail });
      })
      .catch((err) => {
        setState({
          status: "error",
          message:
            err instanceof Error ? err.message : "Failed to load product",
        });
      });
  }, [productId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { state, reload };
}

export async function putProductFlag(
  productId: string,
  flagged: boolean,
): Promise<boolean> {
  const res = await fetch(`/api/products/${productId}/flag`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ flagged }),
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const data: { flagged: boolean } = await res.json();
  return data.flagged;
}
