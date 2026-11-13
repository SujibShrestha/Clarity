import {Router} from "express";
import { pingDatabricks } from "../databricks/sql.js";
import { ping } from "../db/db.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
   const [databricks,dbConnected] = await Promise.all([
     pingDatabricks().catch(()=>false),
     ping().catch(()=>false)
   ]);
 return res.status(200).json({ status: "ok", services: { databricks: databricks, database: dbConnected } });
})   