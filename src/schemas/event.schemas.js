import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format");
export const createEventSchema = z.object({
  title: z.string().trim().min(3, "Title must contain at least 3 characters").max(100, "Title must contain no more than 100 characters"),
  date: dateSchema,
  description: z.string().trim().max(500).optional(),
  isOnline: z.boolean().default(false)
}).strict();

// Build the PATCH schema without defaults: omitted fields must remain unchanged.
export const updateEventSchema = createEventSchema.extend({
  isOnline: z.boolean()
}).partial().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided"
});
export const eventIdSchema = z.object({
  id: z.coerce.number().int("Event id must be an integer").positive("Event id must be positive")
}).strict();
export const eventQuerySchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  date: dateSchema.optional()
}).strict();
