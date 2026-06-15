import React, { useState, useMemo } from 'react';
import { Download, FileText, Flame, Timer, ShieldAlert, Award, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ServiceRecord } from '../types';

interface AnalyticsProps {
  records: ServiceRecord[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const breakdown = data.breakdown || {};
    const breakdownEntries = Object.entries(breakdown).sort((a: any, b: any) => b[1] - a[1]);

    return (
      <div className="bg-[#030712]/95 border border-slate-800/90 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-left min-w-[210px] font-sans">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 mb-2">{label}</p>
        <div className="flex justify-between items-center mb-2.5 pb-1.5 border-b border-slate-800/60">
          <span className="text-xs font-bold text-slate-300">Total:</span>
          <span className="text-sm font-black text-slate-100 font-mono">{payload[0].value}</span>
        </div>
        {breakdownEntries.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Tipos de Incidentes:</p>
            {breakdownEntries.slice(0, 5).map(([type, val]: any) => (
              <div key={type} className="flex justify-between items-center text-xs gap-4">
                <span className="text-slate-400 font-semibold truncate max-w-[140px]">{type}</span>
                <span className="font-mono text-indigo-300 font-extrabold text-[11px] bg-slate-900 border border-slate-800/40 px-1.5 py-0.5 rounded leading-none shrink-0">{val}</span>
              </div>
            ))}
            {breakdownEntries.length > 5 && (
              <p className="text-[9px] text-indigo-400/85 font-extrabold italic text-right mt-1.5 animate-pulse">
                + {breakdownEntries.length - 5} más (Haz clic para ver todos)
              </p>
            )}
          </div>
        ) : (
          <p className="text-[10px] text-slate-500 italic">Sin clasificación de tipo</p>
        )}
      </div>
    );
  }
  return null;
};

