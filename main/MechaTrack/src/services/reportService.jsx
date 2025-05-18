import axiosInstance from "./apiConfig";

export const getBranchReports = async (filters = {}) => {
  try {
    const response = await axiosInstance.get("/api/reports/branches", {
      params: filters,
    });
    console.log("Respuesta de getBranchReports:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error en getBranchReports:", error.response?.data || error);
    throw (
      error.response?.data || {
        message: "Error al obtener informes por sucursal",
      }
    );
  }
};

export const getOrderReport = async (orderId) => {
  try {
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
    link.setAttribute("download", `orden_${orderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error(
      "Error en downloadOrderReportPdf:",
      error.response?.data || error
    );
    throw error.response?.data || { message: "Error al descargar informe PDF" };
  }
};

export const downloadBranchReportsExcel = async (filters = {}) => {
  try {
    const response = await axiosInstance.get("/api/reports/branches/export", {
      params: filters,
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "informes_sucursales.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error(
      "Error en downloadBranchReportsExcel:",
      error.response?.data || error
    );
    throw (
      error.response?.data || { message: "Error al descargar informe Excel" }
    );
  }
};
