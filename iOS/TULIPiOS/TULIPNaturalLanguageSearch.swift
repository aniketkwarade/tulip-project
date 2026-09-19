import Foundation
import NaturalLanguage

#if canImport(FoundationModels)
import FoundationModels
#endif

enum TULIPDiscoverySource: Equatable {
    case semanticGraph
    case onDeviceModel

    var label: String {
        switch self {
        case .semanticGraph: "SEMANTIC GRAPH"
        case .onDeviceModel: "ON-DEVICE"
        }
    }
}

struct TULIPDiscoveryMatch: Identifiable, Equatable {
    var id: String { node.id }

    let node: TULIPNodeCatalogEntry
    let reason: String
    let evidence: String?
    let score: Double
}

struct TULIPDiscoveryContext: Equatable {
    let query: String
    let topicNames: [String]
    let answer: String
}

struct TULIPDiscoveryResult: Equatable {
    let query: String
    let answer: String
    let matches: [TULIPDiscoveryMatch]
    let confidence: Double
    let confidenceReason: String
    let clarification: String?
    let scopeNote: String?
    let source: TULIPDiscoverySource
    let usedPreviousContext: Bool

    var primaryMatch: TULIPDiscoveryMatch? { matches.first }

    var confidenceLabel: String {
        if confidence >= 0.82 { return "High confidence" }
        if confidence >= 0.64 { return "Good match" }
        return "Possible match"
    }

    var conversationContext: TULIPDiscoveryContext? {
        guard let primaryMatch else { return nil }
        return TULIPDiscoveryContext(
            query: query,
            topicNames: [primaryMatch.node.name] + matches.dropFirst().prefix(2).map(\.node.name),
            answer: answer
        )
    }
}

enum TULIPNaturalLanguageSearch {
    private enum Intent: String {
        case identify
        case cause
        case effect
        case response
        case measurement
        case currentSituation
        case general

        init(modelValue: String) {
            let value = TULIPNaturalLanguageSearch.normalized(modelValue)
            if value.contains("cause") || value.contains("driver") || value.contains("why") {
                self = .cause
            } else if value.contains("effect") || value.contains("impact") || value.contains("consequence") {
                self = .effect
            } else if value.contains("response") || value.contains("solution") || value.contains("action") {
                self = .response
            } else if value.contains("measure") || value.contains("metric") || value.contains("track") {
                self = .measurement
            } else if value.contains("current") || value.contains("today") || value.contains("recent") {
                self = .currentSituation
            } else if value.contains("identify") || value.contains("name") || value.contains("called") {
                self = .identify
            } else {
                self = .general
            }
        }
    }

    private enum EvidenceKind: String {
        case overview
        case cause
        case effect
        case humanImpact
        case planetImpact
        case response
        case measurement
        case recentOccurrence

        var reason: String {
            switch self {
            case .overview: "Topic description"
            case .cause: "Causal evidence"
            case .effect: "Downstream evidence"
            case .humanImpact: "Human impact evidence"
            case .planetImpact: "Planet impact evidence"
            case .response: "Response evidence"
            case .measurement: "Measurement evidence"
            case .recentOccurrence: "Recent occurrence"
            }
        }
    }

    private struct EvidencePassage {
        let kind: EvidenceKind
        let label: String
        let text: String
    }

    private struct IndexedNode {
        let node: TULIPNodeCatalogEntry
        let profile: TULIPInspectorProfile?
        let nameTokens: Set<String>
        let overviewTokens: Set<String>
        let retrievalText: String
        let passages: [EvidencePassage]
        let allTokens: Set<String>
        let semanticVector: [Double]?
    }

    private struct QueryUnderstanding {
        let isInScope: Bool
        let intent: Intent
        let semanticQueries: [String]
        let evidenceQueries: [String]
        let concepts: [String]
        let excludedConcepts: [String]
        let geography: String?
        let timeframe: String?
        let usesPreviousContext: Bool

        var retrievalText: String {
            (semanticQueries + concepts).joined(separator: ". ")
        }

        var evidenceText: String {
            (evidenceQueries + concepts).joined(separator: ". ")
        }

        var excludedText: String {
            excludedConcepts.joined(separator: ". ")
        }
    }

    private struct PreliminaryNode {
        let indexed: IndexedNode
        let lexicalScore: Double
        let semanticDistance: Double?
        let semanticRank: Int
        let score: Double
        let exactNameMatch: Bool
    }

    private struct RankedEvidence {
        let passage: EvidencePassage
        let lexicalScore: Double
        let semanticAffinity: Double
        let score: Double
    }

    private struct ScoredNode {
        let indexed: IndexedNode
        let evidence: [RankedEvidence]
        let score: Double
        let lexicalScore: Double
        let semanticAffinity: Double
        let exactNameMatch: Bool
    }

    private struct RetrievalOutput {
        let result: TULIPDiscoveryResult
        let candidates: [ScoredNode]
    }

    private struct SearchCorpus {
        let index: [IndexedNode]
        let documentFrequencies: [String: Int]
        let nodeByName: [String: TULIPNodeCatalogEntry]
    }

    private struct CorpusSignature: Equatable {
        let nodeCount: Int
        let profileCount: Int
        let firstNodeID: String?
        let lastNodeID: String?
    }

