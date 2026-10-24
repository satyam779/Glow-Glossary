// An error with an HTTP status and a message that is safe to show to the user.
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Route ids are UUIDs; anything else is simply "not found" (and never reaches the database).
export function uuidParam(value, what = 'Item') {
  const id = String(value || '');
  if (!UUID.test(id)) throw new HttpError(404, `${what} not found.`);
  return id;
}

// Parse a request body with a zod schema, turning failures into a 400 with the first problem.
export function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue.path.join('.');
    throw new HttpError(400, field ? `${field}: ${issue.message}` : issue.message, { field });
  }
  return result.data;
}
