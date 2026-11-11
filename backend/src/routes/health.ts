import {Router} from "express";
import { pingDatabricks } from "../databricks/sql.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
    const databricks = await pingDatabricks().catch(()=>false);
 return res.status(200).json({ status: "ok", services: { databricks: databricks  } });
})   