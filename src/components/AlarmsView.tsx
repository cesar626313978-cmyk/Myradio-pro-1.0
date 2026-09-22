import React, { useState } from 'react';
import { Alarm, RadioStation, SleepTimerState } from '../types/radio';

interface AlarmsViewProps {
  alarms: Alarm[];
  stations: RadioStation[];
  onToggleAlarm: (id: string) => void;
  onDeleteAlarm: (id: string) => void;
  onSaveAlarm: (alarm: Alarm) => void;
  sleepTimer: SleepTimerState;
  onStartSleepTimer: (minutes: number) => void;
  onStopSleepTimer: () => void;
  onSelectStation: (station: RadioStation) => void;
}

export const AlarmsView: React.FC<AlarmsViewProps> = ({
  alarms,
  stations,
  onToggleAlarm,
  onDeleteAlarm,
  onSaveAlarm,
  sleepTimer,
  onStartSleepTimer,
  onStopSleepTimer,
  onSelectStation,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<number>(45);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);

  // Form state
  const [formTime, setFormTime] = useState('07:30');
  const [formDays, setFormDays] = useState<string[]>(['Lun', 'Mar', 'Mié', 'Jue', 'Vie']);
  const [formStationId, setFormStationId] = useState(stations[0]?.id || 'cadena-ser');
  const [formLabel, setFormLabel] = useState('Despertador Radio');
  const [formVolume, setFormVolume] = useState(80);

  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const openNewAlarmModal = () => {
    setEditingAlarm(null);
    setFormTime('07:30');
    setFormDays(['Lun', 'Mar', 'Mié', 'Jue', 'Vie']);
    setFormStationId(stations[0]?.id || '');
    setFormLabel('Alarma Matinal');
    setFormVolume(80);
    setIsModalOpen(true);
  };

  const openEditAlarmModal = (alarm: Alarm) => {
    setEditingAlarm(alarm);
    setFormTime(alarm.time);
    setFormDays(alarm.days);
    setFormStationId(alarm.stationId);
    setFormLabel(alarm.label || 'Alarma');
    setFormVolume(alarm.volume);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const station = stations.find(s => s.id === formStationId);
    const updatedAlarm: Alarm = {
      id: editingAlarm ? editingAlarm.id : `alarm-${Date.now()}`,
      time: formTime,
      days: formDays,
      stationId: formStationId,
      stationName: station ? station.name : 'Emisora',
      active: true,
      label: formLabel,
      volume: formVolume,
    };
    onSaveAlarm(updatedAlarm);
    setIsModalOpen(false);
  };

  const toggleDaySelection = (day: string) => {
    if (formDays.includes(day)) {
      if (formDays.length > 1) {
        setFormDays(formDays.filter(d => d !== day));
      }
    } else {
      setFormDays([...formDays, day]);
    }
  };

  // Dial progress calculations
  const totalSeconds = sleepTimer.active ? sleepTimer.durationMinutes * 60 : selectedDuration * 60;
  const currentRemaining = sleepTimer.active ? sleepTimer.remainingSeconds : totalSeconds;
  const progressRatio = totalSeconds > 0 ? (totalSeconds - currentRemaining) / totalSeconds : 0;
  const circumference = 2 * Math.PI * 45; // 282.74
  const strokeDashoffset = circumference * (1 - progressRatio);

  const displayMinutes = sleepTimer.active
    ? Math.floor(sleepTimer.remainingSeconds / 60)
    : selectedDuration;
  const displaySeconds = sleepTimer.active
    ? String(sleepTimer.remainingSeconds % 60).padStart(2, '0')
    : '00';

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Title & Description */}
      <div>
        <h1 className="font-black text-2xl md:text-4xl text-white uppercase tracking-tighter mb-2">
          Alarmas y Despertador
        </h1>
        <p className="text-sm md:text-base text-[#bbcabf] max-w-2xl font-['Inter']">
          Despierta con tu emisora favorita o programa el apagado automático de la radio. Sistema de control de tiempo integrado.
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Left Column: Scheduled Alarms */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex justify-between items-center bg-[#201f1f] border-3 border-black p-4 neo-shadow">
            <h2 className="font-mono-tech text-xs font-bold text-white uppercase tracking-widest">
              ALARMAS PROGRAMADAS
            </h2>
            <button
              onClick={openNewAlarmModal}
              className="neo-button bg-[#4edea3] text-[#003824] font-mono-tech text-xs font-extrabold px-4 py-2 border-3 border-black flex items-center gap-2 uppercase"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Nueva Alarma
            </button>
          </div>

          {/* Alarm Cards */}
          {alarms.map(alarm => {
            const isWeekdays =
              alarm.days.length === 5 &&
              alarm.days.includes('Lun') &&
              alarm.days.includes('Vie');
            const isWeekend =
              alarm.days.length === 2 &&
              alarm.days.includes('Sáb') &&
              alarm.days.includes('Dom');
            const daysLabel = isWeekdays
              ? 'LUN - VIE'
              : isWeekend
              ? 'SÁB - DOM'
              : alarm.days.join(', ');

            return (
              <article
                key={alarm.id}
                className={`border-3 border-black p-4 neo-shadow relative transition-all ${
                  alarm.active ? 'bg-[#1A1A1A]' : 'bg-[#1A1A1A] opacity-75 grayscale hover:grayscale-0'
                }`}
              >
                {/* Status Badge */}
                <div
                  className={`absolute top-0 left-0 text-white font-mono-tech text-[9px] font-bold px-2 py-0.5 border-r-3 border-b-3 border-black flex items-center gap-1.5 ${
                    alarm.active ? 'bg-[#8B5CF6]' : 'bg-[#353534] text-[#bbcabf]'
                  }`}
                >
                  {alarm.active && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                  )}
                  {alarm.active ? 'ACTIVA' : 'INACTIVA'}
                </div>

                <div className="mt-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <div className="font-black text-4xl md:text-5xl tracking-tighter text-white font-['Inter']">
                      {alarm.time}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span
                        className={`font-mono-tech text-[10px] font-bold border-2 border-black px-2 py-0.5 uppercase ${
                          alarm.active
                            ? 'bg-[#201f1f] text-[#8B5CF6]'
                            : 'bg-[#201f1f] text-[#bbcabf]'
                        }`}
                      >
                        {daysLabel}
                      </span>
                      <button
                        onClick={() => {
                          const st = stations.find(s => s.id === alarm.stationId);
                          if (st) onSelectStation(st);
                        }}
                        className="font-mono-tech text-xs text-[#e5e2e1] flex items-center gap-1.5 bg-[#201f1f] border-2 border-black px-2.5 py-1 hover:bg-[#353534] transition-colors"
                        title="Sintonizar emisora"
                      >
                        <span className="material-symbols-outlined text-sm text-[#4edea3]">
                          radio
                        </span>
                        <span className="truncate max-w-[180px]">{alarm.stationName}</span>
                        <span className="material-symbols-outlined text-xs">expand_more</span>
                      </button>
                    </div>
                  </div>

                  {/* Actions & Neo-Brutalist Toggle */}
                  <div className="flex items-center gap-3 self-end sm:self-auto border-t-3 sm:border-t-0 sm:border-l-3 border-black pt-3 sm:pt-0 sm:pl-4 mt-2 sm:mt-0 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => openEditAlarmModal(alarm)}
                      aria-label="Editar alarma"
                      className="p-2 border-2 border-transparent hover:border-black hover:bg-[#353534] transition-colors text-[#e5e2e1]"
                      title="Editar"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      onClick={() => onDeleteAlarm(alarm.id)}
                      aria-label="Eliminar alarma"
                      className="p-2 border-2 border-transparent hover:border-[#EF4444] hover:text-[#EF4444] hover:bg-[#353534] transition-colors"
                      title="Eliminar"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>

                    {/* Toggle */}
                    <label className="neo-toggle ml-1">
                      <input
                        type="checkbox"
                        checked={alarm.active}
                        onChange={() => onToggleAlarm(alarm.id)}
                      />
                      <span className="neo-toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </article>
            );
          })}

          {/* Sintonizar desde mis Favoritas action */}
          <article
            onClick={openNewAlarmModal}
            className="bg-[#201f1f] border-3 border-black border-dashed p-6 flex flex-col items-center justify-center text-center hover:bg-[#353534] transition-colors cursor-pointer min-h-[120px]"
          >
            <span
              className="material-symbols-outlined text-3xl text-[#4edea3] mb-1.5"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              favorite
            </span>
            <span className="font-mono-tech text-sm font-bold text-white uppercase tracking-wider">
              SINTONIZAR DESDE MIS FAVORITAS
            </span>
            <p className="font-mono-tech text-[10px] text-[#bbcabf] mt-1">
              Programa un despertador automático con tus emisoras preferidas
            </p>
          </article>
        </section>

        {/* Right Column: Sleep Timer (Temporizador de Apagado) */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-[#201f1f] border-3 border-black p-5 md:p-6 neo-shadow flex flex-col relative">
            <div className="absolute top-0 right-0 bg-white text-black font-mono-tech text-[9px] font-bold px-2.5 py-1 border-l-3 border-b-3 border-black uppercase">
              MODO SUEÑO
            </div>

            <h2 className="font-mono-tech text-xs font-bold text-white uppercase tracking-widest mb-6">
              Temporizador de Apagado
            </h2>

            {/* Circular Dial */}
            <div className="flex flex-col items-center justify-center my-4">
              <div className="relative w-44 h-44 md:w-52 md:h-52 flex items-center justify-center bg-[#0F0F0F] rounded-full border-3 border-black neo-shadow">
                {/* SVG Progress Circle */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#334155"
                    strokeWidth="6"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#8B5CF6"
                    strokeLinecap="square"
                    strokeWidth="6"
                    style={{
                      strokeDasharray: circumference,
                      strokeDashoffset: strokeDashoffset,
                      transition: 'stroke-dashoffset 0.5s ease',
                    }}
                  />
                </svg>

                <div className="text-center z-10">
                  <div className="font-black text-4xl md:text-5xl text-white leading-none tracking-tighter font-['Inter']">
                    {displayMinutes}
                    <span className="text-xl md:text-2xl text-[#8B5CF6]">
                      {sleepTimer.active ? `:${displaySeconds}` : 'm'}
                    </span>
                  </div>
                  <div className="font-mono-tech text-[9px] text-[#bbcabf] uppercase tracking-widest mt-1.5">
                    {sleepTimer.active ? 'RESTANTE' : 'DURACIÓN'}
                  </div>
                </div>
              </div>
            </div>

            {/* Preset Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[15, 30, 45].map(mins => {
                const isSelected = selectedDuration === mins;
                return (
                  <button
                    key={mins}
                    onClick={() => {
                      setSelectedDuration(mins);
                      if (sleepTimer.active) onStartSleepTimer(mins);
                    }}
                    className={`border-3 border-black py-3 font-mono-tech text-sm font-bold transition-all ${
                      isSelected
                        ? 'bg-[#8B5CF6] text-white neo-shadow-sm'
                        : 'bg-[#1A1A1A] text-[#e5e2e1] hover:bg-[#353534]'
                    }`}
                  >
                    {mins}
                    <span className="text-xs">m</span>
                  </button>
                );
              })}
            </div>

            {/* Action Button: Iniciar o Detener */}
            {sleepTimer.active ? (
              <button
                onClick={onStopSleepTimer}
                className="w-full neo-button bg-[#EF4444] text-white font-mono-tech text-sm font-extrabold py-3.5 border-3 border-black uppercase flex items-center justify-center gap-2 hover:bg-[#dc2626]"
              >
                <span className="material-symbols-outlined text-base">stop</span>
                Detener Temporizador
              </button>
            ) : (
              <button
                onClick={() => onStartSleepTimer(selectedDuration)}
                className="w-full neo-button bg-white text-black font-mono-tech text-sm font-extrabold py-3.5 border-3 border-black uppercase flex items-center justify-center gap-2 hover:bg-[#e5e2e1]"
              >
                <span
                  className="material-symbols-outlined text-black"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  play_arrow
                </span>
                Iniciar Temporizador
              </button>
            )}

            {/* Technical Note */}
            <div className="mt-5 p-3.5 bg-[#0F0F0F] border-2 border-black flex gap-3 items-start">
              <span className="material-symbols-outlined text-[#F59E0B] text-lg shrink-0">
                info
              </span>
              <p className="font-mono-tech text-[10px] text-[#bbcabf] leading-relaxed">
                <strong className="text-white">FADE_OUT: HABILITADO.</strong> El sistema aplicará un
                apagado progresivo (fade out) de -3dB/min durante los últimos 5 minutos para evitar
                artefactos sonoros abruptos al desconectar el stream.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Modal Nueva / Editar Alarma */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#201f1f] border-3 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 max-w-md w-full flex flex-col gap-4 relative">
            <div className="flex justify-between items-center border-b-2 border-black pb-3">
              <h3 className="font-black text-xl text-white uppercase">
                {editingAlarm ? 'Editar Alarma' : 'Nueva Alarma'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#bbcabf] hover:text-white p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="flex flex-col gap-4">
              {/* Time Picker */}
              <div>
                <label className="font-mono-tech text-xs text-[#bbcabf] uppercase block mb-1">
                  Hora de Activación
                </label>
                <input
                  type="time"
                  required
                  value={formTime}
                  onChange={e => setFormTime(e.target.value)}
                  className="w-full bg-[#131313] border-3 border-black p-3 text-white font-mono-tech text-xl font-bold focus:border-[#4edea3] outline-none"
                />
              </div>

              {/* Station Selection */}
              <div>
                <label className="font-mono-tech text-xs text-[#bbcabf] uppercase block mb-1">
                  Emisora de Radio
                </label>
                <select
                  value={formStationId}
                  onChange={e => setFormStationId(e.target.value)}
                  className="w-full bg-[#131313] border-3 border-black p-3 text-white font-mono-tech text-sm focus:border-[#4edea3] outline-none"
                >
                  {stations.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.country} - {st.genre})
                    </option>
                  ))}
                </select>
              </div>

              {/* Days of Week Selection */}
              <div>
                <label className="font-mono-tech text-xs text-[#bbcabf] uppercase block mb-1.5">
                  Días Activos
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {daysOfWeek.map(day => {
                    const isSelected = formDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDaySelection(day)}
                        className={`py-2 text-center font-mono-tech text-xs font-bold border-2 border-black transition-colors ${
                          isSelected ? 'bg-[#8B5CF6] text-white' : 'bg-[#131313] text-[#bbcabf]'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Label Name */}
              <div>
                <label className="font-mono-tech text-xs text-[#bbcabf] uppercase block mb-1">
                  Etiqueta / Nombre
                </label>
                <input
                  type="text"
                  value={formLabel}
                  onChange={e => setFormLabel(e.target.value)}
                  className="w-full bg-[#131313] border-3 border-black p-2.5 text-white font-mono-tech text-sm focus:border-[#4edea3] outline-none"
                  placeholder="Ej: Despertador Trabajo"
                />
              </div>

              {/* Volume Slider */}
              <div>
                <div className="flex justify-between font-mono-tech text-xs text-[#bbcabf] mb-1">
                  <span>VOLUMEN INICIAL</span>
                  <span className="text-[#4edea3] font-bold">{formVolume}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={formVolume}
                  onChange={e => setFormVolume(parseInt(e.target.value))}
                  className="w-full h-2 bg-black accent-[#4edea3] cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-[#353534] text-white py-3 border-3 border-black font-mono-tech text-xs font-bold uppercase hover:bg-[#4a4948]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 neo-button bg-[#4edea3] text-[#003824] py-3 border-3 border-black font-mono-tech text-xs font-bold uppercase hover:bg-[#38c98e]"
                >
                  Guardar Alarma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
