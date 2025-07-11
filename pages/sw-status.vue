<template>
  <div class="sw-status-page">
    <h1>🔧 Service Worker 狀態檢測</h1>
    
    <!-- 總體狀態概覽 -->
    <div class="status-overview">
      <div class="status-card" :class="overallStatus.class">
        <h2>{{ overallStatus.title }}</h2>
        <p>{{ overallStatus.message }}</p>
      </div>
    </div>

    <!-- 詳細檢測項目 -->
    <div class="test-sections">
      <!-- Service Worker 支援 -->
      <div class="test-section">
        <h3>🌐 瀏覽器支援</h3>
        <div class="test-item">
          <span class="test-label">Service Worker API:</span>
          <span :class="tests.swSupported ? 'status-pass' : 'status-fail'">
            {{ tests.swSupported ? '✅ 支援' : '❌ 不支援' }}
          </span>
        </div>
        <div class="test-item">
          <span class="test-label">Cache API:</span>
          <span :class="tests.cacheSupported ? 'status-pass' : 'status-fail'">
            {{ tests.cacheSupported ? '✅ 支援' : '❌ 不支援' }}
          </span>
        </div>
        <div class="test-item">
          <span class="test-label">HTTPS 連接:</span>
          <span :class="tests.isSecure ? 'status-pass' : 'status-warn'">
            {{ tests.isSecure ? '✅ 是' : '⚠️ 否 (localhost 除外)' }}
          </span>
        </div>
      </div>

      <!-- Service Worker 註冊狀態 -->
      <div class="test-section">
        <h3>📋 註冊狀態</h3>
        <div class="test-item">
          <span class="test-label">註冊狀態:</span>
          <span :class="swInfo.registered ? 'status-pass' : 'status-fail'">
            {{ swInfo.registered ? '✅ 已註冊' : '❌ 未註冊' }}
          </span>
        </div>
        <div class="test-item">
          <span class="test-label">控制狀態:</span>
          <span :class="swInfo.controlling ? 'status-pass' : 'status-fail'">
            {{ swInfo.controlling ? '✅ 已控制' : '❌ 未控制' }}
          </span>
        </div>
        <div class="test-item">
          <span class="test-label">作用域:</span>
          <span class="status-info">{{ swInfo.scope || 'N/A' }}</span>
        </div>
        <div class="test-item">
          <span class="test-label">SW 文件 URL:</span>
          <span class="status-info">{{ swInfo.scriptURL || 'N/A' }}</span>
        </div>
      </div>

      <!-- Service Worker 狀態 -->
      <div class="test-section">
        <h3>⚙️ Worker 狀態</h3>
        <div class="test-item">
          <span class="test-label">Active:</span>
          <span :class="swInfo.active ? 'status-pass' : 'status-fail'">
            {{ swInfo.active ? '✅ 是' : '❌ 否' }}
          </span>
        </div>
        <div class="test-item">
          <span class="test-label">Installing:</span>
          <span :class="swInfo.installing ? 'status-warn' : 'status-info'">
            {{ swInfo.installing ? '⚠️ 安裝中' : 'ℹ️ 無' }}
          </span>
        </div>
        <div class="test-item">
          <span class="test-label">Waiting:</span>
          <span :class="swInfo.waiting ? 'status-warn' : 'status-info'">
            {{ swInfo.waiting ? '⚠️ 等待中' : 'ℹ️ 無' }}
          </span>
        </div>
      </div>

      <!-- 網路狀態 -->
      <div class="test-section">
        <h3>🌍 網路狀態</h3>
        <div class="test-item">
          <span class="test-label">線上狀態:</span>
          <span :class="networkStatus.online ? 'status-pass' : 'status-warn'">
            {{ networkStatus.online ? '✅ 線上' : '⚠️ 離線' }}
          </span>
        </div>
        <div class="test-item">
          <span class="test-label">連接類型:</span>
          <span class="status-info">{{ networkStatus.connectionType }}</span>
        </div>
      </div>

      <!-- 快取狀態 -->
      <div class="test-section">
        <h3>💾 快取狀態</h3>
        <div class="test-item">
          <span class="test-label">快取數量:</span>
          <span class="status-info">{{ cacheInfo.length }} 個快取</span>
        </div>
        <div v-if="cacheInfo.length > 0" class="cache-details">
          <div v-for="cache in cacheInfo" :key="cache.name" class="cache-item">
            <strong>{{ cache.name }}</strong>: {{ cache.items }} 個項目
          </div>
        </div>
      </div>
    </div>

          <!-- 操作按鈕 -->
      <div class="action-section">
        <h3>🛠️ 診斷操作</h3>
        <div class="action-buttons">
          <button @click="refreshStatus" class="btn btn-primary">🔄 重新檢測</button>
          <button @click="forceRegisterSW" class="btn btn-success">🚀 強制註冊 SW</button>
          <button @click="forceActivateSW" class="btn btn-info">⚡ 強制啟動 SW</button>
          <button @click="testSWFile" class="btn btn-secondary">🔍 測試 SW 文件</button>
          <button @click="fixIOSIssues" class="btn btn-warning" v-if="isIOSSafari()">🍎 修復 iOS 問題</button>
          <button @click="clearAllCaches" class="btn btn-danger">🗑️ 清除所有快取</button>
        </div>
      </div>

    <!-- 診斷結果與建議 -->
    <div v-if="diagnostics.length > 0" class="diagnostics-section">
      <h3>🩺 診斷結果</h3>
      <div v-for="(item, index) in diagnostics" :key="index" class="diagnostic-item" :class="item.type">
        <h4>{{ item.title }}</h4>
        <p>{{ item.message }}</p>
        <div v-if="item.solution" class="solution">
          <strong>解決方案:</strong> {{ item.solution }}
        </div>
      </div>
    </div>

    <!-- 日誌 -->
    <div class="logs-section">
      <h3>📄 操作日誌</h3>
      <div class="logs">
        <div v-for="(log, index) in logs" :key="index" class="log-item" :class="log.type">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 響應式數據
