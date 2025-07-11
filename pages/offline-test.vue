<template>
  <div class="offline-test">
    <h1>PWA 離線測試</h1>
    
    <div class="test-section">
      <h2>網路狀態</h2>
      <div class="status-indicator" :class="{ 'online': isOnline, 'offline': !isOnline }">
        <span class="status-dot"></span>
        <span>{{ isOnline ? '🟢 線上' : '🔴 離線' }}</span>
      </div>
    </div>
    
    <div class="test-section">
      <h2>Service Worker 狀態</h2>
      <div v-if="swStatus" class="sw-status">
        <p><strong>支援狀態:</strong> {{ swStatus.supported ? '✅ 支援' : '❌ 不支援' }}</p>
        <p><strong>註冊狀態:</strong> {{ swStatus.registered ? '✅ 已註冊' : '❌ 未註冊' }}</p>
        <p><strong>控制狀態:</strong> {{ swStatus.controlling ? '✅ 已控制' : '❌ 未控制' }}</p>
        <p><strong>作用域:</strong> {{ swStatus.scope }}</p>
        <p><strong>Active:</strong> {{ swStatus.active ? '✅ 是' : '❌ 否' }}</p>
        <p><strong>Waiting:</strong> {{ swStatus.waiting ? '✅ 是' : '❌ 否' }}</p>
        <p><strong>Installing:</strong> {{ swStatus.installing ? '✅ 是' : '❌ 否' }}</p>
      </div>
      <div v-else class="sw-status">
        <p>正在檢查 Service Worker 狀態...</p>
      </div>
    </div>
    
    <div class="test-section">
      <h2>快取狀態</h2>
      <div v-if="cacheInfo" class="cache-info">
        <p><strong>快取數量:</strong> {{ cacheInfo.length }}</p>
        <div v-for="cache in cacheInfo" :key="cache.name" class="cache-item">
          <h4>{{ cache.name }}</h4>
          <p>項目數: {{ cache.items }}</p>
        </div>
      </div>
      <div v-else class="cache-info">
        <p>正在檢查快取狀態...</p>
      </div>
    </div>
    
    <div class="test-section">
      <h2>測試操作</h2>
      <div class="test-actions">
        <button @click="checkSWStatus" class="btn">檢查 Service Worker</button>
        <button @click="checkCache" class="btn">檢查快取</button>
        <button @click="clearCache" class="btn btn-danger">清除快取</button>
      </div>
    </div>
    
    <div class="test-section">
      <h2>離線測試說明</h2>
      <div class="instructions">
        <ol>
          <li>確保 PWA 已安裝到主畫面</li>
          <li>在有網路的情況下開啟此頁面</li>
          <li>關閉網路連線</li>
          <li>重新開啟 PWA（從主畫面點擊圖示）</li>
          <li>應該能看到此頁面正常顯示</li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const isOnline = ref(process.client ? navigator.onLine : true)
const swStatus = ref<any>(null)
const cacheInfo = ref<any[]>([])

// 檢查 Service Worker 狀態
const checkSWStatus = async () => {
  if (!process.client) return
  
  try {
    // 檢查是否支援 Service Worker
    if (!('serviceWorker' in navigator)) {
      swStatus.value = { 
        registered: false, 
        controlling: false, 
        updated: false,
        supported: false 
      }
      return
    }
    
    // 先嘗試獲取現有的註冊
    const registration = await navigator.serviceWorker.getRegistration()
    console.log('現有 Service Worker 註冊:', registration)
    
    const status = {
      registered: !!registration,
      controlling: !!navigator.serviceWorker.controller,
      updated: registration?.installing || registration?.waiting ? false : true,
      supported: true,
      scope: registration?.scope || 'N/A',
      active: !!registration?.active,
      waiting: !!registration?.waiting,
      installing: !!registration?.installing
    }
    swStatus.value = status
    console.log('Service Worker 狀態:', status)
    
    // 如果沒有註冊，嘗試手動註冊
    if (!registration) {
      console.log('嘗試手動註冊 Service Worker...')
      try {
        // 在開發模式下，Service Worker 可能在不同的路徑
        const swPath = process.dev ? '/_nuxt/sw.js' : '/sw.js'
        console.log('嘗試註冊 Service Worker 路徑:', swPath)
        
        const newRegistration = await navigator.serviceWorker.register(swPath, {
          scope: '/'
        })
        console.log('手動註冊成功:', newRegistration)
        
        // 等待 Service Worker 啟動
        await new Promise(resolve => {
          if (newRegistration.active) {
            resolve(true)
          } else {
            newRegistration.addEventListener('activate', resolve)
          }
        })
        
        // 重新檢查狀態
        setTimeout(checkSWStatus, 1000)
      } catch (regError) {
        console.error('手動註冊失敗:', regError)
        // 設置錯誤狀態
        swStatus.value = { 
          registered: false, 
          controlling: false, 
          updated: false,
          supported: true,
          error: regError.message
        }
      }
    }
  } catch (error) {
    console.error('檢查 Service Worker 失敗:', error)
    swStatus.value = { 
      registered: false, 
      controlling: false, 
      updated: false,
      supported: true,
      error: error.message
    }
  }
}

// 檢查快取狀態
const checkCache = async () => {
  if (!process.client || !('caches' in window)) return
  
  try {
    const cacheNames = await caches.keys()
    const cacheDetails = await Promise.all(
      cacheNames.map(async (name) => {
        const cache = await caches.open(name)
        const keys = await cache.keys()
        return {
          name,
          items: keys.length
        }
      })
    )
    cacheInfo.value = cacheDetails
    console.log('快取狀態:', cacheDetails)
  } catch (error) {
    console.error('檢查快取失敗:', error)
  }
}

// 清除快取
const clearCache = async () => {
  if (!process.client || !('caches' in window)) return
  
  if (confirm('確定要清除所有快取嗎？')) {
    try {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
      await checkCache()
      alert('快取已清除')
    } catch (error) {
      console.error('清除快取失敗:', error)
      alert('清除快取失敗')
    }
  }
}

// 監聽網路狀態
const setupNetworkListener = () => {
  if (!process.client) return
  
  const handleOnline = () => {
    isOnline.value = true
    console.log('網路已連接')
  }
  
  const handleOffline = () => {
    isOnline.value = false
    console.log('網路已斷線')
  }
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

// 初始化
onMounted(() => {
  setupNetworkListener()
  checkSWStatus()
  checkCache()
})
</script>

<style scoped>
.offline-test {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.test-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.test-section h2 {
  margin-top: 0;
  color: #1f2937;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 600;
}

.status-indicator.online {
  background: #d1fae5;
  color: #065f46;
}

.status-indicator.offline {
  background: #fee2e2;
  color: #991b1b;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: currentColor;
}

.sw-status p, .cache-info p {
  margin: 0.5rem 0;
}

.cache-item {
  margin: 1rem 0;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.cache-item h4 {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.test-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  background: #4f46e5;
  color: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.btn:hover {
  background: #4338ca;
}

.btn-danger {
  background: #dc2626;
}

.btn-danger:hover {
  background: #b91c1c;
}

.instructions ol {
  margin: 0;
  padding-left: 1.5rem;
}

.instructions li {
  margin: 0.5rem 0;
  line-height: 1.5;
}
</style> 