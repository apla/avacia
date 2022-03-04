function getConfiguredSites () {
    return {
        Netflix: {
            order: 201,
            siteMediaType: 'video',
            isVideoOnTop: true,
            baseUrl: 'https://netflix.com',
            getInjectCss () {
                if (!window.location.hostname.match (/netflix\.com$/)) {
                    return;
                }
                return `
                    /* netflix */
                    /* netflix main page decorations */
                    .pinning-header .main-header {padding: 0 0 0 75px;}
                    .pinning-header .secondary-navigation {right: 0;}

                    /* netflix player decorations */
                    .PlayerControlsNeo__core-controls .top-left-controls {margin: 6em 2em;}

                    /* netflix draggable header and video player */
                    .pinning-header *,
                    .AkiraPlayer *,
                    .our-story-header-wrapper *,
                    .login-header * {-webkit-user-drag: none;}
                `;
            },
            checkOnMediaPage (pageUrl = window.location) {
                return pageUrl.hostname.match (/netflix\.com$/)
                && pageUrl.pathname.match (/^\/watch\/\d+$/);
            },
            getMediaInfo () {
                return {
                    title: document.querySelector('div.video-title>h4').textContent
                }
            },

        },
        YouTube: {
            order: 202,
            siteMediaType: 'video',
            isVideoOnTop: true,
            baseUrl: 'https://youtube.com',
            getInjectCss () {
                if (
                    !window.location.hostname.match (/youtube\.com$/)
                    || window.location.hostname.match (/music\.youtube\.com$/)
                ) {
                    return;
                }
                return `
                    /* youtube */
                    html.video-playing #columns {display: none;} /* only when playing video */
                    html.video-playing #masthead-container {display: none;}
                    html.video-playing #page-manager {margin-top: 0;}
                    html.video-playing ytd-app {background-color: black;}
                    
                    /* youtube draggable player */
                    #masthead-container *, #player-theater-container * {-webkit-user-drag: none;}
                    
                    /* youtube menu icon */
                    yt-icon-button.ytd-masthead {padding: 15px 8px 8px 8px;}
                `;
            },
            checkOnMediaPage (pageUrl = window.location) {
                // it's important not to include youtube music
                if (pageUrl.hostname === 'youtu.be')
                    return true;
                return pageUrl.hostname.match (/^(?:www\.)?youtube\.com$/)
                && !pageUrl.hostname.match (/^music\.youtube\.com$/)
                && pageUrl.pathname === '/watch';
            },
            getMediaInfo () {

                // checks youtube player for theater mode
                // function youtubeSetTheater () {
                    const flexyElts = document.getElementsByTagName('ytd-watch-flexy');
                    // should be true when theather mode is activated
                    if (flexyElts && flexyElts[0] && !flexyElts[0].theater) {
                        const sizeBtns = document.getElementsByClassName('ytp-size-button');
                        sizeBtns && sizeBtns[0] && sizeBtns[0].click();
                    }
                // }

                const mediaEl = document.querySelector ('video');
                if (mediaEl.videoTracks.length) {
                    const aspectRatio = mediaEl.videoWidth / mediaEl.videoHeight;
                    const properHeight = (window.innerWidth / aspectRatio) + 'px';
                    document.querySelector ('#player-theater-container').style.minHeight = properHeight;
                    mediaEl.style.height = properHeight;
                }

                // to skip ads after button skip video appears on screen
                // .ytp-ad-skip-button-slot#{skip-button:1x}
                // check when it became visible with display !== none
                
                // set height according to aspect ratio
                // #player-theater-container @min-height
                // video @height
                // ytd-app @background-color black

                return;
                return {
                    title: document.querySelector('div.video-title>h4').textContent
                };
            },
        },

        Vimeo: {
            order: 203,
            siteMediaType: 'video',
            isVideoOnTop: true,
            baseUrl: 'https://vimeo.com/watch',
            getInjectCss () {
                if (
                    !window.location.hostname.match (/vimeo\.com$/)
                ) {
                    return;
                }
                return `
                    /* vimeo */
                    #topnav_mobile *,
                    #topnav_desktop * {-webkit-user-drag: none;}
                    
                    html.video-playing #topnav_mobile,
                    html.video-playing #topnav_desktop,
                    html.video-playing div[data-reactroot] main {display: none;}
                    html.video-playing  .wrap_content {padding-top: 0;}            
                `;
            },
            checkOnMediaPage (pageUrl = window.location) {
                return pageUrl.hostname.match (/vimeo\.com$/)
                && pageUrl.pathname.match (/^(?:\/channels\/[^\/]+)?\/\d+$/);
            },
            getMediaInfo () {
                
            },
        },

        "Coub Weekly": {
            order: 204,
            siteMediaType: 'video',
            baseUrl: 'https://coub.com/weekly/',
            getInjectCss () {
                if (
                    !window.location.hostname.match (/coub\.com$/)
                ) {
                    return;
                }
                return `
                    /* coub */

                    header.header * {-webkit-user-drag: none;}

                    @media screen and (min-width: 10px) and (max-width: 700px) {
                        html, body {min-width: auto;}
                        .page-container, .page__content {width: auto;}
                    
                        .timeline-right-block {display: none;}
                    }
                `;
            },
        },

        "YouTube Music": {
            order: 201,
            siteMediaType: 'audio',
            baseUrl: 'https://music.youtube.com',
            getInjectCss () {
                if (
                    !window.location.hostname.match (/music\.youtube\.com$/)
                ) {
                    return;
                }
                return `
                    /* youtube music bars */
                    .left-content.ytmusic-nav-bar, .right-content.ytmusic-nav-bar {padding-top: 10px;}
                    ytmusic-nav-bar *,
                    ytmusic-player-bar * {-webkit-user-drag: none;}
                    ytmusic-player-bar paper-slider#progress-bar,
                    ytmusic-player-bar paper-slider#progress-bar * {-webkit-user-drag: auto;}
                            
                    /* youtube music */
                    ytmusic-search-box.ytmusic-nav-bar {top: 75px;}

                    /* playlist */
                    @media (min-width: 600px) and (max-width: 935px) ytmusic-player-page#player-page div#main-panel[style] {padding: 0 !important; width: 25vw;}

                    @media (max-width: 600px) ytmusic-player-page#player-page>div.content.ytmusic-player-page {flex-direction: column;}
                    @media (min-width: 600px) and (max-width: 935px) ytmusic-player-page#player-page>div.content.ytmusic-player-page {flex-direction: row; padding: 0;}
                    ytmusic-player-page#player-page>div.content.ytmusic-player-page>div.side-panel.classic {width: auto; margin: 0;}
                `;
            },
            checkOnMediaPage (pageUrl = window.location) {
                return pageUrl.hostname.match (/^music\.youtube\.com$/);
            },
            getMediaInfo () {
                // TODO: prev/next probably can be visible event without media
                navigator.mediaSession.actions.previoustrack.element = document.querySelector ('#left-controls > div > paper-icon-button.previous-button.style-scope.ytmusic-player-bar');
                
                navigator.mediaSession.actions.nexttrack.element = document.querySelector ('#left-controls > div > paper-icon-button.next-button.style-scope.ytmusic-player-bar');
                
                // TODO: youtube music sometimes adds album and album year after delay
                const titleNode = document.querySelector('ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar > div.content-info-wrapper.style-scope.ytmusic-player-bar > yt-formatted-string.title');
                const title = titleNode.title;
                const subtitle = titleNode.nextElementSibling.querySelector('span.subtitle.style-scope.ytmusic-player-bar > yt-formatted-string').title;
                const [artist, albumTitle, year] = subtitle.split (' • ');
                
                // videoEl.poster = (document.querySelector('ytmusic-player-page#player-page ytmusic-player div#song-image img') || {}).src;
                const mediaInfo = {
                    title,
                    albumTitle,
                    artist,
                    year
                    // releaseDate // year to release date?
                };

                return mediaInfo;
            },
            togglePlaylist () {
                // spotify has two of those - for audio and video, click works of either of them
                return document.querySelector ('#right-controls > paper-icon-button.toggle-player-page-button.style-scope.ytmusic-player-bar').click()
            }
        },

        "Spotify": {
            order: 202,
            siteMediaType: 'audio',
            baseUrl: 'https://open.spotify.com',
            getInjectCss () {
                
                if (
                    !window.location.hostname.match (/spotify\.com$/)
                ) {
                    return;
                }
                return `
                    /* spotify bar */
                    .mh-header-hover *,
                    div[data-hypernova-key="MastheadHeader"] * {-webkit-user-drag: none;}
                    .mh-brand-wrapper {margin-right: auto; margin-left: auto;}
                    
                    /* spotify login */
                    .ng-scope div.head, .ng-scope div.head * {-webkit-user-drag: none;}
                    
                
                    /* spotify bar (open) */
                    html.spotify__os--is-macos .now-playing-bar-container *,
                    html.spotify__os--is-macos .Root__nav-bar>div>div,
                    html.spotify__os--is-macos .Root__nav-bar>div>div *,
                    html.spotify__os--is-macos .Root__nav-bar>div>div[role=banner] *,
                    div[data-test-id="topbar-content-wrapper"] {
                        -webkit-user-drag: none;
                    }
                    html.spotify__os--is-macos .now-playing-bar-container .progress-bar {-webkit-user-drag: auto;}
                     {-webkit-user-drag: none;}
                    
                    html.spotify__os--is-macos .now-playing-bar-container {
                        position: absolute;
                        bottom: 0;
                        width: 100%;
                        background-color: rgba(255,255,255,0.15);
                        -webkit-backdrop-filter: blur(5px);
                    }
                    
                    html.spotify__os--is-macos body {min-height: auto;}
                    html.spotify__os--is-macos .contentSpacing {padding: 0 5px 60px;}
                    html.spotify__os--is-macos .Root__nav-bar .Rootlist {overflow-y: scroll; padding-bottom: 60px;}
                    html.spotify__os--is-macos .Root__nav-bar>div {padding: 0 0 60px;}
                    
                    /* spotify logo */
                    html.spotify__os--is-macos .Root__nav-bar>div {
                        padding-top: 0;
                    }
                    html.spotify__os--is-macos .Root__nav-bar a.logo {padding: 10px 0 0 75px;}
                    html.spotify__os--is-macos .Root__nav-bar>div>ul>li:first-of-type {display:none;}
                    html.spotify__os--is-macos .Root__nav-bar>div>ul>li:nth-of-type(2) {position: absolute; top: 10px; left: 272px;}
                    html.spotify__os--is-macos .Root__nav-bar>div>ul>li:nth-of-type(2) a {background: none;}
                    html.spotify__os--is-macos .Root__nav-bar>div>ul>li:nth-of-type(2) span {display: none;}
				    /* app download link */
                    html.spotify__os--is-macos .Root__nav-bar>div>div:last-of-type {display: none;}
                    div[data-test-id="topbar-content-wrapper"] {padding: 40px;}
                    @media screen and (min-width: 1024px) {
                        html.spotify__os--is-macos .Root__nav-bar>div>ul>li:nth-of-type(2) {position: absolute; top: 10px; left: 340px;}
                    }

					.Root__now-playing-bar .ExtraControls {justify-content: flex-start;}
                    
                    .now-playing-bar__center {width: 60%;}
                    .now-playing-bar__right {width: 10%; min-width: 75px;}
                    .now-playing-bar__right__inner {width: 75px;}
                `;
            },
            checkOnMediaPage (pageUrl = window.location) {
                
                /*
                if (!navigator.mediaSession.actions.previoustrack.element) {
                    const el = document.querySelector ('#main > div > div.Root__top-container > div.Root__now-playing-bar > footer > div > div.now-playing-bar__center > div > div.player-controls__buttons > div:nth-child(2) > button[data-testid="control-button-skip-back"]');
                    if (el) navigator.mediaSession.actions.previoustrack.element = el;
                }
                
                if (!navigator.mediaSession.actions.nexttrack.element) {
                    const el = document.querySelector ('#main > div > div.Root__top-container > div.Root__now-playing-bar > footer > div > div.now-playing-bar__center > div > div.player-controls__buttons > div:nth-child(4) > button[data-testid="control-button-skip-forward"]');
                    if (el) navigator.mediaSession.actions.nexttrack.element = el;
                }
                */
                
                return pageUrl.hostname.match (/^open\.spotify\.com$/);
            },
            getMediaInfo () {
                // never runs on spotify

                // album accessible, but only through queue interface
                var nowPlayingNodes = document.querySelectorAll (
                    '.Root__now-playing-bar .now-playing-bar__left div.now-playing .react-contextmenu-wrapper'
                );

                // spotify already knows about media info
                return {
                    title: nowPlayingNodes[0].textContent,
                    artist: nowPlayingNodes[1].textContent,
                }

            },
            togglePlaylist () {
                // spotify has two of those - for audio and video, click works of either of them
                return document.querySelector ('button.control-button.spoticon-queue-16').click()
            }
        },
        "Amazon Music": {
            order: 203,
            siteMediaType: 'audio',
            baseUrl: 'https://music.amazon.com',
            getInjectCss () {
                
                if (
                    !window.location.hostname.match (/amazon\.com$/)
                ) {
                    return;
                }
                return `
                /* top bar */
                nav#navbar * {-webkit-user-drag: none;}

                /* play bar */
                div#transport * {-webkit-user-drag: none;}
                
                /* lyrics player */
                div#npv * {-webkit-user-drag: none;}
                
                /* modal */
                div#dialog * {-webkit-user-drag: none;}

                /* auth page navbar */
                div.auth-navbar * {-webkit-user-drag: none;}
                `;
            },
            checkOnMediaPage (pageUrl = window.location) {
                
                /*
                if (!navigator.mediaSession.actions.previoustrack.element) {
                    const el = document.querySelector ('#main > div > div.Root__top-container > div.Root__now-playing-bar > footer > div > div.now-playing-bar__center > div > div.player-controls__buttons > div:nth-child(2) > button[data-testid="control-button-skip-back"]');
                    if (el) navigator.mediaSession.actions.previoustrack.element = el;
                }
                
                if (!navigator.mediaSession.actions.nexttrack.element) {
                    const el = document.querySelector ('#main > div > div.Root__top-container > div.Root__now-playing-bar > footer > div > div.now-playing-bar__center > div > div.player-controls__buttons > div:nth-child(4) > button[data-testid="control-button-skip-forward"]');
                    if (el) navigator.mediaSession.actions.nexttrack.element = el;
                }
                */
                
                return pageUrl.hostname.match (/^music\.amazon\.com$/);
            },
            getMediaInfo () {
                // never runs on spotify
                
                // album accessible, but only through queue interface
                var nowPlayingNodes = document.querySelectorAll (
                    '.Root__now-playing-bar .now-playing-bar__left div.now-playing .react-contextmenu-wrapper'
                );
                
                // spotify already knows about media info
                return {
                    title: nowPlayingNodes[0].textContent,
                    artist: nowPlayingNodes[1].textContent,
                }
                
            },
            togglePlaylist () {
                // spotify has two of those - for audio and video, click works of either of them
                return document.querySelector ('button.control-button.spoticon-queue-16').click()
            }
        },
	  "SoundCloud": {
		  order: 204,
		  siteMediaType: 'audio',
		  baseUrl: 'https://soundcloud.com/',
		  getInjectCss () {
			  
			  if (
				  !window.location.hostname.match (/soundcloud\.com$/)
			  ) {
				  return;
			  }
			  return `
				// first page cookie consent
			  .onetrust-pc-dark-filter {-webkit-user-drag: none;}
			  
			#app header.header * {-webkit-user-drag: none;}
			  
			  #app .frontHero * {-webkit-user-drag: none;}
				  
				  .playControls .playControls__elements .playControls__control,
					.playControls .playControls__elements .playControls__soundBadge * {-webkit-user-drag: none;}
			  `;
		  },
		  checkOnMediaPage (pageUrl = window.location) {
			  
			  return pageUrl.hostname.match (/soundcloud\.com$/);
		  },
		  getMediaInfo () {
			  

		  },
	  },

        /*
        " Music": {
            order: 204,
            siteMediaType: 'audio',
            baseUrl: 'https://beta.music.apple.com/',
            getInjectCss () {
                
                if (
                    !window.location.hostname.match (/music\.apple\.com$/)
                ) {
                    return;
                }
                // allple already have user-drag style all over
                // and because of this music track not dragging
                return `
                    .web-navigation>button.menuicon {top: 8px;}
                    
                    h1.web-navigation__header {left: 65px;}
                `;
            },
            checkOnMediaPage (pageUrl = window.location) {
                
                return pageUrl.hostname.match (/music\.apple\.com$/);
            },
            getMediaInfo () {
                

            },
        },
        */
    };
}

if (typeof module !== "undefined") module.exports = getConfiguredSites;
