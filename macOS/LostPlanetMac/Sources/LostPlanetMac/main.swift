import AppKit
import SwiftUI

struct LostPlanetMacApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate

    var body: some Scene {
        WindowGroup("TULIP Explorer") {
            ExplorerFlowView()
                .frame(minWidth: 1_080, minHeight: 700)
        }
        .defaultSize(width: 1_280, height: 820)
        .windowResizability(.contentMinSize)
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        NSApp.activate(ignoringOtherApps: true)
    }
}

LostPlanetMacApp.main()
