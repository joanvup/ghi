import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, FileCheck, AlertTriangle, HeartPulse, Activity, BrainCircuit, ShieldAlert, GraduationCap, Hospital } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/trackings/statistics');
                setStats(response.data.data);
            } catch (error) {
                console.error("Error cargando estadísticas", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="flex justify-center items-center h-full text-blue-600 font-bold p-10"><Activity className="animate-spin w-8 h-8 mr-3" /> Cargando Panel Gerencial...</div>;
    if (!stats) return <div className="text-center p-10 text-red-500 font-bold bg-red-50 rounded-xl">Error al cargar datos del servidor. Verifique la conexión a MySQL.</div>;

    // Colores corporativos para las gráficas
    const COLORS_DEV = ['#10B981', '#3B82F6', '#EF4444']; // Esperado (Verde), Avanzado (Azul), En Riesgo (Rojo)
    const COLORS_HEALTH = ['#8B5CF6', '#F59E0B', '#06B6D4', '#64748B']; // EPS Colores
    const COLORS_FACILITY = '#3B82F6';

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-gray-200 pb-3">
                <Activity className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">Panel de Control Gerencial</h1>
            </div>

            {/* ==============================
                1. KPI GLOBALES (Tarjetas)
                ============================== */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Niños Totales / Activos */}
                <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Población General</p>
                            <h3 className="text-3xl font-black text-gray-800">{stats.total_children} <span className="text-sm font-medium text-gray-500">niños/as</span></h3>
                        </div>
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Users className="w-6 h-6" /></div>
                    </div>
                    <div className="mt-4 text-sm font-medium flex justify-between border-t pt-2 text-gray-600">
                        <span className="text-emerald-600 font-bold">{stats.active_children} Activos</span>
                        <span className="text-red-500">{stats.retired_children} Retirados</span>
                    </div>
                </div>

                {/* Seguimientos */}
                <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-emerald-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Seguimientos Realizados</p>
                            <h3 className="text-3xl font-black text-gray-800">{stats.total_trackings} <span className="text-sm font-medium text-gray-500">docs</span></h3>
                        </div>
                        <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><FileCheck className="w-6 h-6" /></div>
                    </div>
                    <div className="mt-4 text-xs font-medium border-t pt-2 text-gray-500">Documentos diligenciados en sistema.</div>
                </div>

                {/* Riesgo Modulo 3 */}
                <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-amber-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Alertas Familia/Riesgo</p>
                            <h3 className="text-3xl font-black text-gray-800">{stats.rights_risks.risk_total || 0} <span className="text-sm font-medium text-gray-500">casos</span></h3>
                        </div>
                        <div className="bg-amber-50 p-2 rounded-lg text-amber-600"><ShieldAlert className="w-6 h-6" /></div>
                    </div>
                    <div className="mt-4 text-xs font-medium flex justify-between border-t pt-2 text-amber-700">
                        <span>Restablecimiento Derechos:</span> <span className="font-bold">{stats.rights_risks.restoration_total || 0} activos</span>
                    </div>
                </div>

                {/* Desnutrición Módulo 4 */}
                <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-red-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Riesgo Nutricional</p>
                            <h3 className="text-3xl font-black text-red-600">{stats.malnutrition_alerts || 0} <span className="text-sm font-medium text-gray-500">niños</span></h3>
                        </div>
                        <div className="bg-red-50 p-2 rounded-lg text-red-600"><AlertTriangle className="w-6 h-6" /></div>
                    </div>
                    <div className="mt-4 text-xs font-medium border-t pt-2 text-red-600">Casos detectados en Antropometría.</div>
                </div>
            </div>

            {/* ==============================
                2. GRÁFICAS DE MÓDULOS 
                ============================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* GRÁFICA MÓDULO 2: DESARROLLO PEDAGÓGICO */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center justify-between mb-4 border-b pb-2">
                        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-indigo-500" /> Escala Cualitativa de Desarrollo</h2>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">Módulo 2</span>
                    </div>

                    {stats.development_status?.length > 0 ? (
                        <div className="flex-1 min-h-[250px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stats.development_status} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                        {stats.development_status.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.name === 'ESPERADO' ? COLORS_DEV[0] : entry.name === 'AVANZADO' ? COLORS_DEV[1] : COLORS_DEV[2]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [`${value} Niños`, 'Cantidad']} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Sin datos suficientes para graficar.</div>
                    )}
                </div>

                {/* GRÁFICA MÓDULO 4: SALUD Y RÉGIMEN */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center justify-between mb-4 border-b pb-2">
                        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2"><HeartPulse className="w-5 h-5 text-emerald-500" /> Distribución Régimen de Salud</h2>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Módulo 4</span>
                    </div>

                    {stats.health_regim?.lengthe > 0 ? (
                        <div className="flex-1 min-h-[250px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stats.health_regime} cx="50%" cy="50%" outerRadius={90} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                        {stats.health_regime.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS_HEALTH[index % COLORS_HEALTH.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [`${value} Niños`, 'Cantidad']} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Subindicador de Vacunas Flotante */}
                            <div className="absolute top-0 right-0 bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-center">
                                <p className="text-[10px] font-bold text-emerald-800 uppercase">Vacunas al Día</p>
                                <p className="text-lg font-black text-emerald-600">{((stats.health_stats.vaccines_ok / (stats.health_stats.total_mod4 || 1)) * 100).toFixed(0)}%</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Sin datos suficientes para graficar.</div>
                    )}
                </div>

            </div>

            {/* ==============================
                3. DEMOGRAFÍA Y SEDES
                ============================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* POBLACIÓN POR SEDE (Gráfica de Barras) */}
                <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4 border-b pb-2">
                        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2"><Hospital className="w-5 h-5 text-sky-500" /> Población Registrada por Sede</h2>
                        <span className="text-xs font-bold text-gray-500 uppercase">Hogares Infantiles</span>
                    </div>

                    <div className="min-h-[250px] w-full">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={stats.children_by_facility} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                <Bar dataKey="value" name="Niños Registrados" fill={COLORS_FACILITY} radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* DEMOGRAFÍA MÓDULO 1 */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center justify-between mb-4 border-b pb-2">
                        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-fuchsia-500" /> Demografía y Apoyo</h2>
                        <span className="text-xs font-bold text-fuchsia-600 bg-fuchsia-50 px-2 py-1 rounded">Módulo 1</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center space-y-4">
                        <div className="bg-fuchsia-50 p-4 rounded-xl border border-fuchsia-100 flex justify-between items-center">
                            <div>
                                <h4 className="text-sm font-bold text-gray-800">Participantes con Discapacidad</h4>
                                <p className="text-xs text-gray-500">Reportado en Seguimientos</p>
                            </div>
                            <span className="text-2xl font-black text-fuchsia-600">{stats.demographics?.disability || 0}</span>
                        </div>

                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex justify-between items-center">
                            <div>
                                <h4 className="text-sm font-bold text-gray-800">Requieren Apoyo Especial</h4>
                                <p className="text-xs text-gray-500">Según valoración docente</p>
                            </div>
                            <span className="text-2xl font-black text-indigo-600">{stats.demographics.special_support || 0}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;