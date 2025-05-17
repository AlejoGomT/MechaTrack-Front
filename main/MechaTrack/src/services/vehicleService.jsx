import axiosInstance from "./apiConfig";

export const getVehicles = async (filters = {}) => {
  try {
    const response = await axiosInstance.get("/api/vehicles", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("Error en getVehicles:", error.response?.data || error);
    throw error.response?.data || { message: "Error al obtener vehículos" };
  }
};

export const createVehicle = async (vehicleData) => {
  try {
    const response = await axiosInstance.post("/api/vehicles", vehicleData);
    return response.data;
  } catch (error) {
    console.error("Error en createVehicle:", error.response?.data || error);
    throw error.response?.data || { message: "Error al crear vehículo" };
  }
};

export const updateVehicle = async (economicNumber, vehicleData) => {
  try {
    const response = await axiosInstance.put(
      `/api/vehicles/${economicNumber}`,
      vehicleData
    );
    return response.data;
  } catch (error) {
    console.error("Error en updateVehicle:", error.response?.data || error);
    throw error.response?.data || { message: "Error al actualizar vehículo" };
  }
};

export const deleteVehicle = async (economicNumber) => {
  try {
    const response = await axiosInstance.delete(
      `/api/vehicles/${economicNumber}`
    );
    return response.data;
  } catch (error) {
    console.error("Error en deleteVehicle:", error.response?.data || error);
    throw error.response?.data || { message: "Error al eliminar vehículo" };
  }
};

export const getBranches = async () => {
  try {
    const response = await axiosInstance.get("/api/vehicles/branches");
    return response.data;
  } catch (error) {
    console.error("Error en getBranches:", error.response?.data || error);
    throw error.response?.data || { message: "Error al obtener sucursales" };
  }
};

export const getVehicleBrands = async () => {
  try {
    const response = await axiosInstance.get("/api/vehicles/brands");
    return response.data;
  } catch (error) {
    console.error("Error en getVehicleBrands:", error.response?.data || error);
    throw (
      error.response?.data || {
        message: "Error al obtener marcas de vehículos",
      }
    );
  }
};

export const getVehicleModels = async () => {
  try {
    const response = await axiosInstance.get("/api/vehicles/models");
    return response.data;
  } catch (error) {
    console.error("Error en getVehicleModels:", error.response?.data || error);
    throw (
      error.response?.data || {
        message: "Error al obtener modelos de vehículos",
      }
    );
  }
};
