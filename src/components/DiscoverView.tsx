import React, { useState, useEffect, useCallback } from 'react';
import { RadioStation, PlaybackStatus } from '../types/radio';
import {
  searchRadioStations,
  getTopVotedStations,
  getStationsByTag,
  getStationsByCountryCode,
} from '../services/radioBrowserApi';

interface DiscoverViewProps {
  currentStation: RadioStation | null;
  isPlaying: boolean;
  playbackStatus?: PlaybackStatus;
  errorMessage?: string;
  onSelectStation: (station: RadioStation) => void;
  favorites: string[];
  onToggleFavorite: (id: string, station?: RadioStation) => void;
  initialStations?: RadioStation[];
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  currentStation,
  isPlaying,
  playbackStatus = 'idle',
  errorMessage,
  onSelectStation,
  favorites,
  onToggleFavorite,
  initialStations = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [stations, setStations] = useState<RadioStation[]>(initialStations);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const filterChips = [
    { label: 'TOP VOTED', color: '#4edea3', value: 'top' },
    { label: 'ESPAÑA', color: '#EF4444', countryCode: 'ES' },
    { label: '80S', color: '#F43F5E', value: '80s' },
    { label: 'NEWS / NOTICIAS', color: '#06B6D4', value: 'news' },
    { label: 'JAZZ', color: '#F59E0B', value: 'jazz' },
    { label: 'ELECTRONIC / DANCE', color: '#84CC16', value: 'electronic' },
    { label: 'ROCK', color: '#8B5CF6', value: 'rock' },
    { label: 'POP', color: '#EC4899', value: 'pop' },
    { label: 'LO-FI / RELAX', color: '#14B8A6', value: 'lofi' },
    { label: 'CLASSICAL', color: '#A855F7', value: 'classical' },
  ];

  // Perform search against open Radio Browser API
  const performSearch = useCallback(
    async (queryText: string, tagVal: string | null, countryCodeVal: string | null) => {
      setIsLoading(true);
      setApiError(null);

      try {
        let results: RadioStation[] = [];

        if (queryText.trim().length > 0) {
          results = await searchRadioStations({
            query: queryText.trim(),
            tag: tagVal && tagVal !== 'top' ? tagVal : undefined,
            countrycode: countryCodeVal || undefined,
            limit: 60,
          });
        } else if (countryCodeVal) {
          results = await getStationsByCountryCode(countryCodeVal, 60);
        } else if (tagVal && tagVal !== 'top') {
          results = await getStationsByTag(tagVal, 60);
        } else {
          results = await getTopVotedStations(60);
        }

        if (results.length > 0) {
          setStations(results);
        } else if (queryText.trim().length > 0) {
          setStations([]);
        } else if (initialStations.length > 0) {
          setStations(initialStations);
        }
      } catch (err) {
        console.error('Radio Browser query error:', err);
        setApiError('No se pudo conectar a Radio Browser API. Mostrando emisoras guardadas.');
        if (initialStations.length > 0) setStations(initialStations);
      } finally {
        setIsLoading(false);
      }
    },
    [initialStations]
  );

  // Initial load
  useEffect(() => {
    performSearch('', 'top', null);
  }, [performSearch]);

  // Debounced typing handler
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const timer = setTimeout(() => {
      performSearch(searchQuery, selectedTag, selectedCountry);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedTag, selectedCountry, performSearch]);

