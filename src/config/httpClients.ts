import { OrderItemDTO } from "../dto/order.dto";

export interface InventoryReserveResult {
  success: boolean;
  reserved: OrderItemDTO[];
  failedItems: Array<OrderItemDTO & { reason: string }>;
}

export interface InventoryReleaseResult {
  success: boolean;
}

export const inventoryClient = {

  reserveInventory: async (
    warehouseId: number,
    orderId: number,
    items: OrderItemDTO[]
  ): Promise<InventoryReserveResult> => {

    console.log(`
[Inventory Service]

Reserving Inventory

Warehouse ID: ${warehouseId}
Order ID: ${orderId}
Items: ${JSON.stringify(items)}
`);

    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      reserved: items,
      failedItems: [],
    };
  },

  releaseInventory: async (
    warehouseId: number,
    items: OrderItemDTO[]
  ): Promise<InventoryReleaseResult> => {

    console.log(`
[Inventory Service]

Releasing Inventory

Warehouse ID: ${warehouseId}
Items: ${JSON.stringify(items)}
`);

    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
    };
  },
};

export const warehouseStaffClient = {

  notifyPickingTask: async (
    pickingListId: number
  ) => {

    console.log(`
[Warehouse Staff Service]

New Picking Task Assigned

Picking List ID:
${pickingListId}
`);

    await new Promise(
      resolve => setTimeout(resolve, 500)
    );

    return {
      success: true
    };
  }
};

export const dispatchClient = {

  notifyDispatchReady: async (
    orderId: number
  ) => {

    console.log(`
[Dispatch Service]

Order Ready For Dispatch

Order ID:
${orderId}
`);

    await new Promise(
      resolve => setTimeout(resolve, 500)
    );

    return {
      success: true
    };
  }
};