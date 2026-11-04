const {contextBridge, ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld('anynote', Object.freeze({
 copy: value => ipcRenderer.invoke('clipboard:copy',value)
}));
