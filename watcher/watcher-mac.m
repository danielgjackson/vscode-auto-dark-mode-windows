// Mac implementation of the watcher() function.

// clang -framework Foundation watcher.c watcher-mac.m -o watcher-mac
// ./watcher-mac

// docker run -v .:/workspace --rm -it ghcr.io/shepherdjerred/macos-cross-compiler:latest aarch64-apple-darwin22-clang --target=aarch64-apple-darwin22 -framework Foundation watcher.c watcher-mac.m -o watcher-mac

#include <TargetConditionals.h>
#if !TARGET_OS_OSX
    #error "watcher-mac.m is only expected to be compiled on macOS"
#endif

#import <Foundation/Foundation.h>

#include "watcher.h"

@interface Watcher : NSObject
@property (nonatomic, assign) watcher_callback callback;
@property (nonatomic, assign) void *reference;
@end

@implementation Watcher

- (instancetype)initWithCallback:(watcher_callback)callback reference:(void *)reference {
    self = [super init];
    if (self) {
        self.callback = callback;
        self.reference = reference;
        [[NSUserDefaults standardUserDefaults] addObserver:self
                                                 forKeyPath:@"AppleInterfaceStyle"
                                                    options:(NSKeyValueObservingOptionInitial | NSKeyValueObservingOptionNew)
                                                    context:NULL];
    }
    return self;
}

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary<NSKeyValueChangeKey,id> *)change
                       context:(void *)context {
    NSString *interfaceStyle = change[NSKeyValueChangeNewKey];
    NSString *interfaceStyleString = [NSString stringWithFormat:@"%@", interfaceStyle];

    int theme = 1;
    if ([interfaceStyleString isEqualToString:@"Dark"]) {
        theme = 0;
    }
    if (self.callback) {
        self.callback(theme, self.reference);
    } else {
        printf("%d\n", theme);
        fflush(stdout);
    }
}

@end

// int main(int argc, const char * argv[]) {  return 0; }
int watcher(watcher_callback callback, void *reference) {
    @autoreleasepool {
        Watcher *watcher = [[Watcher alloc] initWithCallback:callback reference:reference];
        [[NSRunLoop mainRunLoop] run];
    }
    return -1;
}