const tests = ref({
  swSupported: false,
  cacheSupported: false,
  isSecure: false
})

const swInfo = ref({
  registered: false,
  controlling: false,
  scope: '',
  scriptURL: '',
  active: false,
  installing: false,
  waiting: false
})

const networkStatus = ref({
  online: true,
  connectionType: 'unknown'
})

const cacheInfo = ref<Array<{name: string, items: number}>>([])
const diagnostics = ref<Array<{type: string, title: string, message: string, solution?: string}>>([])
const logs = ref<Array<{time: string, message: string, type: string}>>([])

interface LogEntry {
  time: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

interface DiagnosticItem {
  type: 'error' | 'warning' | 'info'
  title: string
  message: string
  solution?: string
}

// 計算整體狀態
const overallStatus = computed(() => {
  if (!tests.value.swSupported) {
    return {
      title: '❌ Service Worker 不支援',
      message: '你的瀏覽器不支援 Service Worker',
      class: 'status-error'
    }
  }
  
  if (swInfo.value.registered && swInfo.value.controlling && swInfo.value.active) {
    return {
      title: '✅ Service Worker 正常運作',
      message: 'PWA 功能完全正常',
      class: 'status-success'
    }
  }
  
  if (swInfo.value.registered) {
    return {
      title: '⚠️ Service Worker 部分正常',
      message: 'Service Worker 已註冊但可能還未完全啟動',
      class: 'status-warning'
    }
  }
  
  return {
    title: '❌ Service Worker 未運作',
    message: 'Service Worker 未註冊或啟動失敗',
    class: 'status-error'
  }
})

// 添加日誌
const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  logs.value.unshift({
    time: new Date().toLocaleTimeString(),
    message,
    type
  })
  if (logs.value.length > 20) {
    logs.value = logs.value.slice(0, 20)
  }
}

