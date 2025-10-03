# Avacia

Streaming media player, built with electron-like framework

[![screenshot](https://apla.github.io/avacia/images/screenshots/netflix-short@2x.jpg)](https://apla.github.io/avacia/)

## Install

Download Avacia.app from releases, then execute `sudo xattr -d com.apple.quarantine Avacia.app` from Terminal.

## Development

### Making the release

3. Change marketing version in Xcode
2. Change version in the app/package.json
1. Commit the code, tag it with version like v/1.2.0
0. run `./scripts/makeRelease`

## Crash

WebProcessProxy::didExceedInactiveMemoryLimit() Terminating WebProcess with pid 92583 that has exceeded the inactive memory limit

## Other

### Brand Icons and Logo

Most of the icons and logos retrieved from [https://wikipedia.com](https://wikipedia.com).

Apple Music logo is absent because [Apple didn't provided the way to obtain it](https://affiliate.itunes.apple.com/resources/).

https://www.apple.com/itunes/marketing-on-music/identity-guidelines.html

https://artists.amazonmusic.com/about-amazon-music

https://discord.com/brand-new/branding

Avacia[51897:6457343] [ProcessSuspension] 0x1090980e0 - ProcessAssertion::acquireSync Failed to acquire RBS assertion 'WebKit Media Playback' for process with PID=51900, error: Error Domain=RBSServiceErrorDomain Code=1 "(originator doesn't have entitlement com.apple.runningboard.assertions.webkit AND originator doesn't have entitlement com.apple.multitasking.systemappassertions)" UserInfo={NSLocalizedFailureReason=(originator doesn't have entitlement com.apple.runningboard.assertions.webkit AND originator doesn't have entitlement com.apple.multitasking.systemappassertions)}
Avacia[51897:6457343] [assertion] Error acquiring assertion: <Error Domain=RBSServiceErrorDomain Code=1 "(originator doesn't have entitlement com.apple.runningboard.assertions.webkit AND originator doesn't have entitlement com.apple.multitasking.systemappassertions)" UserInfo={NSLocalizedFailureReason=(originator doesn't have entitlement com.apple.runningboard.assertions.webkit AND originator doesn't have entitlement com.apple.multitasking.systemappassertions)}>
2023-06-24 22:45:23.938629+0300 Avacia[51897:6456217] [logging] open flag(s) 0x01000000 are reserved for VFS use and do not affect behaviour when passed to sqlite3_open_v2

