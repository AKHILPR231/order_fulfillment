import pool from "../config/db";
import { Warehouse } from "../models/warehouse.model";
import { OrderItemDTO } from "../dto/order.dto";

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
          break;
        }
      }

      if (allItemsAvailable) {
        return warehouse;
      }
    }

    throw new Error(
      "No warehouse can fulfill this order"
    );
};