import SwiftUI
import UIKit

enum TULIPMetricDisplay {
    private struct LinearConversion {
        let pattern: String
        let factor: Double
        let unit: String
    }

    private static let numberPattern = #"-?\d+(?:,\d{3})*(?:\.\d+)?"#
    private static let conversions = [
        LinearConversion(pattern: #"(?:square\s+miles?|sq\.?\s*mi\.?|mi²)"#, factor: 2.589988110336, unit: "km²"),
        LinearConversion(pattern: #"(?:square\s+feet|sq\.?\s*ft\.?|ft²)"#, factor: 0.09290304, unit: "m²"),
        LinearConversion(pattern: #"(?:cfs)"#, factor: 0.028316846592, unit: "m³/s"),
        LinearConversion(pattern: #"(?:cubic\s+feet|cu\.?\s*ft\.?|ft³)"#, factor: 0.028316846592, unit: "m³"),
        LinearConversion(pattern: #"(?:nautical\s+miles?|nmi)"#, factor: 1.852, unit: "km"),
        LinearConversion(pattern: #"(?:miles?\s+per\s+hour|mph)"#, factor: 1.609344, unit: "km/h"),
        LinearConversion(pattern: #"(?:knots?|kt)"#, factor: 1.852, unit: "km/h"),
        LinearConversion(pattern: #"(?:short\s+tons?)"#, factor: 0.90718474, unit: "t"),
        LinearConversion(pattern: #"(?:tonne-miles?|ton-miles?)"#, factor: 1.609344, unit: "tonne-km"),
        LinearConversion(pattern: #"(?:miles?|mi\.)"#, factor: 1.609344, unit: "km"),
        LinearConversion(pattern: #"(?:feet|foot|ft\.?)"#, factor: 0.3048, unit: "m"),
        LinearConversion(pattern: #"(?:yards?|yd\.?)"#, factor: 0.9144, unit: "m"),
        LinearConversion(pattern: #"(?:inches?|inch|in\.?)"#, factor: 2.54, unit: "cm"),
        LinearConversion(pattern: #"(?:acres?)"#, factor: 0.40468564224, unit: "ha"),
        LinearConversion(pattern: #"(?:US\s+gallons?|gallons?|gal\.?)"#, factor: 3.785411784, unit: "L"),
        LinearConversion(pattern: #"(?:barrels?|bbl\.?)"#, factor: 158.987294928, unit: "L"),
        LinearConversion(pattern: #"(?:pounds?|lbs?\.?)"#, factor: 0.45359237, unit: "kg"),
        LinearConversion(pattern: #"(?:ounces?|oz\.?)"#, factor: 28.349523125, unit: "g"),
    ]

    static func text(_ input: String?) -> String {
        guard var output = input, !output.isEmpty else { return "" }
        if output.range(of: #"^https?://"#, options: [.regularExpression, .caseInsensitive]) != nil {
            return output
        }

        var protectedTerms: [String] = []
        output = replacingMatches(in: output, pattern: #"\b(?:(?:last|first)[-\s]mile|(?:on|by)\s+foot|foot\s+traffic|rail\s+yards?|shipyards?|front\s+yards?|backyards?|schoolyards?)\b"#) { match, source in
            guard let range = Range(match.range, in: source) else { return "" }
            let token = "__TULIP_METRIC_PROTECTED_\(protectedTerms.count)__"
            protectedTerms.append(String(source[range]))
            return token
        }

        output = replacingMatches(
            in: output,
            pattern: "(\(numberPattern))\\s*(?:°\\s*F|degrees?\\s+Fahrenheit)"
        ) { match, source in
            guard let range = Range(match.range(at: 1), in: source),
                  let value = Double(source[range].replacingOccurrences(of: ",", with: "")) else { return "" }
            return "\(formatted((value - 32) * 5 / 9)) °C"
        }

        for conversion in conversions {
            output = replacingLinearMeasurements(in: output, conversion: conversion)
        }

        let replacements: [(String, String)] = [
            (#"\bfeet\s+or\s+meters?\b"#, "metres"),
            (#"\bmeters?\s+or\s+feet\b"#, "metres"),
            (#"\bdegrees?\s+Celsius\s+or\s+Fahrenheit\b"#, "degrees Celsius"),
            (#"\bFahrenheit\s+or\s+Celsius\b"#, "Celsius"),
            (#"\bknots?\s+per\s+24\s+hours?\b"#, "kilometres per hour gained over 24 hours"),
            (#"\b(?:tonne|ton)-miles?\b"#, "tonne-kilometres"),
            (#"\bbrake-horsepower-hours?\b"#, "kilowatt-hours"),
            (#"\bsquare[-\s]miles?\b"#, "square kilometres"),
            (#"\bnautical\s+miles?\b"#, "kilometres"),
            (#"\bvehicle[-\s]miles?\b"#, "vehicle-kilometres"),
            (#"\btrack\s+miles?\b"#, "track kilometres"),
            (#"\briver\s+and\s+stream\s+miles?\b"#, "river and stream kilometres"),
            (#"\bmiles?\b"#, "kilometres"),
            (#"\b(?:feet|foot)\b"#, "metres"),
            (#"\bft\b"#, "m"),
            (#"\b(?:inches|inch)\b"#, "centimetres"),
            (#"\b(?:US\s+gallons|gallons|gallon)\b"#, "litres"),
            (#"\bgal\b"#, "L"),
            (#"\b(?:acres|acre)\b"#, "hectares"),
            (#"\b(?:pounds|pound)\b"#, "kilograms"),
            (#"\blbs?\b"#, "kg"),
            (#"\b(?:ounces|ounce)\b"#, "grams"),
            (#"\boz\b"#, "g"),
            (#"\b(?:barrels|barrel)\b"#, "litres"),
            (#"\bbbl\b"#, "L"),
            (#"\bcubic\s+feet\b"#, "cubic metres"),
            (#"\bcfs\b"#, "m³/s"),
            (#"\b(?:short\s+tons|short\s+ton)\b"#, "tonnes"),
            (#"\bmph\b"#, "km/h"),
            (#"\b(?:knots|knot)\b"#, "km/h"),
            (#"\bdegrees?\s+Fahrenheit\b"#, "degrees Celsius"),
            (#"°\s*F\b"#, "°C"),
        ]
        for (pattern, replacement) in replacements {
            output = output.replacingOccurrences(
                of: pattern,
                with: replacement,
                options: [.regularExpression, .caseInsensitive]
            )
        }
        for (index, value) in protectedTerms.enumerated() {
            output = output.replacingOccurrences(of: "__TULIP_METRIC_PROTECTED_\(index)__", with: value)
        }
        return output
    }

    private static func replacingLinearMeasurements(in source: String, conversion: LinearConversion) -> String {
        let pattern = "(\(numberPattern))(\\s+(?:thousand|million|billion))?\\s*[-‐‑]?\\s*\(conversion.pattern)"
        return replacingMatches(in: source, pattern: pattern) { match, current in
            guard let numberRange = Range(match.range(at: 1), in: current),
                  let value = Double(current[numberRange].replacingOccurrences(of: ",", with: "")) else { return "" }
            let scale = Range(match.range(at: 2), in: current).map { String(current[$0]) } ?? ""
            return "\(formatted(value * conversion.factor))\(scale) \(conversion.unit)"
        }
    }

    private static func replacingMatches(
        in source: String,
        pattern: String,
        transform: (NSTextCheckingResult, String) -> String
    ) -> String {
        guard let expression = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) else {
            return source
        }
        var output = source
        let matches = expression.matches(in: source, range: NSRange(source.startIndex..., in: source))
        for match in matches.reversed() {
            guard let range = Range(match.range, in: output) else { continue }
            output.replaceSubrange(range, with: transform(match, source))
        }
        return output
    }

    private static func formatted(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = abs(value) >= 100 ? 0 : abs(value) >= 10 ? 1 : 2
        return formatter.string(from: NSNumber(value: value)) ?? String(value)
    }
}

enum TULIPPalette {
    static let background = Color(red: 0.018, green: 0.02, blue: 0.025)
    static let surface = Color(red: 0.075, green: 0.082, blue: 0.098)
    static let raisedSurface = Color(red: 0.105, green: 0.11, blue: 0.13)
    static let text = Color(white: 0.96)
    static let secondaryText = Color(white: 0.67)
    static let tertiaryText = Color(white: 0.48)
    static let blue = Color(red: 0.43, green: 0.71, blue: 1)
    static let lavender = Color(red: 0.70, green: 0.63, blue: 1)
    static let red = Color(red: 1, green: 0.40, blue: 0.39)
    static let green = Color(red: 0.39, green: 0.84, blue: 0.52)
}

// MARK: - App-wide foundations

/// The canonical layout scale for native TULIP screens. New UI should use these
/// values instead of introducing one-off padding, radius, or touch-target sizes.
enum TULIPSpacing {
    static let zero: CGFloat = 0
    static let hairline: CGFloat = 2
    static let xSmall: CGFloat = 4
    static let small: CGFloat = 8
    static let compact: CGFloat = 12
    static let standard: CGFloat = 16
    static let comfortable: CGFloat = 20
    static let large: CGFloat = 24
    static let xLarge: CGFloat = 32
    static let xxLarge: CGFloat = 40
}

enum TULIPRadius {
    static let compact: CGFloat = 12
    static let control: CGFloat = 18
    static let card: CGFloat = 24
    static let sheet: CGFloat = 34
}

enum TULIPLayout {
    static let screenHorizontalPadding: CGFloat = TULIPSpacing.comfortable
    static let screenHeaderTopPadding: CGFloat = 18
    static let exploreHeaderVerticalOffset: CGFloat = 22
    static let exploreLogoScale: CGFloat = 0.85
    static let contentTopPadding: CGFloat = TULIPSpacing.compact
    static let sectionSpacing: CGFloat = TULIPSpacing.standard
    static let dockContentClearance: CGFloat = 120
    static let minimumTouchTarget: CGFloat = 44
    static let primaryControlHeight: CGFloat = 50
    static let dockHeight: CGFloat = 64
    static let dockHorizontalInset: CGFloat = TULIPSpacing.small
    static let dockOuterHorizontalPadding: CGFloat = 14
    static let cardContentPadding: CGFloat = TULIPSpacing.comfortable
    static let rowHorizontalPadding: CGFloat = TULIPSpacing.standard
    static let rowVerticalPadding: CGFloat = TULIPSpacing.small
    static let searchEmptyTopPadding: CGFloat = 88
    static let resultCanvasMinimumHeight: CGFloat = 560
    static let pinnedHeaderFadeExtension: CGFloat = TULIPSpacing.standard
}

enum TULIPTypography {
    static let screenTitle = Font.title.bold()
    static let screenSubtitle = Font.subheadline
    static let sectionLabel = Font.caption.weight(.bold)
    static let control = Font.subheadline.weight(.semibold)
    static let body = Font.body
    static let supporting = Font.subheadline
    static let metadata = Font.caption
}

enum TULIPMotionStyle {
    case quick
    case standard
    case deliberate
    case sheet
    case feedbackUp
    case feedbackDown
    case reveal
    case ambient
    case startupBreath
    case scrollCue
}

/// One motion vocabulary for the whole app. Every animation is short enough to
/// preserve responsiveness and automatically disappears with Reduce Motion.
enum TULIPMotion {
    static let selectionFeedbackDelay = 0.09
    static let selectionResetDelay = 0.18
    static let footprintAdvanceDelay = 0.10
    static let staggerDelay = 0.035

    static func animation(
        _ style: TULIPMotionStyle,
        reduceMotion: Bool,
        delay: Double = 0
    ) -> Animation? {
        guard !reduceMotion else { return nil }

        let animation: Animation
        switch style {
        case .quick:
            animation = .easeOut(duration: 0.16)
        case .standard:
            animation = .snappy(duration: 0.22)
        case .deliberate:
            animation = .smooth(duration: 0.28)
        case .sheet:
            animation = .easeInOut(duration: 0.26)
        case .feedbackUp:
            animation = .spring(response: 0.16, dampingFraction: 0.55)
        case .feedbackDown:
            animation = .spring(response: 0.18, dampingFraction: 0.74)
        case .reveal:
            animation = .spring(response: 0.68, dampingFraction: 0.82)
        case .ambient:
            animation = .easeInOut(duration: 1.2).repeatForever(autoreverses: true)
        case .startupBreath:
            animation = .easeInOut(duration: 1.5).repeatForever(autoreverses: true)
        case .scrollCue:
            animation = .easeInOut(duration: 1.65).repeatForever(autoreverses: true)
        }
        return delay > 0 ? animation.delay(delay) : animation
    }
}

enum TULIPIconography {
    static let search = "magnifyingglass"
    static let close = "xmark"
    static let clear = "xmark.circle.fill"
    static let externalLink = "arrow.up.right"
    static let relationships = "point.3.connected.trianglepath.dotted"
    static let menu = "line.3.horizontal"
    static let impact = "chart.bar.fill"
    static let actions = "bolt.heart.fill"
    static let carbon = "cloud.fill"
    static let water = "drop.fill"
    static let land = "square.grid.2x2.fill"
    static let materials = "shippingbox.fill"
    static let comparison = "equal.circle.fill"
    static let breakdown = "chart.bar.xaxis"

    static func activity(_ key: String) -> String {
        switch key {
        case "food": "fork.knife"
        case "industry_farming": "fork.knife"
        case "methane": "cloud.fill"
        case "carbon_emission": "smoke.fill"
        case "electricity_generation": "bolt.fill"
        case "conveyance_aviation": "airplane"
        case "freight_logistics": "shippingbox.fill"
        case "food_waste": "trash.fill"
        case "fertilizer_production": "testtube.2"
        case "mining_critical_minerals": "hammer.fill"
        case "built_environment": "building.2.fill"
        case "deforestation_land_use": "tree.fill"
        case "air_conditioning_refrigerants": "snowflake"
        case "plastics_petrochemicals": "waterbottle.fill"
        case "data_centers": "server.rack"
        case "ai_compute": "cpu.fill"
        default: "circle.hexagongrid.fill"
        }
    }
}

@MainActor
private final class TULIPHapticEngine {
    static let shared = TULIPHapticEngine()

    private let selectionGenerator = UISelectionFeedbackGenerator()
    private let lightGenerator = UIImpactFeedbackGenerator(style: .light)
    private let mediumGenerator = UIImpactFeedbackGenerator(style: .medium)
    private let rigidGenerator = UIImpactFeedbackGenerator(style: .rigid)
    private let notificationGenerator = UINotificationFeedbackGenerator()
    private var lastContinuousFeedback = CFAbsoluteTimeGetCurrent()

    private init() {
        prepare()
    }

    func prepare() {
        selectionGenerator.prepare()
        lightGenerator.prepare()
        mediumGenerator.prepare()
        rigidGenerator.prepare()
        notificationGenerator.prepare()
    }

    func selection() {
        guard isEnabled else { return }
        selectionGenerator.selectionChanged()
        selectionGenerator.prepare()
    }

    func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle, intensity: CGFloat = 1) {
        guard isEnabled else { return }
        let generator: UIImpactFeedbackGenerator
        switch style {
        case .medium, .heavy:
            generator = mediumGenerator
        case .rigid:
            generator = rigidGenerator
        default:
            generator = lightGenerator
        }
        generator.impactOccurred(intensity: min(1, max(0, intensity)))
        generator.prepare()
    }

    func success() {
        guard isEnabled else { return }
        notificationGenerator.notificationOccurred(.success)
        notificationGenerator.prepare()
    }

    func continuousTick(minimumInterval: CFTimeInterval) {
        guard isEnabled else { return }
        let now = CFAbsoluteTimeGetCurrent()
        guard now - lastContinuousFeedback >= minimumInterval else { return }
        lastContinuousFeedback = now
        selection()
    }

    func continuousImpact(
        _ style: UIImpactFeedbackGenerator.FeedbackStyle,
        intensity: CGFloat,
        minimumInterval: CFTimeInterval
    ) {
        guard isEnabled else { return }
        let now = CFAbsoluteTimeGetCurrent()
        guard now - lastContinuousFeedback >= minimumInterval else { return }
        lastContinuousFeedback = now
        impact(style, intensity: intensity)
    }

    private var isEnabled: Bool {
        UserDefaults.standard.object(forKey: "TULIPHapticsEnabled") as? Bool ?? true
    }
}

@MainActor
enum TULIPHaptics {
    static func prepare() {
        TULIPHapticEngine.shared.prepare()
    }

    static func selection() {
        TULIPHapticEngine.shared.selection()
    }

    static func impact(
        _ style: UIImpactFeedbackGenerator.FeedbackStyle = .light,
        intensity: CGFloat = 1
    ) {
        TULIPHapticEngine.shared.impact(style, intensity: intensity)
    }

    static func button() {
        impact(.light, intensity: 0.72)
    }

    static func startOverHold(progress: CGFloat) {
        let clampedProgress = min(1, max(0, progress))
        let style: UIImpactFeedbackGenerator.FeedbackStyle = clampedProgress >= 0.7 ? .rigid : .light
        impact(style, intensity: 0.24 + (0.74 * clampedProgress))
    }

    static func inspector(expanding: Bool) {
        impact(expanding ? .medium : .light, intensity: expanding ? 0.82 : 0.66)
    }

    static func continuousTick() {
        TULIPHapticEngine.shared.continuousTick(minimumInterval: 0.095)
    }

    static func rotationTick() {
        TULIPHapticEngine.shared.continuousImpact(
            .rigid,
            intensity: 0.58,
            minimumInterval: 0.052
        )
    }

    static func rotationMomentumTick() {
        TULIPHapticEngine.shared.continuousImpact(
            .light,
            intensity: 0.4,
            minimumInterval: 0.07
        )
    }

    static func success() {
        TULIPHapticEngine.shared.success()
    }
}

enum TULIPDateFormatting {
    private static let exactInput: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    private static let exactOutput: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.dateFormat = "yyyy-MMM-dd"
        return formatter
    }()

    private static let monthInput: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.dateFormat = "MMMM yyyy"
        return formatter
    }()

    private static let monthOutput: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.dateFormat = "yyyy-MMM"
        return formatter
    }()

    static func display(_ rawValue: String) -> String {
        let value = rawValue
            .replacingOccurrences(of: "Last Updated:", with: "", options: .caseInsensitive)
            .replacingOccurrences(of: "Last updated", with: "", options: .caseInsensitive)
            .replacingOccurrences(of: "Reviewed", with: "", options: .caseInsensitive)
            .trimmingCharacters(in: .whitespacesAndNewlines)

        guard !value.isEmpty else { return rawValue }
        if let date = exactInput.date(from: value) {
            return exactOutput.string(from: date)
        }
        if let date = monthInput.date(from: value) {
            // Several source feeds expose only month-level freshness. Preserve
            // that precision instead of inventing a day.
            return monthOutput.string(from: date)
        }
        return value
    }
}

enum TULIPMaterialRole {
    case floatingChrome
    case mediaOverlay
}

struct TULIPGlassModifier<S: InsettableShape>: ViewModifier {
    let shape: S
    let role: TULIPMaterialRole
    let interactive: Bool

    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    @ViewBuilder
    func body(content: Content) -> some View {
        if reduceTransparency {
            content
                .background(TULIPPalette.raisedSurface, in: shape)
                .overlay {
                    shape.stroke(Color.white.opacity(0.12), lineWidth: 0.6)
                }
        } else if #available(iOS 26.0, *) {
            if interactive {
                content
                    .glassEffect(nativeGlass.interactive(), in: shape)
            } else {
                content
                    .glassEffect(nativeGlass, in: shape)
            }
        } else {
            content
                .background(.ultraThinMaterial, in: shape)
                .background(fallbackTint, in: shape)
                .overlay {
                    shape.stroke(Color.white.opacity(0.1), lineWidth: 0.6)
                }
        }
    }

    @available(iOS 26.0, *)
    private var nativeGlass: Glass {
        switch role {
        case .floatingChrome:
            .regular
        case .mediaOverlay:
            .clear
        }
    }

    private var fallbackTint: Color {
        switch role {
        case .floatingChrome:
            Color.black.opacity(0.20)
        case .mediaOverlay:
            Color.black.opacity(0.10)
        }
    }
}

struct TULIPSelectableChromeModifier<S: InsettableShape>: ViewModifier {
    let shape: S
    let isSelected: Bool
    let selectionFill: Color

    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    @ViewBuilder
    func body(content: Content) -> some View {
        if reduceTransparency {
            content
                .background(TULIPPalette.raisedSurface, in: shape)
                .background(isSelected ? selectionFill.opacity(0.78) : Color.clear, in: shape)
                .overlay {
                    shape.stroke(Color.white.opacity(0.12), lineWidth: 0.6)
                }
        } else if #available(iOS 26.0, *) {
            content.glassEffect(
                .regular
                    .tint(isSelected ? selectionFill : nil)
                    .interactive(),
                in: shape
            )
        } else {
            content
                .background(.ultraThinMaterial, in: shape)
                .background(
                    isSelected ? selectionFill.opacity(0.58) : Color.black.opacity(0.20),
                    in: shape
                )
                .overlay {
                    shape.stroke(Color.white.opacity(0.10), lineWidth: 0.6)
                }
        }
    }
}

extension View {
    func tulipFloatingChrome<S: InsettableShape>(
        in shape: S,
        interactive: Bool = false
    ) -> some View {
        modifier(TULIPGlassModifier(shape: shape, role: .floatingChrome, interactive: interactive))
    }

    func tulipMediaOverlay<S: InsettableShape>(
        in shape: S,
        interactive: Bool = false
    ) -> some View {
        modifier(TULIPGlassModifier(shape: shape, role: .mediaOverlay, interactive: interactive))
    }

    func tulipSolidControl<S: InsettableShape>(
        in shape: S,
        fill: Color = TULIPPalette.surface
    ) -> some View {
        background(fill, in: shape)
            .overlay {
                shape.stroke(Color.white.opacity(0.08), lineWidth: 0.6)
            }
    }

    func tulipSelectableChrome<S: InsettableShape>(
        in shape: S,
        isSelected: Bool,
        selectionFill: Color
    ) -> some View {
        modifier(
            TULIPSelectableChromeModifier(
                shape: shape,
                isSelected: isSelected,
                selectionFill: selectionFill
            )
        )
    }

    /// Applies the iOS 27 status-bar treatment when this target is compiled
    /// with the iOS 27 SDK. The project-level SDK condition keeps the source
    /// buildable with Xcode 26 while preserving the iOS 17 deployment target.
    @ViewBuilder
    func tulipIOS27StatusBarStyle() -> some View {
#if TULIP_IOS27_SDK
        if #available(iOS 27.0, *) {
            toolbarColorScheme(.dark, for: .statusBar)
        } else {
            self
        }
#else
        self
#endif
    }

    /// Lets long-form evidence use iOS 27's interactive system text selection.
    /// The modifier already back-deploys, so older supported systems retain the
    /// familiar callout-based selection behavior.
    func tulipSelectableEvidence() -> some View {
        textSelection(.enabled)
    }

    /// Coordinates row swipe actions in custom ScrollView/LazyVStack layouts
    /// on iOS 27. Earlier systems keep the rows and their accessibility actions.
    @ViewBuilder
    func tulipIOS27SwipeActionsContainer() -> some View {
#if TULIP_IOS27_SDK
        if #available(iOS 27.0, *) {
            swipeActionsContainer()
        } else {
            self
        }
#else
        self
#endif
    }

    /// Allows a navigation bar to yield space as content scrolls in resizable
    /// iPhone windows while leaving earlier releases unchanged.
    @ViewBuilder
    func tulipIOS27AdaptiveNavigationBar() -> some View {
#if TULIP_IOS27_SDK
        if #available(iOS 27.0, *) {
            toolbarMinimizeBehavior(.onScrollDown, for: .navigationBar)
        } else {
            self
        }
#else
        self
#endif
    }

    func tulipDestructiveConfirmation<Item: Identifiable>(
        item: Binding<Item?>,
        title: String,
        message: String,
        confirmTitle: String,
        onConfirm: @escaping (Item) -> Void
    ) -> some View {
        modifier(
            TULIPDestructiveConfirmationModifier(
                item: item,
                title: title,
                message: message,
                confirmTitle: confirmTitle,
                onConfirm: onConfirm
            )
        )
    }

    func tulipItemAlert<Item: Identifiable>(
        item: Binding<Item?>,
        title: String,
        message: String
    ) -> some View {
        modifier(TULIPItemAlertModifier(item: item, title: title, message: message))
    }
}

private struct TULIPDestructiveConfirmationModifier<Item: Identifiable>: ViewModifier {
    @Binding var item: Item?
    let title: String
    let message: String
    let confirmTitle: String
    let onConfirm: (Item) -> Void

    @ViewBuilder
    func body(content: Content) -> some View {
#if TULIP_IOS27_SDK
        if #available(iOS 27.0, *) {
            content.confirmationDialog(
                Text(title),
                item: $item,
                titleVisibility: .visible
            ) { value in
                Button(confirmTitle, role: .destructive) {
                    onConfirm(value)
                }
                Button("Cancel", role: .cancel) { }
            } message: { _ in
                Text(message)
            }
        } else {
            legacyConfirmation(content)
        }
#else
        legacyConfirmation(content)
#endif
    }

    private func legacyConfirmation(_ content: Content) -> some View {
        content.confirmationDialog(
            title,
            isPresented: Binding(
                get: { item != nil },
                set: { if !$0 { item = nil } }
            ),
            titleVisibility: .visible
        ) {
            Button(confirmTitle, role: .destructive) {
                guard let value = item else { return }
                onConfirm(value)
                item = nil
            }
            Button("Cancel", role: .cancel) {
                item = nil
            }
        } message: {
            Text(message)
        }
    }
}

private struct TULIPItemAlertModifier<Item: Identifiable>: ViewModifier {
    @Binding var item: Item?
    let title: String
    let message: String

    @ViewBuilder
    func body(content: Content) -> some View {
#if TULIP_IOS27_SDK
        if #available(iOS 27.0, *) {
            content.alert(Text(title), item: $item) { _ in
                Button("OK", role: .cancel) { }
            } message: { _ in
                Text(message)
            }
        } else {
            legacyAlert(content)
        }
#else
        legacyAlert(content)
#endif
    }

    private func legacyAlert(_ content: Content) -> some View {
        content.alert(
            title,
            isPresented: Binding(
                get: { item != nil },
                set: { if !$0 { item = nil } }
            )
        ) {
            Button("OK", role: .cancel) {
                item = nil
            }
        } message: {
            Text(message)
        }
    }
}

struct TULIPGlassGroup<Content: View>: View {
    let spacing: CGFloat
    @ViewBuilder let content: Content

    init(spacing: CGFloat = TULIPSpacing.small, @ViewBuilder content: () -> Content) {
        self.spacing = spacing
        self.content = content()
    }

    @ViewBuilder
    var body: some View {
        if #available(iOS 26.0, *) {
            GlassEffectContainer(spacing: spacing) {
                content
            }
        } else {
            content
        }
    }
}

/// Keeps scrolling content legible beneath pinned chrome without introducing
/// another material layer. Content progressively disappears as it approaches
/// the top edge while remaining faintly visible at the lower transition edge.
struct TULIPTopContentFade: View {
    var body: some View {
        LinearGradient(
            stops: [
                .init(color: Color.black, location: 0),
                .init(color: Color.black.opacity(0.92), location: 0.56),
                .init(color: Color.black.opacity(0.58), location: 0.82),
                .init(color: Color.black.opacity(0.05), location: 1),
            ],
            startPoint: .top,
            endPoint: .bottom
        )
        .ignoresSafeArea(edges: .top)
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

struct TULIPScreenHeader<Trailing: View>: View {
    let title: String
    let subtitle: String?
    @ViewBuilder let trailing: Trailing

    init(
        _ title: String,
        subtitle: String? = nil,
        @ViewBuilder trailing: () -> Trailing
    ) {
        self.title = title
        self.subtitle = subtitle
        self.trailing = trailing()
    }

    var body: some View {
        HStack(alignment: .top, spacing: TULIPSpacing.standard) {
            VStack(alignment: .leading, spacing: TULIPSpacing.xSmall) {
                Text(title)
                    .font(TULIPTypography.screenTitle)
                    .foregroundStyle(TULIPPalette.text)
                if let subtitle {
                    Text(subtitle)
                        .font(TULIPTypography.screenSubtitle)
                        .foregroundStyle(TULIPPalette.secondaryText)
                }
            }
            Spacer(minLength: TULIPSpacing.compact)
            trailing
        }
        .padding(.horizontal, TULIPLayout.screenHorizontalPadding)
        .padding(.top, TULIPLayout.screenHeaderTopPadding)
    }
}

extension TULIPScreenHeader where Trailing == EmptyView {
    init(_ title: String, subtitle: String? = nil) {
        self.init(title, subtitle: subtitle) { EmptyView() }
    }
}

struct TULIPIconButton: View {
    let systemName: String
    let accessibilityLabel: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(TULIPPalette.text)
                .frame(width: TULIPLayout.minimumTouchTarget, height: TULIPLayout.minimumTouchTarget)
        }
        .buttonStyle(.plain)
        .contentShape(Rectangle())
        .accessibilityLabel(accessibilityLabel)
    }
}

struct TULIPSection<Content: View>: View {
    let title: String
    let titleColor: Color
    let systemImage: String?
    @ViewBuilder let content: Content

    init(
        _ title: String,
        titleColor: Color = TULIPPalette.blue,
        systemImage: String? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.title = title
        self.titleColor = titleColor
        self.systemImage = systemImage
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: TULIPSpacing.compact) {
            HStack(spacing: TULIPSpacing.small) {
                if let systemImage {
                    Image(systemName: systemImage)
                        .font(.caption.weight(.bold))
                }
                Text(title.uppercased())
                    .font(TULIPTypography.sectionLabel)
                    .tracking(1.5)
            }
            .foregroundStyle(titleColor)
            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(TULIPLayout.cardContentPadding)
        .background(
            TULIPPalette.surface,
            in: RoundedRectangle(cornerRadius: TULIPRadius.card, style: .continuous)
        )
    }
}

struct TULIPScoreBadge: View {
    let score: Double
    let band: String?
    let compactness: CGFloat

    init(score: Double, band: String?, compactness: CGFloat = 0) {
        self.score = score
        self.band = band
        self.compactness = min(1, max(0, compactness))
    }

    var body: some View {
        HStack(spacing: TULIPSpacing.small - (4 * compactness)) {
            Text(score.formatted(.number.precision(.fractionLength(1))))
                .font(.system(size: 30 - (8 * compactness), weight: .medium, design: .rounded))
                .lineLimit(1)
                .fixedSize(horizontal: true, vertical: false)
                .foregroundStyle(.white)
            if let band, !band.isEmpty {
                Text(band)
                    .font(.system(size: 12 - (1.5 * compactness), weight: .semibold))
                    .lineLimit(1)
                    .fixedSize(horizontal: true, vertical: false)
                    .foregroundStyle(.white.opacity(0.88))
                    .padding(.horizontal, TULIPSpacing.small - (3 * compactness))
                    .padding(.vertical, TULIPSpacing.xSmall - compactness)
                    .background(.black.opacity(0.2), in: Capsule())
            }
        }
        .padding(.leading, TULIPSpacing.standard - (6 * compactness))
        .padding(.trailing, TULIPSpacing.small - (2 * compactness))
        .padding(.vertical, TULIPSpacing.small - (2 * compactness))
        .background(
            LinearGradient(
                colors: [
                    Color(red: 0.43, green: 0.68, blue: 1),
                    Color(red: 0.70, green: 0.60, blue: 1),
                    Color(red: 1, green: 0.42, blue: 0.43),
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            ),
            in: Capsule(style: .continuous)
        )
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("TULIP score \(score.formatted(.number.precision(.fractionLength(1)))) out of 10\(band.map { ", \($0)" } ?? "")")
    }
}

struct TULIPEmptyState: View {
    let title: String
    let message: String
    let systemImage: String?

    init(title: String, message: String, systemImage: String? = nil) {
        self.title = title
        self.message = message
        self.systemImage = systemImage
    }

    var body: some View {
        ContentUnavailableView {
            Label {
                Text(title)
            } icon: {
                if let systemImage {
                    Image(systemName: systemImage)
                } else {
                    Image("TULIPMonogram")
                        .renderingMode(.template)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 52, height: 52)
                        .accessibilityHidden(true)
                }
            }
        } description: {
            Text(message)
        }
        .foregroundStyle(TULIPPalette.secondaryText)
    }
}
