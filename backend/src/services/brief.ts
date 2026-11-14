import { env } from "../config.js";
import { queryDatabricks } from "../databricks/sql.js";

const FALLBACK_SUMMARY = "No summary available for this product.";
const FALLBACK_NEXT_STEP = "No next step available for this product.";

function escapeSqlString(value: string): string {
    return value.replaceAll("'", "''");
}

export async function loadReviewSnippets(productId: string){
    const reviewRows = await queryDatabricks<{
        text:string;
        sentiment:string;
        complaint_category : string;
    }>(`
       SELECT text, sentiment, complaint_category
       FROM ${env.DATABASE_CATALOG}.core.enriched_reviews enriched
       WHERE enriched.product_id = '${productId}'
       ORDER BY CASE WHEN enriched.sentiment = 'negative' THEN 1 ELSE 0 END DESC, RANDOM()
       LIMIT 5
        `)
        return reviewRows.map((row) => {
             const complaintCategory = row.complaint_category ?? "general";
             return `- ${row.text} (Sentiment: ${row.sentiment}, Complaint Category: ${complaintCategory})`;
        })
}

export async function getProductInsights(productId:string):Promise<{summary:string,nextStep:string}>{
    try {
        const reviewSnippets = await loadReviewSnippets(productId);
        const summaryPrompt = `You are a product analyst. Based on the following review snippets, provide a concise summary of the product's strengths and weaknesses. Review snippets: ${reviewSnippets}`;
        const nextStepPrompt = `You are a product analyst. Based on the following review snippets, provide a recommended next step for the product team to improve the product. Review snippets: ${reviewSnippets}`;

        const [ summaryRows, nextStepRows ] = await Promise.all([
            queryDatabricks<{summary:string}>(`
                SELECT ai_gen('${escapeSqlString(summaryPrompt)}') AS summary`),
            queryDatabricks<{next_step:string}>(`
                SELECT ai_gen('${escapeSqlString(nextStepPrompt)}') AS next_step`)
        ]);
        
        return {
            summary: summaryRows[0]?.summary ?? FALLBACK_SUMMARY,
            nextStep: nextStepRows[0]?.next_step ?? FALLBACK_NEXT_STEP
        }

    } catch (error)  {
        console.error(`Failed to generate insights for product ${productId}:`, error);
        return {summary:FALLBACK_SUMMARY,nextStep:FALLBACK_NEXT_STEP}
    }}