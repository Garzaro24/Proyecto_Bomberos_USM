import React, { useState, useEffect, useCallback } from 'react';
import { 
  Flame, 
  Edit3, 
  ShieldAlert, 
  TrendingUp as AnalyticsIcon, 
  History, 
  Settings as SettingsIcon, 
  HelpCircle, 
  Radio, 
  Bell, 
  User, 
  Search, 
  Wifi, 
  WifiOff, 
  AlertCircle,
  Clock,
  RefreshCw,
  Plus,
  LogOut
} from 'lucide-react';
import { ServiceRecord, HumanMilestone, UserProfile } from './types';
import DailyLog from './components/DailyLog';
import Analytics from './components/Analytics';
import RecordsAdmin from './components/RecordsAdmin';
import HistoryView from './components/HistoryView';
import SettingsPage from './components/SettingsPage';
import SupportPage from './components/SupportPage';
import AuthPortal from './components/AuthPortal';
import USMLogo from './components/USMLogo';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'daily_log' | 'records_admin' | 'reports' | 'history' | 'settings' | 'support'>('daily_log');
  
  // Core Session State
  const [sessionUser, setSessionUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('session_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (user: UserProfile) => {
    setSessionUser(user);
    localStorage.setItem('session_user', JSON.stringify(user));
    setGlobalNotification(`Sesión iniciada como: ${user.name} (${user.role})`);
    setTimeout(() => setGlobalNotification(null), 5000);
  };

  const handleLogout = () => {
    setSessionUser(null);
    localStorage.removeItem('session_user');
    setGlobalNotification("Sesión cerrada correctamente. Regrese pronto.");
    setTimeout(() => setGlobalNotification(null), 5000);
  };

  const handleUpdateProfile = (updatedUser: UserProfile) => {
    setSessionUser(updatedUser);
    localStorage.setItem('session_user', JSON.stringify(updatedUser));
    setGlobalNotification("Perfil de oficial actualizado correctamente.");
    setTimeout(() => setGlobalNotification(null), 4000);
  };

  // Connection state
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [globalNotification, setGlobalNotification] = useState<string | null>(null);

  // Core Data Lists
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [milestones, setMilestones] = useState<HumanMilestone[]>([]);
  
  // Track offline cached records count
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Load records and milestones either from API or localStorage fallback
  const loadData = useCallback(async (bypassCacheCheck = false) => {
    // 1. Get offline cache status first
    const offlineQueue = JSON.parse(localStorage.getItem('off_records_queue') || '[]');
    setPendingSyncCount(offlineQueue.length);

    if (isOnline) {
      try {
        const recordsRes = await fetch('/api/records');
        if (recordsRes.ok) {
          const loadedRecords: ServiceRecord[] = await recordsRes.json();
          // Merge client-local copies that are unsynced in-memory so user sees them
          const merged = [...offlineQueue, ...loadedRecords.filter(r => !offlineQueue.some((o: ServiceRecord) => o.id === r.id))];
          setRecords(merged);
          localStorage.setItem('local_records_backup', JSON.stringify(loadedRecords));
        }

        const milestonesRes = await fetch('/api/milestones');
        if (milestonesRes.ok) {
          const loadedMilestones = await milestonesRes.json();
          setMilestones(loadedMilestones);
          localStorage.setItem('local_milestones_backup', JSON.stringify(loadedMilestones));
        }
      } catch (err) {
        console.warn('API error, falling back to local cache data:', err);
        loadFromLocalCache();
      }
    } else {
      loadFromLocalCache();
    }
  }, [isOnline]);

  const loadFromLocalCache = () => {
    const backupRecords = JSON.parse(localStorage.getItem('local_records_backup') || '[]');
    const offlineQueue: ServiceRecord[] = JSON.parse(localStorage.getItem('off_records_queue') || '[]');
    // Uniquely merge
    const merged = [...offlineQueue, ...backupRecords.filter((r: ServiceRecord) => !offlineQueue.some(o => o.id === r.id))];
    setRecords(merged);

    const backupMilestones = JSON.parse(localStorage.getItem('local_milestones_backup') || '[]');
    setMilestones(backupMilestones);
    setPendingSyncCount(offlineQueue.length);
  };

  // Initialize data on boot
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Synchronize local offline submissions to server
  const triggerSynchronization = async () => {
    if (!isOnline) {
      alert("No se puede sincronizar mientras el simulador esté fuera de línea.");
      return;
    }

    const offlineQueue: ServiceRecord[] = JSON.parse(localStorage.getItem('off_records_queue') || '[]');
    if (offlineQueue.length === 0) {
      return;
    }

    setIsSyncing(true);
    try {
      const response = await fetch('/api/records/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offlineQueue)
      });

      if (response.ok) {
        // Clear queue
        localStorage.removeItem('off_records_queue');
        setPendingSyncCount(0);
        
        // Notify
        setGlobalNotification(`Exito: Sincronizados de forma segura ${offlineQueue.length} registros offline con el servidor central.`);
        setTimeout(() => setGlobalNotification(null), 6000);
        
        // Reload all
        await loadData();
      } else {
        alert("El servidor central rechazó la sincronización por lote. Intente de nuevo.");
      }
    } catch (e) {
      console.error(e);
      alert("Fallo de comunicación con la base de datos central al sincronizar.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Offline <--> Online simulation toggle
  const handleToggleConnection = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    
    if (nextState) {
      setGlobalNotification("Conectividad Restablecida. El sistema de base de datos detectó red estable y está listo para sincronizar.");
    } else {
      setGlobalNotification("Modo Fuera de Línea Activado. Todas las operaciones ahora se guardarán localmente.");
    }
    setTimeout(() => setGlobalNotification(null), 5000);
  };

  // Automatically sync when restoring connection
  useEffect(() => {
    if (isOnline && pendingSyncCount > 0) {
      triggerSynchronization();
    }
  }, [isOnline, pendingSyncCount]);

  // API Call handlers
  const handleSaveRecord = async (newRecordFields: Omit<ServiceRecord, 'id' | 'timestamp'>) => {
    const tempId = `srv-temp-${Date.now()}`;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const fullRecord: ServiceRecord = {
      ...newRecordFields,
      id: tempId,
      timestamp,
      synced: false
    };

    if (isOnline) {
      try {
        const response = await fetch('/api/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...fullRecord, synced: undefined }) // strip synced flag for server save
        });

        if (response.ok) {
          const savedRecord = await response.json();
          // Update in memory list
          setRecords(prev => [savedRecord, ...prev]);
          // Refresh background backups
          loadData();
          return;
        }
      } catch (err) {
        console.warn('Network save failed, saving to offline buffer:', err);
      }
    }

    // Offline / Fallback logic: Cache directly in localStorage queue
    const offlineQueue: ServiceRecord[] = JSON.parse(localStorage.getItem('off_records_queue') || '[]');
    offlineQueue.push(fullRecord);
    localStorage.setItem('off_records_queue', JSON.stringify(offlineQueue));
    setPendingSyncCount(offlineQueue.length);

    // Update state directly so the UI is active and immediate!
    setRecords(prev => [fullRecord, ...prev]);
  };

  const handleUpdateRecord = async (id: string, updatedFields: Partial<ServiceRecord>) => {
    // Optimistic offline update (helps when editing records offline)
    const isTempId = id.startsWith('srv-temp-');
    
    if (isTempId) {
      // Modify local buffer
      const offlineQueue: ServiceRecord[] = JSON.parse(localStorage.getItem('off_records_queue') || '[]');
      const index = offlineQueue.findIndex(r => r.id === id);
      if (index !== -1) {
        offlineQueue[index] = { ...offlineQueue[index], ...updatedFields };
        localStorage.setItem('off_records_queue', JSON.stringify(offlineQueue));
      }
      setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updatedFields } : r));
      return;
    }

    if (isOnline) {
      try {
        const response = await fetch(`/api/records/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFields)
        });
        if (response.ok) {
          await loadData();
          return;
        }
      } catch (err) {
        console.error('Failed to update record on server', err);
      }
    }

    // Fallback: save update details as synced false locally
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updatedFields, synced: false } : r));
    const offlineQueue: ServiceRecord[] = JSON.parse(localStorage.getItem('off_records_queue') || '[]');
    const existing = offlineQueue.find(r => r.id === id);
    if (!existing) {
      const record = records.find(r => r.id === id);
      if (record) {
        offlineQueue.push({ ...record, ...updatedFields, synced: false });
        localStorage.setItem('off_records_queue', JSON.stringify(offlineQueue));
        setPendingSyncCount(offlineQueue.length);
      }
    }
  };

  const handleDeleteRecord = async (id: string) => {
    const isTempId = id.startsWith('srv-temp-');

    if (isTempId) {
      // Remove from offline buffer
      let offlineQueue: ServiceRecord[] = JSON.parse(localStorage.getItem('off_records_queue') || '[]');
      offlineQueue = offlineQueue.filter(r => r.id !== id);
      localStorage.setItem('off_records_queue', JSON.stringify(offlineQueue));
      setPendingSyncCount(offlineQueue.length);
      setRecords(prev => prev.filter(r => r.id !== id));
      return;
    }

    if (isOnline) {
      try {
        const response = await fetch(`/api/records/${id}`, { method: 'DELETE' });
        if (response.ok) {
          await loadData();
          return;
        }
      } catch (err) {
        console.error('Failed to delete on server', err);
      }
    }

    // If offline, flag it of local removal
    setRecords(prev => prev.filter(r => r.id !== id));
    // Remove if it's already in queue
    let offlineQueue: ServiceRecord[] = JSON.parse(localStorage.getItem('off_records_queue') || '[]');
    offlineQueue = offlineQueue.filter(r => r.id !== id);
    localStorage.setItem('off_records_queue', JSON.stringify(offlineQueue));
    setPendingSyncCount(offlineQueue.length);
  };

  // Personnel Milestones Management
  const handleAddMilestone = async (newMilestoneFields: Omit<HumanMilestone, 'id'>) => {
    const tempId = `m-temp-${Date.now()}`;
    const fullMilestone: HumanMilestone = {
      ...newMilestoneFields,
      id: tempId
    };

    if (isOnline) {
      try {
        const response = await fetch('/api/milestones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullMilestone)
        });
        if (response.ok) {
          loadData();
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Save offline backup
    const backupMilestones = JSON.parse(localStorage.getItem('local_milestones_backup') || '[]');
    backupMilestones.unshift(fullMilestone);
    localStorage.setItem('local_milestones_backup', JSON.stringify(backupMilestones));
    setMilestones(prev => [fullMilestone, ...prev]);
  };

  const handleDeleteMilestone = async (id: string) => {
    if (isOnline) {
      try {
        const response = await fetch(`/api/milestones/${id}`, { method: 'DELETE' });
        if (response.ok) {
          loadData();
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }

    setMilestones(prev => prev.filter(m => m.id !== id));
    const backupMilestones = JSON.parse(localStorage.getItem('local_milestones_backup') || '[]');
    const filtered = backupMilestones.filter((m: HumanMilestone) => m.id !== id);
    localStorage.setItem('local_milestones_backup', JSON.stringify(filtered));
  };

  // Force database reset on server
  const handleForceReset = async () => {
    if (isOnline) {
      try {
        const res = await fetch('/api/reset', { method: 'POST' });
        if (res.ok) {
          localStorage.removeItem('off_records_queue');
          localStorage.removeItem('local_records_backup');
          localStorage.removeItem('local_milestones_backup');
          setPendingSyncCount(0);
          await loadData();
          setGlobalNotification("Sincronización exitosa: Base de datos central reseteada e inicializada con 248 registros oficiales.");
          setTimeout(() => setGlobalNotification(null), 5000);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      // Offline local reset
      localStorage.removeItem('off_records_queue');
      localStorage.removeItem('local_records_backup');
      localStorage.removeItem('local_milestones_backup');
      setPendingSyncCount(0);
      loadFromLocalCache();
      alert("Se limpió la base de datos offline local de su navegador.");
    }
  };

  // Dispatch alert simulator
  const handleDispatchAlert = () => {
    alert("📢 ALERTA TÁCTICA DESPACHO: Desplegando Unidad Rescue 3 - Incidente de rescate de emergencia en desarrollo.");
  };

  if (!sessionUser) {
    return <AuthPortal onLoginSuccess={handleLoginSuccess} isOnline={isOnline} />;
  }

  return (
    <div className="bg-[#020617] text-slate-100 font-sans min-h-screen flex text-[14px] leading-[20px] select-none">
      
      {/* 1. PERSISTENT GLOBAL DARK SIDEBAR (fixed 260px) */}
      <nav className="fixed left-0 top-0 h-full w-[260px] bg-[#020617] border-r border-slate-800/80 flex flex-col overflow-y-auto z-20">
        
        {/* Profile/Header area */}
        <div className="p-6 border-b border-slate-800/60 flex items-center gap-4">
          <USMLogo className="w-10 h-10 shadow-[0_0_12px_rgba(30,58,138,0.4)]" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)] animate-pulse"></span>
              <h1 className="text-xs font-extrabold text-slate-200 font-sans tracking-wide uppercase">Bomberos USM</h1>
            </div>
            <p className="text-[10px] font-semibold text-slate-400 font-sans mt-0.5 tracking-wider">U. Santa María, VE</p>
          </div>
        </div>

        {/* Global tab routing */}
        <ul className="flex-1 mt-4 space-y-1 block p-0 px-2 list-none">
          
          <li>
            <button 
              onClick={() => setCurrentTab('daily_log')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-bold tracking-wide uppercase cursor-pointer border ${
                currentTab === 'daily_log'
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent'
              }`}
            >
              <Edit3 className="w-4 h-4 shrink-0" />
              Bitácora Diaria
            </button>
          </li>

          <li>
            <button 
              onClick={() => setCurrentTab('records_admin')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-bold tracking-wide uppercase cursor-pointer border ${
                currentTab === 'records_admin'
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent'
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              Admin de Registros
            </button>
          </li>

          <li>
            <button 
              onClick={() => setCurrentTab('reports')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-bold tracking-wide uppercase cursor-pointer border ${
                currentTab === 'reports'
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent'
              }`}
            >
              <AnalyticsIcon className="w-4 h-4 shrink-0" />
              Analíticas / Reporte
            </button>
          </li>

          <li>
            <button 
              onClick={() => setCurrentTab('history')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-bold tracking-wide uppercase cursor-pointer border ${
                currentTab === 'history'
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent'
              }`}
            >
              <History className="w-4 h-4 shrink-0" />
              Prontuario Personal
            </button>
          </li>

        </ul>

        {/* Footer menu layout mapping back to screenshots */}
        <ul className="mt-auto border-t border-slate-800/60 py-4 px-2 space-y-1 block p-0 list-none font-sans">
          
          <li>
            <button 
              onClick={() => setCurrentTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-xs font-bold tracking-wide uppercase cursor-pointer border ${
                currentTab === 'settings'
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent'
              }`}
            >
              <SettingsIcon className="w-4 h-4 shrink-0" />
              Ajustes de Red
            </button>
          </li>



        </ul>

        {/* Active User Session Details card inside sidebar footer */}
        <div className="p-4 bg-slate-950/45 border-t border-slate-800/65">
          <div className="flex items-center gap-3">
            {sessionUser?.photoBase64 ? (
              <img 
                src={sessionUser.photoBase64} 
                alt={sessionUser.name} 
                className="w-9 h-9 rounded-xl object-cover shadow-md shrink-0 border border-slate-800" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-indigo-500 to-purple-600 flex items-center justify-center text-[11px] font-extrabold text-white shrink-0 shadow-md">
                {sessionUser?.name ? sessionUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'US'}
              </div>
            )}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-extrabold text-slate-200 truncate leading-tight block">
                {sessionUser?.name}
              </span>
              <span className="text-[10px] font-bold text-slate-400 mt-1 truncate uppercase tracking-wider block">
                {sessionUser?.role}
              </span>
              <span className="text-[9px] font-mono text-slate-500 block leading-none">
                {sessionUser?.personnelId}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full mt-3 bg-slate-950 hover:bg-red-950/30 hover:text-red-400 text-slate-400 font-bold text-[10px] tracking-wider uppercase py-2 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-slate-800/80 hover:border-red-900/50 cursor-pointer shadow-xs"
          >
            <LogOut className="w-3 h-3 text-red-500 shrink-0" />
            Cerrar Sesión
          </button>
        </div>

      </nav>

      {/* 2. CHOOSE CORRESPONDING MAIN CONTENT WIDTH OFFSET (ML-260px) */}
      <div className="flex-1 ml-[260px] flex flex-col min-h-screen bg-[#020617]">
        
        {/* 3. CORE PAGE CANVAS (Padding container from 16 h-offset) */}
        <main className="flex-1 p-8 bg-[#020617]">
          
          {/* Global Alert Notices (Synchronization prompts) */}
          {globalNotification && (
            <div className="mb-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 flex items-start gap-3 animate-fade-in shadow-xs">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-indigo-400" />
              <div className="text-xs">
                <p className="font-bold uppercase tracking-wider text-indigo-400">Aviso del Servidor</p>
                <p className="mt-1 leading-relaxed font-semibold">{globalNotification}</p>
              </div>
            </div>
          )}

          {/* Synchronized local buffer pending count prompt */}
          {pendingSyncCount > 0 && isOnline && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 flex items-center justify-between gap-4 animate-pulse shadow-xs">
              <div className="flex items-center gap-3 text-xs">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
                <div>
                  <p className="font-bold uppercase tracking-wider text-amber-400">Registros acumulados fuera de línea</p>
                  <p className="mt-0.5 font-semibold text-amber-300">Se guardaron de forma segura <span className="font-bold underline text-amber-400">{pendingSyncCount} incidentes</span> en la cola de su navegador. El servidor de red ya está recuperado.</p>
                </div>
              </div>
              <button
                onClick={triggerSynchronization}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] tracking-wider uppercase px-4 py-2 rounded-xl transition-all shrink-0 cursor-pointer shadow-[0_0_12px_rgba(217,119,6,0.25)] border-0"
              >
                Sincronizar Ya
              </button>
            </div>
          )}

          {/* Render target layout child components */}
          {currentTab === 'daily_log' && (
            <DailyLog 
              onSaveRecord={handleSaveRecord} 
              isOnline={isOnline} 
              sessionUser={sessionUser}
            />
          )}

          {currentTab === 'reports' && (
            <Analytics 
              records={records} 
            />
          )}

          {currentTab === 'records_admin' && (
            <RecordsAdmin 
              records={records} 
              onUpdateRecord={handleUpdateRecord} 
              onDeleteRecord={handleDeleteRecord} 
            />
          )}

          {currentTab === 'history' && (
            <HistoryView 
              milestones={milestones} 
              onAddMilestone={handleAddMilestone}
              onDeleteMilestone={handleDeleteMilestone}
              sessionUser={sessionUser}
              onUpdateProfile={handleUpdateProfile}
              records={records}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsPage 
              isOnline={isOnline}
              onToggleConnection={handleToggleConnection}
              pendingSyncCount={pendingSyncCount}
              onManualSync={triggerSynchronization}
              onForceReset={handleForceReset}
              dbTotalCount={records.length}
              isSyncing={isSyncing}
            />
          )}

          {currentTab === 'support' && (
            <SupportPage />
          )}

        </main>

      </div>

    </div>
  );
}
