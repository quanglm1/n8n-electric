const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

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
}

app.whenReady().then(createWindow);


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
