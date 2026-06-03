import React, { useState, useMemo } from 'react';
import { Search, Badge, Calendar, Trash2, Edit3, Eye, Download, Printer, Filter, X } from 'lucide-react';
import { ServiceRecord, ServiceStatus } from '../types';

interface RecordsAdminProps {
  records: ServiceRecord[];
  onUpdateRecord: (id: string, updatedFields: Partial<ServiceRecord>) => void;
  onDeleteRecord: (id: string) => void;
}

export default function RecordsAdmin({ records, onUpdateRecord, onDeleteRecord }: RecordsAdminProps) {
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Dense but highly legible on desktop views

  // Modals States
  const [selectedRecordForView, setSelectedRecordForView] = useState<ServiceRecord | null>(null);
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState<ServiceRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Buffer fields for edits
  const [editForm, setEditForm] = useState<Partial<ServiceRecord>>({});

  // Reset Filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setServiceTypeFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  // Filter records dynamically
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const query = searchQuery.toLowerCase();
      const matchSearch = 
        record.firstName?.toLowerCase().includes(query) ||
        record.lastName?.toLowerCase().includes(query) ||
        record.personnelId?.toLowerCase().includes(query) ||
        `${record.firstName} ${record.lastName}`.toLowerCase().includes(query);

      const matchType = serviceTypeFilter === '' || record.serviceType === serviceTypeFilter;
      const matchStatus = statusFilter === '' || record.status === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [records, searchQuery, serviceTypeFilter, statusFilter]);

  // Pagination math
  const totalEntries = filteredRecords.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Start Editing
  const handleOpenEdit = (record: ServiceRecord) => {
    setEditForm({ ...record });
    setSelectedRecordForEdit(record);
  };

  // Save Edits Confirmation
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRecordForEdit && editForm.firstName && editForm.lastName) {
      onUpdateRecord(selectedRecordForEdit.id, editForm);
      setSelectedRecordForEdit(null);
    }
  };

  // Truncate summary for table list views
  const truncateText = (text: string, limit: number) => {
    if (!text) return '';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  };

  return (
    <div className="animate-fade-in space-y-6 font-sans">
      <div className="mb-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-100">Administración de Registros</h2>
        <p className="text-slate-400 mt-2 text-base">Administre, filtre y audite de forma segura las bitácoras operativas y partes del servicio del departamento.</p>
      </div>

      {/* Filter Bar (Tier 2 Surface) */}
      <div className="bg-[#0f172a]/30 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          {/* Unit/Personnel Search */}
          <div className="col-span-1 md:col-span-4 flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unidad o Nombre de Personal</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Ej. Engine 4, Hayes, UFD-8821"
                className="w-full pl-10 pr-3.5 py-2 bg-slate-950/80 border border-slate-800 focus:border-indigo-500/85 rounded-xl text-sm transition-all text-slate-100 placeholder-slate-650 outline-none"
                type="text"
              />
            </div>
          </div>

          {/* Service Type Select */}
          <div className="col-span-1 md:col-span-3 flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo de Servicio</label>
            <select
              value={serviceTypeFilter}
              onChange={(e) => { setServiceTypeFilter(e.target.value); setCurrentPage(1); }}
              className="w-full pl-3 pr-8 py-2 bg-slate-950/80 border border-slate-800 focus:border-indigo-500/85 rounded-xl text-sm transition-all h-[38px] text-slate-300 outline-none cursor-pointer font-medium"
            >
              <option value="" className="bg-[#020617] text-slate-400">Todos los tipos</option>
              <option value="Acto de presencia en persona sin signos vitales" className="bg-[#020617] text-slate-150">Acto de presencia en persona sin signos vitales</option>
              <option value="Administración de medicamentos" className="bg-[#020617] text-slate-150">Administración de medicamentos</option>
              <option value="Alarma infundada" className="bg-[#020617] text-slate-150">Alarma infundada</option>
              <option value="Apoyo en Guardia de Prevención" className="bg-[#020617] text-slate-150">Apoyo en Guardia de Prevención</option>
              <option value="Atención Pre-Hospitalaria" className="bg-[#020617] text-slate-150">Atención Pre-Hospitalaria</option>
              <option value="Derrame de Combustible" className="bg-[#020617] text-slate-150">Derrame de Combustible</option>
              <option value="Diligencias del Servicio" className="bg-[#020617] text-slate-150">Diligencias del Servicio</option>
              <option value="Estabilización de paciente" className="bg-[#020617] text-slate-150">Estabilización de paciente</option>
              <option value="Guardia de Prevención" className="bg-[#020617] text-slate-150">Guardia de Prevención</option>
              <option value="Hecho Vial tipo arrollamiento" className="bg-[#020617] text-slate-150">Hecho Vial tipo arrollamiento</option>
              <option value="Hecho Vial tipo Colisión" className="bg-[#020617] text-slate-150">Hecho Vial tipo Colisión</option>
              <option value="Hecho Vial tipo volcamiento" className="bg-[#020617] text-slate-150">Hecho Vial tipo volcamiento</option>
              <option value="Incendio De Vehículo" className="bg-[#020617] text-slate-150">Incendio De Vehículo</option>
              <option value="Incendio Forestales / Vegetación" className="bg-[#020617] text-slate-150">Incendio Forestales / Vegetación</option>
              <option value="Inspección de Árbol" className="bg-[#020617] text-slate-150">Inspección de Árbol</option>
              <option value="Inspección de Riesgo" className="bg-[#020617] text-slate-150">Inspección de Riesgo</option>
              <option value="Inspección de Seguridad" className="bg-[#020617] text-slate-150">Inspección de Seguridad</option>
              <option value="Mitigación De Riesgo" className="bg-[#020617] text-slate-150">Mitigación De Riesgo</option>
              <option value="Quema De Basura" className="bg-[#020617] text-slate-150">Quema De Basura</option>
              <option value="Recarga de extintores" className="bg-[#020617] text-slate-150">Recarga de extintores</option>
              <option value="Recorridos Preventivos" className="bg-[#020617] text-slate-150">Recorridos Preventivos</option>
              <option value="Relevo de personal" className="bg-[#020617] text-slate-150">Relevo de personal</option>
              <option value="Rescate Animal" className="bg-[#020617] text-slate-150">Rescate Animal</option>
              <option value="Reubicación de avispas" className="bg-[#020617] text-slate-150">Reubicación de avispas</option>
              <option value="Servicio de cura" className="bg-[#020617] text-slate-150">Servicio de cura</option>
              <option value="Servicio de Nebulización" className="bg-[#020617] text-slate-150">Servicio de Nebulización</option>
              <option value="Servicio de Tensión Arterial" className="bg-[#020617] text-slate-150">Servicio de Tensión Arterial</option>
              <option value="Servicios De Ambulancia Traslado Extra Urbano" className="bg-[#020617] text-slate-150">Servicios De Ambulancia Traslado Extra Urbano</option>
              <option value="Tala O Poda De Árbol" className="bg-[#020617] text-slate-150">Tala O Poda De Árbol</option>
              <option value="Traslado de emergencia" className="bg-[#020617] text-slate-150">Traslado de emergencia</option>
              <option value="Traslado Regular" className="bg-[#020617] text-slate-150">Traslado Regular</option>
              <option value="Visita hospitalaria" className="bg-[#020617] text-slate-150">Visita hospitalaria</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="col-span-1 md:col-span-3 flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado Operativo</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full pl-3 pr-8 py-2 bg-slate-950/80 border border-slate-800 focus:border-indigo-500/85 rounded-xl text-sm transition-all h-[38px] text-slate-300 outline-none cursor-pointer font-medium"
            >
              <option value="" className="bg-[#020617] text-slate-400">Todos los estados</option>
              <option value="Completed" className="bg-[#020617] text-slate-150">Completado</option>
              <option value="Active" className="bg-[#020617] text-slate-150">Activo</option>
              <option value="Pending Review" className="bg-[#020617] text-slate-150">Pendiente de Revisión</option>
            </select>
          </div>

          {/* Buttons Area */}
          <div className="col-span-1 md:col-span-2 flex gap-2 w-full">
            <button
              onClick={handleClearFilters}
              className="flex-1 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/40 text-xs font-bold uppercase tracking-wider rounded-xl transition-all h-[38px] cursor-pointer outline-none"
            >
              Limpiar
            </button>
            <button
              onClick={() => setCurrentPage(1)}
              className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex justify-center items-center gap-1 h-[38px] border-0 cursor-pointer outline-none shadow-[0_0_12px_rgba(79,70,229,0.25)]"
            >
              <Filter className="w-3.5 h-3.5" />
              Filtrar
            </button>
          </div>

        </div>
      </div>

      {/* Main Data Table Card */}
      <div className="bg-[#0f172a]/20 border border-slate-800/85 rounded-2xl overflow-hidden shadow-xl mt-6 backdrop-blur-xs">
        
        {/* Actions bar over data */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex justify-between items-center">
          <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-2">
            Bitácoras Recientes 
            <span className="bg-indigo-950/80 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
              {filteredRecords.length}
            </span>
          </h3>
          <div className="flex gap-1.5">
            <button 
              onClick={() => alert('Exportando base de datos a CSV de hoja de cálculo...')}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 rounded-xl transition-all cursor-pointer border-0" 
              title="Exportar CSV"
            >
              <Download className="w-4 h-4 text-indigo-400" />
            </button>
            <button 
              onClick={() => window.print()}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 rounded-xl transition-all cursor-pointer border-0" 
              title="Imprimir registros"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
            </button>
          </div>
        </div>

        {/* Real Dynamic Responsive Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#0f172a]/80 border-b border-slate-800/80">
              <tr>
                <th className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-44">Marca de Tiempo</th>
                <th className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personal / Unidad</th>
                <th className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo de Servicio</th>
                <th className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-40">Estado</th>
                <th className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-36">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-sm">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <p className="font-bold text-sm text-slate-300">No se encontraron registros de incidentes.</p>
                    <p className="text-xs mt-1 text-slate-550">Pruebe limpiando o reconfigurando los filtros superiores.</p>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-850/40 transition-colors group">
                    
                    {/* Timestamp column */}
                    <td className="py-3.5 px-5 font-mono text-xs text-slate-400 font-semibold">
                      {record.timestamp}
                    </td>

                    {/* Personal Name */}
                    <td className="py-3.5 px-5 font-bold text-slate-200">
                      <div className="flex flex-col">
                        <span>{record.firstName} {record.lastName}</span>
                        <span className="text-[10px] font-mono text-indigo-455 font-bold mt-0.5">{record.personnelId}</span>
                      </div>
                    </td>

                    {/* Service Type */}
                    <td className="py-3.5 px-5 text-slate-350">
                      <div>
                        <span className="font-extrabold text-slate-200">{record.serviceType}</span>
                        <p className="text-xs text-slate-400 truncate max-w-sm mt-0.5 font-medium">{truncateText(record.summary, 70)}</p>
                      </div>
                    </td>

                    {/* Status Pill matching layout */}
                    <td className="py-3.5 px-5">
                      {record.status === 'Completed' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Completado
                        </span>
                      ) : record.status === 'Active' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-450 border border-rose-500/20">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-1 px-0 animate-pulse" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Revisión Pendiente
                        </span>
                      )}
                      
                      {/* Sync offline state indicator */}
                      {record.synced === false && (
                        <span className="ml-2 inline-flex items-center text-[9px] font-bold uppercase tracking-wider text-amber-400 animate-pulse">
                          (En Cola Local)
                        </span>
                      )}
                    </td>

                    {/* Actions button list */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => setSelectedRecordForView(record)}
                          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-xl transition-all border-0 cursor-pointer"
                          title="Ver Detalle Clínico/Operativo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(record)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all border-0 cursor-pointer"
                          title="Editar Registro"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(record.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-xl transition-all border-0 cursor-pointer"
                          title="Eliminar Registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination controls */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-slate-400 font-semibold">
            Mostrando <span className="font-extrabold text-slate-200">{totalEntries === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-extrabold text-slate-200">{Math.min(currentPage * itemsPerPage, totalEntries)}</span> de <span className="font-extrabold text-slate-200">{totalEntries}</span> registros.
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3.5 py-1.5 border border-slate-800 text-xs font-bold rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer outline-none"
            >
              Anterior
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Sliding pagination logic
              let pageNum = i + 1;
              if (currentPage > 3 && totalPages > 5) {
                if (currentPage + 2 <= totalPages) {
                  pageNum = currentPage - 2 + i;
                } else {
                  pageNum = totalPages - 4 + i;
                }
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1.5 border text-xs font-extrabold rounded-xl cursor-pointer transition-all ${
                    currentPage === pageNum
                      ? 'bg-indigo-650 border-indigo-500/20 text-white shadow-[0_0_10px_rgba(79,70,229,0.25)]'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3.5 py-1.5 border border-slate-800 text-xs font-bold rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer outline-none"
            >
              Siguiente
            </button>
          </div>
        </div>

      </div>

      {/* --- INTEGRATED MODALS (HTML PORTAL-LIKE ELEMENTS) --- */}
      
      {/* 1. VIEW DETAILED INCIDENT SUMMARY MODAL */}
      {selectedRecordForView && (
        <div className="fixed inset-0 bg-[#020617]/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl max-w-2xl w-full animate-fade-in font-sans">
            <div className="p-5 border-b border-slate-800/60 bg-slate-950/60 flex justify-between items-center">
              <h3 className="font-extrabold text-[#f1f5f9] tracking-wide uppercase text-sm">Bitácora Operativa de Registro</h3>
              <button 
                onClick={() => setSelectedRecordForView(null)}
                className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded-full cursor-pointer border-0 outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID de Incidente</label>
                  <p className="text-sm font-mono text-indigo-300 mt-0.5">{selectedRecordForView.id}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Marca Horaria de Ingreso</label>
                  <p className="text-sm font-mono text-slate-200 mt-0.5">{selectedRecordForView.timestamp}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre del Personal</label>
                  <p className="text-sm font-bold text-slate-105 mt-0.5">{selectedRecordForView.firstName} {selectedRecordForView.lastName}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identificación de Unidad</label>
                  <p className="text-sm font-mono text-indigo-300 mt-0.5 font-bold">{selectedRecordForView.personnelId}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha Operativa</label>
                  <p className="text-sm font-bold text-slate-200 mt-0.5">{selectedRecordForView.serviceDate}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo de Incidente</label>
                  <p className="text-sm font-bold text-indigo-250 mt-0.5">{selectedRecordForView.serviceType}</p>
                </div>
              </div>
              <div className="border-t border-slate-805/50 pt-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado de la Bitácora</label>
                <div className="mt-1.5">
                  {selectedRecordForView.status === 'Completed' ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-450 border border-emerald-500/20">
                      Reporte Completado
                    </span>
                  ) : selectedRecordForView.status === 'Active' ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-[#f43f5e] border border-rose-500/20">
                      <span className="w-1.5 h-1.5 bg-rose-550 rounded-full mr-1.5 animate-pulse" />
                      Operación Activa / En Curso
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Pendiente de Corrección / Auditoría
                    </span>
                  )}
                </div>
              </div>
              <div className="border-t border-slate-805/50 pt-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sintesis Clínica / Incident Summary</label>
                <div className="mt-2 text-sm text-slate-200 bg-slate-950/80 p-4 rounded-xl border border-slate-850 leading-relaxed font-sans font-medium">
                  {selectedRecordForView.summary || "No se especificaron notas descriptivas adicionales en el parte diario."}
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-95 /10 border-t border-slate-800/60 flex justify-end">
              <button 
                onClick={() => setSelectedRecordForView(null)}
                className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-550 text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer border-0"
              >
                Cerrar Reporte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. EDIT RECORD MODAL (FULL-FIELDS FORM) */}
      {selectedRecordForEdit && (
        <div className="fixed inset-0 bg-[#020617]/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleSaveEdit} 
            className="bg-[#0f172a] rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl max-w-2xl w-full animate-fade-in font-sans"
          >
            <div className="p-5 border-b border-slate-800/60 bg-slate-950/60 flex justify-between items-center">
              <h3 className="font-extrabold text-[#f1f5f9] uppercase tracking-wide text-sm">Editar Detalle de Registro Oficial</h3>
              <button 
                type="button" 
                onClick={() => setSelectedRecordForEdit(null)}
                className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded-full outline-none cursor-pointer border-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primer Nombre</label>
                  <input
                    value={editForm.firstName || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full bg-slate-950/80 border border-slate-805 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-650 focus:border-indigo-550 transition-all outline-none"
                    type="text"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Apellido</label>
                  <input
                    value={editForm.lastName || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full bg-slate-950/80 border border-slate-805 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-650 focus:border-indigo-550 transition-all outline-none"
                    type="text"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID de Unidad / Personal</label>
                  <input
                    value={editForm.personnelId || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, personnelId: e.target.value }))}
                    className="w-full bg-slate-950/80 border border-slate-850 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-100 placeholder-slate-650 focus:border-indigo-550 transition-all outline-none"
                    type="text"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha de Expediente</label>
                  <input
                    value={editForm.serviceDate || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, serviceDate: e.target.value }))}
                    className="w-full bg-slate-950/80 border border-slate-850 rounded-xl px-3.5 py-2 text-sm text-slate-150 focus:border-indigo-550 transition-all outline-none"
                    type="date"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo de Incidente</label>
                  <select
                    value={editForm.serviceType || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, serviceType: e.target.value }))}
                    className="w-full bg-slate-950/80 border border-slate-850 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-205 h-[38px] outline-none cursor-pointer"
                    required
                  >
                    <option value="Acto de presencia en persona sin signos vitales" className="bg-[#020617] text-slate-150">1. Acto de presencia en persona sin signos vitales</option>
                    <option value="Administración de medicamentos" className="bg-[#020617] text-slate-150">2. Administración de medicamentos</option>
                    <option value="Alarma infundada" className="bg-[#020617] text-slate-150">3. Alarma infundada</option>
                    <option value="Apoyo en Guardia de Prevención" className="bg-[#020617] text-slate-150">4. Apoyo en Guardia de Prevención</option>
                    <option value="Atención Pre-Hospitalaria" className="bg-[#020617] text-slate-150">5. Atención Pre-Hospitalaria</option>
                    <option value="Derrame de Combustible" className="bg-[#020617] text-slate-150">6. Derrame de Combustible</option>
                    <option value="Diligencias del Servicio" className="bg-[#020617] text-slate-150">7. Diligencias del Servicio</option>
                    <option value="Estabilización de paciente" className="bg-[#020617] text-slate-150">8. Estabilización de paciente</option>
                    <option value="Guardia de Prevención" className="bg-[#020617] text-slate-150">9. Guardia de Prevención</option>
                    <option value="Hecho Vial tipo arrollamiento" className="bg-[#020617] text-slate-150">10. Hecho Vial tipo arrollamiento</option>
                    <option value="Hecho Vial tipo Colisión" className="bg-[#020617] text-slate-150">11. Hecho Vial tipo Colisión</option>
                    <option value="Hecho Vial tipo volcamiento" className="bg-[#020617] text-slate-150">12. Hecho Vial tipo volcamiento</option>
                    <option value="Incendio De Vehículo" className="bg-[#020617] text-slate-150">13. Incendio De Vehículo</option>
                    <option value="Incendio Forestales / Vegetación" className="bg-[#020617] text-slate-150">14. Incendio Forestales / Vegetación</option>
                    <option value="Inspección de Árbol" className="bg-[#020617] text-slate-150">15. Inspección de Árbol</option>
                    <option value="Inspección de Riesgo" className="bg-[#020617] text-slate-150">16. Inspección de Riesgo</option>
                    <option value="Inspección de Seguridad" className="bg-[#020617] text-slate-150">17. Inspección de Seguridad</option>
                    <option value="Mitigación De Riesgo" className="bg-[#020617] text-slate-150">18. Mitigación De Riesgo</option>
                    <option value="Quema De Basura" className="bg-[#020617] text-slate-150">19. Quema De Basura</option>
                    <option value="Recarga de extintores" className="bg-[#020617] text-slate-150">20. Recarga de extintores</option>
                    <option value="Recorridos Preventivos" className="bg-[#020617] text-slate-150">21. Recorridos Preventivos</option>
                    <option value="Relevo de personal" className="bg-[#020617] text-slate-150">22. Relevo de personal</option>
                    <option value="Rescate Animal" className="bg-[#020617] text-slate-150">23. Rescate Animal</option>
                    <option value="Reubicación de avispas" className="bg-[#020617] text-slate-150">24. Reubicación de avispas</option>
                    <option value="Servicio de cura" className="bg-[#020617] text-slate-150">25. Servicio de cura</option>
                    <option value="Servicio de Nebulización" className="bg-[#020617] text-slate-150">26. Servicio de Nebulización</option>
                    <option value="Servicio de Tensión Arterial" className="bg-[#020617] text-slate-150">27. Servicio de Tensión Arterial</option>
                    <option value="Servicios De Ambulancia Traslado Extra Urbano" className="bg-[#020617] text-slate-150">28. Servicios De Ambulancia Traslado Extra Urbano</option>
                    <option value="Tala O Poda De Árbol" className="bg-[#020617] text-slate-150">29. Tala O Poda De Árbol</option>
                    <option value="Traslado de emergencia" className="bg-[#020617] text-slate-150">30. Traslado de emergencia</option>
                    <option value="Traslado Regular" className="bg-[#020617] text-slate-150">31. Traslado Regular</option>
                    <option value="Visita hospitalaria" className="bg-[#020617] text-slate-150">32. Visita hospitalaria</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado Operacional</label>
                  <select
                    value={editForm.status || 'Completed'}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as ServiceStatus }))}
                    className="w-full bg-slate-950/80 border border-slate-850 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-205 h-[38px] outline-none cursor-pointer"
                  >
                    <option value="Completed" className="bg-[#020617] text-slate-150">Completado</option>
                    <option value="Active" className="bg-[#020617] text-slate-150">Activo</option>
                    <option value="Pending Review" className="bg-[#020617] text-slate-150">Revisión Pendiente</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 border-t border-slate-800/60 pt-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bitácora Técnica / Summary</label>
                <textarea
                  value={editForm.summary || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, summary: e.target.value }))}
                  className="w-full bg-slate-950/80 border border-slate-850 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-650 transition-all outline-none resize-y"
                  rows={4}
                />
              </div>
            </div>
            <div className="p-4 bg-[#0a0d1a] border-t border-slate-800/60 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setSelectedRecordForEdit(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 border-0 text-slate-250 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
              >
                Descartar
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-indigo-650 hover:bg-indigo-550 border-0 text-white text-xs font-bold uppercase rounded-xl transition-all cursor-pointer shadow-[0_0_12px_rgba(79,70,229,0.3)]"
              >
                Confirmar Modificación
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. CONFIRM DELETE PROMPT MODAL */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-[#020617]/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800/85 overflow-hidden shadow-2xl max-w-md w-full animate-fade-in font-sans">
            <div className="p-5 border-b border-slate-800/60 bg-rose-950/20 flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-rose-500 animate-pulse" />
              <h3 className="font-extrabold text-[#fecdd3] uppercase tracking-wide text-xs">¿Desea eliminar este registro?</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-300 leading-relaxed">
                Esta acción eliminará de forma irreversible el parte de servicio <span className="font-mono font-extrabold text-indigo-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">{confirmDeleteId}</span> y lo borrará de todos los servidores sincronizados centralmente.
              </p>
              <p className="text-xs text-rose-455 mt-2.5 font-bold uppercase tracking-wider">
                * Asegúrese antes de proceder ya que perderá el historial operativo.
              </p>
            </div>
            <div className="p-4 bg-[#0a0d1a] border-t border-slate-800/60 flex justify-end gap-2">
              <button 
                onClick={() => setConfirmDeleteId(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer border-0"
              >
                No, Conservar
              </button>
              <button 
                onClick={() => {
                  onDeleteRecord(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase rounded-xl transition-all cursor-pointer border-0 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
              >
                Sí, Eliminar de la BD
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
