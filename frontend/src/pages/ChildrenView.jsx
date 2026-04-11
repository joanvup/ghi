import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Download, Upload, Plus, Trash2, Edit, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Save, X } from 'lucide-react';

const ChildrenView = () => {
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados de Importación
    const [showImportModal, setShowImportModal] = useState(false);
    const [file, setFile] = useState(null);

    // Estados de Búsqueda y Paginación
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Estados del Formulario (Crear/Editar)
    const [showChildModal, setShowChildModal] = useState(false);
    const [childForm, setChildForm] = useState(getInitialForm());

    function getInitialForm() {
        return {
            id: null, names: '', surnames: '', civil_registry: '', birth_date: '',
            entry_date: '', exit_date: '', gender: 'Masculino', blood_group: 'O', rh: '+',
            eps: '', address: '', facility: '', guardian_relation: 'Madre',
            guardian_name: '', guardian_document: '', guardian_address: '', guardian_phone: ''
        };
    }

    const fetchChildren = async () => {
        setLoading(true);
        try {
            const res = await api.get('/children');
            setChildren(res.data.data || []);
        } catch (error) {
            alert("Error cargando la lista de niños");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchChildren(); }, []);

    // --- LÓGICA DE BÚSQUEDA Y PAGINACIÓN ---
    const filteredChildren = children.filter(c => {
        const term = searchTerm.toLowerCase();
        const fullName = `${c.names} ${c.surnames}`.toLowerCase();
        const registry = String(c.civil_registry).toLowerCase();
        return fullName.includes(term) || registry.includes(term);
    });

    const totalPages = Math.ceil(filteredChildren.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentChildren = filteredChildren.slice(startIndex, startIndex + itemsPerPage);

    // Resetear a página 1 si se busca algo
    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    // Extraer sedes únicas para el datalist
    const uniqueFacilities = [...new Set(children.map(c => c.facility))].filter(Boolean);

    // --- FUNCIONES DE FORMULARIO ---
    const handleChildChange = (e) => {
        setChildForm({ ...childForm, [e.target.name]: e.target.value });
    };

    const openCreateModal = () => {
        setChildForm(getInitialForm());
        setShowChildModal(true);
    };

    const openEditModal = (child) => {
        // Asegurarse de que exit_date no sea null para el input date
        setChildForm({ ...child, exit_date: child.exit_date || '' });
        setShowChildModal(true);
    };

    const handleChildSubmit = async (e) => {
        e.preventDefault();

        // Validación básica en el cliente
        if (!childForm.names || !childForm.civil_registry) {
            return alert("Por favor complete los campos obligatorios.");
        }

        try {
            // IMPORTANTE: Al enviar JSON, Axios ya maneja el Content-Type automáticamente
            if (childForm.id) {
                await api.put(`/children/${childForm.id}`, childForm);
            } else {
                await api.post('/children', childForm);
            }
            setShowChildModal(false);
            fetchChildren();
        } catch (error) {
            // ESTO ES LO MÁS IMPORTANTE: 
            // Si falla, el alert mostrará el mensaje que enviamos desde el backend
            alert(error.response?.data?.message || "Error al guardar el niño");
            console.error(error.response?.data);
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

    // --- FUNCIONES DE EXCEL ---
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

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Gestión de Niños/as</h1>

                {/* Buscador y Botones Principales */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o RC..."
                            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={downloadTemplate} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors">
                            <Download className="w-4 h-4" /> Plantilla
                        </button>
                        <button onClick={() => setShowImportModal(true)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors">
                            <Upload className="w-4 h-4" /> Importar
                        </button>
                        <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors">
                            <Plus className="w-4 h-4" /> Nuevo
                        </button>
                    </div>
                </div>
            </div>

            {/* TABLA PRINCIPAL */}
            <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-100 border-b text-gray-800">
                            <tr>
                                <th className="p-4 font-bold">Nombres y Apellidos</th>
                                <th className="p-4 font-bold">Registro Civil</th>
                                <th className="p-4 font-bold text-center">Edad</th>
                                <th className="p-4 font-bold text-center">Ingreso</th>
                                <th className="p-4 font-bold text-center">Retiro</th>
                                <th className="p-4 font-bold">Sede</th>
                                <th className="p-4 font-bold text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan="7" className="p-8 text-center text-gray-500 font-medium">Cargando datos...</td></tr> : null}
                            {!loading && filteredChildren.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-gray-500 font-medium">No se encontraron registros.</td></tr>}

                            {currentChildren.map(child => (
                                <tr key={child.id} className={`border-b transition-colors ${child.exit_date ? 'bg-red-50 hover:bg-red-100 text-red-900' : 'hover:bg-blue-50'}`}>
                                    <td className="p-4 font-medium">{child.names} {child.surnames}</td>
                                    <td className="p-4 font-mono text-xs">{child.civil_registry}</td>
                                    <td className="p-4 text-center">{child.age} años</td>
                                    <td className="p-4 text-center">{child.entry_date}</td>
                                    <td className="p-4 text-center font-bold">{child.exit_date || '-'}</td>
                                    <td className="p-4 text-xs uppercase tracking-wide">{child.facility}</td>
                                    <td className="p-4 text-center flex justify-center gap-2">
                                        <button onClick={() => openEditModal(child)} className={`p-2 rounded-lg transition-colors ${child.exit_date ? 'text-red-600 hover:bg-red-200' : 'text-blue-600 hover:bg-blue-100'} title='Editar'`}>
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(child.id)} className={`p-2 rounded-lg transition-colors ${child.exit_date ? 'text-red-800 hover:bg-red-300' : 'text-red-500 hover:bg-red-100'} title='Eliminar'`}>
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PAGINACIÓN */}
                {!loading && filteredChildren.length > 0 && (
                    <div className="bg-gray-50 border-t p-4 flex items-center justify-between text-sm text-gray-600">
                        <div>
                            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredChildren.length)} de {filteredChildren.length} registros
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"><ChevronsLeft className="w-5 h-5" /></button>
                            <button onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"><ChevronLeft className="w-5 h-5" /></button>
                            <span className="px-3 font-medium bg-white border rounded mx-1">Pág {currentPage} de {totalPages}</span>
                            <button onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage === totalPages} className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"><ChevronRight className="w-5 h-5" /></button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"><ChevronsRight className="w-5 h-5" /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* =========================================================
                MODAL CREAR / EDITAR NIÑO (FORMULARIO COMPLETO)
                ========================================================= */}
            {showChildModal && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center z-50 p-2 sm:p-6 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-full flex flex-col">

                        <div className="px-6 py-4 border-b flex justify-between items-center rounded-t-xl bg-gray-50">
                            <h2 className="text-xl font-black text-blue-800">{childForm.id ? 'Editar Información del Participante' : 'Registrar Nuevo Participante'}</h2>
                            <button onClick={() => setShowChildModal(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <form id="childForm" onSubmit={handleChildSubmit} className="space-y-6 text-sm">

                                {/* SECCIÓN 1: IDENTIFICACIÓN */}
                                <div>
                                    <h3 className="font-bold text-gray-700 border-b pb-1 mb-3 uppercase text-xs tracking-wider">1. Identificación y Fechas</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block font-semibold mb-1">Nombres <span className="text-red-500">*</span></label>
                                            <input required type="text" name="names" value={childForm.names} onChange={handleChildChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block font-semibold mb-1">Apellidos <span className="text-red-500">*</span></label>
                                            <input required type="text" name="surnames" value={childForm.surnames} onChange={handleChildChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block font-semibold mb-1">Registro Civil <span className="text-red-500">*</span></label>
                                            <input required type="text" name="civil_registry" value={childForm.civil_registry} onChange={handleChildChange} className="w-full border p-2 rounded font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block font-semibold mb-1">F. Nacimiento <span className="text-red-500">*</span></label>
                                            <input required type="date" name="birth_date" value={childForm.birth_date} onChange={handleChildChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block font-semibold mb-1">F. Ingreso <span className="text-red-500">*</span></label>
                                            <input required type="date" name="entry_date" value={childForm.entry_date} onChange={handleChildChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block font-semibold mb-1 text-red-600">F. Retiro (Solo si aplica)</label>
                                            <input type="date" name="exit_date" value={childForm.exit_date} onChange={handleChildChange} className="w-full border border-red-200 bg-red-50 p-2 rounded focus:ring-2 focus:ring-red-500 outline-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* SECCIÓN 2: DATOS GENERALES Y SALUD */}
                                <div>
                                    <h3 className="font-bold text-gray-700 border-b pb-1 mb-3 uppercase text-xs tracking-wider">2. Salud y Ubicación</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block font-semibold mb-1">Sexo <span className="text-red-500">*</span></label>
                                            <select name="gender" value={childForm.gender} onChange={handleChildChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none">
                                                <option value="Masculino">Masculino</option>
                                                <option value="Femenino">Femenino</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block font-semibold mb-1">G. Sanguíneo <span className="text-red-500">*</span></label>
                                            <select name="blood_group" value={childForm.blood_group} onChange={handleChildChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none">
                                                <option value="A">A</option><option value="B">B</option><option value="AB">AB</option><option value="O">O</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block font-semibold mb-1">RH <span className="text-red-500">*</span></label>
                                            <select name="rh" value={childForm.rh} onChange={handleChildChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none">
                                                <option value="+">Positivo (+)</option><option value="-">Negativo (-)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block font-semibold mb-1">EPS <span className="text-red-500">*</span></label>
                                            <input required type="text" name="eps" value={childForm.eps} onChange={handleChildChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block font-semibold mb-1">Dirección de Residencia <span className="text-red-500">*</span></label>
                                            <input required type="text" name="address" value={childForm.address} onChange={handleChildChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block font-semibold mb-1">Sede / Hogar Infantil <span className="text-red-500">*</span></label>
                                            {/* Datalist permite seleccionar una sede existente o escribir una nueva fácilmente */}
                                            <input required list="facilities" name="facility" value={childForm.facility} onChange={handleChildChange} placeholder="Seleccione o escriba..." className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                                            <datalist id="facilities">
                                                {uniqueFacilities.map((fac, idx) => <option key={idx} value={fac} />)}
                                            </datalist>
                                        </div>
                                    </div>
                                </div>

                                {/* SECCIÓN 3: ACUDIENTE */}
                                <div>
                                    <h3 className="font-bold text-gray-700 border-b pb-1 mb-3 uppercase text-xs tracking-wider">3. Datos del Acudiente</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block font-semibold mb-1">Parentesco <span className="text-red-500">*</span></label>
                                            <select name="guardian_relation" value={childForm.guardian_relation} onChange={handleChildChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none">
                                                <option value="Madre">Madre</option><option value="Padre">Padre</option><option value="Otro">Otro</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="block font-semibold mb-1">Nombre Completo del Acudiente <span className="text-red-500">*</span></label>
                                            <input required type="text" name="guardian_name" value={childForm.guardian_name} onChange={handleChildChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block font-semibold mb-1">Documento <span className="text-red-500">*</span></label>
                                            <input required type="text" name="guardian_document" value={childForm.guardian_document} onChange={handleChildChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block font-semibold mb-1">Dirección <span className="text-red-500">*</span></label>
                                            <input required type="text" name="guardian_address" value={childForm.guardian_address} onChange={handleChildChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block font-semibold mb-1">Celular <span className="text-red-500">*</span></label>
                                            <input required type="text" name="guardian_phone" value={childForm.guardian_phone} onChange={handleChildChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                            <button onClick={() => setShowChildModal(false)} className="px-5 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
                            <button form="childForm" type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors">
                                <Save className="w-5 h-5" /> {childForm.id ? 'Guardar Cambios' : 'Registrar Participante'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL IMPORTAR EXCEL (Se mantiene intacto) */}
            {showImportModal && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-black text-gray-800">Importar desde Excel</h2>
                            <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
                        </div>
                        <p className="text-sm text-gray-600 mb-6 bg-blue-50 p-3 rounded border border-blue-100">Asegúrese de usar la plantilla oficial. El sistema omitirá automáticamente los registros duplicados.</p>
                        <form onSubmit={handleImport}>
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={(e) => setFile(e.target.files[0])}
                                className="w-full border border-gray-300 p-2 rounded-lg mb-6 bg-gray-50"
                                required
                            />
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowImportModal(false)} className="px-5 py-2 text-gray-700 bg-gray-200 rounded-lg font-bold hover:bg-gray-300">Cancelar</button>
                                <button type="submit" className="px-5 py-2 text-white bg-green-600 rounded-lg font-bold hover:bg-green-700 flex items-center gap-2"><Upload className="w-4 h-4" /> Procesar Archivo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChildrenView;