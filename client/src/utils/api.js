// Global API configuration
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002').replace(/\/+$/, '');

console.log('🌐 API_BASE_URL configured as:', API_BASE_URL);
