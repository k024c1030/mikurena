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

// --- ★設定：保存するための「合言葉（キー）」 ---
// これを変えるとデータが読み込めなくなるので、固定します
const KEYS = {
  STRESS: 'stressHistory',
  SLEEP: 'sleepHistory',
  DIARY: 'diaryHistory',
  LOGIN: 'loginData',
  AI_NAME: 'aiName',
  MONSTER: 'monsterState',
  TODO: 'toDoList',
  MOOD: 'moodHistory'
};

const App: React.FC = () => {
  // =================================================================
  // 1. データの読み込み (アプリ起動時に1回だけ実行されます)
  // =================================================================

  //モンスターの状態
  const [monster, setMonster] = useState<Monster | null>(() => {
    // 1. 金庫からデータを取り出す（まだ文字の状態）
    const saved = localStorage.getItem(KEYS.MONSTER);
    
    // 2. データがあるかチェック
    return saved ? JSON.parse(saved) : null;
  });

  const [aiName, setAiName] = useState<string | null>(() => {
    const saved = localStorage.getItem(KEYS.AI_NAME);
    return saved ? JSON.parse(saved) : null;
  });

  //ToDoリスト（配列なので、なければ [] という空の配列にします）
  const [toDoList, setToDoList] = useState<ToDoItem[]>(() => {
    const saved = localStorage.getItem(KEYS.TODO);
    return saved ? JSON.parse(saved) : [];
  });

  //日記の履歴
  const [diaryHistory, setDiaryHistory] = useState<DiaryEntry[]>(() => {
    const saved = localStorage.getItem(KEYS.DIARY);
    return saved ? JSON.parse(saved) : [];
  });

  //気分の履歴
  const [moodHistory, setMoodHistory] = useState<MoodRecord[]>(() => {
    const saved = localStorage.getItem(KEYS.MOOD);
    return saved ? JSON.parse(saved) : [];
  });

  //睡眠の履歴
  const [sleepHistory, setSleepHistory] = useState<SleepRecord[]>(() => {
    const saved = localStorage.getItem(KEYS.SLEEP);
    return saved ? JSON.parse(saved) : [];
  });
  
  // ここからは保存しなくていい（画面を閉じたら消えていい）一時的なデータ
  const [appState, setAppState] = useState < AppState > ('HOME'); //今どの画面にいるか
  const [attackPower, setAttackPower] = useState(0); //今回の攻撃力
  const [powerBank, setPowerBank] = useState(0); //たまったパワー

  // モーダル（ポップアップ画面）が開いているかどうかを管理するスイッチたち
  // trueなら開く、falseなら閉じる
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false);
  const [editingDiaryEntry, setEditingDiaryEntry] = useState<DiaryEntry | null>(null);
  const [isDiaryHistoryModalOpen, setIsDiaryHistoryModalOpen] = useState(false);
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
  const [isSleepDiaryModalOpen, setIsSleepDiaryModalOpen] = useState(false);
  const [isLoginBonusModalOpen, setIsLoginBonusModalOpen] = useState(false);
  const [isToDoModalOpen, setIsToDoModalOpen] = useState(false);
  const [editingToDoId, setEditingToDoId] = useState<number | null>(null);
  const [loginBonusInfo, setLoginBonusInfo] = useState<{ days: number; points: number } | null>(null);

  //通知バーの設定
  const [snackbar, setSnackbar] = useState<{ show: boolean; message: string; onUndo?: () => void }>({ show: false, message: '' });
  // setTimeoutのIDを覚えておくためのメモ（連打された時に古いタイマーを消すため）
  const snackbarTimeoutRef = useRef<number | null>(null);

  // =================================================================
  // 2. データの自動保存 (データが変わるたびに実行されます)
  // =================================================================

  // useEffect: 「副作用」フック。
  // 第二引数（最後にある [monster] の部分）が変わるたびに、中身が実行される。
  useEffect(() => {
    if (monster) {
      // JSON.stringify: データを文字に変換して保存
      localStorage.setItem(KEYS.MONSTER, JSON.stringify(monster));
    } else {
      // モンスターがいない(null)なら、保存場所からも消す
      localStorage.removeItem(KEYS.MONSTER);
    }
    }, [monster]);

    // AIの名前が変わったら保存
    useEffect(() => {
      if (aiName) {
        localStorage.setItem(KEYS.AI_NAME, JSON.stringify(aiName));
      } else {
        localStorage.removeItem(KEYS.AI_NAME);
      }
    }, [aiName]);

    //ToDoリストが変わったら保存
    useEffect(() => {
      localStorage.setItem(KEYS.TODO, JSON.stringify(toDoList));
    }, [toDoList]);

    //日記が変わったら保存
    useEffect(() => {
      localStorage.setItem(KEYS.DIARY, JSON.stringify(diaryHistory));
    }, [diaryHistory]);

    //気分が変わったら保存
    useEffect(() => {
      localStorage.setItem(KEYS.MOOD, JSON.stringify(moodHistory));
    }, [moodHistory]);

    //睡眠が変わったら保存
    useEffect(() => {
      localStorage.setItem(KEYS.SLEEP, JSON.stringify(sleepHistory));
    }, [sleepHistory]);

    // =================================================================
    // 3. ログインボーナスなどの初期処理
    // =================================================================

    // 第二引数が [] (空っぽ) なので、アプリ起動時に「1回だけ」実行される
    useEffect(() => {
      //今日の日付を取得
      const today = new Date().toISOString().split('T')[0];

      //前回のログイン情報を取得
      const loginDataJson = localStorage.getItem(KEYS.LOGIN);
      let consecutiveDays = 1; //連続ログイン数

      if (loginDataJson) {
        //昔のデータを文字から元に戻す
        const { lastLoginDate, consecutiveDays: storedDays } = JSON.parse(loginDataJson);
        
        //「今日」と「最後にログインした日」が違う場合だけボーナス処理
        if (today !== lastLoginDate) {
          //きのうの日付を作る
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          // もし「最後のログイン」が「きのう」なら、連続記録更新！
            if (lastLoginDate === yesterdayStr) {
              consecutiveDays = Math.min(storedDays + 1, 7); 
              } else {
                //昨日ログインしてないなら、一日目に
                consecutiveDays = 1; // Streak broken
              }
              const points = consecutiveDays * 10;

              // setPowerBank(prev => ...) の書き方
              // prev は「変更前の値」。
              // 「今の値に points を足したものを新しい値にしてね」という意味。
              setPowerBank(prev => prev + points);
              
              setLoginBonusInfo({ days: consecutiveDays, points });
              setIsLoginBonusModalOpen(true);
              
              //今日のログイン情報を保存
              localStorage.setItem(KEYS.LOGIN, JSON.stringify({ lastLoginDate: today, consecutiveDays }));
            }
          } else {
            //初めてアプリを使った時
            const points = 10;
            setPowerBank(prev => prev + points);
            setLoginBonusInfo({ days: 1, points });
            setIsLoginBonusModalOpen(true);

            //初回記録を保存
            localStorage.setItem(KEYS.LOGIN, JSON.stringify({ lastLoginDate: today, consecutiveDays: 1 }));
          }
        }, []);

        // =================================================================
        // 4. アクション関数 (ボタンを押した時の処理)
        // =================================================================

        //AIの名前を保存する
        const handleSaveAiName = (name: string) => {
          // trim(): 前後の空白を削除 ("  ポチ  " -> "ポチ")
          if(name.trim()) setAiName(name.trim());
        };

        //チャット画面へ移動
        const handleStartChat = () => {
          if (aiName) setAppState('CHAT');
        };

        //名前を決めてからチャットへ
        const handleSaveAndStart = (name: string) => {
          if (name.trim()) {
            setAiName(name.trim());
            setAppState('CHAT');
          }
        };

        //モンスターが生成されたとき
        const handleMonsterGenerated = (generatedMonster: Monster) => {
          // スプレッド構文 (...generatedMonster):
          // 「generatedMonsterの中身を全部コピーして、新しいオブジェクトを作るよ」という意味。
          // さらに currentHP を追加しています。
          const monsterWithHP = { ...generatedMonster, currentHP: generatedMonster.score};
          setMonster(monsterWithHP);
          setAppState('MONSTER_REVEAL'); //お披露目画面へGO
        };

        //日記を保存または更新
        const handleSaveOrUpdateDiary = (entryData: DiaryEntry) => {
          //すでに同じ日付の日記があるか探す
          const existingEntry = diaryHistory.find(e => e.date === entryData.date);

          if (existingEntry) {
            //更新の場合：スコアが増えてたらぱわーを上げる
              const scoreDiff = entryData.score - existingEntry.score;
              if (scoreDiff > 0) setPowerBank(prev => prev + scoreDiff);

              // map関数: 配列の中身をひとつずつチェックして書き換える
              // 「日付が同じなら新しいデータに、違えばそのまま」にする
              setDiaryHistory(prev => prev.map(e => e.date === entryData.date ? entryData : e));
            } else {
              //新規作成のとき
              setPowerBank(prev => prev + entryData.score + 10);
              //新しい配列= [今までの全部(...prev), 新しいやつ]
              setDiaryHistory(prev => [...prev, entryData].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            }
            setIsDiaryModalOpen(false);
            setEditingDiaryEntry(null);
          };

          //日記削除
          const handleDeleteDiary = (date: string) => {
            // filter: 条件に合うものだけ残す
            // 「日付が一致しないもの」だけ残す＝一致するものを消す
            setDiaryHistory(prev => prev.filter(e => e.date !== date));
          };

          //日記編集モーダルを開く
          const handleOpenDiaryEditor = (entry: DiaryEntry | null) => {
            setEditingDiaryEntry(entry);
            setIsDiaryModalOpen(true);
          };
          //睡眠記録の保存
          const handleSaveSleep = (record: SleepRecord) => {
            setSleepHistory(prev => {
              //同じ日の記録があったら消して、新しいのを追加(上書き)
              const filterd = prev.filter(r => r.date !== record.date);
              return [...filterd, record]
            });

            //6時間～8時間ならボーナス
            if (record.duration >= 6 && record.duration <= 8) {
              setPowerBank(prev => prev + 10);
            }
            setIsSleepDiaryModalOpen(false);
          };
        
          //気分記録の保存
          const handleSaveMood = (record: MoodRecord) => {
            const today = new Date().toISOString().split('T')[0];
            //今日の気分が既にあるか確認
            const previousMood = moodHistory.find(r => r.date === today);

            setMoodHistory(prev => {
                const newHistory = prev.filter(r => r.date !== record.date);
                return newHistory.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            });

            //連打されたときに、前の通知タイマーをキャンセル
            if (snackbarTimeoutRef.current) {
                clearTimeout(snackbarTimeoutRef.current);
            }
            //「記録しました」通知を表示
            setSnackbar({
                show: true,
                message: '今日の状態を記録しました。',
                onUndo: () => {
                  //取り消しボタンが押された時の処理
                  // さっき上書きしちゃったけど、前のデータ(previousMood)に戻すよ！
                  if (previousMood) {
                    setMoodHistory(prev => [...prev, previousMood].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                  } else {
                    //前のデータがないなら消す
                    setMoodHistory(prev => prev.filter(r => r.date !== today));
                  }
                  setSnackbar({ show: false, message: ''});
                }
              });

              //2秒後に通知を自動で消す
              snackbarTimeoutRef.current = window.setTimeout(() => setSnackbar({ show: false, message: '' }), 2000);
            };

            // 攻撃処理
            const handleAttack = (power: number) => {
              if (!monster || power <= 0) return;
              setAttackPower(power);
              //パワーは0未満にならないように Math.max(0, ...) を使う
              setPowerBank(prev => Math.max(0, prev - power));

              const newHP = Math.max(0, monster.currentHP - power);
              const updatedMonster = { ...monster, currentHP: newHP };
              setMonster(updatedMonster);
              setAppState('ATTACK_RESULT');
            };

            // 開発用：即死コマンド
            const handleDevKill = () => {
              if (!monster) return;
                  // 開発用：パワーを消費せずに即死させる
                  setAttackPower(monster.currentHP);
                  setMonster({ ...monster, currentHP: 0 });
                  setAppState('ATTACK_RESULT');
            };

            // --- ToDo関連 ---
            // ToDo追加
            // Omit<...> : ToDoItem型から id などを「除外」した型。入力時にはまだIDがないから。
            const handleAddToDo = (item: Omit<ToDoItem, 'id' | 'isCompleted' | 'isFavorite' | 'order'>) => {
              const newToDo: ToDoItem = {
                  ...item,
                  id: Date.now(), // 現在時刻をIDにする
                  isCompleted: false,
                  isFavorite: false,
                  order: Date.now(),
              };
              setToDoList(prev => [...prev, newToDo]);
            };

            //ToDo更新
            const handleUpdateToDo = (updatedItem: ToDoItem) => {
              setToDoList(prev => prev.map(todo => (todo.id === updatedItem.id ? updatedItem : todo)));
            };

            // ToDo完了/未完了の切り替え
            const handleToggleToDo = (id: number) => {
              const targetTodo = toDoList.find(todo => todo.id === id);
              if (!targetTodo) return;
            
              
              //完了にするならパワーゲット、未完了に戻すならパワー没収  
              if (!targetTodo.isCompleted) {
                setPowerBank(prev => prev + 10);
              } else {
                setPowerBank(prev => Math.max(0, Math.max(0, prev - 10)));
              }

              //isCompletedを反転(!マーク)させる
              setToDoList(prev => prev.map(todo => todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo));
            };

            //ToDo削除
            const handleDeleteToDo = (id: number) => {
                setToDoList(prev => prev.filter(todo => todo.id !== id));
            };
            
            //お気に入り切り替え
            const handleToggleFavoriteToDo = (id: number) => {
                setToDoList(prev => prev.map(todo => todo.id === id ? { ...todo, isFavorite: !todo.isFavorite } : todo));
            };

            //並び替え（ドラッグ＆ドロップなどで使う想定）
            const handleReorderToDo = (reorderedList: ToDoItem[]) => {
                setToDoList(reorderedList);
            };

            //日付順に並び替え
            const handleSortToDoByDate = () => {
                setToDoList(prevList => {
                  const favoriteItems = prevList.filter(t => t.isFavorite);
                  const unpinnedItems = prevList.filter(t => !t.isFavorite);

                  //ソート用の比較関数
                  const dateSort = (a: ToDoItem, b: ToDoItem) => {
                    //日付がないものは 'z' (アルファベットの最後) として扱い、一番下に持っていくテクニック
                      const aDateTime = a.dueDate ? `${a.dueDate} ${a.startTime || '00:00'}` : 'z';
                      const bDateTime = b.dueDate ? `${b.dueDate} ${b.startTime || '00:00'}` : 'z';
                      if (aDateTime < bDateTime) return -1; //aが先
                      if (aDateTime > bDateTime) return 1; //bが先
                      return 0; //同じ
                  };

                  favoriteItems.sort(dateSort);
                  unpinnedItems.sort(dateSort);
                  
                  //お気に入りを上にして結合
                  return [...favoriteItems, ...unpinnedItems].map((item, index) => ({ ...item, order: index }));
                });
              };

              //ホームに戻る / リスタート
              const handleRestart = () => {
                // モンスターが倒されてたら消す
                if (monster && monster.currentHP <= 0) setMonster(null);
                setAttackPower(0);
                setAppState('HOME');
              };

              // =================================================================
              // 5. 画面表示 (Render)
              // =================================================================
              // switch文: appStateの値によって表示する部品を切り替える
              const renderContent = () => {
                switch (appState) {
                    case 'HOME':
                        return (
                            <Home 
                                // 子部品(Home)に、親(App)が持っている関数やデータを渡す（Props）
                                // 左側が子部品での名前、右側が親での名前
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
                            />
                        );
                    case 'CHAT':
                        if (!aiName) { handleRestart(); return null; }
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
                        return null;
                }
            };

            // 実際のHTMLのような見た目の部分 (JSX)
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
                    
                    {/* ここで画面の中身が切り替わります */}
                    {renderContent()}

                    {/* 各種モーダル（条件がtrueの時だけ表示される） */}
                    {/* A && B : AがtrueならBを表示する、という書き方 */}
                    
                    {isDiaryModalOpen && (
                        <DiaryPage 
                            onSave={handleSaveOrUpdateDiary}
                            // モーダルを閉じる時に、編集中のデータも空にする
                            onClose={() => { setIsDiaryModalOpen(false); setEditingDiaryEntry(null); }}
                            entryToEdit={editingDiaryEntry}
                            existingDates={diaryHistory.map(e => e.date)}
                        />
                    )}
                    
                    {isToDoModalOpen && (
                        <ToDoModal
                            onClose={() => { setIsToDoModalOpen(false); setEditingToDoId(null); }}
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
                    
                    {isGraphModalOpen && <GraphModal onClose={() => setIsGraphModalOpen(false)} />}
                    
                    {isLoginBonusModalOpen && loginBonusInfo && (
                        <LoginBonusModal 
                            onClose={() => setIsLoginBonusModalOpen(false)}
                            days={loginBonusInfo.days}
                            points={loginBonusInfo.points}
                        />
                    )}

                    {/* スナックバー（画面下の黒い通知） */}
                    {snackbar.show && (
                        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-4 animate-fade-in-up z-50">
                            <p>{snackbar.message}</p>
                            {snackbar.onUndo && (
                                <button onClick={snackbar.onUndo} className="font-bold text-teal-300 hover:text-teal-200">取り消す</button>
                            )}
                        </div>
                    )}
                </div>
            );
          };

          export default App;