import Foundation
import Combine

@MainActor
final class TULIPBookmarkStore: ObservableObject {
    @Published private(set) var names: [String]

    private let defaults: UserDefaults
    private let storageKey = "TULIPBookmarkedTopics"

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        names = defaults.stringArray(forKey: storageKey) ?? []
    }

    func contains(_ name: String) -> Bool {
        names.contains(name)
    }

    func toggle(_ name: String) {
        if let index = names.firstIndex(of: name) {
            names.remove(at: index)
        } else {
            names.append(name)
            names.sort { $0.localizedCaseInsensitiveCompare($1) == .orderedAscending }
        }
        defaults.set(names, forKey: storageKey)
    }

    func remove(_ name: String) {
        guard let index = names.firstIndex(of: name) else { return }
        names.remove(at: index)
        defaults.set(names, forKey: storageKey)
    }
}

struct TULIPNodeCatalogEntry: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let sphere: String
}

struct TULIPRelationship: Codable, Hashable, Identifiable {
    let name: String
    let explanation: String
    let edgeId: String?

    var id: String { edgeId ?? "\(name)-\(explanation)" }

    init(from decoder: Decoder) throws {
        if var values = try? decoder.unkeyedContainer() {
            name = try values.decode(String.self)
            explanation = try values.decode(String.self)
            edgeId = try values.decodeIfPresent(String.self)
            return
        }

        let values = try decoder.container(keyedBy: CodingKeys.self)
        name = try values.decode(String.self, forKey: .name)
        explanation = try values.decode(String.self, forKey: .explanation)
        edgeId = try values.decodeIfPresent(String.self, forKey: .edgeId)
    }

    func encode(to encoder: Encoder) throws {
        var values = encoder.unkeyedContainer()
        try values.encode(name)
        try values.encode(explanation)
        if let edgeId {
            try values.encode(edgeId)
        } else {
            try values.encodeNil()
        }
    }

    private enum CodingKeys: String, CodingKey {
        case name, explanation, edgeId
    }
}

struct TULIPImpactSummary: Codable, Hashable {
    let severity: String?
    let reach: String?
    let summary: String?
    let domains: [String]?
    let consequences: [String]?
    let hiddenCost: String?
    let whoPays: String?
    let physicalLimit: String?
}

struct TULIPResponseSummary: Codable, Hashable {
    let defaultDriver: String?
    let levers: [String]?
}

struct TULIPMeasurement: Codable, Hashable {
    let metric: String?
    let unit: String?
    let geography: String?
    let cadence: String?
    let method: String?
    let uncertainty: String?
    let boundary: String?
}

struct TULIPSource: Codable, Hashable {
    let label: String
    let url: String
}

struct TULIPRecentOccurrence: Codable, Hashable, Identifiable {
    let id: String
    let date: String
    let place: String
    let title: String
    let status: String?
    let statusLabel: String?
    let statusNote: String?
    let summary: String?
    let sources: [TULIPSource]
}

struct TULIPRecentOccurrences: Codable, Hashable {
    let title: String?
    let profileKind: String?
    let occurrences: [TULIPRecentOccurrence]
}

struct TULIPInspectorProfile: Codable, Hashable, Identifiable {
    var id: String { name }

    let name: String
    let sphere: String
    let updated: String?
    let description: String?
    let urgency: Double?
    let urgencyBand: String?
    let incoming: [TULIPRelationship]
    let outgoing: [TULIPRelationship]
    let human: TULIPImpactSummary?
    let planet: TULIPImpactSummary?
    let response: TULIPResponseSummary?
    let measurement: TULIPMeasurement?
    let recentOccurrences: TULIPRecentOccurrences?
    let sources: [[String]]?
}

struct TULIPActivityProfile: Codable, Hashable, Identifiable {
    var id: String { key }

    let key: String
    let label: String
    let description: String
    let lens: TULIPActivityLens
    let actions: TULIPActivityActions
    let lensKey: String?
}

struct TULIPActivityLens: Codable, Hashable {
    let title: String?
    let eyebrow: String?
    let intro: String?
    let unitLabel: String?
    let axisMax: Double?
    let axisTicks: [Double]?
    let scaleNote: String?
    let takeaway: String?
    let items: [TULIPActivityItem]?
    let groups: [TULIPActivityGroup]?

