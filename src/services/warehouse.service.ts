import pool from "../config/db";
import { createError } from "../middlewares/errorHandler";
import { Warehouse } from "../models/warehouse.model";
import { OrderItemDTO } from "../dto/order.dto";

/**
 * Find the nearest active warehouse that can fulfill all requested items.
 * @param latitude delivery latitude
 * @param longitude delivery longitude
 * @param items list of order items to fulfill
 * @returns the nearest warehouse that has enough available stock
 * @throws AppError if no warehouse can fulfill the order
 */
export const findNearestWarehouse =
  async (
    latitude: number,
    longitude: number,
    items: OrderItemDTO[]
  ): Promise<Warehouse> => {


    const [warehouseRows] =
      await pool.query(
        `
        SELECT *
        FROM warehouse
        WHERE status = 'active'
        `
      );

    const warehouses =
      warehouseRows as Warehouse[];


    const warehouseDistances =
      warehouses.map((warehouse) => {

        const distance = Math.sqrt(
          Math.pow(
            warehouse.latitude - latitude,
            2
          ) +
          Math.pow(
            warehouse.longitude - longitude,
            2
          )
        );

        return {
          ...warehouse,
          distance
        };
      });

    warehouseDistances.sort(
      (a, b) => a.distance - b.distance
    );

    for (const warehouse of warehouseDistances) {

      let allItemsAvailable = true;
      const missingItems: string[] = [];

      for (const item of items) {

        const [inventoryRows] =
          await pool.query(
            `
            SELECT *
            FROM inventory
            WHERE warehouse_id = ?
            AND sku_id = ?
            `,
            [
              warehouse.warehouse_id,
              item.sku_id
            ]
          );

        const inventories =
          inventoryRows as any[];

        if (inventories.length === 0) {
          allItemsAvailable = false;
          missingItems.push(`SKU ${item.sku_id}: No inventory record`);
          break;
        }

        const inventory = inventories[0];

        const availableStock =
          inventory.quantity -
          inventory.reserved_quantity;

        if (
          availableStock < item.quantity
        ) {
          allItemsAvailable = false;
          missingItems.push(
            `SKU ${item.sku_id}: Need ${item.quantity}, Have ${availableStock}`
          );
          break;
        }
      }

      if (allItemsAvailable) {
        return warehouse;
      }

    }

    const errorMessage = 
      warehouseDistances.length === 0
        ? "No active warehouses found"
        : "No warehouse has sufficient stock to fulfill this order";
    
    throw createError(errorMessage, 422);
};