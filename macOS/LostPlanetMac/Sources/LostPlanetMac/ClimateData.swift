import SwiftUI

enum ClimateSphere: String, CaseIterable, Identifiable, Hashable {
    case all = "All systems"
    case atmosphere = "Atmosphere"
    case oceans = "Oceans"
    case cryosphere = "Cryosphere"
    case biosphere = "Biosphere"
    case society = "Society"

    var id: Self { self }

    var symbol: String {
        switch self {
        case .all: "circle.grid.cross"
        case .atmosphere: "cloud.sun"
        case .oceans: "water.waves"
        case .cryosphere: "snowflake"
        case .biosphere: "leaf"
        case .society: "person.3"
        }
    }

    var color: Color {
        switch self {
        case .all: .white
        case .atmosphere: Color(red: 0.38, green: 0.72, blue: 1.0)
        case .oceans: Color(red: 0.18, green: 0.78, blue: 0.92)
        case .cryosphere: Color(red: 0.73, green: 0.82, blue: 1.0)
        case .biosphere: Color(red: 0.47, green: 0.84, blue: 0.58)
        case .society: Color(red: 1.0, green: 0.70, blue: 0.37)
        }
    }
}

struct ClimateNode: Identifiable, Hashable {
    let id: String
    let name: String
    let sphere: ClimateSphere
    let urgency: Double
    let summary: String
    let drivers: [String]
    let effects: [String]
    let nextNodeID: String?
    let nextReason: String?
    let position: CGPoint
}

enum ClimateCatalog {
    static let nodes: [ClimateNode] = [
        ClimateNode(
            id: "carbon-emissions",
            name: "Carbon Emissions",
            sphere: .atmosphere,
            urgency: 8.8,
            summary: "Human-caused carbon emissions accumulate in the atmosphere and increase heat retained by the Earth system.",
            drivers: ["Fossil fuel combustion", "Cement production", "Land-use change"],
            effects: ["Global Temperature", "Ocean Heat Content"],
            nextNodeID: "global-temperature",
            nextReason: "Accumulated greenhouse gases raise the global energy imbalance.",
            position: CGPoint(x: 0.18, y: 0.29)
        ),
        ClimateNode(
            id: "global-temperature",
            name: "Global Temperature",
            sphere: .atmosphere,
            urgency: 9.1,
            summary: "The global mean temperature anomaly raises the baseline for heat extremes and pushes connected ocean, ice, and ecological systems.",
            drivers: ["Carbon Emissions", "Methane", "Land-ocean warming contrast"],
            effects: ["Marine Heatwaves", "Glacier Mass Loss", "Extreme-Heat Days"],
            nextNodeID: "marine-heatwaves",
            nextReason: "Most excess heat enters the ocean, raising the likelihood and persistence of marine heatwaves.",
            position: CGPoint(x: 0.40, y: 0.43)
        ),
        ClimateNode(
            id: "marine-heatwaves",
            name: "Marine Heatwaves",
            sphere: .oceans,
            urgency: 8.5,
            summary: "Sustained periods of unusually warm ocean conditions stress marine ecosystems and disrupt fisheries.",
            drivers: ["Global Temperature", "Ocean stratification", "Current anomalies"],
            effects: ["Coral Bleaching", "Fishery disruption"],
            nextNodeID: "coral-bleaching",
            nextReason: "Prolonged thermal stress causes corals to expel their symbiotic algae.",
            position: CGPoint(x: 0.62, y: 0.30)
        ),
        ClimateNode(
            id: "coral-bleaching",
            name: "Coral Bleaching",
            sphere: .biosphere,
            urgency: 8.7,
            summary: "Repeated bleaching reduces reef growth, habitat complexity, coastal protection, and recovery capacity.",
            drivers: ["Marine Heatwaves", "Ocean Acidification"],
            effects: ["Reef habitat loss", "Coastal livelihood risk"],
            nextNodeID: "coastal-livelihood-risk",
            nextReason: "Degraded reefs reduce fish habitat, tourism value, and natural coastal protection.",
            position: CGPoint(x: 0.81, y: 0.44)
        ),
        ClimateNode(
            id: "glacier-mass-loss",
            name: "Glacier Mass Loss",
            sphere: .cryosphere,
            urgency: 8.9,
            summary: "Persistent ice loss raises sea level and changes the timing and reliability of downstream meltwater.",
            drivers: ["Global Temperature", "Rain-on-snow events"],
            effects: ["Sea Level Rise", "Meltwater insecurity"],
            nextNodeID: "sea-level-rise",
            nextReason: "Land-ice mass loss transfers water to the ocean.",
            position: CGPoint(x: 0.57, y: 0.67)
        ),
        ClimateNode(
            id: "sea-level-rise",
            name: "Sea Level Rise",
            sphere: .oceans,
            urgency: 8.6,
            summary: "Rising mean sea level increases the reach of storm surge, tidal flooding, erosion, and saltwater intrusion.",
            drivers: ["Glacier Mass Loss", "Ocean thermal expansion"],
            effects: ["Coastal inundation", "Infrastructure exposure"],
            nextNodeID: "coastal-livelihood-risk",
            nextReason: "More frequent flooding damages homes, infrastructure, ecosystems, and local economies.",
            position: CGPoint(x: 0.76, y: 0.72)
        ),
        ClimateNode(
            id: "coastal-livelihood-risk",
            name: "Coastal Livelihood Risk",
            sphere: .society,
            urgency: 8.1,
            summary: "Compounding reef loss and coastal flooding threaten food security, income, housing, and insurability.",
            drivers: ["Coral Bleaching", "Sea Level Rise", "Fishery disruption"],
            effects: ["Displacement pressure", "Adaptation finance gap"],
            nextNodeID: nil,
            nextReason: nil,
            position: CGPoint(x: 0.91, y: 0.59)
        )
    ]

    static let links: [(String, String)] = [
        ("carbon-emissions", "global-temperature"),
        ("global-temperature", "marine-heatwaves"),
        ("marine-heatwaves", "coral-bleaching"),
        ("global-temperature", "glacier-mass-loss"),
        ("glacier-mass-loss", "sea-level-rise"),
        ("coral-bleaching", "coastal-livelihood-risk"),
        ("sea-level-rise", "coastal-livelihood-risk")
    ]

    static func node(id: String?) -> ClimateNode? {
        nodes.first { $0.id == id }
    }
}
