import { useState, useEffect, useRef, useMemo } from 'react';
import { RadioStation, TabType, PlaybackStatus } from './types/radio';
import { INITIAL_STATIONS } from './services/stationsData';
import { TopAppBar } from './components/TopAppBar';
import { SideNav } from './components/SideNav';
import { BottomNavBar } from './components/BottomNavBar';
import { GlobalPlayerBar } from './components/GlobalPlayerBar';
import { DiscoverView } from './components/DiscoverView';
import { FavoritesView } from './components/FavoritesView';
import { TuningModal } from './components/TuningModal';
import { SettingsModal } from './components/SettingsModal';
import { ShaderBackground } from './components/ShaderBackground';
import { CarModeView } from './components/CarModeView';
import { audioEngine } from './services/audioEngine';
import {
  auth,
  signInWithGoogle,
  logOutUser,
  onAuthStateChanged,
  saveUserPreferencesToFirestore,
  subscribeToUserPreferences,
  User,
} from './services/firebase';

const INITIAL_FAVORITES = ['cope', 'cadena-ser', 'onda-cero', 'rock-fm'];
const EMPTY_ALARMS: never[] = [];

export default function App() {
  const [stations, setStations] = useState<RadioStation[]>(INITIAL_STATIONS);
  const [currentStation, setCurrentStation] = useState<RadioStation>(INITIAL_STATIONS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>('idle');
  const [playbackError, setPlaybackError] = useState<string>('');
  const [volume, setVolume] = useState<number>(0.8);
  const [currentTab, setCurrentTab] = useState<TabType>('descubrir');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [lang, setLang] = useState<'ES' | 'EN'>('ES');

  // Tuning simulation state
  const [isTuning, setIsTuning] = useState<boolean>(false);
  const [tuningStation, setTuningStation] = useState<RadioStation | null>(null);
  const tuningTimeoutRef = useRef<number | null>(null);

  // User Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // PWA Install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // Favorites IDs state
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('radiostream_favs');
      return saved ? JSON.parse(saved) : INITIAL_FAVORITES;
    } catch {
      return INITIAL_FAVORITES;
    }
  });

  // Cached full station objects for favorites (so stations found in search or live API are preserved)
  const [favoriteStationsMap, setFavoriteStationsMap] = useState<Record<string, RadioStation>>(() => {
    try {
      const savedMap = localStorage.getItem('radiostream_fav_objects');
      if (savedMap) {
        return JSON.parse(savedMap);
      }
    } catch {
      // ignore
    }
    const initialMap: Record<string, RadioStation> = {};
    INITIAL_STATIONS.forEach(st => {
      initialMap[st.id] = st;
    });
    return initialMap;
  });

  // Listen to Audio Engine status changes
  useEffect(() => {
    const unsubscribe = audioEngine.onStatusChange((status, errorMsg) => {
      setPlaybackStatus(status);
      if (status === 'playing') {
        setIsPlaying(true);
        setPlaybackError('');
      } else if (status === 'error') {
        setIsPlaying(false);
        setPlaybackError(errorMsg || 'Emisora no disponible');
      } else if (status === 'idle') {
        setIsPlaying(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  // Listen to Firestore preferences when logged in
  const isIncomingUpdateRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    setIsSyncing(true);
    const unsubscribeFirestore = subscribeToUserPreferences(user.uid, data => {
      setIsSyncing(false);
      if (data) {
        isIncomingUpdateRef.current = true;
        if (Array.isArray(data.favorites)) {
          setFavorites(data.favorites);
        }
        if (Array.isArray(data.favoriteStationObjects) && data.favoriteStationObjects.length > 0) {
          setFavoriteStationsMap(prev => {
            const next = { ...prev };
            data.favoriteStationObjects.forEach((st: RadioStation) => {
              if (st && st.id) next[st.id] = st;
            });
            try {
              localStorage.setItem('radiostream_fav_objects', JSON.stringify(next));
            } catch {
              // ignore
            }
            return next;
          });
        }
        setTimeout(() => {
          isIncomingUpdateRef.current = false;
        }, 300);
      }
    });

    return () => unsubscribeFirestore();
  }, [user]);

  // Persist favorites to local storage & Firestore
  useEffect(() => {
    try {
      localStorage.setItem('radiostream_favs', JSON.stringify(favorites));
      localStorage.setItem('radiostream_fav_objects', JSON.stringify(favoriteStationsMap));
    } catch {
      // ignore
    }

    if (user && !isIncomingUpdateRef.current) {
      saveUserPreferencesToFirestore(user.uid, {
        favorites,
        favoriteStationObjects: Object.values(favoriteStationsMap),
        alarms: EMPTY_ALARMS,
      }).catch(err => console.warn('Firestore sync background notice:', err));
    }
  }, [favorites, favoriteStationsMap, user]);

  // Audio volume sync
  useEffect(() => {
    audioEngine.setVolume(volume);
  }, [volume]);

  // Google Sign In / Sign Out Handlers
  const handleLoginWithGoogle = async () => {
    try {
      const loggedUser = await signInWithGoogle();
      if (loggedUser) {
        await saveUserPreferencesToFirestore(loggedUser.uid, {
          favorites,
          favoriteStationObjects: Object.values(favoriteStationsMap),
          alarms: EMPTY_ALARMS,
        });
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logOutUser();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Tune to station
  const handleTuneToStation = (station: RadioStation, showTuningOverlay = true) => {
    if (tuningTimeoutRef.current) {
      clearTimeout(tuningTimeoutRef.current);
    }

    setStations(prev => {
      if (!prev.some(s => s.id === station.id)) {
        return [station, ...prev];
      }
      return prev;
    });

    if (favorites.includes(station.id)) {
      setFavoriteStationsMap(prev => ({
        ...prev,
        [station.id]: station,
      }));
    }

    setPlaybackError('');
    setCurrentStation(station);

    if (showTuningOverlay) {
      setTuningStation(station);
      setIsTuning(true);
      tuningTimeoutRef.current = window.setTimeout(() => {
        setIsTuning(false);
        setTuningStation(null);
      }, 700);
    }

    audioEngine.updateMediaMetadata(station);
    audioEngine.playStream(station.streamUrl);
  };

  const handleCancelTuning = () => {
    if (tuningTimeoutRef.current) {
      clearTimeout(tuningTimeoutRef.current);
    }
    setIsTuning(false);
    setTuningStation(null);
    audioEngine.stop();
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      audioEngine.stop();
      setIsPlaying(false);
    } else {
      if (currentStation) {
        handleTuneToStation(currentStation, false);
      }
    }
  };

  const handlePrevStation = () => {
    const list = favoriteStationObjects.length > 0 ? favoriteStationObjects : stations;
    if (list.length === 0) return;
    const currentIndex = list.findIndex(s => s.id === currentStation.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : list.length - 1;
    handleTuneToStation(list[prevIndex]);
  };

  const handleNextStation = () => {
    const list = favoriteStationObjects.length > 0 ? favoriteStationObjects : stations;
    if (list.length === 0) return;
    const currentIndex = list.findIndex(s => s.id === currentStation.id);
    const nextIndex = currentIndex !== -1 && currentIndex < list.length - 1 ? currentIndex + 1 : 0;
    handleTuneToStation(list[nextIndex]);
  };

  // Favorite toggle handler supporting both ID and full station object
  const handleToggleFavorite = (
    stationOrId: string | RadioStation,
    explicitStation?: RadioStation
  ) => {
    const stationId = typeof stationOrId === 'string' ? stationOrId : stationOrId.id;
    const stationObj =
      explicitStation ||
      (typeof stationOrId === 'object' ? stationOrId : null) ||
      favoriteStationsMap[stationId] ||
      stations.find(s => s.id === stationId) ||
      INITIAL_STATIONS.find(s => s.id === stationId);

    setFavorites(prev => {
      const isFav = prev.includes(stationId);
      const nextFavorites = isFav
        ? prev.filter(id => id !== stationId)
        : [...prev, stationId];

      setFavoriteStationsMap(prevMap => {
        const nextMap = { ...prevMap };
        if (isFav) {
          delete nextMap[stationId];
        } else if (stationObj) {
          nextMap[stationId] = stationObj;
        }

        try {
          localStorage.setItem('radiostream_fav_objects', JSON.stringify(nextMap));
        } catch {
          // ignore
        }

        if (user && !isIncomingUpdateRef.current) {
          saveUserPreferencesToFirestore(user.uid, {
            favorites: nextFavorites,
            favoriteStationObjects: Object.values(nextMap),
            alarms: EMPTY_ALARMS,
          }).catch(console.error);
        }

        return nextMap;
      });

      return nextFavorites;
    });
  };

  const favoriteStationObjects = useMemo(() => {
    return favorites
      .map(id => {
        return (
          favoriteStationsMap[id] ||
          stations.find(s => s.id === id) ||
          INITIAL_STATIONS.find(s => s.id === id)
        );
      })
      .filter((s): s is RadioStation => Boolean(s));
  }, [favorites, favoriteStationsMap, stations]);

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] flex flex-col font-['Inter'] relative selection:bg-[#8B5CF6] selection:text-white">
      {/* Clean Subtle Background */}
      <ShaderBackground />

      {/* Top App Bar with Google Login / Logout & Live API Badge */}
      <TopAppBar
        currentTab={currentTab}
        onSelectTab={tab => setCurrentTab(tab)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        lang={lang}
        onToggleLang={() => setLang(l => (l === 'ES' ? 'EN' : 'ES'))}
        user={user}
        onLoginWithGoogle={handleLoginWithGoogle}
        onLogout={handleLogout}
        isSyncing={isSyncing}
      />

      {/* Main Layout Container */}
      <div className="flex flex-1 relative z-10">
        {/* Desktop Side Navigation */}
        <SideNav
          currentTab={currentTab}
          onSelectTab={tab => setCurrentTab(tab)}
          favoritesCount={favorites.length}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full pb-36 md:pb-28">
          {currentTab === 'descubrir' && (
            <DiscoverView
              currentStation={currentStation}
              isPlaying={isPlaying}
              playbackStatus={playbackStatus}
              errorMessage={playbackError}
              onSelectStation={st => handleTuneToStation(st)}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              initialStations={stations}
              onInstallPWA={handleInstallPWA}
              isInstallable={isInstallable}
            />
          )}

          {currentTab === 'favoritas' && (
            <FavoritesView
              favoriteStations={favoriteStationObjects}
              currentStation={currentStation}
              isPlaying={isPlaying}
              playbackStatus={playbackStatus}
              errorMessage={playbackError}
              onSelectStation={st => handleTuneToStation(st)}
              onToggleFavorite={handleToggleFavorite}
              onNavigateToDiscover={() => setCurrentTab('descubrir')}
            />
          )}
        </main>
      </div>

      {currentTab === 'coche' && (
        <CarModeView
          currentStation={currentStation}
          isPlaying={isPlaying}
          playbackStatus={playbackStatus}
          onTogglePlay={handleTogglePlay}
          onNextStation={handleNextStation}
          onPrevStation={handlePrevStation}
          onExitCarMode={() => setCurrentTab('descubrir')}
          volume={volume}
          onVolumeChange={val => {
            setVolume(val);
            audioEngine.setVolume(val);
          }}
        />
      )}

      {/* Global Fixed Player Bar */}
      <GlobalPlayerBar
        currentStation={currentStation}
        isPlaying={isPlaying}
        playbackStatus={playbackStatus}
        errorMessage={playbackError}
        onTogglePlay={handleTogglePlay}
        onPrevStation={handlePrevStation}
        onNextStation={handleNextStation}
        volume={volume}
        onVolumeChange={setVolume}
        isFavorite={favorites.includes(currentStation.id)}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Mobile Bottom Navigation Bar */}
      <BottomNavBar
        currentTab={currentTab}
        onSelectTab={tab => setCurrentTab(tab)}
      />

      {/* Tuning Modal */}
      <TuningModal
        isOpen={isTuning}
        station={tuningStation}
        onCancel={handleCancelTuning}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        lang={lang}
        onToggleLang={() => setLang(l => (l === 'ES' ? 'EN' : 'ES'))}
        favoritesCount={favorites.length}
        alarmsCount={0}
      />
    </div>
  );
}
