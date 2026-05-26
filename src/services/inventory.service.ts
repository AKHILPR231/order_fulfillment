import { PoolConnection, RowDataPacket } from "mysql2/promise";

import {
  inventoryClient,
  InventoryReserveResult,
} from "../config/httpClients";

import pool from "../config/db";
import { OrderItemDTO } from "../dto/order.dto";

// =====================================
// TYPES
// =====================================


interface InventoryRow extends RowDataPacket {
  sku_id: number;
  quantity: number;
  reserved_quantity: number;
}

export interface ReserveStockResult extends InventoryReserveResult {}


// =====================================
// CHECK STOCK
// =====================================

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


// =====================================
// RESERVE STOCK
// =====================================

export const reserveStock = async (
  warehouseId: number,
  orderId: number,
  items: OrderItemDTO[]
): Promise<ReserveStockResult> => {

  // =================================
  // TRY EXTERNAL SERVICE
  // =================================

  try {

    const response =
      await inventoryClient
        .reserveInventory(
          warehouseId,
          orderId,
          items
        );

    return response;

  } catch (externalError: any) {

    console.warn(
      `
[Inventory Service]

External Service Failed

Fallback To Local DB
`,
      externalError.message
    );
  }

  // =================================
  // LOCAL FALLBACK
  // =================================

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

      // =============================
      // SKU NOT FOUND
      // =============================

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

      // =============================
      // INSUFFICIENT STOCK
      // =============================

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

      // =============================
      // RESERVE INVENTORY
      // =============================

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


// =====================================
// RELEASE STOCK
// =====================================

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