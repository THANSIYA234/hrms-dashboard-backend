import { z } from "zod";

/**
 * Parses `req[source]` with a zod schema and replaces it with the parsed result,
 * so controllers only ever see validated, coerced, unknown-key-stripped data.
 *
 * Express 5 defines `req.query` as a getter-only property on the request
 * prototype, so a plain `req.query = value` assignment throws
 * "Cannot set property query of #<IncomingMessage>". Shadow the prototype
 * getter with an own data property instead.
 */
const setParsed = (req, source, value) => {
  Object.defineProperty(req, source, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
};

export const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: z.flattenError(result.error),
      },
    });
  }

  setParsed(req, source, result.data);
  next();
};

export default validate;