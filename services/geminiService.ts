
import { GoogleGenAI, Chat, Type } from "@google/genai";
import type { ChatMessage, StressAnalysis, Monster } from '../types';
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
ユーザーの悩みやネガティブな感情を抽出し、それを具現化したユニークな「ストレスモンスター」として表現してください。
出力は必ず指定されたJSON形式に従ってください。

分析のステップ：
1. **ストレススコア**: 1から200の数値。
2. **モンスター名**: 悩みを象徴するユニークで少し愛嬌のある名前。
3. **モンスターの説明**: モンスターの視覚的特徴。2Dイラスト向けの具体的で奇妙な説明。`;

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
                },
                required: ["stressScore", "monsterName", "monsterDescription"],
            },
        },
    });
    
    return JSON.parse(response.text) as StressAnalysis;
};

export async function generateMonsterImage(prompt: string): Promise<string> {
    try {
        const ai = getAi();
        const finalPrompt = `A cute 'Yuru-chara' mascot monster: ${prompt}. 
        Style: Flat 2D vector, thick lines, sticker art, vibrant colors, white background. 
        IMPORTANT: Non-human creature ONLY.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: finalPrompt }] },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image data");
    } catch (error) {
        console.error("Image generation failed:", error);
        return '/monsters/kaiju_brown.png';
    }
}

export const analyzeAndCreateMonster = async (history: ChatMessage[]): Promise<Monster> => {
    const analysis = await analyzeStress(history);
    const imageUrl = await generateMonsterImage(analysis.monsterDescription);
    return {
        name: analysis.monsterName,
        description: analysis.monsterDescription,
        score: analysis.stressScore,
        currentHP: analysis.stressScore,
        imageUrl: imageUrl,
    };
};
