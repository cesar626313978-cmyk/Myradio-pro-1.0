import React from 'react';
import { RadioStation, PlaybackStatus } from '../types/radio';

interface FavoritesViewProps {
  favoriteStations: RadioStation[];
  currentStation: RadioStation | null;
  isPlaying: boolean;
  playbackStatus?: PlaybackStatus;
  errorMessage?: string;
  onSelectStation: (station: RadioStation) => void;
  onToggleFavorite: (id: string, station?: RadioStation) => void;
  onNavigateToDiscover: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  favoriteStations,
  currentStation,
  isPlaying,
  playbackStatus = 'idle',
  onSelectStation,
  onToggleFavorite,
  onNavigateToDiscover,
}) => {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-outlined text-[#EF4444] text-3xl md:text-4xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            favorite
          </span>
          <h1 className="font-black text-2xl md:text-4xl text-white uppercase tracking-tighter font-['Inter']">
            Mis Favoritas
          </h1>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-2 bg-[#201f1f] px-3 py-1.5 border-2 border-black">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="font-mono-tech text-xs font-bold text-[#4edea3] tracking-wider">
            FIREBASE SYNCED
          </span>
        </div>
      </div>

      {favoriteStations.length === 0 ? (
        <div className="bg-[#1A1A1A] border-3 border-black p-12 text-center flex flex-col items-center justify-center neo-shadow">
          <span className="material-symbols-outlined text-5xl text-[#86948a] mb-3">
            favorite_border
          </span>
          <h3 className="font-black text-xl text-white uppercase mb-1">
            No tienes emisoras favoritas aún
          </h3>
          <p className="text-[#bbcabf] font-mono-tech text-xs max-w-md mb-6">
            Explora el catálogo global de emisoras de radio y haz clic en el corazón para guardarlas aquí.
          </p>
          <button
            onClick={onNavigateToDiscover}
            className="neo-button bg-[#4edea3] text-[#003824] px-6 py-3 font-mono-tech text-xs font-black uppercase hover:bg-[#38c98e]"
          >
            Explorar Emisoras
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoriteStations.map(station => {
            const isCurrent = currentStation?.id === station.id;

            return (
              <div
                key={station.id}
                onClick={() => onSelectStation(station)}
                className={`p-4 flex flex-col justify-between border-3 border-black transition-all cursor-pointer group relative ${
                  isCurrent
                    ? 'bg-[#201f1f] shadow-[4px_4px_0px_0px_rgba(78,222,163,0.8)] border-[#4edea3]'
                    : 'bg-[#1A1A1A] hover:bg-[#252525] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                {/* Top Status Header */}
                <div className="flex justify-between items-center text-xs font-mono-tech mb-2">
                  <div className="flex items-center gap-1.5">
                    {isCurrent ? (
                      playbackStatus === 'buffering' ? (
                        <span className="inline-flex items-center gap-1 text-[#F59E0B] font-black uppercase text-[10px]">
                          <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />
                          Conectando...
                        </span>
                      ) : playbackStatus === 'error' ? (
                        <span className="inline-flex items-center gap-1 text-[#EF4444] font-black uppercase text-[10px]">
                          <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                          No disponible
                        </span>
                      ) : isPlaying ? (
                        <span className="inline-flex items-center gap-1 text-[#4edea3] font-black uppercase text-[10px]">
                          <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
                          En Directo
                        </span>
                      ) : (
                        <span className="text-[#bbcabf] text-[10px] font-bold">PAUSADA</span>
                      )
                    ) : (
                      <span className="text-[#bbcabf] text-[10px] uppercase font-bold">
                        {station.countryCode || 'WORLD'}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onToggleFavorite(station.id, station);
                    }}
                    className="text-[#EF4444] hover:text-white p-1 cursor-pointer transition-colors"
                    title="Quitar de favoritas"
                  >
                    <span
                      className="material-symbols-outlined text-lg text-[#EF4444]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      favorite
                    </span>
                  </button>
                </div>

                {/* Station Art & Name */}
                <div className="flex items-center gap-3 my-1">
                  <div
                    className="w-13 h-13 border-2 border-black flex items-center justify-center shrink-0 overflow-hidden relative"
                    style={{ backgroundColor: station.color || '#201f1f' }}
                  >
                    {station.logoUrl ? (
                      <img
                        src={station.logoUrl}
                        alt={station.name}
                        className="w-full h-full object-cover"
                        onError={e => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="material-symbols-outlined text-white text-2xl">
                        radio
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-mono-tech text-sm font-black text-white truncate group-hover:text-[#4edea3]">
                      {station.name}
                    </h3>
                    <p className="text-xs text-[#bbcabf] truncate font-['Inter'] mt-0.5">
                      {station.country} • {station.genre}
                    </p>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/80">
                  <div className="flex items-center gap-1 font-mono-tech text-[9px] text-[#bbcabf]">
                    <span className="bg-black px-1.5 py-0.5 text-[#06B6D4] font-bold">
                      {station.format}
                    </span>
                    {station.bitrate > 0 && (
                      <span className="bg-black px-1.5 py-0.5 text-[#F59E0B] font-bold">
                        {station.bitrate}K
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onSelectStation(station);
                    }}
                    className={`neo-button px-3 py-1 font-mono-tech text-[10px] font-black uppercase border-2 border-black flex items-center gap-1 cursor-pointer ${
                      isCurrent && isPlaying
                        ? 'bg-[#201f1f] text-white'
                        : isCurrent && playbackStatus === 'error'
                        ? 'bg-[#EF4444] text-white hover:bg-[#dc2626]'
                        : isCurrent && playbackStatus === 'buffering'
                        ? 'bg-[#F59E0B] text-black'
                        : 'bg-[#4edea3] hover:bg-[#38c98e] text-[#003824]'
                    }`}
                  >
                    {isCurrent && playbackStatus === 'buffering' ? (
                      <>
                        <span className="material-symbols-outlined text-xs animate-spin">
                          progress_activity
                        </span>
                        <span>CONECTANDO</span>
                      </>
                    ) : isCurrent && playbackStatus === 'error' ? (
                      <>
                        <span className="material-symbols-outlined text-xs">refresh</span>
                        <span>REINTENTAR</span>
                      </>
                    ) : isCurrent && isPlaying ? (
                      <>
                        <span className="material-symbols-outlined text-xs">pause</span>
                        <span>PAUSAR</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-xs">play_arrow</span>
                        <span>SINTONIZAR</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
