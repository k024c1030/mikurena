import React, { useState, useEffect } from 'react';

// ブラウザ標準の機能ですが、TypeScriptが「そんな機能知らないよ」とエラーを出すのを防ぎます
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type Props = {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
};

const ChatInput: React.FC<Props> = ({ onSendMessage, disabled }) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false); //音声認識中かどうか

  //--- 音声入力の準備 ---
  // ブラウザによって名前が違うので、どちらか使える方を代入します
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  // 実際に使う「認識係」を作ります
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  useEffect(() => {
    // もしブラウザが音声入力に対応していなければ何もしない
    if (!recognition) return;

    // 設定：連続で認識するかどうか（今回は一言ずつなのでfalse）、言語設定
    recognition.continuous = false;
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;

    // 「認識結果が出たとき」の動き
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText((prev) => prev + transcript); //今ある文字の後ろに追記
      setIsListening(false); //聞き取り終了
    };

    // 「認識が勝手に終わったとき」や「エラー」の動き
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error("音声認識エラー:", event.error);
      setIsListening(false);
    };
  }, []); //最初の一回だけ設定を作ります

  // マイクボタンを押したときの動き
  const handleVoiceInput = () => {
    if (!recognition) {
      alert("このブラウザは音声入力に対応していません。");
      return;
    }

    if (isListening) {
      recognition.stop(); //すでに聞いてるなら止める
      setIsListening(false);
    } else {
      recognition.start(); //聞いてないなら聞き始める
      setIsListening(true);
    }
  };

  // --- 音声入力の準備ここまで ---

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    //Enterキーで送信(shiftなしの場合)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 bg-white border-t border-gray-200 flex items-end gap-2">
      {/* マイクボタン */}
      <button
        onClick={handleVoiceInput}
        disabled={disabled}
        className={`p-3 rounded-full transition-colors ${
          isListening 
            ? 'bg-red-500 text-white animate-pulse' // 聞き取り中は赤く点滅
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title="音声入力"
      >
        {isListening ? '⏹️':'🎙'}
      </button>

      {/* 入力エリア */}
      <textarea
        className="flex-1 p-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[50px] max-h-[120px]"
        placeholder={isListening ? "聞こえています...":"メッセージを入力..."}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
      />
      
      {/* 送信ボタン */}
      <button
        onClick={handleSend}
        disabled={disabled || !inputText.trim()}
      >
        ➤
      </button>
    </div>
  );
};

export default ChatInput;