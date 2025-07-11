interface UploadProgress {
  fileId: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export const useUploader = () => {
  const { getPendingFiles, markAsUploaded, incrementUploadAttempts } = useFileStore()
  
  const isOnline = ref(process.client ? navigator.onLine : true)
  const isUploading = ref(false)
  const uploadQueue = ref<UploadProgress[]>([])
  const maxRetries = 3
  
  // 上傳完成事件
  const uploadCompleted = ref(0)
  const triggerUploadCompleted = () => {
    uploadCompleted.value++
  }
  
  // 監聽網路狀態
  const setupNetworkListeners = () => {
    if (!process.client) return
    
    const handleOnline = () => {
      isOnline.value = true
      console.log('網路已連接，開始自動上傳...')
      processUploadQueue()
    }
    
    const handleOffline = () => {
      isOnline.value = false
      console.log('網路已斷線')
    }
    
    // 更強的網路檢測函數
    const checkNetworkConnection = async () => {
      try {
        // 嘗試連線到一個簡單的資源
        const response = await fetch('/favicon.ico', { 
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(3000) // 3 秒超時
        })
        
        if (response.ok && !isOnline.value) {
          console.log('網路檢測成功，網路已恢復')
          handleOnline()
        }
      } catch (error) {
        if (isOnline.value) {
          console.log('網路檢測失敗，網路已斷線')
          handleOffline()
        }
      }
    }
    
    // 定期檢查網路狀態（每 3 秒）
    const checkNetworkInterval = setInterval(checkNetworkConnection, 3000)
    
    // 頁面可見性變化時檢查網路
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('頁面重新可見，檢查網路狀態')
        checkNetworkConnection()
      }
    }
    
    // 頁面重新獲得焦點時檢查
    const handleFocus = () => {
      console.log('頁面重新獲得焦點，檢查網路狀態')
      checkNetworkConnection()
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    // 清理函數
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      clearInterval(checkNetworkInterval)
    }
  }
  
  // 上傳單一檔案
  const uploadFile = async (file: any): Promise<boolean> => {
    const formData = new FormData()
    formData.append('file', file.blob, file.name)
    
    try {
      console.log(`開始上傳檔案: ${file.name} (${file.size} bytes)`)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      console.log(`上傳回應狀態: ${response.status}`)
      
      if (response.ok) {
        const result = await response.json()
        console.log('上傳成功:', result)
        await markAsUploaded(file.id)
        console.log(`檔案 ${file.name} 已標記為已上傳`)
        return true
      } else {
        const errorText = await response.text()
        console.error(`上傳失敗 ${response.status}:`, errorText)
        throw new Error(`上傳失敗: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('上傳錯誤:', error)
      await incrementUploadAttempts(file.id)
      return false
    }
  }
  
  // 處理上傳佇列
  const processUploadQueue = async () => {
    if (!isOnline.value || isUploading.value) {
      console.log('跳過上傳：', !isOnline.value ? '離線' : '正在上傳中')
      return
    }
    
    isUploading.value = true
    
    try {
      const pendingFiles = await getPendingFiles()
      console.log('待上傳檔案數:', pendingFiles.length)
      
      if (pendingFiles.length === 0) {
        console.log('沒有待上傳的檔案')
        return
      }
      
      for (const file of pendingFiles) {
        // 檢查重試次數
        if (file.uploadAttempts >= maxRetries) {
          console.warn(`檔案 ${file.name} 已達最大重試次數`)
          continue
        }
        
        // 更新上傳狀態
        const progressIndex = uploadQueue.value.findIndex(p => p.fileId === file.id)
        if (progressIndex === -1) {
          uploadQueue.value.push({
            fileId: file.id,
            progress: 0,
            status: 'uploading'
          })
        } else {
          uploadQueue.value[progressIndex].status = 'uploading'
          uploadQueue.value[progressIndex].progress = 0
        }
        
        // 執行上傳
        console.log(`開始上傳檔案 ${file.name}...`)
        const success = await uploadFile(file)
        console.log(`檔案 ${file.name} 上傳結果:`, success)
        
        // 更新結果
        if (success) {
          const index = uploadQueue.value.findIndex(p => p.fileId === file.id)
          if (index !== -1) {
            uploadQueue.value[index].status = 'success'
            uploadQueue.value[index].progress = 100
          }
          console.log(`檔案 ${file.name} 上傳成功，狀態已更新`)
        } else {
          const index = uploadQueue.value.findIndex(p => p.fileId === file.id)
          if (index !== -1) {
            uploadQueue.value[index].status = 'error'
            uploadQueue.value[index].error = '上傳失敗'
          }
          console.log(`檔案 ${file.name} 上傳失敗`)
        }
      }
    } catch (error) {
      console.error('處理上傳佇列時發生錯誤:', error)
    } finally {
      isUploading.value = false
      console.log('上傳佇列處理完成')
      triggerUploadCompleted()
    }
  }
  
  // 手動觸發上傳
  const triggerUpload = async () => {
    if (!isOnline.value) {
      alert('目前處於離線狀態，無法上傳檔案')
      return
    }
    
    await processUploadQueue()
  }
  
  // 取得上傳進度
  const getUploadProgress = (fileId: string) => {
    return uploadQueue.value.find(p => p.fileId === fileId)
  }
  
  // 清除上傳佇列
  const clearUploadQueue = () => {
    uploadQueue.value = []
  }
  
  // 取得上傳統計
  const getUploadStats = () => {
    const total = uploadQueue.value.length
    const success = uploadQueue.value.filter(p => p.status === 'success').length
    const error = uploadQueue.value.filter(p => p.status === 'error').length
    const pending = uploadQueue.value.filter(p => p.status === 'pending').length
    const uploading = uploadQueue.value.filter(p => p.status === 'uploading').length
    
    return {
      total,
      success,
      error,
      pending,
      uploading
    }
  }
  
  // 檢查是否為 iOS Safari
  const isIOSSafari = () => {
    if (!process.client) return false
    const userAgent = navigator.userAgent
    return /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/Chrome/.test(userAgent)
  }
  
  // 檢查是否為 PWA 模式
  const isPWAMode = () => {
    if (!process.client) return false
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true
  }
  
  return {
    isOnline: readonly(isOnline),
    isUploading: readonly(isUploading),
    uploadQueue: readonly(uploadQueue),
    uploadCompleted: readonly(uploadCompleted),
    setupNetworkListeners,
    processUploadQueue,
    triggerUpload,
    getUploadProgress,
    clearUploadQueue,
    getUploadStats,
    isIOSSafari,
    isPWAMode
  }
} 