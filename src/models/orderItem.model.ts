export interface OrderItem {
  order_item_id?: number;
  sku_id: number;
  order_id: number;
  quantity: number;
  price: number;
  zone_id?: number;
  picking_list_id?: number;
}
