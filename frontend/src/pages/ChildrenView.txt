import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Download, Upload, Plus, Trash2, Edit } from 'lucide-react';

const ChildrenView = () => {
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showImportModal, setShowImportModal] = useState(false);
    const [file, setFile] = useState(null);

    const fetchChildren = async () => {
        setLoading(true);
        try {
            const res = await api.get('/children');
            setChildren(res.data.data);
        } catch (error) {
            alert("Error cargando la lista de niños");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchChildren(); }, []);

    const downloadTemplate = async () => {
        try {
            const res = await api.get('/children/template', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Plantilla_Ninos.xlsx');
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            alert("Error al descargar la plantilla.");
        }
    };

    const handleImport = async (e) => {
        e.preventDefault();
        if (!file) return alert("Seleccione un archivo");
        
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/children/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(res.data.message);
            setShowImportModal(false);
            setFile(null);
            fetchChildren();
        } catch (error) {
            alert(error.response?.data?.message || "Error al importar el archivo");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Está seguro de eliminar este registro permanentemente?")) return;
        try {
            await api.delete(`/children/${id}`);
            fetchChildren();
        } catch (error) {
            alert("Error al eliminar");
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Gestión de Niños/as</h1>
                <div className="flex gap-2">
                    <button 
                        onClick={downloadTemplate}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
                    >
                        <Download className="w-4 h-4" /> Plantilla
                    </button>
                    <button 
                        onClick={() => setShowImportModal(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
                    >
                        <Upload className="w-4 h-4" /> Importar
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium opacity-50 cursor-not-allowed title='Disponible en próxima versión'">
                        <Plus className="w-4 h-4" /> Nuevo Manual
                    </button>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 border-b text-gray-800">
                        <tr>
                            <th className="p-4 font-semibold">Nombres y Apellidos</th>
                            <th className="p-4 font-semibold">Registro Civil</th>
                            <th className="p-4 font-semibold">Edad</th>
                            <th className="p-4 font-semibold">Sede</th>
                            <th className="p-4 font-semibold text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan="5" className="p-4 text-center">Cargando...</td></tr> : null}
                        {!loading && children.length === 0 && <tr><td colSpan="5" className="p-4 text-center">No hay niños registrados.</td></tr>}
                        {children.map(child => (
                            <tr key={child.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-medium text-gray-800">{child.names} {child.surnames}</td>
                                <td className="p-4">{child.civil_registry}</td>
                                <td className="p-4">{child.age} años</td>
                                <td className="p-4">{child.facility}</td>
                                <td className="p-4 text-center flex justify-center gap-2">
                                    <button onClick={() => handleDelete(child.id)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Importar */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Importar desde Excel</h2>
                        <p className="text-sm text-gray-500 mb-4">Asegúrese de usar la plantilla oficial. Los registros duplicados serán omitidos.</p>
                        <form onSubmit={handleImport}>
                            <input 
                                type="file" 
                                accept=".xlsx, .xls" 
                                onChange={(e) => setFile(e.target.files[0])}
                                className="w-full border p-2 rounded mb-4"
                                required
                            />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowImportModal(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200">Cancelar</button>
                                <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700">Procesar Archivo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChildrenView;