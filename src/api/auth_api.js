import axiosInstance from "./axios_instance";

export const register = async (userData) => {
    try {
        const response = await axiosInstance.post("/api/v1/auth/register", userData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const login = async (credentials) => {
    try {
        const response = await axiosInstance.post("/api/v1/auth/login", credentials);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const verifyEmail = async (token) => {
    try {
        const response = await axiosInstance.get(`/api/v1/auth/verify?token=${token}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getCurrentUser = async () => {
    try {
        const response = await axiosInstance.get("/api/v1/auth/me");
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getGoogleLoginUrl = () => {
    return "http://localhost:8080/oauth2/authorization/google";
};

export const getFacebookLoginUrl = () => {
    return "http://localhost:8080/oauth2/authorization/facebook";
};

export const changePassword = async (passwordData) => {
    try {
        const response = await axiosInstance.post("/api/v1/auth/change-password", passwordData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const forgotPassword = async (email) => {
    try {
        const response = await axiosInstance.post("/api/v1/auth/forgot-password", { email });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const resetPassword = async (resetData) => {
    try {
        const response = await axiosInstance.post("/api/v1/auth/reset-password", resetData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
