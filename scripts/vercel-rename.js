import fs from 'fs';
import path from 'path';

// Rename vercel.html to index.html after build
const distPath = path.join(process.cwd(), 'dist');
const oldPath = path.join(distPath, 'vercel.html');
const newPath = path.join(distPath, 'index.html');

try {
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log('✅ Renamed vercel.html to index.html for Vercel deployment');
  } else {
    console.error('❌ vercel.html not found in dist folder');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Failed to rename file:', error);
  process.exit(1);
}