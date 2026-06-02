import  pool from "../config/db";
import {
  reserveStock
} from "./inventory.service";
import { generatePickingLists } from "./picking_optimization.service";

import { createError } from "../middlewares/errorHandler";

import {
  ResultSetHeader,
  RowDataPacket
} from "mysql2";
import {
  OrderDTO,
  CreateOrderResponse,
  OrderRow,
  OrderItemRow
} from "../dto/order.dto";
import { getEstimatedDeliveryDate, getEstimatedDeliveryDays, validateStock } from "../utils/utility";
import { findNearestWarehouse } from "./warehouse.service";


/**
 * Create a new order and reserve required stock.
 * @param orderData order payload
 * @returns created order metadata and reservation result
 */
async function createOrder(
  orderData: OrderDTO
): Promise<CreateOrderResponse> {

  const {
    delivery_type,
    delivery_location,
    items
  } = orderData;

  const warehouse = await findNearestWarehouse(
    delivery_location.latitude,
    delivery_location.longitude,
    items
  );
  const warehouseId = warehouse.warehouse_id;

  await validateStock(warehouseId, items);

  const deliveryType = delivery_type;
  const estimatedDeliveryDays = getEstimatedDeliveryDays(deliveryType);
  const estimatedDeliveryDate = getEstimatedDeliveryDate(
    estimatedDeliveryDays
  );



  const conn = await pool.getConnection();

  try {

    await conn.beginTransaction();

    const [orderResult] =
      await conn.execute<ResultSetHeader>(
        `
        INSERT INTO orders
        (
          order_date,
          fulfillment_status,
          delivery_type,
          warehouse_id,
          estimated_delivery_days,
          estimated_delivery_date
        )
        VALUES
        (
          CURDATE(),
          'pending',
          ?,
          ?,
          ?,
          ?
        )
        `,
        [
          deliveryType,
          warehouseId,
          estimatedDeliveryDays,
          estimatedDeliveryDate
        ]
      );

    const orderId = orderResult.insertId;

    for (const item of items) {

      await conn.execute<ResultSetHeader>(
        `
        INSERT INTO order_item
        (
          sku_id,
          order_id,
          quantity,
          price
        )
        VALUES (?, ?, ?, ?)
        `,
        [
          item.sku_id,
          orderId,
          item.quantity,
          item.price
        ]
      );
    }

    await conn.execute<ResultSetHeader>(
      `
      UPDATE orders
      SET fulfillment_status = 'processing'
      WHERE order_id = ?
      `,
      [orderId]
    );

    await conn.commit();

    const reservationResult =
      await reserveStock(
        warehouseId,
        orderId,
        items
      );

    if (!reservationResult.success) {

      await pool.execute<ResultSetHeader>(
        `
        UPDATE orders
        SET fulfillment_status = 'pending'
        WHERE order_id = ?
        `,
        [orderId]
      );

      return {
        orderId,
        fulfillmentStatus: "pending",
        warning:
          "Stock reservation partially failed",
        reservationResult
      };
    }

    return {
      orderId,
      fulfillmentStatus: "processing",
      reservationResult
    };

  } catch (err) {

    await conn.rollback();

    throw err;

  } finally {

    conn.release();
  }
}

/**
 * Retrieve a saved order along with its items.
 * @param orderId order identifier
 * @returns order record with items
 */
async function getOrderById(
  orderId: number
): Promise<OrderRow & { items: OrderItemRow[] }> {

  const [[order]] =
    await pool.execute<OrderRow[]>(
      `
      SELECT *
      FROM orders
      WHERE order_id = ?
      `,
      [orderId]
    );

  if (!order) {

    throw createError(
      `Order ${orderId} not found`,
      404
    );
  }

  const [items] =
    await pool.execute<OrderItemRow[]>(
      `
      SELECT
        oi.*,
        s.description AS sku_description
      FROM order_item oi
      JOIN sku s
        ON s.sku_id = oi.sku_id
      WHERE oi.order_id = ?
      `,
      [orderId]
    );

  return {
    ...order,
    items
  };
}

/**
 * Cancel an existing order if it is cancellable.
 * @param orderId order identifier
 * @returns cancellation result
 */
async function cancelOrder(
  orderId: number
): Promise<{
  orderId: number;
  fulfillmentStatus: string;
}> {

  const [[order]] =
    await pool.execute<OrderRow[]>(
      `
      SELECT *
      FROM orders
      WHERE order_id = ?
      `,
      [orderId]
    );

  if (!order) {

    throw createError(
      `Order ${orderId} not found`,
      404
    );
  }

  if (
    !["pending", "processing"]
      .includes(order.fulfillment_status)
  ) {

    throw createError(
      `Cannot cancel order in status '${order.fulfillment_status}'`,
      409
    );
  }

  await pool.execute<ResultSetHeader>(
    `
    UPDATE orders
    SET fulfillment_status = 'cancelled'
    WHERE order_id = ?
    `,
    [orderId]
  );

  return {
    orderId,
    fulfillmentStatus: "cancelled"
  };
}


/**
 * Generate picking lists for processing orders that still need assignment.
 * @returns generated picking list results
 */
async function generatePickingListsForRemainingOrders() {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `
    SELECT DISTINCT oi.order_id
    FROM order_item oi
    JOIN orders o ON o.order_id = oi.order_id
    WHERE oi.picking_list_id IS NULL
      AND o.fulfillment_status = 'processing'
    `
  );

  const orderIds: number[] = (rows as any[]).map(r => r.order_id).filter(Boolean);

  if (orderIds.length === 0) {
    return [];
  }

  return await generatePickingLists(orderIds);
}


export {
  createOrder,
  getOrderById,
  cancelOrder,  generatePickingListsForRemainingOrders
};