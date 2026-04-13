import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Download, Activity, HeartPulse, BrainCircuit, ShieldAlert, FileWarning } from 'lucide-react';

const ReportsView = () => {
    const [activeTab, setActiveTab] = useState('nutritional');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Opciones de Reportes
    const tabs = [
        { id: 'nutritional', label: 'Riesgo Nutricional', icon: <Activity className="w-5 h-5"/>, color: 'text-red-600', bg: 'bg-red-50' },
        { id: 'pedagogical', label: 'Alerta Pedagógica', icon: <BrainCircuit className="w-5 h-5"/>, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { id: 'family', label: 'Riesgo Familia', icon: <ShieldAlert className="w-5 h-5"/>, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'health', label: 'Faltas en Salud', icon: <HeartPulse className="w-5 h-5"/>, color: 'text-emerald-600', bg: 'bg-emerald-50' }
    ];

    const fetchReport = async (tabId) => {
        setLoading(true);
        try {
            const res = await api.get(`/reports/${tabId}`);
            setData(res.data.data || []);
        } catch (error) {
            console.error("Error al cargar el reporte", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport(activeTab);
    }, [activeTab]);

    // Función para exportar JSON a CSV (Compatible con Excel)
    const exportToCSV = () => {
        if (data.length === 0) return alert("No hay datos para exportar.");

        // 1. Obtener cabeceras (Keys del primer objeto)
        const headers = Object.keys(data[0]);
        
        // 2. Formatear cada fila
        const csvRows = data.map(row => {
            return headers.map(fieldName => {
                let cellData = row[fieldName] === null || row[fieldName] === undefined ? '' : row[fieldName];
                // Limpiar saltos de línea y comillas para CSV
                cellData = String(cellData).replace(/"/g, '""');
                return `"${cellData}"`; // Envolver en comillas
            }).join(',');
        });

        // 3. Unir cabeceras y filas con salto de línea (\n)
        const csvContent = [headers.join(','), ...csvRows].join('\n');

        // 4. Crear Blob y descargar (Añadiendo BOM para UTF-8 en Excel)
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Reporte_${activeTab}_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Renderizadores Dinámicos de Tabla según la Pestaña
    const renderTableContent = () => {
        if (loading) return <tr><td colSpan="10" className="p-8 text-center text-gray-500 font-medium">Cargando reporte...</td></tr>;
        if (data.length === 0) return <tr><td colSpan="10" className="p-8 text-center text-gray-500 font-medium">No se encontraron alertas para este indicador. ¡Todo está en orden! <FileWarning className="w-6 h-6 mx-auto mt-2 text-gray-400"/></td></tr>;

        return data.map((row, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50 transition-colors text-sm">
                <td className="p-4 font-bold text-gray-800">{row.names} {row.surnames}</td>
                <td className="p-4 font-mono text-xs">{row.civil_registry}</td>
                <td className="p-4 font-bold text-gray-600">{row.facility}</td>
                <td className="p-4 text-xs">
                    <span className="text-blue-600 font-bold">{row.tracking_code}</span><br/>
                    <span className="text-gray-500">{row.tracking_date}</span>
                </td>
                <td className="p-4 text-xs italic text-gray-600">{row.teacher}</td>
                
                {/* Columnas Dinámicas */}
                {activeTab === 'nutritional' && (
                    <>
                        <td className="p-4 font-bold text-center">Toma #{row.take_number}</td>
                        <td className="p-4 text-center">{row.weight_kg} kg</td>
                        <td className="p-4 text-center">{row.height_cm} cm</td>
                        <td className="p-4 font-bold text-red-600 text-center">{row.nutritional_classification}</td>
                    </>
                )}
                {activeTab === 'pedagogical' && (
                    <>
                        <td className="p-4 font-bold text-indigo-600 text-center">{row.qualitative_val}</td>
                        <td className="p-4 text-xs text-gray-600">{row.qualitative_no_reason || 'N/A'}</td>
                    </>
                )}
                {activeTab === 'family' && (
                    <>
                        <td className="p-4 text-center">{row.risk_situations == 1 ? <span className="text-red-500 font-bold">Sí</span> : '-'}</td>
                        <td className="p-4 text-center">{row.rights_restoration == 1 ? <span className="text-red-500 font-bold">Sí</span> : '-'}</td>
                        <td className="p-4 text-center">{row.routes_articulation == 1 ? <span className="text-red-500 font-bold">Sí</span> : '-'}</td>
                    </>
                )}
                {activeTab === 'health' && (
                    <>
                        <td className="p-4 text-center">{row.health_affiliated == 0 ? <span className="text-red-500 font-bold">No Afiliado</span> : '-'}</td>
                        <td className="p-4 text-center">{row.vaccines_updated == 0 ? <span className="text-red-500 font-bold">Incompleto</span> : '-'}</td>
                        <td className="p-4 text-center">{row.growth_chart == 0 ? <span className="text-red-500 font-bold">Sin Carnet</span> : '-'}</td>
                    </>
                )}
            </tr>
        ));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center border-b-2 border-gray-200 pb-3 gap-4">
                <div className="flex items-center gap-3">
                    <Activity className="w-8 h-8 text-blue-600"/>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight">Reportes y Auditoría</h1>
                </div>
                <button 
                    onClick={exportToCSV}
                    disabled={data.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download className="w-5 h-5"/> Exportar a Excel (CSV)
                </button>
            </div>

            {/* PESTAÑAS (TABS) */}
            <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold transition-all ${activeTab === tab.id ? `${tab.bg} ${tab.color} shadow-md border border-transparent` : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* TABLA DINÁMICA */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-100 border-b text-gray-800">
                            <tr>
                                <th className="p-4 font-bold">Niño/a Participante</th>
                                <th className="p-4 font-bold">Registro Civil</th>
                                <th className="p-4 font-bold">Sede</th>
                                <th className="p-4 font-bold">Seguimiento</th>
                                <th className="p-4 font-bold">Docente / Evaluador</th>
                                
                                {/* Cabeceras Dinámicas */}
                                {activeTab === 'nutritional' && (<><th className="p-4 font-bold text-center">Toma</th><th className="p-4 font-bold text-center">Peso</th><th className="p-4 font-bold text-center">Talla</th><th className="p-4 font-bold text-center text-red-600">Alerta Nutricional</th></>)}
                                {activeTab === 'pedagogical' && (<><th className="p-4 font-bold text-center text-indigo-600">Valoración</th><th className="p-4 font-bold">Motivo Escala (Por qué No)</th></>)}
                                {activeTab === 'family' && (<><th className="p-4 font-bold text-center text-amber-600">Riesgo</th><th className="p-4 font-bold text-center text-amber-600">Restablecimiento</th><th className="p-4 font-bold text-center text-amber-600">Rutas</th></>)}
                                {activeTab === 'health' && (<><th className="p-4 font-bold text-center text-emerald-600">Salud</th><th className="p-4 font-bold text-center text-emerald-600">Vacunas</th><th className="p-4 font-bold text-center text-emerald-600">Crecimiento</th></>)}
                            </tr>
                        </thead>
                        <tbody>
                            {renderTableContent()}
                        </tbody>
                    </table>
                </div>
                {/* Resumen Faldón */}
                {!loading && data.length > 0 && (
                    <div className="bg-gray-50 border-t p-4 text-sm text-gray-600 font-medium">
                        Total de alertas encontradas en este reporte: <span className="font-black text-gray-800">{data.length} registros</span>.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsView;