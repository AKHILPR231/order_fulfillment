import {
  Request,
  Response
} from "express";

import {
  createOrderService
} from "../services/order.service";

import {
  OrderDTO
} from "../dto/order.dto";

export const createOrder =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {

    try {

      const body =
        req.body as OrderDTO;

      const result =
        await createOrderService(body);

      res.status(201).json(result);

    } catch (error: any) {

      res.status(400).json({
        message:
          error.message ||
          "Failed to create order"
      });

    }
};