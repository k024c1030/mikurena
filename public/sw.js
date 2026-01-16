
// 手動で更新するバージョン。キャッシュ構造の変更や大きなバグ修正時に更新します。
const SW_VERSION = "v6-gyazo-update"; 
const STATIC_CACHE = `static-${SW_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${SW_VERSION}`;

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("Precaching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            console.log("Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});


self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // GETリクエスト以外やブラウザ拡張機能からのリクエストは無視
  if (request.method !== "GET" || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // 天気APIへのリクエスト (/api/weather) 
  // 戦略: Cache First with TTL Check (Stale-while-revalidate fallback)
  if (url.pathname.startsWith('/api/weather')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(DYNAMIC_CACHE);
        const cachedResponse = await cache.match(request);

        // ネットワークから取得し、キャッシュを更新する関数
        const fetchAndCache = async () => {
          try {
            const networkResponse = await fetch(request);
            if (networkResponse.ok) {
              await cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          } catch (error) {
            console.warn("Weather fetch failed:", error);
            throw error;
          }
        };

        if (cachedResponse) {
          try {
            // Response body can only be consumed once, so we clone it
            const bodyClone = await cachedResponse.clone().json();
            
            // TTLチェック
            const fetchedAt = new Date(bodyClone.updated_at).getTime();
            const ttl = (bodyClone.ttl_seconds || 7200) * 1000;
            const now = Date.now();

            if (now < fetchedAt + ttl) {
               // TTL内ならキャッシュを返す
               console.log("Weather cache hit (fresh)");
               return cachedResponse;
            } else {
               // TTL切れ -> ネットワークへ
               console.log("Weather cache expired. Fetching network...");
               try {
                 return await fetchAndCache();
               } catch (e) {
                 // ネットワークエラー時は、期限切れでもキャッシュを返す (Stale fallback)
                 console.log("Network failed, returning stale cache.");
                 return cachedResponse;
               }
            }
          } catch (e) {
            // キャッシュ解析エラー等はネットワークへ
            return fetchAndCache();
          }
        }

        // キャッシュなし -> ネットワークへ
        try {
          return await fetchAndCache();
        } catch (e) {
          // オフラインかつキャッシュなし
          return new Response(JSON.stringify({ error: "Offline" }), { 
            status: 503, 
            headers: { 'Content-Type': 'application/json' } 
          });
        }
      })()
    );
    return;
  }
  
  // HTMLページのナビゲーションリクエストは Network-First 戦略
  if (request.headers.get("accept")?.includes("text/html")) {
     event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          return cachedResponse || await caches.match('/offline.html');
        })
    );
    return;
  }

  // その他の静的アセットは Cache-First 戦略
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return cachedResponse || fetch(request);
    })
  );
});
