# notes on refactoring `remote` module out of electron app

- [Electron 8.0.0](https://www.electronjs.org/blog/electron-8-0)
- [Use V8 and Chromium Features in Electron](https://www.electronjs.org/blog/latest-v8-chromium-features)
- [Deprecation of remote Module (Starting in Electron 9)](https://www.electronjs.org/blog/electron-8-0#deprecation-of-remote-module-starting-in-electron-9)
- [electron docs - remote](https://www.electronjs.org/docs/api/remote)
- [`#21408` "Deprecate the 'remote' module and move it to userland"](https://github.com/electron/electron/issues/21408)
- [Electron’s ‘remote’ module considered harmful](https://medium.com/@nornagon/electrons-remote-module-considered-harmful-70d69500f31#d978)
- Talk [Jeremy Apthorp: Remote Module Considered Harmful [CovalenceConf 2020]](https://youtu.be/0lb7AxaucZI)

Below some of the ways in which remote is used across this electron app

### in DPE client

connect to electron wrapper

```js
if (window.process && window.process.versions.electron) {
  // Electron Wrapper needs to be on the electron render process
  // if not, if instead it's added via the main process the app will hang
  // at the moment this works, in production.
  // eg do react build, move the build folder in digital-paper-edit-electron repo
  // and when you start npm run start:prod the app will work
  // however it means that in development npm start:dev in digital-paper-edit-electron won't work.
  // because in development the electron-main.js looks for the app served by webpack,
  // in development the path below to load src/ElectronWrapper/index.js doesn't resolve as they are in two different repos
  const { app } = require('electron').remote;
  const appPath = app.getAppPath();
  const path = require('path');
  // changing path to simplify being able to load electron wrapper from this index.html file,
  // which will be deep in node_modules
  window.process.chdir(appPath);
  const ElectronWrapper = require(path.join(appPath, 'src', 'ElectronWrapper', 'index.js'));
  window.ElectronWrapper = ElectronWrapper;
}

if (window.process && window.process.versions.cep) {
  try {
    console.log('__dirname', __dirname);
    console.log('process.cwd()', process.cwd());
    /////////////////////////
    console.log('  process.chdir(__dirname);');
    process.chdir(__dirname);
    /////////////////////////
    console.log('__dirname', __dirname);
    console.log('process.cwd()', process.cwd());

    const path = require('path');
    const AdobeCEPWrapper = require(path.join(__dirname, 'src', 'AdobeCEPWrapper', 'index.js'));
    window.AdobeCEPWrapper = AdobeCEPWrapper;
  } catch (err) {
    console.log('chdir: ' + err);
  }
}
```

### app path

x2

```js
const { app } = require('electron').remote;
app.getAppPath();
```

### dialog

```js
const { app, dialog } = require('electron').remote;

 dialog.showOpenDialog( {
```

### userData folder

x4

```js
const appUserDataPath = electron.remote.app.getPath('userData');
```

### app version

x2

```js
const { app } = require('electron').remote;
const appVersion = app.getVersion();
```

---

```js
// Main
global.api = {
  loadFile(path, cb) {
    if (!pathIsOK(path)) return cb('forbidden', null);
    fs.readFile(path, cb);
  },
};
// Renderer
const api = remote.getGlobal('api');
api.loadFile('/path/to/file', (err, data) => {
  // ... do something with data ...
});
```

```js
// Main
ipcMain.handle('read-file', async (event, path) => {
  if (!pathIsOK(path)) throw new Error('forbidden');
  const buf = await fs.promises.readFile(path);
  return buf;
});
// Renderer
const data = await ipcRenderer.invoke('read-file', '/path/to/file') // ... do something with data ...
``;
```

---

in main process

```js
// receives the
ipcMain.on('asynchronous-message-transcribed', (event, arg) => {
  // workerWindow.close()
  mainWindow.webContents.send('asynchronous-reply', arg);
});
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
ipcMain.on('synchronous-message-get-app-path', (event, arg) => {
  event.returnValue = app.getAppPath();
});

ipcMain.on('synchronous-message-get-user-data-folder', (event, arg) => {
  event.returnValue = app.getPath('userData');
});

ipcMain.on('synchronous-message-get-app-version', (event, arg) => {
  event.returnValue = app.getVersion();
});
```

in render process

```js
const appPath = ipcRenderer.sendSync('synchronous-message-get-app-path', 'ping');
```

```js
const userData = ipcRenderer.sendSync('synchronous-message-get-user-data-folder', 'ping');
```

```js
const appVersion = ipcRenderer.sendSync('synchronous-message-get-app-version', 'ping');
```

---

## client after refactoring

```diff
-const { app } = require('electron').remote;
-const appPath = app.getAppPath();
+const { ipcRenderer } = require('electron');
+const appPath = ipcRenderer.sendSync('synchronous-message-get-app-path', 'ping');
```

in contaxt

```html
<script type="text/javascript">
  if (window.process && window.process.versions.electron) {
    // Electron Wrapper needs to be on the electron render process
    // if not, if instead it's added via the main process the app will hang
    // at the moment this works, in production.
    // eg do react build, move the build folder in digital-paper-edit-electron repo
    // and when you start npm run start:prod the app will work
    // however it means that in development npm start:dev in digital-paper-edit-electron won't work.
    // because in development the electron-main.js looks for the app served by webpack,
    // in development the path below to load src/ElectronWrapper/index.js doesn't resolve as they are in two different repos
    const { ipcRenderer } = require('electron');
    const appPath = ipcRenderer.sendSync('synchronous-message-get-app-path', 'ping');
    const path = require('path');

    // changing path to simplify being able to load electron wrapper from this index.html file,
    // which will be deep in node_modules
    window.process.chdir(appPath);
    const ElectronWrapper = require(path.join(appPath, 'src', 'ElectronWrapper', 'index.js'));
    window.ElectronWrapper = ElectronWrapper;
  }

  if (window.process && window.process.versions.cep) {
    try {
      console.log('__dirname', __dirname);
      console.log('process.cwd()', process.cwd());
      /////////////////////////
      console.log('  process.chdir(__dirname);');
      process.chdir(__dirname);
      /////////////////////////
      console.log('__dirname', __dirname);
      console.log('process.cwd()', process.cwd());

      const path = require('path');
      const AdobeCEPWrapper = require(path.join(__dirname, 'src', 'AdobeCEPWrapper', 'index.js'));
      window.AdobeCEPWrapper = AdobeCEPWrapper;
    } catch (err) {
      console.log('chdir: ' + err);
    }
  }
</script>
```
