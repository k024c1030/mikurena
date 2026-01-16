
import { GoogleGenAI, Chat, Type } from "@google/genai";
import type { ChatMessage, StressAnalysis, Monster, MonsterCategory } from '../types';
import { MessageRole } from '../types';

const SYSTEM_INSTRUCTION_CHAT = `あなたは、日本の優しくて共感力の高いセルフケアアシスタント「{AI_NAME}」です。
あなたの目的は、ユーザーの悩みを聞き、慰め、内省を助ける優しい質問をすることです。
ユーザーが感情を表現できる、安全で協力的な空間を作ってください。
あなたの性格は、穏やかで親切、そして少しフレンドリーでふわふわした生き物のような感じです。

基本的には優しい伴走者ですが、ユーザーが勉強の計画など具体的な悩みについて助けを求めている場合は、問題解決の手助けもできます。
ただし、いきなり解決策を提示するのではなく、まず「もしよければ、解決のための具体的な提案をいくつか考えてみましょうか？」のように、ユーザーに提案が必要かどうかを優しく尋ねてください。
提案が必要か尋ねる際は、必ず文末に特殊なタグ [PROPOSAL_CHECK] を付けてください。

返答は簡潔で、協力的で、通常1〜3文にしてください。
シンプルで分かりやすい言葉遣いをしてください。`;

const SYSTEM_INSTRUCTION_ANALYSIS = `あなたはユーザーのチャット履歴を分析する専門家です。
ユーザーの悩みを分析し、以下の8つのカテゴリーから最も当てはまるものを1つ選んでください。
また、悩みの深刻度や性質に合わせてタイプ1かタイプ2を選んでください。
出力は必ず指定されたJSON形式に従ってください。

カテゴリー一覧:
- work (学業・仕事)
- relation (人間関係)
- self (自己肯定感)
- health (体調・睡眠)
- future (将来・進路)
- money (お金・バイト・生活)
- vague (なんとなくしんどい)
- love (恋愛)

分析のステップ：
1. **stressScore**: 1から200の数値。
2. **monsterName**: 悩みを象徴するユニークで少し愛嬌のある名前。
3. **monsterDescription**: モンスターの特徴（短く）。
4. **category**: 上記カテゴリー一覧から選択。
5. **type**: 1 または 2 を選択。`;

// ★ここにGyazoなどの外部のURLを貼り付ける
// 前半3枚(0-2)が「タイプ1（軽め）」、後半3枚(3-5)が「タイプ2（重め）」として使われる
const MONSTER_IMAGES: Record<MonsterCategory, string[]> = {
    work: [
        "https://gyazo.com/8fcbf892ee5fc7416d04616e3bd0b54e",
        "https://gyazo.com/4e80c15b8644cc674cabce9e8c66ad35",
        "https://gyazo.com/8b675a739ceabc2433b01abf855910b5",
        "https://gyazo.com/e6c0423cd48e9eee58572d24adcf1d7b",
        "https://gyazo.com/9064d99dcbc7b912a26ab5b1f5a764d8",
        "https://gyazo.com/8ea2d61bebbbdd50748a86ab6be57adb",
    ],
    relation: [
        "https://gyazo.com/8c913e41e53e836852e34298cd4631c1",
        "https://gyazo.com/a80d674a1bda0748807491db912dbdaa",
        "https://gyazo.com/c71af82b3b7ad2ca1de4dc961c40bb00",
        "https://gyazo.com/da599fd5e351e72a68ee179dade89176",
        "https://gyazo.com/bb63fe55ea5ce5432f5b2cc25c57bdf2",
        "https://gyazo.com/c0b0f911823bcf5ae52670999c09f766",
    ],
    self: [
        "https://gyazo.com/736daf38d66c071bea8e990df079d787",
        "https://gyazo.com/abd3312d6d2a5ad6d3f7f52c5b63e130",
        "https://gyazo.com/454f637c4fd73551defa4a7463fbcee3",
        "https://gyazo.com/e0809261d40c6a6de63ca9671d4e75c4",
        "https://gyazo.com/8658cba7eaafc318e8a1d4824df7cdd2",
        "https://gyazo.com/58d0006d96a2f8ddc9bc6b5bc4a89969",
    ],
    health: [
        "https://gyazo.com/9ccaf9020ab7d13fcb7f773f738fab06",
        "https://gyazo.com/f41a154af4314624b210a5e42e0ed5bf",
        "https://gyazo.com/670f6de764897b8e1a6dc91596f9e418",
        "https://gyazo.com/8f51608acaf170628bbbd02afffc7463",
        "https://gyazo.com/a49b4c688d7ddb14dda8f772de8667ea",
        "https://gyazo.com/18a6174d534fe39dde11741b056de4c3",
    ],
    future: [
        "https://gyazo.com/4e96a84dbe0ad32752785e2d0c7d3a01",
        "https://gyazo.com/ead16a959d35bf02645944a30bee780a",
        "https://gyazo.com/fadd27a112dea19d251b34439634c21f",
        "https://gyazo.com/d140c8330cc7dccf0d15506c54553b99",
        "https://gyazo.com/a5aefbd0a75d64bae667a06440ca92e1",
        "https://gyazo.com/2a0254ecc4114dd04b62ce9fafb1bbf4",
    ],
    money: [
        "https://gyazo.com/9a6e09f614d0b6ce1ed6124b39b9934f",
        "https://gyazo.com/68b786b7081e7847ae45b7dc51110d00",
        "https://gyazo.com/bfac5fe9f0b5793e2e1dfbc7374fe3d6",
        "https://gyazo.com/c26bf9e05183a7531659eb9faba3bbd4",
        "https://gyazo.com/47c4b457dcb4d734f104215d40518b19",
        "https://gyazo.com/efa6f583b339b5562b36027185e16122",
    ],
    vague: [
        "https://gyazo.com/eb480d8302447b4a3d40ed65cc86d064",
        "https://gyazo.com/8a3b9637663e93c90fe97834131f43ae",
        "https://gyazo.com/6f34992fe21b9c0735f2e65c23f2c111",
        "https://gyazo.com/60f5850933f56625e11d77fcba2c2a0e",
        "https://gyazo.com/22767f6b69aac475d798311a6fe10793",
        "https://gyazo.com/2cbe10a8aadf9baa7a0030cd0feb66d6",
    ],
    love: [
        "https://gyazo.com/46982a89969a10f821a6644e93eaf7fb",
        "https://gyazo.com/26cd7f008da21f640c8d98a851df83f9",
        "https://gyazo.com/15d9db5a04d11ce6f6675becdaf5c077",
        "https://gyazo.com/afc25f0eee3e1928f4bde246445f5ceb",
        "https://gyazo.com/57ad5b51536a90e5f471aea767497242",
        "https://gyazo.com/13ed64f8e8b65e13ae2096773e412ffa",
    ],
};