    var flattenedItems: [TULIPActivityItem] {
        if let items, !items.isEmpty { return items }
        return groups?.flatMap(\.items) ?? []
    }
}

struct TULIPActivityGroup: Codable, Hashable, Identifiable {
    let key: String
    let title: String?
    let meta: String?
    let items: [TULIPActivityItem]

    var id: String { key }
}

struct TULIPActivityItem: Codable, Hashable, Identifiable {
    let label: String
    let value: Double
    let note: String?
    let typicalPortion: String?
    let emphasis: String?
    let speculative: Bool?
    let excludeFromScale: Bool?
    let hideBar: Bool?

    var id: String { label }
}

struct TULIPActivityActions: Codable, Hashable {
    let title: String?
    let definition: String?
    let whyItMatters: String?
    let confidence: String?
    let confidenceNote: String?
    let strongestAction: String?
    let personal: [String]?
    let community: [String]?
    let policy: [String]?
    let metrics: [String]?
    let caution: String?
}

struct TULIPFootprintModel: Codable {
    let questions: [TULIPFootprintQuestion]
    let baselineSelections: [String: String]
    let labels: [String: String]
    let benchmarks: TULIPFootprintBenchmarks
    let physicalFactors: TULIPFootprintPhysicalFactors
    let annualReferences: TULIPFootprintAnnualReferences
    let modules: [TULIPFootprintModule]
}

struct TULIPFootprintQuestion: Codable, Identifiable, Hashable {
    var id: String { key }

    let key: String
    let title: String
    let help: String?
    let role: String
    let module: String?
    let insight: TULIPFootprintInsightGuidance?
    let options: [TULIPFootprintOption]
}

struct TULIPFootprintInsightGuidance: Codable, Hashable {
    let title: String
    let action: String
    let maintainTitle: String
    let maintainAction: String
}

struct TULIPFootprintOption: Codable, Identifiable, Hashable {
    var id: String { value }

    let value: String
    let label: String
    let note: String?
    let co2: Double?
    let nature: Double?
    let water: Double?
    let material: Double?
    let homeBaselineCarbon: Double?
    let gridMultiplier: Double?
    let transportMultiplier: Double?
    let flightsMultiplier: Double?
    let hvacMultiplier: Double?
    let homeMultiplier: Double?
    let homeDemandMultiplier: Double?
    let homeUseMultiplier: Double?
}

struct TULIPFootprintBenchmarks: Codable {
    let carbon: TULIPFootprintBenchmark
    let nature: TULIPFootprintBenchmark
    let water: TULIPFootprintBenchmark
    let material: TULIPFootprintBenchmark
}

struct TULIPFootprintBenchmark: Codable {
    let low: Double
    let average: Double
    let high: Double
}

struct TULIPFootprintPhysicalFactors: Codable {
    let landM2PerPoint: Double
    let waterM3PerPoint: Double
    let materialTonnesPerPoint: Double
}

struct TULIPFootprintAnnualReferences: Codable {
    let carbonTonnes: Double
    let waterM3: Double
    let landM2: Double
    let materialTonnes: Double
}

struct TULIPFootprintModule: Codable, Identifiable {
    let key: String
    let label: String

    var id: String { key }
}

struct TULIPFootprintResult: Equatable {
    let carbon: Double
    let land: Double
    let water: Double
    let material: Double
}

struct TULIPFootprintCarbonContribution: Identifiable, Equatable {
    var id: String { key }

    let key: String
    let label: String
    let carbon: Double
}

struct TULIPFootprintInsight: Identifiable, Equatable {
    var id: String { categoryKey }

    let categoryKey: String
    let title: String
    let action: String
    let rationale: String
    let carbonReduction: Double
    let isMaintenance: Bool
}

