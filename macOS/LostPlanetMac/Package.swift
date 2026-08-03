// swift-tools-version:4.0

import PackageDescription

let package = Package(
    name: "LostPlanetMac",
    products: [
        .executable(name: "LostPlanetMac", targets: ["LostPlanetMac"])
    ],
    targets: [
        .target(
            name: "LostPlanetMac",
            path: "Sources/LostPlanetMac"
        )
    ]
)
