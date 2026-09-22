import { useState, useEffect, useRef, useMemo } from 'react';
import { RadioStation, Alarm, SleepTimerState, TelemetryStats, TabType, PlaybackStatus } from './types/radio';
import { INITIAL_STATIONS } from './services/stationsData';
import { TopAppBar } from './components/TopAppBar';
import { SideNav } from './components/SideNav';
import { BottomNavBar } from './components/BottomNavBar';
import { GlobalPlayerBar } from './components/GlobalPlayerBar';
import { DiscoverView } from './components/DiscoverView';
import { FavoritesView } from './components/FavoritesView';
import { AlarmsView } from './components/AlarmsView';
import { DashboardView } from './components/DashboardView';
import { GenresView } from './components/GenresView';
import { CountriesView } from './components/CountriesView';
import { CarModeView } from './components/CarModeView';
import { TuningModal } from './components/TuningModal';
import { SettingsModal } from './components/SettingsModal';
import { ShaderBackground } from './components/ShaderBackground';
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

const INITIAL_ALARMS: Alarm[] = [
  {
    id: 'alarm-1',
    time: '07:30',
    days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
    stationId: 'cope',
    stationName: 'COPE (Cadena de Ondas Populares Españolas)',
    active: true,
    label: 'Despertador Noticias',
    volume: 85,
  },
  {
    id: 'alarm-2',
    time: '09:00',
    days: ['Sáb', 'Dom'],
    stationId: 'rock-fm',
    stationName: 'Rock FM',
    active: false,
    label: 'Fin de semana Rock',
    volume: 75,
  },
];

