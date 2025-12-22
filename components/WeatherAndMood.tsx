import React, { useState, useEffect, useCallback } from 'react';
import type { WeatherData, MoodRecord } from '../types';
import { fetchWeather } from '../services/weatherService';
import ManualLocationModal from './ManualLocationModal';
import MoodPickerModal from './MoodPickerModal';

const LOCATION_PREF_KEY = 'locationPreference';

// 親から受け取るデータの形
interface WeatherAndMoodProps {
    moodHistory: MoodRecord[];
    onSaveMood: (record: MoodRecord) => void;
}

// 保存する場所の設定データ
interface LocationPreference {
    method: 'auto' | 'manual';
    lat?: number;
    lon?: number;
    zip?: string;
    name: string;
}

const weatherIconMap: Record<string, string> = {
    sun: '☀️',
    cloud: '☁️',
    rain: '🌧️',
    snow: '❄️',
};

const encouragementMap: Record<string, string> = {
    sun: '洗濯日和ですね！素敵な１日を✨',
    cloud: '深呼吸してリラックスしよう🍃',
    rain: '足元に気を付けて。温かい飲み物を☕',
    snow: '温かくして過ごしてね🧣',    
};

const WeatherAndMood: React.FC<WeatherAndMoodProps> = ({ moodHistory, onSaveMood }) => {
    const [locationPref, setLocationPref] = useState<LocationPreference | null>(null);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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

    // 初回：保存された場所設定を読み込む
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

    // 設定を保存する関数
    const saveLocationPref = (pref: LocationPreference) => {
        setLocationPref(pref);
        localStorage.setItem(LOCATION_PREF_KEY, JSON.stringify(pref));
    };

    // 天気を取得する関数
    const getWeatherData = useCallback(async (pref: LocationPreference) => {
        if (isOffline) return; // オフラインなら何もしない
        
        setIsLoading(true);
        setError(null);

        try {
            // 最低でも500msはローディングを見せる（チラつき防止）
            const [data] = await Promise.all([
                fetchWeather(pref),
                new Promise(resolve => setTimeout(resolve, 500))
            ]);
            setWeather(data);
        } catch (err) {
            console.error(err);
            setError('天気を更新できませんでした');
        } finally {
            setIsLoading(false);
        }
    }, [isOffline]);

    // 場所設定が変わったら天気を再取得
    useEffect(() => {
        if (locationPref) {
            getWeatherData(locationPref);
        }
    }, [locationPref, getWeatherData]);

    // GPSで場所を取得
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
                    name: '現在地付近'
                };
                saveLocationPref(pref);
            },
            (err) => {
                console.error(err);
                setIsLoading(false);
                if (err.code === 1) {
                    setError('位置情報が許可されませんでした。');
                } else {
                    setError('位置情報の取得に失敗しました。');
                }
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 } 
        );
    };

    // 手動で郵便番号設定（シンプルにプロンプトを使用）
    const handleManualLocation = () => {
        const zip = window.prompt("郵便番号を入力してください（ハイフンなし7桁）\n例: 1000001");
        if (zip && zip.match(/^\d{7}$/)) {
            const pref: LocationPreference = { 
                method: 'manual', 
                zip: zip,
                name: `〒${zip}` 
            };
            saveLocationPref(pref);
        } else if (zip) {
            alert("正しい郵便番号を入力してください");
        }
    };
    
    // 設定リセット
    const handleResetLocation = () => {
        if (window.confirm('位置情報をリセットしますか？')) {
            setLocationPref(null);
            setWeather(null);
            setError(null);
            localStorage.removeItem(LOCATION_PREF_KEY);
        }
    };

    // 気分を選択した時の処理
    const handleMoodSelect = (mood: 'GREAT' | 'GOOD' | 'OK' | 'BAD' | 'TERRIBLE') => {
        onSaveMood({
            date: today,
            mood: mood,
            note: ''
        });
    };

    // アイコン取得ヘルパー
    const getMoodIcon = (mood: string) => {
        switch (mood) {
            case 'GREAT': return '😆';
            case 'GOOD': return '😊';
            case 'OK': return '😐';
            case 'BAD': return '😞';
            case 'TERRIBLE': return '😫';
            default: return '❓';
        }
    };

    // ▼ 左側：天気表示エリア
    const renderWeatherContent = () => {
        // まだ設定がない時
        if (!locationPref) {
            return (
                <div className="text-center p-4">
                    <p className="text-sm font-bold text-slate-600 mb-3">天気予報を表示しますか？</p>
                    <div className="flex gap-2 justify-center">
                        <button onClick={handleAllowLocation} disabled={isLoading} className="text-xs px-3 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 font-bold transition-transform active:scale-95">
                            {isLoading ? '取得中...' : '現在地を使う'}
                        </button>
                        <button onClick={handleManualLocation} disabled={isLoading} className="text-xs px-3 py-2 bg-slate-100 text-slate-600 rounded-lg border border-slate-300 font-bold hover:bg-slate-200 transition-transform active:scale-95">
                            郵便番号
                        </button>
                    </div>
                    {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                </div>
            );
        }

        // ロード中
        if (isLoading && !weather) {
            return <div className="animate-pulse text-slate-400 text-sm">天気を確認中...</div>;
        }

        // 天気データあり
        if (weather) {
            return (
                <div className="w-full h-full flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                         <div className="flex items-center gap-3">
                            <span className="text-5xl filter drop-shadow-sm">{weatherIconMap[weather.condition] || '🌈'}</span>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold mb-0.5">📍 {weather.place || locationPref.name}</p>
                                <p className="font-bold text-3xl text-slate-800 tracking-tight">
                                    {Math.round(weather.temp)}<span className="text-lg align-top">°C</span>
                                </p>
                            </div>
                         </div>
                         <div className="flex flex-col items-end">
                             <button onClick={() => getWeatherData(locationPref)} className="p-1 text-slate-400 hover:text-blue-500 transition-colors">
                                ↺
                             </button>
                             <button onClick={handleResetLocation} className="text-[10px] text-slate-300 hover:text-red-400 mt-1">
                                解除
                             </button>
                         </div>
                    </div>
                    
                    <div className="mt-2">
                        <p className="text-xs font-bold text-orange-500 mb-1">
                           {(typeof encouragementMap !== 'undefined' ? encouragementMap[weather.condition] : null) || '今日も無理せずマイペースで🌱'}
                        </p>
                        {isOffline && <span className="text-[10px] text-slate-400">(オフライン表示)</span>}
                    </div>
                </div>
            );
        }

        // エラー時
        return (
            <div className="text-center">
                <p className="text-red-500 text-xs mb-2">{error || "取得失敗"}</p>
                <button onClick={handleResetLocation} className="text-xs underline text-slate-400">再設定する</button>
            </div>
        );
    };

    // ▼ 右側：気分選択エリア
    const renderMoodContent = () => {
        if (todaysMood) {
            return (
                <div className="text-center h-full flex flex-col justify-center animate-fade-in">
                    <p className="text-xs text-slate-400 font-bold mb-1">今日の気分</p>
                    <div className="text-5xl mb-1">{getMoodIcon(todaysMood.mood)}</div>
                    <p className="text-slate-600 font-bold text-sm">記録済み</p>
                    <button 
                        onClick={() => onSaveMood({ ...todaysMood, mood: 'OK' })} // ダミー更新でリセット等を実装可
                        className="text-[10px] text-slate-300 mt-2 underline hover:text-slate-500"
                    >
                        変更する
                    </button>
                </div>
            );
        }

        return (
            <div className="h-full flex flex-col justify-center">
                <p className="text-xs text-center text-slate-400 font-bold mb-3">今日の気分は？</p>
                <div className="flex justify-between gap-1">
                    {(['GREAT', 'GOOD', 'OK', 'BAD', 'TERRIBLE'] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => handleMoodSelect(m)}
                            className="text-2xl hover:scale-125 transition-transform p-1"
                        >
                            {getMoodIcon(m)}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 天気パネル */}
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-sm border border-slate-200 min-h-[160px] flex items-center justify-center relative overflow-hidden">
                {renderWeatherContent()}
            </div>
            {/* 気分パネル */}
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-sm border border-slate-200 min-h-[160px] flex items-center justify-center">
                {renderMoodContent()}
            </div>
        </div>
    );
};

export default WeatherAndMood;