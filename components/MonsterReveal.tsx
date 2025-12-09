import React from 'react';
import type { Monster } from '../types';
import LoadingSpinner from './LoadingSpinner';

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
      <h1 className="text-2xl font-bold text-slate-800 mb-2">あなたのストレスからモンスターが生まれました！</h1>
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 w-full">
        <p className="text-slate-600 mb-4">このモンスターは...</p>
        <h2 className="text-4xl font-bold text-orange-500 mb-4">{monster.name}</h2>
        <div className="w-64 h-64 mx-auto bg-slate-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
            <img src={monster.imageUrl} alt={monster.name} className="w-full h-full object-cover" />
        </div>
        <div className="w-full bg-slate-200 rounded-full h-6 border border-slate-300">
          <div
            className="bg-red-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${(monster.currentHP / monster.score) * 100}%` }}
          ></div>
        </div>
        <p className="text-sm text-slate-600 mt-2">
          HP: <span className="font-bold text-red-600 text-lg">{monster.currentHP}</span> / {monster.score}
        </p>
      </div>
      <p className="text-slate-500 mt-6 mb-4">
        どうする？
      </p>
      <div className="w-full space-y-3">
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
        <button
            onClick={onOpenDiary}
            className="w-full px-8 py-3 bg-teal-500 text-white rounded-xl font-semibold text-base hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-200"
        >
            日記でパワーを貯める
        </button>
         <button
            onClick={onRestart}
            className="w-full px-8 py-2 bg-transparent text-slate-500 rounded-xl font-semibold text-sm hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all duration-200"
        >
            ホームに戻る
        </button>
      </div>
    </div>
  );
};

export default MonsterReveal;