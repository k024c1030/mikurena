import React, { useState } from 'react';

interface ManualLocationModalProps {
    onClose: () => void;
    onSave: (zip: string) => void;
}

const ManualLocationModal: React.FC<ManualLocationModalProps> = ({ onClose, onSave }) => {
    const [zip, setZip] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // 1. 全角数字を半角に直し、ハイフンなどの余計な記号をすべて消す（数字だけにする）
        const cleanedZip = zip
            .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
            .replace(/[^0-9]/g, ''); // 数字以外はすべて削除

        // 2. 桁数チェック（7桁あるか？）
        if (cleanedZip.length === 7) {
            // ★ここが修正点：ハイフンを入れずに、数字だけの状態で渡す！
            onSave(cleanedZip);
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
                        <span className="text-xs text-slate-400">※ハイフンあり・なし どちらでもOK</span>
                    </p>

                    <input
                        type="text"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        placeholder="例: 1600022"
                        className="w-full p-3 border border-slate-300 rounded-lg text-lg tracking-widest text-center focus:ring-2 focus:ring-blue-400 focus:outline-none mb-6"
                        inputMode="numeric"
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
                            // 数字以外を消して7桁未満なら押せないようにする
                            disabled={zip.replace(/[^0-9]/g, '').length < 7}
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