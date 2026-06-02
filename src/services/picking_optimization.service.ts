import pool from "../config/db";

import {
  ResultSetHeader,
  
} from "mysql2";

import {
    ZoneItemRow,
  ZoneMapValue
} from "../dto/zone.dto";

import {
  createError
} from "../middlewares/errorHandler";


/**
 * Resolve order item zone assignments for a given order.
 * @param orderId order identifier
 * @returns list of order items with zone metadata
 */
const resolveItemZones = async (
  orderId: number
): Promise<ZoneItemRow[]> => {

  const [rows] =
    await pool.execute<ZoneItemRow[]>(
      `
      SELECT
        oi.order_item_id,
        oi.sku_id,
        oi.quantity,
        z.zone_id,
        z.zone_name,
        z.warehouse_id,
        z.latitude,
        z.longitude

      FROM order_item oi

      JOIN sku s
        ON s.sku_id = oi.sku_id

      JOIN category_product_map cpm
        ON cpm.product_id = s.product_id

      JOIN zone_category_map zcm
        ON zcm.category_id = cpm.category_id

      JOIN zone z
        ON z.zone_id = zcm.zone_id

      JOIN orders o
        ON o.order_id = oi.order_id
        AND o.warehouse_id = z.warehouse_id

      WHERE oi.order_id = ?
      `,
      [orderId]
    );

  if (rows.length === 0) {

    throw createError(
      `
      No zone mappings found
      for order ${orderId}
      `,
      422
    );
  }

  return rows;
};


/**
 * Generate picking lists grouped by zone for a set of orders.
 * @param orderIds list of order identifiers
 * @returns created picking list records
 */
export const generatePickingLists =
  async (
    orderIds: number[]
  ) => {

    if (
      !orderIds ||
      orderIds.length === 0
    ) {

      throw createError(
        "At least one order ID is required",
        400
      );
    }

    const zoneMap =
      new Map<number, ZoneMapValue>();

    for (const orderId of orderIds) {

      const items =
        await resolveItemZones(orderId);

      for (const item of items) {

        if (
          !zoneMap.has(item.zone_id)
        ) {

          zoneMap.set(
            item.zone_id,
            {
              zoneInfo: {
                zoneId: item.zone_id,

                zoneName:
                  item.zone_name,

                warehouseId:
                  item.warehouse_id,

                latitude:
                  item.latitude,

                longitude:
                  item.longitude
              },

              items: []
            }
          );
        }

        zoneMap
          .get(item.zone_id)
          ?.items.push({
            quantity:
              item.quantity,

            order_item_id:
              item.order_item_id,

            sku_id:
              item.sku_id,

            orderid:
              orderId
          });
      }
    }

    const sortedZones =
      [...zoneMap.values()]
        .sort((a, b) => {

          return (
            a.zoneInfo.zoneId -
            b.zoneInfo.zoneId
          );
        });
    const connection =
      await pool.getConnection();

    const createdLists = [];

    try {

      await connection
        .beginTransaction();

      for (const zone of sortedZones) {

        const [result] =
          await connection.execute<ResultSetHeader>(
            `
            INSERT INTO picking_list (
              picking_list_status,
              warehouse_id
            )
            VALUES (?, ?)
            `,
            [
              "pending",
              zone.zoneInfo.warehouseId
            ]
          );

        const pickingListId =
          result.insertId;

        for (const item of zone.items) {

          await connection.execute(
            `
            UPDATE order_item
            SET
              zone_id = ?,
              picking_list_id = ?
            WHERE order_item_id = ?
            `,
            [
              zone.zoneInfo.zoneId,
              pickingListId,
              item.order_item_id
            ]
          );
        }

        createdLists.push({
          pickingListId,

          zoneId:
            zone.zoneInfo.zoneId,

          zoneName:
            zone.zoneInfo.zoneName,

          warehouseId:
            zone.zoneInfo.warehouseId,

          status:
            "pending",

          itemCount:
            zone.items.length,

          items:
            zone.items
        });
      }

      await connection.commit();

      return createdLists;

    } catch (error) {

      await connection.rollback();

      throw error;

    } finally {

      connection.release();
    }
};

/**
 * Update the status of an existing picking list.
 * @param pickingListId picking list identifier
 * @param status new state to apply
 * @throws Error when implementation is missing
 */
export function updatePickingStatus(pickingListId: number, status: any) {
  throw new Error("Function not implemented.");
}
