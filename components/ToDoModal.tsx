
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { ToDoItem } from '../types';

interface ToDoModalProps {
    onClose: () => void;
    toDoList: ToDoItem[];
    onAdd: (item: Omit<ToDoItem, 'id' | 'isCompleted' | 'isFavorite' | 'order'>) => void;
    onUpdate: (item: ToDoItem) => void;
    onToggle: (id: number) => void;
    onDelete: (id: number) => void;
    onToggleFavorite: (id: number) => void;
    onReorder: (list: ToDoItem[]) => void;
    onSortByDate: () => void;
    initialEditId?: number | null;
}

const ToDoModal: React.FC<ToDoModalProps> = ({ onClose, toDoList, onAdd, onUpdate, onToggle, onDelete, onToggleFavorite, onReorder, onSortByDate, initialEditId }) => {
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [memo, setMemo] = useState('');
    const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
    const [editingItem, setEditingItem] = useState<ToDoItem | null>(null);
    const [openKebabMenu, setOpenKebabMenu] = useState<number | null>(null);
    const formRef = useRef<HTMLFormElement>(null);
    
    // input要素への参照（プログラムからピッカーを開く必要がある場合用だが、今回は透明inputタップで対応）
    const dateInputRef = useRef<HTMLInputElement>(null);

    const resetForm = () => {
        setTitle('');
        setDueDate('');
        setStartTime('');
        setEndTime('');
        setMemo('');
        setEditingItem(null);
    };

    useEffect(() => {
        const itemToEdit = toDoList.find(t => t.id === initialEditId);
        if (itemToEdit) {
            setEditingItem(itemToEdit);
            setTitle(itemToEdit.title);
            setDueDate(itemToEdit.dueDate || '');
            setStartTime(itemToEdit.startTime || '');
            setEndTime(itemToEdit.endTime || '');
            setMemo(itemToEdit.memo || '');
            formRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [initialEditId, toDoList]);

    const handleStartEditing = (item: ToDoItem) => {
        setEditingItem(item);
        setTitle(item.title);
        setDueDate(item.dueDate || '');
        setStartTime(item.startTime || '');
        setEndTime(item.endTime || '');
        setMemo(item.memo || '');
        setOpenKebabMenu(null);
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        resetForm();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        
        if (editingItem) {
            onUpdate({
                ...editingItem,
                title: title.trim(),
                dueDate: dueDate || null,
                startTime: startTime || null,
                endTime: endTime || null,
                memo: memo.trim(),
            });
        } else {
            onAdd({
                title: title.trim(),
                dueDate: dueDate || null,
                startTime: startTime || null,
                endTime: endTime || null,
                memo: memo.trim(),
            });
        }
        resetForm();
    };
    
    const sortedList = useMemo(() => {
        return [...toDoList].sort((a, b) => {
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;
            return a.order - b.order;
        });
    }, [toDoList]);

    const incompleteTodos = sortedList.filter(item => !item.isCompleted);
    const completedTodos = sortedList.filter(item => item.isCompleted);
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: ToDoItem) => {
        setDraggedItemId(item.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetItem: ToDoItem) => {
        e.preventDefault();
        if (draggedItemId === null || draggedItemId === targetItem.id) return;

        const draggedItem = sortedList.find(t => t.id === draggedItemId);
        if (!draggedItem) return;
        
        let newList = sortedList.filter(t => t.id !== draggedItemId);
        const targetIndex = newList.findIndex(t => t.id === targetItem.id);
        
        newList.splice(targetIndex, 0, draggedItem);
        
        const finalList = newList.map((item, index) => ({ ...item, order: index }));
        onReorder(finalList);
        setDraggedItemId(null);
    };
    
    const handleDragEnd = () => {
        setDraggedItemId(null);
    };
    
    const getTimeDisplay = (item: ToDoItem) => {
        if (item.startTime && item.endTime) {
            return `${item.startTime}~${item.endTime}`;
        }
        if (item.startTime) {
            return item.startTime;
        }
        return '';
    };

    const setToday = () => {
        const today = new Date().toISOString().split('T')[0];
        setDueDate(today);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-fade-in-up flex flex-col h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600" aria-label="Close ToDo list">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h2 className="text-xl font-bold text-slate-800 mb-4 text-center">ToDoリスト</h2>

                {/* Add ToDo Form */}
                <form ref={formRef} onSubmit={handleSubmit} className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="space-y-3">
                         <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="新しいタスクを入力 (必須)"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:outline-none placeholder-slate-400"
                            required
                        />
                         
                         {/* 日付・時間入力エリア */}
                         <div className="space-y-3">
                            {/* 日付選択行: 今日ボタン + 日付入力 */}
                            <div className="flex gap-2 h-11">
                                <button
                                    type="button"
                                    onClick={setToday}
                                    className="px-4 bg-teal-100 text-teal-700 hover:bg-teal-200 rounded-lg font-bold transition-colors text-sm flex-shrink-0"
                                >
                                    今日
                                </button>
                                
                                <div className="relative flex-1">
                                    {/* 実体のinput (透明にして上に重ねる) */}
                                    <input
                                        ref={dateInputRef}
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    {/* 見た目用の要素 */}
                                    <div className={`w-full h-full px-3 border border-slate-300 rounded-lg flex items-center justify-between bg-white ${dueDate ? 'text-slate-700' : 'text-slate-400'}`}>
                                        <span>{dueDate ? dueDate.replace(/-/g, '/') : '日付を設定'}</span>
                                        <span className="text-xl">📅</span>
                                    </div>
                                </div>
                            </div>

                            {/* 時間選択行 */}
                            <div className="flex items-center gap-2 h-11">
                                {/* 開始時間 */}
                                <div className="relative flex-1 h-full">
                                     <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        aria-label="Start time"
                                    />
                                    <div className={`w-full h-full px-3 border border-slate-300 rounded-lg flex items-center bg-white ${startTime ? 'text-slate-700' : 'text-slate-400'}`}>
                                        {startTime || '開始 00:00'}
                                    </div>
                                </div>
                                <span className="text-slate-400 font-medium">～</span>
                                {/* 終了時間 */}
                                <div className="relative flex-1 h-full">
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        aria-label="End time"
                                    />
                                     <div className={`w-full h-full px-3 border border-slate-300 rounded-lg flex items-center bg-white ${endTime ? 'text-slate-700' : 'text-slate-400'}`}>
                                        {endTime || '終了 00:00'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <input
                            type="text"
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            placeholder="メモ (任意)"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:outline-none placeholder-slate-400"
                        />
                    </div>
                    <div className="flex gap-2 mt-3">
                         <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                        >
                            {editingItem ? 'タスクを更新' : 'タスクを追加'}
                        </button>
                        {editingItem && (
                             <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-colors"
                            >
                                キャンセル
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onSortByDate}
                        className="w-full mt-2 px-6 py-2 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-colors text-sm"
                    >
                        日付順に並び替え
                    </button>
                </form>

                {/* ToDo List */}
                <div className="flex-1 overflow-y-auto pr-2" onClick={() => setOpenKebabMenu(null)}>
                    <div className="space-y-2">
                    {incompleteTodos.length > 0 ? (
                        incompleteTodos.map(item => (
                            <div 
                                key={item.id} 
                                draggable
                                onDragStart={(e) => handleDragStart(e, item)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, item)}
                                onDragEnd={handleDragEnd}
                                className={`p-3 rounded-lg flex items-start gap-3 transition-all cursor-grab active:cursor-grabbing ${item.isFavorite ? 'bg-yellow-50 border-yellow-300 border' : 'bg-white border border-slate-200'} ${draggedItemId === item.id ? 'opacity-50' : ''}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={false}
                                    onChange={() => onToggle(item.id)}
                                    className="h-6 w-6 rounded border-slate-300 text-green-500 focus:ring-green-400 mt-1 flex-shrink-0 cursor-pointer"
                                    id={`todo-item-${item.id}`}
                                />
                                <div className="flex-1">
                                    <label htmlFor={`todo-item-${item.id}`} className="font-medium cursor-pointer text-slate-800">
                                        {item.title}
                                    </label>
                                    {(item.dueDate || item.startTime || item.memo) && (
                                         <div className="text-xs text-slate-500 mt-1 flex items-center flex-wrap gap-x-3 gap-y-1">
                                            {item.dueDate && <span>期日: {item.dueDate.replace(/-/g, '/')} {getTimeDisplay(item)}</span>}
                                            {item.memo && <span>メモ: {item.memo}</span>}
                                        </div>
                                    )}
                                </div>
                                 <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => onToggleFavorite(item.id)}
                                        className="p-1 rounded-full flex-shrink-0 relative group"
                                        aria-label={item.isFavorite ? `Unfavorite ${item.title}` : `Favorite ${item.title}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-all duration-200 ease-in-out ${item.isFavorite ? 'text-yellow-400 fill-current' : 'text-slate-400 hover:text-yellow-400'}`} viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                            お気に入りにする
                                            <svg className="absolute text-slate-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon points="0,0 127.5,127.5 255,0"/></svg>
                                        </div>
                                    </button>
                                    <div className="relative">
                                        <button onClick={(e) => { e.stopPropagation(); setOpenKebabMenu(prev => prev === item.id ? null : item.id) }} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                            </svg>
                                        </button>
                                        {openKebabMenu === item.id && (
                                            <div className="absolute right-0 mt-2 w-28 bg-white rounded-md shadow-lg z-20 border border-slate-200 py-1">
                                                <button onClick={() => handleStartEditing(item)} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">編集</button>
                                                <button onClick={() => onDelete(item.id)} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">削除</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-slate-500 py-4">未完了のタスクはありません。</p>
                    )}
                    </div>

                    {completedTodos.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-bold text-slate-600 mb-2 pl-1">完了済みタスク</h3>
                            <div className="space-y-2">
                                {completedTodos.map(item => (
                                     <div key={item.id} className="p-3 rounded-lg flex items-start gap-3 bg-slate-100">
                                        <div className="relative group flex-shrink-0 mt-1">
                                            <input
                                                type="checkbox"
                                                checked={true}
                                                onChange={() => onToggle(item.id)}
                                                className="h-6 w-6 rounded border-slate-300 text-green-500 focus:ring-green-400 cursor-pointer"
                                                id={`todo-item-${item.id}`}
                                            />
                                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                            未完了にする
                                                <svg className="absolute text-slate-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon points="0,0 127.5,127.5 255,0"/></svg>
                                            </div>
                                        </div>
                                        <div className="flex-1 opacity-70">
                                            <label htmlFor={`todo-item-${item.id}`} className="font-medium line-through text-slate-500 cursor-pointer">
                                                {item.title}
                                            </label>
                                             {(item.dueDate || item.startTime || item.memo) && (
                                                <div className="text-xs text-slate-500 mt-1 flex items-center flex-wrap gap-x-3 gap-y-1">
                                                    {item.dueDate && <span>期日: {item.dueDate.replace(/-/g, '/')} {getTimeDisplay(item)}</span>}
                                                    {item.memo && <span>メモ: {item.memo}</span>}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => onDelete(item.id)}
                                            className="p-1 rounded-full text-slate-400 hover:bg-red-100 hover:text-red-500 flex-shrink-0"
                                            aria-label={`Delete ${item.title}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ToDoModal;
