import axios from "axios";

// Normalize baseURL to prevent duplicated /api/v1/api/v1 prefixes
const rawUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
const cleanUrl = rawUrl.split('/api/v1')[0].replace(/\/$/, '');

const api = axios.create({
  baseURL: `${cleanUrl}/api/v1`,
});

export default api;