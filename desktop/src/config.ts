// API + socket/file origin. In production set VITE_API_URL (e.g.
// https://api.yourdomain.com/api). Falls back to localhost for local dev.
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const API_URL = API;
// Backend origin (used for Socket.IO and /uploads images) = API without /api.
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API.replace(/\/api\/?$/, '');
