import React from 'react';
import { RadioStation, TelemetryStats } from '../types/radio';

interface DashboardViewProps {
  stats: TelemetryStats;
  stations: RadioStation[];
  currentStation?: RadioStation | null;
  onSelectStation: (station: RadioStation) => void;
  onNavigateToDiscover: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stations,
  onSelectStation,
  onNavigateToDiscover,
}) => {
  const recentStations = stations.slice(0, 3);

  // Genre breakdown metrics for visual progress bars
  const genreBreakdown = [
    { name: 'Rock / Classic Rock', percent: 38, color: '#8B5CF6' },
    { name: 'News & Talk / Noticias', percent: 26, color: '#06B6D4' },
    { name: '80s & Pop / Hits', percent: 20, color: '#4edea3' },
    { name: 'Electronic / Dance', percent: 16, color: '#F59E0B' },
  ];

  // 24-hour listening schedule activity (Visual histogram)
  const hourlyActivity = [
    { label: '06:00', height: 40, active: false },
    { label: '08:00', height: 85, active: true },
    { label: '10:00', height: 95, active: true },
    { label: '12:00', height: 70, active: false },
    { label: '14:00', height: 60, active: false },
    { label: '16:00', height: 75, active: false },
    { label: '18:00', height: 90, active: true },
    { label: '20:00', height: 100, active: true },
    { label: '22:00', height: 65, active: false },
    { label: '00:00', height: 30, active: false },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="font-black text-3xl md:text-5xl text-white uppercase tracking-tighter font-['Inter']">
          HISTORIAL & ACTIVIDAD
        </h1>
        <p className="font-mono-tech text-xs md:text-sm text-[#bbcabf] mt-1">
          Registro de sintonización y patrones de escucha de Myradio 1.0 Pro.
        </p>
      </div>

      {/* Grid for Visual Hourly Activity & Genre Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Graphic 1: Curva de Actividad Diaria (Spans 7 cols) */}
        <div className="p-5 flex flex-col justify-between bg-[#141414] border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:col-span-7">
          <div className="flex justify-between items-center mb-4">
            <span className="font-mono-tech text-xs text-white font-bold uppercase flex items-center gap-2">
              <span className="material-symbols-outlined text-[#06B6D4] text-base">bar_chart</span>
              Horas Punta de Escucha (Ritmo Diario)
            </span>
            <span className="font-mono-tech text-[10px] text-[#06B6D4] bg-[#0E0E0E] border border-black px-2 py-0.5 font-bold uppercase">
              Pico: 20:00h
            </span>
          </div>

          {/* Graphic Bar Histogram */}
          <div className="bg-[#0e0e0e] border-2 border-black p-4 flex items-end justify-between gap-2 h-44">
            {hourlyActivity.map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div
                  className={`w-full transition-all duration-300 border border-black ${
                    bar.active ? 'bg-[#06B6D4]' : 'bg-[#252525]'
                  } hover:bg-[#22d3ee] cursor-pointer`}
                  style={{ height: `${bar.height}%` }}
                  title={`${bar.label}: ${bar.height}% de actividad`}
                />
                <span className="font-mono-tech text-[9px] text-[#bbcabf] truncate">
                  {bar.label}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-3 pt-2 border-t border-black/80 font-mono-tech text-[10px] text-[#bbcabf]">
            <span>Mayor sintonización en trayectos (08:00h y 20:00h)</span>
            <span className="text-[#06B6D4] font-bold">● Horas activas</span>
          </div>
        </div>

        {/* Graphic 2: Desglose de Géneros Más Escuchados (Spans 5 cols) */}
        <div className="p-5 flex flex-col justify-between bg-[#141414] border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:col-span-5">
          <div className="flex justify-between items-center mb-3">
            <span className="font-mono-tech text-xs text-white font-bold uppercase flex items-center gap-2">
              <span className="material-symbols-outlined text-[#8B5CF6] text-base">pie_chart</span>
              Distribución por Géneros
            </span>
            <span className="font-mono-tech text-[10px] text-[#8B5CF6] font-bold">TOP 4</span>
          </div>

          <div className="flex flex-col gap-3 my-auto">
            {genreBreakdown.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-mono-tech">
                  <span className="text-white font-bold">{item.name}</span>
                  <span className="text-[#bbcabf]">{item.percent}%</span>
                </div>
                <div className="w-full bg-[#0E0E0E] border border-black h-3 overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${item.percent}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="font-mono-tech text-[10px] text-[#bbcabf] border-t border-black/80 pt-2 mt-2 flex justify-between">
            <span>Preferencia principal: Clásicos & Noticias</span>
            <span className="text-[#8B5CF6] font-bold">100% de streams</span>
          </div>
        </div>

        {/* Recent Tuned Stations */}
        <div className="md:col-span-12">
          <h3 className="font-mono-tech text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4edea3] text-sm">history</span>
            ÚLTIMAS EMISORAS SINTONIZADAS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentStations.map((st) => (
              <div
                key={st.id}
                className="p-4 flex flex-col justify-between min-h-[140px] bg-[#1A1A1A] border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 border-2 border-black flex items-center justify-center shrink-0 font-bold text-white font-mono-tech shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    style={{ backgroundColor: st.color || '#201f1f' }}
                  >
                    {st.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono-tech text-sm font-bold text-white truncate">
                      {st.name}
                    </div>
                    <div className="text-xs text-[#bbcabf] truncate font-['Inter']">
                      {st.country} • {st.genre}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectStation(st)}
                  className="neo-button w-full py-2 bg-[#4edea3] text-[#003824] font-mono-tech text-xs font-black uppercase hover:bg-[#38c98e] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mt-3 cursor-pointer"
                >
                  SINTONIZAR
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Global Explore Banner */}
        <div className="md:col-span-12 p-6 flex flex-col md:flex-row items-center justify-between gap-5 bg-[#1A1A1A] border-3 border-[#F59E0B] shadow-[6px_6px_0px_0px_rgba(245,158,11,0.8)]">
          <div className="flex flex-col gap-1 text-left w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] animate-pulse" />
              <span className="font-mono-tech text-xs font-black uppercase tracking-wider text-[#F59E0B]">
                Directorio Abierto Radio Browser
              </span>
            </div>
            
            <h2 className="font-black text-2xl sm:text-3xl text-white uppercase tracking-tight font-['Inter'] mt-1">
              EXPLORAR NUEVAS FRECUENCIAS DE EMISIÓN
            </h2>
            
            <p className="font-mono-tech text-xs sm:text-sm text-[#bbcabf] mt-0.5">
              Más de 30.000 estaciones públicas mundiales disponibles en streaming de baja latencia.
            </p>
          </div>

          <button
            onClick={onNavigateToDiscover}
            className="neo-button bg-[#F59E0B] hover:bg-[#f97316] text-black font-mono-tech text-xs sm:text-sm font-black px-6 py-3.5 border-3 border-black uppercase flex items-center justify-center gap-2 shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer w-full md:w-auto"
          >
            <span className="material-symbols-outlined text-lg font-black">search</span>
            <span>INICIAR BÚSQUEDA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
