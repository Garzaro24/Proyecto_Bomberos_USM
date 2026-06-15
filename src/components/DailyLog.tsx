import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Shield, IdCard } from 'lucide-react';
import { ServiceRecord, UserProfile } from '../types';

interface DailyLogProps {
  onSaveRecord: (record: Omit<ServiceRecord, 'id' | 'timestamp'>) => void;
  isOnline: boolean;
  sessionUser?: UserProfile | null;
}

export default function DailyLog({ onSaveRecord, isOnline, sessionUser }: DailyLogProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    serviceDate: new Date().toISOString().substring(0, 10),
    serviceType: '',
    summary: '',
    status: 'Completed' as 'Completed' | 'Active' | 'Pending Review'
  });

  const [nationality, setNationality] = useState<'V' | 'E'>('V');
  const [idNumber, setIdNumber] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Autofill effect when sessionUser changes or is loaded
  useEffect(() => {
    if (sessionUser) {
      const cleanFirst = sessionUser.firstName || sessionUser.name.split(' ')[0] || '';
      const cleanLast = sessionUser.lastName || sessionUser.name.split(' ').slice(1).join(' ') || '';
      
      setFormData(prev => ({
        ...prev,
        firstName: cleanFirst.toUpperCase(),
        lastName: cleanLast.toUpperCase()
      }));

      // Parse current personnelId
      const pId = sessionUser.personnelId || '';
      if (pId.includes('-')) {
        const parts = pId.split('-');
        if (parts[0] === 'V' || parts[0] === 'E') {
          setNationality(parts[0] as 'V' | 'E');
          setIdNumber(parts[1] || '');
        } else {
          setNationality('V');
          setIdNumber(pId);
        }
      } else {
        setNationality('V');
        setIdNumber(pId.replace(/[^0-9]/g, ''));
      }
    }
  }, [sessionUser]);

  // Handle generic changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 1 & 3: Limit Nombre only to Spanish letters, max 20, force uppercase
  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const sanitized = rawValue
      .replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, '')
      .toUpperCase()
      .slice(0, 20);
    setFormData(prev => ({ ...prev, firstName: sanitized }));
  };

  // 1 & 3: Limit Apellido only to Spanish letters, max 20, force uppercase
  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const sanitized = rawValue
      .replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, '')
      .toUpperCase()
      .slice(0, 20);
    setFormData(prev => ({ ...prev, lastName: sanitized }));
  };

  // 4: Cédula de Identidad only allows integers, max 10 digits
  const handleIdNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const sanitized = rawValue.replace(/\D/g, '').slice(0, 10);
    setIdNumber(sanitized);
  };

  // 4: Limit Bitácora / Resumen del incidente to max 300 characters
  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawValue = e.target.value;
    setFormData(prev => ({ ...prev, summary: rawValue.slice(0, 300) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    const first = formData.firstName.trim().toUpperCase();
    const last = formData.lastName.trim().toUpperCase();
    const incidentType = formData.serviceType;
    const summaryText = formData.summary;

    // Security injection check & validation matching the register portal rules
    if (!first || !last || !idNumber || !incidentType) {
      setNotification({
        type: 'error',
        message: 'Por favor complete todos los campos obligatorios (*).'
      });
      return;
    }

    if (!/^[A-ZÁÉÍÓÚÜÑ\s]{1,20}$/.test(first)) {
      setNotification({
        type: 'error',
        message: 'El Nombre ingresado es inválido o excede el límite de 20 caracteres.'
      });
      return;
    }

    if (!/^[A-ZÁÉÍÓÚÜÑ\s]{1,20}$/.test(last)) {
      setNotification({
        type: 'error',
        message: 'El Apellido ingresado es inválido o excede el límite de 20 caracteres.'
      });
      return;
    }

    if (!/^\d{1,10}$/.test(idNumber)) {
      setNotification({
        type: 'error',
        message: 'La Cédula de Identidad debe corresponder a un número de máximo 10 dígitos.'
      });
      return;
    }

    const formattedPersonnelId = `${nationality}-${idNumber}`;

    // Validate that the entered names and Cédula match the session user's registered details exactly
    if (sessionUser) {
      const expectedFirst = (sessionUser.firstName || sessionUser.name.split(' ')[0] || '').trim().toUpperCase();
      const expectedLast = (sessionUser.lastName || sessionUser.name.split(' ').slice(1).join(' ') || '').trim().toUpperCase();
      const expectedPersonnelId = (sessionUser.personnelId || '').trim().toUpperCase();

      const normalizedFormatted = formattedPersonnelId.replace(/\D/g, '');
      const normalizedExpected = expectedPersonnelId.replace(/\D/g, '');

      if (first !== expectedFirst || last !== expectedLast || normalizedFormatted !== normalizedExpected) {
        setNotification({
          type: 'error',
          message: `Error de verificación: El Nombre, Apellido o Cédula ingresados no coinciden exactamente con sus credenciales de sesión activa de Bomberos (Sesión actual: ${expectedFirst} ${expectedLast}, Cédula: ${expectedPersonnelId}). Por favor, ingrese sus datos autorizados para registrar este reporte.`
        });
        return;
      }
    }

    try {
      // Pass the combined formatted personnelId for recording
      onSaveRecord({
        firstName: first,
        lastName: last,
        personnelId: formattedPersonnelId,
        serviceDate: formData.serviceDate,
        serviceType: incidentType,
        summary: summaryText,
        status: formData.status
      });
      
      // Clear form
      setFormData({
        firstName: '',
        lastName: '',
        serviceDate: new Date().toISOString().substring(0, 10),
        serviceType: '',
        summary: '',
        status: 'Completed'
      });
      
      // Keep state session values if still logged in
      if (sessionUser) {
        const cleanFirst = sessionUser.firstName || sessionUser.name.split(' ')[0] || '';
        const cleanLast = sessionUser.lastName || sessionUser.name.split(' ').slice(1).join(' ') || '';
        setFormData(prev => ({
          ...prev,
          firstName: cleanFirst.toUpperCase(),
          lastName: cleanLast.toUpperCase()
        }));
      } else {
        setIdNumber('');
      }

      setNotification({
        type: 'success',
        message: isOnline 
          ? 'Registro de servicio enviado y guardado exitosamente en el servidor central.' 
          : 'Sin conexión a internet: Registro guardado localmente de forma segura. Se sincronizará automáticamente cuando vuelva la conexión.'
      });

      // Clear notification after 5s
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'No se pudo guardar el registro de servicio.'
      });
    }
  };

  const handleCancel = () => {
    if (sessionUser) {
      const cleanFirst = sessionUser.firstName || sessionUser.name.split(' ')[0] || '';
      const cleanLast = sessionUser.lastName || sessionUser.name.split(' ').slice(1).join(' ') || '';
      const pId = sessionUser.personnelId || '';
      
      setFormData({
        firstName: cleanFirst.toUpperCase(),
        lastName: cleanLast.toUpperCase(),
        serviceDate: new Date().toISOString().substring(0, 10),
        serviceType: '',
        summary: '',
        status: 'Completed'
      });

      if (pId.includes('-')) {
        const parts = pId.split('-');
        setNationality(parts[0] as 'V' | 'E');
        setIdNumber(parts[1] || '');
      } else {
        setNationality('V');
        setIdNumber(pId.replace(/[^0-9]/g, ''));
      }
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        serviceDate: new Date().toISOString().substring(0, 10),
        serviceType: '',
        summary: '',
        status: 'Completed'
      });
      setIdNumber('');
    }
    setNotification(null);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in font-sans">
      <div className="mb-8 font-sans">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-100">Registro Diario de Servicios</h2>
        <p className="text-slate-400 mt-2 text-base">Ingrese los detalles para el turno operativo actual o un incidente específico de servicio.</p>
      </div>

      {notification && (
        <div className={`mb-6 p-4 rounded-xl flex items-start gap-4 border ${
          notification.type === 'success' 
            ? 'bg-emerald-950/30 text-emerald-200 border-emerald-500/20' 
            : 'bg-rose-950/30 text-rose-200 border-rose-500/20'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mt-0.5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-rose-400" />
          )}
          <div>
            <p className="font-bold uppercase tracking-wider text-xs">{notification.type === 'success' ? 'Éxito' : 'Error'}</p>
            <p className="text-sm mt-1 text-slate-300">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Connection Indicator in Form Card */}
      <div className={`mb-4 px-4 py-3 rounded-xl flex items-center justify-between text-[11px] font-bold uppercase tracking-wider ${
        isOnline 
          ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10' 
          : 'bg-amber-500/5 text-amber-400 border border-amber-500/10 animate-pulse'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]' : 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.7)]'}`} />
          <span>Modo de Operación: {isOnline ? 'EN LÍNEA (Servidor de Red Operativo)' : 'FUERA DE LÍNEA (Guardando en BD Local)'}</span>
        </div>
        <span className="text-[10px] text-slate-400 font-semibold hidden md:inline">
          {isOnline 
            ? 'Datos enviados directo a la base de datos central' 
            : 'Cola deferida sincronizará automáticamente'}
        </span>
      </div>

      {/* Security Info banner */}
      <div className="mb-4 px-4 py-3 rounded-xl bg-indigo-950/10 border border-indigo-900/30 flex items-center gap-2.5 text-[11px] text-indigo-300 font-medium">
        <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
        <span>Validación y sanitizado de seguridad activo para evitar inyecciones e infiltraciones malware.</span>
      </div>

      {/* Form Card */}
      <div className="bg-[#0f172a]/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-6">
          
          {/* Row 1: Name & Surname */}
          <div className="col-span-1 md:col-span-6 flex flex-col gap-2">
            <div className="flex justify-between items-baseline">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest" htmlFor="firstName">
                Nombre <span className="text-rose-500">*</span>
              </label>
              <span className="text-[9px] font-bold text-slate-500 font-mono">
                {formData.firstName.length}/20 máx
              </span>
            </div>
            <input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleFirstNameChange}
              placeholder="INGRESE SU NOMBRE (SÓLO LETRAS)"
              maxLength={20}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/85 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-650 transition-all outline-none font-medium uppercase"
              type="text"
              required
            />
          </div>

          <div className="col-span-1 md:col-span-6 flex flex-col gap-2">
            <div className="flex justify-between items-baseline">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest" htmlFor="lastName">
                Apellido <span className="text-rose-500">*</span>
              </label>
              <span className="text-[9px] font-bold text-slate-500 font-mono">
                {formData.lastName.length}/20 máx
              </span>
            </div>
            <input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleLastNameChange}
              placeholder="INGRESE SU APELLIDO (SÓLO LETRAS)"
              maxLength={20}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/85 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-650 transition-all outline-none font-medium uppercase"
              type="text"
              required
            />
          </div>

          {/* Row 2: Cédula de Identidad instead of ID & Date */}
          <div className="col-span-1 md:col-span-6 flex flex-col gap-2">
            <div className="flex justify-between items-baseline">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Cédula de Identidad <span className="text-rose-500">*</span>
              </label>
              <span className="text-[9px] font-bold text-slate-500 font-mono">
                {idNumber.length}/10 dígitos máx
              </span>
            </div>
            <div className="flex gap-2">
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value as 'V' | 'E')}
                className="bg-slate-950/85 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold focus:border-indigo-500 transition-all outline-none h-[42px] shrink-0 cursor-pointer"
              >
                <option value="V">V-</option>
                <option value="E">E-</option>
              </select>
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <IdCard className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={idNumber}
                  onChange={handleIdNumberChange}
                  maxLength={10}
                  placeholder="Ej. 12345678"
                  className="w-full bg-slate-950/65 border border-slate-800 focus:border-indigo-500/85 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all h-[42px] font-mono font-medium"
                  required
                />
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-6 flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest" htmlFor="serviceDate">
              Fecha del Servicio <span className="text-rose-500">*</span>
            </label>
            <input
              id="serviceDate"
              name="serviceDate"
              value={formData.serviceDate}
              onChange={handleChange}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/85 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 transition-all outline-none"
              type="date"
              required
            />
          </div>

          {/* Row 3: Service Type & Incident Status */}
          <div className="col-span-1 md:col-span-6 flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest" htmlFor="serviceType">
              Tipo de Servicio o Incidente <span className="text-rose-500">*</span>
            </label>
            <select
              id="serviceType"
              name="serviceType"
              value={formData.serviceType}
              onChange={handleChange}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/85 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 transition-all outline-none h-[42px] font-medium"
              required
            >
              <option value="" disabled className="bg-[#020617] text-slate-400">Seleccione un tipo de incidente...</option>
              <option value="Acto de presencia en persona sin signos vitales" className="bg-[#020617] text-slate-100">1. Acto de presencia en persona sin signos vitales</option>
              <option value="Administración de medicamentos" className="bg-[#020617] text-slate-100">2. Administración de medicamentos</option>
              <option value="Alarma infundada" className="bg-[#020617] text-slate-100">3. Alarma infundada</option>
              <option value="Apoyo en Guardia de Prevención" className="bg-[#020617] text-slate-100">4. Apoyo en Guardia de Prevención</option>
              <option value="Atención Pre-Hospitalaria" className="bg-[#020617] text-slate-100">5. Atención Pre-Hospitalaria</option>
              <option value="Derrame de Combustible" className="bg-[#020617] text-slate-100">6. Derrame de Combustible</option>
              <option value="Diligencias del Servicio" className="bg-[#020617] text-slate-100">7. Diligencias del Servicio</option>
              <option value="Estabilización de paciente" className="bg-[#020617] text-slate-100">8. Estabilización de paciente</option>
              <option value="Guardia de Prevención" className="bg-[#020617] text-slate-100">9. Guardia de Prevención</option>
              <option value="Hecho Vial tipo arrollamiento" className="bg-[#020617] text-slate-100">10. Hecho Vial tipo arrollamiento</option>
              <option value="Hecho Vial tipo Colisión" className="bg-[#020617] text-slate-100">11. Hecho Vial tipo Colisión</option>
              <option value="Hecho Vial tipo volcamiento" className="bg-[#020617] text-slate-100">12. Hecho Vial tipo volcamiento</option>
              <option value="Incendio De Vehículo" className="bg-[#020617] text-slate-100">13. Incendio De Vehículo</option>
              <option value="Incendio Forestales / Vegetación" className="bg-[#020617] text-slate-100">14. Incendio Forestales / Vegetación</option>
              <option value="Inspección de Árbol" className="bg-[#020617] text-slate-100">15. Inspección de Árbol</option>
              <option value="Inspección de Riesgo" className="bg-[#020617] text-slate-100">16. Inspección de Riesgo</option>
              <option value="Inspección de Seguridad" className="bg-[#020617] text-slate-100">17. Inspección de Seguridad</option>
              <option value="Mitigación De Riesgo" className="bg-[#020617] text-slate-100">18. Mitigación De Riesgo</option>
              <option value="Quema De Basura" className="bg-[#020617] text-slate-100">19. Quema De Basura</option>
              <option value="Recarga de extintores" className="bg-[#020617] text-slate-100">20. Recarga de extintores</option>
              <option value="Recorridos Preventivos" className="bg-[#020617] text-slate-100">21. Recorridos Preventivos</option>
              <option value="Relevo de personal" className="bg-[#020617] text-slate-100">22. Relevo de personal</option>
              <option value="Rescate Animal" className="bg-[#020617] text-slate-100">23. Rescate Animal</option>
              <option value="Reubicación de avispas" className="bg-[#020617] text-slate-100">24. Reubicación de avispas</option>
              <option value="Servicio de cura" className="bg-[#020617] text-slate-100">25. Servicio de cura</option>
              <option value="Servicio de Nebulización" className="bg-[#020617] text-slate-100">26. Servicio de Nebulización</option>
              <option value="Servicio de Tensión Arterial" className="bg-[#020617] text-slate-100">27. Servicio de Tensión Arterial</option>
              <option value="Servicios De Ambulancia Traslado Extra Urbano" className="bg-[#020617] text-slate-100">28. Servicios De Ambulancia Traslado Extra Urbano</option>
              <option value="Tala O Poda De Árbol" className="bg-[#020617] text-slate-100">29. Tala O Poda De Árbol</option>
              <option value="Traslado de emergencia" className="bg-[#020617] text-slate-100">30. Traslado de emergencia</option>
              <option value="Traslado Regular" className="bg-[#020617] text-slate-100">31. Traslado Regular</option>
              <option value="Visita hospitalaria" className="bg-[#020617] text-slate-100">32. Visita hospitalaria</option>
            </select>
          </div>

          <div className="col-span-1 md:col-span-6 flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest" htmlFor="status">
              Estado Operativo Inicial
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/85 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 transition-all outline-none h-[42px] font-medium"
            >
              <option value="Completed" className="bg-[#020617] text-slate-100">Completado (Resuelto)</option>
              <option value="Active" className="bg-[#020617] text-slate-100">Activo (En Curso)</option>
              <option value="Pending Review" className="bg-[#020617] text-slate-100">Pendiente de Revisión</option>
            </select>
          </div>

          {/* Row 4: Summary with exactly 300 character limit */}
          <div className="col-span-1 md:col-span-12 flex flex-col gap-2">
            <div className="flex justify-between items-baseline">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest" htmlFor="summary">
                Resumen del Incidente / Bitácora
              </label>
              <span className="text-[10px] text-slate-500 uppercase tracking-wide font-bold font-mono">
                {formData.summary.length}/300 caracteres máx
              </span>
            </div>
            <textarea
              id="summary"
              name="summary"
              value={formData.summary}
              onChange={handleSummaryChange}
              maxLength={300}
              placeholder="Proporcione una descripción del incidente o las acciones tomadas (Opcional - Máx. 300 caracteres)..."
              rows={4}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/85 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-650 transition-all outline-none font-medium resize-y font-sans"
            />
          </div>

          {/* Submit Area */}
          <div className="col-span-1 md:col-span-12 flex justify-end mt-4 pt-6 border-t border-slate-800/60">
            <button
              onClick={handleCancel}
              type="button"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/40 rounded-xl font-bold text-xs tracking-wider uppercase px-6 py-3 mr-4 transition-all outline-none border-0 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-indigo-650 text-white rounded-xl font-bold text-xs tracking-wider uppercase px-8 py-3 flex items-center gap-2 hover:bg-indigo-500 hover:shadow-[0_0_15px_rgba(79,70,229,0.35)] transition-all outline-none border-0 shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4 text-indigo-200" />
              Guardar Registro de Servicio
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
