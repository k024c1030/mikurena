
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

// ★ここに画像のURLリストを定義します
// あなたが画像をアップロードしたら、ここのURLを書き換えてください。
// 今は仮の画像（Placehold.co）を入れています。
const MONSTER_IMAGES: Record<MonsterCategory, { type1: string[], type2: string[] }> = {
    work: {
        type1: ['https://placehold.co/400x400/orange/white?text=Work+Type1+A', 'https://placehold.co/400x400/orange/white?text=Work+Type1+B', 'https://placehold.co/400x400/orange/white?text=Work+Type1+C'],
        type2: ['https://placehold.co/400x400/orange/white?text=Work+Type2+A', 'https://placehold.co/400x400/orange/white?text=Work+Type2+B', 'https://placehold.co/400x400/orange/white?text=Work+Type2+C']
    },
    relation: {
        type1: ['https://placehold.co/400x400/pink/white?text=Relation+Type1'],
        type2: ['https://placehold.co/400x400/pink/white?text=Relation+Type2']
    },
    self: {
        type1: ['https://placehold.co/400x400/purple/white?text=Self+Type1'],
        type2: ['https://placehold.co/400x400/purple/white?text=Self+Type2']
    },
    health: {
        type1: ['https://placehold.co/400x400/green/white?text=Health+Type1'],
        type2: ['https://placehold.co/400x400/green/white?text=Health+Type2']
    },
    future: {
        type1: ['https://placehold.co/400x400/blue/white?text=Future+Type1'],
        type2: ['https://placehold.co/400x400/blue/white?text=Future+Type2']
    },
    money: {
        type1: ['https://placehold.co/400x400/yellow/black?text=Money+Type1'],
        type2: ['https://placehold.co/400x400/yellow/black?text=Money+Type2']
    },
    vague: {
        type1: ['https://placehold.co/400x400/gray/white?text=Vague+Type1'],
        type2: ['https://placehold.co/400x400/gray/white?text=Vague+Type2']
    },
    love: {
        type1: ['https://placehold.co/400x400/red/white?text=Love+Type1'],
        type2: ['https://placehold.co/400x400/red/white?text=Love+Type2']
    }
};

let ai: GoogleGenAI | null = null;

function getAi(){
    if (!ai) {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API_KEY not set");
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
        const categoryData = MONSTER_IMAGES[category];
        if (!categoryData) {
            console.warn(`Category ${category} not found, using vague.`);
            return MONSTER_IMAGES.vague.type1[0];
        }

        const images = type === 1 ? categoryData.type1 : categoryData.type2;
        if (!images || images.length === 0) {
             console.warn(`No images for ${category} type ${type}, using type 1.`);
             return categoryData.type1[0] || MONSTER_IMAGES.vague.type1[0];
        }

        // ランダムに1枚選ぶ
        const randomIndex = Math.floor(Math.random() * images.length);
        return images[randomIndex];

    } catch (e) {
        console.error("Image selection failed", e);
        return MONSTER_IMAGES.vague.type1[0];
    }
};

export const analyzeAndCreateMonster = async (history: ChatMessage[]): Promise<Monster> => {
    // 1. AIに分析させて、カテゴリーとタイプを決めてもらう
    const analysis = await analyzeStress(history);
    
    // 2. 決定したカテゴリーとタイプから、事前に用意した画像URLを選ぶ
    // (AIによる画像生成は行わないため、早くて軽い！)
    const imageUrl = getMonsterImageUrl(analysis.category, analysis.type);

    return {
        name: analysis.monsterName,
        description: analysis.monsterDescription,
        score: analysis.stressScore,
        currentHP: analysis.stressScore,
        imageUrl: imageUrl,
    };
};
