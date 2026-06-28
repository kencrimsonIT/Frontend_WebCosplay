import axiosInstance from "./axios_instance";

export const createOrder = async (orderData) => {
    try {
        const response = await axiosInstance.post("/api/orders", orderData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getOrder = async (id) => {
    try {
        const response = await axiosInstance.get(`/api/orders/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
export const getMyOrders = async () => {
    try {
        const response = await axiosInstance.get("/api/orders/my");
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const cancelOrder = async (id, reason = "") => {
    try {
        const response = await axiosInstance.post(`/api/orders/${id}/cancel`, { reason });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
