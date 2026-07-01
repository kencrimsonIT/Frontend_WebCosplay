// ═══ src/api/insurance_api.js ═════════════════════════════════════════════
import axiosInstance from './axios_instance'

// PUBLIC: gói bảo hiểm đang active (dùng ở checkout)
export const getInsurancePlans = () =>
    axiosInstance.get('/api/insurance/plans').then(r => r.data)

// ADMIN: tất cả gói (kể cả inactive)
export const adminGetPlans = () =>
    axiosInstance.get('/api/admin/insurance/plans').then(r => r.data)

export const adminCreatePlan = (data) =>
    axiosInstance.post('/api/admin/insurance/plans', data).then(r => r.data)

export const adminUpdatePlan = (id, data) =>
    axiosInstance.put(`/api/admin/insurance/plans/${id}`, data).then(r => r.data)

export const adminTogglePlan = (id) =>
    axiosInstance.patch(`/api/admin/insurance/plans/${id}/toggle`).then(r => r.data)

// ADMIN: claims
export const adminGetClaims = (status = null, page = 0, size = 20) =>
    axiosInstance.get('/api/admin/insurance/claims', {
        params: { ...(status && { status }), page, size }
    }).then(r => r.data)

export const adminCreateClaim = (data) =>
    axiosInstance.post('/api/admin/insurance/claims', data).then(r => r.data)

export const adminVerifyClaim = (id) =>
    axiosInstance.patch(`/api/admin/insurance/claims/${id}/verify`).then(r => r.data)

export const adminResolveClaim = (id, data) =>
    axiosInstance.patch(`/api/admin/insurance/claims/${id}/resolve`, data).then(r => r.data)

export const adminGetInsuranceStats = () =>
    axiosInstance.get('/api/admin/insurance/stats').then(r => r.data)
// Thêm hàm này vào insurance_api.js
export const getPublicPlans = async () => {
    const response = await axiosInstance.get("/api/insurance/plans");
    return response.data;
};