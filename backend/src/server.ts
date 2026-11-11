import express, { type Request, type Response } from "express";
import cors from "cors";
import { env } from "./config.js";

const app = express();

app.use(cors());
app.use(express.json());

//ROUTES

app.get("/", (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "Backend Api is running",
  });
});

app.listen(env.PORT, () => {
  console.log("Backend Api is running on port " + env.PORT);
});
