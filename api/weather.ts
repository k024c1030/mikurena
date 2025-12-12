// ------------------------------------------------------------------
// 1. 道具箱の準備　Vercelが用意しているリクエストとレスポンスの型を読み込む
// ------------------------------------------------------------------
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ------------------------------------------------------------------
// 2. メインの処理（ここが受付窓口です）　サーバの本体
// ------------------------------------------------------------------
export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {

  // ----------------------------------------------------------------
  // 3. 認証（入館チェック）  APIキーの確認。環境変数から鍵を取り出す
  // ----------------------------------------------------------------
  const apiKey = process.env.OWM_API_KEY;

  //もし鍵が設定されてなかったら、エラーを返して終了
  if (!apiKey) {
    return response.status(500).json({ error: 'APIキーがサーバーに設定されていません'});
  }
  // ----------------------------------------------------------------
  // 4. 注文内容の確認　queryから、zip(郵便番号)も取り出せるようにする
  // ----------------------------------------------------------------
  const { lat, lon, zip } = request.query;

  // 「緯度経度もない」かつ「郵便番号もない」場合はエラー
  if ((!lat || !lon) && !zip) {
    return response.status(400).json({error: '位置情報または郵便番号が必要です'});
  }

  try {
    // ----------------------------------------------------------------
    // 5. 天気予報会社（OpenWeatherMap）への電話準備
    // ----------------------------------------------------------------
    let url = '';
    // 「緯度経度があるならそっち優先、なければ郵便番号」というルールでURLを作る
    if (lat && lon) {
      // 位置情報の場合
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ja`;
      } else if (zip) {
      // 郵便番号の場合
      url = `https://api.openweathermap.org/data/2.5/weather?zip=${zip},JP&appid=${apiKey}&units=metric&lang=ja`;
      }

      // ----------------------------------------------------------------
      // 6. いざ、問い合わせ（外部通信）
      // ----------------------------------------------------------------
      // fetch（フェッチ）＝「取ってくる」。インターネット越しに電話をかけます。
      // await（アウェイト）＝「待つ」。電話が繋がって返事が来るまでここで一時停止します。
      const weatherRes = await fetch(url);

      // 天気サイトから「失敗」と言われたらエラー
      if (!weatherRes.ok) {
        throw new Error(`OpenWeatherMap Error: ${weatherRes.statusText}`);
      }

      // ----------------------------------------------------------------
      // 7. データの翻訳
      // ----------------------------------------------------------------
      // 返ってきたデータは機械語の塊なので、JavaScriptで扱えるオブジェクト（JSON）に変換します。
      const data = await weatherRes.json();

      // ----------------------------------------------------------------
      // 8. データの選別（ここが今回のポイント！）
      // ----------------------------------------------------------------
      // OpenWeatherMapからは大量のデータが来ますが、アプリに必要なものだけをお皿に盛ります。
      // これを「整形（フォーマット）」と言います。
      const formattedData = {
        condition: mapCondition(data.weather[0].main),
        temp_c: data.main.temp,
        message: data.weather[0].description, //天気の説明
        place: data.name, //郵便番号検索の街の名前
        updated_at: new Date().toISOString(), //データ取得時間
      };

      // ----------------------------------------------------------------
      // 9. アプリへの返信 整理したデータをアプリに送り返す  200は「OK！成功！」という意味のコードです。
      // 整形したデータ（formattedData）を便箋（json）に入れて送り返します。
      // ----------------------------------------------------------------
      return response.status(200).json(formattedData);

    } catch (error) {
      // ----------------------------------------------------------------
      // 10. エラー処理（もしものとき） // 途中で通信が切れたり、プログラムがコケたりしたらここに飛ぶ
      // ----------------------------------------------------------------
      console.error(error); 
      return response.status(500).json({error:'サーバー内部でエラーが起きました'});
      }
    }

    // ----------------------------------------------------------------
    // おまけ機能：天気の言葉をアプリの言葉に変換する翻訳機
    // OpenWeatherMapの英語（Clear, Clouds...）を、このアプリのルール（sun, cloud...）に変換
    // ----------------------------------------------------------------
    function mapCondition(apiCondition: string): string {
      const lower = apiCondition.toLowerCase(); //全部小文字にする
      if (lower.includes('clear')) return 'sun';
      if (lower.includes('cloud')) return 'cloud';
      if (lower.includes('rain') || lower.includes('drizzle')) return 'rain';
      if (lower.includes('snow')) return 'snow';
      if (lower.includes('thunder')) return 'rain'; // 雷も雨扱いに
      return 'sun'; // 分からない時はとりあえず晴れに
    }