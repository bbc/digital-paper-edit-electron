makeMenuTemplate = ({ app, createNewSettingsWindow, createMainWindow, checkForUpdates }) => {
  const template = [
    {
      label: 'Application',
      submenu: [
        {
          label: 'About Application',
          selector: 'orderFrontStandardAboutPanel:'
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: function() {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
        { role: 'pasteandmatchstyle' },
        { role: 'delete' },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          selector: 'selectAll:'
        },
        { type: 'separator' },
        {
          label: 'Speech',
          submenu: [
            { role: 'startspeaking', accelerator: 'CmdOrCtrl+E' }, //perhaps add keyboard shortcut?
            { role: 'stopspeaking', accelerator: 'CmdOrCtrl+Shift+E' } //perhaps add keyboard shortcut?
          ]
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools', accelerator: 'CmdOrCtrl+Alt+I' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
        { type: 'separator' },
        {
          label: 'New main window',
          click() {
            createMainWindow();
          },
          accelerator: 'CmdOrCtrl+N'
        }
      ]
    },
    {
      label: 'Speech To Text Settings',
      submenu: [
        {
          label: 'Edit Speech To Text configuration',
          click() {
            createNewSettingsWindow();
          },
          accelerator: 'CmdOrCtrl+S+T'
        }
      ]
    },
    // {
    //   label: 'Search',
    //   submenu: [
    //     {
    //       label: 'Electron Search',
    //       click() {        
    //         // electronSearch();
    //       },
    //       accelerator: 'CmdOrCtrl+F'
    //     }
    //   ]
    // },
    {
      role: 'help',
      submenu: [
        {
          label: "Project Page",
          click() {
            require("electron").shell.openExternal("https://www.autoedit.io");
          }
        },
        {
          label: "User Manual",
          click() {
            require("electron").shell.openExternal(
              "https://autoedit.gitbook.io/autoedit-3-user-manual"
            );
          }
        },
        {
          label: "Advanced - Developer Console",
          click() {
            win.webContents.toggleDevTools();
          }
        }
      ]
    }
  ];

  return template;
};

module.exports = makeMenuTemplate;