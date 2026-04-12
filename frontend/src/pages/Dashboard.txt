import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, FileCheck, AlertTriangle, Activity } from 'lucide-react';

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

    if (loading) return <div className="text-center p-10">Cargando métricas...</div>;
    if (!stats) return <div className="text-center p-10 text-red-500">Error al cargar datos.</div>;

    const cards = [
        { title: 'Total Niños Registrados', value: stats.total_children, icon: <Users className="w-8 h-8 text-blue-500" />, color: 'border-blue-500' },
        { title: 'Seguimientos Realizados', value: stats.total_trackings, icon: <FileCheck className="w-8 h-8 text-green-500" />, color: 'border-green-500' },
        { title: 'Casos en Riesgo (Mod 3)', value: stats.rights_risks.risk_total || 0, icon: <AlertTriangle className="w-8 h-8 text-red-500" />, color: 'border-red-500' },
        { title: 'Vacunas al Día (Mod 4)', value: stats.health_stats.vaccines_ok || 0, icon: <Activity className="w-8 h-8 text-purple-500" />, color: 'border-purple-500' },
    ];

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Panel de Control General</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {cards.map((card, idx) => (
                    <div key={idx} className={`bg-white rounded-xl shadow p-6 border-b-4 ${card.color}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium mb-1">{card.title}</p>
                                <h3 className="text-3xl font-bold text-gray-800">{card.value}</h3>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-full">
                                {card.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Niños por Sede (Hogar Infantil)</h2>
                <div className="space-y-4">
                    {stats.children_by_facility.length === 0 && <p className="text-sm text-gray-500">No hay datos registrados aún.</p>}
                    {stats.children_by_facility.map((fac, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-700">{fac.facility}</span>
                            <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-sm font-bold">{fac.count} registrados</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;