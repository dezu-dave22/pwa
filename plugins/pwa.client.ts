export default defineNuxtPlugin(async () => {
  // 僅在客戶端執行
  if (!process.client) return

  // 檢查瀏覽器支援
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker 不被此瀏覽器支援')
    return
  }

  // 等待頁面完全載入
  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', resolve)
    })
  }

  // 延遲註冊以避免影響頁面載入性能
  setTimeout(async () => {
    await registerServiceWorker()
  }, 1000)
})

async function registerServiceWorker() {
  try {
    console.log('🚀 開始註冊 Service Worker...')
    
    // 檢查是否已經註冊
    const existingRegistration = await navigator.serviceWorker.getRegistration()
    if (existingRegistration) {
      console.log('✅ Service Worker 已註冊:', existingRegistration.scope)
      
      // 檢查是否需要更新
      try {
        await existingRegistration.update()
        console.log('🔄 Service Worker 更新檢查完成')
      } catch (updateError) {
        console.warn('⚠️ Service Worker 更新檢查失敗:', updateError)
      }
      
      return existingRegistration
    }

    // 檢測環境和平台
    const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                       /Safari/.test(navigator.userAgent) && 
                       !/Chrome/.test(navigator.userAgent)
    const isPWAMode = window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator as any).standalone === true
    
    console.log(`📱 平台檢測: iOS Safari: ${isIOSSafari}, PWA 模式: ${isPWAMode}`)

    // 註冊選項
    const registrationOptions: RegistrationOptions = {
      scope: '/'
    }

    // iOS Safari PWA 特殊配置
    if (isIOSSafari && isPWAMode) {
      registrationOptions.updateViaCache = 'none'
      console.log('🍎 使用 iOS Safari PWA 優化配置')
    }

    // 註冊 Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js', registrationOptions)
    console.log('✅ Service Worker 註冊成功:', registration.scope)

    // 等待啟動
    if (registration.installing) {
      console.log('⏳ Service Worker 正在安裝...')
      await waitForServiceWorker(registration.installing)
    }

    if (registration.waiting) {
      console.log('⏳ Service Worker 正在等待啟動...')
      // 對於 iOS Safari PWA，可能需要手動跳過等待
      if (isIOSSafari && isPWAMode) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      }
    }

    if (registration.active) {
      console.log('✅ Service Worker 已啟動')
      
      // iOS Safari PWA 特殊處理：確保取得控制權
      if (isIOSSafari && isPWAMode && !navigator.serviceWorker.controller) {
        console.log('🍎 iOS Safari PWA - 嘗試取得控制權...')
        registration.active.postMessage({ type: 'CLIENTS_CLAIM' })
        
        // 等待控制權
        await new Promise<void>(resolve => {
          const checkController = () => {
            if (navigator.serviceWorker.controller) {
              console.log('✅ Service Worker 已取得控制權')
              resolve()
            } else {
              setTimeout(checkController, 100)
            }
          }
          checkController()
          // 最多等待 3 秒
          setTimeout(() => resolve(), 3000)
        })
      }
    }

    // 監聽 Service Worker 狀態變化
    registration.addEventListener('updatefound', () => {
      console.log('🔄 發現 Service Worker 更新')
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          console.log('📊 Service Worker 狀態:', newWorker.state)
        })
      }
    })

    // 監聽 Service Worker 訊息
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('📨 收到 Service Worker 訊息:', event.data)
    })

    // 監聽控制權變化
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Service Worker 控制權已變更')
    })

    return registration

  } catch (error) {
    console.error('❌ Service Worker 註冊失敗:', error)
    
    // iOS Safari 特殊錯誤處理
    const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                       /Safari/.test(navigator.userAgent) && 
                       !/Chrome/.test(navigator.userAgent)
    
    if (isIOSSafari && error instanceof Error) {
      if (error.message.includes('SecurityError')) {
        console.error('🍎 iOS Safari 安全錯誤: 可能需要在 HTTPS 環境或重新安裝 PWA')
      } else if (error.message.includes('NetworkError')) {
        console.error('🍎 iOS Safari 網路錯誤: 檢查網路連線或清除快取')
      }
    }
    
    throw error
  }
}

// 等待 Service Worker 狀態變化
function waitForServiceWorker(worker: ServiceWorker): Promise<void> {
  return new Promise((resolve) => {
    const handleStateChange = () => {
      if (worker.state === 'activated') {
        worker.removeEventListener('statechange', handleStateChange)
        resolve()
      }
    }
    
    worker.addEventListener('statechange', handleStateChange)
    
    // 如果已經是 activated 狀態
    if (worker.state === 'activated') {
      resolve()
    }
    
    // 超時保護
    setTimeout(() => {
      worker.removeEventListener('statechange', handleStateChange)
      resolve()
    }, 10000)
  })
} 