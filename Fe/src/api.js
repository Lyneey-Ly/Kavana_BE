import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json', 
  },
});

// Interceptor untuk menyisipkan Token Sanctum
API.interceptors.request.use((config) => {
  // 👇 BEDA DI SINI: Ubah jadi sessionStorage
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;