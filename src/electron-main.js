const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const url = require('url');
const path = require('path');
// set userData to use `digital-paper-edit-electron` to be backward compatible before name change from `digital-paper-edit-electron` to `autoEdit 3`;
// https://www.electronjs.org/docs/api/app#appsetpathname-path
// https://stackoverflow.com/questions/48587035/electron-how-to-set-a-custom-directory-for-user-data-user-data-dir
// https://github.com/electron/electron/blob/master/docs/api/app.md#appgetpathname
// const userDataPath = app.getPath ('userData');
const appData = app.getPath ('appData');
app.setPath ('userData', path.join(appData,"digital-paper-edit-electron"));

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
    title: "autoEdit 3 - Settings",
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
    title: "autoEdit 3",
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
        '@pietrop',
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

  // ////////////// not fully implemented
  /// https://stackoverflow.com/questions/40987229/how-do-i-search-text-in-a-single-page-reactjs-electron-application
  mainWindow.webContents.on('found-in-page', (event, result) => {
    if (result.finalUpdate) {
      mainWindow.webContents.stopFindInPage('keepSelection');
    }
    });
    ipcMain.on('search-text', (event, arg) => {
      mainWindow.webContents.findInPage(arg,{
        forward: true, 
        findNext: true,
        matchCase: false,
        wordStart: true,
        medialCapitalAsWordStart: false
      });
    });
    // //////////////

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


  //////////////////////////////////////////////////////////////////////////////////
  // create hidden worker window
  const workerWindow = new BrowserWindow({
    show: false, // TODO: unless development + add to menu to open up for inspection - could show progress 
    webPreferences: { nodeIntegration: true }
  });

  workerWindow.loadURL(
    url.format({
      pathname: path.join(
        app.getAppPath(),
        'src','worker.html'
      ),
      protocol: 'file:',
      slashes: true
    })
  );
  //////////////////////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  // receive request from render process of react client app
  // sends it to worker window render process to offload the work
  // TODO: change name, `asynchronous-message` to something better
  ipcMain.on('asynchronous-message', (event, arg) => {
    const data = JSON.parse(arg);
    workerWindow.webContents.send('transcribe', data);
  })

  // receives the 
  ipcMain.on('asynchronous-message-transcribed', (event, arg) => {
    // workerWindow.close()
    mainWindow.webContents.send('asynchronous-reply', arg);
  })
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
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
