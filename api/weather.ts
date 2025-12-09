//Vercelが用意しているリクエストとレスポンスの型を読み込む
import type { VercelRequest, VercelResponse } from '@vercel/node';

//サーバの本体
export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {

  //APIキーの確認。環境変数から鍵を取り出す
  // Fix: Renamed to apiKey to match usage
  const apiKey = process.env.OWM_API_KEY;

  //もし鍵が設定されてなかったら、エラーを返して終了
  if (!apiKey) {
    return response.status(500).json({ error: 'APIキーがサーバーに設定されていません'});
  }

  //アプリから送られてきた緯度latと経度lonを取り出す
  //request.queryの中に入る
  const { lat, lon } = request.query;

  //緯度っ経度が足りない場合はエラーを返す
  if (!lat || !lon) {
    return response.status(400).json({ error: '緯度と経度がふそくしています'});
  }

try {
  // OWMへの宛先URLを作る
  const url= `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ja`;


  console.log(`APIリクエスト送信: ${url}`);
  
  // Fix: Execute fetch request and assign to weatherRes
  const weatherRes = await fetch(url);

  // 天気サイトから「失敗」と言われたらエラー
  if (!weatherRes.ok) {
    throw new Error(`OpenWeatherMap Error: ${weatherRes.statusText}`);
  }

  //帰ってきたデータをJSON形式にする
  const data = await weatherRes.json();

  //アプリに必要なデータだけを選んで整理
  const formattedData = {
    condition: mapCondition(data.weather[0].main),
    temp_c: data.main.temp,
    message: data.weather[0].description, //天気の説明
    updated_at: new Date().toISOString(),
  };

  //整理したデータをアプリに送り返す
  return response.status(200).json(formattedData);

} catch (error) {
  console.error(error);
  return response.status(500).json({error:'天気の取得に失敗しました'});
  }
}

//OWMの言葉をアプリの言葉に翻訳する関数
function mapCondition(apiCondition: string): string {
  const lower = apiCondition.toLowerCase();
  if (lower.includes('clear')) return 'sun';
  if (lower.includes('cloud')) return 'cloud';
  if (lower.includes('rain') || lower.includes('drizzle')) return 'rain';
  if (lower.includes('snow')) return 'snow';
  if (lower.includes('thunder')) return 'rain'; // 雷も雨扱いに
  return 'sun'; // 分からない時はとりあえず晴れに
}