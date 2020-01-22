const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const url = require('url');

const { crashReporter } = require('electron');

const makeMenuTemplate = require('./make-menu-template.js');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let settingsWindow;

function createNewSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 700,
    height: 670,
    x: 0,
    y: 0,
    minWidth: 1000,
    minHeight: 670,
    titleBarStyle: 'show',
    // preload: __dirname + '/prompt.js',
    webPreferences: {
      // webSecurity: false,
      nodeIntegration: true
    }
  });

  settingsWindow.loadURL(
    url.format({
      pathname: path.join(
        app.getAppPath(),
        'src',
        'stt-settings',
        'index.html'
      ),
      protocol: 'file:',
      slashes: true
    })
  );
}

function createMainWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 670,
    minWidth: 1000,
    minHeight: 670,
    titleBarStyle: 'show',
    // preload: __dirname + '/prompt.js',
    webPreferences: {
      // webSecurity: false,
      nodeIntegration: true,
      preload: path.join(app.getAppPath(), 'src', 'prompt.js')
    }
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(
        app.getAppPath(),
        'node_modules',
        '@bbc',
        'digital-paper-edit-client',
        'index.html'
      ),
      protocol: 'file:',
      slashes: true
    })
  );

  if (process.env.NODE_ENV === 'development') {
    // Open the DevTools.
    mainWindow.webContents.once('dom-ready', () => {
      mainWindow.webContents.openDevTools();
    });
  }

  // https://github.com/electron/electron/issues/1095
  mainWindow.dataPath = app.getPath('userData');
  mainWindow.appPath = app.getAppPath();

  const template = makeMenuTemplate({
    app,
    createNewSettingsWindow,
    createMainWindow
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  // Emitted when the window is closed.
  mainWindow.on('closed', function(event) {
    event.preventDefault();
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
    settingsWindow = null;
  });

  mainWindow.webContents.on('crashed', e => {
    console.log(e);
    app.relaunch();
    // app.quit()
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createMainWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('uncaughtException', err => {
  console.error('uncaughtException', err);
});

app.on('activate', function() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createMainWindow();
  }
});

// https://electron.atom.io/docs/api/app/#event-open-file-macos
//not working ?
app.on('open-file', (event, path) => {
  console.log('open-file: ', path);
  event.preventDefault();
  // shell.openExternal(url);
});

// https://electronjs.org/docs/api/app#appsetbadgecountcount-linux-macos
// app.setBadgeCount(3)

//not working ?
app.on('open-url', (event, url) => {
  console.log('open-url: ', url);
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  event.preventDefault();
  shell.openExternal(url);
});

app.on('renderer-process-crashed', function(event, webContents, killed) {
  console.log('renderer-process-crashed', event);
  console.log('webContents', webContents);
  console.log('killed', killed);
});

app.setPath('temp', '/tmp/DPE');

crashReporter.start({
  productName: 'DPE_ELECTRON',
  companyName: 'BBC',
  submitURL: 'http://127.0.0.1:1127/post',
  uploadToServer: true
});

let promptResponse;
ipcMain.on('prompt', function(eventRet, arg) {
  promptResponse = null;
  var promptWindow = new BrowserWindow({
    width: 300,
    height: 250,
    show: false,
    resizable: true,
    movable: true,
    alwaysOnTop: true,
    frame: false,
    webPreferences: {
      nodeIntegration: true
    }
  });
  arg.val = arg.val || '';
  const promptHtml = `<label for="val"> ${ arg.title }</label>
  <textarea rows="10" cols="50" id="val" autofocus >${ arg.val }</textarea>
  <button onclick="require('electron').ipcRenderer.send('prompt-response', document.getElementById('val').value);window.close()">Ok</button>
  <button onclick="window.close()">Cancel</button>
  <style>
    body {font-family: sans-serif;} 
    button {float:right; margin-left: 10px;} 
    label,textarea {margin-bottom: 10px; width: 100%; display:block;}
    textarea {font-size: 1em;}
  </style>`;
  promptWindow.loadURL('data:text/html,' + promptHtml);
  promptWindow.show();
  promptWindow.on('closed', function() {
    eventRet.returnValue = promptResponse;
    promptWindow = null;
  });
});
ipcMain.on('prompt-response', function(event, arg) {
  if (arg === '') {
    arg = null;
  }
  promptResponse = arg;
});
