import axiosInstance from "./axios_instance";

const unwrap = (response) => response.data?.data ?? response.data;

// ── User endpoints ──

export const createComplaint = async (data) => {
    try {
        const response = await axiosInstance.post("/api/complaints", data);
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getMyComplaints = async () => {
    try {
        const response = await axiosInstance.get("/api/complaints/my-complaints");
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// ── Admin endpoints ──

export const adminGetAllComplaints = async () => {
    try {
        const response = await axiosInstance.get("/api/admin/complaints");
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const adminResolveComplaint = async (id, data) => {
    try {
        const response = await axiosInstance.put(`/api/admin/complaints/${id}/resolve`, data);
        return unwrap(response);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
