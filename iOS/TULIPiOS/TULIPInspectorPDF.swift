import SwiftUI
import UIKit

struct TULIPSharePayload: Identifiable {
    let id = UUID()
    let items: [Any]
}

struct TULIPShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) { }
}

enum TULIPInspectorPDFExporter {
    private static let pageBounds = CGRect(x: 0, y: 0, width: 595, height: 842)
    private static let margin: CGFloat = 48
    private static let headerHeight: CGFloat = 34
    private static let footerHeight: CGFloat = 36

    static func makePDF(for profile: TULIPInspectorProfile) throws -> URL {
        let format = UIGraphicsPDFRendererFormat()
        format.documentInfo = [
            kCGPDFContextTitle as String: "TULIP - \(profile.name)",
            kCGPDFContextAuthor as String: "The TULIP Project",
            kCGPDFContextSubject as String: "TULIP environmental evidence briefing",
            kCGPDFContextCreator as String: "The TULIP Project for iOS",
        ]

        let renderer = UIGraphicsPDFRenderer(bounds: pageBounds, format: format)
        let data = renderer.pdfData { context in
            draw(profile, in: context)
        }

        let folder = FileManager.default.temporaryDirectory
            .appendingPathComponent("TULIP-Reports", isDirectory: true)
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        let fileURL = folder.appendingPathComponent("tulip-\(slug(profile.name)).pdf")
        try data.write(to: fileURL, options: .atomic)
        return fileURL
    }

