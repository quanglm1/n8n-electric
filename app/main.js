
const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

ipcMain.handle('save-flow-config', async (event, data) => {
  const configPath = path.join(__dirname, '../config/flow_config.json');
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
  return true;
});

let n8nProcess = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  win.loadFile('index.html');
  // Khi user mở màn hình cấu hình, có thể mở n8n editor UI
  ipcMain.handle('open-n8n-editor', async () => {
    // Đợi n8n server sẵn sàng (tối đa 15s)
    const waitForN8n = async (timeout = 15000) => {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        try {
          const res = await fetch('http://localhost:5678/healthz');
          if (res.ok) return true;
        } catch {}
        await new Promise(r => setTimeout(r, 500));
      }
      return false;
    };
    const ok = await waitForN8n();
    const editorWin = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: { nodeIntegration: false }
    });
    if (ok) {
      editorWin.loadURL('http://localhost:5678');
    } else {
      editorWin.loadURL('data:text/html,<h2>Không thể kết nối n8n server!</h2><p>Vui lòng thử lại sau.</p>');
    }
  });
}


// Tự động chạy n8n khi app start (không cần Docker)

app.whenReady().then(() => {
  // Chạy n8n local từ node_modules trong thư mục app
  const n8nBin = path.join(__dirname, './node_modules/.bin/n8n');
  n8nProcess = spawn(n8nBin, [], { stdio: 'ignore', detached: true });
  createWindow();
});

app.on('will-quit', () => {
  if (n8nProcess) {
    try { process.kill(-n8nProcess.pid); } catch {}
  }
});

ipcMain.handle('run-script', async (event, step, inputFile) => {
  let script, args;
  if (step === 1) {
    script = path.join(__dirname, '../python_scripts/script1.py');
    args = [script, inputFile, 'output1.xlsx'];
  } else if (step === 2) {
    script = path.join(__dirname, '../python_scripts/script2.py');
    args = [script, inputFile, 'output2.xlsx'];
  } else {
    throw new Error('Invalid step');
  }
  return await new Promise((resolve, reject) => {
    const proc = spawn('python3', args);
    let log = '';
    proc.stdout.on('data', (data) => { log += data.toString(); });
    proc.stderr.on('data', (data) => { log += data.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve({ log });
      else reject(new Error(log || 'Script error'));
    });
  });
});
