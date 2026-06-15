import React, { useState } from 'react';
import { Flame, Lock, User, IdCard, Shield, Eye, EyeOff, AlertCircle, RefreshCw, LogIn, UserPlus } from 'lucide-react';
import { UserProfile } from '../types';
import USMLogo from './USMLogo';

interface AuthPortalProps {
  onLoginSuccess: (user: UserProfile) => void;
  isOnline: boolean;
}

export default function AuthPortal({ onLoginSuccess, isOnline }: AuthPortalProps) {
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  
  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Split Full Name into First Name & Last Name
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Cédula de Identidad setup
  const [nationality, setNationality] = useState<'V' | 'E'>('V');
  const [idNumber, setIdNumber] = useState('');
  
  // Blood Type selection
  const [bloodType, setBloodType] = useState('O+');
  
  const [role, setRole] = useState('Bombero');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Blood types list
  const BLOOD_TYPES_OPTIONS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setNationality('V');
    setIdNumber('');
    setBloodType('O+');
    setRole('Bombero');
    setError(null);
    setSuccess(null);
  };

  const handleToggleMode = () => {
    setIsRegistering(!isRegistering);
    resetForm();
  };

  // 1. Username filter (Limit to max 10 characters, allowed characters: lowercases, digits, dashes, underscores)
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Security Injection and Malware Protection: strict character whitelisting
    const sanitized = rawValue
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '') // Statically filter out any HTML tag characters, slashes, or quotes
      .slice(0, 10);
    setUsername(sanitized);
  };

  // 2. Names filter (Limit to max 20 characters, allowed characters: letters and spaces only, force uppercase)
  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Strictly block numbers and special characters to prevent SQL payload or active script injections
    const sanitized = rawValue
      .replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, '')
      .toUpperCase()
      .slice(0, 20);
    setFirstName(sanitized);
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Strictly block numbers and special characters
    const sanitized = rawValue
      .replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, '')
      .toUpperCase()
      .slice(0, 20);
    setLastName(sanitized);
  };

  // 4. Cédula Identifier validation: strictly block non-digits, max 10 characters
  const handleIdNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const sanitized = rawValue.replace(/\D/g, '').slice(0, 10);
    setIdNumber(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password;

    if (!cleanUsername || !cleanPassword) {
      setError('Por favor complete todos los campos obligatorios.');
      setIsLoading(false);
      return;
    }

    // Client-side Password Validation
    if (cleanPassword.length < 6 || cleanPassword.length > 10) {
      setError('La contraseña de acceso debe tener obligatoriamente entre 6 y 10 caracteres.');
      setIsLoading(false);
      return;
    }

    const hasUppercase = /[A-Z]/.test(cleanPassword);
    const hasNumber = /\d/.test(cleanPassword);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(cleanPassword);

    if (!hasUppercase || !hasNumber || !hasSpecial) {
      setError('La contraseña debe contener al menos una letra Mayúscula, un Número y un Carácter Especial por seguridad.');
      setIsLoading(false);
      return;
    }

    if (isRegistering) {
      const cleanFirstName = firstName.trim().toUpperCase();
      const cleanLastName = lastName.trim().toUpperCase();
      
      if (!cleanFirstName || !cleanLastName) {
        setError('Por favor complete su Nombre y su Apellido para el registro oficial.');
        setIsLoading(false);
        return;
      }

      if (!idNumber) {
        setError('La Cédula de Identidad de bomberos es obligatoria.');
        setIsLoading(false);
        return;
      }

      // Combine Names to fit the Name field in the DB in correct uppercase format
      const fullName = `${cleanFirstName} ${cleanLastName}`;
      // Format Cédula de identidad to match Personnel ID
      const formattedPersonnelId = `${nationality}-${idNumber}`;

      // Call authentication API
      try {
        const payload = { 
          username: cleanUsername, 
          password: cleanPassword, 
          name: fullName, 
          personnelId: formattedPersonnelId, 
          role, 
          bloodType,
          firstName: cleanFirstName,
          lastName: cleanLastName
        };

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Ocurrió un error inesperado al procesar.');
        }

        setSuccess('¡Cuenta oficial registrada con éxito! Redirigiendo a inicio de sesión...');
        setTimeout(() => {
          setIsRegistering(false);
          setPassword('');
          setSuccess(null);
          setIsLoading(false);
        }, 2200);

      } catch (err: any) {
        setError(err.message || 'Fallo de comunicación con la base de datos central.');
        setIsLoading(false);
      }
    } else {
      // Login flow
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: cleanUsername, password: cleanPassword }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Credenciales inválidas o error de conexión.');
        }

        // Logged in!
        onLoginSuccess(data);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || 'Error de comunicación con el servidor de autenticación.');
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#020617] px-4 py-12 relative overflow-hidden font-sans">
      {/* Decorative fire-brick abstract ambient circles */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-red-650/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-650/10 blur-[130px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10 transition-transform duration-300">
        
        {/* Brand / Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <USMLogo className="w-16 h-16 shadow-[0_0_20px_rgba(59,130,246,0.3)] mb-4" />
          <h2 className="text-xl font-extrabold text-slate-100 tracking-tight text-center">
            Bomberos USM
          </h2>
          <p className="text-[10px] font-bold text-indigo-400 mt-1 uppercase tracking-widest text-center">
            Universidad Santa María, Venezuela
          </p>
          <p className="text-[11px] font-semibold text-slate-400 mt-2 uppercase tracking-wide text-center">
            {isRegistering ? 'Formulario de Registro Oficial' : 'Portal de Acceso - Control Operativo'}
          </p>
        </div>

        {/* Offline notice check */}
        {!isOnline && (
          <div className="mb-6 p-3 rounded-xl bg-orange-950/40 border border-orange-850/50 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div className="text-[11px] font-medium text-orange-300 leading-relaxed">
              <strong>Fuera de Línea (Offline):</strong> El sistema requiere conexión con el servidor para verificar las credenciales de seguridad en tiempo real.
            </div>
          </div>
        )}

        {/* Security / Injection Filter Information Banner */}
        <div className="mb-6 px-3.5 py-2.5 rounded-xl bg-indigo-950/20 border border-indigo-900/40 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="text-[10px] font-medium text-indigo-300 leading-normal">
            Todos los campos cuentan con validadores activos de inyecciones maliciosas y filtrado de desbordamientos en tiempo real.
          </div>
        </div>

        {/* Success and Error messages */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="text-[12px] font-medium text-red-300 leading-snug">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-start gap-3 animate-fade-in">
            <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-spin" />
            <span className="text-[12px] font-medium text-emerald-300">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username */}
          <div className="space-y-1.5 font-sans">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Nombre de Usuario
              </label>
              <span className="text-[9px] font-bold text-slate-500 font-mono">
                {username.length}/10 máx
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                maxLength={10}
                placeholder="Máx. 10 caract. (ej: hayes88)"
                className="w-full bg-slate-950/65 border border-slate-800 focus:border-indigo-500/85 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 tracking-wide outline-none transition-all h-[42px]"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Contraseña de Acceso
              </label>
              <span className="text-[9px] font-bold text-slate-500 font-mono">
                min 6 - máx 10
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value.substring(0, 10))}
                maxLength={10}
                placeholder="Min. 6 - Max 10 (ej: Bombe1!)"
                className="w-full bg-slate-950/65 border border-slate-800 focus:border-indigo-500/85 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 tracking-wide outline-none transition-all h-[42px]"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 border-0 bg-transparent p-1 px-1.5 cursor-pointer rounded"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Register-only Fields */}
          {isRegistering && (
            <div className="space-y-4 pt-1 animate-fade-in">
              <div className="h-px bg-slate-800/60 my-2"></div>
              
              {/* Split names: First Name and Last Name */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* Nombre */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Nombre
                    </label>
                    <span className="text-[8px] font-mono text-slate-500">
                      {firstName.length}/20
                    </span>
                  </div>
                  <input
                    type="text"
                    value={firstName}
                    onChange={handleFirstNameChange}
                    maxLength={20}
                    placeholder="SÓLO LETRAS"
                    className="w-full bg-slate-950/65 border border-slate-800 focus:border-indigo-500/85 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all h-[42px] uppercase font-semibold"
                    required={isRegistering}
                    disabled={isLoading}
                  />
                </div>

                {/* Apellido */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Apellido
                    </label>
                    <span className="text-[8px] font-mono text-slate-500">
                      {lastName.length}/20
                    </span>
                  </div>
                  <input
                    type="text"
                    value={lastName}
                    onChange={handleLastNameChange}
                    maxLength={20}
                    placeholder="SÓLO LETRAS"
                    className="w-full bg-slate-950/65 border border-slate-800 focus:border-indigo-500/85 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all h-[42px] uppercase font-semibold"
                    required={isRegistering}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Cédula de Identidad replacing personnelId */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Cédula de Identidad
                  </label>
                  <span className="text-[9px] font-bold text-slate-500 font-mono">
                    {idNumber.length}/10 dígitos
                  </span>
                </div>
                <div className="flex gap-2">
                  <select
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value as 'V' | 'E')}
                    className="bg-slate-950/85 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold focus:border-indigo-500 transition-all outline-none h-[42px] shrink-0 cursor-pointer"
                    disabled={isLoading}
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
                      className="w-full bg-slate-950/65 border border-slate-800 focus:border-indigo-500/85 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all h-[42px]"
                      required={isRegistering}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Blood Type Options Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tipo de Sangre
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-500 font-bold text-xs select-none">
                    O-
                  </span>
                  <select
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className="w-full bg-slate-950/85 border border-slate-800 focus:border-indigo-500/85 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 outline-none transition-all h-[42px] cursor-pointer appearance-none font-bold"
                    disabled={isLoading}
                  >
                    {BLOOD_TYPES_OPTIONS.map((bt) => (
                      <option key={bt} value={bt}>Grupo Sangre: {bt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rango / Rol */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Rango de Despliegue
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <Shield className="w-4 h-4" />
                  </span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-950/85 border border-slate-800 focus:border-indigo-500/85 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 outline-none transition-all h-[42px] cursor-pointer appearance-none"
                    disabled={isLoading}
                  >
                    <option value="Bombero">Bombero</option>
                    <option value="Paramedico">Paramedico</option>
                    <option value="Sargento">Sargento</option>
                    <option value="Teniente">Teniente</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Prompt/Info */}
          {!isRegistering && (
            <div className="text-[11px] text-slate-500 leading-normal text-center mt-1">
              ¿No tienes una cuenta? Pulse "Registrar Cuenta" para rellenar sus credenciales oficiales de Bomberos USM.
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full mt-6 h-[44px] cursor-pointer border-0 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 text-white ${
              isLoading 
                ? 'bg-indigo-600/50 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-550 active:scale-[0.98] shadow-[0_4px_16px_rgba(79,70,229,0.35)]'
            }`}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isRegistering ? (
              <>
                <UserPlus className="w-4 h-4" />
                Registrar Cuenta de Personal
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800/50 flex flex-col items-center">
          <button
            type="button"
            onClick={handleToggleMode}
            disabled={isLoading}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase border-0 bg-transparent cursor-pointer"
          >
            {isRegistering ? '← Regresar al Inicio de Sesión' : 'Registrar Cuenta de Personal →'}
          </button>

          {/* Default Credentials Cheat Sheet */}
          {!isRegistering && (
            <div className="mt-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 w-full">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                Acceso Rápido Demo:
              </span>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 font-mono text-center">
                <div className="bg-[#020617] rounded p-1 border border-slate-800/50">Usuario: <span className="text-slate-100 font-bold">admin</span></div>
                <div className="bg-[#020617] rounded p-1 border border-slate-800/50">Clave: <span className="text-slate-100 font-bold">password123</span></div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
