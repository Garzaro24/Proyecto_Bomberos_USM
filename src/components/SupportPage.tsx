import React from 'react';
import { HelpCircle, Phone, FileText, Settings, BookOpen } from 'lucide-react';

export default function SupportPage() {
  const guides = [
    {
      title: "Registro diario de turnos operativos",
      desc: "Cómo documentar los incidentes (EMS, Incendios, Rescates) detallando horas de respuesta y personal participante para garantizar la auditoría."
    },
    {
      title: "Administración del almacenamiento fuera de línea",
      desc: "Su laptop continuará salvando datos en el buffer de base de datos local HTML5 si se interrumpe la cobertura celular/WiFi. Al volver la señal, un indicador amarillo le avisará que hay sincronización pendiente hacia el servidor central."
    },
    {
      title: "Acreditaciones y certificaciones",
      desc: "Toda certificación de valor civil, entrenamiento HazMat o ascensos del personal se cargan desde el Prontuario del Personal para reportar la antigüedad académica."
    }
  ];

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-sans">Soporte y Recursos Técnicos</h2>
        <p className="text-gray-500 mt-2 text-base font-sans">Canales de socorro interno y especificaciones de uso del sistema de despacho.</p>
      </div>

      {/* Manual Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {guides.map((g, i) => (
          <div key={i} className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-800 mb-4">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">{g.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{g.desc}</p>
            </div>
            <button 
              onClick={() => alert(`Cargando archivo guía: "${g.title}"...`)}
              className="text-xs font-bold text-blue-800 border-t border-slate-100 pt-3 mt-4 text-left hover:text-blue-600 cursor-pointer"
            >
              Leer Manual →
            </button>
          </div>
        ))}
      </div>

      {/* Contact card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-sidebar_border pb-2">Información del Sistema de Despacho (Station 12)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-650">
          <div className="space-y-2">
            <p className="font-semibold text-slate-800 uppercase tracking-wide">Líneas Directas de Despacho:</p>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-rose-600" />
              <span className="font-mono text-slate-900 font-bold">Línea de Emergencias: 911 (Interno ext. 1201)</span>
            </div>
            <p className="text-slate-500 font-sans">Para soporte de radiofrecuencias VHF diríjase a la consola de despacho de la Estación 12.</p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-slate-800 uppercase tracking-wide">Creditos del Sistema:</p>
            <p className="font-sans">Emergency Command System v2.6.4</p>
            <p className="font-sans text-slate-400">Desarrollado para el Departamento de Bomberos Universitarios (UFD) bajo normativas de respuesta instantánea local.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
