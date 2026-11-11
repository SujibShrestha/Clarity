import { DBSQLClient } from "@databricks/sql";
import { env } from "../config.js";

let client: DBSQLClient | null = null;
let session: Awaited<ReturnType<DBSQLClient["openSession"]>> | null = null;

async function getSession() {
  if (!client) {
    client = new DBSQLClient();

    await client.connect({
      host: env.DATABRICKS_SERVER_HOSTNAME,
      token: env.DATABRICKS_TOKEN,
      path: env.DATABRICKS_HTTP_PATH,
    });
  }
  if (!session) {
    session = await client.openSession();
  }

  return session;
}

export async function queryDatabricks<T extends Record<string, unknown>>(
  sql: string,
): Promise<T[]> {
  const exactSession = await getSession();
  const sqlOperationResult = await exactSession.executeStatement(sql, {
    runAsync: true,
  });
  const rows = (await sqlOperationResult.fetchAll()) as T[];
  await sqlOperationResult.close();
  return rows
}

export async function pingDatabricks(): Promise<boolean> {
    const rows = await queryDatabricks("SELECT 1");
    return rows.length > 0;
}
