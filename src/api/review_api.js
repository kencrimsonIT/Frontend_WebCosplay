import axiosInstance from "./axios_instance";

// Gửi đánh giá (cần đăng nhập)
export const submitReview = async ({ orderId, productId, rating, comment }) => {
    const response = await axiosInstance.post("/api/reviews", { orderId, productId, rating, comment });
    return response.data;
};

// Lấy đánh giá của sản phẩm (public)
export const getProductReviews = async (productId) => {
    const response = await axiosInstance.get(`/api/reviews/product/${productId}`);
    return response.data;
};
