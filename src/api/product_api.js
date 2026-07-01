import axiosInstance from "./axios_instance";

export const getProducts = async (params = {}) => {
    try {
        const response = await axiosInstance.get("/api/products", { params });
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

export const getNewestProducts = async (limit = 8) => {
    try {
        const response = await axiosInstance.get("/api/products/homepage/newest", { params: { limit } });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getBestSellerProducts = async (limit = 8) => {
    try {
        const response = await axiosInstance.get("/api/products/homepage/bestseller", { params: { limit } });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};