import axiosInstance from "./axios_instance";

export const createOnlinePayment = async (paymentData) => {
    try {
        const response = await axiosInstance.post("/api/payments/online/create", paymentData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getPaymentStatus = async (txnRef) => {
    try {
        const response = await axiosInstance.get(`/api/payments/${txnRef}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
