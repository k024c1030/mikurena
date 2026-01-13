
import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage, Monster } from '../types';
import { MessageRole } from '../types';
import Message from './Message';
import ChatInput from './ChatInput';
import LoadingSpinner from './LoadingSpinner';
import { startChat, sendMessage, analyzeAndCreateMonster } from '../services/geminiService';
import type { Chat } from "@google/genai";

interface ChatWindowProps {
    onMonsterGenerated: (monster: Monster) => void;
    aiName: string;
    onBack: () => void; // ホームに戻るための関数を受け取るように追加
}

const PROPOSAL_CHECK_TAG = '[PROPOSAL_CHECK]';

const ChatWindow: React.FC<ChatWindowProps> = ({ onMonsterGenerated, aiName, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: MessageRole.MODEL,
      text: `こんにちは、${aiName}です。今日はどんなことが心にありますか？なんでも自由にお話ししてくださいね。`,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [proposalCheckMessageId, setProposalCheckMessageId] = useState<number | null>(null);
  const chatInstanceRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aiName) {
      chatInstanceRef.current = startChat(aiName);
    }
  }, [aiName]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (inputText: string) => {
    if (!inputText.trim() || isLoading || !chatInstanceRef.current) return;

    const nextId = messages.length > 0 ? messages[messages.length - 1].id + 1 : 1;
    const userMessage: ChatMessage = { id: nextId, role: MessageRole.USER, text: inputText };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoading(true);
    setProposalCheckMessageId(null);

    try {
        const aiResponse = await sendMessage(chatInstanceRef.current, inputText, nextId + 1);
        
        if (aiResponse.text.includes(PROPOSAL_CHECK_TAG)) {
            aiResponse.text = aiResponse.text.replace(PROPOSAL_CHECK_TAG, '').trim();
            setMessages((prevMessages) => [...prevMessages, aiResponse]);
            setProposalCheckMessageId(aiResponse.id);
        } else {
            setMessages((prevMessages) => [...prevMessages, aiResponse]);
        }

    } catch (error) {
        console.error("Failed to get response from AI", error);
        const errorId = messages.length > 0 ? messages[messages.length - 1].id + 2 : 2;
        const errorMessage: ChatMessage = {
            id: errorId,
            role: MessageRole.MODEL,
            text: "ごめんなさい、何かうまくいかなかったみたいです。もう一度試してみてください。"
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
        const userMessages = messages.filter(m => m.role === MessageRole.USER);
        const monster = await analyzeAndCreateMonster(userMessages);
        onMonsterGenerated(monster);
    } catch (error) {
        console.error("Failed to analyze and create monster", error);
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleProposalResponse = (accept: boolean) => {
    setProposalCheckMessageId(null);
    if (accept) {
        handleSendMessage("はい、お願いします");
    } else {
        handleAnalyze();
    }
  };

  const canAnalyze = messages.some(m => m.role === MessageRole.USER) && proposalCheckMessageId === null;

  if (isAnalyzing) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full max-w-3xl mx-auto text-center p-8">
            <LoadingSpinner />
            <p className="text-slate-600 mt-4 text-lg">あなたの心のモヤモヤを分析しています...</p>
            <p className="text-slate-500 mt-2">どんなモンスターが現れるかな？</p>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* ★ヘッダー部分: 戻るボタンを追加 */}
      <div className="bg-white/90 backdrop-blur-sm p-3 shadow-sm sticky top-0 z-20 border-b border-slate-200">
        <div className="max-w-3xl mx-auto flex items-center">
            <button
                onClick={onBack}
                className="text-slate-500 hover:bg-slate-100 p-2 rounded-full transition-colors mr-3 flex items-center gap-1"
                aria-label="ホームに戻る"
            >
                <span className="text-xl">⬅️</span>
                <span className="text-sm font-bold">ホーム</span>
            </button>
        </div>
      </div>

     <div className="flex flex-col flex-grow w-full max-w-3xl mx-auto p-4 h-full overflow-hidden">
        <header className="text-center mb-4 shrink-0">
            <h1 className="text-2xl font-bold text-slate-800">心の相談室</h1>
            <p className="text-slate-500 mt-1 text-sm">{aiName}が、あなたの話を聞きます。</p>
        </header>
        
        <div className="flex flex-col flex-grow bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden min-h-0">
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex flex-col space-y-4">
              {messages.map((msg) => (
                <div key={msg.id}>
                    <Message message={msg} />
                    {msg.id === proposalCheckMessageId && (
                        <div className="flex justify-start items-center gap-2 ml-12 mt-2">
                             <button onClick={() => handleProposalResponse(true)} className="px-4 py-2 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors">
                                はい、お願いします
                            </button>
                             <button onClick={() => handleProposalResponse(false)} className="px-4 py-2 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors">
                                いいえ、大丈夫です
                            </button>
                        </div>
                    )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start items-center space-x-2">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xl">
                        <span>☁️</span>
                    </div>
                    <div className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800">
                        <LoadingSpinner />
                    </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </div>
        
        <div className="mt-4 text-center shrink-0 pb-4">
             <button
                onClick={handleAnalyze}
                disabled={!canAnalyze || isLoading}
                className="px-8 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                悩みを分析してモンスターを出現させる
            </button>
        </div>
    </div>
    </div>
  );
};

export default ChatWindow;
