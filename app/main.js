const {app, BrowserWindow, session, ipcMain, Menu} = require('electrino');
const path   = require('path');
const url    = require('url');
const fs     = require('fs');
const os     = require('os');
const crypto = require('crypto');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function getFunctionContents (fnBody) {
    return fnBody.toString()
        .replace(/^function[^{]+{/, '')
        .replace(/([\S\s]+)}/s, "$1");
}

const preload = fs.readFileSync ('preload.js');
const getConfiguredSites = require ('./configured-sites.js');

const preloadScript = getConfiguredSites.toString() + preload.toString();


function shellCmd () {
    const { spawn } = require('child_process');
    const ps = spawn('ps', ['ax']);

    ps.stdout.on('data', (data) => {
        grep.stdin.write(data);
    });
    
    ps.stderr.on('data', (data) => {
        console.error(`ps stderr: ${data}`);
    });

    ps.on('close', (code) => {
      if (code !== 0) {
      console.log(`ps process exited with code ${code}`);
      }
      grep.stdin.end();
      });
}

const domain = 'netflix.com';
// const domain = 'youtube.com';
const host = `https://${domain}/`;

ipcMain.on ('window-state-playing', (event, payload) => {
    // win.setWindowButtonVisibility
    console.log ('window-video-play', event, JSON.stringify(payload));
    win.setAlwaysOnTop(true);
    win.setWindowButtonVisibility(false);
});

ipcMain.on ('window-state-regular', (event, payload) => {
    // win.setWindowButtonVisibility
    console.log ('window-state-regular', event, JSON.stringify(payload));
    win.setAlwaysOnTop(false);
    win.setWindowButtonVisibility(true);
});

ipcMain.on ('window-set-aspect-ratio', (event, payload) => {
    // win.setWindowButtonVisibility
    console.log ('window-set-aspect-ratio', JSON.stringify(payload));
    // win.setAspectRatio (payload.aspectRatio);
    
});

function buildMenu () {

    const sites = getConfiguredSites();
    const videoSites = Object.keys(sites).filter (
        site => sites[site].siteMediaType === 'video'
    ).map (
        site => ({label: site, click () {win.loadURL (sites[site].baseUrl, {})}})
    );

    const audioSites = Object.keys(sites).filter (
        site => sites[site].siteMediaType === 'audio'
    ).map (
        site => ({label: site, click () {win.loadURL (sites[site].baseUrl, {})}})
    );

    // Sources, (IINA) Playback, Audio, Video, Subtitles
    const menu = Menu.buildFromTemplate([{
        role: 'appMenu',
    }, {
        role: 'editMenu',
    }, {
        role: 'viewMenu',
    }, {
        label: 'Sources',
        submenu: [
            ...videoSites,
            {type: 'separator'},
            ...audioSites
        ],
    }, {
        role: 'windowMenu',
    }]);

    return menu;
}

function createWindow () {

    app.registerServiceHandler((str) => {
        console.log ('service received something ', str);
        let urlFromService;
        try {
            // simplified url match
            const [, protocol, host, path, pathname, query] = str.match (/^(https?:)\/\/([^\/]+)((\/[^\?]*)(?:\?(.*)|$))/);
            const [hostname, port = (protocol === 'https:' ? 443 : 80)] = host.split (':');
            urlFromService = {protocol, host, hostname, port, path, pathname, query};
        } catch (err) {
            console.log ('service cannot recognise url');
            return;
        }
        
        console.log (JSON.stringify (urlFromService));
        
        const sites = getConfiguredSites();
        if (Object.keys (sites).some (
            site => sites[site].checkOnMediaPage (urlFromService)
        )) {
            win.loadURL (str, {});
        }
    });
    
    Menu.setApplicationMenu (buildMenu ());

    // Create the browser window.
    win = new BrowserWindow({
        width: 800, height: 600,
        autosaveName: "player",
        titleBarStyle: "hidden",
        webPreferences: {
            devTools: true, // devTools enabled by default, set `devTools` key to `false` to disable
            userAgentAppName: "Version/13.1.2 Safari/605.1.15",
            preload: preloadScript, // getFunctionContents(preload.toString())
        }
    });

    // win.attachContextMenu (buildMenu ());

  // and load the index.html of the app.
  /*
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
  */
    
    win.loadURL (host, {
        // httpReferrer - should work
        // userAgent - not implemented, similar property `userAgentAppName` available in BrowserWindow constructor
        // extraHeaders - should work if js object provided
        // postData - should work
        // baseURLForDataURL - data urls not implemented
    });
    
    // menus:
    // context https://github.com/microsoft/vscode/blob/9eb77263661075b5c8aeff6a97e462809bb21d9c/src/vs/base/browser/contextmenu.ts
    // https://github.com/microsoft/vscode/blob/9eb77263661075b5c8aeff6a97e462809bb21d9c/src/vs/base/browser/ui/menu/menubar.ts
    // https://github.com/microsoft/vscode/blob/9451800fe793d87cb968d5241a73e442fda774c5/src/vs/platform/menubar/electron-main/menubar.ts

  // Open the DevTools.
  // win.webContents.openDevTools()

    // test
//    win.on('page-title-updated', (evt) => {
//        evt.preventDefault();
//    });
    win.on ('dom-loaded', () => {
        // console.log ('DOM Content Loaded event caught!!!');
        
    });
    
    win.on ('did-finish-load', () => {
        // console.log ('Page load finished successfully!!!');
    });
  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

