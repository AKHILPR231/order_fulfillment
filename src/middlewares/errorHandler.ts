import { NextFunction, Request, Response } from "express";

export interface AppError extends Error {
  statusCode?: number;
  status?: string | number;
}


export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
     console.error(
    `[ERROR] ${req.method} ${req.originalUrl}`,
    err
  );

  const status =
    (err.statusCode ||
    err.status ||
    500) as number;

  const message =
    err.message ||
    "Internal Server Error";
  res.status(status).json({
    success: false,

    error: message,

    ...(process.env.NODE_ENV ===
      "development" && {
        stack: err.stack
      })
  });
}

export const createError = (
  message: string,
  statusCode: number = 400
): AppError => {

  const err: AppError =
    new Error(message);

  err.statusCode = statusCode;

  return err;
};