    private static func draw(_ profile: TULIPInspectorProfile, in context: UIGraphicsPDFRendererContext) {
        let contentWidth = pageBounds.width - margin * 2
        let bottom = pageBounds.height - margin - footerHeight
        var pageNumber = 0
        var cursorY: CGFloat = margin

        let ink = UIColor(red: 0.12, green: 0.12, blue: 0.14, alpha: 1)
        let secondaryInk = UIColor(red: 0.34, green: 0.33, blue: 0.36, alpha: 1)
        let accent = UIColor(red: 0.22, green: 0.48, blue: 0.86, alpha: 1)
        let headerMonogram = blackHeaderMonogram()

        func beginPage() {
            context.beginPage()
            pageNumber += 1
            UIColor.white.setFill()
            context.fill(pageBounds)

            drawWatermark(in: context.cgContext, color: accent)
            drawPageHeader(ink: ink)

            let footer = "THE TULIP PROJECT   |   Page \(pageNumber)"
            let attributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 8, weight: .semibold),
                .foregroundColor: UIColor(red: 0.48, green: 0.47, blue: 0.50, alpha: 1),
                .kern: 0.8,
            ]
            (footer as NSString).draw(
                at: CGPoint(x: margin, y: pageBounds.height - margin),
                withAttributes: attributes
            )
            cursorY = margin + headerHeight
        }

        func drawPageHeader(ink: UIColor) {
            let markSize: CGFloat = 22
            let markRect = CGRect(
                x: margin,
                y: 30,
                width: markSize,
                height: markSize
            )
            if let mark = headerMonogram {
                mark.draw(in: markRect, blendMode: .normal, alpha: 1)
            }

            let wordmark = "THE TULIP PROJECT"
            let wordmarkAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 9, weight: .bold),
                .foregroundColor: ink,
                .kern: 1.1,
            ]
            (wordmark as NSString).draw(
                at: CGPoint(x: markRect.maxX + 9, y: markRect.minY + 5),
                withAttributes: wordmarkAttributes
            )
        }

        func textHeight(_ text: String, font: UIFont, width: CGFloat, lineSpacing: CGFloat) -> CGFloat {
            let paragraph = NSMutableParagraphStyle()
            paragraph.lineSpacing = lineSpacing
            let bounds = (text as NSString).boundingRect(
                with: CGSize(width: width, height: .greatestFiniteMagnitude),
                options: [.usesLineFragmentOrigin, .usesFontLeading],
                attributes: [.font: font, .paragraphStyle: paragraph],
                context: nil
            )
            return ceil(bounds.height)
        }

        func ensureSpace(_ height: CGFloat) {
            if cursorY + height > bottom {
                beginPage()
            }
        }

        func drawText(
            _ text: String,
            font: UIFont,
            color: UIColor = ink,
            spacingAfter: CGFloat = 8,
            lineSpacing: CGFloat = 2,
            indent: CGFloat = 0
        ) {
            guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
            let width = contentWidth - indent
            let height = textHeight(text, font: font, width: width, lineSpacing: lineSpacing)
            ensureSpace(height + spacingAfter)
            let paragraph = NSMutableParagraphStyle()
            paragraph.lineSpacing = lineSpacing
            (text as NSString).draw(
                with: CGRect(x: margin + indent, y: cursorY, width: width, height: height + 2),
                options: [.usesLineFragmentOrigin, .usesFontLeading],
                attributes: [
                    .font: font,
                    .foregroundColor: color,
                    .paragraphStyle: paragraph,
                ],
                context: nil
            )
            cursorY += height + spacingAfter
        }

        func drawRule() {
            ensureSpace(12)
            context.cgContext.setStrokeColor(UIColor(red: 0.84, green: 0.84, blue: 0.86, alpha: 1).cgColor)
            context.cgContext.setLineWidth(0.75)
            context.cgContext.move(to: CGPoint(x: margin, y: cursorY))
            context.cgContext.addLine(to: CGPoint(x: pageBounds.width - margin, y: cursorY))
            context.cgContext.strokePath()
            cursorY += 12
        }

        func drawScoreBadge(score: String, band: String?) {
            let badgeHeight: CGFloat = 50
            let spacingAfter: CGFloat = 12
            let scoreBaseFont = UIFont.systemFont(ofSize: score == "Not scored" ? 18 : 30, weight: .medium)
            let scoreFont = UIFont(
                descriptor: scoreBaseFont.fontDescriptor.withDesign(.rounded) ?? scoreBaseFont.fontDescriptor,
                size: scoreBaseFont.pointSize
            )
            let scoreAttributes: [NSAttributedString.Key: Any] = [
                .font: scoreFont,
                .foregroundColor: UIColor.white,
            ]
            let scoreSize = (score as NSString).size(withAttributes: scoreAttributes)
            let visibleBand = band?.isEmpty == false ? band : nil
            let bandFont = UIFont.systemFont(ofSize: 12, weight: .semibold)
            let bandSize = visibleBand.map { ($0 as NSString).size(withAttributes: [.font: bandFont]) } ?? .zero
            let bandWidth = visibleBand == nil ? 0 : bandSize.width + 16
            let badgeWidth = 16 + scoreSize.width + (visibleBand == nil ? 8 : 8 + bandWidth + 8)
            ensureSpace(badgeHeight + spacingAfter)

            let badgeRect = CGRect(
                x: margin,
                y: cursorY,
                width: badgeWidth,
                height: badgeHeight
            )
            let badgePath = UIBezierPath(roundedRect: badgeRect, cornerRadius: badgeHeight / 2)
            let gradient = CGGradient(
                colorsSpace: CGColorSpaceCreateDeviceRGB(),
                colors: [
                    UIColor(red: 0.43, green: 0.68, blue: 1, alpha: 1).cgColor,
                    UIColor(red: 0.70, green: 0.60, blue: 1, alpha: 1).cgColor,
                    UIColor(red: 1, green: 0.42, blue: 0.43, alpha: 1).cgColor,
                ] as CFArray,
                locations: [0, 0.56, 1]
            )

            context.cgContext.saveGState()
            badgePath.addClip()
            if let gradient {
                context.cgContext.drawLinearGradient(
                    gradient,
                    start: CGPoint(x: badgeRect.minX, y: badgeRect.minY),
                    end: CGPoint(x: badgeRect.maxX, y: badgeRect.maxY),
                    options: []
                )
            }
            context.cgContext.restoreGState()

            let scoreOrigin = CGPoint(
                x: badgeRect.minX + 16,
                y: badgeRect.midY - scoreSize.height / 2
            )
            (score as NSString).draw(at: scoreOrigin, withAttributes: scoreAttributes)

            if let visibleBand {
                let bandRect = CGRect(
                    x: scoreOrigin.x + scoreSize.width + 8,
                    y: badgeRect.midY - 12,
                    width: bandWidth,
                    height: 24
                )
                UIColor.black.withAlphaComponent(0.2).setFill()
                UIBezierPath(roundedRect: bandRect, cornerRadius: 12).fill()
                (visibleBand as NSString).draw(
                    at: CGPoint(
                        x: bandRect.midX - bandSize.width / 2,
                        y: bandRect.midY - bandSize.height / 2
                    ),
                    withAttributes: [
                        .font: bandFont,
                        .foregroundColor: UIColor.white.withAlphaComponent(0.88),
                    ]
                )
            }

            cursorY += badgeHeight + spacingAfter
        }

        func drawSection(_ title: String, lines: [String]) {
            let content = lines.filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
            guard !content.isEmpty else { return }
            ensureSpace(56)
            cursorY += 10
            drawText(
                title.uppercased(),
                font: .systemFont(ofSize: 11, weight: .bold),
                color: accent,
                spacingAfter: 8,
                lineSpacing: 0
            )
            for line in content {
                drawText(
                    line,
                    font: .systemFont(ofSize: 11.5, weight: .regular),
                    color: secondaryInk,
                    spacingAfter: 7,
                    lineSpacing: 2.5
                )
            }
        }

        func drawLinks(_ title: String, links: [(String, String)]) {
            let secureLinks = links.filter { $0.1.lowercased().hasPrefix("https://") }
            guard !secureLinks.isEmpty else { return }
            ensureSpace(56)
            cursorY += 10
            drawText(
                title.uppercased(),
                font: .systemFont(ofSize: 11, weight: .bold),
                color: accent,
                spacingAfter: 8,
                lineSpacing: 0
            )
            for (label, address) in secureLinks {
                let value = "\(label): \(address)"
                let font = UIFont.systemFont(ofSize: 9.5, weight: .regular)
                let height = textHeight(value, font: font, width: contentWidth, lineSpacing: 2)
                ensureSpace(height + 8)
                let rect = CGRect(x: margin, y: cursorY, width: contentWidth, height: height + 2)
                let paragraph = NSMutableParagraphStyle()
                paragraph.lineSpacing = 2
                (value as NSString).draw(
                    with: rect,
                    options: [.usesLineFragmentOrigin, .usesFontLeading],
                    attributes: [
                        .font: font,
                        .foregroundColor: accent,
                        .underlineStyle: NSUnderlineStyle.single.rawValue,
                        .paragraphStyle: paragraph,
                    ],
                    context: nil
                )
                if let url = URL(string: address) {
                    context.cgContext.setURL(url as CFURL, for: rect)
                }
                cursorY += height + 8
            }
        }

        func impactLines(_ impact: TULIPImpactSummary?) -> [String] {
            guard let impact else { return [] }
            var lines: [String] = []
            if let summary = impact.summary { lines.append(summary) }
            if let severity = impact.severity { lines.append("Severity: \(severity)") }
            if let reach = impact.reach { lines.append("Reach: \(reach)") }
            lines.append(contentsOf: (impact.consequences ?? []).map { "- \($0)" })
            if let hiddenCost = impact.hiddenCost { lines.append("Hidden cost: \(hiddenCost)") }
            if let whoPays = impact.whoPays { lines.append("Who bears the cost: \(whoPays)") }
            if let physicalLimit = impact.physicalLimit { lines.append("Physical limit: \(physicalLimit)") }
            return lines
        }

        func relationshipLines(_ relationships: [TULIPRelationship]) -> [String] {
            let visibleLimit = 8
            var lines = relationships.prefix(visibleLimit).map { "\($0.name): \($0.explanation)" }
            if relationships.count > visibleLimit {
                lines.append("\(relationships.count - visibleLimit) additional connections are available in TULIP.")
            }
            return lines
        }

        beginPage()
        drawText(
            profile.sphere.uppercased(),
            font: .systemFont(ofSize: 10, weight: .bold),
            color: accent,
            spacingAfter: 7,
            lineSpacing: 0
        )
        drawText(
            profile.name,
            font: .systemFont(ofSize: 28, weight: .bold),
            spacingAfter: 10,
            lineSpacing: 1
        )
        let score = profile.urgency?.formatted(.number.precision(.fractionLength(1))) ?? "Not scored"
        let band = profile.urgencyBand?.trimmingCharacters(in: .whitespacesAndNewlines)
        drawScoreBadge(score: score, band: band)
        if let updated = profile.updated {
            drawText(
                "Most recent data: \(formatDate(updated))",
                font: .systemFont(ofSize: 9.5, weight: .regular),
                color: secondaryInk,
                spacingAfter: 15,
                lineSpacing: 0
            )
        }
        if let description = profile.description {
            drawText(
                description,
                font: .systemFont(ofSize: 12.5, weight: .regular),
                color: secondaryInk,
                spacingAfter: 15,
                lineSpacing: 3
            )
        }
        drawRule()

        drawSection(
            "Triggers",
            lines: relationshipLines(profile.incoming)
        )
        drawSection(
            "Effects",
            lines: relationshipLines(profile.outgoing)
        )
        drawSection("Impact on Humans", lines: impactLines(profile.human))
        drawSection("Impact on the Planet", lines: impactLines(profile.planet))

        if let response = profile.response {
            var lines: [String] = []
            if let driver = response.defaultDriver { lines.append(driver) }
            lines.append(contentsOf: (response.levers ?? []).map { "- \($0)" })
            drawSection("What can be done", lines: lines)
        }

        if let measurement = profile.measurement {
            let lines = [
                measurement.metric.map { "Metric: \($0)" },
                measurement.unit.map { "Reported as: \($0)" },
                measurement.geography.map { "Coverage: \($0)" },
                measurement.cadence.map { "Updates: \($0)" },
                measurement.method.map { "Method: \($0)" },
                measurement.uncertainty.map { "Uncertainty: \($0)" },
                measurement.boundary.map { "Boundary: \($0)" },
            ].compactMap { $0 }
            drawSection("How this is measured", lines: lines)
        }

        if let occurrences = profile.recentOccurrences?.occurrences, !occurrences.isEmpty {
            var eventLinks: [(String, String)] = []
            let eventFont = UIFont.systemFont(ofSize: 11.5, weight: .regular)
            let preparedEvents = occurrences.map { occurrence in
                var lines = [
                    "\(formatDate(occurrence.date)) - \(occurrence.place)",
                    occurrence.title,
                ]
                if let status = occurrence.statusLabel ?? occurrence.status {
                    lines.append("Reported status: \(status)")
                }
                return (lines: lines, links: occurrence.sources.map { ($0.label, $0.url) })
            }
            let firstEventHeight = preparedEvents.first?.lines.reduce(CGFloat.zero) { total, line in
                total + textHeight(line, font: eventFont, width: contentWidth, lineSpacing: 2.5) + 7
            } ?? 0

            ensureSpace(32 + firstEventHeight)
            cursorY += 10
            drawText(
                "RECENT MAJOR EVENTS",
                font: .systemFont(ofSize: 11, weight: .bold),
                color: accent,
                spacingAfter: 8,
                lineSpacing: 0
            )

            for event in preparedEvents {
                let eventHeight = event.lines.reduce(CGFloat.zero) { total, line in
                    total + textHeight(line, font: eventFont, width: contentWidth, lineSpacing: 2.5) + 7
                }
                ensureSpace(eventHeight)
                for line in event.lines {
                    drawText(
                        line,
                        font: eventFont,
                        color: secondaryInk,
                        spacingAfter: 7,
                        lineSpacing: 2.5
                    )
                }
                eventLinks.append(contentsOf: event.links)
            }
            drawLinks("Event sources", links: eventLinks)
        }

        let profileLinks: [(String, String)] = (profile.sources ?? []).compactMap { source in
            guard source.count >= 2 else { return nil }
            return (source[0], source[1])
        }
        drawLinks("Sources", links: profileLinks)
    }

    private static func drawWatermark(in context: CGContext, color: UIColor) {
        context.saveGState()
        defer { context.restoreGState() }

        let watermarkSize = CGSize(width: 410, height: 404)
        let watermarkRect = CGRect(
            x: (pageBounds.width - watermarkSize.width) / 2,
            y: (pageBounds.height - watermarkSize.height) / 2 - 4,
            width: watermarkSize.width,
            height: watermarkSize.height
        )

        if let mark = UIImage(named: "TULIPMonogram") {
            mark.draw(in: watermarkRect, blendMode: .normal, alpha: 0.34)
            return
        }

        let fallback = "TULIP"
        let fallbackFont = UIFont.systemFont(ofSize: 102, weight: .black)
        let fallbackAttributes: [NSAttributedString.Key: Any] = [
            .font: fallbackFont,
            .foregroundColor: color.withAlphaComponent(0.055),
            .kern: 5,
        ]
        let fallbackSize = (fallback as NSString).size(withAttributes: fallbackAttributes)
        (fallback as NSString).draw(
            at: CGPoint(
                x: pageBounds.midX - fallbackSize.width / 2,
                y: pageBounds.midY - fallbackSize.height / 2
            ),
            withAttributes: fallbackAttributes
        )
    }

    private static func blackHeaderMonogram() -> UIImage? {
        guard let source = UIImage(named: "TULIPMonogram") else { return nil }

        // Render at six times its PDF display size so the black mark remains crisp
        // while preserving the SVG's transparent silhouette.
        let renderSize = CGSize(width: 132, height: 130)
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        format.opaque = false
        return UIGraphicsImageRenderer(size: renderSize, format: format).image { rendererContext in
            let rect = CGRect(origin: .zero, size: renderSize)
            source.draw(in: rect)
            rendererContext.cgContext.setBlendMode(.sourceIn)
            rendererContext.cgContext.setFillColor(UIColor.black.cgColor)
            rendererContext.cgContext.fill(rect)
        }
    }

    private static func slug(_ value: String) -> String {
        let allowed = CharacterSet.alphanumerics
        let pieces = value.lowercased().components(separatedBy: allowed.inverted)
        let result = pieces.filter { !$0.isEmpty }.joined(separator: "-")
        return result.isEmpty ? "topic" : result
    }

    private static func formatDate(_ value: String) -> String {
        let trimmed = value
            .replacingOccurrences(of: "Last Updated:", with: "", options: .caseInsensitive)
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let parsers = ["yyyy-MM-dd", "MMMM yyyy", "MMM yyyy"]
        for format in parsers {
            let parser = DateFormatter()
            parser.locale = Locale(identifier: "en_US_POSIX")
            parser.dateFormat = format
            guard let date = parser.date(from: trimmed) else { continue }
            let output = DateFormatter()
            output.locale = Locale(identifier: "en_US_POSIX")
            output.dateFormat = format == "yyyy-MM-dd" ? "yyyy-MMM-dd" : "yyyy-MMM"
            return output.string(from: date)
        }
        return trimmed
    }
}
