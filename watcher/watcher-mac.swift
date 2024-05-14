// Output 1 for light theme, 0 for dark theme -- initial value, then any changes.

// swiftc watcher-mac.swift -o watcher-mac
// swiftc watcher-mac.swift && ./watcher-mac

import Foundation

class Watcher: NSObject {
    //private static var observerContext = 0

    override init() {
        super.init()
        UserDefaults.standard.addObserver(self, forKeyPath: "AppleInterfaceStyle", options: [.initial, .new /*, .old,  .prior*/], context: nil /*&Self.observerContext*/)
    }

    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey : Any]?, context: UnsafeMutableRawPointer?) {
        let interfaceStyle = (change![.newKey] as? String ?? "")
        if interfaceStyle == "Dark" {
            print("0")  // Dark
            fflush(stdout)
        } else {
            print("1")  // Light
            fflush(stdout)
        }
    }
}

let watcher = Watcher()
RunLoop.main.run()
