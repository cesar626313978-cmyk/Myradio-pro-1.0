import React, { useEffect, useState } from 'react';
import { RadioStation, PlaybackStatus } from '../types/radio';
import { motion } from 'motion/react';

interface CarModeViewProps {
  currentStation: RadioStation | null;
  isPlaying: boolean;
  playbackStatus?: PlaybackStatus;
  onTogglePlay: () => void;
  onNextStation?: () => void;
  onPrevStation?: () => void;
  onExitCarMode: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
}

export const CarModeView: React.FC<CarModeViewProps> = ({
  currentStation,
  isPlaying,
  playbackStatus = 'idle',
  onTogglePlay,
  onNextStation,
  onPrevStation,
  onExitCarMode,
  volume,
  onVolumeChange,
}) => {
  // Rich multi-layered realistic starfield
  const [stars] = useState(() =>
    Array.from({ length: 180 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      duration: Math.random() * 3 + 1.5,
      delay: Math.random() * 2,
      color: Math.random() > 0.8 ? '#93c5fd' : Math.random() > 0.6 ? '#fed7aa' : '#ffffff',
    }))
  );

  // Shooting stars / comets
  const [comets] = useState(() =>
    Array.from({ length: 4 }).map((_, i) => ({
      top: Math.random() * 70,
      left: Math.random() * 80,
      duration: Math.random() * 4 + 3.5,
      delay: i * 2.5 + Math.random() * 2,
    }))
  );

  // Simulated LED Equalizer bar values when playing
  const [equalizerLevels, setEqualizerLevels] = useState<number[]>([40, 65, 30, 85, 50, 90, 45, 70, 35, 80, 55, 95]);

  useEffect(() => {
    if (!isPlaying || playbackStatus !== 'playing') return;
    const interval = setInterval(() => {
      setEqualizerLevels(
        Array.from({ length: 12 }).map(() => Math.floor(Math.random() * 75) + 25)
      );
    }, 120);
    return () => clearInterval(interval);
  }, [isPlaying, playbackStatus]);

  return (
    <div className="fixed inset-0 z-50 bg-[#010104] text-white flex flex-col justify-between overflow-hidden select-none font-mono-tech">
      {/* Immersive Space Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-indigo-950/20 via-purple-950/15 to-transparent rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-[700px] h-[700px] bg-gradient-to-tr from-cyan-950/20 via-blue-950/15 to-transparent rounded-full blur-[120px] pointer-events-none" />

        {/* Twinkling Starfield */}
        {stars.map((star, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: star.color,
              boxShadow: star.size > 1.8 ? `0 0 ${star.size * 2.5}px ${star.color}` : 'none',
            }}
            animate={{
              opacity: [star.opacity * 0.2, star.opacity, star.opacity * 0.2],
              scale: [0.8, 1.3, 0.8],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Shooting Stars / Comets */}
        {comets.map((comet, i) => (
          <motion.div
            key={`comet-${i}`}
            className="absolute h-[1.5px] w-[140px] bg-gradient-to-r from-transparent via-white to-transparent rotate-[-35deg]"
            style={{
              top: `${comet.top}%`,
              left: `${comet.left}%`,
            }}
            animate={{
              x: ['-150vw', '150vw'],
              y: ['-50vh', '50vh'],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: comet.duration,
              repeat: Infinity,
              delay: comet.delay,
              ease: 'linear',
              repeatDelay: 4,
            }}
          />
        ))}
      </div>

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#4edea3] animate-pulse" />
          <span className="text-xs sm:text-sm font-bold tracking-widest text-[#4edea3] uppercase">
            MODO COCHE HUD • IGUALADOR LED
          </span>
        </div>

        <button
          type="button"
          onClick={onExitCarMode}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors backdrop-blur-md active:scale-95 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]"
        >
          <span className="material-symbols-outlined text-base">close</span>
          <span>Salir del Modo Coche</span>
        </button>
      </div>

      {/* Center Main Stage with LED Equalizer Circle */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto w-full">
        {/* Central Station Logo Orb with Outer & Inner LED Equalizer Rings */}
        <div className="relative mb-8">
          {/* Outer Pulsing LED Ring Glow */}
          <div
            className={`absolute -inset-4 rounded-full transition-all duration-300 ${
              isPlaying ? 'bg-gradient-to-r from-[#4edea3]/40 via-[#06B6D4]/40 to-[#8B5CF6]/40 blur-xl animate-pulse' : 'bg-white/5 blur-md'
            }`}
          />

          {/* Outer Rotating LED Segment Ring */}
          {isPlaying && (
            <motion.div
              className="absolute -inset-6 rounded-full border-2 border-dashed border-[#4edea3]/60 pointer-events-none"
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            />
          )}

          {/* Secondary Outer Frequency Ring */}
          {isPlaying && (
            <motion.div
              className="absolute -inset-10 rounded-full border border-[#06B6D4]/35 pointer-events-none"
              animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {/* Main Circle Container with Inner LED Equalizer Bars */}
          <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-[#4edea3] bg-black/95 flex items-center justify-center relative overflow-hidden shadow-[0_0_50px_rgba(78,222,163,0.4)]">
            {/* Inner LED Equalizer Radial Bars */}
            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                <div className="absolute w-full h-full flex items-center justify-between px-2">
                  {equalizerLevels.map((lvl, idx) => (
                    <motion.div
                      key={idx}
                      className="w-1.5 bg-gradient-to-t from-[#06B6D4] to-[#4edea3] rounded-full"
                      style={{ height: `${lvl}%` }}
                      animate={{ height: `${Math.max(15, (lvl * (idx % 2 === 0 ? 1 : 0.7)))}%` }}
                      transition={{ duration: 0.12 }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Station Logo or Equalizer Icon */}
            {currentStation?.logoUrl ? (
              <img
                src={currentStation.logoUrl}
                alt={currentStation.name}
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover z-10 opacity-90"
                onError={e => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="material-symbols-outlined text-6xl text-[#4edea3] animate-pulse z-10">
                equalizer
              </span>
            )}
          </div>
        </div>

        {/* Station Info */}
        <div className="space-y-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/5 border border-white/10 text-xs text-[#4edea3] uppercase tracking-widest font-bold">
            <span>{currentStation?.country || 'Mundial'}</span>
            <span>•</span>
            <span>{currentStation?.genre || 'Radio en Directo'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] line-clamp-2 max-w-3xl">
            {currentStation?.name || 'Sintonizando emisora...'}
          </h1>

          <div className="text-xs sm:text-sm text-gray-400 font-mono tracking-wider flex items-center justify-center gap-3">
            <span className="text-[#06B6D4] font-bold">{currentStation?.format || 'MP3'}</span>
            {currentStation && currentStation.bitrate > 0 && (
              <>
                <span>•</span>
                <span className="text-[#F59E0B] font-bold">{currentStation.bitrate} kbps</span>
              </>
            )}
            <span>•</span>
            <span className="text-emerald-400 uppercase font-black tracking-widest">
              {playbackStatus === 'buffering'
                ? 'Conectando...'
                : playbackStatus === 'error'
                ? 'Sin señal'
                : isPlaying
                ? 'EN VIVO 🔴'
                : 'Pausado'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Control Deck (Optimized for Driving) */}
      <div className="relative z-10 px-6 py-8 bg-black/70 backdrop-blur-xl border-t border-white/15 flex flex-col items-center gap-6 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        {/* Main Transport Controls */}
        <div className="flex items-center justify-center gap-8 sm:gap-12">
          {onPrevStation && (
            <button
              type="button"
              onClick={onPrevStation}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 hover:bg-white/20 border-2 border-white/25 flex items-center justify-center text-white cursor-pointer active:scale-95 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              title="Emisora Anterior"
            >
              <span className="material-symbols-outlined text-3xl sm:text-4xl">skip_previous</span>
            </button>
          )}

          <button
            type="button"
            onClick={onTogglePlay}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#4edea3] hover:bg-[#38c98e] text-black border-4 border-black flex items-center justify-center cursor-pointer shadow-[0_0_40px_rgba(78,222,163,0.6)] active:scale-95 transition-transform"
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            <span className="material-symbols-outlined text-5xl sm:text-6xl font-black">
              {playbackStatus === 'buffering' ? 'progress_activity' : isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          {onNextStation && (
            <button
              type="button"
              onClick={onNextStation}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 hover:bg-white/20 border-2 border-white/25 flex items-center justify-center text-white cursor-pointer active:scale-95 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              title="Siguiente Emisora"
            >
              <span className="material-symbols-outlined text-3xl sm:text-4xl">skip_next</span>
            </button>
          )}
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-4 w-full max-w-md px-4">
          <span className="material-symbols-outlined text-gray-400 text-xl">
            {volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={e => onVolumeChange(parseFloat(e.target.value))}
            className="w-full h-2.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#4edea3]"
          />
          <span className="text-xs text-gray-400 font-mono w-10 text-right font-bold">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
