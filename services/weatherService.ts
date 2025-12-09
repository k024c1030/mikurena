import type { WeatherData, LocationPreference } from '../types';

/**
 * 本番用：VercelのServerless Function (api/weather)を呼び出す
 */
export const fetchWeather = async (params: LocationPreference): Promise<WeatherData> => {
  
  // 1. 宛先を作る
  let url = '/api/weather?';

  if (params.method === 'auto' && params.lat !== undefined && params.lon !== undefined){
    //緯度・経度をクエリパラメータとしてくっつける
    url += `lat=${params.lat}&lon=${params.lon}`;
  } else if (params.method === 'manual' && params.zip) {
    //manualの実装は後回しでもOK。だがBackend側での対応が必要
    //一旦エラーにならないよう、簡易的書く
    throw new Error("現在、郵便番号検索は準備中です。位置情報を使用してください。");
    } else {
      throw new Error("位置情報パラメータが不足しています。");
    }

    console.log(`天気データを取得中...: ${url}`);
    
    try {
      // 2.サーバー(/api/weather)に電話をかける
      const response = await fetch(url);
      
      // 3. サーバーからの返信を確認
      if (!response.ok) {
        // 404やら500のエラー帰ってきた時
        const errorData = await response.json();
        throw new Error(errorData.error || `Server Error: ${response.status}`)
      }
      
      // 4. 成功！データ受け取る
      const data: WeatherData = await response.json();
      return data;
      
      } catch (error) {
        console.error("エラーが発生しました:", error);
        throw error;
        }
      };