// 檢查瀏覽器支援
const checkBrowserSupport = () => {
  if (!process.client) return
  
  tests.value.swSupported = 'serviceWorker' in navigator
  tests.value.cacheSupported = 'caches' in window
  tests.value.isSecure = location.protocol === 'https:' || location.hostname === 'localhost'
  
  addLog(`瀏覽器支援檢查完成`, 'info')
}

// 檢查 Service Worker 狀態
const checkSWStatus = async () => {
  if (!process.client || !tests.value.swSupported) return
  
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    
    swInfo.value = {
      registered: !!registration,
      controlling: !!navigator.serviceWorker.controller,
      scope: registration?.scope || '',
      scriptURL: registration?.active?.scriptURL || '',
      active: !!registration?.active,
      installing: !!registration?.installing,
      waiting: !!registration?.waiting
    }
    
    addLog(`Service Worker 狀態檢查完成`, 'success')
  } catch (error) {
    addLog(`Service Worker 狀態檢查失敗: ${error instanceof Error ? error.message : String(error)}`, 'error')
  }
}

// 檢查網路狀態
const checkNetworkStatus = () => {
  if (!process.client) return
  
  networkStatus.value.online = navigator.onLine
  networkStatus.value.connectionType = (navigator as any).connection?.effectiveType || 'unknown'
  
  // 監聽網路狀態變化
  window.addEventListener('online', () => {
    networkStatus.value.online = true
    addLog('網路已連線', 'success')
  })
  
  window.addEventListener('offline', () => {
    networkStatus.value.online = false
    addLog('網路已斷線', 'warning')
  })
}

// 檢查快取狀態
const checkCacheStatus = async () => {
  if (!process.client || !tests.value.cacheSupported) return
  
  try {
    const cacheNames = await caches.keys()
    const cacheDetails = await Promise.all(
      cacheNames.map(async (name) => {
        const cache = await caches.open(name)
        const keys = await cache.keys()
        return { name, items: keys.length }
      })
    )
    cacheInfo.value = cacheDetails
    addLog(`快取狀態檢查完成: ${cacheNames.length} 個快取`, 'success')
  } catch (error) {
    addLog(`快取狀態檢查失敗: ${error instanceof Error ? error.message : String(error)}`, 'error')
  }
}

// 執行診斷
const runDiagnostics = () => {
  diagnostics.value = []
  
  // 檢查基本支援
  if (!tests.value.swSupported) {
    diagnostics.value.push({
      type: 'error',
      title: '瀏覽器不支援',
      message: '你的瀏覽器不支援 Service Worker',
      solution: '請使用現代瀏覽器如 Chrome, Firefox, Safari, Edge'
    })
    return
  }
  
  // 檢查 HTTPS
  if (!tests.value.isSecure) {
    diagnostics.value.push({
      type: 'warning',
      title: 'HTTPS 問題',
      message: 'Service Worker 需要在 HTTPS 環境下運作',
      solution: '部署到 HTTPS 服務器或在 localhost 開發'
    })
  }
  
  // 檢查註冊狀態
  if (!swInfo.value.registered) {
    diagnostics.value.push({
      type: 'error',
      title: 'Service Worker 未註冊',
      message: 'Service Worker 文件可能不存在或註冊失敗',
      solution: '檢查 sw.js 文件是否存在，或嘗試手動註冊'
    })
  }
  
  // 檢查控制狀態
  if (swInfo.value.registered && !swInfo.value.controlling) {
    diagnostics.value.push({
      type: 'warning',
      title: 'Service Worker 未控制頁面',
      message: 'Service Worker 已註冊但未控制當前頁面',
      solution: '刷新頁面或等待 Service Worker 啟動'
    })
  }
  
  // 檢查快取
  if (cacheInfo.value.length === 0) {
    diagnostics.value.push({
      type: 'info',
      title: '無快取內容',
      message: 'Service Worker 尚未創建任何快取',
      solution: '正常情況，快取會在使用過程中逐漸建立'
    })
  }
}



