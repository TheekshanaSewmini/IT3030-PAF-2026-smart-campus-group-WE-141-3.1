import axios from "axios";

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const normalizedBaseUrl = configuredBaseUrl.replace(/\/+$/, "");

const api = axios.create({
    baseURL: normalizedBaseUrl,
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((request) => {
        if (error) {
            request.reject(error);
            return;
        }

        request.resolve(token);
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const requestUrl = originalRequest?.url || "";
        const isRefreshRequest = requestUrl.includes("/auth/refresh");
        const isAuthBootstrapRequest =
            requestUrl.includes("/auth/login") ||
            requestUrl.includes("/auth/register") ||
            requestUrl.includes("/auth/verify-code") ||
            requestUrl.includes("/auth/resend-otp");

        if (
            error.response?.status === 401 &&
            !originalRequest?._retry &&
            !isRefreshRequest &&
            !isAuthBootstrapRequest
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => api(originalRequest))
                    .catch((queueError) => Promise.reject(queueError));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await api.post("/auth/refresh");
                processQueue(null, "refreshed");
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
