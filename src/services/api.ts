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
    budget: `${API_BASE_URL}/wallet/budget/current/`,
    categories: `${API_BASE_URL}/wallet/categories/`,
    predictCategory: `${API_BASE_URL}/wallet/categories/predict/`,
    subscriptions: `${API_BASE_URL}/wallet/subscriptions/`,
    vision: `${API_BASE_URL}/wallet/vision/`,
    gamification: `${API_BASE_URL}/wallet/gamification/current/`,
  },
};

export const getAuthHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});
