// clang -framework Foundation watcher-mac.m -o watcher-mac

#import <Foundation/Foundation.h>

@interface Watcher : NSObject
@end

@implementation Watcher

- (instancetype)init {
    self = [super init];
    if (self) {
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
    if ([interfaceStyleString isEqualToString:@"Dark"]) {
        printf("0\n");  // Dark
        fflush(stdout);
    } else {
        printf("1\n");  // Light
        fflush(stdout);
    }
}

@end

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        Watcher *watcher = [[Watcher alloc] init];
        [[NSRunLoop mainRunLoop] run];
    }
    return 0;
}

