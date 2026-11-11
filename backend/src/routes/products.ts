import { Router } from "express";
import { queryDatabricks } from "../databricks/sql.js";
import { env } from "../config.js";

const CATALOG = env.DATABASE_CATALOG;

export const productsRouter = Router();

type MetricsRow = {
    review_count: number|null;
    average_rating: number | null;
    negative_review_count: number  | null;
}

type ProductListRow = MetricsRow & {
    product_id: string;
    name: string | null;
    category: string | null ;
    top_complaint: string | null;
}

const METRICS_SUBQUERY = `
  SELECT
    enriched.product_id,
    COUNT(*) AS review_count,
    AVG(review.rating) AS avg_rating,
    100.0 * SUM(CASE WHEN enriched.sentiment = 'negative' THEN 1 ELSE 0 END) / COUNT(*) AS negative_pct
  FROM ${CATALOG}.core.enriched_reviews enriched
  JOIN ${CATALOG}.core.reviews review ON enriched.review_id = review.review_id
  GROUP BY enriched.product_id
`;

productsRouter.get("/", async (_req, res) => {
    try {
        const products = await queryDatabricks<ProductListRow>(`
             SELECT
        product.product_id,
        product.name,
        product.category,
        metrics.review_count,
        metrics.avg_rating,
        metrics.negative_pct,
        (
          SELECT enriched.complaint_category
          FROM ${CATALOG}.core.enriched_reviews enriched
          WHERE enriched.product_id = product.product_id
            AND enriched.complaint_category IS NOT NULL
          GROUP BY enriched.complaint_category
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) AS top_complaint
      FROM ${CATALOG}.core.products product
      LEFT JOIN (${METRICS_SUBQUERY}) metrics ON product.product_id = metrics.product_id
      ORDER BY product.name
            
            
            
            `);

   res.status(200).json({ products });

    } catch (error) {
        const message =
      error instanceof Error ? error.message : "Failed to load products";
    res.status(500).json({ error: message });
    }

})