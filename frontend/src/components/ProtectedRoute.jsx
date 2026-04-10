import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredModule }) => {
    const { user, token } = useContext(AuthContext);

    // 1. Si no hay sesión, al Login
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // 2. Si la ruta requiere un módulo específico, validarlo
    if (requiredModule && !user.modules.includes(requiredModule)) {
        // Si no tiene permiso, lo enviamos al Dashboard principal
        return <Navigate to="/" replace />;
    }

    // 3. Todo OK, mostrar la página
    return children;
};

export default ProtectedRoute;