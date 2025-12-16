import React, { useState } from 'react';

interface ManualLocationModalProps {
    onClose: () => void;
    onSave: (zip: string) => void;
}

const ManualLocationModal: React.FC<ManualLocationModalProps> = ({ onClose, onSave }) => {
    const [zip, setZip] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // ★ここでハイフンを空文字に置換して消してしまう！
        const cleanZip = zip.replace(/-/g, '');
        
        if (cleanZip.length >= 7) {
            onSave(cleanZip);
        } else {
            alert("7桁の郵便番号を入力してください");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-slide-up">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">場所を手動で設定</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        ✕
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6">
                    <p className="text-sm text-slate-600 mb-4">
                        郵便番号を入力してください。<br/>
                        <span className="text-xs text-slate-400">※おおよその位置情報を取得します</span>
                    </p>

                    <input
                        type="text"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        // ★ここが修正ポイント：入力例の表示
                        placeholder="例: 1000001 (ハイフンなし)"
                        className="w-full p-3 border border-slate-300 rounded-lg text-lg tracking-widest text-center focus:ring-2 focus:ring-blue-400 focus:outline-none mb-6"
                        maxLength={8} 
                        inputMode="numeric"
                        pattern="\d*"
                        autoFocus
                    />

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition active:scale-95"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            // ハイフンを除いて7文字未満ならボタンを押せなくする
                            disabled={zip.replace(/-/g, '').length < 7}
                            className="flex-1 py-3 px-4 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 shadow-md transition active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
                        >
                            決定
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManualLocationModal;