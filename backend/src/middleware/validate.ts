import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Validates req.body against a Zod schema.
 * Returns 422 with structured error on failure.
 * On success, replaces req.body with the parsed (coerced + stripped) result.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(422).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request body validation failed.",
          details: formatZodError(result.error),
        },
      });
    }
    req.body = result.data;
    return next();
  };
}

/**
 * Validates req.query against a Zod schema.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(422).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Query parameter validation failed.",
          details: formatZodError(result.error),
        },
      });
    }
    // Attach parsed query to req for downstream use
    (req as Request & { parsedQuery: T }).parsedQuery = result.data;
    return next();
  };
}

function formatZodError(error: ZodError) {
  return error.errors.map((e) => ({
    path: e.path.join("."),
    message: e.message,
  }));
}