export default function App() {
  const [stations, setStations] = useState<RadioStation[]>(INITIAL_STATIONS);
  const [currentStation, setCurrentStation] = useState<RadioStation>(INITIAL_STATIONS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>('idle');
  const [playbackError, setPlaybackError] = useState<string>('');
  const [volume, setVolume] = useState<number>(0.8);
  const [currentTab, setCurrentTab] = useState<TabType>('descubrir');
  const [isCarMode, setIsCarMode] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [lang, setLang] = useState<'ES' | 'EN'>('ES');

  // Tuning simulation state
  const [isTuning, setIsTuning] = useState<boolean>(false);
  const [tuningStation, setTuningStation] = useState<RadioStation | null>(null);
  const tuningTimeoutRef = useRef<number | null>(null);

  // User Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

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

  // Alarms state
  const [alarms, setAlarms] = useState<Alarm[]>(() => {
    try {
      const saved = localStorage.getItem('radiostream_alarms');
      return saved ? JSON.parse(saved) : INITIAL_ALARMS;
    } catch {
      return INITIAL_ALARMS;
    }
  });

  // Sleep Timer state
  const [sleepTimer, setSleepTimer] = useState<SleepTimerState>({
    durationMinutes: 45,
    remainingSeconds: 45 * 60,
    active: false,
    fadeOutEnabled: true,
  });

  // Telemetry statistics
  const [telemetryStats, setTelemetryStats] = useState<TelemetryStats>({
    daysActive: 14,
    totalMinutesListened: 1420,
    connectionsCount: 84,
    historyMatrix: [],
    currentBitrate: 128,
    currentLatency: 42,
  });

  // Alarm triggered banner
  const [triggeredAlarm, setTriggeredAlarm] = useState<Alarm | null>(null);

  // Listen to Audio Engine status changes (eliminates gong sound, supports 6.5s timeout)
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
        if (Array.isArray(data.alarms) && data.alarms.length > 0) {
          setAlarms(data.alarms);
        }
        setTimeout(() => {
          isIncomingUpdateRef.current = false;
        }, 300);
      }
    });

    return () => unsubscribeFirestore();
  }, [user]);

  // Persist favorites & alarms to local storage & Firestore (debounced, no telemetry write loops)
  useEffect(() => {
    try {
      localStorage.setItem('radiostream_favs', JSON.stringify(favorites));
      localStorage.setItem('radiostream_fav_objects', JSON.stringify(favoriteStationsMap));
      localStorage.setItem('radiostream_alarms', JSON.stringify(alarms));
    } catch {
      // ignore
    }

    if (user && !isIncomingUpdateRef.current) {
      saveUserPreferencesToFirestore(user.uid, {
        favorites,
        favoriteStationObjects: Object.values(favoriteStationsMap),
        alarms,
      }).catch(err => console.warn('Firestore sync background notice:', err));
    }
  }, [favorites, favoriteStationsMap, alarms, user]);

  // Audio volume sync
  useEffect(() => {
    audioEngine.setVolume(volume);
  }, [volume]);

  // Minute counter for telemetry when playing
  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setTelemetryStats(prev => ({
          ...prev,
          totalMinutesListened: prev.totalMinutesListened + 1,
        }));
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Sleep timer countdown logic
  useEffect(() => {
    let interval: number;
    if (sleepTimer.active && sleepTimer.remainingSeconds > 0) {
      interval = window.setInterval(() => {
        setSleepTimer(prev => {
          if (prev.remainingSeconds <= 1) {
            audioEngine.stop();
            setIsPlaying(false);
            return {
              ...prev,
              remainingSeconds: 0,
              active: false,
            };
          }

          if (prev.remainingSeconds === 300 && prev.fadeOutEnabled) {
            audioEngine.startFadeOut(300);
          }

          return {
            ...prev,
            remainingSeconds: prev.remainingSeconds - 1,
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sleepTimer.active, sleepTimer.remainingSeconds]);

  // Alarm scheduled watcher
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const todayName = dayNames[now.getDay()];

      alarms.forEach(alarm => {
        if (alarm.active && alarm.time === currentTimeStr && alarm.days.includes(todayName)) {
          if (now.getSeconds() < 2) {
            setTriggeredAlarm(alarm);
            const st = stations.find(s => s.id === alarm.stationId);
            if (st) {
              handleTuneToStation(st, false);
            }
          }
        }
      });
    };

    const interval = window.setInterval(checkAlarms, 1000);
    return () => clearInterval(interval);
  }, [alarms, stations]);

  // Google Sign In / Sign Out Handlers
  const handleLoginWithGoogle = async () => {
    try {
      const loggedUser = await signInWithGoogle();
      if (loggedUser) {
        await saveUserPreferencesToFirestore(loggedUser.uid, {
          favorites,
          alarms,
          totalMinutesListened: telemetryStats.totalMinutesListened,
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
        audioEngine.playStream(
          station.streamUrl,
          () => {
            setIsPlaying(true);
            setTelemetryStats(prev => ({
              ...prev,
              connectionsCount: prev.connectionsCount + 1,
              currentBitrate: station.bitrate,
            }));
          },
          (errorMsg) => {
            setIsPlaying(false);
            setPlaybackError(errorMsg || 'Emisora no disponible');
          }
        );
      }, 400);
    } else {
      audioEngine.playStream(
        station.streamUrl,
        () => {
          setIsPlaying(true);
          setTelemetryStats(prev => ({
            ...prev,
            connectionsCount: prev.connectionsCount + 1,
            currentBitrate: station.bitrate,
          }));
        },
        (errorMsg) => {
          setIsPlaying(false);
          setPlaybackError(errorMsg || 'Emisora no disponible');
        }
      );
    }
  };

  const handleCancelTuning = () => {
    if (tuningTimeoutRef.current) {
      clearTimeout(tuningTimeoutRef.current);
    }
    setIsTuning(false);
    setTuningStation(null);
  };

  // Playback handlers
  const handleTogglePlay = () => {
    if (playbackStatus === 'playing' || playbackStatus === 'buffering') {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      setPlaybackError('');
      audioEngine.playStream(
        currentStation.streamUrl,
        () => {
          setIsPlaying(true);
          setTelemetryStats(prev => ({
            ...prev,
            connectionsCount: prev.connectionsCount + 1,
            currentBitrate: currentStation.bitrate,
          }));
        },
        (errorMsg) => {
          setIsPlaying(false);
          setPlaybackError(errorMsg || 'Emisora no disponible');
        }
      );
    }
  };

  const handleStop = () => {
    audioEngine.stop();
    setIsPlaying(false);
  };

  const handlePrevStation = () => {
    const currentIndex = stations.findIndex(s => s.id === currentStation.id);
    const prevIndex = (currentIndex - 1 + stations.length) % stations.length;
    handleTuneToStation(stations[prevIndex]);
  };

  const handleNextStation = () => {
    const currentIndex = stations.findIndex(s => s.id === currentStation.id);
    const nextIndex = (currentIndex + 1) % stations.length;
    handleTuneToStation(stations[nextIndex]);
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
            alarms,
            totalMinutesListened: telemetryStats.totalMinutesListened,
          }).catch(console.error);
        }

        return nextMap;
      });

      return nextFavorites;
    });
  };

  // Alarm management handlers
  const handleToggleAlarm = (id: string) => {
    setAlarms(prev =>
      prev.map(al => (al.id === id ? { ...al, active: !al.active } : al))
    );
  };

  const handleDeleteAlarm = (id: string) => {
    setAlarms(prev => prev.filter(al => al.id !== id));
  };

  const handleSaveAlarm = (alarm: Alarm) => {
    setAlarms(prev => {
      const existing = prev.findIndex(a => a.id === alarm.id);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = alarm;
        return copy;
      }
      return [...prev, alarm];
    });
  };

  // Sleep timer start/stop handlers
  const handleStartSleepTimer = (minutes: number) => {
    setSleepTimer({
      durationMinutes: minutes,
      remainingSeconds: minutes * 60,
      active: true,
      fadeOutEnabled: true,
    });
  };

  const handleStopSleepTimer = () => {
    audioEngine.cancelFadeOut();
    setSleepTimer(prev => ({
      ...prev,
      active: false,
      remainingSeconds: prev.durationMinutes * 60,
    }));
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

  // Dedicated Full-screen Car Mode view (Isolated, No underlying header or widgets)
  if (isCarMode) {
    return (
      <CarModeView
        currentStation={currentStation}
        isPlaying={isPlaying}
        playbackStatus={playbackStatus}
        errorMessage={playbackError}
        onTogglePlay={handleTogglePlay}
        onStop={handleStop}
        volume={volume}
        onVolumeChange={setVolume}
        onClose={() => setIsCarMode(false)}
        favoriteStations={favoriteStationObjects}
        onSelectStation={st => handleTuneToStation(st)}
        onPrevStation={handlePrevStation}
        onNextStation={handleNextStation}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] flex flex-col font-['Inter'] relative selection:bg-[#8B5CF6] selection:text-white">
      {/* Clean Subtle Background (No distortion or noise) */}
      <ShaderBackground />

      {/* Top App Bar with Google Login / Logout & Live API Badge */}
      <TopAppBar
        currentTab={currentTab}
        onSelectTab={tab => {
          setIsCarMode(false);
          setCurrentTab(tab);
        }}
        onToggleCarMode={() => setIsCarMode(true)}
        isCarMode={isCarMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        lang={lang}
        onToggleLang={() => setLang(l => (l === 'ES' ? 'EN' : 'ES'))}
        user={user}
        onLoginWithGoogle={handleLoginWithGoogle}
        onLogout={handleLogout}
        isSyncing={isSyncing}
      />

      {/* Alarm Triggered Banner */}
      {triggeredAlarm && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-[#8B5CF6] text-white p-4 border-3 border-black neo-shadow-lg flex items-center gap-4 max-w-lg w-full animate-bounce">
          <span className="material-symbols-outlined text-3xl">alarm_on</span>
          <div className="flex-1">
            <h4 className="font-black uppercase text-sm">¡Alarma Activada! ({triggeredAlarm.time})</h4>
            <p className="font-mono-tech text-xs truncate">
              Reproduciendo: {triggeredAlarm.stationName}
            </p>
          </div>
          <button
            onClick={() => setTriggeredAlarm(null)}
            className="neo-button bg-black text-white px-3 py-1.5 font-mono-tech text-xs font-bold uppercase"
          >
            Apagar
          </button>
        </div>
      )}

      {/* Main Layout Container */}
      <div className="flex flex-1 relative z-10">
        {/* Desktop Side Navigation */}
        <SideNav
          currentTab={currentTab}
          onSelectTab={tab => {
            setIsCarMode(false);
            setCurrentTab(tab);
          }}
          favoritesCount={favorites.length}
          alarmsCount={alarms.filter(a => a.active).length}
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

          {currentTab === 'alarmas' && (
            <AlarmsView
              alarms={alarms}
              stations={stations}
              onToggleAlarm={handleToggleAlarm}
              onDeleteAlarm={handleDeleteAlarm}
              onSaveAlarm={handleSaveAlarm}
              sleepTimer={sleepTimer}
              onStartSleepTimer={handleStartSleepTimer}
              onStopSleepTimer={handleStopSleepTimer}
              onSelectStation={st => handleTuneToStation(st)}
            />
          )}

          {currentTab === 'historial' && (
            <DashboardView
              stats={telemetryStats}
              stations={stations}
              currentStation={currentStation}
              onSelectStation={st => handleTuneToStation(st)}
              onNavigateToDiscover={() => setCurrentTab('descubrir')}
            />
          )}

          {currentTab === 'generos' && (
            <GenresView
              stations={stations}
              onSelectStation={st => handleTuneToStation(st)}
              onFilterByGenre={() => setCurrentTab('descubrir')}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {currentTab === 'paises' && (
            <CountriesView
              stations={stations}
              onSelectStation={st => handleTuneToStation(st)}
              onFilterByCountry={() => setCurrentTab('descubrir')}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
        </main>
      </div>

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
        onOpenCarMode={() => setIsCarMode(true)}
        isFavorite={favorites.includes(currentStation.id)}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Mobile Bottom Navigation Bar */}
      <BottomNavBar
        currentTab={currentTab}
        onSelectTab={tab => {
          setIsCarMode(false);
          setCurrentTab(tab);
        }}
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
        alarmsCount={alarms.length}
      />
    </div>
  );
}
