import axiosInstance from "./axios_instance";

// Users
export const adminListUsers = async () => {
    try {
        const response = await axiosInstance.get("/api/admin/users");
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const adminCreateUser = async (userData) => {
    try {
        const response = await axiosInstance.post("/api/admin/users", userData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const adminUpdateUser = async (id, userData) => {
    try {
        const response = await axiosInstance.put(`/api/admin/users/${id}`, userData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const adminToggleUser = async (id) => {
    try {
        const response = await axiosInstance.patch(`/api/admin/users/${id}/toggle`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const adminDeleteUser = async (id) => {
    try {
        const response = await axiosInstance.delete(`/api/admin/users/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Products
export const adminListProducts = async () => {
    try {
        const response = await axiosInstance.get("/api/admin/products");
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const adminCreateProduct = async (productData) => {
    try {
        const response = await axiosInstance.post("/api/admin/products", productData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const adminUpdateProduct = async (id, productData) => {
    try {
        const response = await axiosInstance.put(`/api/admin/products/${id}`, productData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const adminToggleProduct = async (id) => {
    try {
        const response = await axiosInstance.patch(`/api/admin/products/${id}/toggle`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const adminDeleteProduct = async (id) => {
    try {
        const response = await axiosInstance.delete(`/api/admin/products/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Orders
export const adminListOrders = async () => {
    try {
        const response = await axiosInstance.get("/api/admin/orders");
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const adminUpdateOrderStatus = async (id, statusData) => {
    try {
        const response = await axiosInstance.patch(`/api/admin/orders/${id}/status`, statusData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
