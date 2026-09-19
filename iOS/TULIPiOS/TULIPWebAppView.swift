import SwiftUI
import UIKit
import WebKit

enum TULIPNativeTab: String, CaseIterable, Identifiable {
    case search
    case explore
    case analyse
    case footprint
    case activity

    var id: String { rawValue }
}

struct TULIPNativeDockState: Equatable {
    var active: TULIPNativeTab = .explore
    var isVisible = false
    var isCompact = false
    var isQuickStartActive = false
}

@MainActor
final class TULIPWebBridge: ObservableObject {
    private weak var webView: WKWebView?

    func attach(_ webView: WKWebView) {
        self.webView = webView
    }

    func select(_ tab: TULIPNativeTab) {
        sendCommand(["action": "select", "screen": tab.rawValue])
    }

    func showExplore() {
        select(.explore)
    }

    func resetExplore() {
        sendCommand(["action": "resetExplore"])
    }

    func openExploreFilters() {
        sendCommand(["action": "openExploreFilters"])
    }

    func setExploreFilter(_ filter: String) {
        sendCommand(["action": "setExploreFilter", "filter": filter])
    }

    func startQuickStart() {
        sendCommand(["action": "startQuickStart"])
    }

    func setRenderingActive(_ active: Bool) {
        guard let webView else { return }
        let value = active ? "true" : "false"
        webView.evaluateJavaScript(
            """
            window.__TULIP_NATIVE_RENDERING_ACTIVE__ = \(value);
            window.dispatchEvent(new CustomEvent('tulip-native-navigation', {
              detail: { action: 'setRenderingActive', active: \(value) }
            }));
            """
        )
    }

    func forceRevealAfterStartupDeadline() {
        guard let webView else { return }
        webView.evaluateJavaScript(
            """
            document.documentElement.dataset.nativeStartupDeadline = 'reached';
            document.getElementById('tulip-startup-shell')?.remove();
            document.querySelector('.startup-warmup')?.remove();
            """
        )
    }

    private func sendCommand(_ payload: [String: Any]) {
        guard
            let webView,
            let data = try? JSONSerialization.data(withJSONObject: payload),
            let json = String(data: data, encoding: .utf8)
        else { return }

        webView.evaluateJavaScript(
            "window.dispatchEvent(new CustomEvent('tulip-native-navigation', { detail: \(json) }));"
        )
    }
}

struct TULIPWebAppView: UIViewRepresentable {
    private static let messageHandlerName = "tulipNative"
    let bridge: TULIPWebBridge
    let onStartupReady: () -> Void
    let onDockStateChange: (TULIPNativeDockState) -> Void
    let onOpenInspector: (String) -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(
            onStartupReady: onStartupReady,
            onDockStateChange: onDockStateChange,
            onOpenInspector: onOpenInspector
        )
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = false
        configuration.setURLSchemeHandler(BundleWebAppSchemeHandler(), forURLScheme: "tulip")
        configuration.userContentController.add(
            context.coordinator,
            name: Self.messageHandlerName
        )

        // The embedded graph intentionally caps itself at 60 fps. Avoid
        // UIScreen.main here: on iOS 27 an iPhone scene can be resized or
        // mirrored onto a different display, so the process-wide main screen
        // is no longer a reliable description of this view's environment.
        let maximumFramesPerSecond = 60
        let standaloneScript = WKUserScript(
            source: """
            window.__TULIP_NATIVE_APP__ = true;
            window.__TULIP_NATIVE_RENDERING_ACTIVE__ = true;
            window.__TULIP_NATIVE_MAX_FPS__ = \(maximumFramesPerSecond);
            window.TULIPNative = Object.freeze({
              haptic(kind = 'selection') {
                window.webkit.messageHandlers.tulipNative.postMessage({ action: 'haptic', kind });
              },
              share(payload = {}) {
                window.webkit.messageHandlers.tulipNative.postMessage({ action: 'share', ...payload });
              },
              startupReady() {
                window.webkit.messageHandlers.tulipNative.postMessage({ action: 'startupReady' });
              },
              navigationState(payload = {}) {
                window.webkit.messageHandlers.tulipNative.postMessage({ action: 'navigationState', ...payload });
              },
              openInspector(name) {
                window.webkit.messageHandlers.tulipNative.postMessage({ action: 'openInspector', name });
              }
            });
            Object.defineProperty(window.navigator, 'standalone', {
              configurable: true,
              get: () => true
            });
            document.documentElement.classList.add('tulip-native-app');
            // Native vertical scrollers are compositor-owned. Keep routine
            // scrollbar bookkeeping off the ProMotion path, but allow the
            // inspector's threshold listener to compact its pinned identity bar.
            document.addEventListener('scroll', (event) => {
              if (event.target instanceof Element
                  && event.target.matches('.mobile-scroll, .mobile-carousel')
                  && !event.target.matches('.analyse-scroll > .mobile-scroll')) {
                event.stopImmediatePropagation();
              }
            }, true);
            document.addEventListener('click', (event) => {
              if (event.target instanceof Element && event.target.closest('button, a, [role="button"], [role="tab"], [role="menuitem"]')) {
                window.TULIPNative.haptic('selection');
              }
            }, true);
            """,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        configuration.userContentController.addUserScript(standaloneScript)

        let webView = WKWebView(frame: .zero, configuration: configuration)
        bridge.attach(webView)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.isOpaque = false
        webView.allowsLinkPreview = false
        webView.backgroundColor = .black
        webView.scrollView.backgroundColor = .black
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = false
        webView.scrollView.showsHorizontalScrollIndicator = false
        webView.scrollView.showsVerticalScrollIndicator = false
        webView.scrollView.isScrollEnabled = true
        webView.scrollView.delaysContentTouches = false
        webView.scrollView.canCancelContentTouches = true
        webView.allowsBackForwardNavigationGestures = false
        #if DEBUG
        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }
        #endif

