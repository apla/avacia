const {ipcRenderer} = require ('electron');

// TODO: make this identical for chrome and WKWebView
const process = require ('process');
if (process.versions.chrome) {
	const path = require ('path');
	window.ipcRenderer = ipcRenderer;
	window.getConfiguredSites = require (path.join(__dirname, 'configured-sites.js'));
	console.log (window, ipcRenderer, getConfiguredSites);

} else {
	window.ipcRenderer = ipcRenderer;
}

window.addEventListener ('contextmenu', (evt) => {
    console.log (evt);
    window.webkit.messageHandlers.$contextmenu.postMessage ('contextmenu');
});

if (!("mediaSession" in navigator)) {
    class MediaMetadata {
        constructor (metadata) {
            this.title   = metadata.title;
            this.artist  = metadata.artist;
            this.album   = metadata.album;
            this.artwork = metadata.artwork;
        }
        compare (metadata) {
            if (
                   this.title  !== metadata.title
                || this.artist !== metadata.artist
                || this.album  !== metadata.album
            ) {
                return false;
            }
        }
    }
    
    window.MediaMetadata = MediaMetadata;

    class _MediaSession {
        constructor () {
            function runAction (mediaSessionAction) {
                if (mediaSessionAction.handler) {
                    mediaSessionAction.handler();
                } else if (mediaSessionAction.element) {
                    mediaSessionAction.element.click();
                }
            }
            const actions = {
                previoustrack () {
                    const mediaSessionAction = navigator.mediaSession.actions.previoustrack;
                    
                    runAction (mediaSessionAction);
                },
                nexttrack () {
                    const mediaSessionAction = navigator.mediaSession.actions.nexttrack;
                    
                    runAction (mediaSessionAction);
                },
                play () {},
                pause () {},
                seekbackward () {},
                seekforward () {},
                seekto () {},
                skipad () {},
            };
            Object.defineProperty (this, 'actions', {value: actions});
        }
        set playbackState (state) {
            this._playbackState = state;
        }
        get playbackState () {
            return this._playbackState;
        }
        set metadata (mediaMeta) {
            if (!this._metadata || !this._metadata.differsFrom || this._metadata.differsFrom (mediaMeta)) {
                console.log ('MEDIA SESSION INFO:', mediaMeta);
                window.webkit && window.webkit.messageHandlers.$media.postMessage (mediaMeta);
            }
            this._metadata = mediaMeta;
        }
        get metadata () {
            return this._metadata;
        }
        setActionHandler (action, handler) {
            console.log (action);
            if (navigator.mediaSession.actions[action])
                navigator.mediaSession.actions[action].handler = handler;
        }
        setPositionState() {
            
        }
    }

    navigator.mediaSession = new _MediaSession ();
}

const sites = window.getConfiguredSites();
let currentSite;
let isOnMediaPage = false;

var havePlayingVideo = false;

// this is a live collection - when the node is added the [0] element will be defined
const videoTags = document.getElementsByTagName('video');
const audioTags = document.getElementsByTagName('audio');
let oldVideoEl;
let oldVideoSrc;
let oldAudioEl;
let oldAudioSrc;

