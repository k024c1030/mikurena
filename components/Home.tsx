import React, { useState, useEffect } from 'react';
import type { Monster, ToDoItem, MoodRecord } from '../types';
import WeatherAndMood from './WeatherAndMood';

interface HomeProps {
  onStart: () => void;
  onSaveAndStart: (name: string) => void;
  onSaveName: (name: string) => void;
  aiName: string | null;
  monster: Monster | null;
  onAttack: () => void;
  onDevKill: () => void;
  powerBank: number;
  toDoList: ToDoItem[];
  onToggleToDo: (id: number) => void;
  onOpenToDo: () => void;
  onDeleteToDo: (id: number) => void;
  onToggleFavoriteToDo: (id: number) => void;
  moodHistory: MoodRecord[];
  onSaveMood: (record: MoodRecord) => void;
}

const Home: React.FC<HomeProps> = ({ onStart, onSaveAndStart, onSaveName, aiName, monster, onAttack, onDevKill, powerBank, toDoList, onToggleToDo, onOpenToDo, onDeleteToDo, onToggleFavoriteToDo, moodHistory, onSaveMood }) => {
  const [nameInput, setNameInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    if (aiName) {
      setNameInput(aiName);
    }
  }, [aiName]);
  
  const handleSave = () => {
    if (nameInput.trim()){
      onSaveName(nameInput);
      setIsEditingName(false);
    }
  }

  // --- Monster View ---
  if (monster && monster.currentHP > 0) {
    const hpPercentage = (monster.currentHP / monster.score) * 100;
    return (
        <div className="flex flex-col items-center justify-center text-center p-6 w-full max-w-md mx-auto animate-fade-in-up">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">ストレスモンスターが出現中！</h1>
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 w-full">
                <h2 className="text-4xl font-bold text-orange-500 mb-4">{monster.name}</h2>
                <div className="w-64 h-64 mx-auto bg-slate-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                    <img src={monster.imageUrl} alt={monster.name} className="w-full h-full object-cover" />
                </div>
                <div className="w-full bg-slate-200 rounded-full h-6 border border-slate-300 overflow-hidden">
                    <div
                        className="bg-red-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${hpPercentage}%` }}
                    ></div>
                </div>
                <p className="text-sm text-slate-600 mt-2">
                    HP: <span className="font-bold text-red-600 text-lg">{monster.currentHP}</span> / {monster.score}
                </p>
            </div>
            <div className="w-full mt-6 space-y-2">
                <button
                    onClick={onAttack}
                    disabled={powerBank <= 0}
                    className="w-full px-8 py-4 bg-orange-500 text-white rounded-xl font-semibold text-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 transform hover:scale-105 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:transform-none"
                >
                    貯めたパワー ({powerBank}) で攻撃する
                </button>
                 <button
                    onClick={onDevKill}
                    className="w-full py-2 text-xs text-slate-400 border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                >
                    ⚡ [開発用] ワンパンで倒す
                </button>
            </div>
        </div>
    );
  }

  const getTimeDisplay = (item: ToDoItem) => {
    if (item.startTime && item.endTime) {
        return `${item.startTime} ~ ${item.endTime}`;
    }
    if (item.startTime) {
        return item.startTime;
    }
    return '';
  };

  const today = new Date().toISOString().split('T')[0];
  const todaysToDos = toDoList
    .filter(todo => todo.dueDate === today && !todo.isCompleted)
    .sort((a, b) => {
        // Favorites first
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        // Then by start time
        const aTime = a.startTime || '99:99'; // Null times last
        const bTime = b.startTime || '99:99';
        if (aTime < bTime) return -1;
        if (aTime > bTime) return 1;
        // Fallback to order
        return a.order - b.order;
    });


  // --- Chat Start View ---
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 max-w-2xl mx-auto animate-fade-in-up">
       <WeatherAndMood moodHistory={moodHistory} onSaveMood={onSaveMood} />

       <div className="w-full max-w-sm mb-8">
        <h2 className="text-xl font-bold text-slate-700 mb-3 text-left cursor-pointer hover:text-teal-600 transition-colors" onClick={onOpenToDo}>
            今日のToDo
        </h2>
        <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200">
            {todaysToDos.length > 0 ? (
            <ul className="space-y-3">
                {todaysToDos.map(todo => (
                <li key={todo.id} className="flex items-center group">
                    <input
                        type="checkbox"
                        id={`todo-home-${todo.id}`}
                        checked={todo.isCompleted}
                        onChange={() => onToggleToDo(todo.id)}
                        className="h-5 w-5 rounded border-slate-300 text-green-500 focus:ring-green-400 cursor-pointer"
                    />
                    <div className="ml-3 flex-grow text-left">
                      <label htmlFor={`todo-home-${todo.id}`} className="text-slate-800 cursor-pointer">{todo.title}</label>
                      {getTimeDisplay(todo) && (
                          <p className="text-xs text-slate-500">{getTimeDisplay(todo)}</p>
                      )}
                    </div>
                    <div className="flex items-center flex-shrink-0 ml-2">
                        <button
                            onClick={() => onToggleFavoriteToDo(todo.id)}
                            className="p-1 rounded-full relative group"
                            aria-label={todo.isFavorite ? `Unfavorite ${todo.title}` : `Favorite ${todo.title}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-all duration-200 ease-in-out ${todo.isFavorite ? 'text-yellow-400 fill-current' : 'text-slate-300 hover:text-yellow-400'}`} viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </button>
                        <button
                          onClick={() => onDeleteToDo(todo.id)}
                          className="p-1 rounded-full text-slate-400 hover:bg-red-100 hover:text-red-500 transition-colors"
                          aria-label={`Delete ${todo.title}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </li>
                ))}
            </ul>
            ) : (
            <p className="text-slate-500 text-center p-2">今日のタスクはありません。追加してみましょう！</p>
            )}
        </div>
      </div>

      <div className="mb-4">
        <span className="inline-block w-16 h-1.5 bg-teal-400 rounded-full"></span>
        <span className="inline-block w-4 h-1.5 mx-2 bg-orange-400 rounded-full"></span>
        <span className="inline-block w-2 h-1.5 bg-slate-400 rounded-full"></span>
      </div>
      <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">AIセルフケア日記へようこそ</h1>
      <p className="text-slate-600 text-lg mb-8">
        {aiName && !isEditingName 
          ? `AIアシスタントの「${aiName}」と話しますか？`
          : 'あなたの専属AIに名前をつけて、相談を始めましょう。'
        }
      </p>
      
      {(!aiName || isEditingName) ? (
        <div className="w-full max-w-sm flex flex-col items-center gap-4">
            <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="AIの名前を入力..."
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-center text-lg focus:ring-2 focus:ring-teal-400 focus:outline-none transition-shadow"
                aria-label="AI assistant's name"
            />
             {aiName ? (
                 <div className="flex gap-2 w-full">
                    <button onClick={handleSave} className="flex-1 px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600">保存</button>
                    <button onClick={() => setIsEditingName(false)} className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300">キャンセル</button>
                 </div>
             ) : (
                <button
                    onClick={() => onSaveAndStart(nameInput)}
                    disabled={!nameInput.trim()}
                    className="w-full px-10 py-4 bg-teal-500 text-white rounded-xl font-semibold text-lg hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
                >
                    この名前ではじめる
                </button>
             )}
        </div>
      ) : (
        <div className="w-full max-w-sm flex flex-col items-center gap-4">
            <button
                onClick={onStart}
                className="w-full px-10 py-4 bg-teal-500 text-white rounded-xl font-semibold text-lg hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
                相談をはじめる
            </button>
            <button onClick={() => setIsEditingName(true)} className="text-sm text-slate-500 hover:text-slate-700">
                AIの名前を変更
            </button>
        </div>
      )}
      
       <footer className="w-full text-center mt-12">
        <p className="text-xs text-slate-400">免責事項：これは医療的なアドバイスではありません。これは内省のためのAIツールです。</p>
      </footer>
    </div>
  );
};

export default Home;