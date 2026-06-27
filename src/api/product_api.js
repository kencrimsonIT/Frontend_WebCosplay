import axiosInstance from "./axios_instance";

export const getProducts = async () => {
    try {
        const response = await axiosInstance.get("/api/products");
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getProductById = async (id) => {
    try {
        const response = await axiosInstance.get(`/api/products/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
