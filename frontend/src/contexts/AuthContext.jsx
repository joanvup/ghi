import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Validar si el token expiró
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    const storedUser = JSON.parse(localStorage.getItem('user'));
                    setUser(storedUser);
                }
            } catch (error) {
                logout();
            }
        }
        setLoading(false);
    }, [token]);

    const login = async (email, password) => {
        try {
            const response = await api.post('/login', { email, password });

            // Si el backend responde correctamente que el login fue exitoso
            if (response.data && response.data.success) {
                const { token, user } = response.data.data;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                setToken(token);
                setUser(user);
                return { success: true };
            }

            // Si el backend responde (Status 200) pero con un mensaje de error (Ej: Error de BD)
            return {
                success: false,
                message: response.data?.message || 'Error devuelto por el servidor.'
            };

        } catch (error) {
            // Si hay un error de red (404, 401, 500)
            return {
                success: false,
                message: error.response?.data?.message || 'Error de conexión. Revisa que tu servidor PHP esté encendido.'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};