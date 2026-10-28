import express from "express";
import { randomUUID } from "node:crypto";
import { readEvents, writeEvents } from "./fileEventStore.js";
import eventsRouter from "./routes/events.router.js";
import { requestId } from "./middleware/request-id.js";
import { logger } from "./middleware/logger.js";
import { notFound } from "./middleware/not-found.js";
import { errorHandler } from "./middleware/error-handler.js";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

const app = express();
type EventInput = { title?: unknown; date?: unknown };

app.use(requestId);
app.use(logger);

app.use(express.json());

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasValidEventFields(body: EventInput): body is { title: string; date: string } {
  return isNonEmptyString(body.title) && isNonEmptyString(body.date);
}

function sendValidationError(next: express.NextFunction, message: string) {
  return next(Object.assign(new Error(message), { statusCode: 400, code: "VALIDATION_ERROR" }));
}

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "campushub-api", timestamp: new Date().toISOString() });
});

app.use("/api/events", eventsRouter);

app.get("/api/events-from-file", async (req, res, next) => {
  try {
    const events = await readEvents();
    const { date, title } = req.query;
    const filteredEvents = events.filter((event: { date: string; title: string }) =>
      (typeof date !== "string" || event.date === date) &&
      (typeof title !== "string" || event.title.toLowerCase().includes(title.toLowerCase()))
    );
    res.status(200).json(filteredEvents);
  } catch (error) {
    return next(error);
  }
});

app.post("/api/events-from-file", async (req, res, next) => {
  const body: EventInput = req.body ?? {};
  if (!hasValidEventFields(body)) return sendValidationError(next, "Поля title і date є обов'язковими непорожніми рядками");

  try {
    const events = await readEvents();
    const newEvent = { id: randomUUID(), title: body.title.trim(), date: body.date.trim() };
    events.push(newEvent);
    await writeEvents(events);
    return res.status(201).json(newEvent);
  } catch (error) {
    return next(error);
  }
});

app.put("/api/events-from-file/:id", async (req, res, next) => {
  const body: EventInput = req.body ?? {};
  if (!hasValidEventFields(body)) return sendValidationError(next, "Для PUT потрібні поля title і date як непорожні рядки");

  try {
    const events = await readEvents();
    const index = events.findIndex((event: { id: string }) => event.id === req.params.id);
    if (index === -1) return next(Object.assign(new Error("Подію не знайдено"), { statusCode: 404, code: "EVENT_NOT_FOUND" }));
    const updatedEvent = { id: req.params.id, title: body.title.trim(), date: body.date.trim() };
    events[index] = updatedEvent;
    await writeEvents(events);
    return res.status(200).json(updatedEvent);
  } catch (error) {
    return next(error);
  }
});

app.patch("/api/events-from-file/:id", async (req, res, next) => {
  const body: EventInput = req.body ?? {};
  const updatesTitle = body.title !== undefined;
  const updatesDate = body.date !== undefined;
  if ((!updatesTitle && !updatesDate) || (updatesTitle && !isNonEmptyString(body.title)) || (updatesDate && !isNonEmptyString(body.date))) {
    return sendValidationError(next, "PATCH має містити title або date як непорожній рядок");
  }

  try {
    const events = await readEvents();
    const index = events.findIndex((event: { id: string }) => event.id === req.params.id);
    if (index === -1) return next(Object.assign(new Error("Подію не знайдено"), { statusCode: 404, code: "EVENT_NOT_FOUND" }));
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
    return next(error);
  }
});

app.delete("/api/events-from-file/:id", async (req, res, next) => {
  try {
    const events = await readEvents();
    const index = events.findIndex((event: { id: string }) => event.id === req.params.id);
    if (index === -1) return next(Object.assign(new Error("Подію не знайдено"), { statusCode: 404, code: "EVENT_NOT_FOUND" }));
    events.splice(index, 1);
    await writeEvents(events);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

app.use(notFound);
app.use(errorHandler);

export default app;
