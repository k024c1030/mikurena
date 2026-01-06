import React, { useState, useEffect, useRef } from 'react';
import type { AppState, Monster, StressRecord, SleepRecord, DiaryEntry, ToDoItem, MoodRecord } from './types';
import Home from './components/Home';
import ChatWindow from './components/ChatWindow';
import MonsterReveal from './components/MonsterReveal';
import DiaryPage from './components/DiaryPage';
import AttackResult from './components/AttackResult';
import Header from './components/Header';
import GraphModal from './components/GraphModal';
import LoginBonusModal from './components/LoginBonusModal';
import SleepDiaryModal from './components/SleepDiaryModal';
import DiaryHistoryModal from './components/DiaryHistoryModal';
import ToDoModal from './components/ToDoModal';


// --- LocalStorage Utility Functions ---
const STRESS_HISTORY_KEY = 'stressHistory';
const SLEEP_HISTORY_KEY = 'sleepHistory';
const DIARY_HISTORY_KEY = 'diaryHistory';
const LOGIN_DATA_KEY = 'loginData';
const AI_NAME_KEY = 'aiName';
const MONSTER_KEY = 'monsterState';
const TODO_LIST_KEY = 'toDoList';
const MOOD_HISTORY_KEY = 'moodHistory';

const getStressHistory = (): StressRecord[] => {
  try {
    const historyJson = localStorage.getItem(STRESS_HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error("Could not parse stress history:", error);
    return [];
  }
};

const getDiaryHistory = (): DiaryEntry[] => {
    try {
        const historyJson = localStorage.getItem(DIARY_HISTORY_KEY);
        if (!historyJson) return [];
        return (JSON.parse(historyJson) as DiaryEntry[]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (e) {
        return [];
    }
};

const getToDoList = (): ToDoItem[] => {
    try {
        const listJson = localStorage.getItem(TODO_LIST_KEY);
        const parsedList = listJson ? JSON.parse(listJson) : [];
        // Add default values for new properties for backward compatibility
        return parsedList.map((item: any, index: number) => ({
            id: item.id,
            title: item.title,
            dueDate: item.dueDate || null,
            startTime: item.startTime || item.dueTime || null, // compatibility for old dueTime
            endTime: item.endTime || null,
            memo: item.memo || '',
            isCompleted: item.isCompleted || false,
            isFavorite: item.isFavorite || item.isPinned || false,
            order: item.order ?? index,
        }));
    } catch (error) {
        console.error("Could not parse ToDo list:", error);
        return [];
    }
};

const getMoodHistory = (): MoodRecord[] => {
  try {
    const historyJson = localStorage.getItem(MOOD_HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error("Could not parse mood history:", error);
    return [];
  }
};


const addStressRecord = (record: StressRecord) => {
  try {
    const history = getStressHistory();
    history.push(record);
    localStorage.setItem(STRESS_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Could not save stress record:", error);
  }
};

export const addSleepRecord = (record: SleepRecord) => {
  try {
    const historyJson = localStorage.getItem(SLEEP_HISTORY_KEY);
    const history: SleepRecord[] = historyJson ? JSON.parse(historyJson) : [];
    // Avoid duplicates for the same date
    const filteredHistory = history.filter(r => r.date !== record.date);
    filteredHistory.push(record);
    localStorage.setItem(SLEEP_HISTORY_KEY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.error("Could not save sleep record:", error);
  }
};
// -----------------------------------------


const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('HOME');
  const [monster, setMonster] = useState<Monster | null>(() => {
    try {
        const savedMonster = localStorage.getItem(MONSTER_KEY);
        return savedMonster ? JSON.parse(savedMonster) : null;
    } catch {
        return null;
    }
  });
  const [attackPower, setAttackPower] = useState(0);
  const [aiName, setAiName] = useState<string | null>(null);
  const [powerBank, setPowerBank] = useState(0);
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false);
  const [editingDiaryEntry, setEditingDiaryEntry] = useState<DiaryEntry | null>(null);
  const [isDiaryHistoryModalOpen, setIsDiaryHistoryModalOpen] = useState(false);
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
  const [isSleepDiaryModalOpen, setIsSleepDiaryModalOpen] = useState(false);
  const [isLoginBonusModalOpen, setIsLoginBonusModalOpen] = useState(false);
  const [isToDoModalOpen, setIsToDoModalOpen] = useState(false);
  const [editingToDoId, setEditingToDoId] = useState<number | null>(null);
  const [loginBonusInfo, setLoginBonusInfo] = useState<{ days: number; points: number } | null>(null);
  const [toDoList, setToDoList] = useState<ToDoItem[]>(getToDoList);
  const [diaryHistory, setDiaryHistory] = useState<DiaryEntry[]>(getDiaryHistory);
  const [moodHistory, setMoodHistory] = useState<MoodRecord[]>(getMoodHistory);
  const [snackbar, setSnackbar] = useState<{ show: boolean; message: string; onUndo?: () => void }>({ show: false, message: '' });
  const snackbarTimeoutRef = useRef<number | null>(null);


  useEffect(() => {
     // --- Load initial state from localStorage ---
    const storedAiName = localStorage.getItem(AI_NAME_KEY);
    if (storedAiName) {
        setAiName(JSON.parse(storedAiName));
    }

    // --- Login Bonus Logic ---
    const today = new Date().toISOString().split('T')[0];
    const loginDataJson = localStorage.getItem(LOGIN_DATA_KEY);
    let consecutiveDays = 1;
    let lastLoginDate = '';

    if (loginDataJson) {
        const { lastLoginDate: storedDate, consecutiveDays: storedDays } = JSON.parse(loginDataJson);
        lastLoginDate = storedDate;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (today !== lastLoginDate) {
            if (storedDate === yesterday.toISOString().split('T')[0]) {
                consecutiveDays = Math.min(storedDays + 1, 7); // Cap at 7 days
            } else {
                consecutiveDays = 1; // Streak broken
            }
             const points = consecutiveDays * 10;
            setPowerBank(prev => prev + points);
            setLoginBonusInfo({ days: consecutiveDays, points });
            setIsLoginBonusModalOpen(true);
            localStorage.setItem(LOGIN_DATA_KEY, JSON.stringify({ lastLoginDate: today, consecutiveDays }));
        }
    } else {
         const points = consecutiveDays * 10;
        setPowerBank(prev => prev + points);
        setLoginBonusInfo({ days: consecutiveDays, points });
        setIsLoginBonusModalOpen(true);
        localStorage.setItem(LOGIN_DATA_KEY, JSON.stringify({ lastLoginDate: today, consecutiveDays }));
    }

  }, []);

  useEffect(() => {
    try {
        if(monster) {
            localStorage.setItem(MONSTER_KEY, JSON.stringify(monster));
        } else {
            localStorage.removeItem(MONSTER_KEY);
        }
    } catch (error) {
        console.error("Could not save monster state:", error);
    }
  }, [monster]);
  
   useEffect(() => {
    try {
        localStorage.setItem(TODO_LIST_KEY, JSON.stringify(toDoList));
    } catch (error) {
        console.error("Could not save ToDo list:", error);
    }
  }, [toDoList]);

   useEffect(() => {
    try {
        localStorage.setItem(DIARY_HISTORY_KEY, JSON.stringify(diaryHistory));
    } catch (error) {
        console.error("Could not save diary history:", error);
    }
   }, [diaryHistory]);
   
   useEffect(() => {
    try {
        localStorage.setItem(MOOD_HISTORY_KEY, JSON.stringify(moodHistory));
    } catch (error) {
        console.error("Could not save mood history:", error);
    }
  }, [moodHistory]);


  const handleSaveAiName = (name: string) => {
    const trimmedName = name.trim();
    if(trimmedName) {
        setAiName(trimmedName);
        localStorage.setItem(AI_NAME_KEY, JSON.stringify(trimmedName));
    }
  };

  const handleStartChat = () => {
    if (aiName) {
        setAppState('CHAT');
    }
  };

  const handleSaveAndStart = (name: string) => {
    const trimmedName = name.trim();
    if (trimmedName) {
        setAiName(trimmedName);
        localStorage.setItem(AI_NAME_KEY, JSON.stringify(trimmedName));
        setAppState('CHAT');
    }
  };

  const handleMonsterGenerated = (generatedMonster: Monster) => {
    const monsterWithHP = {
        ...generatedMonster,
        currentHP: generatedMonster.score,
    }
    setMonster(monsterWithHP);
    addStressRecord({
      date: new Date().toISOString(),
      score: generatedMonster.score
    });
    setAppState('MONSTER_REVEAL');
  };
  
    const handleSaveOrUpdateDiary = (entryData: DiaryEntry) => {
        const existingEntry = diaryHistory.find(e => e.date === entryData.date);
        const DIARY_BONUS = 10;

        if (existingEntry) { // This is an update
            const scoreDiff = entryData.score - existingEntry.score;
            if (scoreDiff > 0) {
                setPowerBank(prev => prev + scoreDiff);
            }
            setDiaryHistory(prev => prev.map(e => e.date === entryData.date ? entryData : e));
        } else { // This is a new entry
            const totalPower = entryData.score + DIARY_BONUS;
            setPowerBank(prev => prev + totalPower);
            setDiaryHistory(prev => [...prev, entryData].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
        setIsDiaryModalOpen(false);
        setEditingDiaryEntry(null);
    };

    const handleDeleteDiary = (date: string) => {
        setDiaryHistory(prev => prev.filter(e => e.date !== date));
    };

    const handleOpenDiaryEditor = (entry: DiaryEntry | null) => {
        setEditingDiaryEntry(entry);
        setIsDiaryModalOpen(true);
    };


  const handleSaveSleep = (record: SleepRecord) => {
    addSleepRecord(record);
    if (record.duration >= 6 && record.duration <= 8) {
      const SLEEP_BONUS = 10;
      setPowerBank(prev => prev + SLEEP_BONUS);
    }
    setIsSleepDiaryModalOpen(false);
  };
  
  const handleSaveMood = (record: MoodRecord) => {
    const today = new Date().toISOString().split('T')[0];
    const previousMood = moodHistory.find(r => r.date === today);

    setMoodHistory(prev => {
        const newHistory = prev.filter(r => r.date !== record.date);
        newHistory.push(record);
        return newHistory.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    if (snackbarTimeoutRef.current) {
        clearTimeout(snackbarTimeoutRef.current);
    }

    setSnackbar({
        show: true,
        message: '今日の状態を記録しました。',
        onUndo: () => {
            setMoodHistory(prev => {
                let restoredHistory = prev.filter(r => r.date !== today);
                if (previousMood) {
                    restoredHistory.push(previousMood);
                }
                return restoredHistory.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            });
            setSnackbar({ show: false, message: '' });
        }
    });

    snackbarTimeoutRef.current = window.setTimeout(() => {
        setSnackbar({ show: false, message: '' });
    }, 2000);
  };

  const handleAttack = (power: number) => {
    if (!monster || power <= 0) return;
    setAttackPower(power);
    setPowerBank(prev => Math.max(0, prev - power));

    const newHP = Math.max(0, monster.currentHP - power);
    const updatedMonster = { ...monster, currentHP: newHP };
    setMonster(updatedMonster);
    
    setAppState('ATTACK_RESULT');
  };

  const handleDevKill = () => {
      if (!monster) return;
      // 開発用：パワーを消費せずに即死させる
      setAttackPower(monster.currentHP);
      const updatedMonster = { ...monster, currentHP: 0 };
      setMonster(updatedMonster);
      setAppState('ATTACK_RESULT');
  };
  
  const handleAddToDo = (item: Omit<ToDoItem, 'id' | 'isCompleted' | 'isFavorite' | 'order'>) => {
    const newToDo: ToDoItem = {
        ...item,
        id: Date.now(),
        isCompleted: false,
        isFavorite: false,
        order: Date.now(), // New items go to the end
    };
    setToDoList(prev => [...prev, newToDo]);
  };
  
  const handleUpdateToDo = (updatedItem: ToDoItem) => {
    setToDoList(prevList =>
        prevList.map(todo => (todo.id === updatedItem.id ? updatedItem : todo))
    );
  };
  
  const handleEditToDo = (id: number) => {
      setEditingToDoId(id);
      setIsToDoModalOpen(true);
  };
  
 const handleToggleToDo = (id: number) => {
    const targetTodo = toDoList.find(todo => todo.id === id);
    if (!targetTodo) return;

    const TODO_BONUS = 10;
    
    // Toggle points based on completion status
    if (!targetTodo.isCompleted) {
        // Task is being completed
        setPowerBank(prev => prev + TODO_BONUS);
    } else {
        // Task is being marked as incomplete
        setPowerBank(prev => Math.max(0, prev - TODO_BONUS));
    }

    setToDoList(prevList =>
        prevList.map(todo =>
            todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo
        )
    );
};
  
  const handleDeleteToDo = (id: number) => {
      setToDoList(prev => prev.filter(todo => todo.id !== id));
  };
  
  const handleToggleFavoriteToDo = (id: number) => {
      setToDoList(prevList =>
          prevList.map(todo =>
              todo.id === id ? { ...todo, isFavorite: !todo.isFavorite } : todo
          )
      );
  };
  
  const handleReorderToDo = (reorderedList: ToDoItem[]) => {
      setToDoList(reorderedList);
  };
  
  const handleSortToDoByDate = () => {
      setToDoList(prevList => {
        const favoriteItems = prevList.filter(t => t.isFavorite);
        const unpinnedItems = prevList.filter(t => !t.isFavorite);

        const dateSort = (a: ToDoItem, b: ToDoItem) => {
            const aDateTime = a.dueDate ? `${a.dueDate} ${a.startTime || '00:00'}` : 'z'; // 'z' sorts after dates
            const bDateTime = b.dueDate ? `${b.dueDate} ${b.startTime || '00:00'}` : 'z';
            if (aDateTime < bDateTime) return -1;
            if (aDateTime > bDateTime) return 1;
            return 0;
        };

        favoriteItems.sort(dateSort);
        unpinnedItems.sort(dateSort);

        const sortedList = [...favoriteItems, ...unpinnedItems];
        
        return sortedList.map((item, index) => ({ ...item, order: index }));
    });
  };


  const handleRestart = () => {
    if (monster && monster.currentHP <= 0) {
        setMonster(null);
    }
    setAttackPower(0);
    setAppState('HOME');
  }

  const renderContent = () => {
    switch (appState) {
      case 'HOME':
        return <Home 
                    onStart={handleStartChat}
                    onSaveAndStart={handleSaveAndStart}
                    aiName={aiName}
                    onSaveName={handleSaveAiName}
                    monster={monster}
                    onAttack={() => handleAttack(powerBank)}
                    onDevKill={handleDevKill}
                    powerBank={powerBank}
                    toDoList={toDoList}
                    onToggleToDo={handleToggleToDo}
                    onOpenToDo={() => setIsToDoModalOpen(true)}
                    onDeleteToDo={handleDeleteToDo}
                    onToggleFavoriteToDo={handleToggleFavoriteToDo}
                    moodHistory={moodHistory}
                    onSaveMood={handleSaveMood}
                />;
      case 'CHAT':
        if (!aiName) {
            handleRestart();
            return null;
        }
        return <ChatWindow onMonsterGenerated={handleMonsterGenerated} aiName={aiName} />;
      case 'MONSTER_REVEAL':
        if (!monster) return null;
        return (
            <MonsterReveal 
                monster={monster} 
                onOpenDiary={() => handleOpenDiaryEditor(null)}
                onAttack={() => handleAttack(powerBank)}
                onDevKill={handleDevKill}
                onRestart={handleRestart}
                powerBank={powerBank}
            />
        );
      case 'ATTACK_RESULT':
        if (!monster) return null;
        return <AttackResult monster={monster} achievementScore={attackPower} onRestart={handleRestart} />;
      default:
        return <Home 
                    onStart={handleStartChat} 
                    onSaveAndStart={handleSaveAndStart}
                    aiName={aiName} 
                    onSaveName={handleSaveAiName}
                    monster={monster}
                    onAttack={() => handleAttack(powerBank)}
                    onDevKill={handleDevKill}
                    powerBank={powerBank}
                    toDoList={toDoList}
                    onToggleToDo={handleToggleToDo}
                    onOpenToDo={() => setIsToDoModalOpen(true)}
                    onDeleteToDo={handleDeleteToDo}
                    onToggleFavoriteToDo={handleToggleFavoriteToDo}
                    moodHistory={moodHistory}
                    onSaveMood={handleSaveMood}
                />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 font-sans p-4 pt-20 md:pt-4">
       <Header 
          powerBank={powerBank}
          onOpenDiary={() => handleOpenDiaryEditor(null)}
          onOpenToDo={() => setIsToDoModalOpen(true)}
          onOpenDiaryHistory={() => setIsDiaryHistoryModalOpen(true)}
          onOpenGraph={() => setIsGraphModalOpen(true)}
          onOpenSleepDiary={() => setIsSleepDiaryModalOpen(true)}
        />
      {renderContent()}
       {isDiaryModalOpen && (
        <DiaryPage 
          onSave={handleSaveOrUpdateDiary}
          onClose={() => {
            setIsDiaryModalOpen(false);
            setEditingDiaryEntry(null);
          }}
          entryToEdit={editingDiaryEntry}
          existingDates={diaryHistory.map(e => e.date)}
        />
      )}
      {isToDoModalOpen && (
        <ToDoModal
            onClose={() => {
                setIsToDoModalOpen(false);
                setEditingToDoId(null);
            }}
            toDoList={toDoList}
            onAdd={handleAddToDo}
            onUpdate={handleUpdateToDo}
            onToggle={handleToggleToDo}
            onDelete={handleDeleteToDo}
            onToggleFavorite={handleToggleFavoriteToDo}
            onReorder={handleReorderToDo}
            onSortByDate={handleSortToDoByDate}
            initialEditId={editingToDoId}
        />
      )}
      {isDiaryHistoryModalOpen && (
        <DiaryHistoryModal
            diaryHistory={diaryHistory}
            onClose={() => setIsDiaryHistoryModalOpen(false)}
            onEdit={handleOpenDiaryEditor}
            onDelete={handleDeleteDiary}
            onAddPast={() => handleOpenDiaryEditor(null)}
        />
      )}
      {isSleepDiaryModalOpen && (
        <SleepDiaryModal 
          onSave={handleSaveSleep}
          onClose={() => setIsSleepDiaryModalOpen(false)}
        />
      )}
      {isGraphModalOpen && (
        <GraphModal onClose={() => setIsGraphModalOpen(false)} />
      )}
      {isLoginBonusModalOpen && loginBonusInfo && (
        <LoginBonusModal 
            onClose={() => setIsLoginBonusModalOpen(false)}
            days={loginBonusInfo.days}
            points={loginBonusInfo.points}
        />
      )}
      {snackbar.show && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-4 animate-fade-in-up z-50">
                <p>{snackbar.message}</p>
                {snackbar.onUndo && (
                    <button onClick={snackbar.onUndo} className="font-bold text-teal-300 hover:text-teal-200">
                        取り消す
                    </button>
                )}
            </div>
        )}
    </div>
  );
};

export default App;