import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Database, Trash2, ShieldAlert, Cloud, CloudLightning, CheckCircle2, AlertCircle } from 'lucide-react';

interface SettingsPageProps {
  onForceReset: () => Promise<void>;
  dbTotalCount: number;
  onDbModified: () => void;
}

export default function SettingsPage({
  onForceReset,
  dbTotalCount,
  onDbModified
}: SettingsPageProps) {
  const [dbPath, setDbPath] = useState<string>('Obteniendo ruta...');
  const [hasInternet, setHasInternet] = useState<boolean>(false);
  const [unsyncedCount, setUnsyncedCount] = useState<number>(0);
  const [syncDetails, setSyncDetails] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const checkConnectionAndStatus = async () => {
    try {
      const internet = await window.electronAPI.checkInternetConnection();
      setHasInternet(internet);

      const status = await window.electronAPI.getCloudStatus();
      if (!status.error) {
        setUnsyncedCount(status.unsyncedCount);
        setSyncDetails(status.details);
      }
    } catch (e) {
      console.error('Failed to get status:', e);
    }
  };

  useEffect(() => {
    // Get DB Path
    window.electronAPI.getDbPath().then(path => setDbPath(path || 'No disponible'));

    // Immediate check
    checkConnectionAndStatus();

    // Check periodically
    const interval = setInterval(checkConnectionAndStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleManualBackup = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const result = await window.electronAPI.cloudBackupNow();
      if (result.success) {
        setSyncResult({
          type: 'success',
          message: `Respaldo completado. Sincronizados: ${result.recordsSynced} registros, ${result.milestonesSynced} hitos.`
        });
        // Refresh status
        checkConnectionAndStatus();
        onDbModified();
      } else {
        setSyncResult({
          type: 'error',
          message: result.message || 'Error desconocido al respaldar.'
        });
      }
    } catch (err: any) {
      setSyncResult({
        type: 'error',
        message: err.message || 'Fallo de comunicación con el proceso de sincronización.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto font-sans">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-100 font-sans">Panel de Base de Datos y Respaldo en la Nube</h2>
        <p className="text-slate-400 mt-2 text-base">Consola operativa para administrar la base de datos SQLite local y gestionar la replicación de seguridad en la nube.</p>
      </div>

      {syncResult && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border ${
          syncResult.type === 'success' 
            ? 'bg-emerald-950/30 text-emerald-200 border-emerald-500/20' 
            : 'bg-rose-950/30 text-rose-200 border-rose-500/20'
        }`}>
          {syncResult.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-rose-400" />
          )}
          <div>
            <p className="font-bold uppercase tracking-wider text-xs">{syncResult.type === 'success' ? 'Éxito' : 'Fallo'}</p>
            <p className="text-sm mt-1 text-slate-350">{syncResult.message}</p>
          </div>
        </div>
      )}

      {/* Connection and Sync Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Local Database Stats Card */}
        <div className="bg-[#0f172a]/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3 mb-4">
              <Database className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Base de Datos Local (SQLite)</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/50">
                <span className="text-xs font-semibold text-slate-400">Registros Totales (Bitácora):</span>
                <span className="font-mono font-bold text-sm bg-indigo-950/50 text-indigo-300 px-3 py-1 rounded-full border border-indigo-900/30">
                  {dbTotalCount}
                </span>
              </div>

              <div className="text-xs text-slate-450 leading-relaxed space-y-1">
                <p className="font-bold uppercase tracking-wider text-[10px] text-slate-500">Ruta del archivo local:</p>
                <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 font-mono text-[10px] text-slate-300 break-all select-text">
                  {dbPath}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800/40">
            <button
              onClick={() => {
                if(confirm("¿Está seguro de que desea borrar toda la base de datos local y regenerar los 248 registros simulados de prueba?")) {
                  onForceReset().then(onDbModified);
                }
              }}
              className="w-full bg-rose-950/15 hover:bg-rose-950/45 border border-rose-900/40 text-rose-300 hover:text-rose-250 rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer outline-none"
            >
              <Trash2 className="w-4 h-4 text-rose-450" />
              Limpiar y Re-Sembrar Base de Datos
            </button>
          </div>
        </div>

        {/* Cloud Sync Backup Card */}
        <div className="bg-[#0f172a]/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3 mb-4">
              <Cloud className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Respaldo en la Nube (Firestore)</h3>
            </div>

            <div className="space-y-4">
              {/* Internet detection */}
              <div className="flex justify-between items-center bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/50">
                <span className="text-xs font-semibold text-slate-400">Estado de Conexión:</span>
                {hasInternet ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold bg-emerald-950/30 text-emerald-350 border border-emerald-900/40 uppercase">
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold bg-amber-950/30 text-amber-350 border border-amber-900/40 uppercase">
                    <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    Offline (Local)
                  </span>
                )}
              </div>

              {/* Sync queue count */}
              <div className="flex justify-between items-center bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/50">
                <span className="text-xs font-semibold text-slate-400">Pendientes por Respaldar:</span>
                <span className={`font-mono font-bold text-sm px-3 py-1 rounded-full border ${
                  unsyncedCount > 0 
                    ? 'bg-amber-950/30 text-amber-300 border-amber-900/40' 
                    : 'bg-emerald-950/30 text-emerald-300 border-emerald-900/40'
                }`}>
                  {unsyncedCount}
                </span>
              </div>

              {syncDetails && unsyncedCount > 0 && (
                <div className="bg-slate-950/20 p-2.5 rounded-xl border border-slate-800/40 text-[10px] font-semibold text-slate-500 uppercase tracking-wider space-y-1">
                  <span className="block text-slate-400 text-[9px]">Detalle pendientes:</span>
                  <div className="flex gap-4">
                    <span>Registros: {syncDetails.records || 0}</span>
                    <span>Hitos: {syncDetails.milestones || 0}</span>
                    <span>Usuarios: {syncDetails.users || 0}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800/40">
            <button
              onClick={handleManualBackup}
              disabled={unsyncedCount === 0 || !hasInternet || isSyncing}
              className="w-full bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-800/55 disabled:text-slate-500 border-0 text-white rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:pointer-events-none outline-none"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-white' : 'text-indigo-200'}`} />
              {isSyncing ? "Respaldando..." : "Subir Respaldo a la Nube"}
            </button>
          </div>
        </div>

      </div>

      {/* Informative Guidance Card */}
      <div className="p-4 bg-indigo-950/10 border border-indigo-900/30 rounded-2xl flex items-start gap-3 shadow-md">
        <ShieldAlert className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
        <div className="text-xs text-indigo-300 leading-relaxed">
          <p className="font-bold uppercase tracking-wider mb-1 text-[10px] text-indigo-200">Arquitectura de Sincronización Local-Primero</p>
          <p>
            El sistema opera localmente de forma independiente sin depender de internet. Los reportes se almacenan de inmediato en la base de datos SQLite. Cuando el equipo detecta conexión, se habilita el respaldo hacia la base de datos Firebase Firestore en la nube para resguardo y reportes consolidados.
          </p>
        </div>
      </div>
    </div>
  );
}
