// Note: This implementation is not currently used -- the Objective C version (watcher-mac.m) is used instead.

// Output 1 for light theme, 0 for dark theme -- initial value, then any changes.

// swiftc watcher-mac.swift -o watcher-mac
// swiftc watcher-mac.swift && ./watcher-mac

import Foundation

class Watcher: NSObject {
    //private static var observerContext = 0

    private var callback: @convention(c) (Int, UnsafePointer<Void>) -> Void
    private var reference: UnsafePointer<Void>

    override init(callback: @escaping @convention(c) (Int, UnsafePointer<Void>) -> Void, reference: UnsafePointer<Void>) {
        self.callback = callback
        self.reference = reference
        super.init()
        UserDefaults.standard.addObserver(self, forKeyPath: "AppleInterfaceStyle", options: [.initial, .new /*, .old,  .prior*/], context: nil /*&Self.observerContext*/)
    }

    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey : Any]?, context: UnsafeMutableRawPointer?) {
        let interfaceStyle = (change![.newKey] as? String ?? "")

        // Set 'value' to 0=Dark, 1=Light
        let value = interfaceStyle == "Dark" ? 0 : 1

        if self.callback != nil {
            self.callback(value, nil)
        } else {
            print("\(value)")
            fflush(stdout)
        }
    }
}

// typedef void (*watcher_callback)(int, void *);
// int watcher(watcher_callback callback, void *reference);
@cdecl func watcher(callback: @convention(c) (int, UnsafePointer<Void>) -> Void, reference: UnsafePointer<Void>) -> Int {
    let myWatcher = Watcher(callback: callback, reference: reference)
    RunLoop.main.run()
}

// HACK: Just call with no callback
watcher(callback: nil, reference: nil)