export default function Analytics({ records }: AnalyticsProps) {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [selectedPeriod, setSelectedPeriod] = useState<{ name: string; total: number; breakdown: Record<string, number> } | null>(null);
  const [showAllTypes, setShowAllTypes] = useState<boolean>(false);

  // Filter records based on selected timeframe so all KPIs, Pie Charts, and figures match perfectly
  const activeRecords = useMemo(() => {
    if (timeframe === 'daily') {
      const allowedDates = new Set<string>();
      for (let index = 0; index < 7; index++) {
        const d = new Date();
        d.setDate(d.getDate() - (6 - index));
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const dateNum = d.getDate().toString().padStart(2, '0');
        allowedDates.add(`${year}-${month}-${dateNum}`);
      }
      return records.filter(r => r.serviceDate && allowedDates.has(r.serviceDate));
    } else if (timeframe === 'weekly') {
      const today = new Date();
      const currentDay = today.getDay();
      const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
      const mondayOfCurrentWeek = new Date(today);
      mondayOfCurrentWeek.setDate(today.getDate() - daysSinceMonday);
      mondayOfCurrentWeek.setHours(0, 0, 0, 0);

      const start = new Date(mondayOfCurrentWeek);
      start.setDate(mondayOfCurrentWeek.getDate() - (3 * 7)); // Monday of 3 weeks ago
      start.setHours(0, 0, 0, 0);

      const end = new Date(mondayOfCurrentWeek);
      end.setDate(mondayOfCurrentWeek.getDate() + 6); // Sunday of current week
      end.setHours(23, 59, 59, 999);

      return records.filter(r => {
        if (!r.serviceDate) return false;
        const parts = r.serviceDate.split('-');
        if (parts.length < 3) return false;
        const rYear = parseInt(parts[0], 10);
        const rMonth = parseInt(parts[1], 10) - 1;
        const rDay = parseInt(parts[2], 10);
        const rDate = new Date(rYear, rMonth, rDay, 12, 0, 0, 0);
        return rDate >= start && rDate <= end;
      });
    } else if (timeframe === 'monthly') {
      const today = new Date();
      const yearMonthRanges = [];
      for (let i = 3; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        yearMonthRanges.push({ year: d.getFullYear(), month: d.getMonth() });
      }
      return records.filter(r => {
        if (!r.serviceDate) return false;
        const parts = r.serviceDate.split('-');
        if (parts.length < 2) return false;
        const rYear = parseInt(parts[0], 10);
        const rMonth = parseInt(parts[1], 10) - 1;
        return yearMonthRanges.some(rng => rng.year === rYear && rng.month === rMonth);
      });
    } else {
      // yearly
      const today = new Date();
      const currentYear = today.getFullYear();
      const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
      return records.filter(r => {
        if (!r.serviceDate) return false;
        const parts = r.serviceDate.split('-');
        if (parts.length < 1) return false;
        const rYear = parseInt(parts[0], 10);
        return years.includes(rYear);
      });
    }
  }, [timeframe, records]);

  // Compute previous period count to show accurate dynamic comparison
  const previousPeriodCount = useMemo(() => {
    if (timeframe === 'daily') {
      const previousAllowedDates = new Set<string>();
      for (let index = 0; index < 7; index++) {
        const d = new Date();
        d.setDate(d.getDate() - (13 - index));
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const dateNum = d.getDate().toString().padStart(2, '0');
        previousAllowedDates.add(`${year}-${month}-${dateNum}`);
      }
      return records.filter(r => r.serviceDate && previousAllowedDates.has(r.serviceDate)).length;
    } else if (timeframe === 'weekly') {
      const today = new Date();
      const currentDay = today.getDay();
      const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
      const mondayOfCurrentWeek = new Date(today);
      mondayOfCurrentWeek.setDate(today.getDate() - daysSinceMonday);
      mondayOfCurrentWeek.setHours(0, 0, 0, 0);

      const prevStart = new Date(mondayOfCurrentWeek);
      prevStart.setDate(mondayOfCurrentWeek.getDate() - (7 * 7));
      prevStart.setHours(0, 0, 0, 0);

      const prevEnd = new Date(mondayOfCurrentWeek);
      prevEnd.setDate(mondayOfCurrentWeek.getDate() - (3 * 7) - 1);
      prevEnd.setHours(23, 59, 59, 999);

      return records.filter(r => {
        if (!r.serviceDate) return false;
        const parts = r.serviceDate.split('-');
        if (parts.length < 3) return false;
        const rYear = parseInt(parts[0], 10);
        const rMonth = parseInt(parts[1], 10) - 1;
        const rDay = parseInt(parts[2], 10);
        const rDate = new Date(rYear, rMonth, rDay, 12, 0, 0, 0);
        return rDate >= prevStart && rDate <= prevEnd;
      }).length;
    } else if (timeframe === 'monthly') {
      const today = new Date();
      const prevYearMonthRanges = [];
      for (let i = 7; i >= 4; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        prevYearMonthRanges.push({ year: d.getFullYear(), month: d.getMonth() });
      }
      return records.filter(r => {
        if (!r.serviceDate) return false;
        const parts = r.serviceDate.split('-');
        if (parts.length < 2) return false;
        const rYear = parseInt(parts[0], 10);
        const rMonth = parseInt(parts[1], 10) - 1;
        return prevYearMonthRanges.some(rng => rng.year === rYear && rng.month === rMonth);
      }).length;
    } else {
      const today = new Date();
      const currentYear = today.getFullYear();
      const prevYears = [currentYear - 4, currentYear - 5, currentYear - 6, currentYear - 7];
      return records.filter(r => {
        if (!r.serviceDate) return false;
        const parts = r.serviceDate.split('-');
        if (parts.length < 1) return false;
        const rYear = parseInt(parts[0], 10);
        return prevYears.includes(rYear);
      }).length;
    }
  }, [timeframe, records]);

  // Compute stats based on active loaded records
  const statistics = useMemo(() => {
    const total = activeRecords.length;
    
    // Average response time simulation based on IDs or random seed matching 4:12
    const baseSeconds = 252; // 4 minutes 12 seconds
    let avgDispTime = "04:12";
    if (total > 0) {
      // Calculate a slightly varied average based on types to feel alive
      const sum = activeRecords.reduce((acc, r) => {
        const type = (r.serviceType || '').toLowerCase();
        if (type.includes('incendio')) return acc + 340; // Incendios y talas toman más tiempo
        if (type.includes('rescate') || type.includes('emergencia') || type.includes('atención')) return acc + 280;
        return acc + 210; // EMS / Asistencia rápida
      }, 0);
      const avgSeconds = Math.round(sum / total);
      const mins = Math.floor(avgSeconds / 60);
      const secs = avgSeconds % 60;
      avgDispTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Dynamic type calculation
    const typeDistribution: Record<string, number> = {};
    activeRecords.forEach(r => {
      const t = r.serviceType || 'Otro';
      typeDistribution[t] = (typeDistribution[t] || 0) + 1;
    });

    // Translate English database types to Spanish for nicer display
    const translations: Record<string, string> = {
      'Acto de presencia en persona sin signos vitales': 'Sin Signos Vitales',
      'Administración de medicamentos': 'Medicación',
      'Atención Pre-Hospitalaria': 'Pre-Hospitalaria',
      'Hecho Vial tipo Colisión': 'Colisión Vial',
      'Servicios De Ambulancia Traslado Extra Urbano': 'Traslado Extra Urbano'
    };

    const sortedTypes = Object.entries(typeDistribution)
      .map(([name, count]) => ({
        originalName: name,
        name: translations[name] || name,
        value: count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.value - a.value);

    // Primary service type
    const primaryType = sortedTypes[0]?.name || "Sin incidentes";
    const primaryPercentage = sortedTypes[0]?.percentage || 0;

    return {
      total,
      avgResponseTime: avgDispTime,
      primaryType,
      primaryPercentage,
      distribution: sortedTypes
    };
  }, [activeRecords]);

  // Compute actual dynamic percentage difference vs the previous period
  const comparisonText = useMemo(() => {
    const diff = statistics.total - previousPeriodCount;
    const label = timeframe === 'daily' ? 'vs 7d anteriores'
                : timeframe === 'weekly' ? 'vs 4s anteriores'
                : timeframe === 'monthly' ? 'vs 4m anteriores'
                : 'vs período anterior';

    if (previousPeriodCount === 0) {
      if (statistics.total === 0) {
        return { text: "Sin cambios", isPositive: true, raw: "0%" };
      }
      return { text: `▲ +100% ${label}`, isPositive: true, raw: "+100%" };
    }

    const percentage = Math.round((diff / previousPeriodCount) * 100);
    if (percentage > 0) {
      return { text: `▲ +${percentage}% ${label}`, isPositive: true, raw: `+${percentage}%` };
    } else if (percentage < 0) {
      return { text: `▼ ${percentage}% ${label}`, isPositive: false, raw: `${percentage}%` };
    } else {
      return { text: `0% ${label}`, isPositive: true, raw: "0%" };
    }
  }, [statistics.total, previousPeriodCount, timeframe]);

  // Color mapping matching UI screens
  const COLORS = ['#041632', '#1b2b48', '#57657a', '#b9c7df', '#ff5952'];

  // Prepare weekly chart data with breakdown of incident types
  const chartData = useMemo(() => {
    const translations: Record<string, string> = {
      'Acto de presencia en persona sin signos vitales': 'Sin Signos Vitales',
      'Administración de medicamentos': 'Medicación',
      'Atención Pre-Hospitalaria': 'Pre-Hospitalaria',
      'Hecho Vial tipo Colisión': 'Colisión Vial',
      'Servicios De Ambulancia Traslado Extra Urbano': 'Traslado Extra Urbano'
    };

    const getCleanType = (type: string) => {
      return translations[type] || type || 'Otro';
    };

    if (timeframe === 'daily') {
      const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const data = Array.from({ length: 7 }).map((_, index) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - index));
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const dateNum = d.getDate().toString().padStart(2, '0');
        const isoDateStr = `${year}-${month}-${dateNum}`;
        const dayName = daysOfWeek[d.getDay()];
        const label = `${dayName} ${dateNum}`;

        // Get actual records for this specific date
        const dayRecords = records.filter(r => r.serviceDate && r.serviceDate === isoDateStr);

        const breakdown: Record<string, number> = {};
        dayRecords.forEach(r => {
          const cleanType = getCleanType(r.serviceType);
          breakdown[cleanType] = (breakdown[cleanType] || 0) + 1;
        });

        return {
          name: label,
          'Volumen de Incidentes': dayRecords.length,
          breakdown
        };
      });

      return data;
    } else if (timeframe === 'weekly') {
      const today = new Date();
      const currentDay = today.getDay(); // 0 is Sun, 1 is Mon...
      const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
      const mondayOfCurrentWeek = new Date(today);
      mondayOfCurrentWeek.setDate(today.getDate() - daysSinceMonday);
      mondayOfCurrentWeek.setHours(0, 0, 0, 0);

      const data = [];
      const monthsList = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

      for (let i = 3; i >= 0; i--) {
        const start = new Date(mondayOfCurrentWeek);
        start.setDate(mondayOfCurrentWeek.getDate() - (i * 7));
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        const label = `${start.getDate()} ${monthsList[start.getMonth()]} - ${end.getDate()} ${monthsList[end.getMonth()]}${i === 0 ? ' (Actual)' : ''}`;

        // Filter actual records within this week range (inclusive)
        const weekRecords = records.filter(r => {
          if (!r.serviceDate) return false;
          const parts = r.serviceDate.split('-');
          if (parts.length < 3) return false;
          const rYear = parseInt(parts[0], 10);
          const rMonth = parseInt(parts[1], 10) - 1;
          const rDay = parseInt(parts[2], 10);
          const rDate = new Date(rYear, rMonth, rDay, 12, 0, 0, 0); // use noon to avoid timezone shift errors
          return rDate >= start && rDate <= end;
        });

        const breakdown: Record<string, number> = {};
        weekRecords.forEach(r => {
          const cleanType = getCleanType(r.serviceType);
          breakdown[cleanType] = (breakdown[cleanType] || 0) + 1;
        });

        data.push({
          name: label,
          'Volumen de Incidentes': weekRecords.length,
          breakdown
        });
      }

      return data;
    } else if (timeframe === 'monthly') {
      // Monthly 4 months trends
      const today = new Date();
      const monthsList = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const data = [];

      for (let i = 3; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const year = d.getFullYear();
        const monthNum = d.getMonth();
        const label = `${monthsList[monthNum]} ${year}`;

        // Filter actual records within this calendar month
        const monthRecords = records.filter(r => {
          if (!r.serviceDate) return false;
          const parts = r.serviceDate.split('-');
          if (parts.length < 2) return false;
          const rYear = parseInt(parts[0], 10);
          const rMonth = parseInt(parts[1], 10) - 1;
          return rYear === year && rMonth === monthNum;
        });

        const breakdown: Record<string, number> = {};
        monthRecords.forEach(r => {
          const cleanType = getCleanType(r.serviceType);
          breakdown[cleanType] = (breakdown[cleanType] || 0) + 1;
        });

        data.push({
          name: label,
          'Volumen de Incidentes': monthRecords.length,
          breakdown
        });
      }

      return data;
    } else {
      // Yearly 4 years trends (including the current year)
      const today = new Date();
      const currentYear = today.getFullYear();
      const data = [];

      for (let i = 3; i >= 0; i--) {
        const year = currentYear - i;
        const label = `${year}${i === 0 ? ' (Actual)' : ''}`;

        // Filter actual records within this calendar year
        const yearRecords = records.filter(r => {
          if (!r.serviceDate) return false;
          const parts = r.serviceDate.split('-');
          if (parts.length < 1) return false;
          const rYear = parseInt(parts[0], 10);
          return rYear === year;
        });

        const breakdown: Record<string, number> = {};
        yearRecords.forEach(r => {
          const cleanType = getCleanType(r.serviceType);
          breakdown[cleanType] = (breakdown[cleanType] || 0) + 1;
        });

        data.push({
          name: label,
          'Volumen de Incidentes': yearRecords.length,
          breakdown
        });
      }

      return data;
    }
  }, [timeframe, records]);

  // Handle manual mock PDF trigger
  const handleExportPDF = () => {
    alert("Generando Reporte Operativo del Departamento en formato PDF...\nEste archivo PDF consolidará el volumen de " + statistics.total + " incidentes históricos.");
  };

  return (
    <div className="animate-fade-in space-y-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-100">Analíticas de Servicio</h2>
          <p className="text-slate-400 mt-2 text-base">Resumen de las métricas de respuesta departamental y distribución de servicios.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/45 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-150 w-full md:w-auto justify-center"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            Exportar PDF
          </button>
          <select 
            defaultValue="30"
            className="px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500 transition-all outline-none cursor-pointer w-full md:w-auto h-[38px]"
          >
            <option value="30" className="bg-[#020617] text-slate-200">Últimos 30 días</option>
            <option value="90" className="bg-[#020617] text-slate-200">Este Trimestre</option>
            <option value="365" className="bg-[#020617] text-slate-200">Año Completo</option>
          </select>
        </div>
      </div>

      {/* Summary Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Card 1 */}
        <div className="bg-[#0f172a]/30 border border-slate-850/80 rounded-2xl p-5 flex flex-col justify-between shadow-lg backdrop-blur-md">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Incidentes Totales</span>
            <Flame className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="text-4xl font-extrabold text-slate-100 font-mono tracking-tight">
              {statistics.total.toLocaleString()}
            </div>
            <div className={`text-xs mt-1.5 flex items-center gap-1 font-bold ${comparisonText.isPositive ? 'text-emerald-400' : 'text-rose-450'}`}>
              <span>{comparisonText.text}</span>
            </div>
          </div>
        </div>

        {/* Highlight Card Map to Screenshot Accent Dark Navy background */}
        <div className="bg-gradient-to-br from-[#12182c] to-[#0a0d1a] border border-indigo-500/20 text-white rounded-2xl p-5 flex flex-col justify-between md:col-span-2 relative overflow-hidden shadow-lg backdrop-blur-md">
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Tipo de Servicio Principal</span>
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-100 tracking-tight">
                {statistics.primaryType}
              </div>
              <div className="text-xs text-slate-400 mt-2 font-medium">
                Representa el <span className="font-bold text-indigo-300 text-sm">{statistics.primaryPercentage}%</span> del volumen total de servicios en este periodo operativo.
              </div>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 opacity-5">
            <ShieldAlert className="w-36 h-36 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Trend Chart (Spans 2 cols) */}
        <div className="lg:col-span-2 bg-[#0f172a]/30 border border-slate-850/80 rounded-2xl p-5 flex flex-col shadow-lg backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Métricas de Volumen de Incidentes</h3>
              <p className="text-[10px] text-indigo-400/90 font-black mt-1">💡 Haz clic en los botones del período (abajo) para ver el desglose completo</p>
            </div>
            <div className="flex gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-850 self-start sm:self-center">
              <button 
                onClick={() => setTimeframe('daily')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer border-0 ${
                  timeframe === 'daily' 
                    ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-550/20' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Diario (7d)
              </button>
              <button 
                onClick={() => setTimeframe('weekly')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer border-0 ${
                  timeframe === 'weekly' 
                    ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-550/20' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Semanal
              </button>
              <button 
                onClick={() => setTimeframe('monthly')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer border-0 ${
                  timeframe === 'monthly' 
                    ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-550/20' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mensual
              </button>
              <button 
                onClick={() => setTimeframe('yearly')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer border-0 ${
                  timeframe === 'yearly' 
                    ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-550/20' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Anual
              </button>
            </div>
          </div>
 
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} 
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                />
                {/* Tooltip removed to ensure clean visual presentation */}
                <Bar 
                  dataKey="Volumen de Incidentes" 
                  fill="#4f46e5" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
 
          {/* Interactive buttons for period details */}
          <div className="mt-5 pt-4 border-t border-slate-800/40">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <span>📋</span> Ver Desglose por Período:
            </p>
            <div className={`grid gap-2 grid-cols-2 sm:grid-cols-4 ${timeframe === 'daily' ? 'md:grid-cols-7' : 'md:grid-cols-4'}`}>
              {chartData.map((data) => {
                const displayName = data.name;
                return (
                  <button
                    key={data.name}
                    onClick={() => setSelectedPeriod({
                      name: data.name,
                      total: data['Volumen de Incidentes'] || 0,
                      breakdown: data.breakdown || {}
                    })}
                    className="group px-2 py-2 bg-[#090d16]/70 hover:bg-indigo-600/10 border border-slate-800/90 hover:border-indigo-500/40 rounded-xl text-center transition-all duration-150 cursor-pointer flex flex-col justify-between items-center min-h-[50px] shadow-sm select-none"
                  >
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-400 transition-colors leading-none">{displayName}</span>
                    <span className="font-mono text-[10px] font-black text-indigo-400/90 bg-indigo-950/20 border border-indigo-900/30 px-1.5 py-0.5 rounded mt-1.5 shadow-sm leading-none">{data['Volumen de Incidentes'] || 0} inc.</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Distribution Pie Chart (Spans 1 col) */}
        <div className="bg-[#0f172a]/30 border border-slate-850/80 rounded-2xl p-5 flex flex-col justify-between shadow-lg backdrop-blur-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Distribución por Tipo</h3>
            {statistics.distribution.length > 5 && (
              <button
                onClick={() => setShowAllTypes(prev => !prev)}
                className="text-[10px] font-black tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors uppercase cursor-pointer"
              >
                {showAllTypes ? "Ver destacados" : "Ver todos"}
              </button>
            )}
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center">
            {/* Real responsive PieChart from recharts */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={showAllTypes ? statistics.distribution : statistics.distribution.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {(showAllTypes ? statistics.distribution : statistics.distribution.slice(0, 5)).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold font-mono text-slate-150">{statistics.total}</span>
                <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider">Totales</span>
              </div>
            </div>

            {/* Structured Legend mapping back to UI style screenshot */}
            <div 
              className={`w-full mt-6 space-y-2 pr-1 ${
                showAllTypes ? 'max-h-48 overflow-y-auto' : ''
              }`}
            >
              {statistics.distribution.length > 0 ? (
                (showAllTypes ? statistics.distribution : statistics.distribution.slice(0, 5)).map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2.5 text-slate-300 min-w-0 flex-1 mr-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="truncate font-semibold text-slate-300 animate-fade-in" title={item.name}>{item.name}</span>
                    </div>
                    <span className="font-mono font-extrabold text-slate-400 shrink-0">{item.percentage}%</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic text-center py-4">No se registraron incidentes en este período.</p>
              )}
            </div>

            {statistics.distribution.length > 5 && (
              <div className="w-full mt-4 flex justify-center">
                <button
                  onClick={() => setShowAllTypes(prev => !prev)}
                  className="px-4 py-1.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-all rounded-lg shadow-sm cursor-pointer"
                >
                  {showAllTypes ? "Ocultar menos conocidos" : `Mostrar todos (${statistics.distribution.length})`}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal for detailed period breakdown */}
      {selectedPeriod && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedPeriod(null)}
        >
          <div 
            className="bg-[#0b0f19] border border-slate-800/95 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-800/80 flex justify-between items-center bg-slate-900/40">
              <div>
                <h4 className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest">Detalle Operativo</h4>
                <h3 className="text-base font-black text-slate-100 mt-1">
                  Sucesos en {selectedPeriod.name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedPeriod(null)}
                className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800/60 transition-colors cursor-pointer border-0 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-4 max-h-[50vh] custom-scrollbar">
              <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3.5 flex justify-between items-center shadow-inner">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest text-[10px]">Incidentes Reportados</span>
                <span className="text-xl font-black text-indigo-400 font-mono bg-indigo-950/30 border border-indigo-900/40 px-3 py-0.5 rounded-lg shadow-sm">{selectedPeriod.total}</span>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest pl-1">Clasificación de Sucesos</p>
                <div className="divide-y divide-slate-850/40">
                  {Object.entries(selectedPeriod.breakdown).length > 0 ? (
                    (Object.entries(selectedPeriod.breakdown) as [string, number][])
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count]) => {
                        const percentage = selectedPeriod.total > 0 ? Math.round((count / selectedPeriod.total) * 100) : 0;
                        return (
                          <div key={type} className="py-3.5 flex justify-between items-center gap-4">
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-xs font-bold text-slate-200 truncate">{type}</span>
                              <span className="text-[10px] font-semibold text-slate-500 mt-1">
                                {percentage}% {timeframe === 'daily' ? 'del día' : timeframe === 'weekly' ? 'de la semana' : timeframe === 'monthly' ? 'del mes' : 'del año'}
                              </span>
                            </div>
                            <span className="font-mono text-xs font-black text-slate-200 bg-slate-900/80 border border-slate-800/80 px-2.5 py-1 rounded-lg shrink-0 shadow-sm">{count}</span>
                          </div>
                        );
                      })
                  ) : (
                    <p className="text-xs text-slate-500 italic py-4 text-center">No se encontraron incidentes para este período.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-850/60 bg-slate-950/40 flex justify-end">
              <button 
                onClick={() => setSelectedPeriod(null)}
                className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-150 cursor-pointer"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
