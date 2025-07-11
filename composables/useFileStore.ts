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

export const useFileStore = () => {
  const dbName = 'PWAFileStore'
  const storeName = 'files'
  const maxFileSize = 200 * 1024 * 1024 // 200MB
  const maxStorageSize = 2 * 1024 * 1024 * 1024 // 2GB
  
  let db: IDBDatabase | null = null
  
  // 生成 UUID 的兼容函數
  const generateUUID = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    
    // 降級方案：使用 Math.random() 生成 UUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
  
  // 初始化資料庫
  const initDB = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' })
          store.createIndex('uploaded', 'uploaded', { unique: false })
          store.createIndex('createdAt', 'createdAt', { unique: false })
        }
      }
    })
  }
  
  // 檢查檔案大小限制
  const checkFileSize = (file: File): boolean => {
    return file.size <= maxFileSize
  }
  
  // 檢查儲存空間
  const checkStorageQuota = async (): Promise<{ usage: number; quota: number; available: number }> => {
    if (!process.client) {
      return { usage: 0, quota: 0, available: 0 }
    }
    
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        available: (estimate.quota || 0) - (estimate.usage || 0)
      }
    }
    return { usage: 0, quota: 0, available: 0 }
  }
  
  // 新增檔案
  const addFile = async (file: File): Promise<StoredFile> => {
    if (!checkFileSize(file)) {
      throw new Error(`檔案大小超過限制 (${maxFileSize / 1024 / 1024}MB)`)
    }
    
    if (!db) await initDB()
    
    const storedFile: StoredFile = {
      id: generateUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      blob: file,
      createdAt: Date.now(),
      uploaded: false,
      uploadAttempts: 0
    }
    
    return new Promise((resolve, reject) => {
      const transaction = db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.add(storedFile)
      
      request.onsuccess = () => resolve(storedFile)
      request.onerror = () => reject(request.error)
    })
  }
  
  // 取得所有檔案
  const getAllFiles = async (): Promise<StoredFile[]> => {
    if (!db) await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()
      
      request.onsuccess = () => {
        console.log('取得所有檔案:', request.result.length, '個')
        request.result.forEach(file => {
          console.log(`- ${file.name} (${file.id}) uploaded: ${file.uploaded}`)
        })
        resolve(request.result)
      }
      request.onerror = () => reject(request.error)
    })
  }
  
  // 取得未上傳的檔案
  const getPendingFiles = async (): Promise<StoredFile[]> => {
    if (!db) await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()
      
      request.onsuccess = () => {
        const allFiles = request.result
        const pendingFiles = allFiles.filter(file => !file.uploaded)
        console.log(`取得待上傳檔案: ${pendingFiles.length} 個`)
        pendingFiles.forEach(file => {
          console.log(`- ${file.name} (${file.id}) uploaded: ${file.uploaded}`)
        })
        resolve(pendingFiles)
      }
      request.onerror = () => {
        console.error('取得待上傳檔案失敗:', request.error)
        reject(request.error)
      }
    })
  }
  
  // 標記檔案為已上傳
  const markAsUploaded = async (fileId: string): Promise<void> => {
    if (!db) await initDB()
    
    return new Promise((resolve, reject) => {
      console.log(`開始標記檔案 ${fileId} 為已上傳...`)
      
      const transaction = db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const getRequest = store.get(fileId)
      
      getRequest.onsuccess = () => {
        const file = getRequest.result
        if (file) {
          console.log(`找到檔案 ${file.name} (${fileId})，當前狀態 uploaded: ${file.uploaded}`)
          file.uploaded = true
          console.log(`設定檔案 ${file.name} uploaded: true`)
          
          const putRequest = store.put(file)
          putRequest.onsuccess = () => {
            console.log(`檔案 ${file.name} 狀態已成功更新到資料庫`)
            resolve()
          }
          putRequest.onerror = () => {
            console.error('更新檔案狀態失敗:', putRequest.error)
            reject(putRequest.error)
          }
        } else {
          console.error(`檔案不存在: ${fileId}`)
          reject(new Error('檔案不存在'))
        }
      }
      getRequest.onerror = () => {
        console.error('取得檔案失敗:', getRequest.error)
        reject(getRequest.error)
      }
    })
  }
  
  // 增加上傳嘗試次數
  const incrementUploadAttempts = async (fileId: string): Promise<void> => {
    if (!db) await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const getRequest = store.get(fileId)
      
      getRequest.onsuccess = () => {
        const file = getRequest.result
        if (file) {
          file.uploadAttempts += 1
          const putRequest = store.put(file)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          reject(new Error('檔案不存在'))
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }
  
  // 刪除檔案
  const deleteFile = async (fileId: string): Promise<void> => {
    if (!db) await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(fileId)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
  
  // 清除已上傳的檔案
  const clearUploadedFiles = async (): Promise<void> => {
    if (!db) await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const index = store.index('uploaded')
      const request = index.openCursor(IDBKeyRange.only(true))
      
      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
  }
  
  // 取得儲存統計
  const getStorageStats = async () => {
    const files = await getAllFiles()
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    const pendingCount = files.filter(f => !f.uploaded).length
    const uploadedCount = files.filter(f => f.uploaded).length
    
    return {
      totalFiles: files.length,
      totalSize,
      pendingCount,
      uploadedCount
    }
  }
  
  return {
    addFile,
    getAllFiles,
    getPendingFiles,
    markAsUploaded,
    incrementUploadAttempts,
    deleteFile,
    clearUploadedFiles,
    getStorageStats,
    checkStorageQuota,
    checkFileSize,
    maxFileSize,
    maxStorageSize
  }
} 