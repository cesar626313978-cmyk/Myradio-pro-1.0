import React, { useState } from 'react';
import { COUNTRIES_LIST } from '../services/stationsData';
import { RadioStation } from '../types/radio';
import { getStationsByCountryCode } from '../services/radioBrowserApi';

interface CountriesViewProps {
  stations: RadioStation[];
  onSelectStation: (station: RadioStation) => void;
  onFilterByCountry: (countryName: string) => void;
  favorites?: string[];
  onToggleFavorite?: (id: string, station?: RadioStation) => void;
}

export const CountriesView: React.FC<CountriesViewProps> = ({
  stations,
  onSelectStation,
  favorites = [],
  onToggleFavorite,
}) => {
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [countryStations, setCountryStations] = useState<RadioStation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectCountry = async (code: string) => {
    setSelectedCountryCode(code);
    setIsLoading(true);
    try {
      const results = await getStationsByCountryCode(code, 40);
      if (results.length > 0) {
        setCountryStations(results);
      } else {
        setCountryStations(
          stations.filter(s => s.countryCode.toUpperCase() === code.toUpperCase())
        );
      }
    } catch {
      setCountryStations(
        stations.filter(s => s.countryCode.toUpperCase() === code.toUpperCase())
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
          Emisoras del Mundo
        </h1>
        <p className="font-mono-tech text-xs md:text-sm text-[#bbcabf]">
          Transmisiones directas de radios públicas y privadas de más de 180 países.
        </p>
      </div>

      {/* Countries Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {COUNTRIES_LIST.map(country => {
          const isSelected = selectedCountryCode === country.code;
          return (
            <div
              key={country.code}
              onClick={() => handleSelectCountry(country.code)}
              className={`neo-card p-4 flex flex-col justify-between min-h-[130px] cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#8B5CF6] shadow-[4px_4px_0px_0px_rgba(139,92,246,1)] bg-[#201f1f]'
                  : 'hover:bg-[#201f1f]'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-3xl">{country.flag}</span>
                <span className="font-mono-tech text-xs font-bold text-white bg-[#131313] border-2 border-black px-2 py-0.5">
                  {country.code}
                </span>
              </div>

              <div className="mt-2">
                <h3 className="font-black text-base text-white uppercase tracking-tight truncate">
                  {country.name}
                </h3>
                <div className="flex items-center justify-between font-mono-tech text-xs text-[#8B5CF6] mt-1">
                  <span>Sintonizar país</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Country Stations List */}
      {selectedCountryCode && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
            <h2 className="font-black text-xl text-white uppercase tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#8B5CF6] rounded-full"></span>
              Emisoras en Vivo: <span className="text-[#8B5CF6]">{selectedCountryCode}</span>
            </h2>
            {isLoading && (
              <span className="font-mono-tech text-xs text-[#8B5CF6] animate-pulse">
                Consultando API de radios...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {countryStations.map(st => (
              <div
                key={st.id}
                onClick={() => onSelectStation(st)}
                className="neo-card p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#201f1f]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 border-2 border-black flex items-center justify-center shrink-0 font-mono-tech text-xs font-bold text-white"
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
                      st.countryCode
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-mono-tech text-sm font-bold text-white truncate">
                      {st.name}
                    </h4>
                    <p className="text-xs text-[#bbcabf] truncate font-['Inter']">
                      {st.genre} • {st.format}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
