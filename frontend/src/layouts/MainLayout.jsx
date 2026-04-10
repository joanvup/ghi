import React, { useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LayoutDashboard, Users, Baby, FileText, Settings, LogOut, Menu, X } from 'lucide-react';

const MainLayout = ({ children }) => {
    const { user, logout } = useContext(AuthContext);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const navLinks = [
        { path: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
        { path: '/ninos', label: 'Gestión de Niños', icon: <Baby className="w-5 h-5" />, module: 'GESTION_NINOS' },
        { path: '/seguimientos', label: 'Seguimientos', icon: <FileText className="w-5 h-5" />, module: 'MODULO_1' },
        { path: '/admin', label: 'Administración', icon: <Settings className="w-5 h-5" />, module: 'ADMINISTRACION' },
    ];

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Overlay para móviles */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 bg-white w-64 shadow-xl z-30 transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-16 flex items-center justify-between px-6 bg-blue-600 text-white">
                    <h1 className="text-xl font-bold truncate">Hogares APP</h1>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="p-4 space-y-2">
                    {navLinks.map((link) => {
                        // Ocultar si requiere un módulo que el usuario no tiene
                        if (link.module && !user.modules.includes(link.module)) return null;

                        return (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`
                                }
                            >
                                {link.icon}
                                {link.label}
                            </NavLink>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white shadow flex items-center justify-between px-4 sm:px-6 z-10">
                    <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-gray-600">
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="flex-1"></div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-gray-800">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors title='Cerrar Sesión'"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;