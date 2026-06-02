import { RowDataPacket } from "mysql2";
import { InventoryReserveResult } from "../config/httpClients";

export interface InventoryRow extends RowDataPacket {
  sku_id: number;
  quantity: number;
  reserved_quantity: number;
}

export interface ReserveStockResult extends InventoryReserveResult {}