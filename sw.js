// 알림을 눌렀을 때 열려 있는 폰 화면으로 돌아가게 해 주는 아주 작은 서비스 워커.
// 파일을 캐시하지 않아요. 그래서 사이트를 고치면 바로 반영돼요.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var tid = e.notification.data && e.notification.data.tid;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    if (list.length) { var c = list[0]; if (c.focus) c.focus(); if (tid) c.postMessage({ tid: tid }); return; }
    return self.clients.openWindow('./');
  }));
});
