import type { ErrorRequestHandler, Response } from "express";
import { HTTPSTATUS } from "../config/http.config.js";
import { AppError } from "../common/utils/AppError.js";
import z from "zod";
import {
  REFRESH_PATH,
  clearAuthenticationCookies,
} from "../common/utils/cookie.js";

const formatZodError = (res: Response, err: z.ZodError) => {
  const errors = err?.issues?.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));

  return res.status(HTTPSTATUS.BAD_REQUEST).json({
    message: "Validation failed",
    error: errors,
  });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, next): any => {
  console.error(`Error occurred on PATH: ${req.path}`, err);

  if (req.path === REFRESH_PATH) {
    clearAuthenticationCookies(res);
  }

  if (err instanceof SyntaxError) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "Invalid JSON format, please check your request body",
      error: err.message,
    });
  }

  if (err.name === z.ZodError.name) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "Invalid request data",
      error: formatZodError(res, err),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      error: err.errorCode,
    });
  }

  return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
    message: "internal server error",
    error: err?.message || "Unknown error",
  });
};
