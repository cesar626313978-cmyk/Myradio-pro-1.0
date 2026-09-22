import React from 'react';
import { RadioStation, PlaybackStatus } from '../types/radio';

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
  onOpenCarMode: () => void;
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
  onOpenCarMode,
  isFavorite,
  onToggleFavorite,
}) => {
  if (!currentStation) return null;

  return (
    <div className="fixed bottom-18 md:bottom-0 left-0 md:left-64 right-0 bg-[#1A1A1A] border-t-3 border-black p-3.5 z-30 flex items-center justify-between gap-3 md:gap-6 shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)]">
      {/* Left: Station Info & Live Status */}
      <div className="flex items-center gap-3 w-1/3 min-w-0">
        <div
          onClick={onOpenCarMode}
          className="w-12 h-12 bg-[#201f1f] border-2 border-black flex items-center justify-center shrink-0 cursor-pointer relative group overflow-hidden"
          style={{ backgroundColor: currentStation.color || '#201f1f' }}
          title="Abrir en Modo Coche"
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
            <h4
              onClick={onOpenCarMode}
              className="font-bold text-sm md:text-base text-white truncate cursor-pointer hover:text-[#4edea3]"
            >
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
      <div className="flex items-center gap-3 md:gap-5 justify-center">
        <button
          onClick={onPrevStation}
          className="p-1.5 text-[#bbcabf] hover:text-white transition-colors cursor-pointer"
          title="Emisora anterior"
        >
          <span className="material-symbols-outlined text-2xl md:text-3xl">skip_previous</span>
        </button>

        <button
          onClick={onTogglePlay}
          className={`neo-button w-12 h-12 md:w-13 md:h-13 rounded-full flex items-center justify-center transition-all ${
            playbackStatus === 'error'
              ? 'bg-[#EF4444] text-white hover:bg-[#dc2626]'
              : playbackStatus === 'buffering'
              ? 'bg-[#F59E0B] text-black hover:bg-[#d97706]'
              : 'bg-[#4edea3] text-[#003824] hover:bg-[#38c98e]'
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
            <span className="material-symbols-outlined text-2xl animate-spin">
              progress_activity
            </span>
          ) : playbackStatus === 'error' ? (
            <span className="material-symbols-outlined text-2xl">
              refresh
            </span>
          ) : (
            <span
              className="material-symbols-outlined text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          )}
        </button>

        <button
          onClick={onNextStation}
          className="p-1.5 text-[#bbcabf] hover:text-white transition-colors cursor-pointer"
          title="Emisora siguiente"
        >
          <span className="material-symbols-outlined text-2xl md:text-3xl">skip_next</span>
        </button>
      </div>

      {/* Right: Volume & Expand */}
      <div className="flex items-center justify-end gap-3 md:gap-5 w-1/3">
        <div className="hidden sm:flex items-center gap-2">
          <span
            className="material-symbols-outlined text-lg text-[#bbcabf] cursor-pointer"
            onClick={() => onVolumeChange(volume > 0 ? 0 : 0.8)}
          >
            {volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
          </span>
          <div className="w-20 md:w-28 h-2 bg-black relative flex items-center border border-black">
            <div
              className="absolute left-0 top-0 h-full bg-[#4edea3]"
              style={{ width: `${volume * 100}%` }}
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={e => onVolumeChange(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        <button
          onClick={onOpenCarMode}
          className="neo-button bg-[#201f1f] text-white p-2 border-2 border-black flex items-center gap-1 font-mono-tech text-xs font-bold hover:bg-[#353534] cursor-pointer"
          title="Expandir Modo Coche"
        >
          <span className="material-symbols-outlined text-base">fullscreen</span>
          <span className="hidden lg:inline">COCHE</span>
        </button>
      </div>
    </div>
  );
};
