
import React, { useState, useEffect, useCallback } from 'react';
import Home from './components/Home';
import ChatWindow from './components/ChatWindow';
import MonsterReveal from './components/MonsterReveal';
import AttackResult from './components/AttackResult';
import Header from './components/Header';
import DiaryPage from './components/DiaryPage';
import ToDoModal from './components/ToDoModal';
import DiaryHistoryModal from './components/DiaryHistoryModal';
import GraphModal from './components/GraphModal';
import LoginBonusModal from './components/LoginBonusModal';
import SleepDiaryModal from './components/SleepDiaryModal';
import EditDiaryModal from './components/EditDiaryModal';
import type { AppState, Monster, DiaryEntry, ToDoItem, StressRecord, SleepRecord, MoodRecord } from './types';

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>('HOME');
    const [aiName, setAiName] = useState<string | null>(null);
    const [monster, setMonster] = useState<Monster | null>(null);
    const [powerBank, setPowerBank] = useState(0);
    const [lastAttackScore, setLastAttackScore] = useState(0);

    // Modals
    const [showDiary, setShowDiary] = useState(false);
    const [showToDo, setShowToDo] = useState(false);
    const [showDiaryHistory, setShowDiaryHistory] = useState(false);
    const [showGraph, setShowGraph] = useState(false);
    const [showLoginBonus, setShowLoginBonus] = useState(false);
    const [showSleepDiary, setShowSleepDiary] = useState(false);
    const [entryToEdit, setEntryToEdit] = useState<DiaryEntry | null>(null);
    const [isAddingPastDiary, setIsAddingPastDiary] = useState(false);

    // Data Histories
    const [diaryHistory, setDiaryHistory] = useState<DiaryEntry[]>([]);
    const [toDoList, setToDoList] = useState<ToDoItem[]>([]);
    const [stressHistory, setStressHistory] = useState<StressRecord[]>([]);
    const [sleepHistory, setSleepHistory] = useState<SleepRecord[]>([]);
    const [moodHistory, setMoodHistory] = useState<MoodRecord[]>([]);

    const loadData = useCallback(() => {
        try {
            const savedAiName = localStorage.getItem('aiName');
            if (savedAiName) setAiName(savedAiName);
            
            const savedMonster = localStorage.getItem('monster');
            if (savedMonster) {
                const parsedMonster = JSON.parse(savedMonster);
                // ★修正: 昔のローカル画像("/monsters/...")が残っていたら、URLが無効なのでリセットする
                // これで「赤い箱」問題を自動的に解決します
                if (parsedMonster.imageUrl && parsedMonster.imageUrl.startsWith('/monsters/')) {
                    console.log("古い画像パスを検知しました。モンスターデータをリセットします。");
                    setMonster(null);
                    localStorage.removeItem('monster');
                } else {
                    setMonster(parsedMonster);
                }
            }
            
            const savedPowerBank = localStorage.getItem('powerBank');
            if (savedPowerBank) setPowerBank(parseInt(savedPowerBank, 10));

            const savedDiary = localStorage.getItem('diaryHistory');
            if (savedDiary) setDiaryHistory(JSON.parse(savedDiary).sort((a: DiaryEntry, b: DiaryEntry) => b.date.localeCompare(a.date)));

            const savedToDo = localStorage.getItem('toDoList');
            if (savedToDo) setToDoList(JSON.parse(savedToDo));

            const savedStress = localStorage.getItem('stressHistory');
            if (savedStress) setStressHistory(JSON.parse(savedStress));
            
            const savedSleep = localStorage.getItem('sleepHistory');
            if (savedSleep) setSleepHistory(JSON.parse(savedSleep));

            const savedMood = localStorage.getItem('moodHistory');
            if (savedMood) setMoodHistory(JSON.parse(savedMood));

            // Login Bonus Check
            const lastLogin = localStorage.getItem('lastLoginDate');
            const today = new Date().toISOString().split('T')[0];
            if (lastLogin !== today) {
                const consecutiveDays = parseInt(localStorage.getItem('consecutiveLoginDays') || '0', 10);
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const isConsecutive = lastLogin === yesterday.toISOString().split('T')[0];
                const newConsecutiveDays = isConsecutive ? consecutiveDays + 1 : 1;
                
                if (newConsecutiveDays > 0) {
                    const points = newConsecutiveDays * 5;
                    setPowerBank(prev => prev + points);
                    setShowLoginBonus(true);
                    localStorage.setItem('loginBonusInfo', JSON.stringify({ days: newConsecutiveDays, points }));
                }
                
                localStorage.setItem('lastLoginDate', today);
                localStorage.setItem('consecutiveLoginDays', newConsecutiveDays.toString());
            }

        } catch (error) {
            console.error("Failed to load data from localStorage", error);
        }
    }, []);
    
    useEffect(() => {
        loadData();
    }, [loadData]);

    const saveData = (key: string, data: any) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Failed to save ${key} to localStorage`, error);
        }
    };
    
    const handleSaveName = (name: string) => {
        setAiName(name);
        saveData('aiName', name);
    };

    const handleStartChat = () => setAppState('CHAT');
    
    const handleSaveAndStart = (name: string) => {
        handleSaveName(name);
        handleStartChat();
    }
    
    const handleMonsterGenerated = (newMonster: Monster) => {
        setMonster(newMonster);
        setAppState('MONSTER_REVEAL');
        setStressHistory(prev => [...prev, { date: new Date().toISOString(), score: newMonster.score }].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        saveData('stressHistory', stressHistory);
        saveData('monster', newMonster);
    };

    const handleAttack = () => {
        if (!monster || powerBank <= 0) return;
        setLastAttackScore(powerBank);
        const newHP = Math.max(0, monster.currentHP - powerBank);
        const updatedMonster = { ...monster, currentHP: newHP };
        setMonster(updatedMonster);
        setPowerBank(0);
        setAppState('ATTACK_RESULT');
        saveData('monster', updatedMonster);
        saveData('powerBank', 0);
    };
    
    const handleDevKill = () => {
        if (!monster) return;
        setLastAttackScore(monster.currentHP);
        const updatedMonster = { ...monster, currentHP: 0 };
        setMonster(updatedMonster);
        setAppState('ATTACK_RESULT');
        saveData('monster', updatedMonster);
    };

    const handleRestart = () => {
        if (monster && monster.currentHP <= 0) {
            setMonster(null);
            saveData('monster', null);
        }
        setAppState('HOME');
    };

    const handleSaveDiary = (entry: DiaryEntry) => {
        const bonus = entryToEdit ? 0 : 10;
        const totalScore = entry.score + bonus;
        setPowerBank(prev => prev + totalScore);
        saveData('powerBank', powerBank + totalScore);

        setDiaryHistory(prev => {
            const existingIndex = prev.findIndex(e => e.date === entry.date);
            let newHistory;
            if (existingIndex > -1) {
                newHistory = [...prev];
                newHistory[existingIndex] = entry;
            } else {
                newHistory = [...prev, entry];
            }
            const sortedHistory = newHistory.sort((a, b) => b.date.localeCompare(a.date));
            saveData('diaryHistory', sortedHistory);
            return sortedHistory;
        });

        setShowDiary(false);
        setEntryToEdit(null);
        setIsAddingPastDiary(false);
    };

    const handleEditDiary = (entry: DiaryEntry) => {
        setEntryToEdit(entry);
        setShowDiary(true);
    };

    const handleDeleteDiary = (date: string) => {
        setDiaryHistory(prev => {
            const newHistory = prev.filter(e => e.date !== date);
            saveData('diaryHistory', newHistory);
            return newHistory;
        });
    };
    
    // ToDo Handlers
    const handleAddToDo = (item: Omit<ToDoItem, 'id' | 'isCompleted'|'isFavorite'|'order'>) => {
        setToDoList(prev => {
            const newItem: ToDoItem = {
                ...item,
                id: Date.now(),
                isCompleted: false,
                isFavorite: false,
                order: prev.length
            };
            const newList = [...prev, newItem];
            saveData('toDoList', newList);
            return newList;
        });
    };

    const handleUpdateToDo = (updatedItem: ToDoItem) => {
        setToDoList(prev => {
            const newList = prev.map(item => item.id === updatedItem.id ? updatedItem : item);
            saveData('toDoList', newList);
            return newList;
        });
    };
    
    const handleToggleToDo = (id: number) => {
        setToDoList(prev => {
            const newList = prev.map(item =>
                item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
            );
            saveData('toDoList', newList);
            return newList;
        });
    };
    
    const handleDeleteToDo = (id: number) => {
        setToDoList(prev => {
            const newList = prev.filter(item => item.id !== id);
            saveData('toDoList', newList);
            return newList;
        });
    };
    
    const handleToggleFavoriteToDo = (id: number) => {
        setToDoList(prev => {
            const newList = prev.map(item =>
                item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
            );
            saveData('toDoList', newList);
            return newList;
        });
    };
    
    const handleReorderToDo = (list: ToDoItem[]) => {
        setToDoList(list);
        saveData('toDoList', list);
    };

    const handleSortByDate = () => {
        setToDoList(prev => {
            const sorted = [...prev].sort((a, b) => {
                const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                if (dateA !== dateB) return dateA - dateB;

                const timeA = a.startTime ? a.startTime.replace(':', '') : '9999';
                const timeB = b.startTime ? b.startTime.replace(':', '') : '9999';
                return parseInt(timeA) - parseInt(timeB);
            });
            const reordered = sorted.map((item, index) => ({ ...item, order: index }));
            saveData('toDoList', reordered);
            return reordered;
        });
    };

    const handleSaveSleep = (record: SleepRecord) => {
        if (record.duration >= 6 && record.duration <= 8) {
             setPowerBank(prev => prev + 10);
             saveData('powerBank', powerBank + 10);
        }
        setSleepHistory(prev => {
             const newHistory = [...prev.filter(r => r.date !== record.date), record]
                .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
             saveData('sleepHistory', newHistory);
             return newHistory;
        });
        setShowSleepDiary(false);
    };
    
    const handleSaveMood = (record: MoodRecord) => {
        setMoodHistory(prev => {
            const existingIndex = prev.findIndex(r => r.date === record.date);
            let newHistory;
            if (existingIndex > -1) {
                newHistory = [...prev];
                newHistory[existingIndex] = record;
            } else {
                newHistory = [...prev, record];
            }
            const sorted = newHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            saveData('moodHistory', sorted);
            return sorted;
        });
    };

    const renderContent = () => {
        switch(appState) {
            case 'CHAT':
                return <ChatWindow onMonsterGenerated={handleMonsterGenerated} 
                aiName={aiName || 'AIアシスタント'} onBack={() => setAppState('HOME')} />;
            case 'MONSTER_REVEAL':
                return monster && <MonsterReveal monster={monster} onOpenDiary={() => setShowDiary(true)} onAttack={handleAttack} onDevKill={handleDevKill} onRestart={handleRestart} powerBank={powerBank} />;
            case 'ATTACK_RESULT':
                return monster && <AttackResult monster={monster} achievementScore={lastAttackScore} onRestart={handleRestart} />;
            case 'HOME':
            default:
                return (
                    <Home
                        onStart={handleStartChat}
                        onSaveAndStart={handleSaveAndStart}
                        onSaveName={handleSaveName}
                        aiName={aiName}
                        monster={monster}
                        onAttack={handleAttack}
                        onDevKill={handleDevKill}
                        powerBank={powerBank}
                        toDoList={toDoList}
                        onToggleToDo={handleToggleToDo}
                        onOpenToDo={() => setShowToDo(true)}
                        onDeleteToDo={handleDeleteToDo}
                        onToggleFavoriteToDo={handleToggleFavoriteToDo}
                        moodHistory={moodHistory}
                        onSaveMood={handleSaveMood}
                    />
                );
        }
    }

    return (
        <main className="min-h-screen w-full pt-24 pb-12 px-4">
            {appState === 'HOME' && (
                 <Header 
                    powerBank={powerBank} 
                    onOpenDiary={() => { setEntryToEdit(null); setShowDiary(true); setIsAddingPastDiary(false); }}
                    onOpenToDo={() => setShowToDo(true)}
                    onOpenDiaryHistory={() => setShowDiaryHistory(true)}
                    onOpenGraph={() => setShowGraph(true)}
                    onOpenSleepDiary={() => setShowSleepDiary(true)}
                />
            )}

            {renderContent()}

            {showDiary && (
                <DiaryPage 
                    onClose={() => { setShowDiary(false); setEntryToEdit(null); setIsAddingPastDiary(false); }}
                    onSave={handleSaveDiary}
                    entryToEdit={isAddingPastDiary ? undefined : entryToEdit}
                    existingDates={isAddingPastDiary ? diaryHistory.map(e => e.date) : (entryToEdit ? [] : diaryHistory.map(e => e.date))}
                />
            )}
            
            {showToDo && (
                <ToDoModal
                    onClose={() => setShowToDo(false)}
                    toDoList={toDoList}
                    onAdd={handleAddToDo}
                    onUpdate={handleUpdateToDo}
                    onToggle={handleToggleToDo}
                    onDelete={handleDeleteToDo}
                    onToggleFavorite={handleToggleFavoriteToDo}
                    onReorder={handleReorderToDo}
                    onSortByDate={handleSortByDate}
                />
            )}

            {showDiaryHistory && (
                 <DiaryHistoryModal 
                    diaryHistory={diaryHistory}
                    onClose={() => setShowDiaryHistory(false)}
                    onEdit={(entry) => { handleEditDiary(entry); setShowDiaryHistory(false); }}
                    onDelete={handleDeleteDiary}
                    onAddPast={() => { setIsAddingPastDiary(true); setEntryToEdit(null); setShowDiary(true); }}
                />
            )}

            {showGraph && <GraphModal onClose={() => setShowGraph(false)} />}
            
            {showSleepDiary && <SleepDiaryModal onClose={() => setShowSleepDiary(false)} onSave={handleSaveSleep} />}

            {showLoginBonus && (
                <LoginBonusModal 
                    onClose={() => setShowLoginBonus(false)}
                    days={JSON.parse(localStorage.getItem('loginBonusInfo') || '{}').days || 1}
                    points={JSON.parse(localStorage.getItem('loginBonusInfo') || '{}').points || 5}
                />
            )}

             {entryToEdit && showDiary && !isAddingPastDiary && (
                <EditDiaryModal
                    entry={entryToEdit}
                    onSave={(updatedEntry) => {
                        handleSaveDiary(updatedEntry);
                        setEntryToEdit(null);
                    }}
                    onClose={() => {
                        setShowDiary(false);
                        setEntryToEdit(null);
                    }}
                />
            )}
        </main>
    );
};

export default App;
