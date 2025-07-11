<template>
  <div class="app">
    <header class="app__header">
      <div class="header__content">
        <h1 class="header__title">PWA 離線檔案暫存系統</h1>
        <div class="header__status">
          <div class="status-indicator" :class="{ 'online': isOnline, 'offline': !isOnline }">
            <span class="status__dot"></span>
            <span class="status__text">{{ isOnline ? '線上' : '離線' }}</span>
          </div>
          <div v-if="isUploading" class="upload-indicator">
            <div class="upload__spinner"></div>
            <span class="upload__text">上傳中...</span>
          </div>
        </div>
      </div>
    </header>
    
    <main class="app__main">
      <div class="main__content">
        <!-- 檔案選擇器 -->
        <section class="section">
          <FilePicker 
            @files-selected="handleFilesSelected"
            @error="handleError"
          />
        </section>
        
        <!-- 檔案清單 -->
        <section class="section">
          <FileList :files="files" />
        </section>
        
        <!-- 儲存狀態 -->
        <section class="section">
          <StorageStatus />
        </section>
        
        <!-- 上傳控制 -->
        <section class="section">
          <div class="upload-controls">
            <button 
              @click="handleUpload"
              :disabled="!isOnline || isUploading || pendingCount === 0"
              class="upload-btn"
            >
              <span v-if="isUploading" class="upload-btn__spinner"></span>
              <span v-else>📤</span>
              {{ isUploading ? '上傳中...' : '立即上傳' }}
            </button>
            
            <div class="upload-info">
              <p v-if="!isOnline" class="upload-info__offline">
                ⚠️ 目前處於離線狀態，檔案將在恢復網路後自動上傳
              </p>
              <p v-else-if="pendingCount === 0" class="upload-info__empty">
                ✅ 沒有待上傳的檔案
              </p>
              <p v-else class="upload-info__pending">
                📋 有 {{ pendingCount }} 個檔案等待上傳
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
    
    <!-- 通知 -->
    <div v-if="notification.show" class="notification" :class="notification.type">
      <div class="notification__content">
        <span class="notification__icon">{{ notification.icon }}</span>
        <span class="notification__message">{{ notification.message }}</span>
      </div>
      <button @click="hideNotification" class="notification__close">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface StoredFile {
  id: string
  name: string
  size: number
  type: string
  blob: Blob
  createdAt: number
  uploaded: boolean
  uploadAttempts: number
}

interface Notification {
  show: boolean
  type: 'success' | 'error' | 'info'
  message: string
  icon: string
}

const { getAllFiles } = useFileStore()
const { isOnline, isUploading, triggerUpload, setupNetworkListeners, uploadCompleted } = useUploader()

const files = ref<StoredFile[]>([])
const pendingCount = computed(() => files.value.filter(f => !f.uploaded).length)
const uploadedCount = computed(() => files.value.filter(f => f.uploaded).length)

const notification = ref<Notification>({
  show: false,
  type: 'info',
  message: '',
  icon: 'ℹ️'
})

// 載入檔案清單
const loadFiles = async () => {
  try {
    console.log('開始載入檔案清單...')
    files.value = await getAllFiles()
    console.log('檔案清單載入完成，檔案數:', files.value.length)
    console.log('待上傳:', pendingCount.value, '已上傳:', uploadedCount.value)
  } catch (error) {
    console.error('載入檔案清單失敗:', error)
    showNotification('error', '載入檔案清單失敗')
  }
}

// 處理檔案選擇
const handleFilesSelected = async (selectedFiles: File[]) => {
  showNotification('success', `已選擇 ${selectedFiles.length} 個檔案`)
  await loadFiles() // 重新載入檔案清單
  
  // 如果線上且有待上傳檔案，自動觸發上傳
  if (isOnline.value && pendingCount.value > 0) {
    console.log('自動觸發上傳，待上傳檔案數:', pendingCount.value)
    await handleUpload()
  }
}

// 處理錯誤
const handleError = (error: string) => {
  showNotification('error', error)
}

// 顯示通知
const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  }
  
  notification.value = {
    show: true,
    type,
    message,
    icon: icons[type]
  }
  
  // 自動隱藏通知
  setTimeout(() => {
    hideNotification()
  }, 5000)
}

// 隱藏通知
const hideNotification = () => {
  notification.value.show = false
}

// 觸發上傳
const handleUpload = async () => {
  try {
    console.log('開始上傳，待上傳檔案數:', pendingCount.value)
    await triggerUpload()
    showNotification('success', '上傳完成')
  } catch (error) {
    console.error('上傳失敗:', error)
    showNotification('error', '上傳失敗')
  }
}

// 監聽上傳完成事件
watch(uploadCompleted, async () => {
  console.log('上傳完成事件觸發，重新載入檔案清單')
  await loadFiles()
})

// 初始化
onMounted(() => {
  loadFiles()
  setupNetworkListeners()
  
  // 定期更新檔案清單
  const interval = setInterval(loadFiles, 5000)
  
  onUnmounted(() => {
    clearInterval(interval)
  })
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app__header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header__content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.header__status {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-indicator.online {
  background: #d1fae5;
  color: #065f46;
}

.status-indicator.offline {
  background: #fee2e2;
  color: #991b1b;
}

.status__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.upload-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.upload__spinner {
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.app__main {
  padding: 2rem 0;
}

.main__content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.section {
  margin-bottom: 3rem;
}

.upload-controls {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 1rem;
}

.upload-btn:hover:not(:disabled) {
  background: #4338ca;
  transform: translateY(-1px);
}

.upload-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.upload-btn__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.upload-info {
  font-size: 0.875rem;
}

.upload-info__offline {
  color: #dc2626;
  margin: 0;
}

.upload-info__empty {
  color: #059669;
  margin: 0;
}

.upload-info__pending {
  color: #1f2937;
  margin: 0;
}

.notification {
  position: fixed;
  top: 2rem;
  right: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-width: 400px;
  animation: slideIn 0.3s ease;
}

.notification.success {
  background: #d1fae5;
  border: 1px solid #10b981;
  color: #065f46;
}

.notification.error {
  background: #fee2e2;
  border: 1px solid #f87171;
  color: #991b1b;
}

.notification.info {
  background: #dbeafe;
  border: 1px solid #60a5fa;
  color: #1e40af;
}

.notification__content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.notification__icon {
  font-size: 1.25rem;
}

.notification__message {
  font-size: 0.875rem;
  font-weight: 500;
}

.notification__close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: currentColor;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.notification__close:hover {
  opacity: 1;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 響應式設計 */
@media (max-width: 768px) {
  .header__content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .header__title {
    font-size: 1.25rem;
  }
  
  .main__content {
    padding: 0 1rem;
  }
  
  .notification {
    top: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
  }
}
</style> 