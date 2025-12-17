const { app, BrowserWindow } = require('electron');
const path = require('path');

// Development yoki Production ekanligini aniqlash
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#050505',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true, // Menyuni yashirish
  });

  if (isDev) {
    // Agar development bo'lsa, Vite serveriga ulanish
    win.loadURL('http://localhost:5173');
    // win.webContents.openDevTools(); // Xatolarni ko'rish uchun (kerak bo'lsa yoqing)
  } else {
    // Tayyor dastur bo'lsa, build fayllarni ochish
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});