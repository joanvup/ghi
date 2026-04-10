import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas reales
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import ChildrenView from './pages/ChildrenView';
import AdminView from './pages/AdminView';        // NUEVO
import TrackingsView from './pages/TrackingsView'; // NUEVO

const AppRoutes = () => {
    const { token } = useContext(AuthContext);

    return (
        <Router>
            <Routes>
                {/* Ruta Pública */}
                <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />

                {/* Rutas Protegidas */}
                <Route path="/" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
                
                <Route path="/ninos" element={<ProtectedRoute requiredModule="GESTION_NINOS"><MainLayout><ChildrenView /></MainLayout></ProtectedRoute>} />

                {/* Ruta de Seguimientos (Protegida por ejemplo por el Modulo 1 para que docentes entren) */}
                <Route path="/seguimientos" element={<ProtectedRoute requiredModule="MODULO_1"><MainLayout><TrackingsView /></MainLayout></ProtectedRoute>} />

                {/* Ruta del Super Administrador */}
                <Route path="/admin" element={<ProtectedRoute requiredModule="ADMINISTRACION"><MainLayout><AdminView /></MainLayout></ProtectedRoute>} />

                {/* Ruta comodín */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
};

function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

export default App;