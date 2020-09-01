const {
    app, BrowserWindow, session, ipcMain, Menu, shell, screen, systemPreferences: sp
} = require ('electron');

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

// const domain = 'netflix.com';
const domain = 'youtube.com';
const host = sp.getUserDefault ("lastVisitedUrl") || `https://${domain}/`;

ipcMain.on ('window-state-playing', (event, payload) => {
    // win.setWindowButtonVisibility
    // console.log ('window-video-play', event, JSON.stringify(payload));
    win.setAlwaysOnTop(true);
    win.setWindowButtonVisibility(false);
});

ipcMain.on ('window-state-regular', (event, payload) => {
    // win.setWindowButtonVisibility
    // console.log ('window-state-regular', event, JSON.stringify(payload));
    win.setAlwaysOnTop(false);
    win.setWindowButtonVisibility(true);
});

ipcMain.on ('window-set-aspect-ratio', (event, payload) => {
    // win.setWindowButtonVisibility
    // console.log ('window-set-aspect-ratio', JSON.stringify(payload));
    // win.setAspectRatio (payload.aspectRatio);
    resizeWindow(payload[0]);
});

function resizeWindow (constraint) {
    const winBounds = win.getBounds();
    const displayProps = screen.getDisplayMatching (winBounds);
    const displayBounds = displayProps.bounds;
    
    // TODO: make it beatiful: align to edges, proportions
    const override = {};
    if ('width' in constraint) {
        override.width = Math.ceil(displayBounds.width * constraint.width);
        if (Math.abs (winBounds.x - displayBounds.x) > Math.abs ((winBounds.x + winBounds.width) - (displayBounds.x + displayBounds.width))
        ) {
            override.x = winBounds.x - (override.width - winBounds.width);
        }
        // console.log ("old width %@, old x %@, new width %@, new x %@", winBounds.width, winBounds.x, override.width, override.x);
    }
    if ('aspectRatio' in constraint && !isNaN (constraint.aspectRatio)) {
        override.height = Math.ceil (winBounds.width / constraint.aspectRatio);
        console.log (JSON.stringify (winBounds));
        // top half of the screen
        if (Math.abs (winBounds.y - displayBounds.y) > Math.abs ((winBounds.y + winBounds.height) - (displayBounds.y + displayBounds.height))) {
            
            override.y = winBounds.y - (override.height - winBounds.height);
        }
        console.log (`old height ${winBounds.height}, new height ${override.height}`);
    }
    
    win.setBounds({
        ...winBounds,
        ...override
    }, true);
    
    return {winBounds, override};
}

