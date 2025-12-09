import { GoogleGenAI, Chat, Type } from "@google/genai";
import type { ChatMessage, StressAnalysis, Monster } from '../types';
import { MessageRole } from '../types';

const SYSTEM_INSTRUCTION_CHAT = `あなたは、日本の優しくて共感力の高いセルフケアアシスタント「{AI_NAME}」です。
あなたの目的は、ユーザーの悩みを聞き、慰め、内省を助ける優しい質問をすることです。
ユーザーが感情を表現できる、安全で協力的な空間を作ってください。
あなたの性格は、穏やかで親切、そして少しフレンドリーでふわふわした生き物のような感じです。

基本的には優しい伴走者ですが、ユーザーが勉強の計画など具体的な悩みについて助けを求めている場合は、問題解決の手助けもできます。
ただし、いきなり解決策を提示するのではなく、まず「もしよければ、解決のための具体的な提案をいくつか考えてみましょうか？」のように、ユーザーに提案が必要かどうかを優しく尋ねてください。
提案が必要か尋ねる際は、必ず文末に特殊なタグ [PROPOSAL_CHECK] を付けてください。例：「もしよければ、一緒に計画を考えてみましょうか？[PROPOSAL_CHECK]」

返答は簡潔で、協力的で、通常1〜3文にしてください。
シンプルで分かりやすい言葉遣いをしてください。
医療的なアドバイスはしないでください。ユーザーが深刻な苦痛を感じているように見える場合は、信頼できる人や専門家に相談することを優しく提案してください。`;

const SYSTEM_INSTRUCTION_ANALYSIS = `あなたはユーザーのチャット履歴を分析する専門家です。
ユーザーの悩みやネガティブな感情を抽出し、それを具現化したユニークな「ストレスモンスター」として表現してください。
出力は必ず指定されたJSON形式に従ってください。

分析のステップ：
1.  **ストレススコア**: ユーザーのストレス度合いを1から200の数値で評価します。数値が高いほどストレスが深刻であることを示します。軽度な悩みであれば50前後、深刻な悩みであれば150以上を目安にしてください。上限は200です。
2.  **モンスター名**: ユーザーの悩みを擬人化した、ユニークで記憶に残りやすいキャラクターの名前を考えてください。少しユーモラスで、倒したくなるような名前が良いでしょう。（例：「先延ばし沼のヌッシー」「締め切りデビル」「承認欲求モンスター」「自信喪失ゴースト」など）
3.  **モンスターの説明**: モンスターの見た目、性格、背景を具体的に記述します。この説明は画像生成AIのプロンプトとして使用されるため、創造的で視覚的な表現を豊かに含めてください。（例：「黒い霧のような体で、頭に燃え尽きた時計が乗っている。常に不安そうに周りを見回しており、ため息をつくと冷たい空気が流れる。孤独な書斎に現れる。」）
`;

let ai: GoogleGenAI | null = null;
let chat: Chat | null = null;

function getAi(){
    if (!ai) {
        // Fix: Switched to using process.env.API_KEY as per Gemini API coding guidelines.
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            throw new Error("API_KEY environment variable not set. Please configure it in your environment.");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
}

export const startChat = (aiName: string): Chat => {
    const genAI = getAi();
    const systemInstruction = SYSTEM_INSTRUCTION_CHAT.replace('{AI_NAME}', aiName);

    //ここでエラーしてもUI側で拾えるようにそのまま投げる
    chat = genAI.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
        },
    });
    return chat;
};


export const sendMessage = async (chatInstance: Chat, message: string, messageId: number): Promise<ChatMessage> => {
  try {
    const result = await chatInstance.sendMessage({ message });
    
    if (!result.text) {
        throw new Error("Received an empty response from the AI.");
    }
    
    return {
      id: messageId,
      role: MessageRole.MODEL,
      text: result.text,
    };
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    return {
        id: messageId,
        role: MessageRole.MODEL,
        text: "ごめんなさい、今ちょっと接続に問題があるみたいです。少し時間をおいてからもう一度試してくださいね。"
    }
  }
};

const analyzeStress = async (history: ChatMessage[]): Promise<StressAnalysis> => {
    const ai = getAi();
    const prompt = `以下のチャット履歴を分析してください：\n\n${history.map(m => `${m.role}: ${m.text}`).join('\n')}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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
    
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as StressAnalysis;
};

export async function generateMonsterImage(prompt: string): Promise<string> {
    try {
        const ai = getAi();
        // 画像生成用のモデルを使用
        // プロンプトを調整して、ゆるキャラ風（Yuru-chara）、2Dフラット、人間禁止を指定
        const finalPrompt = `A flat 2D vector illustration of a cute 'Yuru-chara' style mascot monster.
        Description: ${prompt}
        Style: Flat design, thick bold outlines, simple cute shapes, sticker art style, vibrant pastel colors, white background.
        IMPORTANT: This is a non-human creature. NO humans, NO anime girls, NO anime boys. Just a cute weird creature.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: finalPrompt }],
            },
            // nano banana series models does not support responseMimeType or responseSchema
        });

        // レスポンスから画像データを探す
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                const base64Data = part.inlineData.data;
                const mimeType = part.inlineData.mimeType || 'image/png';
                return `data:${mimeType};base64,${base64Data}`;
            }
        }
        
        throw new Error("No image generated");

    } catch (error) {
        console.error("Image generation failed:", error);
        // 生成失敗時はフォールバック画像を使用
        return '/monsters/kaiju_brown.png';
    }
}



export const analyzeAndCreateMonster = async (history: ChatMessage[]): Promise<Monster> => {
    try {
        const analysis = await analyzeStress(history);
        const imageUrl = await generateMonsterImage(analysis.monsterDescription);

        return {
            name: analysis.monsterName,
            description: analysis.monsterDescription,
            score: analysis.stressScore,
            currentHP: 0, // App.tsxで上書き想定
            imageUrl: imageUrl,
        };
    } catch (error) {
        console.error("Error creating monster:", error);
        // Fallback monster
        return {
            name: "エラーモンスター",
            description: "予期せぬエラーが発生しました。もう一度お試しください。",
            score: 50,
            currentHP: 50,
            imageUrl: "/monsters/kaiju_brown.png"
        };
    }
};