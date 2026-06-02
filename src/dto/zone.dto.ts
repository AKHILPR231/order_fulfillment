import { RowDataPacket } from "mysql2";

interface ZoneItem {
  quantity: number;
  order_item_id: number;
  sku_id: number;
  orderid: number;
}

interface ZoneInfo {
  zoneId: number;
  zoneName: string;
  warehouseId: number;
  latitude: number;
  longitude: number;
}

export interface ZoneMapValue {
  zoneInfo: ZoneInfo;
  items: ZoneItem[];
}

export interface ZoneItemRow
  extends RowDataPacket {

  order_item_id: number;

  sku_id: number;

  quantity: number;

  zone_id: number;

  zone_name: string;

  warehouse_id: number;

  latitude: number;

  longitude: number;
}

