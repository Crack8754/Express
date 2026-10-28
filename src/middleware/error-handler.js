const titles = {
  VALIDATION_ERROR: "Request validation failed",
  INVALID_JSON: "Invalid JSON",
  EVENT_NOT_FOUND: "Event not found",
  EVENT_ALREADY_EXISTS: "Event already exists",
  EVENT_LIMIT_REACHED: "Event limit reached",
  ROUTE_NOT_FOUND: "Route not found",
  INTERNAL_SERVER_ERROR: "Internal server error"
};

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const candidate = error.statusCode ?? error.status;
  const status = Number.isInteger(candidate) && candidate >= 400 && candidate <= 599 ? candidate : 500;
  const serverError = status >= 500;
  const invalidJson = error.type === "entity.parse.failed";
  const code = serverError ? "INTERNAL_SERVER_ERROR" : invalidJson ? "INVALID_JSON" : error.code || "REQUEST_ERROR";
  const response = {
    type: `https://example.com/problems/${code.toLowerCase().replaceAll("_", "-")}`,
    title: titles[code] || "Request failed",
    status,
    detail: serverError ? "An unexpected server error occurred" : invalidJson ? "Request body must contain valid JSON" : error.message,
    instance: req.originalUrl,
    code,
    requestId: req.requestId
  };
  if (!serverError && error.validationErrors) response.errors = error.validationErrors;
  if (serverError) console.error({ requestId: req.requestId, message: error.message, stack: error.stack });
  res.status(status).type("application/problem+json").json(response);
}
