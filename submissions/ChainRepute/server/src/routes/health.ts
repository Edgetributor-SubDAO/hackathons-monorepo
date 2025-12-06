import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: Date.now(),
    version: "1.0.0",
    service: "ChainRepute API",
  });
});
