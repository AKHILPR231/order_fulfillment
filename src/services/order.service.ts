import pool from "../config/db";

import {
  OrderDTO
} from "../dto/order.dto";

import {
  findNearestWarehouse
} from "./warehouse.service";

export const createOrderService =
  async (
    data: OrderDTO
  ) => {

    const connection =
      await pool.getConnection();

    try {

      await connection.beginTransaction();
      
      // FIND WAREHOUSE
    
      const warehouse =
        await findNearestWarehouse(
          data.delivery_location.latitude,
          data.delivery_location.longitude,
          data.items
        );

      // CREATE ORDER
      const [orderResult]: any =
        await connection.query(
          `
          INSERT INTO orders (
            order_date,
            fulfillment_status,
            delivery_type,
            warehouse_id,
            estimated_delivery_days,
            estimated_delivery_date
          )
          VALUES (
            NOW(),
            'pending',
            ?,
            ?,
            3,
            DATE_ADD(NOW(), INTERVAL 3 DAY)
          )
          `,
          [
            data.delivery_type,
            warehouse.warehouse_id
          ]
        );

      await connection.commit();
    if(orderResult.affectedRows !== 0) {
            return {
        message:
          "Order created successfully with order ID: " + orderResult.insertId,
      };
    }

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
};