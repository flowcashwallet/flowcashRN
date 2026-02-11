export const API_BASE_URL = "https://flowcash-rn.vercel.app/api";
// export const API_BASE_URL = "http://localhost:8000/api";

export const endpoints = {
  auth: {
    login: `${API_BASE_URL}/token/`,
    register: `${API_BASE_URL}/users/register/`,
    refresh: `${API_BASE_URL}/token/refresh/`,
  },
  wallet: {
    transactions: `${API_BASE_URL}/wallet/transactions/`,
    exportExcel: `${API_BASE_URL}/wallet/transactions/export/excel/`,
    exportPdf: `${API_BASE_URL}/wallet/transactions/export/pdf/`,
    budget: `${API_BASE_URL}/wallet/budget/current/`,
    categories: `${API_BASE_URL}/wallet/categories/`,
    predictCategory: `${API_BASE_URL}/wallet/categories/predict/`,
    subscriptions: `${API_BASE_URL}/wallet/subscriptions/`,
    vision: `${API_BASE_URL}/wallet/vision/`,
    exportVisionExcel: `${API_BASE_URL}/wallet/vision/export/excel/`,
    exportVisionPdf: `${API_BASE_URL}/wallet/vision/export/pdf/`,
    debtPlan: `${API_BASE_URL}/wallet/vision/debt-plan/`,
    gamification: `${API_BASE_URL}/wallet/gamification/current/`,
    forecast: `${API_BASE_URL}/wallet/analytics/forecast/`,
  },
};

export const getAuthHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});
