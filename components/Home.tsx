
import React, { useState, useEffect, useRef } from 'react';
import type { Monster, ToDoItem } from '../types';
import WeatherAndMood from './WeatherAndMood';

// 親（App.tsx）から受け取るデータの型定義
interface HomeProps {
  onStart: () => void;
  onSaveAndStart: (name: string) => void;
  onSaveName: (name: string) => void;
  aiName: string | null;
  monster: Monster | null;
  onAttack: () => void;
  powerBank: number;
  toDoList: ToDoItem[];
  onToggleToDo: (id: number) => void;
  onOpenToDo: () => void;
  onDeleteToDo: (id: number) => void;
  onToggleFavoriteToDo: (id: number) => void;
}

const Home: React.FC<HomeProps> = ({ 
  // 受け取るデータ（Props）をここで展開しています
  onStart, onSaveAndStart, onSaveName, aiName, monster, onAttack, powerBank, 
  toDoList, onToggleToDo, onOpenToDo, onDeleteToDo, onToggleFavoriteToDo
}) => {
  const [nameInput, setNameInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  
  // ToDoリストのコンテナを参照するためのRef
  const todoListRef = useRef<HTMLDivElement>(null);

  // AIの名前が保存されていたら入力欄にセットする処理
  useEffect(() => {
    if (aiName) setNameInput(aiName);
  }, [aiName]);
  
  // 画面のどこかをタップした時の処理（詳細を閉じる）
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        // タップした場所がToDoリストの中でなければ、詳細表示を解除する
        if (todoListRef.current && !todoListRef.current.contains(event.target as Node)) {
            setExpandedTaskId(null);
        }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 今日のToDoだけをフィルタリングして表示する準備
  const today = new Date().toISOString().split('T')[0];
  const todaysToDos = toDoList
    .filter(todo => todo.dueDate === today && !todo.isCompleted)
    .sort((a,b) => (a.isFavorite === b.isFavorite ? 0 : a.isFavorite ? -1 : 1));
    
  // ★重要：モンスターが「存在して」かつ「HPが0より大きい」かチェック
  const isMonsterActive = monster && monster.currentHP > 0;
  
  // HPバーの長さを計算
  const hpPercentage = isMonsterActive ? (monster.currentHP / monster.score) * 100 : 0;
  
  // 時間を見やすくフォーマットする関数
  const formatTimeRange = (start: string | null, end: string | null) => {
      if (!start) return null;
      if (end) return `${start}～${end}`;
      return start;
  };

  const handleTaskClick = (id: number) => {
      setExpandedTaskId(prev => prev === id ? null : id);
  };
  
  const getDifficultyMark = (d: string | undefined) => {
        switch(d) {
            case 'easy': return '🟢';
            case 'hard': return '🔴';
            default: return '🟡'; 
        }
    };

  return (
    <div className="flex flex-col items-center text-center p-8 max-w-2xl mx-auto animate-fade-in-up pb-32">
       
       {/* 
         ▼▼▼ 画面上部の表示エリア ▼▼▼ 
       */}
       
       {isMonsterActive ? (
        // === パターンA：モンスターがいる時 ===
        <div className="w-full max-w-md mb-10 animate-fade-in-up">
            {/* モンスターカードのデザイン */}
            <div className="relative bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border-2 border-orange-200 p-6 overflow-hidden">
                <div className="flex items-center gap-4 mb-4">
                     <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0 border border-orange-100">
                        <img src={monster.imageUrl} alt={monster.name} className="w-full h-full object-contain" />
                     </div>
                     <div className="text-left flex-grow">
                        <p className="text-xs text-orange-600 font-bold mb-1">現在出現中！</p>
                        <h2 className="text-xl font-extrabold text-slate-800 leading-tight">{monster.name}</h2>
                        <p className="text-xs text-slate-500 mt-1">HP: <span className="text-red-500 font-bold">{monster.currentHP}</span> / {monster.score}</p>
                     </div>
                </div>

                {/* HPバー */}
                <div className="w-full bg-slate-200 rounded-full h-3 mb-4 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-500 to-orange-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${hpPercentage}%` }}></div>
                </div>

                <button
                    onClick={onAttack}
                    disabled={powerBank <= 0}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:from-orange-600 hover:to-red-600 transition-all active:scale-95 disabled:grayscale disabled:opacity-50"
                >
                    パワー ({powerBank}) で攻撃！
                </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">下のタスクや日記でパワーを貯めよう！👇</p>
        </div>
       ) : (
        // === パターンB：モンスターがいない時（いつものタイトル） ===
        <>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-6 tracking-tight">AIセルフケア日記</h1>
            <p className="text-slate-500 text-lg mb-10 leading-relaxed">
                {aiName && !isEditingName 
                ? `パートナーの「${aiName}」があなたの心に寄り添います。`
                : 'あなたの専属AIに名前をつけて、セルフケアを始めましょう。'
                }
            </p>

            {/* 名前入力または開始ボタン */}
            {(!aiName || isEditingName) ? (
                <div className="w-full max-w-sm flex flex-col items-center gap-4 animate-fade-in-up mb-12">
                    <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="AIの名前..." className="w-full px-6 py-4 bg-white/80 border border-slate-200 rounded-2xl text-center text-xl shadow-sm focus:ring-4 focus:ring-teal-100 focus:outline-none transition-all" />
                    <button onClick={() => onSaveAndStart(nameInput)} disabled={!nameInput.trim()} className="w-full px-10 py-5 bg-teal-500 text-white rounded-2xl font-bold text-xl hover:bg-teal-600 shadow-xl transition-all active:scale-95 disabled:bg-slate-300">決定</button>
                </div>
            ) : (
                <div className="w-full max-w-sm flex flex-col items-center gap-6 animate-fade-in-up mb-12">
                    <button onClick={onStart} className="w-full px-10 py-5 bg-gradient-to-br from-teal-400 to-teal-600 text-white rounded-2xl font-bold text-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 active:scale-95 shadow-lg">
                        相談をはじめる
                    </button>
                    <button onClick={() => setIsEditingName(true)} className="text-sm text-slate-400 hover:text-slate-600 underline underline-offset-4 decoration-slate-200 transition-colors">AIの名前を変更</button>
                </div>
            )}
        </>
       )}

       {/* 
         ▼▼▼ 画面下部の共通エリア ▼▼▼ 
       */}
       
       {/* 1. 天気コンポーネント (気分機能削除済み) */}
       <WeatherAndMood />

       {/* 2. 今日のToDoリスト */}
       <div className="w-full max-w-md mb-12" ref={todoListRef}>
        <h2 className="text-xl font-bold text-slate-700 mb-4 text-left flex items-center gap-2">
            <span className="w-2 h-6 bg-teal-400 rounded-full"></span>
            今日のタスク
        </h2>
        <div className="bg-white/60 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-white/80">
            {todaysToDos.length > 0 ? (
            <ul className="space-y-3">
                {todaysToDos.map(todo => {
                    const isExpanded = expandedTaskId === todo.id;
                    const timeString = formatTimeRange(todo.startTime, todo.endTime);
                    
                    return (
                        <li key={todo.id} className={`flex flex-col group bg-white/40 rounded-xl border border-white/50 hover:bg-white/60 transition-all overflow-hidden ${isExpanded ? 'bg-white/80 shadow-md ring-1 ring-teal-100' : ''}`}>
                            {/* 上段：チェックボックス、タイトル、簡易情報、お気に入り */}
                            <div className="flex items-center p-3">
                                <input 
                                    type="checkbox" 
                                    checked={todo.isCompleted} 
                                    onChange={() => onToggleToDo(todo.id)} 
                                    className="h-6 w-6 rounded-full border-slate-300 text-teal-500 focus:ring-teal-400 cursor-pointer flex-shrink-0" 
                                />
                                
                                {/* テキストエリア（タップで展開） */}
                                <div 
                                    className="ml-4 flex-grow text-left cursor-pointer" 
                                    onClick={() => handleTaskClick(todo.id)}
                                >
                                    <div className="flex items-center flex-wrap gap-x-2">
                                        <span className={`text-slate-800 flex items-center gap-1 ${isExpanded ? 'font-bold' : 'font-medium'}`}>
                                            <span>{getDifficultyMark(todo.difficulty)}</span>
                                            <span>{todo.title}</span>
                                        </span>
                                        {/* 閉じてる時に表示する薄い時間 */}
                                        {!isExpanded && timeString && (
                                            <span className="text-xs text-slate-400 font-normal">
                                                {timeString}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => onToggleFavoriteToDo(todo.id)} 
                                    className={`p-1 transition-colors flex-shrink-0 ${todo.isFavorite ? 'text-yellow-400' : 'text-slate-300 hover:text-yellow-200'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                </button>
                            </div>

                            {/* 下段：展開された詳細情報 */}
                            {isExpanded && (
                                <div className="px-3 pb-3 pt-0 ml-10 text-left text-sm text-slate-600 animate-fade-in-up">
                                    <div className="space-y-1 border-t border-slate-100 pt-2 mt-1">
                                        {timeString && (
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <span>🕒</span>
                                                <span>{timeString}</span>
                                            </div>
                                        )}
                                        {todo.memo && (
                                            <div className="flex items-start gap-2 mt-1">
                                                <span className="flex-shrink-0">📝</span>
                                                <span className="whitespace-pre-wrap">{todo.memo}</span>
                                            </div>
                                        )}
                                        {!timeString && !todo.memo && (
                                            <span className="text-slate-400 text-xs italic">詳細情報はありません</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
            ) : (
            <p className="text-slate-400 text-sm py-4 italic">今日のタスクは完了です。ゆっくり休んでくださいね。</p>
            )}
            <button onClick={onOpenToDo} className="mt-4 w-full py-2 text-sm text-teal-600 font-bold hover:bg-teal-50 rounded-lg transition-colors">タスクを管理する</button>
        </div>
      </div>
      
       <footer className="w-full text-center mt-4 opacity-50">
        <p className="text-xs text-slate-400">© 2024 AI Self-Care Companion. Keep breathing.</p>
      </footer>
    </div>
  );
};

export default Home;