let ai: GoogleGenAI | null = null;

function getAi(){
    if (!ai) {
        // Vercel(Vite)環境では、ブラウザから環境変数を参照するために VITE_ プレフィックスと import.meta.env が必要
        // TypeScriptの型定義エラー(Property 'env' does not exist...)を避けるため、any型にキャストしてアクセス
        // 環境変数名: VITE_API_KEY
        let apiKey = '';
        try {
             apiKey = (import.meta as any).env?.VITE_API_KEY;
        } catch(e) {
            // ignore
        }
        
        // フォールバック: process.env が使える環境（ローカルや一部のビルド設定）用
        if (!apiKey && typeof process !== 'undefined' && process.env) {
            apiKey = process.env.API_KEY || '';
        }
        
        if (!apiKey) {
            console.error("API Key is missing. Please set VITE_API_KEY in Vercel environment variables.");
            throw new Error("API_KEY not set");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
}

export const startChat = (aiName: string): Chat => {
    const genAI = getAi();
    const systemInstruction = SYSTEM_INSTRUCTION_CHAT.replace('{AI_NAME}', aiName);
    return genAI.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction },
    });
};

export const sendMessage = async (chatInstance: Chat, message: string, messageId: number): Promise<ChatMessage> => {
  try {
    const result = await chatInstance.sendMessage({ message });
    return {
      id: messageId,
      role: MessageRole.MODEL,
      text: result.text || "...",
    };
  } catch (error) {
    console.error("Error sending message:", error);
    return {
        id: messageId,
        role: MessageRole.MODEL,
        text: "通信が少し不安定みたいです。ゆっくりで大丈夫ですよ。"
    }
  }
};

const analyzeStress = async (history: ChatMessage[]): Promise<StressAnalysis> => {
    const ai = getAi();
    const prompt = `履歴を分析してモンスター化して：\n\n${history.map(m => `${m.role}: ${m.text}`).join('\n')}`;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION_ANALYSIS,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    stressScore: { type: Type.INTEGER },
                    monsterName: { type: Type.STRING },
                    monsterDescription: { type: Type.STRING },
                    category: { type: Type.STRING, enum: ['work', 'relation', 'self', 'health', 'future', 'money', 'vague', 'love'] },
                    type: { type: Type.INTEGER },
                },
                required: ["stressScore", "monsterName", "monsterDescription", "category", "type"],
            },
        },
    });
    
    return JSON.parse(response.text) as StressAnalysis;
};

// カテゴリーとタイプに基づいてランダムな画像URLを取得する関数
const getMonsterImageUrl = (category: MonsterCategory, type: 1 | 2): string => {
    try {
        const images = MONSTER_IMAGES[category];
        
        // 画像が設定されていない場合の安全策
        if (!images || images.length === 0) {
            console.warn(`Category ${category} has no images.`);
            return "https://placehold.jp/150x150.png?text=NoImage";
        }

        let selectedUrl = images[0];
        
        // --- 6枚画像対応ロジック ---
        if (images.length >= 6) {
             if (type === 1) {
                 const idx = Math.floor(Math.random() * 3);
                 selectedUrl = images[idx];
             } else {
                 const idx = Math.floor(Math.random() * 3) + 3;
                 selectedUrl = images[Math.min(idx, images.length - 1)];
             }
        } else {
             // 6枚未満の場合
             const idx = Math.floor(Math.random() * images.length);
             selectedUrl = images[idx];
        }

        // ★ Gyazoの閲覧URL (gyazo.com/xxx) が入力されている場合、
        // 画像本体のURL (gyazo.com/xxx/raw) に変換する処理を追加
        if (selectedUrl.includes("gyazo.com") && !selectedUrl.includes("i.gyazo.com") && !selectedUrl.endsWith("/raw") && !selectedUrl.match(/\.(png|jpg|jpeg|gif)$/i)) {
            selectedUrl = `${selectedUrl}/raw`;
        }

        return selectedUrl;

    } catch (e) {
        console.error("Image selection failed", e);
        return "https://placehold.jp/150x150.png?text=Error";
    }
};

export const analyzeAndCreateMonster = async (history: ChatMessage[]): Promise<Monster> => {
    // 1. AIに分析させて、カテゴリーとタイプを決めてもらう
    const analysis = await analyzeStress(history);
    
    // 2. 決定したカテゴリーとタイプから、URLリストから画像を選ぶ
    const imageUrl = getMonsterImageUrl(analysis.category, analysis.type);

    return {
        name: analysis.monsterName,
        description: analysis.monsterDescription,
        score: analysis.stressScore,
        currentHP: analysis.stressScore,
        imageUrl: imageUrl,
    };
};
