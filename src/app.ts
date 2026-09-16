import express from "express";
import { randomUUID } from "node:crypto";
import { DataFileError, readEvents, writeEvents } from "./fileEventStore.js";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "campushub-api",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/events-from-file", async (_req, res) => {
  try {
    const events = await readEvents();

    res.status(200).json(events);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Не вдалося прочитати або зберегти події"
    });
  }
});

app.post("/api/events-from-file", async (req, res) => {
  try {
    const { title, date } = req.body;

    const events = await readEvents();

    const newEvent = {
      id: randomUUID(),
      title,
      date
    };

    events.push(newEvent);

    await writeEvents(events);

    res.status(201).json(newEvent);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Не вдалося прочитати або зберегти події"
    });
  }
});

export default app;