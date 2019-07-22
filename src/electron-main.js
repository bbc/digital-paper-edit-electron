const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const url = require('url');
const { autoUpdater } = require('electron-updater');

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
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true
    }
  });

  settingsWindow.loadURL(
    url.format({
      pathname: path.join(app.getAppPath(), 'src/stt-settings/index.html'),
      protocol: 'file:',
      slashes: true
    })
  );
}

function createMainWindow() {

  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.checkForUpdatesAndNotify();
  }

  createAutoUpdateNotificationWindow();

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 670,
    minWidth: 1000,
    minHeight: 670,
    titleBarStyle: 'show',
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true
    }
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(app.getAppPath(), 'build/index.html'),
      // TODO: need to update client to `ui-tweak` branch first, and republish npm before swapping this line for the one above
      // pathname: path.join(app.getAppPath(), 'node_modules/@bbc/digital-paper-edit-client/index.html'),
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

// https://github.com/iffy/electron-updater-example/blob/master/main.js
let autoUpdateNotificationWindow;
function sendStatusToWindow(text) {
  log.info(text);
  autoUpdateNotificationWindow.webContents.send('message', text);
}

function createAutoUpdateNotificationWindow() {
  autoUpdateNotificationWindow = new BrowserWindow();
  // autoUpdateNotificationWindow.webContents.openDevTools();
  autoUpdateNotificationWindow.on('closed', () => {
    autoUpdateNotificationWindow = null;
  });
  autoUpdateNotificationWindow.loadURL(`file://${ __dirname }/version.html#v${ app.getVersion() }`);

  return autoUpdateNotificationWindow;
}

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
});
autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Update available.');
});
autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Update not available.');
});
autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater. ' + err);
});
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')';
  sendStatusToWindow(log_message);
});
autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Update downloaded');
});