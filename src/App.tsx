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
import UpdaterBanner from './components/UpdaterBanner';

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
    setGlobalNotification("Sesión cerrada correctamente.");
    setTimeout(() => setGlobalNotification(null), 5000);
  };

  const handleUpdateProfile = (updatedUser: UserProfile) => {
    setSessionUser(updatedUser);
    localStorage.setItem('session_user', JSON.stringify(updatedUser));
    setGlobalNotification("Perfil de oficial actualizado correctamente.");
    setTimeout(() => setGlobalNotification(null), 4000);
  };

  // Notification state
  const [globalNotification, setGlobalNotification] = useState<string | null>(null);

  // Core Data Lists
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [milestones, setMilestones] = useState<HumanMilestone[]>([]);

  // Load records and milestones from SQLite database via Electron IPC
  const loadData = useCallback(async () => {
    try {
      const loadedRecords = await window.electronAPI.getRecords();
      setRecords(loadedRecords || []);
      
      const loadedMilestones = await window.electronAPI.getMilestones();
      setMilestones(loadedMilestones || []);
    } catch (err) {
      console.error('Failed to load SQLite data:', err);
    }
  }, []);

  // Initialize data on boot
  useEffect(() => {
    loadData();
  }, [loadData]);

  // IPC Call handlers
  const handleSaveRecord = async (newRecordFields: Omit<ServiceRecord, 'id' | 'timestamp'>) => {
    try {
      const savedRecord = await window.electronAPI.addRecord(newRecordFields);
      if (savedRecord.error) {
        alert(savedRecord.error);
        return;
      }
      setRecords(prev => [savedRecord, ...prev]);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Error al guardar el registro en la base de datos local.');
    }
  };

  const handleUpdateRecord = async (id: string, updatedFields: Partial<ServiceRecord>) => {
    try {
      const result = await window.electronAPI.updateRecord(id, updatedFields);
      if (result.error) {
        alert(result.error);
        return;
      }
      await loadData();
    } catch (err) {
      console.error('Failed to update record:', err);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      const result = await window.electronAPI.deleteRecord(id);
      if (result.error) {
        alert(result.error);
        return;
      }
      await loadData();
    } catch (err) {
      console.error('Failed to delete record:', err);
    }
  };

  // Personnel Milestones Management
  const handleAddMilestone = async (newMilestoneFields: Omit<HumanMilestone, 'id'>) => {
    try {
      const savedMilestone = await window.electronAPI.addMilestone(newMilestoneFields);
      if (savedMilestone.error) {
        alert(savedMilestone.error);
        return;
      }
      await loadData();
    } catch (err) {
      console.error('Failed to add milestone:', err);
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    try {
      const result = await window.electronAPI.deleteMilestone(id);
      if (result.error) {
        alert(result.error);
        return;
      }
      await loadData();
    } catch (err) {
      console.error('Failed to delete milestone:', err);
    }
  };

  // Force database reset in SQLite
  const handleForceReset = async (shouldSeed: boolean = true) => {
    try {
      const result = await window.electronAPI.resetDatabase(shouldSeed);
      if (result.error) {
        alert(result.error);
        return;
      }
      await loadData();
      if (shouldSeed) {
        setGlobalNotification("Sincronización exitosa: Base de datos local re-inicializada con 248 registros oficiales.");
      } else {
        setGlobalNotification("Sincronización exitosa: Base de datos local limpiada por completo (0 registros).");
      }
      setTimeout(() => setGlobalNotification(null), 5000);
    } catch (e) {
      console.error(e);
      alert('Error al resetear la base de datos.');
    }
  };

  if (!sessionUser) {
    return <AuthPortal onLoginSuccess={handleLoginSuccess} />;
  }

  // Only the 'admin' account has access to Admin de Registros
  const isAdmin = sessionUser?.username === 'admin';

  // Safety redirect: if a non-admin somehow lands on the admin tab, go to daily_log
  if (!isAdmin && currentTab === 'records_admin') {
    setCurrentTab('daily_log');
  }

  return (
    <div className="bg-[#020617] text-slate-100 font-sans min-h-screen flex text-[14px] leading-[20px] select-none">
      
      {/* Auto-updater floating banner */}
      <UpdaterBanner />

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

          {/* Admin de Registros: solo visible para la cuenta 'admin' */}
          {isAdmin && (
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
          )}

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

        {/* Footer menu */}
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
              Ajustes de BD / Nube
            </button>
          </li>

        </ul>

        {/* Active User Session Details */}
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

      {/* 2. MAIN CONTENT AREA ml-[260px] */}
      <div className="flex-1 ml-[260px] flex flex-col min-h-screen bg-[#020617]">
        
        {/* 3. CORE PAGE CANVAS */}
        <main className="flex-1 p-8 bg-[#020617]">
          
          {/* Global Alert Notices */}
          {globalNotification && (
            <div className="mb-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 flex items-start gap-3 animate-fade-in shadow-xs">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-indigo-400" />
              <div className="text-xs">
                <p className="font-bold uppercase tracking-wider text-indigo-400">Notificación del Sistema</p>
                <p className="mt-1 leading-relaxed font-semibold">{globalNotification}</p>
              </div>
            </div>
          )}

          {/* Render target layout child components */}
          {currentTab === 'daily_log' && (
            <DailyLog 
              onSaveRecord={handleSaveRecord} 
              sessionUser={sessionUser}
            />
          )}

          {currentTab === 'reports' && (
            <Analytics 
              records={records} 
            />
          )}

          {currentTab === 'records_admin' && (
            isAdmin ? (
              <RecordsAdmin 
                records={records} 
                onUpdateRecord={handleUpdateRecord} 
                onDeleteRecord={handleDeleteRecord} 
              />
            ) : (
              // Fallback blocked view for unauthorized access attempts
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-rose-950/30 border border-rose-800/40 flex items-center justify-center shadow-xl">
                  <ShieldAlert className="w-10 h-10 text-rose-500" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">Acceso Restringido</h2>
                  <p className="text-slate-400 text-sm mt-2 max-w-sm">
                    Esta sección es exclusiva para el administrador del sistema. Inicia sesión con la cuenta <span className="font-bold text-indigo-400 font-mono">admin</span> para acceder.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentTab('daily_log')}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer border-0"
                >
                  Volver a Bitácora
                </button>
              </div>
            )
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
              onForceReset={handleForceReset}
              dbTotalCount={records.length}
              onDbModified={loadData}
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
