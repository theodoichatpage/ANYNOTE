const { app, BrowserWindow, session, ipcMain, clipboard } = require('electron');
const path = require('node:path');
ipcMain.handle('clipboard:copy', (event, value) => {
 if (event.senderFrame !== event.sender.mainFrame || typeof value !== 'string' || value.length > 100000) throw new Error('Invalid clipboard request');
 clipboard.writeText(value);
 setTimeout(() => { if (clipboard.readText() === value) clipboard.clear(); }, 30000);
});
app.whenReady().then(() => {
 session.defaultSession.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
 const win = new BrowserWindow({width:1440,height:900,minWidth:900,minHeight:600,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,preload:path.join(__dirname,'preload.cjs')}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 win.webContents.on('will-navigate',event=>event.preventDefault());
 win.loadFile(path.join(__dirname,'../dist/index.html'));
});
app.on('window-all-closed',()=>app.quit());
