//
//  AppDelegate.m
//  avacia
//
//  Created by apla on 04/08/2020.
//  Copyright © 2020 example. All rights reserved.
//

#import "AppDelegate.h"

#import "AppleMediaKeyController.h"

@interface AppDelegate ()

@end

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification {
    [super applicationDidFinishLaunching:aNotification];
    
    [AppleMediaKeyController sharedController];
    
    // now js part can call
    // app.onMacOSNotification ('MediaKeyNextNotification', () => {/* handler */})
}

/*
- (void)applicationWillTerminate:(NSNotification *)aNotification {
    // Insert code here to tear down your application
}
*/

@end
