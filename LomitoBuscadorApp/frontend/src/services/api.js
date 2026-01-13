import axios from 'axios';

const API_URL = HERE_YOUR_API_URL; // Reemplaza con tu URL de API I used NGRok tunnel

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    // Header for ngrok.
    'ngrok-skip-browser-warning': 'true',
    
  }
});

// Interceptor for handling request logic
api.interceptors.request.use(
  async (config) => {

    return config;  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling 
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('Error de respuesta:', error.response.data);
    } else if (error.request) {
      console.error('Error de solicitud:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;