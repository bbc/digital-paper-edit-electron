const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const url = require('url');
const { autoUpdater } = require('electron-updater');

const updater = {};
autoUpdater.autoDownload = false;
autoUpdater.updateConfigPath = path.join(app.getAppPath(), 'src', 'dev-app-update.yml');

autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'bbc',
  repo: 'digital-paper-edit-electron'
});

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
      pathname: path.join(app.getAppPath(), 'src', 'stt-settings', 'index.html'),
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
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true
    }
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(app.getAppPath(), 'build', 'index.html'),
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
    createMainWindow,
    checkForUpdates
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

autoUpdater.on('error', (error) => {
  dialog.showErrorBox('Error: ', error == null ? 'unknown' : (error.stack || error).toString());
});

autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Found Updates',
    message: 'Found updates, do you want update now?',
    buttons: [ 'Sure', 'No' ]
  }, (buttonIndex) => {
    if (buttonIndex === 0) {
      autoUpdater.downloadUpdate();
    }
    else {
      // updater.enabled = true;
      // updater = null;
    }
  });
});

autoUpdater.on('update-not-available', () => {
  dialog.showMessageBox({
    title: 'No Updates',
    message: 'Current version is up-to-date.'
  });
  // updater.enabled = true;
  // updater = null;
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    title: 'Install Updates',
    message: 'Updates downloaded, application will be quit for update...'
  }, () => {
    setImmediate(() => autoUpdater.quitAndInstall());
  });
});

// export this to MenuItem click callback
function checkForUpdates (menuItem, focusedWindow, event) {
  // updater = menuItem;
  // updater.enabled = false;
  autoUpdater.checkForUpdates();
}