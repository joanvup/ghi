import axios from 'axios';

// Asegúrate de cambiar esto según la carpeta donde corre tu PHP en Laragon/XAMPP
// Por ejemplo: 'http://localhost/tu-carpeta/backend'
// const API_URL = 'http://localhost/api'; 
const API_URL = 'http://ghi.test/backend';
// const API_URL = 'http://ghi.test/ghi/backend';
// const API_URL = 'https://ghi.colegiobilingue.edu.co/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para inyectar el Token en cada petición
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para capturar Token expirado y cerrar sesión automáticamente
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;