    private actor RetrievalEngine {
        private var signature: CorpusSignature?
        private var semanticSignature: CorpusSignature?
        private var corpus: SearchCorpus?
        private var embedding: NLEmbedding?

        func prepare(
            nodes: [TULIPNodeCatalogEntry],
            profiles: [String: TULIPInspectorProfile]
        ) {
            _ = preparedCorpus(nodes: nodes, profiles: profiles)
        }

        func prepareSemantic(
            nodes: [TULIPNodeCatalogEntry],
            profiles: [String: TULIPInspectorProfile]
        ) {
            let corpus = preparedCorpus(nodes: nodes, profiles: profiles)
            guard semanticSignature != signature else { return }
            if embedding == nil {
                embedding = NLEmbedding.wordEmbedding(for: .english)
            }
            // Descriptions share a large vocabulary. Resolve each word vector
            // once instead of asking NaturalLanguage thousands of times.
            var vectorCache: [String: [Double]] = [:]
            var missingVectors = Set<String>()
            let semanticIndex = corpus.index.map { item in
                IndexedNode(
                    node: item.node,
                    profile: item.profile,
                    nameTokens: item.nameTokens,
                    overviewTokens: item.overviewTokens,
                    retrievalText: item.retrievalText,
                    passages: item.passages,
                    allTokens: item.allTokens,
                    semanticVector: TULIPNaturalLanguageSearch.semanticVector(
                        for: item.retrievalText,
                        embedding: embedding,
                        vectorCache: &vectorCache,
                        missingVectors: &missingVectors
                    )
                )
            }
            self.corpus = SearchCorpus(
                index: semanticIndex,
                documentFrequencies: corpus.documentFrequencies,
                nodeByName: corpus.nodeByName
            )
            semanticSignature = signature
        }

        func retrieve(
            for query: String,
            understanding: QueryUnderstanding,
            nodes: [TULIPNodeCatalogEntry],
            profiles: [String: TULIPInspectorProfile],
            source: TULIPDiscoverySource
        ) -> RetrievalOutput? {
            let corpus = preparedCorpus(nodes: nodes, profiles: profiles)
            let queryVector = semanticSignature == signature
                ? TULIPNaturalLanguageSearch.semanticVector(
                    for: understanding.retrievalText,
                    embedding: embedding
                )
                : nil
            return TULIPNaturalLanguageSearch.buildRetrieval(
                for: query,
                understanding: understanding,
                corpus: corpus,
                queryVector: queryVector,
                source: source
            )
        }

        private func preparedCorpus(
            nodes: [TULIPNodeCatalogEntry],
            profiles: [String: TULIPInspectorProfile]
        ) -> SearchCorpus {
            let nextSignature = CorpusSignature(
                nodeCount: nodes.count,
                profileCount: profiles.count,
                firstNodeID: nodes.first?.id,
                lastNodeID: nodes.last?.id
            )
            if signature == nextSignature, let corpus {
                return corpus
            }

            let nextCorpus = TULIPNaturalLanguageSearch.makeCorpus(
                nodes: nodes,
                profiles: profiles
            )
            signature = nextSignature
            semanticSignature = nil
            corpus = nextCorpus
            return nextCorpus
        }
    }

    private static let retrievalEngine = RetrievalEngine()

    private static let stopWords: Set<String> = [
        "a", "about", "all", "am", "an", "and", "are", "as", "at", "be", "because",
        "been", "being", "but", "by", "can", "could", "do", "does", "for", "from",
        "get", "getting", "happen", "happening", "has", "have", "how", "i", "if", "in",
        "into", "is", "it", "its", "just", "like", "more", "my", "name", "of", "on",
        "or", "our", "people", "phenomenon", "phenomena", "so", "some", "something", "than",
        "that", "the", "their", "there", "these", "thing", "this", "those", "to", "under",
        "us", "was", "what", "when", "where", "which", "who", "why", "with", "would", "you",
    ]

    private static let questionWords: Set<String> = [
        "what", "why", "how", "when", "where", "which", "who", "does", "do", "is", "are",
        "causes", "caused", "causing", "happens", "called", "means", "affects", "effect",
    ]

    private static let followUpOpeners = [
        "and what", "and how", "how about", "what about", "what if", "does that", "could that",
        "in cities", "near me", "where i live", "what happens next", "why is that",
    ]

    static func shouldInterpret(_ query: String, hasDirectMatches: Bool) -> Bool {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.count >= 5 else { return false }
        let rawTokens = rawTokens(in: trimmed)
        let looksLikeQuestion = trimmed.contains("?")
            || !questionWords.isDisjoint(with: Set(rawTokens))
            || rawTokens.count >= 5
        return looksLikeQuestion || !hasDirectMatches
    }

