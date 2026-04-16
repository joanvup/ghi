import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = () => {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);
        if (!result.success) {
            setError(result.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            
            {/* =========================================
                PANEL IZQUIERDO (Decorativo / Branding) 
                Oculto en celulares, visible en PC
                ========================================= */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 flex-col justify-between p-12 relative overflow-hidden">
                
                {/* Elementos decorativos de fondo (Círculos difuminados) */}
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

                {/* Logo y Nombre de la Empresa */}
                <div className="relative z-10 flex items-center gap-4">
                    <div className="bg-white p-2 rounded-xl shadow-lg">
                        <img src="/icon-192x192.png" alt="Logo Grupo Timón" className="w-12 h-12 object-contain" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Grupo Timón</h1>
                        <p className="text-blue-200 text-sm font-medium uppercase tracking-widest">Plataforma de Gestión</p>
                    </div>
                </div>

                {/* Mensaje Central */}
                <div className="relative z-10 max-w-md">
                    <h2 className="text-4xl font-black text-white mb-6 leading-tight">
                        Transformando el cuidado y seguimiento infantil.
                    </h2>
                    <p className="text-blue-100 text-lg leading-relaxed">
                        Accede a tu panel gerencial para administrar seguimientos, visualizar estadísticas en tiempo real y asegurar el bienestar de los participantes.
                    </p>
                </div>

                {/* Footer del Panel */}
                <div className="relative z-10 flex items-center gap-2 text-blue-200 text-sm">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>Sistema encriptado y seguro v1.0.0</span>
                </div>
            </div>

            {/* =========================================
                PANEL DERECHO (Formulario de Login) 
                ========================================= */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-white">
                
                {/* Logo visible solo en móviles */}
                <div className="absolute top-8 left-8 flex lg:hidden items-center gap-3">
                    <img src="/icon-192x192.png" alt="Logo Grupo Timón" className="w-10 h-10 object-contain drop-shadow-md" />
                    <span className="text-xl font-black text-blue-800">Grupo Timón</span>
                </div>

                <div className="w-full max-w-md space-y-8">
                    {/* Encabezado del Formulario */}
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Bienvenido de nuevo</h2>
                        <p className="text-gray-500 mt-2 text-sm">Por favor, ingresa tus credenciales institucionales para acceder a tu cuenta.</p>
                    </div>

                    {/* Alerta de Error */}
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3 text-sm font-medium text-red-700 animate-fade-in-down">
                            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                        
                        {/* Input Correo */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Correo Electrónico</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input 
                                    type="email" 
                                    required
                                    disabled={loading}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                                    placeholder="usuario@grupotimon.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Input Contraseña */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-bold text-gray-700">Contraseña</label>
                                <Link to="/forgot-password" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                                    ¿Olvidaste tu clave?
                                </Link>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input 
                                    type="password" 
                                    required
                                    disabled={loading}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Botón de Ingreso */}
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Verificando credenciales...
                                </>
                            ) : (
                                <>Ingresar a la Plataforma <ArrowRight className="w-5 h-5"/></>
                            )}
                        </button>
                    </form>
                    
                    {/* Copyright o Mensaje Inferior */}
                    <p className="text-center text-xs text-gray-400 font-medium mt-8">
                        &copy; {new Date().getFullYear()} Grupo Timón. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;