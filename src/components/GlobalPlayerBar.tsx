import React from 'react';
import { RadioStation, PlaybackStatus } from '../types/radio';
import { motion } from 'motion/react';

interface GlobalPlayerBarProps {
  currentStation: RadioStation | null;
  isPlaying: boolean;
  playbackStatus: PlaybackStatus;
  errorMessage?: string;
  onTogglePlay: () => void;
  onPrevStation: () => void;
  onNextStation: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string, station?: RadioStation) => void;
}

export const GlobalPlayerBar: React.FC<GlobalPlayerBarProps> = ({
  currentStation,
  isPlaying,
  playbackStatus,
  errorMessage,
  onTogglePlay,
  onPrevStation,
  onNextStation,
  volume,
  onVolumeChange,
  isFavorite,
  onToggleFavorite,
}) => {
  if (!currentStation) return null;

  return (
    <div className="fixed bottom-18 md:bottom-0 left-0 md:left-64 right-0 bg-[#1A1A1A] border-t-3 border-black p-3.5 z-30 flex items-center justify-between gap-3 md:gap-6 shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)]">
      {/* Left: Station Info & Live Status */}
      <div className="flex items-center gap-3 w-1/3 min-w-0">
        <div
          className="w-12 h-12 bg-[#201f1f] border-2 border-black flex items-center justify-center shrink-0 relative overflow-hidden"
          style={{ backgroundColor: currentStation.color || '#201f1f' }}
        >
          <span className="material-symbols-outlined text-white text-2xl group-hover:scale-110 transition-transform">
            radio
          </span>
          {playbackStatus === 'playing' && (
            <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse border border-black" />
          )}
          {playbackStatus === 'buffering' && (
            <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#F59E0B] animate-ping border border-black" />
          )}
          {playbackStatus === 'error' && (
            <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#EF4444] border border-black" />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm md:text-base text-white truncate">
              {currentStation.name}
            </h4>
            <button
              onClick={() => onToggleFavorite(currentStation.id, currentStation)}
              className="text-[#bbcabf] hover:text-[#EF4444] transition-colors cursor-pointer"
              title={isFavorite ? 'Quitar de favoritas' : 'Añadir a favoritas'}
            >
              <span
                className={`material-symbols-outlined text-base ${
                  isFavorite ? 'text-[#EF4444]' : 'text-[#86948a]'
                }`}
                style={isFavorite ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                favorite
              </span>
            </button>
          </div>

          {/* Minimalist Connection Status Indicator */}
          <div className="font-mono-tech text-[11px] truncate flex items-center gap-1.5 mt-0.5">
            {playbackStatus === 'buffering' && (
              <span className="text-[#F59E0B] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-ping" />
                Conectando emisión...
              </span>
            )}

            {playbackStatus === 'error' && (
              <button
                onClick={onTogglePlay}
                className="text-[#EF4444] hover:text-white font-bold flex items-center gap-1 cursor-pointer underline decoration-dotted"
                title="Pulsa para reintentar conectar"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                <span>{errorMessage || 'Emisora no disponible'}</span>
                <span className="material-symbols-outlined text-[13px] ml-0.5">refresh</span>
              </button>
            )}

            {playbackStatus === 'playing' && (
              <span className="text-[#bbcabf] truncate">
                <span className="text-[#4edea3] font-bold mr-1">● EN DIRECTO</span>
                {currentStation.currentTrack || `${currentStation.country} • ${currentStation.genre}`}
              </span>
            )}

            {playbackStatus === 'idle' && (
              <span className="text-[#bbcabf]">
                PAUSADO • {currentStation.format} {currentStation.bitrate}K
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center: Playback Controls */}
      <div className="flex items-center gap-3 md:gap-6 justify-center">
        <motion.button
          type="button"
          onClick={onPrevStation}
          whileTap={{ scale: 0.9, y: 2 }}
          className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/20 text-white flex items-center justify-center cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.25)] transition-all active:shadow-[0_1px_4px_rgba(0,0,0,0.8)]"
          title="Emisora anterior"
        >
          <span className="material-symbols-outlined text-2xl md:text-3xl text-white">skip_previous</span>
        </motion.button>

        <motion.button
          type="button"
          onClick={onTogglePlay}
          whileTap={{ scale: 0.93, y: 2 }}
          className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-[0_8px_25px_rgba(0,0,0,0.7),inset_0_4px_8px_rgba(255,255,255,0.5),inset_0_-4px_8px_rgba(0,0,0,0.4)] ${
            playbackStatus === 'error'
              ? 'bg-gradient-to-br from-[#EF4444] to-[#b91c1c] text-white border-2 border-[#7f1d1d]'
              : playbackStatus === 'buffering'
              ? 'bg-gradient-to-br from-[#F59E0B] to-[#b45309] text-black border-2 border-[#78350f]'
              : 'bg-gradient-to-br from-[#4edea3] via-[#38c98e] to-[#059669] text-black border-2 border-[#022c22]'
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
            <span className="material-symbols-outlined text-3xl animate-spin">
              progress_activity
            </span>
          ) : playbackStatus === 'error' ? (
            <span className="material-symbols-outlined text-3xl">
              refresh
            </span>
          ) : (
            <span
              className="material-symbols-outlined text-3xl md:text-4xl font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          )}
        </motion.button>

        <motion.button
          type="button"
          onClick={onNextStation}
          whileTap={{ scale: 0.9, y: 2 }}
          className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/20 text-white flex items-center justify-center cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.25)] transition-all active:shadow-[0_1px_4px_rgba(0,0,0,0.8)]"
          title="Emisora siguiente"
        >
          <span className="material-symbols-outlined text-2xl md:text-3xl text-white">skip_next</span>
        </motion.button>
      </div>

      {/* Right: Volume & Expand */}
      <div className="flex items-center justify-end gap-2 md:gap-4 w-1/3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onVolumeChange(volume > 0 ? 0 : 0.8)}
            className="text-[#bbcabf] hover:text-white cursor-pointer p-1"
            title="Silenciar / Activar"
          >
            <span className="material-symbols-outlined text-xl md:text-2xl">
              {volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
            </span>
          </button>
          <div className="w-28 sm:w-36 md:w-44 h-3.5 bg-black/80 relative flex items-center rounded-full border border-white/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] overflow-hidden cursor-pointer">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#38c98e] to-[#4edea3] rounded-full"
              style={{ width: `${volume * 100}%` }}
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={e => onVolumeChange(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
