import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "./app.js";

describe("PR5 event boundary", () => {
  it("validates create, preserves omitted PATCH fields and prevents duplicates", async () => {
    const created = await request(app).post("/api/events").send({
      title: "   Test workshop   ", date: "2026-11-15", isOnline: true
    });
    expect(created.status).toBe(201);
    expect(created.body.title).toBe("Test workshop");
    const id = created.body.id;
    try {
      const updated = await request(app).patch(`/api/events/${id}`).send({ description: "  Details  " });
      expect(updated.status).toBe(200);
      expect(updated.body).toMatchObject({ isOnline: true, description: "Details", title: "Test workshop" });
      const duplicate = await request(app).post("/api/events").send({ title: "test WORKSHOP", date: "2026-11-15" });
      expect(duplicate.status).toBe(409);
      expect(duplicate.body.code).toBe("EVENT_ALREADY_EXISTS");
    } finally {
      expect((await request(app).delete(`/api/events/${id}`)).status).toBe(204);
    }
  });

  it.each([
    { title: "JS", date: "2026-11-15" },
    { title: "Workshop", date: "15.11.2026" },
    { title: "Workshop", date: "2026-11-15", price: 500 },
    { title: "Workshop", date: "2026-11-15", isOnline: "yes" },
    { title: "Workshop", date: "2026-11-15", description: "x".repeat(501) }
  ])("rejects invalid body with Problem Details", async (body) => {
    const response = await request(app).post("/api/events").send(body);
    expect(response.status).toBe(400);
    expect(response.headers["content-type"]).toContain("application/problem+json");
    expect(response.body).toMatchObject({ status: 400, code: "VALIDATION_ERROR", requestId: response.headers["x-request-id"] });
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  it.each(["abc", "0", "-5", "2.5"])("rejects invalid id %s before the handler", async (id) => {
    const response = await request(app).get(`/api/events/${id}`);
    expect(response.status).toBe(400);
    expect(response.body.errors[0].field).toBe("id");
  });

  it("rejects empty/unknown PATCH data", async () => {
    for (const body of [{}, { price: 100 }]) {
      expect((await request(app).patch("/api/events/1").send(body)).status).toBe(400);
    }
  });

  it("validates and transforms query data", async () => {
    const response = await request(app).get("/api/events?title=%20JavaScript%20");
    expect(response.status).toBe(200);
    expect(response.body[0].id).toBe(1);
    expect((await request(app).get("/api/events?price=1")).status).toBe(400);
  });

  it("returns distinct resource and route 404 codes", async () => {
    for (const [path, code] of [["/api/events/9999", "EVENT_NOT_FOUND"], ["/api/unknown", "ROUTE_NOT_FOUND"]]) {
      const response = await request(app).get(path);
      expect(response.status).toBe(404);
      expect(response.body.code).toBe(code);
    }
  });

  it("handles malformed JSON with requestId", async () => {
    const response = await request(app).post("/api/events").set("Content-Type", "application/json").send('{"title":');
    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_JSON");
    expect(response.body.requestId).toBe(response.headers["x-request-id"]);
  });

  it("hides internal error details", async () => {
    const response = await request(app).get("/api/events/error/test");
    expect(response.status).toBe(500);
    expect(response.headers["content-type"]).toContain("application/problem+json");
    expect(response.body).toMatchObject({ code: "INTERNAL_SERVER_ERROR", detail: "An unexpected server error occurred" });
    expect(response.text).not.toContain("Test error");
    expect(response.body).not.toHaveProperty("stack");
    expect(response.body).not.toHaveProperty("errors");
  });
});