  const handleSelectTag = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
      performSearch(searchQuery, null, selectedCountry);
    } else {
      setSelectedTag(tag);
      setSelectedCountry(null);
      performSearch(searchQuery, tag, null);
    }
  };

  const handleSelectCountry = (code: string) => {
    if (selectedCountry === code) {
      setSelectedCountry(null);
      performSearch(searchQuery, selectedTag, null);
    } else {
      setSelectedCountry(code);
      setSelectedTag(null);
      performSearch(searchQuery, null, code);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery, selectedTag, selectedCountry);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Title & Description */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-black text-3xl md:text-5xl text-white uppercase tracking-tighter font-['Inter']">
            DESCUBRIR EMISORAS
          </h1>
          <span className="bg-[#4edea3] text-[#003824] text-xs font-black font-mono-tech px-2.5 py-1 border-2 border-black">
            30.000+ EN VIVO
          </span>
        </div>
        <p className="font-mono-tech text-xs md:text-sm text-[#bbcabf] mt-1">
          Buscador conectado a la base de datos abierta de radio mundial.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleFormSubmit} className="relative flex items-center w-full">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#bbcabf] text-2xl pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar emisora por nombre, dial o frecuencia (ej. Cope, Cadena SER, RockFM, BBC)..."
            className="w-full bg-[#1A1A1A] border-3 border-black text-white pl-12 pr-10 py-3.5 font-mono-tech text-xs sm:text-sm placeholder:text-[#86948a] focus:outline-none focus:border-[#4edea3] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                performSearch('', selectedTag, selectedCountry);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbcabf] hover:text-white p-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
        <button
          type="submit"
          className="neo-button ml-2 sm:ml-3 bg-[#4edea3] hover:bg-[#38c98e] text-[#003824] px-4 sm:px-6 py-3.5 font-mono-tech font-black text-xs sm:text-sm uppercase border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer shrink-0"
        >
          Buscar
        </button>
      </form>

      {/* Filter Quick Chips */}
      <div className="flex flex-wrap gap-2">
        {filterChips.map(chip => {
          const isSelected = chip.countryCode
            ? selectedCountry === chip.countryCode
            : selectedTag === chip.value;

          return (
            <button
              key={chip.label}
              onClick={() => {
                if (chip.countryCode) {
                  handleSelectCountry(chip.countryCode);
                } else if (chip.value) {
                  handleSelectTag(chip.value);
                }
              }}
              className={`neo-button px-3 py-1.5 font-mono-tech text-xs font-bold uppercase transition-all border-2 border-black flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-[#201f1f] text-[#e5e2e1] hover:bg-[#353534] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: chip.color }} />
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* API Notice / Error */}
      {apiError && (
        <div className="bg-[#EF4444]/20 border-2 border-[#EF4444] p-3 text-xs font-mono-tech text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[#EF4444]">error</span>
          <span>{apiError}</span>
        </div>
      )}

      {/* Stations Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#1A1A1A] border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <span className="material-symbols-outlined text-4xl text-[#4edea3] animate-spin mb-3">
            sync
          </span>
          <p className="font-mono-tech text-xs text-[#bbcabf] uppercase tracking-wider">
            Sintonizando catálogo global...
          </p>
        </div>
      ) : stations.length === 0 ? (
        <div className="p-12 text-center bg-[#1A1A1A] border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <span className="material-symbols-outlined text-5xl text-[#86948a] mb-2">
            search_off
          </span>
          <h3 className="font-black text-lg text-white uppercase">
            No se encontraron emisoras para &quot;{searchQuery}&quot;
          </h3>
          <p className="font-mono-tech text-xs text-[#bbcabf] mt-1">
            Prueba a buscar con otro término o selecciona una de las etiquetas sugeridas.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedTag('top');
              setSelectedCountry(null);
              performSearch('', 'top', null);
            }}
            className="neo-button mt-4 bg-[#4edea3] text-[#003824] px-4 py-2 font-mono-tech text-xs font-black uppercase border-2 border-black"
          >
            Restablecer Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stations.map(station => {
            const isCurrent = currentStation?.id === station.id;
            const isFav = favorites.includes(station.id);

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
                {/* Top Status Header inside card */}
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
                    className="text-[#bbcabf] hover:text-[#EF4444] p-1 cursor-pointer transition-colors"
                    title={isFav ? 'Quitar de favoritas' : 'Añadir a favoritas'}
                  >
                    <span
                      className={`material-symbols-outlined text-lg ${
                        isFav ? 'text-[#EF4444]' : 'text-[#86948a]'
                      }`}
                      style={isFav ? { fontVariationSettings: "'FILL' 1" } : {}}
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

                {/* Bottom Bar: Format, Bitrate, Play Action */}
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
