import axiosInstance from "./axios_instance";

export const getRevenueByCategory = async (year, month) => {
    try {
        const params = {};
        if (year) params.year = year;
        if (month) params.month = month;
        const response = await axiosInstance.get("/api/statistics/revenue-by-category", { params });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
