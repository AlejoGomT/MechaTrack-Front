import axios from "axios";

const API_URL = "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};

export const login = async (id, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, { id, password });
  return response.data;
};

export const getOrders = async (filters = {}) => {
  const response = await axios.get(`${API_URL}/orders`, {
    headers: getAuthHeaders(),
    params: filters,
  });
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await axios.get(`${API_URL}/orders/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createOrder = async (orderData) => {
  const formData = new FormData();
  formData.append("type", orderData.type);
  formData.append("description", orderData.description);
  formData.append("initial_diagnosis", orderData.initial_diagnosis);
  formData.append("tasks", orderData.tasks);
  formData.append("technician_id", orderData.technician_id);
  formData.append("vehicle_economic_number", orderData.vehicle_economic_number);
  formData.append("branch", orderData.branch);
  formData.append("kilometraje", orderData.kilometraje);
  orderData.images.forEach((image) => {
    formData.append("images", image);
  });

  const response = await axios.post(`${API_URL}/orders`, formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const updateOrder = async (id, orderData) => {
  const response = await axios.put(
    `${API_URL}/orders/${id}`,
    {
      status: orderData.status,
      description: orderData.description,
      initial_diagnosis: orderData.initial_diagnosis,
      tasks: orderData.tasks,
      images: orderData.images,
    },
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data;
};

export const getVehicles = async (filters = {}) => {
  const response = await axios.get(`${API_URL}/vehicles`, {
    headers: getAuthHeaders(),
    params: filters,
  });
  return response.data;
};

export const getParts = async (model) => {
  const response = await axios.get(`${API_URL}/parts`, {
    headers: getAuthHeaders(),
    params: { model },
  });
  return response.data;
};

export const getNotifications = async (filters = {}) => {
  const response = await axios.get(`${API_URL}/notifications`, {
    headers: getAuthHeaders(),
    params: filters,
  });
  return response.data;
};
