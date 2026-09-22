import React, { useState } from 'react';
import { GENRES_LIST } from '../services/stationsData';
import { RadioStation } from '../types/radio';
import { getStationsByTag } from '../services/radioBrowserApi';

interface GenresViewProps {
  stations: RadioStation[];
  onSelectStation: (station: RadioStation) => void;
  onFilterByGenre: (genre: string) => void;
  favorites?: string[];
  onToggleFavorite?: (id: string, station?: RadioStation) => void;
}

export const GenresView: React.FC<GenresViewProps> = ({
  stations,
  onSelectStation,
  favorites = [],
  onToggleFavorite,
}) => {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [genreStations, setGenreStations] = useState<RadioStation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectGenreCard = async (genreId: string) => {
    setSelectedGenre(genreId);
    setIsLoading(true);
    try {
      const results = await getStationsByTag(genreId, 40);
      if (results.length > 0) {
        setGenreStations(results);
      } else {
        setGenreStations(
          stations.filter(s => s.genre.toLowerCase().includes(genreId.toLowerCase()))
        );
      }
    } catch {
      setGenreStations(
        stations.filter(s => s.genre.toLowerCase().includes(genreId.toLowerCase()))
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Title */}
      <div>
        <h1 className="font-black text-2xl md:text-4xl text-white uppercase tracking-tighter mb-1.5">
          Explorar por Géneros Musicales
        </h1>
        <p className="font-mono-tech text-xs md:text-sm text-[#bbcabf]">
          Sintoniza frecuencias clasificadas por estilo sonoro en tiempo real desde Radio Browser API.
        </p>
      </div>

      {/* Genres Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {GENRES_LIST.map(genre => {
          const isSelected = selectedGenre === genre.id;
          return (
            <div
              key={genre.id}
              className={`neo-card p-4 flex flex-col justify-between min-h-[140px] cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#4edea3] shadow-[4px_4px_0px_0px_rgba(78,222,163,1)] bg-[#201f1f]'
                  : 'hover:bg-[#201f1f]'
              }`}
              onClick={() => handleSelectGenreCard(genre.id)}
            >
              <div className="flex justify-between items-start">
                <div
                  className="w-10 h-10 border-2 border-black flex items-center justify-center text-black"
                  style={{ backgroundColor: genre.color }}
                >
                  <span className="material-symbols-outlined text-2xl">{genre.icon}</span>
                </div>
                <span className="font-mono-tech text-[10px] font-bold text-white bg-[#131313] border-2 border-black px-2 py-0.5">
                  LIVE API
                </span>
              </div>

              <div className="mt-3">
                <h3 className="font-black text-lg text-white uppercase tracking-tight">
                  {genre.name}
                </h3>
                <div className="flex items-center justify-between mt-1 font-mono-tech text-xs text-[#4edea3]">
                  <span>Explorar categoría</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Genre Stations Results */}
      {selectedGenre && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
            <h2 className="font-black text-xl text-white uppercase tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#4edea3] rounded-full"></span>
              Emisoras en Vivo: <span className="text-[#4edea3] uppercase">{selectedGenre}</span>
            </h2>
            {isLoading && (
              <span className="font-mono-tech text-xs text-[#4edea3] animate-pulse">
                Cargando emisoras...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {genreStations.map(st => (
              <div
                key={st.id}
                onClick={() => onSelectStation(st)}
                className="neo-card p-3.5 flex items-center gap-3.5 cursor-pointer hover:bg-[#201f1f]"
              >
                <div
                  className="w-12 h-12 border-2 border-black flex items-center justify-center shrink-0 text-white font-mono-tech font-bold text-xs"
                  style={{ backgroundColor: st.color || '#201f1f' }}
                >
                  {st.logoUrl ? (
                    <img
                      src={st.logoUrl}
                      alt={st.name}
                      className="w-full h-full object-cover"
                      onError={e => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    st.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-mono-tech text-sm font-bold text-white truncate">
                    {st.name}
                  </h4>
                  <p className="text-xs text-[#bbcabf] truncate font-['Inter']">
                    {st.country} • {st.format} {st.bitrate ? `${st.bitrate}k` : ''}
                  </p>
                </div>
                {onToggleFavorite && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onToggleFavorite(st.id, st);
                    }}
                    className="p-1 hover:text-[#EF4444] transition-colors cursor-pointer"
                    title={favorites.includes(st.id) ? 'Quitar de favoritas' : 'Añadir a favoritas'}
                  >
                    <span
                      className={`material-symbols-outlined text-xl ${
                        favorites.includes(st.id) ? 'text-[#EF4444]' : 'text-[#86948a]'
                      }`}
                      style={favorites.includes(st.id) ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      favorite
                    </span>
                  </button>
                )}
                <span className="material-symbols-outlined text-[#4edea3] text-2xl">
                  play_circle
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
