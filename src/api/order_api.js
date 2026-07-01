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
export const checkPromotion = async (code, cartTotal) => {
    try {
        const response = await axiosInstance.get('/api/promotions/check', {
            params: { code, cartTotal }
        });
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};