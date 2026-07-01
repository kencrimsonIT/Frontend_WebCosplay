import axiosInstance from "./axios_instance";

const unwrap = (response) => response.data?.data ?? response.data;

export const applyVoucher = async (payload) => {
    try {
        const response = await axiosInstance.post("/api/vouchers/apply", payload);
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getSellerVouchers = async () => {
    try {
        const response = await axiosInstance.get("/api/seller/vouchers");
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const createSellerVoucher = async (payload) => {
    try {
        const response = await axiosInstance.post("/api/seller/vouchers", payload);
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateSellerVoucher = async (id, payload) => {
    try {
        const response = await axiosInstance.put(`/api/seller/vouchers/${id}`, payload);
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const toggleSellerVoucher = async (id) => {
    try {
        const response = await axiosInstance.patch(`/api/seller/vouchers/${id}/toggle`);
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