enum TULIPFootprintCalculator {
    static func calculate(
        model: TULIPFootprintModel,
        answers: [String: String]
    ) -> TULIPFootprintResult {
        func question(_ key: String) -> TULIPFootprintQuestion? {
            model.questions.first { $0.key == key }
        }
        func option(_ key: String) -> TULIPFootprintOption? {
            let selected = answers[key] ?? model.baselineSelections[key]
            return question(key)?.options.first { $0.value == selected }
        }

        let geography = option("geography")
        let hvac = option("hvac")
        let household = option("household_size")
        let homeType = option("home_type")
        let homeEnergy = option("home_energy")
        let householdMultiplier = household?.homeMultiplier ?? 1
        let hvacMultiplier = hvac?.hvacMultiplier ?? 1
        let totalHomeCarbon = (geography?.homeBaselineCarbon ?? 3)
            * (homeType?.homeDemandMultiplier ?? 1)
            * (homeEnergy?.homeUseMultiplier ?? 1)
            * householdMultiplier
            * hvacMultiplier
        let homeResourceFactor = householdMultiplier * hvacMultiplier

        var carbon = 0.0
        var nature = 0.0
        var water = 0.0
        var material = 0.0

        for item in model.questions where item.role != "contextual" {
            guard let selected = option(item.key) else { continue }
            if item.key == "home_type" {
                carbon += totalHomeCarbon * 0.55
                nature += (selected.nature ?? 0) * homeResourceFactor
                water += (selected.water ?? 0) * homeResourceFactor
                material += (selected.material ?? 0) * householdMultiplier
            } else if item.key == "home_energy" {
                let use = selected.homeUseMultiplier ?? 1
                carbon += totalHomeCarbon * 0.45
                nature += (selected.nature ?? 0) * homeResourceFactor * use
                water += (selected.water ?? 0) * homeResourceFactor * use
                material += (selected.material ?? 0) * householdMultiplier
            } else {
                let factor = item.key == "everyday_travel"
                    ? (geography?.transportMultiplier ?? 1)
                    : item.key == "flights"
                        ? (geography?.flightsMultiplier ?? 1)
                        : 1
                carbon += (selected.co2 ?? 0) * factor
                nature += (selected.nature ?? 0) * factor
                water += (selected.water ?? 0) * factor
                material += (selected.material ?? 0) * factor
            }
        }

        return TULIPFootprintResult(
            carbon: roundedTenth(carbon),
            land: (nature * model.physicalFactors.landM2PerPoint / 10).rounded() * 10,
            water: (water * model.physicalFactors.waterM3PerPoint / 10).rounded() * 10,
            material: roundedTenth(material * model.physicalFactors.materialTonnesPerPoint)
        )
    }

    static func carbonContributions(
        model: TULIPFootprintModel,
        answers: [String: String]
    ) -> [TULIPFootprintCarbonContribution] {
        func question(_ key: String) -> TULIPFootprintQuestion? {
            model.questions.first { $0.key == key }
        }
        func option(_ key: String) -> TULIPFootprintOption? {
            let selected = answers[key] ?? model.baselineSelections[key]
            return question(key)?.options.first { $0.value == selected }
        }

        let geography = option("geography")
        let hvac = option("hvac")
        let household = option("household_size")
        let homeType = option("home_type")
        let homeEnergy = option("home_energy")
        let totalHomeCarbon = (geography?.homeBaselineCarbon ?? 3)
            * (homeType?.homeDemandMultiplier ?? 1)
            * (homeEnergy?.homeUseMultiplier ?? 1)
            * (household?.homeMultiplier ?? 1)
            * (hvac?.hvacMultiplier ?? 1)

        return model.questions.compactMap { item in
            guard item.role != "contextual", let selected = option(item.key) else { return nil }

            let carbon: Double
            switch item.key {
            case "home_type":
                carbon = totalHomeCarbon * 0.55
            case "home_energy":
                carbon = totalHomeCarbon * 0.45
            default:
                let factor = item.key == "everyday_travel"
                    ? (geography?.transportMultiplier ?? 1)
                    : item.key == "flights"
                        ? (geography?.flightsMultiplier ?? 1)
                        : 1
                carbon = (selected.co2 ?? 0) * factor
            }

            return TULIPFootprintCarbonContribution(
                key: item.key,
                label: model.labels[item.key] ?? item.title,
                carbon: roundedTenth(carbon)
            )
        }
    }

    private static func roundedTenth(_ value: Double) -> Double {
        (value * 10).rounded() / 10
    }
}

enum TULIPFootprintInsightGenerator {
    private struct Candidate {
        let insight: TULIPFootprintInsight
        let opportunityValue: Double
        let currentCarbon: Double
    }

