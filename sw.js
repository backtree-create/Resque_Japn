/* 日本一周クエスト サービスワーカー
   ゲーム本体と問題データを端末に保存し、通信がなくても遊べるようにする。
   ファイルを更新したら CACHE の数字を必ず上げること（古い版が残るのを防ぐため）。 */
const CACHE = "nihon-isshu-quest-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./questions.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  /* 地図データとフォントは、通信できたら取りに行き、次回のために保存しておく */
  if (req.url.indexOf("githubusercontent") > -1 || req.url.indexOf("jsdelivr") > -1 ||
      req.url.indexOf("fonts.g") > -1) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  /* ゲーム本体は保存済みを優先して即座に表示する */
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }))
  );
});
