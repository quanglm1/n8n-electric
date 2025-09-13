const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');
const unzip = require('unzipper');
const { checkFlowAndScripts } = require('./checkFlow');

// IPC: pip install package vào venv
ipcMain.handle('pip-install', async (event, packageName) => {
  const pyExe = path.join(VENV_DIR, 'Scripts', 'python.exe');
  return await new Promise((resolve, reject) => {
    const proc = spawn(pyExe, ['-m', 'pip', 'install', packageName]);
    let log = '';
    proc.stdout.on('data', (data) => { log += data.toString(); });
    proc.stderr.on('data', (data) => { log += data.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve({ log });
      else reject(new Error(log || 'pip install error'));
    });
  });
});
// --- Python embeddable/venv setup ---
const PY_EMBED_URL = 'https://www.python.org/ftp/python/3.11.8/python-3.11.8-embed-amd64.zip';
const PY_EMBED_DIR = path.join(__dirname, 'python_embeddable');
const PY_EMBED_ZIP = path.join(__dirname, 'python_embed.zip');
const VENV_DIR = path.join(__dirname, 'venv');

async function ensurePythonAndVenv() {
  // 1. Check embeddable Python (chỉ dùng để chạy nếu không cần venv)
  if (!fs.existsSync(PY_EMBED_DIR) || !fs.existsSync(path.join(PY_EMBED_DIR, 'python.exe'))) {
    console.log('Downloading Python embeddable...');
    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(PY_EMBED_ZIP);
      https.get(PY_EMBED_URL, (response) => {
        response.pipe(file);
        file.on('finish', () => file.close(resolve));
      }).on('error', reject);
    });
    await fs.createReadStream(PY_EMBED_ZIP)
      .pipe(unzip.Extract({ path: PY_EMBED_DIR }))
      .promise();
    fs.unlinkSync(PY_EMBED_ZIP);
    console.log('Python embeddable ready.');
  }

  // 2. Check for full Python install for venv
  function findFullPython() {
    const versions = ['311', '310', '39', '312', '313'];
    const candidates = [
      'python',
      'python3',
      'py',
      ...versions.map(v => `C:/Python${v}/python.exe`),
      ...versions.map(v => `C:/Program Files/Python${v}/python.exe`),
      ...versions.map(v => `C:/Program Files (x86)/Python${v}/python.exe`),
    ];
    for (const exe of candidates) {
      try {
        // Sử dụng spawnSync để chờ kết quả luôn
        const proc = require('child_process').spawnSync(exe, ['-c', 'import venv; print(1234)'], {encoding: 'utf8'});
        if (proc.stdout && proc.stdout.includes('1234')) return exe;
      } catch {}
    }
    return null;
  }

  let fullPythonExe = findFullPython();
  if (!fullPythonExe) {
    // Thông báo lỗi rõ ràng
    throw new Error('Không tìm thấy Python bản đầy đủ trên máy.\nVui lòng tải và cài đặt Python từ https://www.python.org/downloads/windows/ (chọn Windows installer, nhớ tick "Add Python to PATH"). Sau đó chạy lại ứng dụng.');
  }

  // 3. Check venv
  if (!fs.existsSync(VENV_DIR) || !fs.existsSync(path.join(VENV_DIR, 'Scripts', 'python.exe'))) {
    console.log('Creating venv...');
    try {
      await new Promise((resolve, reject) => {
        const proc = spawn(fullPythonExe, ['-m', 'venv', VENV_DIR]);
        let log = '';
        proc.stdout.on('data', (data) => { log += data.toString(); });
        proc.stderr.on('data', (data) => { log += data.toString(); });
        proc.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error('venv failed. Output:\n' + log));
        });
      });
      console.log('venv created.');
    } catch (err) {
      console.error('Failed to create venv:', err.message);
      throw err;
    }
  }
}

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



app.whenReady().then(async () => {
  await ensurePythonAndVenv();
  // Kiểm tra file config và script python
  const check = checkFlowAndScripts();
  if (!check.ok) {
    console.warn('Cảnh báo:', check.msg.join('\n'));
    // Hiển thị popup cảnh báo khi thiếu file/script
    setTimeout(() => {
      const { dialog } = require('electron');
      dialog.showErrorBox('Thiếu file cấu hình/Script', check.msg.join('\n'));
    }, 2000);
  }
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
  // Always use venv python
  const pyExe = path.join(VENV_DIR, 'Scripts', 'python.exe');
  return await new Promise((resolve, reject) => {
    const proc = spawn(pyExe, args);
    let log = '';
    proc.stdout.on('data', (data) => { log += data.toString(); });
    proc.stderr.on('data', (data) => { log += data.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve({ log });
      else reject(new Error(log || 'Script error'));
    });
  });
});
