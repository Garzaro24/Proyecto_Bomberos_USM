import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, X, CheckCircle, AlertTriangle, ArrowUpCircle } from 'lucide-react';

interface UpdaterState {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error' | 'up-to-date';
  version?: string;
  progress?: number;
  errorMsg?: string;
}

export default function UpdaterBanner() {
  const [updater, setUpdater] = useState<UpdaterState>({ status: 'idle' });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) return;

    window.electronAPI.onUpdateAvailable?.((info: { version: string }) => {
      setDismissed(false);
      setUpdater({ status: 'available', version: info.version });
    });

    window.electronAPI.onUpdateNotAvailable?.(() => {
      setUpdater({ status: 'up-to-date' });
      // Auto-hide after 3s
      setTimeout(() => setUpdater({ status: 'idle' }), 3000);
    });

    window.electronAPI.onDownloadProgress?.((progress: { percent: number }) => {
      setUpdater(prev => ({ ...prev, status: 'downloading', progress: progress.percent }));
    });

    window.electronAPI.onUpdateDownloaded?.((info: { version: string }) => {
      setUpdater({ status: 'downloaded', version: info.version });
    });

    window.electronAPI.onUpdaterError?.((err: { message: string }) => {
      console.error('[Updater] Error received in UI:', err.message);
      // Don't show UI error for network errors (common when offline)
      setUpdater({ status: 'idle' });
    });

    return () => {
      window.electronAPI.removeUpdaterListeners?.();
    };
  }, []);

  const handleDownload = async () => {
    setUpdater(prev => ({ ...prev, status: 'downloading', progress: 0 }));
    await window.electronAPI.updaterStartDownload?.();
  };

  const handleInstall = () => {
    window.electronAPI.updaterInstallNow?.();
  };

  // Nothing to show
  if (updater.status === 'idle' || dismissed) return null;

  return (
    <div
      className={`fixed bottom-5 right-5 z-[9999] max-w-sm w-full rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-500 animate-fade-in ${
        updater.status === 'downloaded'
          ? 'bg-emerald-950/90 border-emerald-500/30'
          : updater.status === 'error'
          ? 'bg-red-950/90 border-red-500/30'
          : updater.status === 'up-to-date'
          ? 'bg-slate-900/90 border-slate-700/50'
          : 'bg-slate-900/90 border-indigo-500/30'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className="mt-0.5 shrink-0">
          {updater.status === 'downloaded' && (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          )}
          {updater.status === 'up-to-date' && (
            <CheckCircle className="w-5 h-5 text-slate-400" />
          )}
          {(updater.status === 'available' || updater.status === 'downloading') && (
            <ArrowUpCircle className="w-5 h-5 text-indigo-400 animate-pulse" />
          )}
          {updater.status === 'error' && (
            <AlertTriangle className="w-5 h-5 text-red-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {updater.status === 'available' && (
            <>
              <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Actualización Disponible
              </p>
              <p className="text-sm font-semibold text-slate-200 mt-0.5">
                Versión <span className="font-mono text-indigo-300">v{updater.version}</span> lista
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Los registros y datos no se perderán.
              </p>
            </>
          )}

          {updater.status === 'downloading' && (
            <>
              <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Descargando Actualización...
              </p>
              <p className="text-sm font-semibold text-slate-200 mt-0.5">
                {updater.progress ?? 0}% completado
              </p>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${updater.progress ?? 0}%` }}
                />
              </div>
            </>
          )}

          {updater.status === 'downloaded' && (
            <>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                ¡Lista para instalar!
              </p>
              <p className="text-sm font-semibold text-slate-200 mt-0.5">
                v{updater.version} descargada correctamente
              </p>
              <p className="text-xs text-slate-400 mt-1">
                La app se reiniciará para aplicar la actualización.
              </p>
            </>
          )}

          {updater.status === 'up-to-date' && (
            <p className="text-sm font-semibold text-slate-300">
              ✓ La aplicación está al día.
            </p>
          )}
        </div>

        {/* Dismiss button (not shown while downloading) */}
        {updater.status !== 'downloading' && (
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Action buttons */}
      {(updater.status === 'available' || updater.status === 'downloaded') && (
        <div className="px-4 pb-4 flex gap-2">
          {updater.status === 'available' && (
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-3 rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar ahora
            </button>
          )}

          {updater.status === 'downloaded' && (
            <button
              onClick={handleInstall}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-3 rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reiniciar e instalar
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="px-3 py-2 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            Después
          </button>
        </div>
      )}
    </div>
  );
}
