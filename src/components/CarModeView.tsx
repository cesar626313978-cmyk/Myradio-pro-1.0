import React, { useState, useEffect, useRef } from 'react';
import { RadioStation, PlaybackStatus } from '../types/radio';
import { audioEngine } from '../services/audioEngine';
import {
  WeatherData,
  fetchLiveWeather,
  getDistanceMeters,
} from '../services/weatherService';

interface CarModeViewProps {
  currentStation: RadioStation;
  isPlaying: boolean;
  playbackStatus?: PlaybackStatus;
  errorMessage?: string;
  onTogglePlay: () => void;
  onStop?: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  onClose: () => void;
  favoriteStations: RadioStation[];
  onSelectStation: (station: RadioStation) => void;
  onPrevStation?: () => void;
  onNextStation?: () => void;
}

export const CarModeView: React.FC<CarModeViewProps> = ({
  currentStation,
  isPlaying,
  playbackStatus = 'idle',
  errorMessage,
  onTogglePlay,
  onClose,
  favoriteStations,
  onSelectStation,
  onPrevStation,
  onNextStation,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [showFavoritesDrawer, setShowFavoritesDrawer] = useState(false);
  const [showForecastDetails, setShowForecastDetails] = useState(false);
  const [waveHeights, setWaveHeights] = useState<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Weather & GPS Geolocation tracking state
  const [weather, setWeather] = useState<WeatherData>({
    locality: 'Torrevieja',
    country: 'ES',
    temp: 30,
    condition: 'Despejado',
    icon: 'wb_sunny',
    windSpeed: 4,
    hourly: [
      { time: '+1h', temp: 31, weatherCode: 0, condition: 'Despejado', icon: 'wb_sunny' },
      { time: '+2h', temp: 29, weatherCode: 1, condition: 'Parcialmente Nublado', icon: 'partly_cloudy_day' },
      { time: '+3h', temp: 28, weatherCode: 2, condition: 'Nuboso', icon: 'cloud' },
      { time: '+4h', temp: 27, weatherCode: 0, condition: 'Despejado', icon: 'wb_sunny' },
    ],
    lastUpdated: new Date(),
    latitude: 37.9787,
    longitude: -0.6822,
    distanceFromLastKm: 0,
  });

  const lastCoordsRef = useRef<{ lat: number; lon: number }>({
    lat: 37.9787,
    lon: -0.6822,
  });
  const [distanceMovedMeters, setDistanceMovedMeters] = useState<number>(0);
  const [gpsStatus, setGpsStatus] = useState<'tracking' | 'updating' | 'ready'>('ready');

  // Initial weather load & Geolocation 2000-meter threshold watcher
  useEffect(() => {
    fetchLiveWeather(lastCoordsRef.current.lat, lastCoordsRef.current.lon).then(data => {
      setWeather(data);
    });

    let watchId: number | null = null;
    if ('geolocation' in navigator) {
      setGpsStatus('tracking');
      watchId = navigator.geolocation.watchPosition(
        async position => {
          const currentLat = position.coords.latitude;
          const currentLon = position.coords.longitude;

          const distanceMeters = getDistanceMeters(
            lastCoordsRef.current.lat,
            lastCoordsRef.current.lon,
            currentLat,
            currentLon
          );
          setDistanceMovedMeters(Math.round(distanceMeters));

          if (distanceMeters >= 2000) {
            setGpsStatus('updating');
            lastCoordsRef.current = { lat: currentLat, lon: currentLon };
            const updated = await fetchLiveWeather(currentLat, currentLon);
            setWeather(updated);
            setDistanceMovedMeters(0);
            setGpsStatus('tracking');
          }
        },
        error => {
          console.warn('GPS Geolocation watch notice:', error.message);
          setGpsStatus('ready');
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 15000,
        }
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Live real-time clock & date
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${hours}:${minutes}`);

      const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const dayName = days[now.getDay()];
      const dayNum = now.getDate();
      const monthName = months[now.getMonth()];
      setDateStr(`${dayName}, ${dayNum} ${monthName}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Audio Waveform Animation in Dark Neo-Brutalist aesthetic
  useEffect(() => {
    const barCount = 44;
    let phase = 0;

    const renderWave = () => {
      phase += 0.05;
      const freqData = playbackStatus === 'playing' ? audioEngine.getFrequencyData() : null;

      const heights: number[] = [];
      for (let i = 0; i < barCount; i++) {
        const normalizedX = (i / (barCount - 1)) * Math.PI * 4;
        const carrier = Math.abs(Math.sin(normalizedX));

        let waveHeight = 0;
        if (playbackStatus === 'playing') {
          const freqIndex = Math.floor((i / barCount) * (freqData ? freqData.length : 16));
          const freqVal = freqData ? freqData[freqIndex] / 255 : 0.6;
          const dynamicMod = Math.sin(phase + i * 0.25) * 0.35 + 0.65;
          waveHeight = Math.max(12, carrier * (freqVal * 0.7 + dynamicMod * 0.3) * 150);
        } else if (playbackStatus === 'buffering') {
          // Energetic pulsing rhythm while buffering/connecting
          const bufMod = Math.sin(phase * 2 + i * 0.5) * 0.5 + 0.5;
          waveHeight = Math.max(10, carrier * bufMod * 70);
        } else {
          const idleMod = Math.sin(phase * 0.5 + i * 0.2) * 0.15 + 0.85;
          waveHeight = Math.max(8, carrier * idleMod * 35);
        }

        const distFromCenter = Math.abs(i - barCount / 2);
        if (distFromCenter < 4) {
          waveHeight = Math.min(waveHeight, 18 + distFromCenter * 5);
        }

        heights.push(waveHeight);
      }

      setWaveHeights(heights);
      animationFrameRef.current = requestAnimationFrame(renderWave);
    };

    animationFrameRef.current = requestAnimationFrame(renderWave);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playbackStatus]);

  const quickFavorites = favoriteStations.slice(0, 4);

  return (
    <div className="fixed inset-0 z-[999] bg-[#0E0E0E] text-white flex flex-col justify-between overflow-hidden select-none h-screen w-screen p-4 sm:p-7 font-['Inter']">
      
      {/* Background subtle neo-brutalist grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, #252525 1px, transparent 1px), linear-gradient(to bottom, #252525 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top Header Bar: Exit & Dynamic Local Weather on left, Digital Clock on right */}
      <header className="flex justify-between items-start z-20 w-full shrink-0">
        
        {/* Left Side: Exit Button + Smart Dynamic Weather & Hourly Forecast */}
        <div className="flex flex-col gap-2 max-w-xl">
          <button
            onClick={onClose}
            className="neo-button flex items-center gap-2 bg-white text-black font-mono-tech text-xs sm:text-sm font-black px-3.5 py-1.5 border-3 border-black uppercase hover:bg-[#e5e2e1] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer w-fit shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            title="Salir del Modo Coche"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Salir</span>
          </button>

          {/* Dynamic Weather Banner with Locality & Hourly Forecast */}
          <div
            onClick={() => setShowForecastDetails(!showForecastDetails)}
            className="bg-[#1A1A1A] border-2 border-black p-2 sm:p-2.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:bg-[#201f1f] transition-all flex flex-col gap-1.5"
            title="Toca para ver u ocultar el detalle de horas"
          >
            {/* Top Row: Locality + Current Temp + GPS Badge */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5 font-mono-tech text-xs font-bold text-white uppercase">
                <span className="material-symbols-outlined text-sm text-[#EF4444]">location_on</span>
                <span className="text-[#4edea3]">{weather.locality}</span>
              </div>

              <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 border border-black font-mono-tech text-xs font-black text-white">
                <span className="material-symbols-outlined text-sm text-[#F59E0B]">{weather.icon}</span>
                <span>{weather.temp}°C</span>
                <span className="text-[#06B6D4] text-[10px] uppercase font-bold ml-0.5">
                  {weather.condition}
                </span>
              </div>

              {/* GPS 2000m Tracker Status */}
              <div className="flex items-center gap-1 font-mono-tech text-[9px] text-[#bbcabf] bg-[#0E0E0E] px-1.5 py-0.5 border border-black/80 ml-auto">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    gpsStatus === 'updating'
                      ? 'bg-[#F59E0B] animate-spin'
                      : 'bg-[#10B981] animate-pulse'
                  }`}
                />
                <span>GPS AUTO 2000M</span>
                {distanceMovedMeters > 0 && (
                  <span className="text-[#8B5CF6]">({distanceMovedMeters}m)</span>
                )}
              </div>
            </div>

            {/* Bottom Row: Next Hours Forecast Pills */}
            <div className="flex items-center gap-2 font-mono-tech text-[10px] text-[#bbcabf] overflow-x-hidden pt-0.5 border-t border-black/60">
              <span className="text-[#8B5CF6] font-bold shrink-0 uppercase flex items-center gap-0.5">
                <span className="material-symbols-outlined text-xs">schedule</span>
                Próx:
              </span>
              <div className="flex items-center gap-2.5 truncate">
                {weather.hourly.slice(0, 3).map((item, idx) => (
                  <span key={idx} className="flex items-center gap-1 shrink-0">
                    <span className="text-white font-medium">{item.time}</span>
                    <span className="text-[#F59E0B] font-bold">{item.temp}°</span>
                    <span className="material-symbols-outlined text-[11px] text-[#06B6D4]">
                      {item.icon}
                    </span>
                    {idx < 2 && <span className="text-black/60 font-black">·</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Info: Sharp Neo-Brutalist Clock & Date */}
        <div className="text-right flex flex-col items-end">
          <div className="font-black text-4xl sm:text-5xl tracking-tight text-white font-mono-tech leading-none drop-shadow-md">
            {timeStr || '11:17'}
          </div>
          <div className="text-xs sm:text-sm text-[#8B5CF6] font-mono-tech font-bold uppercase mt-1">
            {dateStr || 'miércoles, 19 ago'}
          </div>
        </div>
      </header>

      {/* Expanded Forecast Details Popover */}
      {showForecastDetails && (
        <div className="fixed top-28 left-4 z-40 bg-[#141414] border-3 border-black p-3.5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full animate-in fade-in">
          <div className="flex justify-between items-center pb-2 mb-2 border-b-2 border-black">
            <div className="font-mono-tech text-xs font-bold text-white uppercase flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#4edea3]">cloud_sync</span>
              Previsión Detallada ({weather.locality})
            </div>
            <button
              onClick={() => setShowForecastDetails(false)}
              className="text-[#bbcabf] hover:text-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {weather.hourly.map((h, i) => (
              <div key={i} className="bg-[#201f1f] border border-black p-2 text-center">
                <div className="font-mono-tech text-[10px] text-[#bbcabf]">{h.time}</div>
                <span className="material-symbols-outlined text-[#F59E0B] text-lg my-0.5">
                  {h.icon}
                </span>
                <div className="font-mono-tech text-xs font-bold text-white">{h.temp}°C</div>
                <div className="font-mono-tech text-[8px] text-[#06B6D4] truncate mt-0.5">
                  {h.condition}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 text-[9px] font-mono-tech text-[#bbcabf] flex items-center justify-between border-t border-black pt-1.5">
            <span>Viento: {weather.windSpeed} km/h</span>
            <span className="text-[#10B981]">Comprobación GPS activa (2 km)</span>
          </div>
        </div>
      )}

      {/* Center Canvas: Soundwave Bars + Station Icon Card */}
      <main className="relative flex-1 flex flex-col items-center justify-center my-auto w-full min-h-0 z-10">
        
        {/* Full-width Harmonic Audio Waveform Animation */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none px-2 sm:px-8 w-full z-0">
          {waveHeights.map((h, idx) => (
            <div
              key={idx}
              className="w-1.5 sm:w-2 md:w-3 rounded-none transition-all duration-75 border border-black/40"
              style={{
                height: `${Math.max(8, h)}px`,
                backgroundColor:
                  playbackStatus === 'buffering'
                    ? '#F59E0B'
                    : playbackStatus === 'error'
                    ? '#EF4444'
                    : playbackStatus === 'playing'
                    ? '#8B5CF6'
                    : '#334155',
                opacity: playbackStatus === 'playing' ? 0.95 : playbackStatus === 'buffering' ? 0.75 : 0.4,
                boxShadow:
                  playbackStatus === 'playing'
                    ? '0 0 12px rgba(139, 92, 246, 0.4)'
                    : playbackStatus === 'buffering'
                    ? '0 0 12px rgba(245, 158, 11, 0.4)'
                    : 'none',
              }}
            />
          ))}
        </div>

        {/* Center Station Tile & Info */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          {/* Station Icon Card */}
          <div
            className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center relative overflow-hidden transition-transform duration-200 hover:scale-105"
            style={{
              backgroundColor: currentStation.color || '#8B5CF6',
            }}
          >
            {currentStation.logoUrl ? (
              <img
                src={currentStation.logoUrl}
                alt={currentStation.name}
                className="w-full h-full object-cover"
                onError={e => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : currentStation.name.toLowerCase().includes('cope') ? (
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white border-2 border-black flex items-center justify-center font-black text-2xl sm:text-3xl text-[#1E40AF]">
                C
              </div>
            ) : (
              <span className="material-symbols-outlined text-white text-4xl sm:text-5xl">
                radio
              </span>
            )}
          </div>

          {/* Station Title in Bold Neo-Brutalist Type */}
          <h1 className="font-black text-2xl sm:text-3xl md:text-5xl text-white uppercase tracking-tight mt-5 truncate max-w-xl font-['Inter'] drop-shadow-md">
            {currentStation.name}
          </h1>

          {/* Country / Genre */}
          <p className="font-mono-tech text-xs sm:text-sm text-[#06B6D4] font-bold uppercase mt-1">
            {currentStation.country} • {currentStation.genre}
          </p>

          {/* Minimalist Live Connection Feedback Badge */}
          <div className="mt-2.5">
            {playbackStatus === 'buffering' && (
              <div className="inline-flex items-center gap-1.5 bg-[#F59E0B]/20 border border-[#F59E0B] px-3 py-1 text-xs font-mono-tech text-[#F59E0B] font-black uppercase">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />
                <span>Conectando emisión...</span>
              </div>
            )}

            {playbackStatus === 'error' && (
              <button
                onClick={onTogglePlay}
                className="inline-flex items-center gap-1.5 bg-[#EF4444]/20 border border-[#EF4444] px-3 py-1 text-xs font-mono-tech text-[#EF4444] hover:text-white hover:bg-[#EF4444] transition-all font-black uppercase cursor-pointer"
                title="Pulsa para reintentar conectar"
              >
                <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                <span>{errorMessage || 'Emisora no disponible'}</span>
                <span className="material-symbols-outlined text-sm ml-1">refresh</span>
              </button>
            )}

            {playbackStatus === 'playing' && (
              <div className="inline-flex items-center gap-1.5 bg-[#10B981]/20 border border-[#10B981] px-3 py-1 text-xs font-mono-tech text-[#4edea3] font-bold uppercase">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span>En Directo • {currentStation.format} {currentStation.bitrate}K</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Bar: Neo-Brutalist Playback Capsule & Discreet Favorites Button */}
      <footer className="relative flex items-center justify-center w-full z-20 shrink-0">
        
        {/* Playback Controls Capsule in Dark Neo-Brutalism */}
        <div className="flex items-center gap-3 bg-[#1A1A1A] border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-2 sm:p-2.5">
          {/* Previous Station Button */}
          <button
            onClick={onPrevStation}
            className="w-12 h-12 bg-[#201f1f] hover:bg-[#353534] text-white border-2 border-black flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
            title="Emisora anterior"
          >
            <span className="material-symbols-outlined text-2xl">skip_previous</span>
          </button>

          {/* Main Play/Pause Button in High Contrast */}
          <button
            onClick={onTogglePlay}
            className={`w-14 h-14 border-3 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:scale-95 cursor-pointer ${
              playbackStatus === 'error'
                ? 'bg-[#EF4444] text-white hover:bg-[#dc2626]'
                : playbackStatus === 'buffering'
                ? 'bg-[#F59E0B] text-black hover:bg-[#d97706]'
                : 'bg-[#4edea3] hover:bg-[#38c98e] text-[#003824]'
            }`}
            title={
              playbackStatus === 'buffering'
                ? 'Conectando...'
                : playbackStatus === 'error'
                ? 'Reintentar sintonización'
                : isPlaying
                ? 'Pausar'
                : 'Reproducir'
            }
          >
            {playbackStatus === 'buffering' ? (
              <span className="material-symbols-outlined text-3xl font-black animate-spin">
                progress_activity
              </span>
            ) : playbackStatus === 'error' ? (
              <span className="material-symbols-outlined text-3xl font-black">
                refresh
              </span>
            ) : (
              <span
                className="material-symbols-outlined text-3xl font-black"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            )}
          </button>

          {/* Next Station Button */}
          <button
            onClick={onNextStation}
            className="w-12 h-12 bg-[#201f1f] hover:bg-[#353534] text-white border-2 border-black flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
            title="Siguiente emisora"
          >
            <span className="material-symbols-outlined text-2xl">skip_next</span>
          </button>
        </div>

        {/* Discreet Favorites Drawer Button (Bottom Right) */}
        <div className="absolute right-0 bottom-0">
          <button
            onClick={() => setShowFavoritesDrawer(!showFavoritesDrawer)}
            className="neo-button flex items-center gap-2 bg-[#201f1f] hover:bg-[#353534] text-white font-mono-tech text-xs font-bold px-3.5 py-2.5 border-3 border-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            title="Ver emisoras favoritas rápidas"
          >
            <span
              className="material-symbols-outlined text-base text-[#8B5CF6]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            <span className="hidden sm:inline">Favoritas</span>
          </button>
        </div>
      </footer>

      {/* Discreet Slide-over / Modal for FAVORITAS_RÁPIDAS [4] */}
      {showFavoritesDrawer && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-end bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#141414] border-3 border-black p-4 md:p-5 w-full max-w-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-white flex flex-col gap-4">
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-black pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono-tech text-xs font-black uppercase tracking-wider text-white">
                  FAVORITAS_RÁPIDAS [4]
                </span>
                <span className="material-symbols-outlined text-[#8B5CF6] text-base">star</span>
              </div>
              <button
                onClick={() => setShowFavoritesDrawer(false)}
                className="text-[#bbcabf] hover:text-white p-1 cursor-pointer"
                title="Cerrar panel"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* 2x2 Favorites Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {quickFavorites.map((fav, index) => {
                const isSelected = currentStation.id === fav.id;
                return (
                  <div
                    key={fav.id}
                    onClick={() => {
                      onSelectStation(fav);
                      setShowFavoritesDrawer(false);
                    }}
                    className={`border-3 border-black p-3.5 flex flex-col justify-between min-h-[110px] cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#8B5CF6] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-[#201f1f] text-white hover:bg-[#353534] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className={`font-mono-tech text-[10px] font-bold uppercase ${
                          isSelected ? 'text-white' : 'text-[#06B6D4]'
                        }`}
                      >
                        CH 0{index + 1}
                      </span>
                      <span
                        className="material-symbols-outlined text-xs text-[#EF4444]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        favorite
                      </span>
                    </div>

                    <div className="mt-2">
                      <div
                        className={`font-mono-tech text-xs font-bold truncate ${
                          isSelected ? 'text-white' : 'text-white'
                        }`}
                      >
                        {fav.name}
                      </div>
                      <div
                        className={`text-[10px] truncate ${
                          isSelected ? 'text-white/80' : 'text-[#bbcabf]'
                        }`}
                      >
                        {fav.genre}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Fallback empty slots if less than 4 */}
              {Array.from({ length: Math.max(0, 4 - quickFavorites.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="border-2 border-black border-dashed bg-[#201f1f] p-3 flex flex-col items-center justify-center text-center opacity-40 min-h-[110px]"
                >
                  <span className="font-mono-tech text-[10px] text-[#bbcabf]">
                    CH 0{quickFavorites.length + i + 1}
                  </span>
                  <span className="font-mono-tech text-[9px] text-[#bbcabf] mt-1">DISPONIBLE</span>
                </div>
              ))}
            </div>

            <p className="font-mono-tech text-[9px] text-[#bbcabf] text-center mt-1">
              Haz clic en cualquier canal para sintonizar al instante.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
