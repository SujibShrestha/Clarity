import pg from 'pg'
import { env } from '../config.js'

const parsed = new URL(env.DATABASE_URL || '')

parsed.searchParams.set('sslmode','verify-full')

export const pool = new pg.Pool({connectionString: parsed.toString()})

export async function ping(): Promise<boolean>{
  const client = await pool.connect()
  try {
    await client.query('SELECT 1')
    return true
  } catch (error) {
    return false
  } finally {
    client.release()
  }
}