// 測試 Service Worker 文件
const testSWFile = async () => {
  // 根據環境確定要測試的路徑
  const isDev = process.dev
  const swPaths = isDev 
    ? ['/sw.js', '/_nuxt/sw.js', '/service-worker.js']  // 開發環境
    : ['/sw.js', '/service-worker.js']  // 生產環境，移除 /_nuxt/ 路徑
  
  addLog(`當前環境: ${isDev ? '開發' : '生產'}`, 'info')
  
  for (const path of swPaths) {
    try {
      // 添加緩存清除參數以避免緩存問題
      const testUrl = `${path}?t=${Date.now()}`
      addLog(`測試路徑: ${path}`, 'info')
      
      const response = await fetch(testUrl, {
        method: 'HEAD',  // 使用 HEAD 請求節省帶寬
        cache: 'no-cache',  // 強制不使用緩存
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (response.ok) {
        addLog(`✅ SW 文件存在: ${path} (${response.status})`, 'success')
        // 獲取文件信息
        const contentType = response.headers.get('content-type')
        const contentLength = response.headers.get('content-length')
        if (contentType) addLog(`   內容類型: ${contentType}`, 'info')
        if (contentLength) addLog(`   文件大小: ${contentLength} bytes`, 'info')
      } else {
        addLog(`❌ SW 文件不存在: ${path} (${response.status})`, 'error')
      }
    } catch (error) {
      addLog(`❌ 無法訪問: ${path} - ${error instanceof Error ? error.message : String(error)}`, 'error')
      
      // iOS Safari 特殊處理
      if (isIOSSafari() && error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          addLog(`   iOS Safari 網路錯誤，可能是緩存或網路問題`, 'warning')
        }
      }
    }
  }
  
  // 額外測試：嘗試 fetch 實際內容
  addLog('嘗試獲取 Service Worker 文件內容...', 'info')
  try {
    const response = await fetch('/sw.js', { cache: 'no-cache' })
    if (response.ok) {
      const content = await response.text()
      if (content.length > 0) {
        addLog(`✅ Service Worker 內容載入成功 (${content.length} 字符)`, 'success')
        if (content.includes('workbox')) {
          addLog(`   檢測到 Workbox: 是`, 'info')
        }
        if (content.includes('precacheAndRoute')) {
          addLog(`   預快取功能: 已啟用`, 'info')
        }
      } else {
        addLog(`⚠️ Service Worker 文件為空`, 'warning')
      }
    }
  } catch (error) {
    addLog(`❌ 無法獲取 SW 內容: ${error instanceof Error ? error.message : String(error)}`, 'error')
  }
}

// 清除所有快取
const clearAllCaches = async () => {
  if (!tests.value.cacheSupported) return
  
  if (confirm('確定要清除所有快取嗎？這將影響離線功能。')) {
    try {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
      addLog(`已清除 ${cacheNames.length} 個快取`, 'success')
      await checkCacheStatus()
    } catch (error) {
      addLog(`清除快取失敗: ${error instanceof Error ? error.message : String(error)}`, 'error')
    }
  }
}

// 檢查是否為 iOS Safari
const isIOSSafari = () => {
  if (!process.client) return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
}

// 修復 iOS 特殊問題
const fixIOSIssues = async () => {
  if (!isIOSSafari()) return
  
  addLog('🍎 開始執行 iOS Safari PWA 修復流程...', 'info')
  
  try {
    // 1. 檢查 PWA 模式
    const isPWAMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
    addLog(`PWA 模式: ${isPWAMode ? '是' : '否'}`, 'info')
    
    // 2. 清除現有註冊
    const registrations = await navigator.serviceWorker.getRegistrations()
    for (const registration of registrations) {
      await registration.unregister()
      addLog('已清除現有 Service Worker 註冊', 'info')
    }
    
    // 3. 清除所有快取
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      for (const name of cacheNames) {
        await caches.delete(name)
      }
      addLog('已清除所有快取', 'info')
    }
    
    // 4. 等待清理完成
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 5. 重新註冊 Service Worker
    addLog('重新註冊 Service Worker...', 'info')
    await forceRegisterSW()
    
    // 6. 提供額外建議
    addLog('修復完成！如果問題仍然存在，請嘗試以下步驟：', 'success')
    addLog('1. 完全關閉 PWA 應用', 'info')
    addLog('2. 從主畫面移除 PWA 圖示', 'info')
    addLog('3. 重新在 Safari 中安裝 PWA', 'info')
    addLog('4. 確保網路連線穩定', 'info')
    
  } catch (error) {
    addLog(`iOS 修復失敗: ${error instanceof Error ? error.message : String(error)}`, 'error')
  }
}

// 強制啟動已註冊的 Service Worker
const forceActivateSW = async () => {
  if (!tests.value.swSupported) return
  
  addLog('⚡ 開始強制啟動 Service Worker...', 'info')
  
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    
    if (!registration) {
      addLog('❌ 沒有找到已註冊的 Service Worker', 'error')
      return
    }
    
    addLog(`找到註冊: ${registration.scope}`, 'info')
    addLog(`Installing: ${!!registration.installing}`, 'info')
    addLog(`Waiting: ${!!registration.waiting}`, 'info')
    addLog(`Active: ${!!registration.active}`, 'info')
    
    const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                       /Safari/.test(navigator.userAgent) && 
                       !/Chrome/.test(navigator.userAgent)
    const isPWAMode = window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator as any).standalone === true
    
    // 1. 處理 waiting 狀態的 Service Worker
    if (registration.waiting) {
      addLog('⏳ 發現等待中的 Service Worker，嘗試跳過等待...', 'info')
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      
      // 等待 waiting 變成 active
      await new Promise<void>(resolve => {
        const checkActivation = () => {
          if (registration.active) {
            addLog('✅ Service Worker 已從 waiting 變為 active', 'success')
            resolve()
          } else {
            setTimeout(checkActivation, 100)
          }
        }
        checkActivation()
        setTimeout(() => resolve(), 3000) // 超時保護
      })
    }
    
    // 2. 處理 installing 狀態的 Service Worker
    if (registration.installing) {
      addLog('🔧 Service Worker 正在安裝中，等待安裝完成...', 'info')
      
      await new Promise<void>(resolve => {
        registration.installing!.addEventListener('statechange', function handler() {
          addLog(`Service Worker 狀態變更: ${this.state}`, 'info')
          
          if (this.state === 'installed') {
            addLog('📦 Service Worker 安裝完成', 'success')
            // 可能進入 waiting 狀態，需要跳過
            if (registration.waiting === this) {
              addLog('⏳ 正在跳過等待狀態...', 'info')
              this.postMessage({ type: 'SKIP_WAITING' })
            }
          } else if (this.state === 'activated') {
            addLog('✅ Service Worker 已啟動', 'success')
            this.removeEventListener('statechange', handler)
            resolve()
          }
        })
        
        setTimeout(() => resolve(), 10000) // 10秒超時
      })
    }
    
    // 3. 檢查是否有 active 的 Service Worker
    if (registration.active) {
      addLog('✅ 發現 active Service Worker', 'success')
      
      // 檢查控制權
      if (!navigator.serviceWorker.controller) {
        addLog('⚠️ Service Worker 未取得頁面控制權，嘗試聲明控制權...', 'warning')
        
        // 發送 CLIENTS_CLAIM 訊息
        registration.active.postMessage({ type: 'CLIENTS_CLAIM' })
        
        // iOS Safari PWA 需要額外處理
        if (isIOSSafari && isPWAMode) {
          addLog('🍎 iOS Safari PWA - 嘗試強制取得控制權...', 'info')
          
          // 多次嘗試
          for (let i = 0; i < 3; i++) {
            registration.active.postMessage({ type: 'CLIENTS_CLAIM' })
            await new Promise(resolve => setTimeout(resolve, 500))
            
            if (navigator.serviceWorker.controller) {
              addLog('✅ 成功取得控制權', 'success')
              break
            }
          }
          
          // 如果還是沒有控制權，建議刷新頁面
          if (!navigator.serviceWorker.controller) {
            addLog('⚠️ 仍無法取得控制權，可能需要刷新頁面', 'warning')
            
            // 詢問是否刷新頁面
            if (confirm('Service Worker 無法取得控制權，是否刷新頁面？')) {
              window.location.reload()
              return
            }
          }
        } else {
          // 非 iOS Safari，等待控制權
          await new Promise<void>(resolve => {
            const checkController = () => {
              if (navigator.serviceWorker.controller) {
                addLog('✅ 已取得控制權', 'success')
                resolve()
              } else {
                setTimeout(checkController, 100)
              }
            }
            checkController()
            setTimeout(() => resolve(), 2000) // 2秒超時
          })
        }
      } else {
        addLog('✅ Service Worker 已有控制權', 'success')
      }
    } else {
      addLog('❌ 沒有 active 的 Service Worker', 'error')
      
      // 嘗試更新註冊以觸發啟動
      addLog('🔄 嘗試更新註冊以觸發啟動...', 'info')
      try {
        await registration.update()
        addLog('📥 註冊更新完成', 'info')
        
        // 等待一段時間後重新檢查
        setTimeout(async () => {
          await refreshStatus()
        }, 2000)
      } catch (updateError) {
        addLog(`❌ 註冊更新失敗: ${updateError}`, 'error')
      }
    }
    
    addLog('🎉 強制啟動流程完成', 'success')
    
    // 重新檢查狀態
    setTimeout(refreshStatus, 1000)
    
  } catch (error) {
    addLog(`❌ 強制啟動失敗: ${error instanceof Error ? error.message : String(error)}`, 'error')
  }
}

