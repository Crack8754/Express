import express from "express";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "campushub-api",
    timestamp: new Date().toISOString()
  });
});

export default app;