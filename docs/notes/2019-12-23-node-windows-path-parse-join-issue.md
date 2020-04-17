# node windows path parse join issue

Some notes about troubleshooting of node and path for windows electron from issue
[bbc/digital-paper-edit-electron/issues/10](https://github.com/bbc/digital-paper-edit-electron/issues/10)

main issue is that when converting to audio, it tries write the new audio file at path destination with double `C:\C:\`.


Most likely due to issues when parsing and re-building the destination path on widows.


In `convertToAudio` the function `wavFileExtension`,

```js
/**
 * Adding an helper function to force the file extension to be `.wav`
 * this also allows the file extension in output file name/path to be optional
 * @param {string} path - path to an audio file
 */
function wavFileExtension(filePath) {
  let audioFileOutputPath = filePath;
  // https://nodejs.org/api/path.html#path_path_parse_path
  const pathParsed = path.parse(audioFileOutputPath);
  if (pathParsed.ext !== '.wav') {
    audioFileOutputPath = path.join(pathParsed.root, pathParsed.dir, `${ pathParsed.name }.wav`);
  }

  return audioFileOutputPath;
}
```

`path.parse`

>`> path.parse('/Users/userName/someFolder/file.mov')`

```js
{
  root: '/',
  dir: '/Users/userName/someFolder',
  base: 'file.mov',
  ext: '.mov',
  name: 'file'
}
```

`path.join`

```js
path.join(pathParsed.root, pathParsed.dir, `${ pathParsed.name }.wav`);
```
Adding root and dir on windows, it adds `C:\` twice.


`path.format` could be a good way to tackle this, for now trying just by removing `.root` in `path.join`.

```js
function wavFileExtension(filePath) {
  let audioFileOutputPath = filePath;
  const pathParsed = path.parse(audioFileOutputPath);
  if (pathParsed.ext !== '.wav') {
    audioFileOutputPath = path.join(pathParsed.dir, `${ pathParsed.name }.wav`);
  }

  return audioFileOutputPath;
}
```
