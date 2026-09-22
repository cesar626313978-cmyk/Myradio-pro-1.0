import React, { useState, useEffect, useMemo } from 'react';
import { RadioStation, PlaybackStatus } from '../types/radio';
import { INITIAL_STATIONS } from '../services/stationsData';
import { searchRadioStations, getTopVotedStations, getStationsByTag } from '../services/radioBrowserApi';

interface DiscoverViewProps {
  currentStation: RadioStation | null;
  isPlaying: boolean;
  playbackStatus?: PlaybackStatus;
  errorMessage?: string;
  onSelectStation: (station: RadioStation) => void;
  favorites: string[];
  onToggleFavorite: (id: string, station?: RadioStation) => void;
  initialStations?: RadioStation[];
  onInstallPWA?: () => void;
  isInstallable?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Todas: '#4edea3',
  News: '#06B6D4',
  Pop: '#EC4899',
  Rock: '#8B5CF6',
  Electronic: '#84CC16',
  '80s': '#F43F5E',
  Jazz: '#F59E0B',
  'Lo-Fi': '#14B8A6',
  Latin: '#10B981',
  Techno: '#A855F7',
  Eclectic: '#F97316',
  'J-Pop': '#E11D48',
};

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  currentStation,
  isPlaying,
  playbackStatus = 'idle',
  onSelectStation,
  favorites,
  onToggleFavorite,
  initialStations = [],
  onInstallPWA,
  isInstallable,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  const [stations, setStations] = useState<RadioStation[]>(
    initialStations.length > 0 ? initialStations : INITIAL_STATIONS
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const availableCategories = useMemo(() => {
    return ['Todas', 'News', 'Pop', 'Rock', 'Electronic', '80s', 'Jazz', 'Lo-Fi', 'Latin', 'Techno', 'Eclectic', 'J-Pop'];
  }, []);

  // Direct internet search on Radio Browser API (30,000+ stations) with 400ms debounce
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setSearchError(null);

      try {
        let results: RadioStation[] = [];
        const query = searchQuery.trim();
        const tag = selectedCategory !== 'Todas' ? selectedCategory : '';

        if (query) {
          results = await searchRadioStations({
            query,
            tag,
            limit: 60,
          });
        } else if (tag) {
          results = await getStationsByTag(tag, 60);
        } else {
          results = await getTopVotedStations(60);
        }

        if (!isMounted) return;

        if (results && results.length > 0) {
          setStations(results);
        } else if (query) {
          // Fallback to local filter if online search yields nothing
          const base = initialStations.length > 0 ? initialStations : INITIAL_STATIONS;
          const fallback = base.filter(
            st =>
              st.name.toLowerCase().includes(query.toLowerCase()) ||
              st.genre.toLowerCase().includes(query.toLowerCase()) ||
              st.country.toLowerCase().includes(query.toLowerCase())
          );
          setStations(fallback);
          if (fallback.length === 0) {
            setSearchError(`No se encontraron emisoras en directo para "${query}".`);
          }
        } else {
          setStations(initialStations.length > 0 ? initialStations : INITIAL_STATIONS);
        }
      } catch (err) {
        console.error('Error fetching online stations:', err);
        if (isMounted) {
          const base = initialStations.length > 0 ? initialStations : INITIAL_STATIONS;
          setStations(base);
          setSearchError('Catálogo local activo (sin conexión con Radio Browser).');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedCategory, initialStations]);

  // Prioritize user favorites at the top of the search/browse results
  const sortedStations = useMemo(() => {
    const list = [...stations];
    list.sort((a, b) => {
      const aIsFav = favorites.includes(a.id) ? 1 : 0;
      const bIsFav = favorites.includes(b.id) ? 1 : 0;
      if (aIsFav !== bIsFav) {
        return bIsFav - aIsFav; // Favorites first
      }
      return 0; // maintain vote/relevance order
    });
    return list;
  }, [stations, favorites]);

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Todas');
    setSearchError(null);
  };

  return (
    <div className="flex flex-col gap-2.5 sm:gap-3.5 max-w-7xl mx-auto w-full">
      {/* Minimalist PWA Top Bar: Ultra-compact, zero wasted vertical space */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
          <h2 className="font-mono-tech text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
            Emisoras en Vivo (30.000+ Online)
          </h2>
          <span className="text-[10px] font-mono-tech px-1.5 py-0.5 bg-[#1A1A1A] border border-black text-[#4edea3] font-bold">
            {sortedStations.length}
          </span>
        </div>

        {/* In-App PWA Install Trigger */}
        {isInstallable && onInstallPWA && (
          <button
            type="button"
            onClick={onInstallPWA}
            className="neo-button bg-[#4edea3] hover:bg-[#38c98e] text-[#003824] px-2.5 py-1 text-[10px] font-mono-tech font-black uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
            title="Instalar Myradio en la pantalla de inicio"
          >
            <span className="material-symbols-outlined text-xs">download</span>
            <span>Instalar PWA</span>
          </button>
        )}
      </div>

      {/* Streamlined Direct Internet Search Input */}
      <div className="relative flex items-center w-full">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#bbcabf] text-xl pointer-events-none">
          search
        </span>
        <input
          id="realtime-station-search-input"
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Busca cualquier emisora o país en internet (ej. SER, Ibiza, Jazz, Madrid)..."
          className="w-full bg-[#1A1A1A] border-2 border-black text-white pl-10 pr-9 py-2.5 font-mono-tech text-xs sm:text-sm placeholder:text-[#86948a] focus:outline-none focus:border-[#4edea3] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#bbcabf] hover:text-white p-1 cursor-pointer transition-colors"
            title="Borrar búsqueda"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        )}
      </div>

      {/* Horizontal Scrollable Category Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 touch-pan-x">
        {availableCategories.map(cat => {
          const isSelected = selectedCategory === cat;
          const dotColor = CATEGORY_COLORS[cat] || '#8B5CF6';

          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleSelectCategory(cat)}
              className={`neo-button px-2.5 py-1 font-mono-tech text-[11px] font-bold uppercase transition-all border border-black flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                  : 'bg-[#1A1A1A] text-[#e5e2e1] hover:bg-[#282828] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: dotColor }}
              />
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Search Error Notice */}
      {searchError && (
        <div className="bg-[#EF4444]/20 border border-[#EF4444] p-2 text-xs font-mono-tech text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[#EF4444] text-base">info</span>
          <span>{searchError}</span>
        </div>
      )}

      {/* Stations Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-[#1A1A1A] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <span className="material-symbols-outlined text-3xl text-[#4edea3] animate-spin mb-2">
            sync
          </span>
          <p className="font-mono-tech text-xs text-[#bbcabf] uppercase tracking-wider">
            Buscando en la red mundial (30.000+ emisoras)...
          </p>
        </div>
      ) : sortedStations.length === 0 ? (
        /* Empty State */
        <div className="p-6 sm:p-8 text-center bg-[#1A1A1A] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center">
          <span className="material-symbols-outlined text-4xl text-[#86948a] mb-1">
            search_off
          </span>
          <h3 className="font-bold text-sm sm:text-base text-white uppercase">
            Sin resultados
          </h3>
          <p className="font-mono-tech text-xs text-[#bbcabf] mt-1 max-w-xs">
            No se encontraron emisoras en internet para {searchQuery ? `"${searchQuery}"` : selectedCategory}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            <button
              type="button"
              onClick={handleClearFilters}
              className="neo-button bg-[#4edea3] text-[#003824] px-3 py-1.5 font-mono-tech text-[11px] font-black uppercase border border-black cursor-pointer"
            >
              Restablecer filtros
            </button>
          </div>
        </div>
      ) : (
        /* Station Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedStations.map(station => {
            const isCurrent = currentStation?.id === station.id;
            const isFav = favorites.includes(station.id);

            return (
              <div
                key={station.id}
                onClick={() => onSelectStation(station)}
                className={`p-3 sm:p-3.5 flex flex-col justify-between border-2 border-black transition-all cursor-pointer group relative active:scale-[0.99] ${
                  isCurrent
                    ? 'bg-[#201f1f] shadow-[3px_3px_0px_0px_rgba(78,222,163,0.8)] border-[#4edea3]'
                    : isFav
                    ? 'bg-[#1e2321] hover:bg-[#252525] shadow-[3px_3px_0px_0px_rgba(239,68,68,0.4)] border-[#EF4444]/60'
                    : 'bg-[#1A1A1A] hover:bg-[#252525] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                {/* Status Bar inside card */}
                <div className="flex justify-between items-center text-xs font-mono-tech mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {isCurrent ? (
                      playbackStatus === 'buffering' ? (
                        <span className="inline-flex items-center gap-1 text-[#F59E0B] font-bold uppercase text-[9px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-ping" />
                          Conectando...
                        </span>
                      ) : playbackStatus === 'error' ? (
                        <span className="inline-flex items-center gap-1 text-[#EF4444] font-bold uppercase text-[9px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                          No disponible
                        </span>
                      ) : isPlaying ? (
                        <span className="inline-flex items-center gap-1 text-[#4edea3] font-bold uppercase text-[9px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
                          En Directo
                        </span>
                      ) : (
                        <span className="text-[#bbcabf] text-[9px] font-bold">PAUSADA</span>
                      )
                    ) : isFav ? (
                      <span className="inline-flex items-center gap-1 text-[#EF4444] font-bold uppercase text-[9px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                        Favorita ★
                      </span>
                    ) : (
                      <span className="text-[#bbcabf] text-[9px] uppercase font-bold">
                        {station.countryCode || 'RADIO'}
                      </span>
                    )}
                  </div>

                  {/* Favorite Button */}
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
                      className={`material-symbols-outlined text-base ${
                        isFav ? 'text-[#EF4444]' : 'text-[#86948a]'
                      }`}
                      style={isFav ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      favorite
                    </span>
                  </button>
                </div>

                {/* Station Art & Name */}
                <div className="flex items-center gap-2.5 my-0.5">
                  <div
                    className="w-10 h-10 border border-black flex items-center justify-center shrink-0 overflow-hidden relative"
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
                      <span className="material-symbols-outlined text-white text-xl">
                        radio
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-mono-tech text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#4edea3]">
                      {station.name}
                    </h3>
                    <p className="text-[11px] text-[#bbcabf] truncate font-['Inter'] mt-0.5">
                      {station.country} •{' '}
                      <span
                        className="font-bold"
                        style={{ color: CATEGORY_COLORS[station.genre] || '#4edea3' }}
                      >
                        {station.genre}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Bottom Bar: Format, Bitrate, Play Action */}
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-black/60">
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
                    className={`neo-button px-2.5 py-1 font-mono-tech text-[9px] font-black uppercase border border-black flex items-center gap-1 cursor-pointer ${
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
                        <span>PAUSA</span>
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
