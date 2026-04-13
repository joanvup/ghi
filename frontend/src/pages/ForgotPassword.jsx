import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Mail, ArrowLeft, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            const res = await api.post('/forgot-password', { email });
            setMessage(res.data.message);
            setEmail('');
        } catch (err) {
            setError(err.response?.data?.message || "Ocurrió un error al intentar enviar el correo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                
                <div className="mb-6">
                    <Link to="/login" className="text-gray-500 hover:text-blue-600 text-sm font-bold flex items-center gap-1 mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4"/> Volver al Login
                    </Link>
                    <h2 className="text-2xl font-black text-gray-800">Recuperar Contraseña</h2>
                    <p className="text-gray-500 text-sm mt-1">Ingresa tu correo institucional y te enviaremos un enlace para crear una nueva contraseña.</p>
                </div>

                {message && (
                    <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-lg flex items-start gap-3 mb-6 text-sm font-medium">
                        <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span>{message}</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-lg flex items-start gap-3 mb-6 text-sm font-medium">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Correo Electrónico</label>
                        <div className="relative">
                            <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            <input 
                                type="email" 
                                required
                                disabled={loading || message}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow disabled:bg-gray-100"
                                placeholder="docente@hogarinfantil.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading || message}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Enviando enlace...' : <><Send className="w-5 h-5"/> Enviar Instrucciones</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;