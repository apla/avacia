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
    
    // TODO: activate it only when preferences stored and before user prompt
    [AppleMediaKeyController sharedController];
    
    // now js part can call
    // app.onMacOSNotification ('MediaKeyNextNotification', () => {/* handler */})
    
}


- (void)orderFrontStandardAboutPanel:(id)sender
{
    NSData* htmlBuf = [
    @"<b>Fork app </b>on a <a href='https://github.com/apla/avacia'>Github</a>"
    @""
                       dataUsingEncoding:NSUTF8StringEncoding];
    
    NSMutableDictionary* docAttrs = [NSMutableDictionary dictionaryWithDictionary:@{
        // NSDocumentTypeDocumentAttribute: NSHTMLTextDocumentType,
        NSCharacterEncodingDocumentAttribute: @(NSUTF8StringEncoding)
        
    }];
    NSAttributedString* credits = [[NSAttributedString alloc] initWithHTML:htmlBuf documentAttributes:&docAttrs];
    
    // TODO: fill from package.json
    NSDictionary *dict = [NSDictionary dictionaryWithObjectsAndKeys:
        @"", @"Version",
        @"", @"ApplicationVersion",
        credits, @"Credits",
        @"Copyright \xc2\xa9", @"Copyright", nil];
    [NSApp orderFrontStandardAboutPanelWithOptions: dict];
}



/*
- (void)applicationWillTerminate:(NSNotification *)aNotification {
    // Insert code here to tear down your application
}
*/

@end
