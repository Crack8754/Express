import express from "express";
import { randomUUID } from "node:crypto";
import { readEvents, writeEvents } from "./fileEventStore.js";

const app = express();
type EventInput = { title?: unknown; date?: unknown };

app.use(express.json());

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasValidEventFields(body: EventInput): body is { title: string; date: string } {
  return isNonEmptyString(body.title) && isNonEmptyString(body.date);
}

function sendValidationError(res: express.Response, message: string) {
  return res.status(400).json({ message });
}

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "campushub-api", timestamp: new Date().toISOString() });
});

app.get("/api/events-from-file", async (req, res) => {
  try {
    const events = await readEvents();
    const { date, title } = req.query;
    const filteredEvents = events.filter((event: { date: string; title: string }) =>
      (typeof date !== "string" || event.date === date) &&
      (typeof title !== "string" || event.title.toLowerCase().includes(title.toLowerCase()))
    );
    res.status(200).json(filteredEvents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Не вдалося прочитати або зберегти події" });
  }
});

app.post("/api/events-from-file", async (req, res) => {
  const body: EventInput = req.body ?? {};
  if (!hasValidEventFields(body)) return sendValidationError(res, "Поля title і date є обов'язковими непорожніми рядками");

  try {
    const events = await readEvents();
    const newEvent = { id: randomUUID(), title: body.title.trim(), date: body.date.trim() };
    events.push(newEvent);
    await writeEvents(events);
    return res.status(201).json(newEvent);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Не вдалося прочитати або зберегти події" });
  }
});

app.put("/api/events-from-file/:id", async (req, res) => {
  const body: EventInput = req.body ?? {};
  if (!hasValidEventFields(body)) return sendValidationError(res, "Для PUT потрібні поля title і date як непорожні рядки");

  try {
    const events = await readEvents();
    const index = events.findIndex((event: { id: string }) => event.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: "Подію не знайдено" });
    const updatedEvent = { id: req.params.id, title: body.title.trim(), date: body.date.trim() };
    events[index] = updatedEvent;
    await writeEvents(events);
    return res.status(200).json(updatedEvent);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Не вдалося прочитати або зберегти події" });
  }
});

app.patch("/api/events-from-file/:id", async (req, res) => {
  const body: EventInput = req.body ?? {};
  const updatesTitle = body.title !== undefined;
  const updatesDate = body.date !== undefined;
  if ((!updatesTitle && !updatesDate) || (updatesTitle && !isNonEmptyString(body.title)) || (updatesDate && !isNonEmptyString(body.date))) {
    return sendValidationError(res, "PATCH має містити title або date як непорожній рядок");
  }

  try {
    const events = await readEvents();
    const index = events.findIndex((event: { id: string }) => event.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: "Подію не знайдено" });
    const event = events[index];
    const updatedEvent = {
      ...event,
      ...(updatesTitle ? { title: (body.title as string).trim() } : {}),
      ...(updatesDate ? { date: (body.date as string).trim() } : {})
    };
    events[index] = updatedEvent;
    await writeEvents(events);
    return res.status(200).json(updatedEvent);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Не вдалося прочитати або зберегти події" });
  }
});

app.delete("/api/events-from-file/:id", async (req, res) => {
  try {
    const events = await readEvents();
    const index = events.findIndex((event: { id: string }) => event.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: "Подію не знайдено" });
    events.splice(index, 1);
    await writeEvents(events);
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Не вдалося прочитати або зберегти події" });
  }
});

app.use((_req, res) => {
  res.status(404).json({ message: "Маршрут не знайдено" });
});

export default app;