function buildMenu () {

    const sites = getConfiguredSites();
    const videoSites = Object.keys(sites).filter (
        site => sites[site].siteMediaType === 'video'
    ).map (
        site => ({label: site, click () {navigateTo (win, sites[site].baseUrl, {})}})
    );

    const audioSites = Object.keys(sites).filter (
        site => sites[site].siteMediaType === 'audio'
    ).map (
        site => ({label: site, click () {navigateTo (win, sites[site].baseUrl, {})}})
    );

    /** @type {Array} */
    const playbackSubmenu = [{
        label: 'Video speed',
        submenu: [{
            label: '0.5x',
            click () {
                win.webContents.evaluateJavaScript('var _ena_v = document.getElementsByTagName ("video"); if (_ena_v && _ena_v.length) _ena_v[0].playbackRate = 0.5');
            }
        }, {
            label: '1x',
            click () {
                win.webContents.evaluateJavaScript('var _ena_v = document.getElementsByTagName ("video"); if (_ena_v && _ena_v.length) _ena_v[0].playbackRate = 1');
            }
        }, {
            label: '2x',
            click () {
                win.webContents.evaluateJavaScript('var _ena_v = document.getElementsByTagName ("video"); if (_ena_v && _ena_v.length) _ena_v[0].playbackRate = 2');
            }
        }],    
    }];

    if (!sp.isTrustedAccessibilityClient()) {
        playbackSubmenu.push ({
            label: 'Permit ◀︎◀︎ / ▶︎▶︎ buttons',
            click () {
                shell.openExternal ('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility');
            }
        
        });
    }

    // Sources, (IINA) Playback, Audio, Video, Subtitles
    const menu = Menu.buildFromTemplate([{
        role: 'appMenu',
    }, {
        role: 'editMenu',
    }, {
        label: 'View',
        submenu: [
            {
                label: "Third of screen",
                accelerator: "Cmd+3",
                click: resizeWindow.bind (this, {width: 1/3})
            },
            {
                label: "Quarter of screen",
                accelerator: "Cmd+4",
                click: resizeWindow.bind (this, {width: 1/4})
            },
            { type: "separator" },
            { role: "reload" },
            { role: "toggleDevTools" },
            { type: "separator" },
        ]
    }, {
        label: 'Navigation',
        submenu: [
            ...videoSites,
            {type: 'separator'},
            ...audioSites,
            {type: 'separator'},
            {
                label: "Open current url in browser",
                click () {
                    win.webContents.evaluateJavaScript('window.location.toString()').then (currentUrl => shell.openExternal (currentUrl));
                }
            
            }
        ],
    }, {
        label: 'Playback',
        submenu: playbackSubmenu,
    }, {
        role: 'windowMenu',
    }]);

    return menu;
}

function navigateTo (win, url, options) {
    sp.setUserDefault ("lastVisitedUrl", url);
    win.loadURL (url, options);
}

function createWindow () {

    // Create the browser window.
    win = new BrowserWindow({
        width: 800, height: 600,
        autosaveName: "player",
        titleBarStyle: "hidden",
        splashscreen: "images/splash.pdf",
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
    
    navigateTo (win, host, {
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
    // win.on('page-title-updated', (evt) => {
    //     evt.preventDefault();
    // });
    win.on ('dom-loaded', () => {
        // console.log ('DOM Content Loaded event caught!!!');
        
    });
    
    win.on ('did-finish-load', () => {
        // console.log ('Page load finished successfully!!!');
        setTimeout (() => {
            console.log ('2 sec timeout');
        }, 2000);
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
app.on('ready', () => {

    console.log ('READY');
    
    app.registerServiceHandler && app.registerServiceHandler((str) => {
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
        
        // console.log (JSON.stringify (urlFromService));
        
        const sites = getConfiguredSites();
        if (Object.keys (sites).some (
            site => sites[site].checkOnMediaPage (urlFromService)
        )) {
            navigateTo (win, str, {});
        }
    });
    
    Menu.setApplicationMenu (buildMenu ());
    
    app.onMacOSNotification && app.onMacOSNotification ('MediaKeyNextNotification', () => {
        console.log ('NEXT KEY!');
        // electron way:
        // https://github.com/RogerTheRabbit/kTube-Desktop-App/blob/13197fd1eefe596be53f959ed8eb26347c50d5a8/client/main.js
        // // Register a 'MediaNextTrack' shortcut listener.
        // const MediaNextTrack = globalShortcut.register("MediaNextTrack", () => {
        //  win.webContents.send("MediaNextTrack", "MediaNextTrack");
        // });
        // TODO: create proper KeyEvent
        // MRMediaRemoteCommandSkipForward
        //
        if (win) {
            // win.webContents.evaluateJavaScript('document.dispatchEvent(new Event("MediaNextTrack"))');
            win.webContents.evaluateJavaScript('navigator.mediaSession.actions && navigator.mediaSession.actions.nexttrack()');
        }
    });
    
    app.onMacOSNotification && app.onMacOSNotification ('MediaKeyPreviousNotification', () => {
        console.log ('PREVIOUS KEY!');
        if (win) {
            win.webContents.evaluateJavaScript('navigator.mediaSession.actions && navigator.mediaSession.actions.previoustrack()');
        }
    });
    
    createWindow();
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});

