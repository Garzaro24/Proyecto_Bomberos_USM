import React from 'react';
import { Wifi, WifiOff, RefreshCw, Database, Trash2, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface SettingsPageProps {
  isOnline: boolean;
  onToggleConnection: () => void;
  pendingSyncCount: number;
  onManualSync: () => Promise<void>;
  onForceReset: () => Promise<void>;
  dbTotalCount: number;
  isSyncing: boolean;
}

export default function SettingsPage({
  isOnline,
  onToggleConnection,
  pendingSyncCount,
  onManualSync,
  onForceReset,
  dbTotalCount,
  isSyncing
}: SettingsPageProps) {

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-sans">Panel de Configuración de Red y Sincronización</h2>
        <p className="text-gray-500 mt-2 text-base">Consola técnica para ensayar la persistencia local y emular operaciones fuera de línea (offline) en ubicaciones rurales o sin red.</p>
      </div>

      {/* Connection Simulator Console */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Simulador de Conexión en Campo</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Wifi className="w-4 h-4 text-emerald-600 animate-pulse" />
                  Conexión Estable (Online)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <WifiOff className="w-4 h-4 text-amber-600" />
                  Operación Fuera de Línea (Offline)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Use este interruptor para simular la pérdida de conectividad a internet en campo. Cuando está **Offline**, todos los registros de incidentes se almacenan de manera local y encriptada en la base de datos del navegador.
            </p>
          </div>
          <button
            onClick={onToggleConnection}
            className={`px-5 py-2.5 rounded font-bold text-xs uppercase tracking-wider transition-all shadow-sm shrink-0 cursor-pointer ${
              isOnline 
                ? 'bg-amber-600 text-white hover:bg-amber-700' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isOnline ? "Desconectar Simulador" : "Restablecer Conexión"}
          </button>
        </div>
      </div>

      {/* Synchronization Engine Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Sync panel */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">Motor de Red Undundante</h3>
            <div className="space-y-4 mt-3">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-150">
                <span className="text-xs font-semibold text-slate-600">Registros en Cola Local Pendientes:</span>
                <span className={`font-mono font-bold text-sm px-2.5 py-0.5 rounded-full ${
                  pendingSyncCount > 0 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-bounce' 
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {pendingSyncCount}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Los datos guardados fuera de línea se acumularán en la memoria relacional buffer. Tan pronto dectectemos una transición en línea de vuelta, el motor activará la sincronización por bloques.
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={onManualSync}
              disabled={pendingSyncCount === 0 || !isOnline || isSyncing}
              className="w-full bg-slate-900 border border-slate-900 text-white rounded py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? "Sincronizando..." : "Sincronizar Cola Local Ahora"}
            </button>
          </div>
        </div>

        {/* Relational DB stats */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">Base de Datos Centralizada (Servidor)</h3>
            <div className="space-y-4 mt-3">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-150">
                <span className="text-xs font-semibold text-slate-600">Registros Totales Consolidados:</span>
                <span className="font-mono font-bold text-sm bg-slate-200 text-slate-800 px-2.5 py-0.5 rounded-full">
                  {dbTotalCount}
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-[11px] text-gray-500">
                <Database className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                <p>Ubicación física: <span className="font-mono text-slate-700">database/records.json</span></p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() => {
                if(confirm("¿Está seguro que desea borrar toda la base de datos operativa y re-sembrar los 248 registros iniciales?")) {
                  onForceReset();
                }
              }}
              className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded py-2.5 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-700" />
              Restablecer BD & Re-Sembrar Mock
            </button>
          </div>
        </div>

      </div>

      {/* Guide Card Box */}
      <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-lg flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <p className="font-bold uppercase tracking-wider mb-1 text-[11px]">Nota del Sistema de Respaldo Redundante</p>
          <p>
            Esta demostración utiliza un motor backend en Express de almacenamiento JSON transaccional para simular una base de datos local relacional local de forma ultra segura. Su diseño es idéntico al comportamiento que tiene una base de datos MySQL local empotrada de escritorio.
          </p>
        </div>
      </div>
    </div>
  );
}
