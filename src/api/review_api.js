import axiosInstance from "./axios_instance";

const unwrap = (response) => response.data?.data ?? response.data;

export const getProductReviews = async (productId) => {
    try {
        const response = await axiosInstance.get(`/api/products/${productId}/reviews`);
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const createProductReview = async (payload) => {
    try {
        const response = await axiosInstance.post("/api/reviews", payload);
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getMyReviews = async () => {
    try {
        const response = await axiosInstance.get("/api/reviews/my");
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateProductReview = async (id, payload) => {
    try {
        const response = await axiosInstance.put(`/api/reviews/${id}`, payload);
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteProductReview = async (id) => {
    try {
        const response = await axiosInstance.delete(`/api/reviews/${id}`);
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const likeProductReview = async (id) => {
    try {
        const response = await axiosInstance.post(`/api/reviews/${id}/like`);
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const unlikeProductReview = async (id) => {
    try {
        const response = await axiosInstance.delete(`/api/reviews/${id}/like`);
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getSellerReviews = async (params = {}) => {
    try {
        const response = await axiosInstance.get("/api/seller/reviews", { params });
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const respondSellerReview = async (id, responseText) => {
    try {
        const response = await axiosInstance.post(`/api/seller/reviews/${id}/response`, { response: responseText });
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateSellerReviewVisibility = async (id, status) => {
    try {
        const response = await axiosInstance.patch(`/api/seller/reviews/${id}/visibility`, null, { params: { status } });
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
