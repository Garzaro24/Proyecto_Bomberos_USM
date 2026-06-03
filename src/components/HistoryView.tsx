import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Shield, 
  Star, 
  Plus, 
  ShieldCheck, 
  Printer, 
  CheckCircle2, 
  Briefcase, 
  X, 
  Camera, 
  Save, 
  User, 
  BookOpen, 
  Fingerprint, 
  Activity,
  AlertTriangle
} from 'lucide-react';
import { HumanMilestone, MilestoneType, UserProfile } from '../types';

interface HistoryViewProps {
  milestones: HumanMilestone[];
  onAddMilestone: (milestone: Omit<HumanMilestone, 'id'>) => void;
  onDeleteMilestone: (id: string) => void;
  sessionUser: UserProfile | null;
  onUpdateProfile: (updated: UserProfile) => void;
  recordsCount?: number; // Optional prop to show actual logged incidents count
}

export default function HistoryView({ 
  milestones, 
  onAddMilestone, 
  onDeleteMilestone,
  sessionUser,
  onUpdateProfile
}: HistoryViewProps) {
  
  // Add milestone form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    personnelId: sessionUser?.personnelId || 'V-12345678',
    type: 'Certification' as MilestoneType,
    title: '',
    description: '',
    date: new Date().toISOString().substring(0, 10)
  });

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editBloodType, setEditBloodType] = useState('O+');
  const [editNationality, setEditNationality] = useState<'V' | 'E'>('V');
  const [editIdNumber, setEditIdNumber] = useState('');
  
  // Feedback states
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state with active user
  useEffect(() => {
    if (sessionUser) {
      setNewMilestone(prev => ({
        ...prev,
        personnelId: sessionUser.personnelId
      }));
    }
  }, [sessionUser]);

  // Handle opening profile editor with clean states
  const handleStartEdit = () => {
    if (sessionUser) {
      const cleanFirst = sessionUser.firstName || sessionUser.name.split(' ')[0] || '';
      const cleanLast = sessionUser.lastName || sessionUser.name.split(' ').slice(1).join(' ') || '';
      
      setEditFirstName(cleanFirst.toUpperCase());
      setEditLastName(cleanLast.toUpperCase());
      setEditBloodType(sessionUser.bloodType || 'O+');

      const pId = sessionUser.personnelId || '';
      if (pId.includes('-')) {
        const parts = pId.split('-');
        setEditNationality(parts[0] === 'E' ? 'E' : 'V');
        setEditIdNumber(parts[1] || '');
      } else {
        setEditNationality('V');
        setEditIdNumber(pId.replace(/[^0-9]/g, ''));
      }
    } else {
      // Default placeholder values for mock Jonathan Hayes profile demo editing
      setEditFirstName('JONATHAN');
      setEditLastName('HAYES');
      setEditBloodType('O+');
      setEditNationality('V');
      setEditIdNumber('8821000');
    }
    setValidationError(null);
    setPhotoError(null);
    setIsEditing(true);
  };

  // Secure photo upload handler with dual binary and MIME validation
  // Restriction: Only image/jpeg and image/png are allowed (no gif, webp, any other extension or mime)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Strict mime-type verification (JPEG and PNG only, no GIF or WEBP)
    const allowedMimeTypes = ['image/jpeg', 'image/png'];
    if (!allowedMimeTypes.includes(file.type)) {
      setPhotoError('ERROR DE SEGURIDAD: Solo se permiten exclusivamente formatos de imagen seguros (JPEG o PNG) para prevenir archivos sospechosos.');
      return;
    }

    // 2. Strict file extension double-check
    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png'];
    if (!extension || !allowedExtensions.includes(extension)) {
      setPhotoError('ERROR DE SEGURIDAD: La extensión del archivo debe ser exclusivamente .jpg, .jpeg o .png.');
      return;
    }

    // 3. File size limit: 2MB to keep browser memory and storage optimized
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('El tamaño del archivo excede el límite de 2 MB.');
      return;
    }

    // 4. File reading with secondary image structure validation
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Content = event.target?.result as string;
      const img = new Image();
      
      // Attempt loading image layout to ensure it's a real binary and not a disguised executable
      img.onload = async () => {
        // Safe image structure validated! We update state and server
        if (sessionUser) {
          try {
            const first = sessionUser.firstName || sessionUser.name.split(' ')[0] || '';
            const last = sessionUser.lastName || sessionUser.name.split(' ').slice(1).join(' ') || '';

            const response = await fetch('/api/auth/update-profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                username: sessionUser.username,
                firstName: first,
                lastName: last,
                personnelId: sessionUser.personnelId,
                bloodType: sessionUser.bloodType || 'O+',
                photoBase64: base64Content
              })
            });

            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.error || 'No se pudo guardar la foto de perfil en el servidor.');
            }

            onUpdateProfile(data);
            setSuccessMsg('Foto de perfil actualizada exitosamente en formato carnet estándar (JPEG/PNG).');
            setTimeout(() => setSuccessMsg(null), 4000);
          } catch (err: any) {
            setPhotoError(err.message || 'Error al sincronizar la foto de perfil con el servidor central de bomberos.');
          }
        } else {
          setPhotoError('Inicie sesión en su portal para cambiar la foto del perfil del sistema.');
        }
      };
      img.onerror = () => {
        setPhotoError('ERROR DE SEGURIDAD: El contenido del archivo no es una estructura de imagen JPEG o PNG válida.');
      };
      img.src = base64Content;
    };
    reader.onerror = () => {
      setPhotoError('No se pudo leer el archivo seleccionado.');
    };
    reader.readAsDataURL(file);
  };

  // Save profile edits with server validation and strict uniqueness checks for Cédula de Identidad
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const first = editFirstName.trim().toUpperCase();
    const last = editLastName.trim().toUpperCase();

    if (!first || !last || !editIdNumber) {
      setValidationError('Todos los campos indicados con (*) son obligatorios.');
      return;
    }

    // Standard letters-only validation pattern matching register constraints
    if (!/^[A-ZÁÉÍÓÚÜÑ\s]{1,20}$/.test(first)) {
      setValidationError('El Nombre solo debe incluir letras del alfabeto castellano (máx. 20 caracteres) sin números.');
      return;
    }

    if (!/^[A-ZÁÉÍÓÚÜÑ\s]{1,20}$/.test(last)) {
      setValidationError('El Apellido solo debe incluir letras del alfabeto castellano (máx. 20 caracteres) sin números.');
      return;
    }

    // Digits-only check for Cédula de Identidad matching register constraints
    if (!/^\d{1,10}$/.test(editIdNumber)) {
      setValidationError('La Cédula de Identidad solo debe de ser un número entero (máximo 10 dígitos).');
      return;
    }

    const formattedPersonnelId = `${editNationality}-${editIdNumber}`;

    if (!sessionUser) {
      setValidationError('No hay un perfil de sesión activa para guardar de forma persistente.');
      return;
    }

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: sessionUser.username,
          firstName: first,
          lastName: last,
          personnelId: formattedPersonnelId,
          bloodType: editBloodType,
          photoBase64: sessionUser.photoBase64
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error de sincronización.');
      }

      onUpdateProfile(data);
      setIsEditing(false);
      setSuccessMsg('Sus datos de oficial de bomberos han sido actualizados y sincronizados de inmediato.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setValidationError(err.message || 'Error de comunicación al actualizar datos. Cédula duplicada o error de red.');
    }
  };

  // Handle custom milestone creation
  const handleMilestoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestone.title || !newMilestone.description) {
      alert("Por favor complete toda la información del hito.");
      return;
    }
    onAddMilestone(newMilestone);
    setNewMilestone({
      personnelId: sessionUser?.personnelId || 'V-12345678',
      type: 'Certification',
      title: '',
      description: '',
      date: new Date().toISOString().substring(0, 10)
    });
    setShowAddForm(false);
  };

  // Profile fields helper (dynamic or fallback mock Jonathan Hayes)
  const isSessionActive = !!sessionUser;
  const userFirst = sessionUser?.firstName || 'JONATHAN';
  const userLast = sessionUser?.lastName || 'HAYES';
  const userFullName = sessionUser?.name || 'JONATHAN HAYES';
  const userRoleStr = sessionUser?.role || 'Teniente';
  const userBlood = sessionUser?.bloodType || 'O+';
  const userCedulaId = sessionUser?.personnelId || 'V-8821000';
  const userPhoto = sessionUser?.photoBase64 || "https://lh3.googleusercontent.com/aida-public/AB6AXuB1Cy5rKbHLlNHUZh1NUrB4hwImIkrXxA0XKv3_Wu4_m4d6wRl5dB-nTwcOhfKhh9Hfqo3aRVTQZuYp5WZH9ZFdDldrjNDrFKeu-SqDuOAiGWstgUz4QHhrenN4W0M6PzLqV1MaodmU_4FcEaY5SfRo2ZFvaZtCAM0pSBG36DBK0HThGyUyfK535iBDoLEAqLIBeRcsCoU90kY3aXkgdQx-nhBd3zSi9wkwbPWMnuX61jcYIhkn8vk5pOgB1GeDFIt90Uo6vzVTPCQ";

  // Dynamic values or firefighter standards
  const defaultYears = isSessionActive ? '4.8' : '14.5';
  const defaultCondecoraciones = isSessionActive ? '3' : '7';
  const defaultAssignment = isSessionActive 
    ? `Escuadra Operativa - Bomberos de guardia Estación 12. Oficial Registrado.`
    : `Asignado desde el 12 de Octubre de 2021. Sus responsabilidades cruciales comprenden operaciones de extracción pesada, respuesta HazMat y soporte vital avanzado en emergencias médicas complejas.`;

  // Milestone Icon helpers
  const getMilestoneIcon = (type: MilestoneType) => {
    switch (type) {
      case 'Promotion':
        return <Star className="w-5 h-5 text-white fill-white" />;
      case 'Certification':
        return <ShieldCheck className="w-5 h-5 text-slate-700" />;
      case 'Commendation':
        return <Award className="w-5 h-5 text-amber-600 fill-amber-100" />;
      case 'Onboarding':
        return <Briefcase className="w-5 h-5 text-slate-500" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-slate-500" />;
    }
  };

  const getMilestoneIconBgClass = (type: MilestoneType) => {
    switch (type) {
      case 'Promotion':
        return 'bg-rose-500 text-white shadow-sm ring-4 ring-rose-950/20';
      case 'Certification':
        return 'bg-slate-800 text-slate-200 ring-4 ring-slate-900/25';
      case 'Commendation':
        return 'bg-amber-150 text-amber-900 ring-4 ring-amber-950/20';
      case 'Onboarding':
        return 'bg-sky-600 text-white ring-4 ring-sky-950/20';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  return (
    <div className="animate-fade-in space-y-8 font-sans">
      {/* Page Header & Actions */}
      <div className="flex justify-between items-end border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Expediente Operativo Personal</h1>
          <p className="text-slate-400 mt-1 text-sm">Historial detallado de servicios, hoja de vida y credenciales validadas del oficial de guardia.</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#1e293b] text-slate-100 hover:bg-slate-700 px-4 py-2 rounded-xl border border-slate-700/60 transition-colors font-bold text-xs tracking-wide uppercase cursor-pointer"
        >
          <Printer className="w-4 h-4 text-slate-300" />
          Imprimir Expediente
        </button>
      </div>

      {/* Global alert messages */}
      {(successMsg || photoError || validationError) && (
        <div className="space-y-2">
          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}
          {photoError && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/20 text-rose-200 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-semibold">{photoError}</span>
            </div>
          )}
          {validationError && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/20 text-rose-200 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-semibold">{validationError}</span>
            </div>
          )}
        </div>
      )}

      {/* Bento Layout: Interactive Profile & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Interactive Profile Card with standard vertical "Foto Carnet" proportions */}
        <div id="personal-profile-root" className="md:col-span-5 bg-[#0f172a]/30 border border-slate-800/85 rounded-2xl p-6 flex flex-col items-center shadow-xl backdrop-blur-md relative">
          
          {!isEditing ? (
            // VIEW PROFILE MODE
            <div className="w-full flex flex-col items-center text-center">
              
              {/* Photo Carnet Box: 4:5 vertical aspects standard standard (Width 128px, Height 160px for elegant portrait) */}
              <div className="w-32 h-40 max-w-full bg-slate-900 border-4 border-slate-950/80 rounded-xl shadow-xl overflow-hidden mb-5 relative group shrink-0">
                <img 
                  alt={`Foto Carnet de ${userFullName}`} 
                  className="w-full h-full object-cover" 
                  src={userPhoto}
                  referrerPolicy="no-referrer"
                />
                
                {/* Upload camera overlay */}
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-[10px] uppercase font-bold tracking-wider shrink-0 gap-1.5 p-2">
                  <Camera className="w-5 h-5 text-indigo-400" />
                  <span>Subir Foto Carnet</span>
                  <span className="text-[8px] text-slate-350 lowercase text-center">solamente JPEG/PNG (max 2 Mb)</span>
                  <input 
                    type="file" 
                    accept="image/jpeg, image/png" 
                    onChange={handlePhotoUpload} 
                    className="hidden" 
                  />
                </label>
              </div>

              {/* Identifier tag */}
              <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest bg-indigo-950/40 border border-indigo-900/60 rounded-full px-3 py-1 mb-3">
                {userRoleStr}
              </span>

              <h2 className="text-xl font-extrabold text-slate-100 tracking-tight leading-tight uppercase">
                {userFirst} <br />
                <span className="text-slate-300 font-bold">{userLast}</span>
              </h2>

              <p className="text-[11px] font-bold text-slate-450 uppercase tracking-wider mt-1.5">
                Cédula: {userCedulaId}
              </p>

              {/* Status active badge */}
              <div className="mt-4 flex flex-wrap justify-center gap-2 w-full">
                <span className="px-3 py-1 bg-slate-950/70 text-slate-300 border border-slate-800/80 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Fingerprint className="w-3 h-3 text-indigo-400" /> ID: {userCedulaId.split('-')[1] || userCedulaId}
                </span>
                <span className="px-3 py-1 bg-emerald-950/30 text-emerald-350 border border-emerald-900/40 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" /> ACTIVO
                </span>
              </div>

              {/* Profile variables details section */}
              <div className="mt-6 w-full text-left border-t border-slate-800/80 pt-4.5 space-y-4 font-sans">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Grupo Sanguíneo</span>
                    <span className="font-mono text-xs font-bold text-slate-200 mt-1 block uppercase">
                      FActor {userBlood}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Acreditación Médica</span>
                    <span className="font-mono text-xs font-bold text-slate-200 mt-1 block uppercase">
                      EMT-P, HazMat
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleStartEdit}
                    className="w-full bg-[#1e293b] hover:bg-slate-850 text-slate-200 font-bold text-xs tracking-wider uppercase py-2.5 px-4 rounded-xl border border-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer outline-none"
                    title="Modificar Nombre, Apellido, Cédula o Tipo de Sangre"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    Modificar Datos de Oficial
                  </button>
                </div>
              </div>

            </div>
          ) : (
            // EDIT PROFILE FORM MODE
            <form onSubmit={handleSaveProfile} className="w-full space-y-4.5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <h3 className="text-xs font-extrabold text-slate-100 uppercase tracking-widest">Modificar Mis Credenciales</h3>
                <span className="text-[9px] font-bold text-indigo-400 font-mono">Validación de Seguridad</span>
              </div>

              {/* Photo Input in Edit Mode */}
              <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                <div className="w-12 h-15 bg-slate-900 rounded-md overflow-hidden shrink-0 border border-slate-850 relative">
                  <img src={userPhoto} className="w-full h-full object-cover" alt="Carnet" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Foto de Identificación</span>
                  <label className="inline-block mt-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800/60 px-3 py-1 rounded text-[10px] font-bold uppercase text-indigo-200 cursor-pointer">
                    Seleccionar Archivo
                    <input type="file" accept="image/jpeg, image/png" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                  <p className="text-[8px] text-slate-500 mt-0.5">JPEG, PNG (Carnet máx 2MB)</p>
                </div>
              </div>

              {/* Nombre component edit */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre <span className="text-rose-500">*</span></label>
                  <span className="text-[9px] text-slate-500 font-mono">{editFirstName.length}/20 máx</span>
                </div>
                <input
                  type="text"
                  maxLength={20}
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, '').toUpperCase())}
                  placeholder="SOLO LETRAS DEL NOMBRE"
                  className="w-full bg-slate-950/85 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-xs text-slate-100 transition-all outline-none font-bold placeholder-slate-705 uppercase"
                  required
                />
              </div>

              {/* Apellido component edit */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Apellido <span className="text-rose-500">*</span></label>
                  <span className="text-[9px] text-slate-500 font-mono">{editLastName.length}/20 máx</span>
                </div>
                <input
                  type="text"
                  maxLength={20}
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, '').toUpperCase())}
                  placeholder="SOLO LETRAS DEL APELLIDO"
                  className="w-full bg-slate-950/85 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-xs text-slate-100 transition-all outline-none font-bold placeholder-slate-705 uppercase"
                  required
                />
              </div>

              {/* Cédula edit with dropdown selector */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cédula de Identidad <span className="text-rose-500">*</span></label>
                  <span className="text-[9px] text-slate-500 font-mono">{editIdNumber.length}/10 dígitos</span>
                </div>
                <div className="flex gap-2">
                  <select
                    value={editNationality}
                    onChange={(e) => setEditNationality(e.target.value as 'V' | 'E')}
                    className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2 text-xs font-bold focus:border-indigo-500 transition-all outline-none h-9 cursor-pointer shrink-0"
                  >
                    <option value="V">V-</option>
                    <option value="E">E-</option>
                  </select>
                  <input
                    type="text"
                    maxLength={10}
                    value={editIdNumber}
                    onChange={(e) => setEditIdNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Escriba los números"
                    className="w-full bg-slate-950/85 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-xs text-slate-100 transition-all outline-none font-mono font-medium"
                    required
                  />
                </div>
              </div>

              {/* Blood group selection edit entry */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grupo Sanguíneo</label>
                <select
                  value={editBloodType}
                  onChange={(e) => setEditBloodType(e.target.value)}
                  className="w-full bg-slate-950/85 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-xs text-slate-200 transition-all outline-none h-9 cursor-pointer font-medium"
                >
                  <option value="O+">FACT O-POSITIVO (O+)</option>
                  <option value="O-">FACT O-NEGATIVO (O-)</option>
                  <option value="A+">FACT A-POSITIVO (A+)</option>
                  <option value="A-">FACT A-NEGATIVO (A-)</option>
                  <option value="B+">FACT B-POSITIVO (B+)</option>
                  <option value="B-">FACT B-NEGATIVO (B-)</option>
                  <option value="AB+">FACT AB-POSITIVO (AB+)</option>
                  <option value="AB-">FACT AB-NEGATIVO (AB-)</option>
                </select>
              </div>

              {/* Submit / Cancel Area */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] tracking-wider uppercase py-2 px-4 rounded-xl border-0 cursor-pointer"
                >
                  Regresar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-650 hover:bg-indigo-550 text-white font-bold text-[10px] tracking-wider uppercase py-2 px-5 rounded-xl border-0 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  Guardar Cambios
                </button>
              </div>

            </form>
          )}

        </div>

        {/* Stats Bento Grid on Right-Hand Side */}
        <div className="md:col-span-7 grid grid-cols-2 lg:grid-cols-2 gap-6">
          
          {/* Stat 1: Años de servicio */}
          <div className="bg-[#0f172a]/20 border border-slate-800/70 rounded-2xl p-5 flex flex-col justify-center shadow-md backdrop-blur-sm">
            <span className="text-[10px] font-extrabold text-slate-450 uppercase flex items-center gap-2 mb-2 tracking-widest">
              <Shield className="w-4 h-4 text-indigo-400 shrink-0" /> Años de Servicio UFD
            </span>
            <span className="text-4xl font-extrabold font-mono text-slate-100 leading-tight">
              {defaultYears}
            </span>
            <span className="text-[10.5px] text-slate-500 font-medium mt-1">Sujeto a resoluciones ministeriales</span>
          </div>

          {/* Stat 2: Condecoraciones */}
          <div className="bg-[#0f172a]/20 border border-slate-800/70 rounded-2xl p-5 flex flex-col justify-center shadow-md backdrop-blur-sm">
            <span className="text-[10px] font-extrabold text-slate-450 uppercase flex items-center gap-2 mb-2 tracking-widest">
              <Award className="w-4 h-4 text-indigo-400 shrink-0" /> Condecoraciones de Honor
            </span>
            <span className="text-4xl font-extrabold font-mono text-slate-100 leading-tight">
              {defaultCondecoraciones}
            </span>
            <span className="text-[10.5px] text-slate-500 font-medium mt-1">Condecoraciones por valor y antigüedad</span>
          </div>

          {/* Current Assignment Banner Card spanning bottom cols */}
          <div className="bg-indigo-950/10 border border-indigo-900/30 rounded-2xl p-5 col-span-2 flex items-start gap-4.5 shadow-md">
            <div className="w-12 h-12 rounded-xl bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center shrink-0">
              <Briefcase className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-200 text-sm uppercase tracking-wide">Asignación Operativa Activa</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-semibold">
                {defaultAssignment}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Chronological History Timeline */}
      <div className="mt-8">
        
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-2">
          <h3 className="font-extrabold text-slate-100 font-sans text-sm uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-450" />
            Expediente Administrativo y Académico
          </h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-550 text-white rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors shadow-md outline-none border-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-200" />
            {showAddForm ? "Cancelar Ingreso" : "Registrar Log Histórico"}
          </button>
        </div>

        {/* Dynamic New Milestone Form */}
        {showAddForm && (
          <div className="mb-8 p-5 bg-[#0f172a]/30 border border-slate-800/80 rounded-2xl shadow-xl animate-fade-in max-w-2xl font-sans text-slate-200">
            <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-4">Ingresar Nuevo Log Histórico de Servicio o Curso</h4>
            <form onSubmit={handleMilestoneSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo de Registro</label>
                  <select
                    value={newMilestone.type}
                    onChange={(e) => setNewMilestone(prev => ({ ...prev, type: e.target.value as MilestoneType }))}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs focus:border-indigo-505 outline-none h-9 font-semibold text-slate-300 cursor-pointer"
                  >
                    <option value="Certification" className="bg-[#020617]">Acreditación / Curso Académico</option>
                    <option value="Promotion" className="bg-[#020617]">Ascenso Militar/Jerárquico</option>
                    <option value="Commendation" className="bg-[#020617]">Condecoración por Valor</option>
                    <option value="Onboarding" className="bg-[#020617]">Ingreso Inicial de Contratación</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha del Suceso</label>
                  <input
                    type="date"
                    value={newMilestone.date}
                    onChange={(e) => setNewMilestone(prev => ({ ...prev, date: e.target.value }))}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs focus:border-indigo-505 outline-none h-9 text-slate-200"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Título de la Acreditación / Sello</label>
                <input
                  type="text"
                  placeholder="Ej. Curso Práctico de Combate de Incendios Clase B"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs focus:border-indigo-505 outline-none text-slate-100 placeholder-slate-705"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descripción Técnica</label>
                <textarea
                  placeholder="Detalles técnicos, institución emisora y código de resolución o número de folio..."
                  rows={2}
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs focus:border-indigo-505 outline-none text-slate-200 placeholder-slate-705 resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-805">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border-0 bg-slate-800 text-slate-300 text-[10px] font-bold uppercase rounded-xl hover:bg-slate-700 cursor-pointer"
                >
                  Descartar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 border-0 bg-indigo-650 text-white text-[10px] font-bold uppercase rounded-xl hover:bg-indigo-550 cursor-pointer shadow-md"
                >
                  Guardar Log
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Timeline Structure (Matches exact styling of screenshot 4) */}
        {milestones.length === 0 ? (
          <div className="p-12 text-center text-slate-450 border border-dashed border-slate-800/80 rounded-2xl">
            No hay registros históricos indexados en este expediente de oficial.
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-800/80">
            {milestones.map((milestone, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <div 
                  key={milestone.id} 
                  className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group`}
                >
                  {/* Circle Icon Badge */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-lg z-10 ${getMilestoneIconBgClass(milestone.type)}`}>
                    {getMilestoneIcon(milestone.type)}
                  </div>

                  {/* Text card panel */}
                  <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-[#0f172a]/20 border border-slate-800/80 p-5 rounded-2xl shadow-md hover:shadow-xl hover:bg-[#0f172a]/30 transition-all duration-200 relative">
                    
                    {/* Delete button for local management */}
                    <button
                      onClick={() => onDeleteMilestone(milestone.id)}
                      className="absolute top-4 right-4 text-slate-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-slate-900 cursor-pointer border-0"
                      title="Eliminar registro histórico"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex justify-between items-start mb-2.5">
                      <span className={`text-[9px] font-extrabold uppercase py-0.5 px-2 rounded-lg border ${
                        milestone.type === 'Promotion' 
                          ? 'bg-rose-950/20 text-rose-300 border-rose-900/30' 
                          : milestone.type === 'Commendation'
                          ? 'bg-amber-950/20 text-amber-300 border-amber-900/30'
                          : 'bg-slate-900/45 text-slate-350 border-slate-850'
                      }`}>
                        {milestone.type === 'Promotion' ? "Ascenso" : milestone.type === 'Certification' ? "Acreditación" : milestone.type === 'Commendation' ? "Condecoración" : "Ingreso"}
                      </span>
                      <span className="font-mono text-xs text-slate-500 font-bold">{milestone.date}</span>
                    </div>

                    <h4 className="text-sm font-extrabold text-slate-200 leading-tight pr-6">{milestone.title}</h4>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed font-semibold">{milestone.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
