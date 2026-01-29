import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

// JWT 토큰 인터셉터
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 응답 시 토큰 제거 (리다이렉트는 AuthContext에서 처리)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then(res => res.data);

export const register = (email, password, name) =>
  api.post('/auth/register', { email, password, name }).then(res => res.data);

export const getCurrentUser = () =>
  api.get('/auth/me').then(res => res.data);

// Rack API
export const getRacks = () => api.get('/racks').then(res => res.data);
export const getRack = (id) => api.get(`/racks/${id}`).then(res => res.data);
export const createRack = (data) => api.post('/racks', data).then(res => res.data);
export const updateRack = (id, data) => api.put(`/racks/${id}`, data).then(res => res.data);
export const deleteRack = (id) => api.delete(`/racks/${id}`);

// Gecko API
export const getGeckos = () => api.get('/geckos').then(res => res.data);
export const getGecko = (id) => api.get(`/geckos/${id}`).then(res => res.data);
export const createGecko = (data) => api.post('/geckos', data).then(res => res.data);
export const updateGecko = (id, data) => api.put(`/geckos/${id}`, data).then(res => res.data);
export const moveGecko = (id, data) => api.patch(`/geckos/${id}/move`, data).then(res => res.data);
export const swapGeckos = (geckoId1, geckoId2) => api.post('/geckos/swap', { geckoId1, geckoId2 }).then(res => res.data);
export const deleteGecko = (id) => api.delete(`/geckos/${id}`);

// Photo API (legacy - single photo)
export const uploadGeckoPhoto = (geckoId, file) => {
  const formData = new FormData();
  formData.append('photo', file);
  return api.post(`/geckos/${geckoId}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data);
};
export const deleteGeckoPhoto = (geckoId) => api.delete(`/geckos/${geckoId}/photo`);

// Photo Gallery API (multiple photos)
export const getGeckoPhotos = (geckoId) => api.get(`/geckos/${geckoId}/photos`).then(res => res.data);
export const uploadGeckoPhotoWithDate = (geckoId, file, takenAt) => {
  const formData = new FormData();
  formData.append('photo', file);
  if (takenAt) formData.append('takenAt', takenAt);
  return api.post(`/geckos/${geckoId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data);
};
export const setMainPhoto = (photoId) => api.patch(`/photos/${photoId}/main`).then(res => res.data);
export const deletePhoto = (photoId) => api.delete(`/photos/${photoId}`);

// Care Log API
export const getGeckoLogs = (geckoId) => api.get(`/geckos/${geckoId}/logs`).then(res => res.data);
export const createCareLog = (geckoId, data) => api.post(`/geckos/${geckoId}/logs`, data).then(res => res.data);
export const deleteCareLog = (id) => api.delete(`/logs/${id}`);

// Alerts API
export const getAlerts = () => api.get('/alerts').then(res => res.data);