        webView.load(URLRequest(url: URL(string: "tulip://app/index.html#explore")!))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        private let onStartupReady: () -> Void
        private let onDockStateChange: (TULIPNativeDockState) -> Void
        private let onOpenInspector: (String) -> Void
        private var deliveredStartupReady = false

        init(
            onStartupReady: @escaping () -> Void,
            onDockStateChange: @escaping (TULIPNativeDockState) -> Void,
            onOpenInspector: @escaping (String) -> Void
        ) {
            self.onStartupReady = onStartupReady
            self.onDockStateChange = onDockStateChange
            self.onOpenInspector = onOpenInspector
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            guard UserDefaults.standard.bool(forKey: "TULIPInspectorExpanded") else { return }
            webView.evaluateJavaScript(
                "setTimeout(() => document.querySelector('.analysis-sheet-handle')?.click(), 450)"
            )
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }

            if url.scheme == "tulip" || url.scheme == "about" {
                decisionHandler(.allow)
                return
            }

            if url.scheme == "https" || url.scheme == "http" {
                if navigationAction.navigationType == .linkActivated || navigationAction.targetFrame == nil {
                    openExternally(url)
                }
                decisionHandler(.cancel)
                return
            }

            if navigationAction.navigationType == .linkActivated,
               UIApplication.shared.canOpenURL(url) {
                openExternally(url)
            }
            decisionHandler(.cancel)
        }

        func webView(
            _ webView: WKWebView,
            createWebViewWith configuration: WKWebViewConfiguration,
            for navigationAction: WKNavigationAction,
            windowFeatures: WKWindowFeatures
        ) -> WKWebView? {
            if let url = navigationAction.request.url {
                openExternally(url)
            }
            return nil
        }

        func userContentController(
            _ userContentController: WKUserContentController,
            didReceive message: WKScriptMessage
        ) {
            guard message.name == TULIPWebAppView.messageHandlerName,
                  let payload = message.body as? [String: Any],
                  let action = payload["action"] as? String else { return }

            switch action {
            case "navigationState":
                guard
                    let activeName = payload["active"] as? String,
                    let active = TULIPNativeTab(rawValue: activeName)
                else { return }
                let state = TULIPNativeDockState(
                    active: active,
                    isVisible: payload["visible"] as? Bool ?? false,
                    isCompact: payload["compact"] as? Bool ?? false,
                    isQuickStartActive: payload["quickStartActive"] as? Bool ?? false
                )
                DispatchQueue.main.async { [onDockStateChange] in
                    onDockStateChange(state)
                }
            case "startupReady":
                deliverStartupReady()
            case "openInspector":
                guard let name = payload["name"] as? String, !name.isEmpty else { return }
                DispatchQueue.main.async { [onOpenInspector] in
                    onOpenInspector(name)
                }
            case "haptic":
                performHaptic(payload["kind"] as? String)
            case "share":
                presentShareSheet(payload)
            default:
                break
            }
        }

        private func deliverStartupReady() {
            guard !deliveredStartupReady else { return }
            deliveredStartupReady = true
            DispatchQueue.main.async { [onStartupReady] in
                onStartupReady()
            }
        }

        private func performHaptic(_ kind: String?) {
            switch kind {
            case "light":
                TULIPHaptics.impact()
            case "medium":
                TULIPHaptics.impact(.medium)
            case "rotation":
                TULIPHaptics.rotationTick()
            case "rotationMomentum":
                TULIPHaptics.rotationMomentumTick()
            case "success":
                TULIPHaptics.success()
            default:
                TULIPHaptics.selection()
            }
        }

        private func presentShareSheet(_ payload: [String: Any]) {
            let title = (payload["title"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
            let text = (payload["text"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
            let url = (payload["url"] as? String).flatMap(URL.init(string:))
            var items: [Any] = []
            if let title, !title.isEmpty { items.append(title) }
            if let text, !text.isEmpty { items.append(text) }
            if let url { items.append(url) }
            guard !items.isEmpty,
                  let presenter = Self.topViewController() else { return }

            let activityController = UIActivityViewController(
                activityItems: items,
                applicationActivities: nil
            )
            if let popover = activityController.popoverPresentationController {
                popover.sourceView = presenter.view
                popover.sourceRect = CGRect(
                    x: presenter.view.bounds.midX,
                    y: presenter.view.bounds.maxY,
                    width: 0,
                    height: 0
                )
                popover.permittedArrowDirections = []
            }
            presenter.present(activityController, animated: true)
        }

        private static func topViewController(
            from root: UIViewController? = UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap(\.windows)
                .first(where: \.isKeyWindow)?
                .rootViewController
        ) -> UIViewController? {
            if let presented = root?.presentedViewController {
                return topViewController(from: presented)
            }
            if let navigation = root as? UINavigationController {
                return topViewController(from: navigation.visibleViewController)
            }
            if let tabs = root as? UITabBarController {
                return topViewController(from: tabs.selectedViewController)
            }
            return root
        }

        private func openExternally(_ url: URL) {
            guard UIApplication.shared.canOpenURL(url) else { return }
            UIApplication.shared.open(url, options: [:])
        }
    }
}
