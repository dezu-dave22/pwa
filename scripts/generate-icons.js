import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 創建一個簡單的 SVG 圖示
const createSVGIcon = (size) => {
  const padding = size * 0.1;
  const iconSize = size - (padding * 2);
  const center = size / 2;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="#4f46e5" rx="${size * 0.2}"/>
  <g transform="translate(${center}, ${center})">
    <path d="M-${iconSize * 0.3} -${iconSize * 0.3} L${iconSize * 0.1} -${iconSize * 0.1} L${iconSize * 0.3} -${iconSize * 0.3} L${iconSize * 0.1} ${iconSize * 0.1} L${iconSize * 0.3} ${iconSize * 0.3} L-${iconSize * 0.1} ${iconSize * 0.1} L-${iconSize * 0.3} ${iconSize * 0.3} L-${iconSize * 0.1} -${iconSize * 0.1} Z" fill="white"/>
  </g>
</svg>`;
};

// 確保 public 目錄存在
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 生成圖示檔案
const icons = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'apple-touch-icon-152x152.png', size: 152 },
  { name: 'apple-touch-icon-167x167.png', size: 167 },
  { name: 'apple-touch-icon-180x180.png', size: 180 }
];

icons.forEach(icon => {
  const svg = createSVGIcon(icon.size);
  const filePath = path.join(publicDir, icon.name);
  
  // 對於 PNG 檔案，我們暫時保存為 SVG（實際專案中需要轉換）
  if (icon.name.endsWith('.png')) {
    // 創建一個簡單的 SVG 檔案作為佔位符
    fs.writeFileSync(filePath.replace('.png', '.svg'), svg);
    console.log(`Created ${icon.name.replace('.png', '.svg')}`);
  } else {
    fs.writeFileSync(filePath, svg);
    console.log(`Created ${icon.name}`);
  }
});

console.log('Icon generation completed!');
console.log('Note: For production, you should convert SVG to PNG using tools like ImageMagick or online converters.'); 