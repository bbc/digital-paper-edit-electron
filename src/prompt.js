const ipcRenderer = require('electron').ipcRenderer;
console.log('prompt.js');
window.prompt = function(title, val) {
  return ipcRenderer.sendSync('prompt', { title, val });
};