
import React from 'react';
import type { Monster } from '../types';

interface MonsterRevealProps {
  monster: Monster;
  onOpenDiary: () => void;
  onAttack: () => void;
  onDevKill: () => void;
  onRestart: () => void;
  powerBank: number;
}

const MonsterReveal: React.FC<MonsterRevealProps> = ({ monster, onOpenDiary, onAttack, onDevKill, onRestart, powerBank }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-6 w-full max-w-md mx-auto animate-fade-in-up">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">ストレスモンスターが現れた！</h1>
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 w-full mb-6">
        <p className="text-slate-600 mb-4 text-sm">あなたのモヤモヤから生まれました</p>
        <h2 className="text-3xl font-bold text-orange-500 mb-4">{monster.name}</h2>
        <div className="w-56 h-56 mx-auto bg-slate-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden relative">
             <div className="absolute inset-0 bg-orange-100/50 rounded-full blur-2xl animate-pulse"></div>
            <img src={monster.imageUrl} alt={monster.name} className="w-full h-full object-contain relative z-10 animate-float" />
        </div>
        
        {/* HP Bar */}
        <div className="w-full bg-slate-200 rounded-full h-4 border border-slate-300 overflow-hidden mb-2">
          <div
            className="bg-red-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${(monster.currentHP / monster.score) * 100}%` }}
          ></div>
        </div>
        <p className="text-sm text-slate-600">
          HP: <span className="font-bold text-red-600 text-lg">{monster.currentHP}</span> / {monster.score}
        </p>
      </div>

      <div className="w-full space-y-4">
        {/* 攻撃ボタン（パワーがある時だけ押せる） */}
        <div className="relative group">
            <button
                onClick={onAttack}
                disabled={powerBank <= 0}
                className="w-full px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-[1.02] disabled:from-slate-300 disabled:to-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
            >
                ⚔️ パワー ({powerBank}) で攻撃する
            </button>
            {powerBank <= 0 && (
                <p className="text-xs text-red-500 mt-1 animate-bounce">パワーが足りません！貯めてから出直そう！</p>
            )}
        </div>

        {/* パワーを貯める選択肢 */}
        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-slate-200">
            <p className="text-sm font-bold text-slate-700 mb-3">どうやってパワーを貯める？</p>
            
            <div className="grid gap-3">
                <button
                    onClick={onOpenDiary}
                    className="w-full py-3 px-4 bg-white border-2 border-teal-400 text-teal-600 rounded-xl font-bold hover:bg-teal-50 transition-colors flex items-center justify-center gap-2"
                >
                    <span>📝</span> すぐに日記を書く (+10pt)
                </button>

                <button
                    onClick={onRestart}
                    className="w-full py-3 px-4 bg-white border-2 border-blue-400 text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors text-sm flex items-center justify-center gap-2"
                >
                    <span>🏠</span> ホームに戻ってToDoや睡眠記録をする
                </button>
            </div>
        </div>

        {/* 開発用（こっそり） */}
        <button
            onClick={onDevKill}
            className="text-[10px] text-slate-300 hover:text-red-400 mt-4 underline"
        >
            [開発用] 強制討伐
        </button>
      </div>
    </div>
  );
};

export default MonsterReveal;
