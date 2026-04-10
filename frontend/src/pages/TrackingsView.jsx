import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { Plus, Eye, CheckCircle, Activity, Users, BookOpen, HeartPulse, ShieldAlert, Scale, Search, Edit, Printer, X } from 'lucide-react';

const TrackingsView = () => {
    const { user } = useContext(AuthContext);
    const [trackings, setTrackings] = useState([]);
    const [children, setChildren] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Estados para la Previsualización / PDF
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewData, setPreviewData] = useState(null);

    // Estado del Formulario Integral
    const [formData, setFormData] = useState(getInitialFormData());

    function getInitialFormData() {
        return {
            id: null,
            child_id: '',
            module1: user.modules.includes('MODULO_1') ? { ethnicity: 'Ninguna', has_disability: '0', disability_type: 'Ninguna', medical_diagnosis: '0', special_support: '0', special_support_desc: '' } : undefined,
            module2: user.modules.includes('MODULO_2') ? {
                participation: '0', motivation: '0', achievements: '', appropriate_strategies: '0', strengthening_plan: '0', explores_environment: '0', interacts_material: '0',
                health_behavior_news: '0', absences: '0', absences_reason: '', incidents: '0', attention_routes: '0', routes_desc: '', family_info: '0',
                direct_observer: '0', qualitative_scale: '0', qualitative_no_reason: '', evaluates_dimensions: '0', trimestral_val: '0', advances: '0', strengths_weaknesses: '0', registers_results: '0', qualitative_val: 'ESPERADO'
            } : undefined,
            module3: user.modules.includes('MODULO_3') ? { risk_situations: '0', rights_restoration: '0', routes_articulation: '0', family_training_actions: '' } : undefined,
            module4: user.modules.includes('MODULO_4') ? {
                health_affiliated: '0', regime: 'Ninguno', eps_name: '', vaccines_updated: '0', growth_chart: '0', controls_6_months: '0',
                premature: '0', gestational_age: '', breast_milk: '0', exclusive_lactation_months: '', total_lactation_months: '', food_intro_age: '', oral_health_control: '0', medical_assessment: '0',
                anthropometry: [
                    { take_number: 1, weight_kg: '', height_cm: '', nutritional_classification: '' },
                    { take_number: 2, weight_kg: '', height_cm: '', nutritional_classification: '' },
                    { take_number: 3, weight_kg: '', height_cm: '', nutritional_classification: '' },
                    { take_number: 4, weight_kg: '', height_cm: '', nutritional_classification: '' }
                ]
            } : undefined,
            module6: user.modules.includes('MODULO_6') ? { human_talent_qualification: '' } : undefined,
        };
    }

    const loadData = async () => {
        try {
            const [trackRes, childRes] = await Promise.all([
                api.get('/trackings'),
                api.get('/children')
            ]);
            setTrackings(trackRes.data.data || []);
            setChildren(childRes.data.data || []);
        } catch (error) {
            console.error("Error cargando datos de seguimientos", error);
            setTrackings([]);
            setChildren([]);
        }
    };

    useEffect(() => { loadData(); }, []);

    const filteredTrackings = trackings.filter(t => {
        const term = searchTerm.toLowerCase();
        const fullName = `${t.child_names} ${t.child_surnames}`.toLowerCase();
        const registry = String(t.civil_registry).toLowerCase();
        return fullName.includes(term) || registry.includes(term);
    });

    const handleChange = (moduleName, field, value) => {
        setFormData(prev => ({
            ...prev,
            [moduleName]: {
                ...prev[moduleName],
                [field]: value
            }
        }));
    };

    const handleAnthropometryChange = (index, field, value) => {
        const newAntro = [...formData.module4.anthropometry];
        newAntro[index][field] = value;
        setFormData(prev => ({
            ...prev,
            module4: { ...prev.module4, anthropometry: newAntro }
        }));
    };

    const handleEdit = async (trackingId) => {
        try {
            const res = await api.get(`/trackings/${trackingId}`);
            const data = res.data.data;

            const newForm = getInitialFormData();
            newForm.id = data.id;
            newForm.child_id = data.child_id;

            if (data.module1 && newForm.module1) newForm.module1 = { ...newForm.module1, ...data.module1 };
            if (data.module2 && newForm.module2) newForm.module2 = { ...newForm.module2, ...data.module2 };
            if (data.module3 && newForm.module3) newForm.module3 = { ...newForm.module3, ...data.module3 };
            if (data.module6 && newForm.module6) newForm.module6 = { ...newForm.module6, ...data.module6 };

            if (data.module4 && newForm.module4) {
                newForm.module4 = { ...newForm.module4, ...data.module4 };
                if (data.module4.anthropometry) {
                    const fetchedAntro = data.module4.anthropometry;
                    newForm.module4.anthropometry = [1, 2, 3, 4].map(num => {
                        const found = fetchedAntro.find(a => a.take_number === num);
                        return found
                            ? { take_number: num, weight_kg: found.weight_kg || '', height_cm: found.height_cm || '', nutritional_classification: found.nutritional_classification || '' }
                            : { take_number: num, weight_kg: '', height_cm: '', nutritional_classification: '' };
                    });
                }
            }

            const cleanNulls = (obj) => {
                if (!obj) return obj;
                Object.keys(obj).forEach(key => {
                    if (obj[key] === null) obj[key] = '';
                    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) cleanNulls(obj[key]);
                });
                return obj;
            };

            setFormData(cleanNulls(newForm));
            setShowModal(true);
        } catch (error) {
            alert("Error al cargar los datos del seguimiento para edición.");
        }
    };

    const handlePreview = async (trackingId) => {
        try {
            const res = await api.get(`/trackings/${trackingId}`);
            setPreviewData(res.data.data);
            setShowPreviewModal(true);
        } catch (error) {
            alert("Error al generar el reporte.");
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.child_id) return alert("Debe seleccionar un niño/a participante.");

        try {
            if (formData.id) {
                await api.put(`/trackings/${formData.id}`, formData);
                alert("¡Seguimiento actualizado exitosamente!");
            } else {
                const res = await api.post('/trackings', formData);
                alert(`¡Guardado exitosamente! Código: ${res.data.data.tracking_code}`);
            }
            setShowModal(false);
            setFormData(getInitialFormData());
            loadData();
        } catch (error) {
            alert(error.response?.data?.message || "Error al procesar el seguimiento");
        }
    };

    const SelectYesNo = ({ label, mod, field }) => (
        <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
            <select className="w-full border border-gray-300 p-2 rounded text-sm bg-white" value={formData[mod][field]} onChange={e => handleChange(mod, field, e.target.value)}>
                <option value="0">No</option><option value="1">Sí</option>
            </select>
        </div>
    );

    const yesNo = (val) => val == 1 || val == '1' || val === true ? 'Sí' : 'No';

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 print:hidden">
                <h1 className="text-2xl font-bold text-gray-800">Seguimientos a Participantes</h1>
                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o RC..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={() => { setFormData(getInitialFormData()); setShowModal(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg transition-all font-bold whitespace-nowrap">
                        <Plus className="w-5 h-5" /> Nuevo
                    </button>
                </div>
            </div>

            {/* TABLA DE SEGUIMIENTOS */}
            <div className="bg-white rounded-xl shadow-md overflow-x-auto print:hidden">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-100 border-b text-gray-800">
                        <tr><th className="p-4 font-bold">Código</th><th className="p-4 font-bold">Fecha y Hora</th><th className="p-4 font-bold">Niño/a Participante</th><th className="p-4 font-bold">Creado por</th><th className="p-4 text-center font-bold">Acciones</th></tr>
                    </thead>
                    <tbody>
                        {filteredTrackings.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-500 font-medium">No se encontraron seguimientos.</td></tr>}
                        {filteredTrackings.map(t => (
                            <tr key={t.id} className="border-b hover:bg-blue-50 transition-colors">
                                <td className="p-4 font-bold text-blue-600">{t.tracking_code}</td>
                                <td className="p-4">
                                    <div className="font-medium text-gray-800">{t.tracking_date}</div>
                                    <div className="text-xs text-gray-400">{t.tracking_time}</div>
                                </td>
                                <td className="p-4 font-medium text-gray-800">{t.child_names} {t.child_surnames} <br /><span className="text-xs text-gray-500 font-normal">RC: {t.civil_registry}</span></td>
                                <td className="p-4 text-gray-600">{t.created_by_name}</td>
                                <td className="p-4 text-center flex justify-center gap-2">
                                    <button onClick={() => handleEdit(t.id)} className="text-blue-500 hover:text-blue-800 bg-blue-100 p-2 rounded-full transition-colors title='Editar Seguimiento'"><Edit className="w-4 h-4 mx-auto" /></button>
                                    <button onClick={() => handlePreview(t.id)} className="text-purple-600 hover:text-purple-800 bg-purple-100 p-2 rounded-full transition-colors title='Ver Reporte (PDF)'"><Printer className="w-4 h-4 mx-auto" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* =======================================================================
                MODAL DE PREVISUALIZACIÓN Y REPORTE PDF (Aparece sobre toda la pantalla)
                ======================================================================= */}
            {showPreviewModal && previewData && (
                <div>
                    {/* ESTILOS DE IMPRESIÓN DINÁMICOS */}
                    <style type="text/css">
                        {`
                        @media print {
                            @page { 
                                size: legal; /* Tamaño Folio/Legal */
                                margin: 15mm; 
                            }
                            body, html { 
                                overflow: visible !important; 
                                height: auto !important; 
                                background: white !important; 
                            }
                            #root { 
                                overflow: visible !important; 
                                height: auto !important; 
                                display: block !important; 
                            }
                            /* Forzar la impresión de colores de fondo de Tailwind */
                            * { 
                                -webkit-print-color-adjust: exact !important; 
                                print-color-adjust: exact !important; 
                            }
                        }
                        `}
                    </style>

                    <div className="fixed inset-0 z-[100] bg-gray-900 bg-opacity-80 flex justify-center p-4 overflow-y-auto print:absolute print:inset-0 print:block print:w-full print:h-auto print:overflow-visible print:bg-white print:p-0">
                        <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl flex flex-col relative print:w-full print:max-w-none print:shadow-none print:border-none print:rounded-none print:block print:h-auto print:m-0">

                            {/* BOTONES DE ACCIÓN (Ocultos en impresión) */}
                            <div className="print:hidden sticky top-0 bg-gray-100 border-b p-4 flex justify-between items-center rounded-t-xl z-10 shadow-sm">
                                <h2 className="text-xl font-black text-gray-800">Previsualización del Documento</h2>
                                <div className="flex gap-3">
                                    <button onClick={handlePrint} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 font-bold transition-all shadow-md">
                                        <Printer className="w-5 h-5" /> Generar PDF
                                    </button>
                                    <button onClick={() => setShowPreviewModal(false)} className="bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all">
                                        <X className="w-5 h-5" /> Cerrar
                                    </button>
                                </div>
                            </div>

                            {/* CONTENIDO DEL REPORTE (Lo que se imprime) */}
                            <div className="p-8 print:p-2 bg-white text-gray-800 font-sans text-sm">
                                {/* Cabecera Formal */}
                                <div className="border-b-2 border-gray-800 pb-4 mb-6 flex justify-between items-end print:break-inside-avoid">
                                    <div>
                                        <h1 className="text-2xl font-black uppercase text-gray-900 tracking-tight">Reporte de Seguimiento Integral</h1>
                                        <p className="font-semibold text-gray-600 mt-1">Sede / Hogar Infantil: <span className="text-gray-900">{previewData.child.facility || 'No registrada'}</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-1">Código del Documento</p>
                                        <p className="text-xl font-black text-gray-900 border border-gray-300 px-3 py-1 rounded bg-gray-50">{previewData.tracking_code}</p>
                                    </div>
                                </div>

                                {/* Metadatos */}
                                <div className="flex justify-between text-xs text-gray-500 mb-6 bg-gray-50 p-2 rounded border print:break-inside-avoid">
                                    <p><strong>Fecha de Creación:</strong> {previewData.tracking_date} {previewData.tracking_time}</p>
                                    <p><strong>Impreso el:</strong> {new Date().toLocaleDateString()}</p>
                                </div>

                                {/* Información del Niño */}
                                <div className="mb-6 print:break-inside-avoid">
                                    <h3 className="font-black text-gray-800 uppercase border-b border-gray-300 pb-1 mb-3">1. Datos del Participante</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-blue-50">
                                        <div className="col-span-2"><p className="text-xs text-gray-500">Nombres y Apellidos</p><p className="font-bold text-base">{previewData.child.names} {previewData.child.surnames}</p></div>
                                        <div><p className="text-xs text-gray-500">Registro Civil</p><p className="font-bold text-base">{previewData.child.civil_registry}</p></div>
                                        <div><p className="text-xs text-gray-500">Sexo</p><p className="font-bold text-base">{previewData.child.gender}</p></div>
                                    </div>
                                </div>

                                {/* Módulo 1 */}
                                {previewData.module1 && (
                                    <div className="mb-6 print:break-inside-avoid">
                                        <h3 className="font-black text-gray-800 uppercase border-b border-gray-300 pb-1 mb-3">Módulo 1: Información del Participante</h3>
                                        <div className="grid grid-cols-3 gap-y-4">
                                            <p><strong>Etnia:</strong> {previewData.module1.ethnicity}</p>
                                            <p><strong>¿Discapacidad?:</strong> {yesNo(previewData.module1.has_disability)}</p>
                                            <p><strong>Tipo Discapacidad:</strong> {previewData.module1.disability_type}</p>
                                            <p><strong>Diagnóstico Médico:</strong> {yesNo(previewData.module1.medical_diagnosis)}</p>
                                            <p className="col-span-2"><strong>Apoyo Especial:</strong> {yesNo(previewData.module1.special_support)} {previewData.module1.special_support_desc ? `(${previewData.module1.special_support_desc})` : ''}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Módulo 2 */}
                                {previewData.module2 && (
                                    <div className="mb-6 print:break-inside-avoid">
                                        <div className="flex justify-between items-end border-b border-gray-300 pb-1 mb-3">
                                            <h3 className="font-black text-gray-800 uppercase">Módulo 2: Permanencia y Pedagogía</h3>
                                            <div className="bg-gray-100 px-3 py-1 border rounded text-xs font-black">
                                                VALORACIÓN FINAL: <span className="text-blue-700">{previewData.module2.qualitative_val}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <h4 className="font-bold text-gray-700 mb-2 bg-gray-100 p-1 text-center border rounded">Pedagógico</h4>
                                                <ul className="text-xs space-y-1 list-disc pl-4">
                                                    <li>Participación Activa: <strong>{yesNo(previewData.module2.participation)}</strong></li>
                                                    <li>Motivación: <strong>{yesNo(previewData.module2.motivation)}</strong></li>
                                                    <li>Estrategias Acordes: <strong>{yesNo(previewData.module2.appropriate_strategies)}</strong></li>
                                                    <li>Plan Fortalecimiento: <strong>{yesNo(previewData.module2.strengthening_plan)}</strong></li>
                                                </ul>
                                                <div className="mt-2 text-xs bg-yellow-50 p-2 border border-yellow-200"><strong>Logros:</strong> {previewData.module2.achievements || 'Ninguno registrado'}</div>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-700 mb-2 bg-gray-100 p-1 text-center border rounded">Novedades</h4>
                                                <ul className="text-xs space-y-1 list-disc pl-4">
                                                    <li>Salud/Comportamiento: <strong>{yesNo(previewData.module2.health_behavior_news)}</strong></li>
                                                    <li>Inasistencias: <strong>{yesNo(previewData.module2.absences)}</strong> {previewData.module2.absences_reason && `(${previewData.module2.absences_reason})`}</li>
                                                    <li>Incidentes: <strong>{yesNo(previewData.module2.incidents)}</strong></li>
                                                    <li>Rutas Activadas: <strong>{yesNo(previewData.module2.attention_routes)}</strong> {previewData.module2.routes_desc && `(${previewData.module2.routes_desc})`}</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-700 mb-2 bg-gray-100 p-1 text-center border rounded">Desarrollo</h4>
                                                <ul className="text-xs space-y-1 list-disc pl-4">
                                                    <li>Observador Directo: <strong>{yesNo(previewData.module2.direct_observer)}</strong></li>
                                                    <li>Escala Cualitativa: <strong>{yesNo(previewData.module2.qualitative_scale)}</strong></li>
                                                    <li>Valoración Trimestral: <strong>{yesNo(previewData.module2.trimestral_val)}</strong></li>
                                                    <li>Fortalezas/Dificultades: <strong>{yesNo(previewData.module2.strengths_weaknesses)}</strong></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Módulo 3 */}
                                {previewData.module3 && (
                                    <div className="mb-6 print:break-inside-avoid">
                                        <h3 className="font-black text-gray-800 uppercase border-b border-gray-300 pb-1 mb-3">Módulo 3: Familia y Comunidad</h3>
                                        <div className="grid grid-cols-3 gap-y-4">
                                            <p><strong>Situaciones Riesgo:</strong> {yesNo(previewData.module3.risk_situations)}</p>
                                            <p><strong>Restablecimiento Derechos:</strong> {yesNo(previewData.module3.rights_restoration)}</p>
                                            <p><strong>Articulación Rutas:</strong> {yesNo(previewData.module3.routes_articulation)}</p>
                                            <div className="col-span-3"><strong>Acciones formación a familias:</strong> <span className="text-gray-700 italic">{previewData.module3.family_training_actions || 'No registradas'}</span></div>
                                        </div>
                                    </div>
                                )}

                                {/* Módulo 4 */}
                                {previewData.module4 && (
                                    <div className="mb-6 print:break-inside-avoid">
                                        <h3 className="font-black text-gray-800 uppercase border-b border-gray-300 pb-1 mb-3">Módulo 4: Salud y Nutrición</h3>
                                        <div className="grid grid-cols-4 gap-y-3 text-xs mb-4">
                                            <p><strong>Afiliado a Salud:</strong> {yesNo(previewData.module4.health_affiliated)}</p>
                                            <p><strong>Régimen:</strong> {previewData.module4.regime}</p>
                                            <p className="col-span-2"><strong>EPS:</strong> {previewData.module4.eps_name || 'N/A'}</p>

                                            <p><strong>Vacunas al día:</strong> {yesNo(previewData.module4.vaccines_updated)}</p>
                                            <p><strong>Carnet Crecimiento:</strong> {yesNo(previewData.module4.growth_chart)}</p>
                                            <p><strong>Controles (6 meses):</strong> {previewData.module4.controls_6_months}</p>
                                            <p><strong>Prematurez:</strong> {yesNo(previewData.module4.premature)} {previewData.module4.gestational_age && `(${previewData.module4.gestational_age} sem)`}</p>

                                            <p><strong>Leche Materna:</strong> {yesNo(previewData.module4.breast_milk)}</p>
                                            <p><strong>Meses Exclusiva:</strong> {previewData.module4.exclusive_lactation_months || 'N/A'}</p>
                                            <p><strong>Meses Total:</strong> {previewData.module4.total_lactation_months || 'N/A'}</p>
                                            <p><strong>Intro Alimentos (meses):</strong> {previewData.module4.food_intro_age || 'N/A'}</p>
                                        </div>

                                        {/* Antropometría Tabla Print */}
                                        {previewData.module4.anthropometry && previewData.module4.anthropometry.length > 0 && (
                                            <div className="border border-gray-300 rounded overflow-hidden">
                                                <div className="bg-gray-100 font-bold text-center text-xs p-1 border-b border-gray-300">Registro de Antropometría</div>
                                                <table className="w-full text-center text-xs">
                                                    <thead className="bg-gray-50 border-b">
                                                        <tr><th className="p-1 border-r">Toma</th><th className="p-1 border-r">Peso (KG)</th><th className="p-1 border-r">Talla (CMS)</th><th className="p-1">Clasificación Nutricional</th></tr>
                                                    </thead>
                                                    <tbody>
                                                        {previewData.module4.anthropometry.map(a => (
                                                            <tr key={a.take_number} className="border-b border-gray-100 last:border-0">
                                                                <td className="p-1 border-r font-bold">#{a.take_number}</td>
                                                                <td className="p-1 border-r">{a.weight_kg || '-'}</td>
                                                                <td className="p-1 border-r">{a.height_cm || '-'}</td>
                                                                <td className="p-1">{a.nutritional_classification || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Módulo 6 */}
                                {previewData.module6 && (
                                    <div className="mb-6 print:break-inside-avoid">
                                        <h3 className="font-black text-gray-800 uppercase border-b border-gray-300 pb-1 mb-3">Módulo 6: Comunidades de Aprendizaje</h3>
                                        <p className="text-sm"><strong>Cualificación talento humano:</strong> <br /> <span className="text-gray-700 italic block mt-1 bg-gray-50 p-2 border rounded">{previewData.module6.human_talent_qualification || 'Sin registros.'}</span></p>
                                    </div>
                                )}

                                {/* Firmas */}
                                <div className="mt-16 pt-8 border-t-2 border-gray-800 grid grid-cols-2 gap-8 text-center print:break-inside-avoid">
                                    <div>
                                        <div className="border-b border-black w-3/4 mx-auto mb-2"></div>
                                        <p className="font-bold text-sm">Firma del Profesional / Docente</p>
                                        <p className="text-xs text-gray-500">Generado por el Sistema</p>
                                    </div>
                                    <div>
                                        <div className="border-b border-black w-3/4 mx-auto mb-2"></div>
                                        <p className="font-bold text-sm">Firma del Coordinador</p>
                                        <p className="text-xs text-gray-500">Hogar Infantil / Sede</p>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =======================================================================
                MODAL GIGANTE DE SEGUIMIENTO (DUAL: CREAR Y EDITAR) (OCULTO EN IMPRESIÓN)
                ======================================================================= */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center z-50 p-2 sm:p-6 overflow-hidden print:hidden">
                    <div className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-6xl max-h-full flex flex-col">

                        {/* CABECERA DEL MODAL */}
                        <div className="px-6 py-4 border-b bg-white flex justify-between items-center rounded-t-xl">
                            <div>
                                <h2 className="text-2xl font-black text-blue-800 flex items-center gap-2">
                                    <Activity className="w-7 h-7" /> {formData.id ? 'Editar Seguimiento Existente' : 'Nuevo Seguimiento Integral'}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">Los módulos visibles corresponden a sus permisos de sistema.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 px-4 py-2 rounded-lg font-bold transition-colors">
                                Cerrar [X]
                            </button>
                        </div>

                        {/* CUERPO SCROLLABLE DEL MODAL */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            <form id="trackingForm" onSubmit={handleSubmit} className="space-y-6">

                                {/* SELECTOR MAESTRO DE NIÑO */}
                                <div className={`p-5 rounded-xl shadow-sm border-l-4 ${formData.id ? 'bg-gray-100 border-gray-400' : 'bg-white border-blue-600'}`}>
                                    <label className="font-bold text-gray-800 block mb-2 text-lg">1. Participante Seleccionado</label>
                                    <select
                                        required
                                        disabled={formData.id !== null}
                                        className={`w-full p-3 border border-gray-300 rounded-lg text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none ${formData.id ? 'bg-gray-200 cursor-not-allowed' : 'bg-white'}`}
                                        value={formData.child_id}
                                        onChange={e => setFormData({ ...formData, child_id: e.target.value })}
                                    >
                                        <option value="">-- Busque y seleccione un niño/a de la lista --</option>
                                        {children.map(c => <option key={c.id} value={c.id}>{c.civil_registry} - {c.names} {c.surnames} (Sede: {c.facility})</option>)}
                                    </select>
                                    {formData.id && <p className="text-xs text-red-500 mt-2 font-semibold">No se puede cambiar el niño/a de un seguimiento ya guardado.</p>}
                                </div>

                                {/* MÓDULO 1: INFORMACIÓN */}
                                {user.modules.includes('MODULO_1') && (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2">
                                            <Users className="w-5 h-5 text-indigo-600" /><h3 className="font-bold text-lg text-gray-800">Módulo 1: Información del Participante</h3>
                                        </div>
                                        <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Etnia</label>
                                                <select className="w-full border border-gray-300 p-2 rounded text-sm" value={formData.module1.ethnicity} onChange={e => handleChange('module1', 'ethnicity', e.target.value)}>
                                                    <option value="Ninguna">Ninguna</option><option value="Indígena">Indígena</option><option value="Afrodescendiente">Afrodescendiente</option><option value="Raizal">Raizal</option><option value="ROM">ROM</option><option value="Otro">Otro</option>
                                                </select>
                                            </div>
                                            <SelectYesNo label="¿Tiene Discapacidad?" mod="module1" field="has_disability" />
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo Discapacidad</label>
                                                <select className="w-full border border-gray-300 p-2 rounded text-sm" value={formData.module1.disability_type} onChange={e => handleChange('module1', 'disability_type', e.target.value)}>
                                                    <option value="Ninguna">Ninguna</option><option value="Física">Física</option><option value="Cognitiva">Cognitiva</option><option value="Sensorial">Sensorial</option><option value="Psicosocial">Psicosocial</option><option value="Múltiple">Múltiple</option><option value="Otra">Otra</option>
                                                </select>
                                            </div>
                                            <SelectYesNo label="¿Diagnóstico Médico?" mod="module1" field="medical_diagnosis" />
                                            <SelectYesNo label="¿Requiere Apoyo Especial?" mod="module1" field="special_support" />
                                            <div className="md:col-span-3">
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción del Apoyo Especial (Si aplica)</label>
                                                <input type="text" className="w-full border border-gray-300 p-2 rounded text-sm" value={formData.module1.special_support_desc} onChange={e => handleChange('module1', 'special_support_desc', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* MÓDULO 2: PEDAGOGÍA */}
                                {user.modules.includes('MODULO_2') && (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="bg-blue-50 px-5 py-3 border-b border-blue-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-600" /><h3 className="font-bold text-lg text-blue-900">Módulo 2: Permanencia y Pedagogía</h3></div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm font-bold text-blue-800">Escala de Valoración Final:</label>
                                                <select className="border-2 border-blue-400 p-1 rounded font-black text-sm outline-none bg-white text-blue-900" value={formData.module2.qualitative_val} onChange={e => handleChange('module2', 'qualitative_val', e.target.value)}>
                                                    <option value="ESPERADO">ESPERADO</option><option value="EN RIESGO">EN RIESGO</option><option value="AVANZADO">AVANZADO</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-8">

                                            {/* Subsección: Pedagógico */}
                                            <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                                <h4 className="font-bold text-sm text-gray-700 border-b pb-1 mb-3">Aspecto Pedagógico</h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <SelectYesNo label="Participación activa" mod="module2" field="participation" />
                                                    <SelectYesNo label="Motivación" mod="module2" field="motivation" />
                                                    <SelectYesNo label="Estrategias acordes" mod="module2" field="appropriate_strategies" />
                                                    <SelectYesNo label="Plan fortalecimiento" mod="module2" field="strengthening_plan" />
                                                    <SelectYesNo label="Explora entorno" mod="module2" field="explores_environment" />
                                                    <SelectYesNo label="Interactúa material" mod="module2" field="interacts_material" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1 mt-2">Logros (Texto)</label>
                                                    <textarea className="w-full border border-gray-300 p-2 rounded text-sm" rows="2" value={formData.module2.achievements} onChange={e => handleChange('module2', 'achievements', e.target.value)}></textarea>
                                                </div>
                                            </div>

                                            {/* Subsección: Novedades */}
                                            <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                                <h4 className="font-bold text-sm text-gray-700 border-b pb-1 mb-3">Novedades y Novedades</h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <SelectYesNo label="Salud/Comportamiento" mod="module2" field="health_behavior_news" />
                                                    <SelectYesNo label="Inasistencias" mod="module2" field="absences" />
                                                    <SelectYesNo label="Incidentes" mod="module2" field="incidents" />
                                                    <SelectYesNo label="Rutas atención activas" mod="module2" field="attention_routes" />
                                                    <SelectYesNo label="Información a familia" mod="module2" field="family_info" />
                                                </div>
                                                <div className="grid grid-cols-1 gap-2 mt-2">
                                                    <input type="text" placeholder="Motivo inasistencias..." className="w-full border border-gray-300 p-2 rounded text-xs" value={formData.module2.absences_reason} onChange={e => handleChange('module2', 'absences_reason', e.target.value)} />
                                                    <input type="text" placeholder="Cuáles rutas de atención..." className="w-full border border-gray-300 p-2 rounded text-xs" value={formData.module2.routes_desc} onChange={e => handleChange('module2', 'routes_desc', e.target.value)} />
                                                </div>
                                            </div>

                                            {/* Subsección: Desarrollo */}
                                            <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                                <h4 className="font-bold text-sm text-gray-700 border-b pb-1 mb-3">Seguimiento al Desarrollo</h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <SelectYesNo label="Observador directo" mod="module2" field="direct_observer" />
                                                    <SelectYesNo label="Escala cualitativa" mod="module2" field="qualitative_scale" />
                                                    <SelectYesNo label="Evalúa dimensiones" mod="module2" field="evaluates_dimensions" />
                                                    <SelectYesNo label="Valoración trimestral" mod="module2" field="trimestral_val" />
                                                    <SelectYesNo label="Avances evidentes" mod="module2" field="advances" />
                                                    <SelectYesNo label="Fortalezas/Dificultades" mod="module2" field="strengths_weaknesses" />
                                                    <SelectYesNo label="Registra resultados" mod="module2" field="registers_results" />
                                                </div>
                                                <div>
                                                    <input type="text" placeholder="Por qué NO (Escala cualitativa)..." className="w-full border border-gray-300 p-2 rounded text-xs mt-2" value={formData.module2.qualitative_no_reason} onChange={e => handleChange('module2', 'qualitative_no_reason', e.target.value)} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* MÓDULO 3: FAMILIA Y COMUNIDAD */}
                                {user.modules.includes('MODULO_3') && (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="bg-amber-50 px-5 py-3 border-b border-amber-100 flex items-center gap-2">
                                            <ShieldAlert className="w-5 h-5 text-amber-600" /><h3 className="font-bold text-lg text-amber-900">Módulo 3: Familia y Comunidad</h3>
                                        </div>
                                        <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <SelectYesNo label="Situaciones de riesgo" mod="module3" field="risk_situations" />
                                            <SelectYesNo label="Restablecimiento derechos" mod="module3" field="rights_restoration" />
                                            <SelectYesNo label="Articulación rutas" mod="module3" field="routes_articulation" />
                                            <div className="md:col-span-4">
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Acciones de formación a familias</label>
                                                <textarea className="w-full border border-gray-300 p-2 rounded text-sm" rows="2" value={formData.module3.family_training_actions} onChange={e => handleChange('module3', 'family_training_actions', e.target.value)}></textarea>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* MÓDULO 4: SALUD Y NUTRICIÓN */}
                                {user.modules.includes('MODULO_4') && (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100 flex items-center gap-2">
                                            <HeartPulse className="w-5 h-5 text-emerald-600" /><h3 className="font-bold text-lg text-emerald-900">Módulo 4: Salud y Nutrición</h3>
                                        </div>
                                        <div className="p-5 space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                                <SelectYesNo label="Afiliado a Salud" mod="module4" field="health_affiliated" />
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Régimen</label>
                                                    <select className="w-full border border-gray-300 p-2 rounded text-sm" value={formData.module4.regime} onChange={e => handleChange('module4', 'regime', e.target.value)}>
                                                        <option value="Ninguno">Ninguno</option><option value="Contributivo">Contributivo</option><option value="Subsidiado">Subsidiado</option><option value="Especial">Especial</option>
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre EPS</label>
                                                    <input type="text" className="w-full border border-gray-300 p-2 rounded text-sm" value={formData.module4.eps_name} onChange={e => handleChange('module4', 'eps_name', e.target.value)} />
                                                </div>
                                                <SelectYesNo label="Vacunas al día" mod="module4" field="vaccines_updated" />

                                                <SelectYesNo label="Carnet Crecimiento" mod="module4" field="growth_chart" />
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Controles (Últ. 6 meses)</label>
                                                    <input type="number" min="0" max="4" className="w-full border border-gray-300 p-2 rounded text-sm" value={formData.module4.controls_6_months} onChange={e => handleChange('module4', 'controls_6_months', e.target.value)} />
                                                </div>
                                                <SelectYesNo label="¿Prematurez?" mod="module4" field="premature" />
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Edad Gestacional (Sem)</label>
                                                    <input type="number" className="w-full border border-gray-300 p-2 rounded text-sm" value={formData.module4.gestational_age} onChange={e => handleChange('module4', 'gestational_age', e.target.value)} />
                                                </div>
                                                <SelectYesNo label="¿Leche Materna?" mod="module4" field="breast_milk" />

                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Meses Lactancia Exclusiva</label>
                                                    <input type="number" className="w-full border border-gray-300 p-2 rounded text-sm" value={formData.module4.exclusive_lactation_months} onChange={e => handleChange('module4', 'exclusive_lactation_months', e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Meses Lactancia Total</label>
                                                    <input type="number" className="w-full border border-gray-300 p-2 rounded text-sm" value={formData.module4.total_lactation_months} onChange={e => handleChange('module4', 'total_lactation_months', e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Edad Intro Alimentos (Meses)</label>
                                                    <input type="number" className="w-full border border-gray-300 p-2 rounded text-sm" value={formData.module4.food_intro_age} onChange={e => handleChange('module4', 'food_intro_age', e.target.value)} />
                                                </div>
                                                <SelectYesNo label="Control Salud Oral" mod="module4" field="oral_health_control" />
                                                <SelectYesNo label="Valoración Médica" mod="module4" field="medical_assessment" />
                                            </div>

                                            {/* TABLA DE ANTROPOMETRÍA */}
                                            <div className="mt-6 border-t pt-4">
                                                <h4 className="flex items-center gap-2 font-bold text-emerald-800 text-sm mb-4">
                                                    <Scale className="w-4 h-4" /> Registro de Antropometría (4 Tomas Obligatorias)
                                                </h4>
                                                <div className="overflow-x-auto rounded-lg border border-emerald-100">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-emerald-50 text-emerald-800">
                                                            <tr>
                                                                <th className="p-3 text-left">Toma</th>
                                                                <th className="p-3 text-left">Peso (KG)</th>
                                                                <th className="p-3 text-left">Talla (CMS)</th>
                                                                <th className="p-3 text-left">Clasificación Nutricional</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-emerald-50">
                                                            {formData.module4.anthropometry.map((row, idx) => (
                                                                <tr key={idx} className="bg-white">
                                                                    <td className="p-3 font-bold text-gray-500">#{row.take_number}</td>
                                                                    <td className="p-2">
                                                                        <input
                                                                            type="number" step="0.01" placeholder="0.00"
                                                                            className="w-full p-2 border rounded border-gray-200 outline-none focus:ring-1 focus:ring-emerald-400"
                                                                            value={row.weight_kg}
                                                                            onChange={e => handleAnthropometryChange(idx, 'weight_kg', e.target.value)}
                                                                        />
                                                                    </td>
                                                                    <td className="p-2">
                                                                        <input
                                                                            type="number" step="0.01" placeholder="0.0"
                                                                            className="w-full p-2 border rounded border-gray-200 outline-none focus:ring-1 focus:ring-emerald-400"
                                                                            value={row.height_cm}
                                                                            onChange={e => handleAnthropometryChange(idx, 'height_cm', e.target.value)}
                                                                        />
                                                                    </td>
                                                                    <td className="p-2">
                                                                        <select
                                                                            className="w-full p-2 border rounded border-gray-200 outline-none focus:ring-1 focus:ring-emerald-400"
                                                                            value={row.nutritional_classification}
                                                                            onChange={e => handleAnthropometryChange(idx, 'nutritional_classification', e.target.value)}
                                                                        >
                                                                            <option value="">-- Seleccione --</option>
                                                                            <option value="Normal">Normal</option>
                                                                            <option value="Desnutrición Aguda">Desnutrición Aguda</option>
                                                                            <option value="Riesgo Desnutrición">Riesgo Desnutrición</option>
                                                                            <option value="Sobrepeso">Sobrepeso</option>
                                                                            <option value="Obesidad">Obesidad</option>
                                                                        </select>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* MÓDULO 6: COMUNIDADES DE APRENDIZAJE */}
                                {user.modules.includes('MODULO_6') && (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="bg-purple-50 px-5 py-3 border-b border-purple-100 flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5 text-purple-600" /><h3 className="font-bold text-lg text-purple-900">Módulo 6: Comunidades de Aprendizaje</h3>
                                        </div>
                                        <div className="p-5">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Cualificación al talento humano (Describa)</label>
                                            <textarea className="w-full border border-gray-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" rows="3" value={formData.module6.human_talent_qualification} onChange={e => handleChange('module6', 'human_talent_qualification', e.target.value)}></textarea>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* FOOTER FIJO DEL MODAL */}
                        <div className="p-5 border-t bg-white flex justify-end gap-4 rounded-b-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                            <button onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
                            <button form="trackingForm" type="submit" className="px-8 py-2.5 bg-blue-600 text-white font-black rounded-lg shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5">
                                {formData.id ? 'Guardar Cambios' : 'Guardar Seguimiento Integral'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrackingsView;