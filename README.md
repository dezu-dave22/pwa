# PWA 離線檔案暫存與自動上傳系統

一個支援跨平台的 Progressive Web App (PWA)，具備離線檔案暫存與自動上傳功能。

## 🚀 功能特色

- **離線檔案暫存**: 使用 IndexedDB 在瀏覽器端暫存檔案
- **自動上傳**: 網路恢復後自動批次上傳檔案
- **跨平台支援**: 支援 Android、iOS Safari、桌面 Chrome
- **檔案大小限制**: 單檔最大 200MB
- **即時狀態顯示**: 顯示上傳進度、網路狀態、儲存空間
- **PWA 支援**: 可安裝為原生應用

## 📱 平台支援

| 平台 | 支援情況 | 處理策略 |
|------|----------|----------|
| Android Chrome | ✅ 完整支援 | 使用 IndexedDB 儲存、Blob 管理 |
| 桌面 Chrome | ✅ 完整支援 | 同上 |
| iOS Safari / PWA | ⚠️ 限制多 | 顯示提示，最多儲存 10MB，鼓勵立即上傳 |
| Firefox | ✅ 支援至 2GB | 適配 IndexedDB，但不支援 Background Sync |

## 🛠️ 技術架構

- **前端框架**: Nuxt 3 (Vue 3)
- **PWA 支援**: @vite-pwa/nuxt
- **檔案儲存**: IndexedDB
- **網路監聽**: navigator.onLine API
- **檔案上傳**: Fetch API + FormData

## 📦 專案結構

```
pwa/
├── composables/
│   ├── useFileStore.ts      # 檔案儲存管理
│   └── useUploader.ts       # 上傳管理
├── components/
│   ├── FilePicker.vue       # 檔案選擇器
│   ├── FileList.vue         # 檔案清單
│   └── StorageStatus.vue    # 儲存狀態
├── pages/
│   └── index.vue            # 主頁面
├── server/
│   └── api/
│       └── upload.post.ts   # 上傳 API
├── public/                  # 靜態資源
├── nuxt.config.ts           # Nuxt 配置
└── vite.config.ts           # Vite PWA 配置
```

## 🚀 快速開始

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

### 建置生產版本

```bash
npm run build
```

### 預覽生產版本

```bash
npm run preview
```

## 🧪 測試建議

### 離線模式測試
1. 開啟 Chrome DevTools
2. 切換到 Network 標籤
3. 勾選 "Offline" 選項
4. 選擇檔案並觀察離線儲存功能

### 大檔案測試
- 測試 100-200MB 的影片檔案
- 觀察儲存空間使用情況
- 驗證檔案大小限制

### 網路恢復測試
1. 在離線模式下選擇檔案
2. 恢復網路連線
3. 觀察自動上傳功能

### iOS 實機測試
1. 在 Safari 中開啟應用
2. 安裝為 PWA
3. 測試離線儲存限制

## 🔧 配置說明

### PWA 配置
- 自動更新機制
- 離線快取策略
- 安裝提示

### 檔案限制
- 單檔最大: 200MB
- 支援格式: 圖片 (image/*)、影片 (video/*)
- 儲存空間: 依瀏覽器限制

### 上傳設定
- 重試次數: 3 次
- 自動上傳: 網路恢復後
- 批次處理: 支援多檔上傳

## 📊 監控與除錯

### 瀏覽器開發者工具
- Application > Storage > IndexedDB: 查看儲存資料
- Application > Storage > Quota: 查看儲存配額
- Network: 監控上傳請求

### 控制台日誌
- 檔案操作日誌
- 上傳狀態日誌
- 錯誤訊息

## 🔒 安全性考量

- 檔案類型驗證
- 檔案大小限制
- 本地儲存隔離
- 上傳 API 驗證

## 🚀 部署

### 靜態部署
```bash
npm run generate
```

### 伺服器部署
```bash
npm run build
npm run preview
```

## 📝 更新日誌

### v1.0.0
- 初始版本發布
- 基本離線檔案暫存功能
- 自動上傳機制
- PWA 支援

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

MIT License