    private struct Alternative {
        let option: TULIPFootprintOption
        let carbonReduction: Double
        let value: Double
    }

    private static let eligibleKeys: Set<String> = [
        "home_energy",
        "everyday_travel",
        "flights",
        "diet",
        "food_waste",
        "new_clothes",
        "other_stuff",
    ]

    static func generate(
        model: TULIPFootprintModel,
        answers: [String: String],
        limit: Int = 5
    ) -> [TULIPFootprintInsight] {
        guard limit > 0 else { return [] }

        let currentResult = TULIPFootprintCalculator.calculate(model: model, answers: answers)
        let contributionByKey = Dictionary(
            uniqueKeysWithValues: TULIPFootprintCalculator
                .carbonContributions(model: model, answers: answers)
                .map { ($0.key, $0.carbon) }
        )

        let candidates = model.questions.compactMap { question -> Candidate? in
            guard eligibleKeys.contains(question.key),
                  let guidance = question.insight,
                  let selectedValue = answers[question.key] ?? model.baselineSelections[question.key],
                  let selectedIndex = question.options.firstIndex(where: { $0.value == selectedValue }) else {
                return nil
            }
            let selectedOption = question.options[selectedIndex]

            let alternatives = question.options[..<selectedIndex].compactMap { option -> Alternative? in
                var alternativeAnswers = answers
                alternativeAnswers[question.key] = option.value
                let result = TULIPFootprintCalculator.calculate(model: model, answers: alternativeAnswers)
                let carbonReduction = positiveReduction(currentResult.carbon, result.carbon)
                let waterReduction = positiveReduction(currentResult.water, result.water)
                let landReduction = positiveReduction(currentResult.land, result.land)
                let materialReduction = positiveReduction(currentResult.material, result.material)
                let value = carbonReduction
                    + (materialReduction * 0.35)
                    + (waterReduction / 1_400)
                    + (landReduction / 1_900)
                guard value > 0 else { return nil }
                return Alternative(option: option, carbonReduction: carbonReduction, value: value)
            }

            let nextStep = alternatives.last
            let isMaintenance = nextStep == nil
            let rationale: String
            if let nextStep, nextStep.carbonReduction > 0 {
                let reduction = nextStep.carbonReduction.formatted(
                    .number.precision(.fractionLength(1))
                )
                rationale = "Based on “\(selectedOption.label)”. Moving toward “\(nextStep.option.label)” could lower this estimate by about \(reduction) tCO₂e/year."
            } else if nextStep != nil {
                rationale = "Based on “\(selectedOption.label)”. This next step lowers modeled resource demand even where the rounded carbon estimate is unchanged."
            } else {
                rationale = "Based on “\(selectedOption.label)”. You are already at the model’s lowest-impact option in this category; this action helps you hold that advantage."
            }

            return Candidate(
                insight: TULIPFootprintInsight(
                    categoryKey: question.key,
                    title: isMaintenance ? guidance.maintainTitle : guidance.title,
                    action: isMaintenance ? guidance.maintainAction : guidance.action,
                    rationale: rationale,
                    carbonReduction: nextStep?.carbonReduction ?? 0,
                    isMaintenance: isMaintenance
                ),
                opportunityValue: nextStep?.value ?? 0,
                currentCarbon: contributionByKey[question.key] ?? 0
            )
        }

        return candidates.sorted { left, right in
            if left.insight.isMaintenance != right.insight.isMaintenance {
                return !left.insight.isMaintenance
            }
            if left.opportunityValue != right.opportunityValue {
                return left.opportunityValue > right.opportunityValue
            }
            if left.currentCarbon != right.currentCarbon {
                return left.currentCarbon > right.currentCarbon
            }
            return left.insight.categoryKey < right.insight.categoryKey
        }
        .prefix(limit)
        .map(\.insight)
    }

    private static func positiveReduction(_ current: Double, _ alternative: Double) -> Double {
        max(0, current - alternative)
    }
}

