import axiosInstance from "./apiConfig";

export const getInvoices = async ({
  orderNumber,
  invoiceNumber,
  deliveryNoteNumber,
  issuedBy,
  issuedAt,
  total,
  page = 1,
  limit = 10,
}) => {
  try {
    const response = await axiosInstance.get("/api/invoices", {
      params: {
        orderNumber,
        invoiceNumber,
        deliveryNoteNumber,
        issuedBy,
        issuedAt,
        total,
        page,
        limit,
      },
    });
    return response.data;
  } catch (error) {
    console.error("[invoicesService] Error al obtener facturas:", error);
    throw error.response?.data || { message: "Error al obtener facturas" };
  }
};
