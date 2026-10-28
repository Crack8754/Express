export function notFound(req, res, next) {
  next(Object.assign(new Error(`Route ${req.method} ${req.originalUrl} was not found`), {
    statusCode: 404,
    code: "ROUTE_NOT_FOUND"
  }));
}
