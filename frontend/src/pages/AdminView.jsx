import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, Shield, Plus, Edit, Trash2 } from 'lucide-react';

const AdminView = () => {
    const [activeTab, setActiveTab] = useState('users'); // 'users' o 'roles'
    
    // Estados
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [modules, setModules] = useState([]);
    
    // Formulario Usuario
    const [showUserModal, setShowUserModal] = useState(false);
    const [userForm, setUserForm] = useState({ id: null, name: '', email: '', password: '', role_id: '' });

    // Formulario Rol
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [roleForm, setRoleForm] = useState({ id: null, name: '', description: '', modules: [] });

    const loadData = async () => {
        try {
            const [usersRes, rolesRes, modulesRes] = await Promise.all([
                api.get('/users'),
                api.get('/roles'),
                api.get('/modules')
            ]);
            setUsers(usersRes.data.data);
            setRoles(rolesRes.data.data);
            setModules(modulesRes.data.data);
        } catch (error) {
            console.error("Error cargando datos", error);
        }
    };

    useEffect(() => { loadData(); }, []);

    // --- MANEJO DE USUARIOS ---
    const saveUser = async (e) => {
        e.preventDefault();
        try {
            if (userForm.id) {
                await api.put(`/users/${userForm.id}`, userForm);
            } else {
                await api.post('/users', userForm);
            }
            setShowUserModal(false);
            loadData();
        } catch (error) {
            alert(error.response?.data?.message || "Error al guardar usuario");
        }
    };

    const deleteUser = async (id) => {
        if (!window.confirm("¿Desactivar este usuario?")) return;
        await api.delete(`/users/${id}`);
        loadData();
    };

    // --- MANEJO DE ROLES ---
    const handleModuleToggle = (modId) => {
        setRoleForm(prev => {
            const has = prev.modules.includes(modId);
            return {
                ...prev,
                modules: has ? prev.modules.filter(id => id !== modId) : [...prev.modules, modId]
            };
        });
    };

    const saveRole = async (e) => {
        e.preventDefault();
        try {
            if (roleForm.id) {
                await api.put(`/roles/${roleForm.id}`, roleForm);
            } else {
                await api.post('/roles', roleForm);
            }
            setShowRoleModal(false);
            loadData();
        } catch (error) {
            alert(error.response?.data?.message || "Error al guardar rol");
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Administración del Sistema</h1>

            {/* Pestañas */}
            <div className="flex border-b mb-6">
                <button 
                    onClick={() => setActiveTab('users')} 
                    className={`flex items-center gap-2 py-3 px-6 font-semibold border-b-2 transition-colors ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Users className="w-5 h-5" /> Usuarios
                </button>
                <button 
                    onClick={() => setActiveTab('roles')} 
                    className={`flex items-center gap-2 py-3 px-6 font-semibold border-b-2 transition-colors ${activeTab === 'roles' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Shield className="w-5 h-5" /> Roles y Permisos
                </button>
            </div>

            {/* CONTENIDO USUARIOS */}
            {activeTab === 'users' && (
                <div>
                    <button onClick={() => { setUserForm({ id: null, name: '', email: '', password: '', role_id: '' }); setShowUserModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded mb-4 flex items-center gap-2">
                        <Plus className="w-4 h-4"/> Nuevo Usuario
                    </button>
                    <div className="bg-white rounded shadow overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50"><tr><th className="p-3">Nombre</th><th className="p-3">Correo</th><th className="p-3">Rol</th><th className="p-3">Estado</th><th className="p-3">Acciones</th></tr></thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} className="border-b">
                                        <td className="p-3 font-medium">{u.name}</td><td className="p-3">{u.email}</td><td className="p-3">{u.role_name}</td>
                                        <td className="p-3">{u.status === 1 ? <span className="text-green-600 font-bold">Activo</span> : <span className="text-red-600 font-bold">Inactivo</span>}</td>
                                        <td className="p-3 flex gap-2">
                                            <button onClick={() => { setUserForm(u); setShowUserModal(true); }} className="text-blue-500"><Edit className="w-4 h-4"/></button>
                                            <button onClick={() => deleteUser(u.id)} className="text-red-500"><Trash2 className="w-4 h-4"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* CONTENIDO ROLES */}
            {activeTab === 'roles' && (
                <div>
                    <button onClick={() => { setRoleForm({ id: null, name: '', description: '', modules: [] }); setShowRoleModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded mb-4 flex items-center gap-2">
                        <Plus className="w-4 h-4"/> Nuevo Rol
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {roles.map(r => (
                            <div key={r.id} className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
                                <div className="flex justify-between">
                                    <h3 className="font-bold text-lg">{r.name}</h3>
                                    <button onClick={() => { setRoleForm({ ...r, modules: r.modules.map(m => m.id) }); setShowRoleModal(true); }} className="text-blue-500"><Edit className="w-4 h-4"/></button>
                                </div>
                                <p className="text-gray-500 text-sm mb-3">{r.description || 'Sin descripción'}</p>
                                <div className="flex flex-wrap gap-1">
                                    {r.modules.map(m => <span key={m.id} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">{m.name}</span>)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MODAL USUARIO */}
            {showUserModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">{userForm.id ? 'Editar' : 'Nuevo'} Usuario</h2>
                        <form onSubmit={saveUser} className="space-y-4">
                            <input className="w-full border p-2 rounded" placeholder="Nombre completo" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} required />
                            <input type="email" className="w-full border p-2 rounded" placeholder="Correo electrónico" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} required />
                            {!userForm.id && <input type="password" className="w-full border p-2 rounded" placeholder="Contraseña" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} required />}
                            <select className="w-full border p-2 rounded" value={userForm.role_id} onChange={e => setUserForm({...userForm, role_id: e.target.value})} required>
                                <option value="">Seleccione un Rol...</option>
                                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL ROL */}
            {showRoleModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-4">{roleForm.id ? 'Editar' : 'Nuevo'} Rol</h2>
                        <form onSubmit={saveRole} className="space-y-4">
                            <input className="w-full border p-2 rounded" placeholder="Nombre del Rol (Ej: Docente)" value={roleForm.name} onChange={e => setRoleForm({...roleForm, name: e.target.value})} required />
                            <input className="w-full border p-2 rounded" placeholder="Descripción" value={roleForm.description} onChange={e => setRoleForm({...roleForm, description: e.target.value})} />
                            <div className="border p-3 rounded h-48 overflow-y-auto bg-gray-50">
                                <h4 className="font-bold text-sm mb-2">Permisos / Módulos</h4>
                                {modules.map(m => (
                                    <label key={m.id} className="flex items-center gap-2 mb-2 text-sm cursor-pointer">
                                        <input type="checkbox" checked={roleForm.modules.includes(m.id)} onChange={() => handleModuleToggle(m.id)} />
                                        <span><b>{m.name}</b>: {m.description}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowRoleModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar Rol</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminView;