<template>
  <div class="storage-status">
    <div class="storage-status__header">
      <h3 class="storage-status__title">儲存空間</h3>
      <button @click="refreshStats" class="refresh-btn" :disabled="isLoading">
        🔄
      </button>
    </div>
    
    <div v-if="isLoading" class="storage-status__loading">
      <div class="loading__spinner"></div>
      <span>載入中...</span>
    </div>
    
    <div v-else class="storage-status__content">
      <!-- 本地儲存統計 -->
      <div class="storage-section">
        <h4 class="section__title">本地檔案</h4>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat__label">總檔案數</span>
            <span class="stat__value">{{ stats.totalFiles }}</span>
          </div>
          <div class="stat-item">
            <span class="stat__label">總大小</span>
            <span class="stat__value">{{ formatFileSize(stats.totalSize) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat__label">待上傳</span>
            <span class="stat__value">{{ stats.pendingCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat__label">已上傳</span>
            <span class="stat__value">{{ stats.uploadedCount }}</span>
          </div>
        </div>
      </div>
      
      <!-- 瀏覽器儲存空間 -->
      <div class="storage-section">
        <h4 class="section__title">瀏覽器儲存空間</h4>
        <div class="storage-bar">
          <div class="storage-bar__info">
            <span class="storage-bar__used">{{ formatFileSize(storageQuota.usage) }}</span>
            <span class="storage-bar__total">/ {{ formatFileSize(storageQuota.quota) }}</span>
          </div>
          <div class="storage-bar__progress">
            <div 
              class="storage-bar__fill" 
              :style="{ width: `${usagePercentage}%` }"
              :class="{ 'storage-bar__fill--warning': usagePercentage > 80 }"
            ></div>
          </div>
          <div class="storage-bar__percentage">
            {{ usagePercentage.toFixed(1) }}%
          </div>
        </div>
        
        <div class="storage-details">
          <div class="detail-item">
            <span class="detail__label">已使用</span>
            <span class="detail__value">{{ formatFileSize(storageQuota.usage) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail__label">可用空間</span>
            <span class="detail__value">{{ formatFileSize(storageQuota.available) }}</span>
          </div>
        </div>
      </div>
      
      <!-- 平台資訊 -->
      <div class="storage-section">
        <h4 class="section__title">平台資訊</h4>
        <div class="platform-info">
          <div class="platform-item">
            <span class="platform__label">平台</span>
            <span class="platform__value">{{ platformInfo.platform }}</span>
          </div>
          <div class="platform-item">
            <span class="platform__label">瀏覽器</span>
            <span class="platform__value">{{ platformInfo.browser }}</span>
          </div>
          <div class="platform-item">
            <span class="platform__label">PWA 模式</span>
            <span class="platform__value">{{ platformInfo.isPWA ? '是' : '否' }}</span>
          </div>
          <div class="platform-item">
            <span class="platform__label">網路狀態</span>
            <span class="platform__value" :class="{ 'online': isOnline, 'offline': !isOnline }">
              {{ isOnline ? '線上' : '離線' }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- 限制提醒 -->
      <div v-if="showLimitations" class="storage-limitations">
        <h4 class="limitations__title">⚠️ 平台限制</h4>
        <ul class="limitations__list">
          <li v-if="isIOSSafari()">iOS Safari 對離線儲存有嚴格限制，建議立即上傳大檔案</li>
          <li v-if="usagePercentage > 80">儲存空間使用率較高，建議清理已上傳檔案</li>
          <li v-if="!isOnline">目前處於離線狀態，檔案將在恢復網路後自動上傳</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getStorageStats, checkStorageQuota } = useFileStore()
const { isOnline, isIOSSafari, isPWAMode } = useUploader()

const isLoading = ref(false)
const stats = ref({
  totalFiles: 0,
  totalSize: 0,
  pendingCount: 0,
  uploadedCount: 0
})
const storageQuota = ref({
  usage: 0,
  quota: 0,
  available: 0
})

// 計算使用百分比
const usagePercentage = computed(() => {
  if (storageQuota.value.quota === 0) return 0
  return (storageQuota.value.usage / storageQuota.value.quota) * 100
})

// 平台資訊
const platformInfo = computed(() => {
  if (!process.client) {
    return {
      platform: '未知',
      browser: '未知',
      isPWA: false
    }
  }
  
  const userAgent = navigator.userAgent
  let platform = '未知'
  let browser = '未知'
  
  // 檢測平台
  if (/iPad|iPhone|iPod/.test(userAgent)) {
    platform = 'iOS'
  } else if (/Android/.test(userAgent)) {
    platform = 'Android'
  } else if (/Windows/.test(userAgent)) {
    platform = 'Windows'
  } else if (/Mac/.test(userAgent)) {
    platform = 'macOS'
  } else if (/Linux/.test(userAgent)) {
    platform = 'Linux'
  }
  
  // 檢測瀏覽器
  if (/Chrome/.test(userAgent) && !/Edge/.test(userAgent)) {
    browser = 'Chrome'
  } else if (/Firefox/.test(userAgent)) {
    browser = 'Firefox'
  } else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
    browser = 'Safari'
  } else if (/Edge/.test(userAgent)) {
    browser = 'Edge'
  }
  
  return {
    platform,
    browser,
    isPWA: isPWAMode()
  }
})

// 是否顯示限制提醒
const showLimitations = computed(() => {
  return isIOSSafari() || usagePercentage.value > 80 || !isOnline.value
})

// 載入統計資料
const loadStats = async () => {
  try {
    const [fileStats, quota] = await Promise.all([
      getStorageStats(),
      checkStorageQuota()
    ])
    
    stats.value = fileStats
    storageQuota.value = quota
  } catch (error) {
    console.error('載入統計資料失敗:', error)
  }
}

// 重新整理統計
const refreshStats = async () => {
  isLoading.value = true
  await loadStats()
  isLoading.value = false
}

// 格式化檔案大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 初始化
onMounted(() => {
  loadStats()
})

// 定期更新統計
let updateInterval: NodeJS.Timeout
onMounted(() => {
  updateInterval = setInterval(loadStats, 10000) // 每10秒更新一次
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style scoped>
.storage-status {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.storage-status__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.storage-status__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.refresh-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  background: #f3f4f6;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.refresh-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.storage-status__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #6b7280;
}

.loading__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid #6b7280;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.storage-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.section__title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat__label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.stat__value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.storage-bar {
  margin-bottom: 1rem;
}

.storage-bar__info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.storage-bar__used {
  color: #1f2937;
  font-weight: 500;
}

.storage-bar__total {
  color: #6b7280;
}

.storage-bar__progress {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.storage-bar__fill {
  height: 100%;
  background: #10b981;
  transition: width 0.3s ease;
}

.storage-bar__fill--warning {
  background: #f59e0b;
}

.storage-bar__percentage {
  text-align: right;
  font-size: 0.875rem;
  color: #6b7280;
}

.storage-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 4px;
}

.detail__label {
  font-size: 0.875rem;
  color: #6b7280;
}

.detail__value {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
}

.platform-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.platform-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 4px;
}

.platform__label {
  font-size: 0.875rem;
  color: #6b7280;
}

.platform__value {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
}

.platform__value.online {
  color: #059669;
}

.platform__value.offline {
  color: #dc2626;
}

.storage-limitations {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
}

.limitations__title {
  font-size: 1rem;
  font-weight: 600;
  color: #92400e;
  margin: 0 0 1rem 0;
}

.limitations__list {
  margin: 0;
  padding-left: 1.5rem;
  color: #92400e;
}

.limitations__list li {
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.limitations__list li:last-child {
  margin-bottom: 0;
}
</style> 