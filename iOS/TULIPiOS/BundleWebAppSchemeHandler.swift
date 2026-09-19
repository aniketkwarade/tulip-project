import Foundation
import UniformTypeIdentifiers
import WebKit

final class BundleWebAppSchemeHandler: NSObject, WKURLSchemeHandler {
    private let dataCache: NSCache<NSURL, NSData> = {
        let cache = NSCache<NSURL, NSData>()
        cache.totalCostLimit = 24 * 1024 * 1024
        return cache
    }()

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard
            let requestURL = urlSchemeTask.request.url,
            requestURL.host == "app",
            let resourceURL = resourceURL(for: requestURL)
        else {
            fail(urlSchemeTask, code: .fileNoSuchFile)
            return
        }

        do {
            let cacheKey = resourceURL as NSURL
            let data: Data
            if let cached = dataCache.object(forKey: cacheKey) {
                data = cached as Data
            } else {
                data = try Data(contentsOf: resourceURL, options: .mappedIfSafe)
                dataCache.setObject(data as NSData, forKey: cacheKey, cost: data.count)
            }
            let response = URLResponse(
                url: requestURL,
                mimeType: mimeType(for: resourceURL),
                expectedContentLength: data.count,
                textEncodingName: isText(resourceURL) ? "utf-8" : nil
            )
            urlSchemeTask.didReceive(response)
            urlSchemeTask.didReceive(data)
            urlSchemeTask.didFinish()
        } catch {
            urlSchemeTask.didFailWithError(error)
        }
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}

    private func resourceURL(for requestURL: URL) -> URL? {
        let decodedPath = requestURL.path.removingPercentEncoding ?? requestURL.path
        let relativePath = decodedPath.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let requestedPath = relativePath.isEmpty ? "index.html" : relativePath

        guard !requestedPath.split(separator: "/").contains("..") else {
            return nil
        }

        guard let resourceRoot = Bundle.main.resourceURL?.appendingPathComponent("WebApp", isDirectory: true) else {
            return nil
        }

        let candidate = resourceRoot.appendingPathComponent(requestedPath).standardizedFileURL
        guard candidate.path.hasPrefix(resourceRoot.standardizedFileURL.path) else {
            return nil
        }
        return candidate
    }

    private func mimeType(for url: URL) -> String {
        if let type = UTType(filenameExtension: url.pathExtension), let mimeType = type.preferredMIMEType {
            return mimeType
        }

        switch url.pathExtension.lowercased() {
        case "js", "mjs": return "text/javascript"
        case "css": return "text/css"
        case "json": return "application/json"
        case "svg": return "image/svg+xml"
        case "woff": return "font/woff"
        case "woff2": return "font/woff2"
        default: return "application/octet-stream"
        }
    }

    private func isText(_ url: URL) -> Bool {
        ["html", "css", "js", "mjs", "json", "svg", "txt"].contains(url.pathExtension.lowercased())
    }

    private func fail(_ task: WKURLSchemeTask, code: CocoaError.Code) {
        task.didFailWithError(CocoaError(code))
    }
}
