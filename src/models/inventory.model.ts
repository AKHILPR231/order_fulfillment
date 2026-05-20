export interface Inventory {
  warehouse_id: number;
  sku_id: number;
  quantity: number;
  reserved_quantity: number;
  threshold_quantity: number;
}
