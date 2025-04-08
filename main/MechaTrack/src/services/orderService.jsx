// src/services/orderService.js
import { mockClientOrders, mockVehicles } from "../data/mock";

export const createOrder = (orderData, technicianId) => {
  const newOrder = {
    id: `00${mockClientOrders.length + 1}`,
    ...orderData,
    technicianId,
    status: "En Proceso",
    createdAt: new Date().toISOString().split("T")[0],
    history: [
      {
        description: orderData.initialDiagnosis,
        date: new Date().toISOString().split("T")[0],
        status: "En Proceso",
      },
    ],
  };
  mockClientOrders.push(newOrder);
  updateVehicleHistory(newOrder.vehicleEconomicNumber);
  return newOrder;
};

export const updateOrder = (orderData) => {
  const index = mockClientOrders.findIndex((o) => o.id === orderData.id);
  if (index === -1) throw new Error("Orden no encontrada");
  mockClientOrders[index] = orderData;
  updateVehicleHistory(orderData.vehicleEconomicNumber);
  return orderData;
};

const updateVehicleHistory = (economicNumber) => {
  const vehicle = mockVehicles.find((v) => v.Económico === economicNumber);
  if (vehicle) {
    vehicle.history = mockClientOrders
      .filter((o) => o.vehicleEconomicNumber === vehicle.Económico)
      .map((o) => ({
        orderNumber: o.id,
        description: o.initialDiagnosis,
        date: o.createdAt,
        status: o.status,
      }));
  }
};
