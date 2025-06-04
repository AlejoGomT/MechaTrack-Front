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

export const getPartsReport = async ({ branch, partName, token }) => {
  try {
    const response = await axiosInstance.get("/api/reports/parts", {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        branch: branch || undefined,
        partName: partName || undefined,
      },
    });
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Error al obtener informe de repuestos",
      }
    );
  }
};

export const getBranches = async () => {
  try {
    const response = await axiosInstance.get("/api/reports/branches/list");
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Error al obtener lista de sucursales",
      }
    );
  }
};

export const downloadPartsReportPdf = async ({ branch, partName, token }) => {
  try {
    const response = await axiosInstance.get("/api/reports/parts/pdf", {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        branch: branch || undefined,
        partName: partName || undefined,
      },
      responseType: "blob",
    });

    // Verificar si la respuesta es un JSON de error
    if (response.data.type === "application/json") {
      const text = await response.data.text();
      const error = JSON.parse(text);
      throw new Error(error.message || "Error al descargar el PDF");
    }

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "informe_repuestos.pdf");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url); // Liberar el objeto URL
  } catch (error) {
    console.error("[Axios] Error en downloadPartsReportPdf:", error);
    throw new Error(
      error.message || "Error al descargar el informe de repuestos en PDF"
    );
  }
};

export const downloadPartsReportXml = async ({ branch, partName, token }) => {
  try {
    const response = await axiosInstance.get("/api/reports/parts/xml", {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        branch: branch || undefined,
        partName: partName || undefined,
      },
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "informe_repuestos.xml");
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Error al descargar el informe de repuestos en XML",
      }
    );
  }
};
