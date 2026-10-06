import { Router } from "express";

const eventsRouter = Router();

const events = [
  {
    id: 1,
    title: "JavaScript Meetup",
    date: "2026-10-10"
  }
];

function findEvent(id) {
  return events.find((event) => event.id === Number(id));
}

function validText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

eventsRouter.use((req, _res, next) => {
  console.log("3. router");
  next();
});

eventsRouter.get("/error/test", (req, res, next) => {
  next(new Error("Test error"));
});

eventsRouter.get("/", (_req, res) => {
  res.status(200).json(events);
});

eventsRouter.get("/:id", (req, res) => {
  const event = findEvent(req.params.id);
  if (!event) {
    return res.status(404).json({ message: "Event not found", requestId: req.requestId });
  }

  return res.status(200).json(event);
});

eventsRouter.post("/", (req, res) => {
  const { title, date } = req.body ?? {};
  if (!validText(title) || !validText(date)) {
    return res.status(400).json({ message: "title and date are required", requestId: req.requestId });
  }

  const newEvent = {
    id: events.length === 0 ? 1 : Math.max(...events.map((event) => event.id)) + 1,
    title: title.trim(),
    date: date.trim()
  };
  events.push(newEvent);
  return res.status(201).json(newEvent);
});

eventsRouter.patch("/:id", (req, res) => {
  const event = findEvent(req.params.id);
  if (!event) {
    return res.status(404).json({ message: "Event not found", requestId: req.requestId });
  }

  const { title, date } = req.body ?? {};
  if ((title !== undefined && !validText(title)) || (date !== undefined && !validText(date)) || (title === undefined && date === undefined)) {
    return res.status(400).json({ message: "Provide a non-empty title or date", requestId: req.requestId });
  }

  if (title !== undefined) event.title = title.trim();
  if (date !== undefined) event.date = date.trim();
  return res.status(200).json(event);
});

eventsRouter.delete("/:id", (req, res) => {
  const index = events.findIndex((event) => event.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ message: "Event not found", requestId: req.requestId });
  }

  events.splice(index, 1);
  return res.status(204).send();
});

export default eventsRouter;
