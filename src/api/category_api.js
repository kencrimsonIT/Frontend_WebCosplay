import axiosInstance from "./axios_instance";

export const getActiveCategories = async () => {
    try {
        const response = await axiosInstance.get("/api/products/categories");
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getAllCategories = async () => {
    try {
        const response = await axiosInstance.get("/api/admin/categories");
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const createCategory = async (categoryData) => {
    try {
        const response = await axiosInstance.post("/api/admin/categories", categoryData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateCategory = async (id, categoryData) => {
    try {
        const response = await axiosInstance.put(`/api/admin/categories/${id}`, categoryData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteCategory = async (id) => {
    try {
        const response = await axiosInstance.delete(`/api/admin/categories/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
