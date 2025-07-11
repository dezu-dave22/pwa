// Service Worker 擴展 - 處理 iOS Safari PWA 的特殊需求

// 立即聲明控制權
self.clients.claim();

// 跳過等待
self.skipWaiting();

// 監聽訊息事件
self.addEventListener('message', function(event) {
  console.log('Service Worker 收到訊息:', event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        console.log('🚀 執行 SKIP_WAITING');
        self.skipWaiting();
        break;
        
      case 'CLIENTS_CLAIM':
        console.log('🎯 執行 CLIENTS_CLAIM');
        self.clients.claim().then(() => {
          console.log('✅ Service Worker 已聲明控制權');
        }).catch(error => {
          console.error('❌ 聲明控制權失敗:', error);
        });
        break;
        
      case 'GET_VERSION':
        // 回應版本信息
        event.ports[0]?.postMessage({
          type: 'VERSION_RESPONSE',
          version: '1.0.0',
          timestamp: Date.now()
        });
        break;
        
      default:
        console.log('未知訊息類型:', event.data.type);
    }
  }
});

// 確保 Service Worker 在安裝後立即啟動
self.addEventListener('install', function(event) {
  console.log('Service Worker 正在安裝...');
  
  // 強制立即啟動，不等待舊版本關閉
  self.skipWaiting();
});

// Service Worker 啟動事件
self.addEventListener('activate', function(event) {
  console.log('Service Worker 已啟動');
  
  // 立即聲明對所有客戶端的控制權
  event.waitUntil(
    self.clients.claim().then(() => {
      console.log('✅ Service Worker 已取得所有客戶端的控制權');
      
      // 通知所有客戶端 Service Worker 已啟動
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            timestamp: Date.now()
          });
        });
      });
    })
  );
});

// 處理 fetch 事件（基本的網路代理）
self.addEventListener('fetch', function(event) {
  // 對於導航請求，確保回應正確的頁面
  if (event.request.mode === 'navigate') {
    console.log('導航請求:', event.request.url);
  }
});

console.log('Service Worker 擴展已載入'); 