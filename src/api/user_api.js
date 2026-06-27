import axiosInstance from "./axios_instance";

export const getProfile = async () => {
    try {
        const response = await axiosInstance.get("/api/v1/users/profile");
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateProfile = async (profileData) => {
    try {
        const response = await axiosInstance.put("/api/v1/users/profile", profileData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateAvatar = async (file) => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await axiosInstance.post("/api/v1/users/avatar", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getAddresses = async () => {
    try {
        const response = await axiosInstance.get("/api/v1/addresses");
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const addAddress = async (addressData) => {
    try {
        const response = await axiosInstance.post("/api/v1/addresses", addressData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateAddress = async (id, addressData) => {
    try {
        const response = await axiosInstance.put(`/api/v1/addresses/${id}`, addressData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteAddress = async (id) => {
    try {
        const response = await axiosInstance.delete(`/api/v1/addresses/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
