# Debugging Electron

[Site Point article](https://www.sitepoint.com/debugging-electron-application/)

## Renderer

Use **Chrome Debugger Tool**.

Debug the renderer process using the Chrome Debugger Tool by using the shortcut `Option + Command + I`
Apparently you can also disable this if you want by [customising your menu](https://www.christianengvall.se/electron-menu/).

## Main process

### Electron's Inspect

Use **[Electron's debug option](https://electronjs.org/docs/tutorial/debugging-main-process) by passing the `--inspect`** option, like so:

```js
electron --inspect=5858 your/app
```

### VSCode

Use [VS Code](https://electronjs.org/docs/tutorial/debugging-main-process-vscode)

Add the following to VSCode, as `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "windows": {
        "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron.cmd"
      },
      "args" : ["."],
      "outputCapture": "std"
    }
  ]
}
```

Then start adding breakpoints in your application, and run debug in VSCode.