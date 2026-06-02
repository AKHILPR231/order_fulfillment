import { DeliveryType, OrderItemDTO, OutOfStockItem } from "../dto/order.dto";
import { createError } from "../middlewares/errorHandler";
import { checkStock } from "../services/inventory.service";

export const getEstimatedDeliveryDays = (
  deliveryType: DeliveryType
): number => {
  switch (deliveryType) {
    case "expressdelivery":
      return 1;
    case "dispatch":
      return 2;
    case "speedpost":
      return 5;
    case "normal":
    default:
      return 7;
  }
};

export const getEstimatedDeliveryDate = (
  days: number
): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};


export async function validateStock(
  warehouseId: number,
  items: OrderItemDTO[]
): Promise<void> {

  const stockMap =
    await checkStock(warehouseId, items);

  const outOfStock: OutOfStockItem[] = [];

  for (const item of items) {

    const available =
      stockMap.get(item.sku_id) ?? 0;

    if (available < item.quantity) {

      outOfStock.push({
        skuId: item.sku_id,
        requested: item.quantity,
        available
      });
    }
  }

  if (outOfStock.length > 0) {

    const err: any = createError(
      "Insufficient stock for one or more items",
      422
    );

    err.outOfStockItems = outOfStock;

    throw err;
  }
}