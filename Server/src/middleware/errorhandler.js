export function errorHandler(err, req, res, next) {
  if (err.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ error: { code: "BAD_JSON", message: "Request body is not valid JSON." } });
  }
  console.error("Unhandled error:", err.message);
  res
    .status(500)
    .json({ error: { code: "SERVER_ERROR", message: "Something went wrong." } });
}