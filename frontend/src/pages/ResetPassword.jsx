import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!token) {
            setError("Enlace de recuperación inválido o ausente.");
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError("Las contraseñas no coinciden.");
        }
        if (password.length < 6) {
            return setError("La contraseña debe tener al menos 6 caracteres.");
        }

        setLoading(true);
        setError(null);

        try {
            const res = await api.post('/reset-password', { token, password });
            setMessage(res.data.message);
            // Redirigir al login después de 3 segundos
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Ocurrió un error. Es posible que el enlace haya expirado.");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4"/>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Enlace Inválido</h2>
                    <p className="text-gray-600 text-sm mb-6">Por favor, solicita un nuevo enlace de recuperación desde la pantalla de inicio de sesión.</p>
                    <Link to="/login" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg inline-block">Ir al Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                
                <div className="text-center mb-6">
                    <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="text-emerald-600 w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-800">Nueva Contraseña</h2>
                    <p className="text-gray-500 text-sm mt-1">Establece tu nueva contraseña segura.</p>
                </div>

                {message && (
                    <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-lg flex flex-col items-center justify-center gap-2 mb-6 text-sm font-medium text-center">
                        <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
                        <span>{message}</span>
                        <span className="text-xs mt-1">Redirigiendo al login...</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-lg flex items-start gap-3 mb-6 text-sm font-medium">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {!message && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Nueva Contraseña</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                <input 
                                    type="password" 
                                    required
                                    disabled={loading}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Mínimo 6 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Confirmar Contraseña</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                <input 
                                    type="password" 
                                    required
                                    disabled={loading}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Repite la contraseña"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Guardando...' : <><CheckCircle2 className="w-5 h-5"/> Guardar Contraseña</>}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;