// 強制重新註冊 Service Worker（使用插件中的邏輯）
const forceRegisterSW = async () => {
  if (!tests.value.swSupported) return
  
  addLog('🚀 開始強制註冊 Service Worker...', 'info')
  
  try {
    // 先清除現有註冊
    const registrations = await navigator.serviceWorker.getRegistrations()
    for (const registration of registrations) {
      await registration.unregister()
      addLog('已清除現有註冊', 'info')
    }

    // 等待清除完成
    await new Promise(resolve => setTimeout(resolve, 500))

    // 使用與插件相同的註冊邏輯
    const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                       /Safari/.test(navigator.userAgent) && 
                       !/Chrome/.test(navigator.userAgent)
    const isPWAMode = window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator as any).standalone === true
    
    addLog(`平台: iOS Safari: ${isIOSSafari}, PWA: ${isPWAMode}`, 'info')

    // 註冊選項
    const registrationOptions: RegistrationOptions = {
      scope: '/'
    }

    if (isIOSSafari && isPWAMode) {
      registrationOptions.updateViaCache = 'none'
      addLog('使用 iOS Safari PWA 優化配置', 'info')
    }

    // 註冊
    const registration = await navigator.serviceWorker.register('/sw.js', registrationOptions)
    addLog(`✅ Service Worker 強制註冊成功: ${registration.scope}`, 'success')

    // 等待啟動
    if (registration.installing) {
      addLog('⏳ 正在安裝...', 'info')
      await new Promise<void>(resolve => {
        registration.installing!.addEventListener('statechange', function handler() {
          if (this.state === 'activated') {
            this.removeEventListener('statechange', handler)
            resolve()
          }
        })
        setTimeout(() => resolve(), 5000) // 超時保護
      })
    }

    // iOS Safari PWA 特殊處理
    if (isIOSSafari && isPWAMode) {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        addLog('iOS Safari - 跳過等待', 'info')
      }
      
      if (registration.active && !navigator.serviceWorker.controller) {
        registration.active.postMessage({ type: 'CLIENTS_CLAIM' })
        addLog('iOS Safari - 聲明控制權', 'info')
        
        // 等待控制權
        await new Promise<void>(resolve => {
          const checkController = () => {
            if (navigator.serviceWorker.controller) {
              addLog('✅ 已取得控制權', 'success')
              resolve()
            } else {
              setTimeout(checkController, 100)
            }
          }
          checkController()
          setTimeout(() => resolve(), 3000)
        })
      }
    }

    addLog('🎉 強制註冊完成', 'success')
    
    // 重新檢查狀態
    setTimeout(refreshStatus, 1000)
    
  } catch (error) {
    addLog(`❌ 強制註冊失敗: ${error instanceof Error ? error.message : String(error)}`, 'error')
  }
}

