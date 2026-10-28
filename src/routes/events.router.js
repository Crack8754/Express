import { Router } from "express";
import { env } from "../config/env.js";
import { validate } from "../middleware/validate.js";
import { createEventSchema, updateEventSchema, eventIdSchema, eventQuerySchema } from "../schemas/event.schemas.js";

const eventsRouter = Router();
const events = [{ id: 1, title: "JavaScript Meetup", date: "2026-10-10", isOnline: false }];
let nextId = 2;

function problem(statusCode, code, message) {
  return Object.assign(new Error(message), { statusCode, code });
}

function duplicate(candidate, excludeId) {
  return events.some((event) => event.id !== excludeId &&
    event.title.toLowerCase() === candidate.title.toLowerCase() && event.date === candidate.date);
}

eventsRouter.get("/error/test", (_req, _res, next) => next(new Error("Test error")));

eventsRouter.get("/", validate(eventQuerySchema, "query"), (req, res) => {
  const { title, date } = req.query;
  res.status(200).json(events.filter((event) =>
    (!title || event.title.toLowerCase().includes(title.toLowerCase())) && (!date || event.date === date)));
});

eventsRouter.get("/:id", validate(eventIdSchema, "params"), (req, res, next) => {
  const event = events.find((event) => event.id === req.params.id);
  if (!event) return next(problem(404, "EVENT_NOT_FOUND", `Event with id ${req.params.id} was not found`));
  res.status(200).json(event);
});

eventsRouter.post("/", validate(createEventSchema), (req, res, next) => {
  if (duplicate(req.body)) return next(problem(409, "EVENT_ALREADY_EXISTS", "Event with the same title and date already exists"));
  if (events.length >= env.MAX_EVENTS) return next(problem(409, "EVENT_LIMIT_REACHED", "Maximum number of events has been reached"));
  const event = { id: nextId++, ...req.body };
  events.push(event);
  res.status(201).json(event);
});

eventsRouter.patch("/:id", validate(eventIdSchema, "params"), validate(updateEventSchema), (req, res, next) => {
  const index = events.findIndex((event) => event.id === req.params.id);
  if (index === -1) return next(problem(404, "EVENT_NOT_FOUND", `Event with id ${req.params.id} was not found`));
  const updated = { ...events[index], ...req.body };
  if (duplicate(updated, updated.id)) return next(problem(409, "EVENT_ALREADY_EXISTS", "Event with the same title and date already exists"));
  events[index] = updated;
  res.status(200).json(updated);
});

eventsRouter.delete("/:id", validate(eventIdSchema, "params"), (req, res, next) => {
  const index = events.findIndex((event) => event.id === req.params.id);
  if (index === -1) return next(problem(404, "EVENT_NOT_FOUND", `Event with id ${req.params.id} was not found`));
  events.splice(index, 1);
  res.status(204).send();
});

export default eventsRouter;
