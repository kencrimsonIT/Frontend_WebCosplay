import axiosInstance from './axios_instance'

export const getModerationReviews = (status = null, page = 0, size = 20) =>
    axiosInstance.get('/api/admin/moderation/reviews', {
        params: { ...(status && { status }), page, size }
    }).then(r => r.data)

export const moderateReview = (id, status, note = '') =>
    axiosInstance.patch(`/api/admin/moderation/reviews/${id}`, { status, note })
        .then(r => r.data)

export const getModerationStats = () =>
    axiosInstance.get('/api/admin/moderation/stats').then(r => r.data)
export const reportReview = (reviewId, reason, detail = '') =>
    axiosInstance.post(`/api/reviews/${reviewId}/report`, { reason, detail })
        .then(r => r.data)
export const getBannedKeywords = async () => {
    const response = await axiosInstance.get('/api/admin/moderation/banned-keywords');
    return response.data;
};

export const updateBannedKeywords = async (keywords) => {
    const response = await axiosInstance.put('/api/admin/moderation/banned-keywords', { keywords });
    return response.data;
};