// 刷新所有狀態
const refreshStatus = async () => {
  addLog('開始重新檢測...', 'info')
  checkBrowserSupport()
  await checkSWStatus()
  checkNetworkStatus()
  await checkCacheStatus()
  runDiagnostics()
  addLog('檢測完成', 'success')
}

// 監聽 Service Worker 訊息
const setupSWMessageListener = () => {
  if (!process.client || !('serviceWorker' in navigator)) return
  
  navigator.serviceWorker.addEventListener('message', (event) => {
    addLog(`📨 收到 SW 訊息: ${JSON.stringify(event.data)}`, 'info')
    
    if (event.data && event.data.type === 'SW_ACTIVATED') {
      addLog('🎉 Service Worker 已啟動並發送通知！', 'success')
      // 重新檢查狀態
      setTimeout(refreshStatus, 500)
    }
  })
}

// 初始化
onMounted(() => {
  refreshStatus()
  setupSWMessageListener()
})
</script>

<style scoped>
.sw-status-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
}

.status-overview {
  margin-bottom: 2rem;
}

.status-card {
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
}

.status-card.status-success {
  background: #d1fae5;
  border: 2px solid #10b981;
  color: #065f46;
}

.status-card.status-warning {
  background: #fef3c7;
  border: 2px solid #f59e0b;
  color: #92400e;
}

.status-card.status-error {
  background: #fee2e2;
  border: 2px solid #ef4444;
  color: #991b1b;
}

.test-sections {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.test-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
}

.test-section h3 {
  margin: 0 0 1rem 0;
  color: #374151;
  border-bottom: 2px solid #f3f4f6;
  padding-bottom: 0.5rem;
}

.test-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.test-item:last-child {
  border-bottom: none;
}

.test-label {
  font-weight: 500;
  color: #374151;
}

.status-pass { color: #059669; font-weight: 600; }
.status-fail { color: #dc2626; font-weight: 600; }
.status-warn { color: #d97706; font-weight: 600; }
.status-info { color: #6b7280; font-weight: 500; }

.cache-details {
  margin-top: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
}

.cache-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.cache-item:last-child {
  border-bottom: none;
}

.action-section {
  margin-bottom: 2rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #d97706;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
}

.btn-info {
  background: #3b82f6;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #2563eb;
}

.diagnostics-section {
  margin-bottom: 2rem;
}

.diagnostic-item {
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid;
}

.diagnostic-item.error {
  background: #fee2e2;
  border-color: #dc2626;
}

.diagnostic-item.warning {
  background: #fef3c7;
  border-color: #f59e0b;
}

.diagnostic-item.info {
  background: #dbeafe;
  border-color: #3b82f6;
}

.diagnostic-item h4 {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.solution {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  font-size: 0.875rem;
}

.logs-section {
  background: #1f2937;
  border-radius: 8px;
  padding: 1.5rem;
}

.logs-section h3 {
  color: white;
  margin: 0 0 1rem 0;
}

.logs {
  max-height: 300px;
  overflow-y: auto;
  background: #111827;
  border-radius: 4px;
  padding: 1rem;
}

.log-item {
  display: flex;
  gap: 1rem;
  padding: 0.25rem 0;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 0.875rem;
}

.log-time {
  color: #9ca3af;
  flex-shrink: 0;
}

.log-message {
  color: #e5e7eb;
}

.log-item.success .log-message { color: #10b981; }
.log-item.warning .log-message { color: #f59e0b; }
.log-item.error .log-message { color: #ef4444; }
</style> 