@MainActor
final class TULIPDataStore: ObservableObject {
    @Published private(set) var nodes: [TULIPNodeCatalogEntry] = []
    @Published private(set) var inspectorProfiles: [String: TULIPInspectorProfile] = [:]
    @Published private(set) var searchProfiles: [String: TULIPInspectorProfile] = [:]
    @Published private(set) var activityProfiles: [TULIPActivityProfile] = []
    @Published private(set) var footprintModel: TULIPFootprintModel?
    @Published private(set) var loadError: String?
    private var essentialsLoadTask: Task<TULIPEssentialData, Error>?
    private var inspectorLoadTask: Task<[String: TULIPInspectorProfile], Error>?
    private var searchLoadTask: Task<[String: TULIPInspectorProfile], Error>?

    var inspectorDataReady: Bool {
        !inspectorProfiles.isEmpty || loadError != nil
    }

    func load(bundle: Bundle = .main) async {
        await loadEssentials(bundle: bundle)
        await loadInspectorProfiles(bundle: bundle)
    }

    func loadEssentials(bundle: Bundle = .main) async {
        guard nodes.isEmpty,
              activityProfiles.isEmpty,
              footprintModel == nil,
              loadError == nil else { return }

        let task: Task<TULIPEssentialData, Error>
        if let essentialsLoadTask {
            task = essentialsLoadTask
        } else {
            task = Task.detached(priority: .userInitiated) {
                TULIPEssentialData(
                    nodes: try Self.decode("mobile-node-catalog", from: bundle),
                    activityProfiles: try Self.decode("mobile-activity-snapshot", from: bundle),
                    footprintModel: try Self.decode("personal-footprint-model", from: bundle)
                )
            }
            essentialsLoadTask = task
        }

        do {
            let payload = try await task.value
            nodes = payload.nodes
            activityProfiles = payload.activityProfiles
            footprintModel = payload.footprintModel
        } catch {
            recordLoadError(error)
        }
        essentialsLoadTask = nil
    }

    func loadInspectorProfiles(bundle: Bundle = .main) async {
        guard inspectorProfiles.isEmpty, loadError == nil else { return }

        let task: Task<[String: TULIPInspectorProfile], Error>
        if let inspectorLoadTask {
            task = inspectorLoadTask
        } else {
            task = Task.detached(priority: .utility) {
                try Self.decode("mobile-inspector-snapshot", from: bundle)
            }
            inspectorLoadTask = task
        }

        do {
            inspectorProfiles = try await task.value
        } catch {
            recordLoadError(error)
        }
        inspectorLoadTask = nil
    }

    func loadSearchProfiles(bundle: Bundle = .main) async {
        guard searchProfiles.isEmpty, loadError == nil else { return }

        let task: Task<[String: TULIPInspectorProfile], Error>
        if let searchLoadTask {
            task = searchLoadTask
        } else {
            task = Task.detached(priority: .utility) {
                try Self.decode("mobile-search-snapshot", from: bundle)
            }
            searchLoadTask = task
        }

        do {
            searchProfiles = try await task.value
        } catch {
            recordLoadError(error)
        }
        searchLoadTask = nil
    }

    func profile(named name: String?) -> TULIPInspectorProfile? {
        guard let name else {
            return inspectorProfiles["global_temperature"] ?? inspectorProfiles.values.first
        }
        let normalized = Self.normalized(name)
        if let direct = inspectorProfiles[normalized] { return direct }
        return inspectorProfiles.values.first { Self.normalized($0.name) == normalized }
    }

    nonisolated private static func decode<T: Decodable>(_ name: String, from bundle: Bundle) throws -> T {
        guard let url = bundle.url(forResource: name, withExtension: "json", subdirectory: "NativeData") else {
            throw CocoaError(.fileNoSuchFile, userInfo: [NSLocalizedDescriptionKey: "Missing native data: \(name).json"])
        }
        return try JSONDecoder().decode(T.self, from: Data(contentsOf: url))
    }

    private func recordLoadError(_ error: Error) {
        loadError = error.localizedDescription
        #if DEBUG
        print("TULIP native data load failed: \(error)")
        #endif
    }

    private static func normalized(_ value: String) -> String {
        value.lowercased()
            .replacingOccurrences(of: "[^a-z0-9]+", with: "_", options: .regularExpression)
            .trimmingCharacters(in: CharacterSet(charactersIn: "_"))
    }
}

private struct TULIPEssentialData {
    let nodes: [TULIPNodeCatalogEntry]
    let activityProfiles: [TULIPActivityProfile]
    let footprintModel: TULIPFootprintModel
}
