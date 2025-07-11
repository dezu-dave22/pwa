export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '沒有檔案被上傳'
      })
    }
    
    const file = formData[0]
    
    if (!file.filename || !file.data) {
      throw createError({
        statusCode: 400,
        statusMessage: '檔案資料不完整'
      })
    }
    
    // 檢查檔案類型
    const allowedTypes = ['image/', 'video/']
    const isValidType = allowedTypes.some(type => file.type?.startsWith(type))
    
    if (!isValidType) {
      throw createError({
        statusCode: 400,
        statusMessage: '不支援的檔案類型'
      })
    }
    
    // 檢查檔案大小 (200MB)
    const maxSize = 200 * 1024 * 1024
    if (file.data.length > maxSize) {
      throw createError({
        statusCode: 400,
        statusMessage: '檔案大小超過限制'
      })
    }
    
    // 這裡可以將檔案儲存到實際的儲存系統
    // 例如：雲端儲存、本地檔案系統等
    // 目前只是模擬成功上傳
    
    console.log(`檔案上傳成功: ${file.filename} (${file.data.length} bytes)`)
    
    return {
      success: true,
      message: '檔案上傳成功',
      filename: file.filename,
      size: file.data.length,
      type: file.type
    }
    
  } catch (error: any) {
    console.error('檔案上傳錯誤:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '檔案上傳失敗'
    })
  }
}) 