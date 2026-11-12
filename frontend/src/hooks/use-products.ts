import { useCallback, useEffect, useState } from "react";
import type { Product } from "../components/product-card";

export type ProductsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; products: Product[] };

export function useProducts() {
  const [state, setState] = useState<ProductsState>({ status: "loading" });

  const reload = useCallback(() => {
    setState({ status: "loading" });
    fetch("/api/products")
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data: { products?: Product[] } = await res.json();
        setState({ status: "ready", products: data.products ?? [] });
      })
      .catch((err) => {
        setState({
          status: "error",
          message:
            err instanceof Error ? err.message : "Failed to load products",
        });
      });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { state, reload };
}
