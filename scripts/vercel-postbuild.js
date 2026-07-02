import fs from 'fs';
import path from 'path';

// Create index.html in the output directory after build
const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>InfyTimeTrack - Office Hours Tracker</title>

    <!-- PWA Meta Tags -->
    <meta name="description" content="Track your office hours and work-from-home days with ease">
    <meta name="theme-color" content="#5b5fcf">
    <link rel="manifest" href="/manifest.json">

    <!-- iOS Support -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="InfyTrack">
    <link rel="apple-touch-icon" href="/logoforIT.png">

    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/logoforIT.ico">
    <link rel="shortcut icon" href="/logoforIT.ico">
    <link rel="alternate icon" type="image/png" href="/logoforIT.png">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <link rel="stylesheet" href="/assets/styles-D9BcwLvc.css">
    <script type="module" src="/assets/index-CzA-yw8l.js"></script>
    <script>
      // Register service worker for PWA functionality
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('ServiceWorker registered'))
            .catch(err => console.log('ServiceWorker registration failed'));
        });
      }
    </script>
  </body>
</html>`;

const outputPath = path.join(process.cwd(), '.output', 'public', 'index.html');

try {
  fs.writeFileSync(outputPath, indexHtml);
  console.log('✅ Created index.html for Vercel deployment');
} catch (error) {
  console.error('❌ Failed to create index.html:', error);
  process.exit(1);
}