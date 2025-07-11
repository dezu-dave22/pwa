<template>
  <div class="file-picker">
    <div class="file-picker__header">
      <h3 class="file-picker__title">選擇檔案</h3>
      <p class="file-picker__subtitle">
        支援圖片和影片檔案，單檔最大 {{ formatFileSize(maxFileSize) }}
      </p>
    </div>
    
    <div class="file-picker__area" @click="triggerFileInput" @drop="handleDrop" @dragover.prevent @dragenter.prevent>
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*,video/*"
        class="file-picker__input"
        @change="handleFileSelect"
      />
      
      <div class="file-picker__content">
        <div class="file-picker__icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </div>
        <p class="file-picker__text">
          點擊選擇檔案或拖拽檔案到此處
        </p>
        <p class="file-picker__hint">
          支援 JPG, PNG, GIF, MP4, MOV 等格式
        </p>
      </div>
    </div>
    
    <!-- iOS 警告 -->
    <div v-if="isIOSSafari()" class="file-picker__warning">
      <div class="warning__icon">⚠️</div>
      <div class="warning__content">
        <h4>iOS Safari 限制</h4>
        <p>iOS Safari 對離線儲存有限制，建議立即上傳大檔案</p>
      </div>
    </div>
    
    <!-- 錯誤訊息 -->
    <div v-if="errorMessage" class="file-picker__error">
      {{ errorMessage }}
    </div>
    
    <!-- 載入中 -->
    <div v-if="isLoading" class="file-picker__loading">
      <div class="loading__spinner"></div>
      <span>處理檔案中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  maxFileSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxFileSize: 200 * 1024 * 1024 // 200MB
})

const emit = defineEmits<{
  filesSelected: [files: File[]]
  error: [message: string]
}>()

const { addFile, checkFileSize } = useFileStore()
const { isIOSSafari } = useUploader()

const fileInput = ref<HTMLInputElement>()
const isLoading = ref(false)
const errorMessage = ref('')

// 格式化檔案大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 觸發檔案選擇
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 處理檔案選擇
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  
  if (files.length > 0) {
    await processFiles(files)
  }
  
  // 清除 input 值，允許重複選擇相同檔案
  target.value = ''
}

// 處理拖拽
const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  const files = Array.from(event.dataTransfer?.files || [])
  
  if (files.length > 0) {
    await processFiles(files)
  }
}

// 處理檔案
const processFiles = async (files: File[]) => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    const validFiles: File[] = []
    const errors: string[] = []
    
    for (const file of files) {
      // 檢查檔案類型
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        errors.push(`${file.name}: 不支援的檔案類型`)
        continue
      }
      
      // 檢查檔案大小
      if (!checkFileSize(file)) {
        errors.push(`${file.name}: 檔案大小超過限制`)
        continue
      }
      
      validFiles.push(file)
    }
    
    // 顯示錯誤訊息
    if (errors.length > 0) {
      errorMessage.value = errors.join('\n')
    }
    
    // 處理有效檔案
    if (validFiles.length > 0) {
      for (const file of validFiles) {
        try {
          await addFile(file)
        } catch (error) {
          errors.push(`${file.name}: ${error instanceof Error ? error.message : '儲存失敗'}`)
        }
      }
      
      emit('filesSelected', validFiles)
    }
    
    // 更新錯誤訊息
    if (errors.length > 0) {
      errorMessage.value = errors.join('\n')
    }
    
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '處理檔案時發生錯誤'
    emit('error', errorMessage.value)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.file-picker {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.file-picker__header {
  text-align: center;
  margin-bottom: 2rem;
}

.file-picker__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.file-picker__subtitle {
  color: #6b7280;
  margin: 0;
}

.file-picker__area {
  position: relative;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f9fafb;
}

.file-picker__area:hover {
  border-color: #4f46e5;
  background: #f0f9ff;
}

.file-picker__area:active {
  transform: scale(0.98);
}

.file-picker__input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.file-picker__content {
  pointer-events: none;
}

.file-picker__icon {
  color: #6b7280;
  margin-bottom: 1rem;
}

.file-picker__text {
  font-size: 1.125rem;
  font-weight: 500;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.file-picker__hint {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.file-picker__warning {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 1rem;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
}

.warning__icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.warning__content h4 {
  margin: 0 0 0.25rem 0;
  color: #92400e;
  font-size: 0.875rem;
  font-weight: 600;
}

.warning__content p {
  margin: 0;
  color: #92400e;
  font-size: 0.875rem;
}

.file-picker__error {
  margin-top: 1rem;
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #f87171;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.875rem;
  white-space: pre-line;
}

.file-picker__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 1rem;
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 8px;
  color: #0369a1;
}

.loading__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid #0ea5e9;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style> 