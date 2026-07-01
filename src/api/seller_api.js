import axiosInstance from "./axios_instance";

const unwrap = (response) => response.data?.data ?? response.data;

export const getSellerDashboard = async () => {
    try {
        const response = await axiosInstance.get("/api/seller/dashboard");
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getSellerProducts = async () => {
    try {
        const response = await axiosInstance.get("/api/seller/products");
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const createSellerProduct = async (productData) => {
    try {
        const response = await axiosInstance.post("/api/seller/products", productData);
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateSellerProduct = async (id, productData) => {
    try {
        const response = await axiosInstance.put(`/api/seller/products/${id}`, productData);
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const toggleSellerProduct = async (id) => {
    try {
        const response = await axiosInstance.patch(`/api/seller/products/${id}/toggle`);
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteSellerProduct = async (id) => {
    try {
        const response = await axiosInstance.delete(`/api/seller/products/${id}`);
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getSellerOrders = async (params = {}) => {
    try {
        const response = await axiosInstance.get("/api/seller/orders", { params });
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getSellerOrderDetail = async (id) => {
    try {
        const response = await axiosInstance.get(`/api/seller/orders/${id}`);
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateSellerOrderStatus = async (id, status) => {
    try {
        const response = await axiosInstance.patch(`/api/seller/orders/${id}/status`, { status });
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getSellerRevenue = async (params = {}) => {
    try {
        const response = await axiosInstance.get("/api/seller/revenue", { params });
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// ========== PROMOTIONS ==========

export const getSellerPromotions = async () => {
    try {
        const response = await axiosInstance.get("/api/seller/promotions");
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getSellerPromotionSummary = async () => {
    try {
        const response = await axiosInstance.get("/api/seller/promotions/summary");
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const createSellerPromotion = async (data) => {
    try {
        const response = await axiosInstance.post("/api/seller/promotions", data);
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateSellerPromotion = async (id, data) => {
    try {
        const response = await axiosInstance.put(`/api/seller/promotions/${id}`, data);
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const toggleSellerPromotion = async (id) => {
    try {
        const response = await axiosInstance.patch(`/api/seller/promotions/${id}/toggle`);
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const duplicateSellerPromotion = async (id) => {
    try {
        const response = await axiosInstance.post(`/api/seller/promotions/${id}/duplicate`);
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteSellerPromotion = async (id) => {
    try {
        const response = await axiosInstance.delete(`/api/seller/promotions/${id}`);
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
