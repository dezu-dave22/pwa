<template>
  <div class="file-list">
    <div class="file-list__header">
      <h3 class="file-list__title">檔案清單</h3>
      <div class="file-list__stats">
        <span class="stat">
          總計: {{ files.length }}
        </span>
        <span class="stat">
          待上傳: {{ pendingCount }}
        </span>
        <span class="stat">
          已上傳: {{ uploadedCount }}
        </span>
      </div>
    </div>
    
    <div v-if="files.length === 0" class="file-list__empty">
      <div class="empty__icon">📁</div>
      <p>尚未選擇任何檔案</p>
    </div>
    
    <div v-else class="file-list__items">
      <div
        v-for="file in sortedFiles"
        :key="file.id"
        class="file-item"
        :class="{ 'file-item--uploaded': file.uploaded }"
      >
        <div class="file-item__icon">
          <span v-if="file.type.startsWith('image/')">🖼️</span>
          <span v-else-if="file.type.startsWith('video/')">🎥</span>
          <span v-else>📄</span>
        </div>
        
        <div class="file-item__info">
          <div class="file-item__name">{{ file.name }}</div>
          <div class="file-item__details">
            <span class="file-item__size">{{ formatFileSize(file.size) }}</span>
            <span class="file-item__date">{{ formatDate(file.createdAt) }}</span>
          </div>
        </div>
        
        <div class="file-item__status">
          <!-- 上傳狀態 -->
          <div v-if="!file.uploaded" class="status-pending">
            <span class="status__text">待上傳</span>
            <span v-if="file.uploadAttempts > 0" class="status__attempts">
              (嘗試 {{ file.uploadAttempts }}/3)
            </span>
          </div>
          
          <div v-else class="status-uploaded">
            <span class="status__text">已上傳</span>
            <span class="status__icon">✅</span>
          </div>
          
          <!-- 上傳進度 -->
          <div v-if="getFileUploadProgress(file.id) && getFileUploadProgress(file.id)?.status === 'uploading'" class="upload-progress">
            <div class="progress__bar">
              <div 
                class="progress__fill" 
                :style="{ width: `${getFileUploadProgress(file.id)?.progress || 0}%` }"
              ></div>
            </div>
            <span class="progress__text">{{ getFileUploadProgress(file.id)?.progress || 0 }}%</span>
          </div>
          
          <!-- 上傳錯誤 -->
          <div v-if="getFileUploadProgress(file.id) && getFileUploadProgress(file.id)?.status === 'error'" class="upload-error">
            <span class="error__text">{{ getFileUploadProgress(file.id)?.error }}</span>
            <span class="error__icon">❌</span>
          </div>
        </div>
        
        <div class="file-item__actions">
          <button
            v-if="!file.uploaded"
            @click="deleteFile(file.id)"
            class="action-btn action-btn--delete"
            title="刪除檔案"
          >
            🗑️
          </button>
          
          <button
            v-if="file.uploaded"
            @click="deleteFile(file.id)"
            class="action-btn action-btn--clear"
            title="清除記錄"
          >
            🧹
          </button>
        </div>
      </div>
    </div>
    
    <!-- 清除已上傳檔案按鈕 -->
    <div v-if="uploadedCount > 0" class="file-list__actions">
      <button @click="clearUploadedFiles" class="clear-btn">
        清除已上傳檔案
      </button>
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

interface Props {
  files: StoredFile[]
}

const props = defineProps<Props>()

const { deleteFile, clearUploadedFiles } = useFileStore()
const { getUploadProgress } = useUploader()

// 計算統計
const pendingCount = computed(() => props.files.filter(f => !f.uploaded).length)
const uploadedCount = computed(() => props.files.filter(f => f.uploaded).length)

// 排序檔案（未上傳在前，按時間排序）
const sortedFiles = computed(() => {
  return [...props.files].sort((a, b) => {
    if (a.uploaded !== b.uploaded) {
      return a.uploaded ? 1 : -1
    }
    return b.createdAt - a.createdAt
  })
})

// 格式化檔案大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-TW', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 取得上傳進度
const getFileUploadProgress = (fileId: string) => {
  return getUploadProgress(fileId)
}
</script>

<style scoped>
.file-list {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.file-list__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.file-list__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.file-list__stats {
  display: flex;
  gap: 1rem;
}

.stat {
  font-size: 0.875rem;
  color: #6b7280;
  padding: 0.25rem 0.5rem;
  background: #f3f4f6;
  border-radius: 4px;
}

.file-list__empty {
  text-align: center;
  padding: 3rem 2rem;
  color: #6b7280;
}

.empty__icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.file-list__items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.file-item:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.file-item--uploaded {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.file-item__icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.file-item__info {
  flex: 1;
  min-width: 0;
}

.file-item__name {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-item__details {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.file-item__status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  min-width: 120px;
}

.status-pending {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status__text {
  font-size: 0.875rem;
  color: #f59e0b;
  font-weight: 500;
}

.status__attempts {
  font-size: 0.75rem;
  color: #6b7280;
}

.status-uploaded {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-uploaded .status__text {
  color: #059669;
}

.status__icon {
  font-size: 1rem;
}

.upload-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.progress__bar {
  flex: 1;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.progress__fill {
  height: 100%;
  background: #4f46e5;
  transition: width 0.3s ease;
}

.progress__text {
  font-size: 0.75rem;
  color: #6b7280;
  min-width: 35px;
}

.upload-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error__text {
  font-size: 0.75rem;
  color: #dc2626;
}

.error__icon {
  font-size: 0.875rem;
}

.file-item__actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.action-btn--delete {
  background: #fef2f2;
  color: #dc2626;
}

.action-btn--delete:hover {
  background: #fee2e2;
}

.action-btn--clear {
  background: #f0f9ff;
  color: #0369a1;
}

.action-btn--clear:hover {
  background: #e0f2fe;
}

.file-list__actions {
  margin-top: 1.5rem;
  text-align: center;
}

.clear-btn {
  padding: 0.75rem 1.5rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background: #e5e7eb;
}
</style> 