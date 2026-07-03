import axios from 'axios';

const AUTH_KEY = 'pm-squad-auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach the bearer token (persisted by the auth store) to every request.
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // zustand/persist stores under `state`; support a flat shape too.
      const token = parsed?.state?.token || parsed?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // Ignore malformed storage — request just goes out unauthenticated.
  }
  return config;
});

// On 401, clear auth and bounce to the login page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem(AUTH_KEY);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
