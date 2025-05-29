import axiosInstance from "./apiConfig";

export const getBranchReports = async (filters) => {
  try {
    const response = await axiosInstance.get("/api/reports/branches", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Error al obtener informes de sucursales",
      }
    );
  }
};

export const getOrderReport = async (orderId) => {
  try {
    console.log("Sending request to:", `/api/reports/orders/${orderId}`);
    const response = await axiosInstance.get(`/api/reports/orders/${orderId}`);
    console.log("Respuesta de getOrderReport:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error en getOrderReport:", error.response?.data || error);
    throw (
      error.response?.data || { message: "Error al obtener informe de orden" }
    );
  }
};

export const downloadBranchReportsExcel = async (filters) => {
  try {
    const response = await axiosInstance.get("/api/reports/branches/export", {
      params: filters,
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "reporte_sucursales.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Error al descargar el informe en Excel",
      }
    );
  }
};

export const downloadOrderReportPdf = async (orderId) => {
  try {
    const response = await axiosInstance.get(
      `/api/reports/orders/${orderId}/pdf`,
      {
        responseType: "blob",
      }
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `order_${orderId}_report.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Error al descargar el informe en PDF",
      }
    );
  }
};
