import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "./app.js";

describe("GET /health", () => {
  it("returns healthy status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.service).toBe("campushub-api");
    expect(response.body.timestamp).toBeDefined();
  });
});