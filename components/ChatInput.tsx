import React, { useState, useEffect, useRef } from 'react';

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
  const [isListening, setIsListening] = useState(false); // 音声認識中かどうか

  // --- 音声入力の準備 ---
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // ブラウザによって名前が違うので、どちらか使える方を代入します
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    // もしブラウザが音声入力に対応していなければ何もしない
    if (!SpeechRecognition) return;

    // ★認識機能の実体を作る
    const recognition = new SpeechRecognition();

    // 設定：連続で認識するかどうか（今回は一言ずつなのでfalse）、言語設定
    recognition.continuous = false; // 一文で区切る
    recognition.lang = 'ja-JP';

    // ★ 途中経過も表示する設定に変更
    recognition.interimResults = true;

    // 「認識結果が出たとき」の動き
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      // 話した内容を解析＆ループする
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          // 話し終わって確定した文章
          // ★修正: tesults -> results
          finalTranscript += event.results[i][0].transcript;
        } else {
          // まだ話してる途中の文章 (グレー表示にしたいけど、一旦入力欄に入れる)
          interimTranscript += event.results[i][0].transcript;
        }
      }

      // 確定した文章があれば、今の入力欄の後ろに追加
      if (finalTranscript) {
        setInputText((prev) => prev + finalTranscript);
      }
    };

    // 「認識が勝手に終わったとき」の動き
    recognition.onend = () => {
      setIsListening(false);
    };

    // 「エラー」の動き
    recognition.onerror = (event: any) => {
      console.error("音声認識エラー:", event.error);
      setIsListening(false);

      // スマホで動かない原因が分かるようにアラート
      if (event.error === 'not-allowed') {
        alert("マイクの使用が許可されていません。設定を確認してください。");
      } else if (event.error === 'no-speech') {
        // 何も話さなかったときは無視
      } else {
        alert(`エラーが発生しました: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;
  }, []); // 最初の一回だけ設定を作ります

  // マイクボタンを押したときの動き
  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("このブラウザは音声入力に対応していません。");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop(); // すでに聞いてるなら止める
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start(); // 聞いてないなら聞き始める
        setIsListening(true);
      } catch(e) {
        console.error(e);
      }
    }
  };

  // --- 音声入力の準備ここまで ---

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enterキーで送信(shiftなしの場合)
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
        className={`p-3 rounded-full transition-colors flex-shrink-0 ${
          isListening 
            ? 'bg-red-500 text-white animate-pulse' // 聞き取り中は赤く点滅
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        type="button"
        title="音声入力"
      >
        {isListening ? '⏹️' : '🎙️'}
      </button>

      {/* 入力エリア */}
      <textarea
        className="flex-1 p-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[50px] max-h-[120px]"
        placeholder={isListening ? "聞いています..." : "メッセージを入力..."}
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
        className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        type="button"
      >
        ➤
      </button>
    </div>
  );
};

export default ChatInput;