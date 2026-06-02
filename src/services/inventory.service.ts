import { PoolConnection } from "mysql2/promise";

import {
  inventoryClient,
} from "../config/httpClients";

import pool from "../config/db";
import { OrderItemDTO } from "../dto/order.dto";
import { InventoryRow, ReserveStockResult } from "../dto/inventory.dto";

/**
 * Build a map of available stock quantities for requested SKUs.
 * @param warehouseId warehouse to check stock in
 * @param items order items to verify
 * @returns a map from SKU ID to available quantity
 */
export const checkStock = async (
  warehouseId: number,
  items: OrderItemDTO[]
): Promise<Map<number, number>> => {

  const skuIds = items.map((item) => item.sku_id);

  if (skuIds.length === 0) {
    return new Map<number, number>();
  }

  const placeholders = skuIds.map(() => "?").join(",");

  const [rows] =
    await pool.execute<InventoryRow[]>(
      `
      SELECT
        sku_id,
        quantity,
        reserved_quantity
      FROM inventory
      WHERE warehouse_id = ?
      AND sku_id IN (${placeholders})
      `,
      [
        warehouseId,
        ...skuIds
      ]
    );

  const stockMap =
    new Map<number, number>();

  for (const row of rows) {

    const availableQuantity =
      row.quantity -
      row.reserved_quantity;

    stockMap.set(
      row.sku_id,
      availableQuantity
    );
  }

  return stockMap;
};


/**
 * Reserve inventory for an order in the selected warehouse.
 * @param warehouseId warehouse to reserve inventory from
 * @param orderId order identifier
 * @param items list of items to reserve
 * @returns reservation result with success, reserved items, and failures
 */
export const reserveStock = async (
  warehouseId: number,
  orderId: number,
  items: OrderItemDTO[]
): Promise<ReserveStockResult> => {
  const connection:
    PoolConnection =
      await pool.getConnection();

  try {

    await connection.beginTransaction();

    const reserved: OrderItemDTO[] = [];

    const failedItems: Array<OrderItemDTO & { reason: string }> = [];

    for (const item of items) {


      const [rows] =
        await connection.execute<
          InventoryRow[]
        >(
          `
          SELECT
            quantity,
            reserved_quantity
          FROM inventory
          WHERE warehouse_id = ?
          AND sku_id = ?
          FOR UPDATE
          `,
          [
            warehouseId,
            item.sku_id
          ]
        );

      if (rows.length === 0) {

        failedItems.push({
          ...item,
          reason:
            "SKU not found in warehouse"
        });

        continue;
      }

      const inventory =
        rows[0];
      const available =
        inventory.quantity -
        inventory.reserved_quantity;

      if (
        available <
        item.quantity
      ) {

        failedItems.push({
          ...item,

          reason:
            `Insufficient stock (available: ${available})`
        });

        continue;
      }

      await connection.execute(
        `
        UPDATE inventory
        SET reserved_quantity =
            reserved_quantity + ?
        WHERE warehouse_id = ?
        AND sku_id = ?
        `,
        [
          item.quantity,
          warehouseId,
          item.sku_id
        ]
      );

      reserved.push(item);
    }

    await connection.commit();

    return {
      success:
        failedItems.length === 0,

      reserved,

      failedItems
    };

  } catch (error) {

    await connection.rollback();

    throw error;

  } finally {

    connection.release();
  }
};


/**
 * Release previously reserved inventory back to the warehouse.
 * @param warehouseId warehouse to release inventory from
 * @param items list of reserved items to release
 */
export const releaseStock = async (
  warehouseId: number,
  items: OrderItemDTO[]
): Promise<void> => {

  try {

    await inventoryClient
      .releaseInventory(
        warehouseId,
        items
      );
  } catch {
    const connection =
      await pool.getConnection();

    try {

      await connection
        .beginTransaction();

      for (const item of items) {

        await connection.execute(
          `
          UPDATE inventory
          SET reserved_quantity =
              GREATEST(
                0,
                reserved_quantity - ?
              )
          WHERE warehouse_id = ?
          AND sku_id = ?
          `,
          [
            item.quantity,
            warehouseId,
            item.sku_id
          ]
        );
      }

      await connection.commit();

    } catch (error) {

      await connection.rollback();

      throw error;

    } finally {

      connection.release();
    }
  }
};