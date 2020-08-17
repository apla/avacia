
window.addEventListener ('contextmenu', (evt) => {
    console.log (evt);
    window.webkit.messageHandlers.$contextmenu.postMessage ('contextmenu');
});

const sites = getConfiguredSites();
let currentSite;

var havePlayingVideo = false;

// this is a live collection - when the node is added the [0] element will be defined
const videoTags = document.getElementsByTagName('video');
const audioTags = document.getElementsByTagName('audio');
let oldVideoEl;
let oldVideoSrc;
let oldAudioEl;
let oldAudioSrc;

const mo = new MutationObserver(() => {
    const videoEl = videoTags[0];
    const audioEl = audioTags[0];
    
    const currentSites = Object.keys(sites).filter(
        site => sites[site].checkOnMediaPage && sites[site].checkOnMediaPage()
    );

    if (currentSites.length) {
        if (currentSites.length > 1) {
            console.log (`multiple sites matches ${window.location}, using first one from ${currentSites.join(', ')}`);
        }

        const currentSiteConfig = sites[currentSites[0]];
        
        if (audioEl) {
            if ((oldAudioEl !== audioEl)) {
                oldAudioEl = audioEl;
                oldAudioSrc = audioEl.src;
            }
        } else if (videoEl) {
            if ((oldVideoEl !== videoEl)) {
                oldVideoEl = videoEl;
                oldVideoSrc = videoEl.src;
                addMediaListeners(currentSiteConfig, videoEl);
            }
        } else {
            oldVideoEl = undefined;
            oldAudioEl = undefined;
            setRegularWindowState('no-media-el');
        }
    } else {
        if (havePlayingVideo) {
            setRegularWindowState ('location-change');
        }
    }
});        
        
if (window.top === window) {

    // only observe top frame pages
    mo.observe(document, {subtree: true, childList: true});

    var headWaiting = setInterval (() => {
        if (!document || !document.head) return;
        clearInterval (headWaiting);
        
        const styleOverride = document.createElement ('style');

        const injectCss = Object.keys (sites).reduce ((injectCss, site, siteIdx) => {

            injectCss += (sites[site].getInjectCss && sites[site].getInjectCss()) || '';

            return injectCss;
        }, '');

        styleOverride.textContent = injectCss;
        document.head.appendChild (styleOverride);
        
    }, 100);

}
    
function setRegularWindowState (why) {
    havePlayingVideo = false;
    window.webkit.messageHandlers.$ipc.postMessage ({
        channel: 'window-state-regular',
        payload: {why}
    });
}

function addMediaListeners (currentSiteConfig, mediaEl) {

    const isVideoOnTop = currentSiteConfig.isVideoOnTop;

    if (mediaEl.duration) {
        setMediaMetadata.call(this, currentSiteConfig, {target: mediaEl});

        if (!mediaEl.paused) {
            havePlayingVideo = true;
            console.log ('video playing');
            if (isVideoOnTop) window.webkit.messageHandlers.$ipc.postMessage ({
                channel: 'window-state-playing',
                // payload: {a: 2, b: 3}
            });
        }
    } else {
        mediaEl.addEventListener ('loadedmetadata', setMediaMetadata.bind (this, currentSiteConfig));
        // TODO: proper handler
        window.addEventListener ('resize', setMediaMetadata.bind (this, currentSiteConfig));
    }
    
    mediaEl.addEventListener ('play', () => {
        console.log ('video playing');
        havePlayingVideo = true;
        document.documentElement.classList.add ('video-playing');
        if (isVideoOnTop) window.webkit.messageHandlers.$ipc.postMessage ({
            channel: 'window-state-playing',
            // payload: {a: 2, b: 3}
        });
    });
    
    mediaEl.addEventListener ('pause', mediaNotPlaying);
    mediaEl.addEventListener ('ended', mediaNotPlaying);

    mediaEl.addEventListener ('emptied', mediaNotPlaying);

    mediaEl.addEventListener ('abort', mediaNotPlaying);
    mediaEl.addEventListener ('error', mediaNotPlaying);
    mediaEl.addEventListener ('emptied', mediaNotPlaying);

}

function setMediaMetadata (currentSiteConfig, {target: mediaEl}) {

    if (!mediaEl || !(mediaEl instanceof HTMLMediaElement)) {
        mediaEl = document.querySelector('video');
    }

    // TODO: https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API
    // not yet supported as of safari 13
    // currently only title supported
    // https://github.com/WebKit/webkit/blob/master/Source/WebCore/html/HTMLMediaElement.cpp#L771
    let mediaInfo;
    try {
        // TODO: music.youtube video contains play count and like count in place of album and year
        mediaInfo = currentSiteConfig.getMediaInfo();
        if (mediaInfo && mediaInfo.title) {
            mediaEl.title = mediaInfo.title + (mediaInfo.artist ? ' • ' + mediaInfo.artist : '');
        }
    } catch (err) {
    }

    // sending metadata won't work
    // webview sending nowplaying itself via
    // https://github.com/WebKit/webkit/blob/master/Source/WebCore/platform/audio/PlatformMediaSession.cpp
    // https://github.com/WebKit/webkit/blob/950143da027e80924b4bb86defa8a3f21fd3fb1e/Source/WebCore/platform/audio/cocoa/MediaSessionManagerCocoa.mm#L256
    if (mediaInfo) {
        console.log (mediaInfo);
        window.webkit.messageHandlers.$media.postMessage (mediaInfo);
    }

    let videoPropsLogMsg = '';

    if (mediaEl.videoTracks.length) {
        videoPropsLogMsg = `dimensions ${mediaEl.videoWidth}x${mediaEl.videoHeight}, `;
        const aspectRatio = mediaEl.videoWidth / mediaEl.videoHeight;
        // window.resizeTo (mediaEl.offsetWidth, fitHeight);
        window.webkit.messageHandlers.$ipc.postMessage ({
            channel: 'window-set-aspect-ratio',
            payload: {aspectRatio}
        });    
    }

    console.log (`media metadata loaded, ${videoPropsLogMsg}duration ${mediaEl.duration}s`);
}

function mediaNotPlaying (evt) {
    document.documentElement.classList.remove ('video-playing');
    console.log ('regular state ' + evt.type);
    setRegularWindowState('video-' + evt.type);
}


/*

(function wrapHistoryAPI (historyAPI) {
    ['pushState', 'replaceState'].forEach (method => {
        const oldMethodRef = historyAPI[method];
        historyAPI[method] = function (state, title, url) {
            const result = oldMethodRef.call (historyAPI, state, title, url);
            
            const historyAPIEvent = new CustomEvent(method.toLowerCase(), {
                detail: {state, title, url}
            });
            window.dispatchEvent (historyAPIEvent);
            return result;
        }
    })
}) (window.history);

window.addEventListener ('xpushstate', (evt) => {
    if (
        window.location.hostname.match (/netflix\.com$/)
        && window.location.pathname.match (/^\/watch\/\d+$/)
    ) {
        reinstallListeners = true;
    } else {
        setRegularWindowState();
        reinstallListeners = false;
    }
});

*/
