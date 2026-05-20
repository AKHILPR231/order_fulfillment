import { Request, Response } from "express";

export const createOrder = async (
  req: Request,
  res: Response
) => {
  try {
    res.status(201).json({
      message: "Order created"
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error"
    });
  }
};