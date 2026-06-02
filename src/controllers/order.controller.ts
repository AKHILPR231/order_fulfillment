import {
  Request,
  Response,
  NextFunction
} from "express";

import {
  body,
  validationResult
} from "express-validator";

import * as orderProcessingService
  from "../services/order.service";

import {
  AppError
} from "../middlewares/errorHandler";





/**
 * Handle order creation requests.
 * @param req Express request object
 * @param res Express response object
 * @param next Express middleware callback
 */
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {

  try {
    const errors =
      validationResult(req);

    if (!errors.isEmpty()) {

      res.status(400).json({
        success: false,

        errors: errors.array()
      });

      return;
    }

    const result =
      await orderProcessingService
        .createOrder(req.body);

    res.status(201).json({
      success: true,

      data: result
    });

  } catch (error) {

    const err =
      error as AppError & {
        outOfStockItems?: any[];
      };

    if (
      err.statusCode === 422 &&
      err.outOfStockItems
    ) {

      res.status(422).json({
        success: false,

        error: err.message,

        outOfStockItems:
          err.outOfStockItems
      });

      return;
    }

    next(error);
  }
};


/**
 * Retrieve an existing order by its ID.
 * @param req Express request object
 * @param res Express response object
 * @param next Express next middleware callback
 */
export const getOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {

  try {

    const orderId =
      Number(req.params.orderId);

    const order =
      await orderProcessingService
        .getOrderById(orderId);

    res.json({
      success: true,

      data: order
    });

  } catch (error) {

    next(error);
  }
};


/**
 * Cancel an order by ID if it is still pending or processing.
 * @param req Express request object
 * @param res Express response object
 * @param next Express next middleware callback
 */
export const cancelOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {

  try {

    const orderId =
      Number(req.params.orderId);

    const result =
      await orderProcessingService
        .cancelOrder(orderId);

    res.json({
      success: true,

      data: result
    });

  } catch (error) {

    next(error);
  }
};


/**
 * Generate picking lists for all remaining processing orders.
 * @param req Express request object
 * @param res Express response object
 * @param next Express next middleware callback
 */
export const generatePickingLists = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await orderProcessingService.generatePickingListsForRemainingOrders();

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};