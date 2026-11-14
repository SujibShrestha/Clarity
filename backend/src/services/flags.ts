import { pool } from "../db/db.js";

export async function getFlaggedProductIds(): Promise<Set<string>> {
    const result = await pool.query(`SELECT product_id FROM product_flags WHERE flagged = true`);
    return new Set(result.rows.map(row => String(row.product_id)));
}

export async function isProductFlagged(productId: string): Promise<boolean> {
    const result = await pool.query(`SELECT flagged FROM product_flags WHERE product_id = $1`, [productId]);
    return result.rows[0]?.flagged === true;
}

export async function setProductFlagged(productId: string, flagged: boolean): Promise<boolean> {
     await pool.query(
        `INSERT INTO product_flags (product_id, flagged) VALUES ($1, $2)
         ON CONFLICT (product_id) DO UPDATE SET flagged = EXCLUDED.flagged, updatedat = NOW()`,
        [productId, flagged]
    );
    return flagged;

}