const mo = new MutationObserver(() => {
	
	const currentSites = Object.keys(sites).filter(
		site => sites[site].checkOnSite && sites[site].checkOnSite()
	);
	
//    const currentSites = Object.keys(sites).filter(
//        site => sites[site].checkOnMediaPage && sites[site].checkOnMediaPage()
//    );

	let videoEl = videoTags[0];
	let audioEl = audioTags[0];
	
	if (!currentSites || currentSites.length === 0) {
		if (havePlayingVideo) {
			setRegularWindowState ('location-change');
		}
		return;
	}
	if (currentSites.length > 1) {
		console.log (`multiple sites matches ${window.location}, using first one from ${currentSites.join(', ')}`);
	}

	const currentSiteConfig = sites[currentSites[0]];
	
	const wasOnMediaPage = isOnMediaPage;
	isOnMediaPage = Boolean(currentSiteConfig.checkOnMediaPage && currentSiteConfig.checkOnMediaPage());

	if (!isOnMediaPage) {
		if (havePlayingVideo) {
			setRegularWindowState ('location-change');
		}
		return;
	}
	
	// TODO: make a uniform selector
	if (currentSiteConfig.selectVideoEl) {
		videoEl = currentSiteConfig.selectVideoEl(videoTags);
	} else {
		videoEl = videoTags[currentSiteConfig.videoElIndex || 0];
	}
	
	if (currentSiteConfig.selectAudioEl) {
		audioEl = currentSiteConfig.selectAudioEl(audioTags);
	} else {
		audioEl = audioTags[currentSiteConfig.audioElIndex || 0];
	}
	
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

//document.addEventListener("fullscreenchange", (evt) => {
//	if (document.fullscreenElement) {
//		window.webkit.messageHandlers.$ipc.postMessage ({
//			channel: 'window-state-fullscreen',
//			{}
//		});
//	} else {
//		
//	}
//});

function setRegularWindowState (reason, mediaEl) {
    havePlayingVideo = false;
	
	if (reason === 'video-pause') {
		getAspectRatio (mediaEl, isOnMediaPage);
	}
	
    window.webkit.messageHandlers.$ipc.postMessage ({
        channel: 'window-state-regular',
		payload: {
			reason,
			isFullscreen: !!document.fullscreenElement,
			isOnMediaPage
		}
    });
}

function setPlayingWindowState (isVideoOnTop, reason, mediaEl) {
	havePlayingVideo = true;
	console.trace ('video playing', isVideoOnTop);
	if (isVideoOnTop) window.webkit.messageHandlers.$ipc.postMessage ({
		channel: 'window-state-playing',
		payload: {
			reason,
			isFullscreen: !!document.fullscreenElement,
			isOnMediaPage
		}
	});
	if (isOnMediaPage) {
		getAspectRatio(mediaEl, isOnMediaPage);
	}
}


function addMediaListeners (currentSiteConfig, mediaEl) {

    const isVideoOnTop = currentSiteConfig.isVideoOnTop;

    if (mediaEl.duration) {
        setMediaMetadata.call(this, currentSiteConfig, {target: mediaEl});

        if (!mediaEl.paused) {
			setPlayingWindowState(isVideoOnTop, 'event-subscription', mediaEl);
        }
    } else {
        mediaEl.addEventListener ('loadedmetadata', setMediaMetadata.bind (this, currentSiteConfig));
        mediaEl.addEventListener ('durationchange', setMediaMetadata.bind (this, currentSiteConfig));
        // TODO: proper handler
        window.addEventListener ('resize', setMediaMetadata.bind (this, currentSiteConfig));
    }
    
    mediaEl.addEventListener ('play', () => {
        document.documentElement.classList.add ('video-playing'); // ???
		setPlayingWindowState(isVideoOnTop, 'event-play', mediaEl);
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
        console.log ('HTML MEDIA INFO:', mediaInfo);
        window.webkit.messageHandlers.$media.postMessage (mediaInfo);
    }

    let videoPropsLogMsg = '';

    if (mediaEl.videoTracks.length) {
        videoPropsLogMsg = `dimensions ${mediaEl.videoWidth}x${mediaEl.videoHeight}, `;
        
        /*
        if (mediaEl.videoWidth === 0 || mediaEl.videoHeight === 0) {
            var videoDimensionsInterval = setInterval (() => {
                if (mediaEl.videoWidth === 0 || mediaEl.videoHeight === 0)
                    return;
                clearInterval (videoDimensionsInterval);
                getAspectRatio (mediaEl);
            }, 500);
        }
        */
        
        getAspectRatio (mediaEl);
    }

    console.log (`media metadata loaded, ${videoPropsLogMsg}duration ${mediaEl.duration}s`);
}

function getAspectRatio (mediaEl, isOnMediaPage) {
    const aspectRatio = mediaEl.videoWidth / mediaEl.videoHeight;
    // window.resizeTo (mediaEl.offsetWidth, fitHeight);
    const
        mediaWidth  = parseInt (mediaEl.style.width),
        mediaHeight = parseInt (mediaEl.style.height);
    
	if (!isNaN (aspectRatio) && isOnMediaPage) {
        window.webkit.messageHandlers.$ipc.postMessage ({
            channel: 'window-set-aspect-ratio',
			payload: {
				aspectRatio,
				isFullscreen: !!document.fullscreenElement,
				isOnMediaPage
			}
        });
        if (!isNaN (mediaWidth)) {
            mediaEl.style.height = mediaWidth / aspectRatio;
        }
    }

    return {aspectRatio};
}

function mediaNotPlaying (evt) {
    document.documentElement.classList.remove ('video-playing');
    console.log ('regular state ' + evt.type);
	setRegularWindowState('video-' + evt.type, evt.target);
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
