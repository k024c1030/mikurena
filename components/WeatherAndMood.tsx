
import React, { useState, useEffect, useCallback } from 'react';
import type { LocationPreference, WeatherData, MoodRecord } from '../types';
import { fetchWeather } from '../services/weatherService';
import ManualLocationModal from './ManualLocationModal';
import MoodPickerModal from './MoodPickerModal';

const LOCATION_PREF_KEY = 'locationPreference';

interface WeatherAndMoodProps {
    moodHistory: MoodRecord[];
    onSaveMood: (record: MoodRecord) => void;
}

const weatherIconMap: Record<string, string> = {
    sun: '☀️',
    cloud: '☁️',
    rain: '🌧️',
    snow: '❄️',
};

const WeatherAndMood: React.FC<WeatherAndMoodProps> = ({ moodHistory, onSaveMood }) => {
    const [locationPref, setLocationPref] = useState<LocationPreference | null>(null);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showManualModal, setShowManualModal] = useState(false);
    const [showMoodModal, setShowMoodModal] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    const today = new Date().toISOString().split('T')[0];
    const todaysMood = moodHistory.find(m => m.date === today);

    // オンライン/オフライン状態の監視
    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // 初回レンダリング時にlocalStorageから位置情報設定を読み込む
    useEffect(() => {
        try {
            const savedPref = localStorage.getItem(LOCATION_PREF_KEY);
            if (savedPref) {
                setLocationPref(JSON.parse(savedPref));
            }
        } catch (e) {
            console.error("Failed to parse location preference", e);
        }
    }, []);

    const saveLocationPref = (pref: LocationPreference) => {
        setLocationPref(pref);
        localStorage.setItem(LOCATION_PREF_KEY, JSON.stringify(pref));
    };

    const getWeatherData = useCallback(async (pref: LocationPreference) => {
        setIsLoading(true); // ぐるぐる開始
        setError(null);

        try {
            // Promise.allを使うと「API通信」と「演出用の待ち時間」を同時に走らせられます
            // これで「最低でも1秒間」はぐるぐるし続けます
            const [data] = await Promise.all([
                fetchWeather(pref), //天気を取りに行く
                new Promise(resolve => setTimeout(resolve, 1000)) //演出として１秒待つ
            ]);

            setWeather(data); //データ更新
        } catch (err) {
            console.error(err);
            setError('天気を更新できませんでした');
        } finally {
            setIsLoading(false); //ぐるぐる終了
        }
    }, []);

    // 位置情報設定が利用可能または変更されたときに天気を取得
    useEffect(() => {
        if (locationPref) {
            getWeatherData(locationPref);
        }
    }, [locationPref, getWeatherData]);

    const handleAllowLocation = () => {
        setIsLoading(true);
        setError(null);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const pref: LocationPreference = { 
                    method: 'auto', 
                    lat: latitude, 
                    lon: longitude, 
                    name: '現在地' // UIには出さないが内部で保持
                };
                saveLocationPref(pref);
            },
            (err) => {
                setError('位置情報の取得に失敗しました。');
                console.error(err);
                setIsLoading(false);
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 } 
        );
    };

    const handleSaveManualLocation = (zip: string) => {
        const pref: LocationPreference = { 
            method: 'manual', 
            zip: zip,
            name: `〒${zip}` 
        };
        saveLocationPref(pref);
        setShowManualModal(false);
    };
    
    const handleResetLocation = () => {
        // 設定メニューから呼び出す想定（今回はエラー時の表示用）
        if (window.confirm('位置情報をリセットしますか？')) {
            setLocationPref(null);
            setWeather(null);
            setError(null);
            localStorage.removeItem(LOCATION_PREF_KEY);
        }
    };

    const handleReload = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (locationPref) {
            getWeatherData(locationPref);
        }
    };

    const renderWeatherContent = () => {
        if (!locationPref) {
            // 位置情報が未設定の場合
            return (
                 <div className="text-center p-4">
                    <p className="text-sm font-semibold text-slate-700 mb-3">天気表示のため位置情報を使いますか？</p>
                    <div className="flex gap-2 justify-center">
                        <button 
                            onClick={handleAllowLocation} 
                            disabled={isLoading}
                            className="text-xs px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-bold shadow-sm transition-transform active:scale-95 disabled:bg-slate-300"
                        >
                            {isLoading ? '取得中...' : 'はい (推奨)'}
                        </button>
                        <button 
                            onClick={() => setShowManualModal(true)} 
                            disabled={isLoading}
                            className="text-xs px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 border border-slate-300 font-semibold transition-transform active:scale-95 disabled:opacity-50"
                        >
                            手動で設定
                        </button>
                    </div>
                    {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                </div>
            );
        }

        // ロード中でデータがまだない場合
        if (isLoading && !weather) {
            return (
                <div className="flex flex-col items-center justify-center h-full space-y-2 animate-pulse">
                    <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                    <div className="w-32 h-4 bg-slate-200 rounded"></div>
                </div>
            );
        }

        // データがある場合（キャッシュ含む）
        if (weather) {
            const fetchedDate = new Date(weather.updated_at);
            const dateString = `${fetchedDate.getMonth() + 1}/${fetchedDate.getDate()}`;
            const weekDay = ['日', '月', '火', '水', '木', '金', '土'][fetchedDate.getDay()];
            const timeString = fetchedDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit'});

            return (
                <div className="relative w-full h-full flex flex-col justify-between">
                     {/* Error Toast (Over content) */}
                     {error && (
                        <div className="absolute top-[-10px] left-[-10px] right-[-10px] bg-red-500 text-white text-[10px] py-1 px-2 rounded-t-lg text-center animate-fade-in-up z-10 shadow-md">
                            {error}
                        </div>
                    )}

                    <div className="flex items-start justify-between">
                         <div className="flex items-center gap-3">
                            <span className="text-5xl filter drop-shadow-sm">{weatherIconMap[weather.condition] || '🌈'}</span>
                            <div>
                                <p className="font-bold text-3xl text-slate-800 tracking-tight">
                                    {Math.round(weather.temp_c)}<span className="text-lg align-top">°</span>
                                </p>
                            </div>
                         </div>
                         <div className="flex flex-col items-end">
                             <button 
                                onClick={handleReload} 
                                disabled={isLoading}
                                className={`p-1.5 rounded-full hover:bg-slate-100 transition-colors ${isLoading ? 'animate-spin text-blue-500' : 'text-slate-400'}`}
                                aria-label="再読込"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                             <button onClick={handleResetLocation} className="text-[10px] text-slate-300 hover:text-slate-500 mt-1">
                                設定変更
                            </button>
                         </div>
                    </div>
                    
                    <div className="mt-2">
                        <p className="text-sm text-slate-700 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100 mb-1 leading-snug">
                            {weather.message}
                        </p>
                        <p className="text-[10px] text-slate-400 text-right">
                            更新: {dateString}({weekDay}) {timeString}
                            {isOffline && <span className="ml-1 font-bold text-slate-500">(キャッシュ)</span>}
                        </p>
                    </div>
                </div>
            );
        }

        // ロード失敗かつデータなし
        return (
            <div className="text-center p-4">
                 <p className="text-red-500 text-sm mb-2">{error || '天気の取得に失敗しました'}</p>
                 <button onClick={() => locationPref && getWeatherData(locationPref)} className="text-xs text-blue-500 underline">再試行</button>
                  <div className="mt-2">
                    <button onClick={handleResetLocation} className="text-xs text-slate-400">設定をリセット</button>
                 </div>
            </div>
        );
    };

    const renderMoodContent = () => {
        return (
            <div className="text-center p-2 cursor-pointer h-full flex flex-col justify-center relative group" onClick={() => setShowMoodModal(true)} role="button" aria-label="今日の状態を選択する">
                <p className="text-sm font-semibold text-slate-700 mb-1">今日の気分</p>
                {todaysMood ? (
                    <div>
                        <span className="text-4xl filter drop-shadow-sm transition-transform group-hover:scale-110 inline-block">{todaysMood.emoji}</span>
                        <p className="font-bold text-slate-700 mt-1">{todaysMood.score > 0 ? '+' : ''}{todaysMood.score}</p>
                    </div>
                ) : (
                    <div>
                         <span className="text-4xl opacity-50 grayscale group-hover:grayscale-0 transition-all">🙂</span>
                        <p className="font-bold text-slate-400 mt-1 text-xs">
                           タップして記録
                        </p>
                    </div>
                )}
                {/* Visual Hint */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-2xl mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center min-h-[160px] relative overflow-hidden">
                {renderWeatherContent()}
            </div>
             <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center min-h-[160px]">
                {renderMoodContent()}
            </div>
            {showManualModal && <ManualLocationModal onClose={() => setShowManualModal(false)} onSave={handleSaveManualLocation} />}
            {showMoodModal && <MoodPickerModal onClose={() => setShowMoodModal(false)} onSave={onSaveMood} moodHistory={moodHistory} />}
        </div>
    );
};

export default WeatherAndMood;
