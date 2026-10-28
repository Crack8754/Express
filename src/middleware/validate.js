export function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(Object.assign(new Error("One or more request fields are invalid"), {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        validationErrors: result.error.issues.map((issue) => ({
          field: issue.path.join(".") || source,
          message: issue.message
        }))
      }));
    }
    // Express 5 exposes query through a getter: define an own property for parsed data.
    Object.defineProperty(req, source, { value: result.data, writable: true, configurable: true, enumerable: true });
    next();
  };
}
