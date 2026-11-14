import { Router } from "express";
import { queryDatabricks } from "../databricks/sql.js";
import { env } from "../config.js";
import { computeHealthStatus, healthLabel } from "../health/rules.js";
import { isProductFlagged, setProductFlagged } from "../services/flags.js";
import { getProductInsights } from "../services/brief.js";

const CATALOG = env.DATABASE_CATALOG;

export const productsRouter = Router();

type MetricsRow = {
    review_count: number | null;
    avg_rating: number | null;
    negative_pct: number | null;
}

type ProductListRow = MetricsRow & {
    product_id: string;
    name: string | null;
    category: string | null ;
    top_complaint: string | null;
}



function buildProductMetrics(row:MetricsRow | undefined){
 const productMetrics = {
  reviewCount : Number(row?.review_count ?? 0),
  avgRating : row?.avg_rating == null ? null : Number(row.avg_rating),
  negativePct : row?.negative_pct == null ? null : Number(row.negative_pct)
 }

 const healthStatus = computeHealthStatus(productMetrics)

 return {
  metrics: productMetrics,
  health :{ status: healthStatus , label: healthLabel(healthStatus) }

 }
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

   res.status(200).json({
      products: products.map((row) => ({ ...row, ...buildProductMetrics(row) })),
    });

    } catch (error) {
        const message =
      error instanceof Error ? error.message : "Failed to load products";
    res.status(500).json({ error: message });
    }

})

productsRouter.get("/:productId", async (req, res) => {
  const { productId } = req.params;
  try {
      const [productRows, metricsRows, categoryRows, sentimentRows,worstNegativeReview ,bestPositiveReview, flagged , productInsights] = await Promise.all([
        queryDatabricks(`
          SELECT product_id, name, category
          FROM ${CATALOG}.core.products 
          WHERE product_id = '${productId}'
          `),
        queryDatabricks<MetricsRow>(`
          SELECT review_count, avg_rating, negative_pct
          FROM (${METRICS_SUBQUERY}) metrics
          WHERE metrics.product_id = '${productId}'
          `),
          queryDatabricks(`
          SELECT enriched.complaint_category, COUNT(*) AS complaint_count
          FROM ${CATALOG}.core.enriched_reviews enriched
          WHERE enriched.product_id = '${productId}' 
          AND enriched.complaint_category IS NOT NULL
          GROUP BY enriched.complaint_category
          ORDER BY complaint_count DESC
          
          `),
          queryDatabricks(`
          SELECT enriched.sentiment, COUNT(*) AS sentiment_count
          FROM ${CATALOG}.core.enriched_reviews enriched
          WHERE enriched.product_id = '${productId}' 
          AND enriched.sentiment IS NOT NULL
          GROUP BY enriched.sentiment
          ORDER BY sentiment_count DESC
          `),
          queryDatabricks(`
          SELECT review.review_id, review.rating, review.text, enriched.sentiment, enriched.complaint_category
          FROM ${CATALOG}.core.reviews review
          JOIN ${CATALOG}.core.enriched_reviews enriched ON review.review_id = enriched.review_id
          WHERE enriched.product_id = '${productId}' 
          AND enriched.sentiment = 'negative' 
          ORDER BY review.rating ASC
          LIMIT 1
          `),
          queryDatabricks(`
          SELECT review.review_id, review.rating, review.text, enriched.sentiment, enriched.complaint_category
          FROM ${CATALOG}.core.reviews review
          JOIN ${CATALOG}.core.enriched_reviews enriched ON review.review_id = enriched.review_id
          WHERE enriched.product_id = '${productId}' 
          AND enriched.sentiment = 'positive'
          ORDER BY review.rating DESC
          LIMIT 1
          `),
          isProductFlagged(productId),
          getProductInsights(productId)
      ]
    

    );

    const productRow = productRows[0];
    if (!productRow) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    const {metrics, health} = buildProductMetrics(metricsRows[0]);
     const highlightReviewRow =
     health.status === "healthy" ? bestPositiveReview[0] : worstNegativeReview[0];

     res.json({
      productId : productRow.product_id,
      name : productRow.name,
      category : productRow.category,
      metrics,
      health,
      flagged,
      summary : productInsights.summary,
      nextStep : productInsights.nextStep,
      highlightReview:highlightReviewRow?{
        text:highlightReviewRow.text,
        rating:highlightReviewRow.rating,
        sentiment:highlightReviewRow.sentiment,
      }:null,
      topComplaint  : categoryRows[0]?
      parseComplaintCategory(categoryRows[0].complain_category)??
      categoryRows[0].complaint_category : null,
      topCategories:categoryRows.map((c)=>({
        category : parseComplaintCategory(c,c.complain_category),
        count : Number(c.complaint_count)
      })),

      sentimentBreakDown: sentimentRows.map((sentiment)=>({
        sentiment: sentiment.sentiment,
        count:Number(sentiment.sentiment_count)
      }))
     })

    }catch(error){
      const message =
      error instanceof Error ? error.message : "Failed to load product";
    res.status(500).json({ error: message });
    }
  })

function parseComplaintCategory(
  value: unknown,
  fallback?: unknown,
): string | null {
  const candidate =
    value && typeof value === "object"
      ? (value as Record<string, unknown>).complaint_category ??
        (value as Record<string, unknown>).complain_category
      : value ?? fallback;

  if (typeof candidate !== "string") {
    return candidate == null ? null : String(candidate);
  }

  const category = candidate.trim();
  return category.length > 0 ? category : null;
}


productsRouter.put("/:productId/flag", async (req, res) => {
   const { productId } = req.params;
  const  flagged  =Boolean(req.body?.flagged);
  try {
    const updatedFlag = await setProductFlagged(productId, flagged); 
    res.json({productId, flagged: updatedFlag});

  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update product flag";
    res.status(500).json({ error: message });
  }
});