    static var canUseOnDeviceUnderstanding: Bool {
        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("-TULIPDisableFoundationModels") {
            return false
        }
        #endif
        #if canImport(FoundationModels)
        if #available(iOS 26.0, *) {
            return SystemLanguageModel.default.isAvailable
        }
        #endif
        return false
    }

    @MainActor
    static func prewarmOnDeviceUnderstanding() {
        guard canUseOnDeviceUnderstanding else { return }
        #if canImport(FoundationModels)
        if #available(iOS 26.0, *), SystemLanguageModel.default.isAvailable {
            TULIPFoundationModelSession.shared.prewarm()
        }
        #endif
    }

    static func prepareIndex(
        nodes: [TULIPNodeCatalogEntry],
        profiles: [String: TULIPInspectorProfile]
    ) async {
        guard !nodes.isEmpty else { return }
        await retrievalEngine.prepare(nodes: nodes, profiles: profiles)
    }

    static func prepareSemanticIndex(
        nodes: [TULIPNodeCatalogEntry],
        profiles: [String: TULIPInspectorProfile]
    ) async {
        guard !nodes.isEmpty else { return }
        await retrievalEngine.prepareSemantic(nodes: nodes, profiles: profiles)
    }

    static func localResult(
        for query: String,
        nodes: [TULIPNodeCatalogEntry],
        profiles: [String: TULIPInspectorProfile],
        context: TULIPDiscoveryContext? = nil
    ) async -> TULIPDiscoveryResult? {
        let understanding = heuristicUnderstanding(for: query, context: context)
        return await retrievalEngine.retrieve(
            for: query,
            understanding: understanding,
            nodes: nodes,
            profiles: profiles,
            source: .semanticGraph
        )?.result
    }

    #if canImport(FoundationModels)
    @available(iOS 26.0, *)
    static func enhancedResult(
        for query: String,
        nodes: [TULIPNodeCatalogEntry],
        profiles: [String: TULIPInspectorProfile],
        context: TULIPDiscoveryContext?,
        fallback: TULIPDiscoveryResult?
    ) async -> TULIPDiscoveryResult? {
        let model = SystemLanguageModel.default
        guard model.isAvailable, !Task.isCancelled else { return nil }

        do {
            let understanding = try await modelUnderstanding(
                for: query,
                context: context
            )
            guard !Task.isCancelled else { return nil }
            guard understanding.isInScope else { return nil }

            guard let retrieval = await retrievalEngine.retrieve(
                for: query,
                understanding: understanding,
                nodes: nodes,
                profiles: profiles,
                source: .onDeviceModel
            ), !Task.isCancelled else {
                return nil
            }

            #if DEBUG
            print("TULIP interpreted topic queries: \(understanding.semanticQueries)")
            print("TULIP retrieved topics: \(retrieval.candidates.prefix(6).map { $0.indexed.node.name })")
            #endif

            return retrieval.result
        } catch is CancellationError {
            return nil
        } catch {
            #if DEBUG
            print("TULIP contextual discovery failed: \(error)")
            #endif
            return fallback
        }
    }
    #endif

    private static func heuristicUnderstanding(
        for query: String,
        context: TULIPDiscoveryContext?
    ) -> QueryUnderstanding {
        let usesContext = shouldUsePreviousContext(query) && context != nil
        let expansions = heuristicExpansions(for: query)
        let contextText: String
        if usesContext, let context {
            contextText = "Previous topic: \(context.topicNames.joined(separator: ", ")). Previous question: \(context.query)."
        } else {
            contextText = ""
        }
        let effectiveQuery = ([query] + expansions + [contextText])
            .filter { !$0.isEmpty }
            .joined(separator: " ")
        return QueryUnderstanding(
            isInScope: true,
            intent: intent(for: query),
            semanticQueries: uniqueNonempty([query] + expansions + [effectiveQuery]),
            evidenceQueries: uniqueNonempty([query] + expansions + [effectiveQuery]),
            concepts: Array(tokens(in: effectiveQuery)).sorted(),
            excludedConcepts: heuristicExclusions(for: query),
            geography: nil,
            timeframe: nil,
            usesPreviousContext: usesContext
        )
    }

    private static func heuristicExpansions(for query: String) -> [String] {
        let value = normalized(query)
        var expansions: [String] = []

        if (value.contains("water") || value.contains("lake") || value.contains("river"))
            && (value.contains("green") || value.contains("scum") || value.contains("bloom")) {
            expansions.append("Harmful Algal Blooms cyanobacteria freshwater contamination")
            if value.contains("sick") || value.contains("ill") || value.contains("rash") {
                expansions.append("Waterborne Disease Outbreak drinking water health")
            }
        }

        if value.contains("allerg") || value.contains("pollen") || value.contains("hay fever") {
            expansions.append("Air Pollution Health Burden pollen exposure respiratory health")
            if value.contains("longer") || value.contains("spring") || value.contains("season") {
                expansions.append("Global Temperature warming longer pollen season")
            }
        }

        if (value.contains("wilting") || value.contains("wilt"))
            && (value.contains("hot") || value.contains("heat")) {
            expansions.append("Farm Heat Stress Atmospheric Evaporative Demand crop heat stress")
        }

        return uniqueNonempty(expansions)
    }

    private static func heuristicExclusions(for query: String) -> [String] {
        let value = normalized(query)
        if (value.contains("enough rain") || value.contains("enough water") || value.contains("well watered"))
            && (value.contains("wilting") || value.contains("wilt")) {
            return ["drought", "water shortage"]
        }
        return []
    }

    private static func buildRetrieval(
        for query: String,
        understanding: QueryUnderstanding,
        corpus: SearchCorpus,
        queryVector: [Double]?,
        source: TULIPDiscoverySource
    ) -> RetrievalOutput? {
        guard !Task.isCancelled else { return nil }
        let index = corpus.index
        guard !index.isEmpty else { return nil }

        let queryTerms = tokens(in: understanding.retrievalText)
        let evidenceTerms = tokens(in: understanding.evidenceText)
        let excludedTerms = tokens(in: understanding.excludedText)
        guard !queryTerms.isEmpty else { return nil }
        let allTerms = queryTerms.union(evidenceTerms)
        let documentCount = Double(index.count)
        let documentFrequencies = Dictionary(uniqueKeysWithValues: allTerms.map { term in
            (term, corpus.documentFrequencies[term] ?? 0)
        })
        let normalizedQuery = normalized(query)

        let rawPreliminary = index.map { item -> (IndexedNode, Double, Double?, Bool) in
            let exactName = normalized(item.node.name) == normalizedQuery
            let nameContainsQuery = normalized(item.node.name).contains(normalizedQuery)
                || normalizedQuery.contains(normalized(item.node.name))
            var lexical = exactName ? 90.0 : (nameContainsQuery ? 35.0 : 0)

            for term in queryTerms {
                let frequency = Double(documentFrequencies[term] ?? 0)
                let rarity = log((documentCount + 1) / (frequency + 1)) + 1
                if item.nameTokens.contains(term) { lexical += 8.5 * rarity }
                if item.overviewTokens.contains(term) { lexical += 4.0 * rarity }
            }

            return (
                item,
                lexical,
                cosineDistance(queryVector, item.semanticVector),
                exactName
            )
        }

        let semanticOrder = rawPreliminary.indices.sorted {
            (rawPreliminary[$0].2 ?? 2) < (rawPreliminary[$1].2 ?? 2)
        }
        var rankByIndex: [Int: Int] = [:]
        for (rank, index) in semanticOrder.enumerated() {
            rankByIndex[index] = rank
        }

        let preliminary = rawPreliminary.indices.map { index -> PreliminaryNode in
            let value = rawPreliminary[index]
            let rank = rankByIndex[index] ?? rawPreliminary.count
            let rankStrength = value.2 == nil ? 0 : max(0, 1 - (Double(rank) / 72))
            let affinity = semanticAffinity(for: value.2)
            return PreliminaryNode(
                indexed: value.0,
                lexicalScore: value.1,
                semanticDistance: value.2,
                semanticRank: rank,
                score: value.1 + (rankStrength * 32) + (affinity * 18),
                exactNameMatch: value.3
            )
        }
        .sorted { lhs, rhs in
            if lhs.score == rhs.score { return lhs.indexed.node.name < rhs.indexed.node.name }
            return lhs.score > rhs.score
        }

        guard !Task.isCancelled else { return nil }
        let candidatePool = Array(preliminary.prefix(48))
        var scoredCandidates = candidatePool.map { candidate -> ScoredNode in
            let rankedEvidence = candidate.indexed.passages.map { passage -> RankedEvidence in
                let passageTokens = tokens(in: passage.text)
                let lexical = lexicalPassageScore(
                    passageTokens,
                    queryTerms: evidenceTerms,
                    documentFrequencies: documentFrequencies,
                    documentCount: documentCount
                )
                let affinity = semanticAffinity(for: candidate.semanticDistance)
                let direction = directionBonus(for: passage.kind, intent: understanding.intent)
                let contradiction = contradictionPenalty(
                    passageTokens,
                    excludedTerms: excludedTerms
                )
                return RankedEvidence(
                    passage: passage,
                    lexicalScore: lexical,
                    semanticAffinity: affinity,
                    score: lexical + (affinity * 30) + direction - contradiction
                )
            }
            .sorted { $0.score > $1.score }

            let best = rankedEvidence.first
            let second = rankedEvidence.dropFirst().first
            let topicEvidence = rankedEvidence.first {
                isPrimaryTopicEvidence($0.passage.kind, intent: understanding.intent)
            } ?? best
            let bestAffinity = max(
                semanticAffinity(for: candidate.semanticDistance),
                topicEvidence?.semanticAffinity ?? 0
            )
            let hubPenalty = max(
                0,
                (log2(Double(max(1, candidate.indexed.passages.count))) - 4) * 2.5
            )
            let finalScore = candidate.score
                + ((topicEvidence?.score ?? 0) * 0.68)
                + ((best?.score ?? 0) * 0.12)
                + ((second?.score ?? 0) * 0.04)
                - hubPenalty
            return ScoredNode(
                indexed: candidate.indexed,
                evidence: Array(rankedEvidence.prefix(5)),
                score: finalScore,
                lexicalScore: candidate.lexicalScore + (topicEvidence?.lexicalScore ?? 0),
                semanticAffinity: bestAffinity,
                exactNameMatch: candidate.exactNameMatch
            )
        }
        .sorted { lhs, rhs in
            if lhs.score == rhs.score { return lhs.indexed.node.name < rhs.indexed.node.name }
            return lhs.score > rhs.score
        }

        if let exactIndex = scoredCandidates.firstIndex(where: \.exactNameMatch), exactIndex != 0 {
            let exact = scoredCandidates.remove(at: exactIndex)
            scoredCandidates.insert(exact, at: 0)
        }

        guard let primary = scoredCandidates.first else { return nil }
        let runnerUp = scoredCandidates.dropFirst().first
        let evidenceStrength = primary.exactNameMatch
            ? 1
            : min(1, (primary.semanticAffinity * 0.68) + (min(1, primary.lexicalScore / 36) * 0.32))
        let margin = runnerUp.map {
            max(0, (primary.score - $0.score) / max(1, primary.score))
        } ?? 0
        let confidence: Double
        if primary.exactNameMatch {
            confidence = 0.98
        } else if source == .onDeviceModel {
            let interpretedLexicalStrength = min(1, primary.lexicalScore / 28)
            confidence = min(
                0.88,
                0.42 + (interpretedLexicalStrength * 0.34) + min(0.12, margin * 0.24)
            )
        } else {
            confidence = min(0.92, 0.12 + (evidenceStrength * 0.68) + (min(0.12, margin * 0.24)))
        }

        guard primary.exactNameMatch
                || primary.lexicalScore >= 2.5
                || primary.semanticAffinity >= 0.36,
              confidence >= 0.38 else {
            return nil
        }

        let selected = Array(scoredCandidates.prefix(10))
        let retrievedMatches = selected.map { candidate in
            TULIPDiscoveryMatch(
                node: candidate.indexed.node,
                reason: candidate.evidence.first?.passage.kind.reason ?? "Semantic graph match",
                evidence: candidate.evidence.first.map { firstTwoSentences($0.passage.text) },
                score: candidate.score
            )
        }
        guard let primaryMatch = retrievedMatches.first else { return nil }
        let graphNeighbors = graphNeighborMatches(
            for: primary,
            nodeByName: corpus.nodeByName,
            intent: understanding.intent,
            evidenceTerms: evidenceTerms,
            excludedTerms: excludedTerms
        )
        let neighborIDs = Set(graphNeighbors.map(\.id))
        let matches = [primaryMatch]
            + graphNeighbors
            + retrievedMatches.dropFirst().filter { !neighborIDs.contains($0.id) }
        let ambiguity = source == .onDeviceModel
            ? margin < 0.025 && confidence < 0.68
            : margin < 0.065 || confidence < 0.58
        let clarification = ambiguity && matches.count > 1
            ? clarificationQuestion(
                query: query,
                first: matches[0],
                second: matches[1]
            )
            : nil
        let result = TULIPDiscoveryResult(
            query: query,
            answer: localAnswer(for: primary, intent: understanding.intent),
            matches: matches,
            confidence: confidence,
            confidenceReason: confidenceReason(
                for: primary,
                margin: margin,
                usedContext: understanding.usesPreviousContext,
                source: source
            ),
            clarification: clarification,
            scopeNote: scopeNote(for: understanding),
            source: source,
            usedPreviousContext: understanding.usesPreviousContext
        )
        return RetrievalOutput(result: result, candidates: selected)
    }

    private static func graphNeighborMatches(
        for primary: ScoredNode,
        nodeByName: [String: TULIPNodeCatalogEntry],
        intent: Intent,
        evidenceTerms: Set<String>,
        excludedTerms: Set<String>
    ) -> [TULIPDiscoveryMatch] {
        guard let profile = primary.indexed.profile else { return [] }
        let incoming = useful(profile.incoming).compactMap { relationship -> TULIPDiscoveryMatch? in
            guard let node = nodeByName[normalized(relationship.name)] else { return nil }
            let overlap = tokens(in: relationship.name + " " + relationship.explanation)
                .intersection(evidenceTerms)
                .count
            let contradiction = tokens(in: relationship.name + " " + relationship.explanation)
                .intersection(excludedTerms)
                .count
            guard contradiction == 0 else { return nil }
            let direction = intent == .cause ? 8.0 : 2.0
            return TULIPDiscoveryMatch(
                node: node,
                reason: "Documented driver",
                evidence: firstTwoSentences(relationship.explanation),
                score: Double(overlap * 5) + direction - Double(contradiction * 14)
            )
        }
        let outgoing = useful(profile.outgoing).compactMap { relationship -> TULIPDiscoveryMatch? in
            guard let node = nodeByName[normalized(relationship.name)] else { return nil }
            let overlap = tokens(in: relationship.name + " " + relationship.explanation)
                .intersection(evidenceTerms)
                .count
            let contradiction = tokens(in: relationship.name + " " + relationship.explanation)
                .intersection(excludedTerms)
                .count
            guard contradiction == 0 else { return nil }
            let direction = intent == .effect ? 8.0 : 2.0
            return TULIPDiscoveryMatch(
                node: node,
                reason: "Documented consequence",
                evidence: firstTwoSentences(relationship.explanation),
                score: Double(overlap * 5) + direction - Double(contradiction * 14)
            )
        }
        return (incoming + outgoing)
            .sorted {
                if $0.score == $1.score { return $0.node.name < $1.node.name }
                return $0.score > $1.score
            }
            .prefix(5)
            .map { $0 }
    }

    private static func makeCorpus(
        nodes: [TULIPNodeCatalogEntry],
        profiles: [String: TULIPInspectorProfile]
    ) -> SearchCorpus {
        let profileByName = Dictionary(
            uniqueKeysWithValues: profiles.values.map { (normalized($0.name), $0) }
        )
        let index = nodes.map { node in
            let profile = profileByName[normalized(node.name)]
            let passages = evidencePassages(for: node, profile: profile)
            let retrievalText = [
                node.name,
                profile?.description,
                profile?.human?.summary,
                profile?.planet?.summary,
                profile?.response?.defaultDriver,
                profile?.measurement?.metric,
            ]
            .compactMap { $0 }
            .joined(separator: ". ")
            let nameTokens = tokens(in: node.name)
            let overviewTokens = tokens(in: retrievalText)
            let allTokens = nameTokens.union(overviewTokens)
            return IndexedNode(
                node: node,
                profile: profile,
                nameTokens: nameTokens,
                overviewTokens: overviewTokens,
                retrievalText: retrievalText,
                passages: passages,
                allTokens: allTokens,
                semanticVector: nil
            )
        }
        let documentFrequencies = index.reduce(into: [String: Int]()) { frequencies, item in
            for token in item.allTokens {
                frequencies[token, default: 0] += 1
            }
        }
        return SearchCorpus(
            index: index,
            documentFrequencies: documentFrequencies,
            nodeByName: Dictionary(
                uniqueKeysWithValues: nodes.map { (normalized($0.name), $0) }
            )
        )
    }

    private static func evidencePassages(
        for node: TULIPNodeCatalogEntry,
        profile: TULIPInspectorProfile?
    ) -> [EvidencePassage] {
        guard let profile else {
            return [passage(kind: .overview, label: node.name, text: node.name)]
        }

        var passages: [EvidencePassage] = []
        if let description = nonempty(profile.description) {
            passages.append(passage(kind: .overview, label: profile.name, text: description))
        }
        for relationship in useful(profile.incoming) {
            passages.append(passage(
                kind: .cause,
                label: relationship.name,
                text: "\(relationship.name) can contribute to \(profile.name). \(relationship.explanation)"
            ))
        }
        for relationship in useful(profile.outgoing) {
            passages.append(passage(
                kind: .effect,
                label: relationship.name,
                text: "\(profile.name) can contribute to \(relationship.name). \(relationship.explanation)"
            ))
        }
        if let summary = nonempty(profile.human?.summary) {
            passages.append(passage(kind: .humanImpact, label: "Human impacts", text: summary))
        }
        for consequence in profile.human?.consequences ?? [] where !consequence.isEmpty {
            passages.append(passage(kind: .humanImpact, label: "Human impacts", text: consequence))
        }
        if let summary = nonempty(profile.planet?.summary) {
            passages.append(passage(kind: .planetImpact, label: "Planet impacts", text: summary))
        }
        for consequence in profile.planet?.consequences ?? [] where !consequence.isEmpty {
            passages.append(passage(kind: .planetImpact, label: "Planet impacts", text: consequence))
        }
        if let driver = nonempty(profile.response?.defaultDriver) {
            passages.append(passage(kind: .cause, label: "Primary driver", text: driver))
        }
        for lever in profile.response?.levers ?? [] where !lever.isEmpty {
            passages.append(passage(kind: .response, label: "Response option", text: lever))
        }
        if let metric = nonempty(profile.measurement?.metric) {
            let detail = [
                metric,
                profile.measurement?.method,
                profile.measurement?.geography,
                profile.measurement?.cadence,
            ]
            .compactMap { $0 }
            .joined(separator: ". ")
            passages.append(passage(kind: .measurement, label: "How it is measured", text: detail))
        }
        for occurrence in profile.recentOccurrences?.occurrences.prefix(3) ?? [] {
            let text = [occurrence.title, occurrence.place, occurrence.summary]
                .compactMap { $0 }
                .filter { !$0.isEmpty }
                .joined(separator: ". ")
            if !text.isEmpty {
                passages.append(passage(kind: .recentOccurrence, label: occurrence.date, text: text))
            }
        }
        return passages.isEmpty
            ? [passage(kind: .overview, label: node.name, text: node.name)]
            : passages
    }

    private static func passage(kind: EvidenceKind, label: String, text: String) -> EvidencePassage {
        EvidencePassage(kind: kind, label: label, text: text)
    }

    private static func localAnswer(for candidate: ScoredNode, intent: Intent) -> String {
        let preferred = candidate.evidence.first {
            isPreferredAnswerEvidence($0.passage.kind, intent: intent)
        } ?? candidate.evidence.first
        guard let evidence = preferred else {
            return "This question most closely matches \(candidate.indexed.node.name)."
        }
        let text = firstTwoSentences(evidence.passage.text)
        switch evidence.passage.kind {
        case .cause where intent == .cause:
            return text
        case .effect where intent == .effect:
            return text
        case .response where intent == .response:
            return text
        case .measurement where intent == .measurement:
            return text
        default:
            return candidate.indexed.profile?.description.map(firstTwoSentences) ?? text
        }
    }

    private static func confidenceReason(
        for candidate: ScoredNode,
        margin: Double,
        usedContext: Bool,
        source: TULIPDiscoverySource
    ) -> String {
        if candidate.exactNameMatch { return "Exact TULIP topic name" }
        if usedContext { return "Matched this question with the previous topic and graph evidence" }
        if source == .onDeviceModel { return "On-device interpretation and graph evidence point to this topic" }
        if margin < 0.065 { return "Several TULIP topics contain similarly relevant evidence" }
        if candidate.lexicalScore >= 18 && candidate.semanticAffinity >= 0.48 {
            return "Language and graph evidence point to the same topic"
        }
        if candidate.semanticAffinity >= 0.48 { return "Semantically similar to this topic’s evidence" }
        return "Closest available topic in the TULIP graph"
    }

    private static func isPreferredAnswerEvidence(_ kind: EvidenceKind, intent: Intent) -> Bool {
        switch intent {
        case .cause: kind == .cause
        case .effect: kind == .effect
        case .response: kind == .response
        case .measurement: kind == .measurement
        case .currentSituation: kind == .recentOccurrence
        case .identify, .general: kind == .overview
        }
    }

    private static func clarificationQuestion(
        query: String,
        first: TULIPDiscoveryMatch,
        second: TULIPDiscoveryMatch
    ) -> String {
        "Do you mean \(first.node.name), or is \(second.node.name) closer to what you’re observing?"
    }

    private static func validatedGeography(_ value: String, in query: String) -> String? {
        guard let value = nonempty(value) else { return nil }
        let normalizedValue = normalized(value)
        let relativeOrGlobalLocations: Set<String> = [
            "around me", "everywhere", "global", "globally", "here", "local", "locally",
            "my area", "near me", "nearby", "where i live", "worldwide",
        ]
        guard !relativeOrGlobalLocations.contains(normalizedValue),
              normalized(query).contains(normalizedValue) else {
            return nil
        }
        return value
    }

    private static func scopeNote(for understanding: QueryUnderstanding) -> String? {
        if understanding.intent == .currentSituation {
            return "TULIP can identify the relevant issue, but it cannot verify live conditions at your location."
        }
        if let geography = understanding.geography {
            return "The match uses TULIP’s general evidence; it does not confirm conditions in \(geography)."
        }
        return nil
    }

    private static func lexicalPassageScore(
        _ passageTokens: Set<String>,
        queryTerms: Set<String>,
        documentFrequencies: [String: Int],
        documentCount: Double
    ) -> Double {
        queryTerms.reduce(into: 0) { score, term in
            guard passageTokens.contains(term) else { return }
            let frequency = Double(documentFrequencies[term] ?? 0)
            let rarity = log((documentCount + 1) / (frequency + 1)) + 1
            score += 3.6 * rarity
        }
    }

    private static func contradictionPenalty(
        _ passageTokens: Set<String>,
        excludedTerms: Set<String>
    ) -> Double {
        Double(passageTokens.intersection(excludedTerms).count) * 14
    }

    private static func semanticAffinity(for distance: Double?) -> Double {
        guard let distance, distance.isFinite else { return 0 }
        return min(1, max(0, (1.55 - distance) / 0.75))
    }

    private static func semanticVector(
        for text: String,
        embedding: NLEmbedding?
    ) -> [Double]? {
        guard let embedding else { return nil }
        var seen = Set<String>()
        let terms = rawTokens(in: text).filter { term in
            term.count > 1
                && !stopWords.contains(term)
                && seen.insert(term).inserted
        }

        var sum: [Double]?
        var vectorCount = 0
        for term in terms.prefix(32) {
            guard let vector = embedding.vector(for: term) else { continue }
            if sum == nil {
                sum = Array(repeating: 0, count: vector.count)
            }
            guard sum?.count == vector.count else { continue }
            for index in vector.indices {
                sum?[index] += vector[index]
            }
            vectorCount += 1
        }

        guard vectorCount > 0, var sum else { return nil }
        let divisor = Double(vectorCount)
        for index in sum.indices {
            sum[index] /= divisor
        }
        return sum
    }

    private static func semanticVector(
        for text: String,
        embedding: NLEmbedding?,
        vectorCache: inout [String: [Double]],
        missingVectors: inout Set<String>
    ) -> [Double]? {
        guard let embedding else { return nil }
        var seen = Set<String>()
        let terms = rawTokens(in: text).filter { term in
            term.count > 1
                && !stopWords.contains(term)
                && seen.insert(term).inserted
        }

        var sum: [Double]?
        var vectorCount = 0
        for term in terms.prefix(32) {
            let vector: [Double]?
            if let cached = vectorCache[term] {
                vector = cached
            } else if missingVectors.contains(term) {
                vector = nil
            } else if let resolved = embedding.vector(for: term) {
                vectorCache[term] = resolved
                vector = resolved
            } else {
                missingVectors.insert(term)
                vector = nil
            }

            guard let vector else { continue }
            if sum == nil {
                sum = Array(repeating: 0, count: vector.count)
            }
            guard sum?.count == vector.count else { continue }
            for index in vector.indices {
                sum?[index] += vector[index]
            }
            vectorCount += 1
        }

        guard vectorCount > 0, var sum else { return nil }
        let divisor = Double(vectorCount)
        for index in sum.indices {
            sum[index] /= divisor
        }
        return sum
    }

    private static func cosineDistance(_ lhs: [Double]?, _ rhs: [Double]?) -> Double? {
        guard let lhs, let rhs, lhs.count == rhs.count, !lhs.isEmpty else { return nil }
        var dot = 0.0
        var lhsMagnitude = 0.0
        var rhsMagnitude = 0.0
        for index in lhs.indices {
            dot += lhs[index] * rhs[index]
            lhsMagnitude += lhs[index] * lhs[index]
            rhsMagnitude += rhs[index] * rhs[index]
        }
        guard lhsMagnitude > 0, rhsMagnitude > 0 else { return nil }
        return 1 - (dot / (sqrt(lhsMagnitude) * sqrt(rhsMagnitude)))
    }

    private static func directionBonus(for kind: EvidenceKind, intent: Intent) -> Double {
        switch (intent, kind) {
        case (.cause, .cause), (.effect, .effect), (.response, .response),
             (.measurement, .measurement), (.currentSituation, .recentOccurrence):
            return 7
        case (.identify, .overview), (.general, .overview):
            return 3
        default:
            return 0
        }
    }

    private static func isPrimaryTopicEvidence(_ kind: EvidenceKind, intent: Intent) -> Bool {
        switch intent {
        case .response:
            return kind == .overview || kind == .response || kind == .humanImpact || kind == .planetImpact
        case .measurement:
            return kind == .overview || kind == .measurement
        case .currentSituation:
            return kind == .overview || kind == .recentOccurrence
        case .identify, .cause, .effect, .general:
            return kind == .overview || kind == .humanImpact || kind == .planetImpact
        }
    }

    private static func intent(for query: String) -> Intent {
        let words = Set(rawTokens(in: query))
        if !words.isDisjoint(with: ["today", "current", "currently", "latest", "now", "recent", "recently"]) {
            return .currentSituation
        }
        if !words.isDisjoint(with: ["cause", "causes", "caused", "causing", "driver", "drivers", "why"]) {
            return .cause
        }
        if !words.isDisjoint(with: ["affect", "affects", "consequence", "consequences", "effect", "effects", "impact", "impacts", "lead", "leads"]) {
            return .effect
        }
        if !words.isDisjoint(with: ["fix", "help", "prevent", "reduce", "respond", "response", "solution", "solutions", "stop"]) {
            return .response
        }
        if !words.isDisjoint(with: ["measure", "measured", "metric", "monitor", "track", "tracked"]) {
            return .measurement
        }
        if !words.isDisjoint(with: ["called", "mean", "means", "name"]) {
            return .identify
        }
        return .general
    }

    private static func shouldUsePreviousContext(_ query: String) -> Bool {
        let normalizedQuery = normalized(query)
        let words = rawTokens(in: query)
        return followUpOpeners.contains(where: normalizedQuery.hasPrefix)
            || (words.count <= 7 && !Set(words).isDisjoint(with: ["it", "that", "this", "they", "those", "there"]))
    }

    private static func useful(_ relationships: [TULIPRelationship]) -> [TULIPRelationship] {
        relationships.filter {
            !$0.name.localizedCaseInsensitiveContains("no reviewed")
                && !$0.explanation.localizedCaseInsensitiveContains("no outgoing relationship")
        }
    }

    private static func nonempty(_ value: String?) -> String? {
        guard let value = value?.trimmingCharacters(in: .whitespacesAndNewlines), !value.isEmpty else {
            return nil
        }
        return value
    }

    private static func uniqueNonempty(_ values: [String]) -> [String] {
        var seen = Set<String>()
        return values.compactMap { value in
            let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !trimmed.isEmpty else { return nil }
            let key = normalized(trimmed)
            guard seen.insert(key).inserted else { return nil }
            return trimmed
        }
    }

    private static func tokens(in value: String) -> Set<String> {
        Set(rawTokens(in: value).map(stem).filter { $0.count > 1 && !stopWords.contains($0) })
    }

    private static func rawTokens(in value: String) -> [String] {
        normalized(value)
            .split(separator: " ")
            .map(String.init)
    }

    private static func normalized(_ value: String) -> String {
        value.folding(options: [.caseInsensitive, .diacriticInsensitive], locale: .current)
            .lowercased()
            .replacingOccurrences(of: "[^a-z0-9]+", with: " ", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func stem(_ term: String) -> String {
        if term.hasSuffix("ies"), term.count > 5 { return String(term.dropLast(3)) + "y" }
        if term.hasSuffix("ing"), term.count > 6 { return String(term.dropLast(3)) }
        if term.hasSuffix("ed"), term.count > 5 { return String(term.dropLast(2)) }
        if term.hasSuffix("es"), term.count > 5 { return String(term.dropLast(2)) }
        if term.hasSuffix("s"), term.count > 4 { return String(term.dropLast()) }
        return term
    }

    private static func firstTwoSentences(_ value: String) -> String {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        var sentenceEnds = 0
        for index in trimmed.indices where trimmed[index] == "." {
            sentenceEnds += 1
            if sentenceEnds == 2 {
                return String(trimmed[...index])
            }
        }
        return trimmed
    }
}

#if canImport(FoundationModels)
@available(iOS 26.0, *)
@Generable(description: "Search interpretation of an ordinary environmental question.")
private struct TULIPGeneratedQueryUnderstanding {
    @Guide(description: "True only for environmental, climate, ecosystem, pollution, public-health, or sustainability questions. Device troubleshooting is false.")
    var isInScope: Bool

    @Guide(description: "One intent: identify, cause, effect, response, measurement, current, or general.")
    var intent: String

    @Guide(description: "One to three concise scientific searches for the observed phenomenon, separated by semicolons; best search first.")
    var topicSearches: String

    @Guide(description: "A concise search for the requested cause, effect, measurement, or response; empty when unnecessary.")
    var evidenceSearch: String

    @Guide(description: "Mechanisms explicitly ruled out by the question, separated by semicolons; empty when none.")
    var excludedSearches: String

    @Guide(description: "Whether the question depends on the supplied previous-search context.")
    var usesPreviousContext: Bool
}

@available(iOS 26.0, *)
@MainActor
private final class TULIPFoundationModelSession {
    static let shared = TULIPFoundationModelSession()

    private static let instructions = """
    Translate everyday environmental observations into scientific search language without diagnosing.
    Separate the observed phenomenon from causes. Longer allergies means prolonged pollen exposure; warming is causal evidence. Green water plus illness suggests algal blooms, cyanobacteria toxins, pathogens, or contamination. Wilting in hotter air despite enough rain prioritizes heat stress and atmospheric evaporative demand, and excludes drought.
    Preserve constraints, negation, place, time, comparison, and causal direction. Put only explicitly contradicted mechanisms in excludedSearches. Use previous context only for a genuine follow-up. Device troubleshooting is out of scope unless it asks about environmental impact. Do not answer or assume TULIP topic names. Be concise.
    """

    private var session = TULIPFoundationModelSession.makeSession()
    private var completedRequests = 0

    func prewarm() {
        session.prewarm()
    }

    func respond(to prompt: String) async throws -> TULIPGeneratedQueryUnderstanding {
        while session.isResponding {
            try Task.checkCancellation()
            try await Task.sleep(for: .milliseconds(25))
        }
        let response = try await session.respond(
            to: prompt,
            generating: TULIPGeneratedQueryUnderstanding.self
        )
        completedRequests += 1
        if completedRequests >= 6 {
            session = Self.makeSession()
            completedRequests = 0
            session.prewarm()
        }
        return response.content
    }

    private static func makeSession() -> LanguageModelSession {
        LanguageModelSession(
            model: SystemLanguageModel.default,
            instructions: instructions
        )
    }
}

@available(iOS 26.0, *)
private extension TULIPNaturalLanguageSearch {
    private static func modelUnderstanding(
        for query: String,
        context: TULIPDiscoveryContext?
    ) async throws -> QueryUnderstanding {
        let contextText: String
        if let context {
            contextText = """
            Previous question: \(context.query)
            Previous matched topics: \(context.topicNames.joined(separator: ", "))
            Previous answer: \(context.answer)
            """
        } else {
            contextText = "No previous-search context is available."
        }

        let generated = try await TULIPFoundationModelSession.shared.respond(
            to: """
            Current question: \(query)

            \(contextText)

            Produce search-oriented interpretations of the current question.
            """
        )
        let heuristic = heuristicUnderstanding(for: query, context: context)
        let usesContext = context != nil
            && (generated.usesPreviousContext || shouldUsePreviousContext(query))
        let contextQuery = usesContext ? heuristic.semanticQueries.last : nil
        let semanticQueries = uniqueNonempty(
            [query]
                + splitGeneratedSearches(generated.topicSearches).prefix(3)
                + [contextQuery].compactMap { $0 }
        )
        let evidenceQueries = uniqueNonempty(
            [query] + splitGeneratedSearches(generated.evidenceSearch).prefix(1)
        )
        let concepts = Array(tokens(in: semanticQueries.joined(separator: " "))).sorted()
        let excludedConcepts = uniqueNonempty(
            Array(splitGeneratedSearches(generated.excludedSearches).prefix(4))
        )
        let modelIntent = Intent(modelValue: generated.intent)
        let resolvedIntent = heuristic.intent == .general ? modelIntent : heuristic.intent
        return QueryUnderstanding(
            isInScope: generated.isInScope,
            intent: resolvedIntent,
            semanticQueries: semanticQueries,
            evidenceQueries: evidenceQueries,
            concepts: concepts,
            excludedConcepts: excludedConcepts,
            geography: nil,
            timeframe: nil,
            usesPreviousContext: usesContext
        )
    }

    private static func splitGeneratedSearches(_ value: String) -> [String] {
        value
            .components(separatedBy: CharacterSet(charactersIn: ";\n|"))
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
    }
}
#endif
