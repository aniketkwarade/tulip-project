import AppKit
import Foundation

struct SymbolExport {
    let fileName: String
    let systemName: String
    let pointSize: CGFloat
    let canvasSize: CGFloat
    let weight: NSFont.Weight
}

let exports: [SymbolExport] = [
    .init(fileName: "fork-knife.png", systemName: "fork.knife", pointSize: 20, canvasSize: 28, weight: .semibold),
    .init(fileName: "cloud-fill.png", systemName: "cloud.fill", pointSize: 20, canvasSize: 28, weight: .semibold),
    .init(fileName: "smoke-fill.png", systemName: "smoke.fill", pointSize: 20, canvasSize: 28, weight: .semibold),
    .init(fileName: "bolt-fill.png", systemName: "bolt.fill", pointSize: 20, canvasSize: 28, weight: .semibold),
    .init(fileName: "bus-fill.png", systemName: "bus.fill", pointSize: 20, canvasSize: 28, weight: .semibold),
    .init(fileName: "airplane.png", systemName: "airplane", pointSize: 20, canvasSize: 28, weight: .semibold),
    .init(fileName: "takeoutbag-cup-straw-fill.png", systemName: "takeoutbag.and.cup.and.straw.fill", pointSize: 20, canvasSize: 28, weight: .semibold),
    .init(fileName: "tshirt-fill.png", systemName: "tshirt.fill", pointSize: 20, canvasSize: 28, weight: .semibold),
    .init(fileName: "shippingbox-fill.png", systemName: "shippingbox.fill", pointSize: 20, canvasSize: 28, weight: .semibold),
    .init(fileName: "trash-fill.png", systemName: "trash.fill", pointSize: 20, canvasSize: 28, weight: .semibold),
    .init(fileName: "testtube-2.png", systemName: "testtube.2", pointSize: 20, canvasSize: 28, weight: .semibold),
    .init(fileName: "hammer-fill.png", systemName: "hammer.fill", pointSize: 20, canvasSize: 28, weight: .semibold),
    .init(fileName: "building-2-fill.png", systemName: "building.2.fill", pointSize: 20, canvasSize: 28, weight: .semibold),
    .init(fileName: "tree-fill.png", systemName: "tree.fill", pointSize: 20, canvasSize: 28, weight: .semibold),
    .init(fileName: "waterbottle-fill.png", systemName: "waterbottle.fill", pointSize: 20, canvasSize: 28, weight: .semibold),
    .init(fileName: "server-rack.png", systemName: "server.rack", pointSize: 20, canvasSize: 28, weight: .semibold),
    .init(fileName: "cpu-fill.png", systemName: "cpu.fill", pointSize: 20, canvasSize: 28, weight: .semibold),
    .init(fileName: "snowflake.png", systemName: "snowflake", pointSize: 20, canvasSize: 28, weight: .semibold),
    .init(fileName: "sparkles.png", systemName: "sparkles", pointSize: 18, canvasSize: 24, weight: .semibold),
    .init(fileName: "person-fill.png", systemName: "person.fill", pointSize: 12, canvasSize: 16, weight: .bold),
    .init(fileName: "person-3-fill.png", systemName: "person.3.fill", pointSize: 12, canvasSize: 16, weight: .bold),
    .init(fileName: "building-columns-fill.png", systemName: "building.columns.fill", pointSize: 12, canvasSize: 16, weight: .bold),
    .init(fileName: "arrow-up-right.png", systemName: "arrow.up.right", pointSize: 12, canvasSize: 16, weight: .bold),
]

guard CommandLine.arguments.count == 2 else {
    fputs("Usage: swift export-ios-activity-symbols.swift OUTPUT_DIRECTORY\n", stderr)
    exit(64)
}

let outputDirectory = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
try FileManager.default.createDirectory(at: outputDirectory, withIntermediateDirectories: true)

for item in exports {
    let scale: CGFloat = 4
    let canvasPixels = Int(item.canvasSize * scale)
    let config = NSImage.SymbolConfiguration(
        pointSize: item.pointSize * scale,
        weight: item.weight
    )

    guard let source = NSImage(systemSymbolName: item.systemName, accessibilityDescription: nil),
          let symbol = source.withSymbolConfiguration(config),
          let bitmap = NSBitmapImageRep(
            bitmapDataPlanes: nil,
            pixelsWide: canvasPixels,
            pixelsHigh: canvasPixels,
            bitsPerSample: 8,
            samplesPerPixel: 4,
            hasAlpha: true,
            isPlanar: false,
            colorSpaceName: .deviceRGB,
            bytesPerRow: 0,
            bitsPerPixel: 0
          ) else {
        fputs("Unable to render SF Symbol: \(item.systemName)\n", stderr)
        exit(1)
    }

    bitmap.size = NSSize(width: canvasPixels, height: canvasPixels)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
    NSColor.clear.setFill()
    NSRect(x: 0, y: 0, width: canvasPixels, height: canvasPixels).fill(using: .copy)

    let symbolSize = symbol.size
    let targetRect = NSRect(
        x: (CGFloat(canvasPixels) - symbolSize.width) / 2,
        y: (CGFloat(canvasPixels) - symbolSize.height) / 2,
        width: symbolSize.width,
        height: symbolSize.height
    )
    symbol.draw(in: targetRect, from: .zero, operation: .sourceOver, fraction: 1)
    NSGraphicsContext.restoreGraphicsState()

    guard let png = bitmap.representation(using: .png, properties: [:]) else {
        fputs("Unable to encode SF Symbol: \(item.systemName)\n", stderr)
        exit(1)
    }
    try png.write(to: outputDirectory.appendingPathComponent(item.fileName))
}

print("Exported \(exports.count) native symbols to \(outputDirectory.path)")
