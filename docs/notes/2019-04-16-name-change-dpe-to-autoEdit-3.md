# name change - dpe to autoEdit 3  
Decide to change the name of the app to `autoEdit 3`, to use the `autoEdit.io` domain, and encourage `autoEdit2` users to move onto this version of the app.

However would rather avoid introducing breaking changes for existing  `digital-paper-edit-electron` users. 
so in `package.json` the `name` of the app will remain to `digital-paper-edit-electron`. but will change the `productName`.

>`productName` String - As `name`, but allows you to specify a product name for your executable which contains spaces and other special characters not allowed in the name property.

[see electron builder docs for more details](https://www.electron.build/configuration/configuration#configuration)

in `package.json` added
```json
  "productName":"autoEdit 3",
```

and in `src/electron-main.js`, set the  `userData` manually.


`appData` on mac is `~/Library/Application Support`
while  `userData` is the folder within `appData`, which would default to `name` or `productName` in `package.json`

```js
// set userData to use `digital-paper-edit-electron` to be backward compatible before name change from `digital-paper-edit-electron` to `autoEdit 3`;

// const userDataPath = app.getPath ('userData');
const appData = app.getPath ('appData');
app.setPath ('userData', path.join(appData,"digital-paper-edit-electron"));
```

for more background info see 

- [electron docs - `app.setPath(name, path)`](https://www.electronjs.org/docs/api/app#appsetpathname-path)
- [stackoverflow- Electron: How to set a custom directory for user data (--user-data-dir)](https://stackoverflow.com/questions/48587035/electron-how-to-set-a-custom-directory-for-user-data-user-data-dir)
- [electron docs -   `app.getPath(name)`](https://github.com/electron/electron/blob/master/docs/api/app.md#appgetpathname)


## side notes
one concern is if someone downloads an electron build form `bbc/digital-paper-edit-electron` and wants to run it along side `autoEdit 3`.
They'd be using the same `userData` folder. 

However since `bbc/digital-paper-edit-electron` electron version is not being activly developed, in favour of a web version, this seems to be an edge case for now.


Another note, is that keeping the name of the github repos to `digital-paper-edit-*` to avoid renaming all of the forks, might cause confusion amongst developers who might want to contribute to the project, so might need to add a note or explanation somewhere, or even link to this now. While at the user facing level, adjsuting the name in the user manual, and with the new landing page it should be fairly straightforward. 