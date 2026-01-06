
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
    if (aiName) setNameInput(aiName);
  }, [aiName]);
  
  const handleSave = () => {
    if (nameInput.trim()){
      onSaveName(nameInput);
      setIsEditingName(false);
    }
  }

  if (monster && monster.currentHP > 0) {
    const hpPercentage = (monster.currentHP / monster.score) * 100;
    return (
        <div className="flex flex-col items-center justify-center text-center p-6 w-full max-w-md mx-auto animate-fade-in-up">
            <h1 className="text-2xl font-bold text-slate-800 mb-6 drop-shadow-sm">ストレスモンスター出現中！</h1>
            <div className="relative bg-white/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 w-full overflow-hidden">
                {/* 隠し開発ボタン */}
                <button onClick={onDevKill} className="absolute top-4 right-4 text-slate-300 hover:text-red-400 transition-colors z-10" title="DevKill">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                </button>

                <h2 className="text-3xl font-extrabold text-orange-600 mb-6">{monster.name}</h2>
                <div className="relative w-64 h-64 mx-auto mb-6">
                    <div className="absolute inset-0 bg-orange-200/50 rounded-full blur-3xl animate-pulse"></div>
                    <div className="relative bg-white/80 rounded-2xl p-2 shadow-inner h-full flex items-center justify-center overflow-hidden animate-float">
                        <img src={monster.imageUrl} alt={monster.name} className="w-full h-full object-contain drop-shadow-lg" />
                    </div>
                </div>
                <div className="w-full bg-slate-200/50 rounded-full h-4 mb-2 overflow-hidden border border-slate-300/30">
                    <div className="bg-gradient-to-r from-red-500 to-orange-500 h-full rounded-full transition-all duration-1000 ease-out shadow-lg" style={{ width: `${hpPercentage}%` }}></div>
                </div>
                <p className="text-sm text-slate-600 font-bold">HP: <span className="text-red-600 text-lg">{monster.currentHP}</span> / {monster.score}</p>
            </div>
            <div className="w-full mt-8">
                <button
                    onClick={onAttack}
                    disabled={powerBank <= 0}
                    className="w-full px-8 py-5 bg-gradient-to-br from-orange-400 to-red-500 text-white rounded-2xl font-bold text-xl hover:from-orange-500 hover:to-red-600 shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:grayscale disabled:opacity-50 disabled:transform-none"
                >
                    パワー ({powerBank}) で立ち向かう
                </button>
            </div>
        </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todaysToDos = toDoList
    .filter(todo => todo.dueDate === today && !todo.isCompleted)
    .sort((a, b) => (a.isFavorite === b.isFavorite ? 0 : a.isFavorite ? -1 : 1));

  return (
    <div className="flex flex-col items-center text-center p-8 max-w-2xl mx-auto animate-fade-in-up">
       <WeatherAndMood moodHistory={moodHistory} onSaveMood={onSaveMood} />

       <div className="w-full max-w-md mb-12">
        <h2 className="text-xl font-bold text-slate-700 mb-4 text-left flex items-center gap-2">
            <span className="w-2 h-6 bg-teal-400 rounded-full"></span>
            今日のタスク
        </h2>
        <div className="bg-white/60 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-white/80">
            {todaysToDos.length > 0 ? (
            <ul className="space-y-4">
                {todaysToDos.map(todo => (
                <li key={todo.id} className="flex items-center group bg-white/40 p-3 rounded-xl border border-white/50 hover:bg-white/60 transition-all">
                    <input type="checkbox" checked={todo.isCompleted} onChange={() => onToggleToDo(todo.id)} className="h-6 w-6 rounded-full border-slate-300 text-teal-500 focus:ring-teal-400 cursor-pointer" />
                    <div className="ml-4 flex-grow text-left">
                      <span className="text-slate-800 font-medium">{todo.title}</span>
                    </div>
                    <button onClick={() => onToggleFavoriteToDo(todo.id)} className={`p-1 transition-colors ${todo.isFavorite ? 'text-yellow-400' : 'text-slate-300 hover:text-yellow-200'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    </button>
                </li>
                ))}
            </ul>
            ) : (
            <p className="text-slate-400 text-sm py-4 italic">今日のタスクは完了です。ゆっくり休んでくださいね。</p>
            )}
            <button onClick={onOpenToDo} className="mt-4 w-full py-2 text-sm text-teal-600 font-bold hover:bg-teal-50 rounded-lg transition-colors">タスクを管理する</button>
        </div>
      </div>

      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-6 tracking-tight">AIセルフケア日記</h1>
      <p className="text-slate-500 text-lg mb-10 leading-relaxed">
        {aiName && !isEditingName 
          ? `パートナーの「${aiName}」があなたの心に寄り添います。`
          : 'あなたの専属AIに名前をつけて、セルフケアを始めましょう。'
        }
      </p>
      
      {(!aiName || isEditingName) ? (
        <div className="w-full max-w-sm flex flex-col items-center gap-4 animate-fade-in-up">
            <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="AIの名前..." className="w-full px-6 py-4 bg-white/80 border border-slate-200 rounded-2xl text-center text-xl shadow-sm focus:ring-4 focus:ring-teal-100 focus:outline-none transition-all" />
            <button onClick={() => onSaveAndStart(nameInput)} disabled={!nameInput.trim()} className="w-full px-10 py-5 bg-teal-500 text-white rounded-2xl font-bold text-xl hover:bg-teal-600 shadow-xl transition-all active:scale-95 disabled:bg-slate-300">決定</button>
        </div>
      ) : (
        <div className="w-full max-w-sm flex flex-col items-center gap-6 animate-fade-in-up">
            <button onClick={onStart} className="w-full px-10 py-5 bg-gradient-to-br from-teal-400 to-teal-600 text-white rounded-2xl font-bold text-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 active:scale-95 shadow-lg">
                相談をはじめる
            </button>
            <button onClick={() => setIsEditingName(true)} className="text-sm text-slate-400 hover:text-slate-600 underline underline-offset-4 decoration-slate-200 transition-colors">AIの名前を変更</button>
        </div>
      )}
      
       <footer className="w-full text-center mt-20 opacity-50">
        <p className="text-xs text-slate-400">© 2024 AI Self-Care Companion. Keep breathing.</p>
      </footer>
    </div>
  );
};

export default Home;
