import SwiftUI
import UIKit

private struct TULIPSearchHeaderHeightKey: PreferenceKey {
    static var defaultValue: CGFloat = 0

    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = max(value, nextValue())
    }
}

private enum TULIPSearchIntelligenceState: Equatable {
    case idle
    case thinking
    case result(TULIPDiscoveryResult)
    case noMatch
}

struct TULIPSearchView: View {
    private enum Section {
        case search
        case bookmarks
    }

    let nodes: [TULIPNodeCatalogEntry]
    let inspectorProfiles: [String: TULIPInspectorProfile]
    let bookmarkedNames: [String]
    let resetRequest: Int
    let onSelect: (String) -> Void
    let onRemoveBookmark: (String) -> Void
    let onKeyboardVisibilityChange: (Bool) -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var query = ""
    @State private var recentNames: [String] = []
    @State private var scrollResetID = 0
    @State private var selectedSection: Section = .search
    @State private var frozenHeaderHeight: CGFloat = 0
    @State private var intelligenceState: TULIPSearchIntelligenceState = .idle
    @State private var previousDiscoveryContext: TULIPDiscoveryContext?
    @State private var results: [TULIPNodeCatalogEntry] = []
    @State private var suggested: [TULIPNodeCatalogEntry] = []
    @FocusState private var searchFieldFocused: Bool

    private func directMatches(for query: String) -> [TULIPNodeCatalogEntry] {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return [] }
        return nodes
            .filter { $0.name.localizedCaseInsensitiveContains(trimmed) }
            .sorted { lhs, rhs in
                let options: String.CompareOptions = [.caseInsensitive, .diacriticInsensitive, .anchored]
                let lhsPrefix = lhs.name.range(of: trimmed, options: options) != nil
                let rhsPrefix = rhs.name.range(of: trimmed, options: options) != nil
                return lhsPrefix == rhsPrefix ? lhs.name < rhs.name : lhsPrefix
            }
            .prefix(30)
            .map { $0 }
    }

    private func suggestedNodes() -> [TULIPNodeCatalogEntry] {
        let preferred = [
            "Global Temperature",
            "Ocean Heat Content",
            "Methane Emissions",
            "Deforestation",
            "Carbon Emission",
            "Ocean Acidification",
        ]
        return preferred.compactMap { name in nodes.first { $0.name == name } }
    }

    private var shouldInterpretQuery: Bool {
        selectedSection == .search
            && TULIPNaturalLanguageSearch.shouldInterpret(query, hasDirectMatches: !results.isEmpty)
    }

    private var discoveryTaskID: String {
        "\(selectedSection == .search)-\(query)-\(nodes.count)-\(inspectorProfiles.count)-\(previousDiscoveryContext?.query ?? "")"
    }

    private var relatedDiscoveryMatches: [TULIPDiscoveryMatch] {
        guard case .result(let result) = intelligenceState else { return [] }
        let directIDs = Set(results.map(\.id))
        return Array(result.matches.dropFirst().filter { !directIDs.contains($0.node.id) }.prefix(5))
    }

    var body: some View {
        ZStack(alignment: .top) {
            TULIPPalette.background
                .ignoresSafeArea()

            ScrollView {
                LazyVStack(alignment: .leading, spacing: TULIPSpacing.zero) {
                    if selectedSection == .bookmarks {
                        if bookmarkedNames.isEmpty {
                            TULIPEmptyState(
                                title: "No bookmarks yet",
                                message: "Open a topic in Analyse and tap the bookmark button to save it here.",
                                systemImage: "bookmark"
                            )
                            .frame(maxWidth: .infinity)
                            .padding(.top, TULIPLayout.searchEmptyTopPadding)
                        } else {
                            searchGroup("Saved Topics") {
                                ForEach(bookmarkedNames, id: \.self) { name in
                                    searchRow(
                                        name: name,
                                        sphere: nodes.first { $0.name == name }?.sphere,
                                        trailingIcon: "bookmark.fill",
                                        onRemove: { removeBookmark(name) }
                                    )
                                }
                            }
                        }
                    } else {
                        if query.isEmpty {
                            if !recentNames.isEmpty {
                                searchGroup("Recent Searches") {
                                    ForEach(recentNames, id: \.self) { name in
                                        searchRow(
                                            name: name,
                                            sphere: nodes.first { $0.name == name }?.sphere,
                                            onRemove: { forget(name) }
                                        )
                                    }
                                }
                            }
                            searchGroup("Suggested Topics") {
                                ForEach(suggested) { node in
                                    searchRow(name: node.name, sphere: node.sphere)
                                }
                            }
                        } else {
                            if shouldInterpretQuery {
                                intelligenceContent
                            }

                            if !results.isEmpty {
                                searchGroup("Topic Matches") {
                                    ForEach(results) { node in
                                        searchRow(name: node.name, sphere: node.sphere)
                                    }
                                }
                            }

                            if !relatedDiscoveryMatches.isEmpty {
                                searchGroup("Related in the graph") {
                                    ForEach(relatedDiscoveryMatches) { match in
                                        searchRow(
                                            name: match.node.name,
                                            sphere: match.node.sphere,
                                            supportingText: "\(match.reason) · \(match.node.sphere.capitalized)"
                                        )
                                    }
                                }
                            }

                            if results.isEmpty, !shouldInterpretQuery || intelligenceState == .noMatch {
                                TULIPEmptyState(
                                    title: "No matching topic",
                                    message: "Try describing what you observe, what might cause it, or what happens next."
                                )
                                .frame(maxWidth: .infinity)
                                .padding(.top, TULIPLayout.searchEmptyTopPadding)
                            }
                        }
                    }
                }
                .padding(.top, frozenHeaderHeight)
                .padding(.horizontal, TULIPLayout.screenHorizontalPadding)
                .padding(.bottom, TULIPLayout.dockContentClearance)
            }
            .id(scrollResetID)
            .scrollIndicators(.hidden)
            .scrollDismissesKeyboard(.interactively)
            .scrollBounceBehavior(.basedOnSize)
            .tulipIOS27SwipeActionsContainer()
            .background(TULIPPalette.background)

            TULIPTopContentFade()
                .frame(height: frozenHeaderHeight + TULIPLayout.pinnedHeaderFadeExtension)
                .frame(maxHeight: .infinity, alignment: .top)
                .zIndex(0.5)

            frozenSearchHeader
                .background {
                    GeometryReader { geometry in
                        Color.clear.preference(
                            key: TULIPSearchHeaderHeightKey.self,
                            value: geometry.size.height
                        )
                    }
                }
                .zIndex(1)
        }
        .onPreferenceChange(TULIPSearchHeaderHeightKey.self) { height in
            frozenHeaderHeight = height
        }
        .background(TULIPPalette.background)
        .preferredColorScheme(.dark)
        .onAppear(perform: loadRecent)
        .onChange(of: searchFieldFocused) { _, focused in
            if focused, selectedSection == .bookmarks {
                selectedSection = .search
            }
            if focused {
                TULIPNaturalLanguageSearch.prewarmOnDeviceUnderstanding()
            }
            onKeyboardVisibilityChange(focused)
        }
        .onChange(of: selectedSection) { _, section in
            scrollResetID += 1
            if section == .bookmarks {
                searchFieldFocused = false
                onKeyboardVisibilityChange(false)
            }
        }
        .onChange(of: query) { oldValue, newValue in
            results = directMatches(for: newValue)
            if !newValue.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                TULIPNaturalLanguageSearch.prewarmOnDeviceUnderstanding()
            }
            guard !oldValue.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
                  newValue.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
            preserveDiscoveryContext()
        }
        .onChange(of: nodes.count, initial: true) { _, _ in
            suggested = suggestedNodes()
            results = directMatches(for: query)
        }
        .onChange(of: resetRequest) { _, _ in
            guard selectedSection == .bookmarks else { return }
            TULIPHaptics.selection()
            selectedSection = .search
        }
        .onDisappear {
            onKeyboardVisibilityChange(false)
        }
        .task(id: discoveryTaskID) {
            await updateIntelligence()
        }
        .task(id: "\(nodes.count)-\(inspectorProfiles.count)") {
            await TULIPNaturalLanguageSearch.prepareIndex(
                nodes: nodes,
                profiles: inspectorProfiles
            )
        }
        .simultaneousGesture(searchResetGesture)
    }

    private var frozenSearchHeader: some View {
        VStack(alignment: .leading, spacing: TULIPSpacing.zero) {
            TULIPScreenHeader(selectedSection == .search ? "Search" : "Bookmarks")

            TULIPGlassGroup(spacing: TULIPSpacing.compact) {
                HStack(spacing: TULIPSpacing.compact) {
                    if selectedSection == .search {
                        expandedSearchControl
                            .transition(.opacity.combined(with: .scale(scale: 0.98, anchor: .leading)))
                        compactBookmarkControl
                            .transition(.opacity.combined(with: .scale(scale: 0.94, anchor: .trailing)))
                    } else {
                        compactSearchControl
                            .transition(.opacity.combined(with: .scale(scale: 0.94, anchor: .leading)))
                        expandedBookmarkControl
                            .transition(.opacity.combined(with: .scale(scale: 0.98, anchor: .trailing)))
                    }
                }
                .animation(TULIPMotion.animation(.standard, reduceMotion: reduceMotion), value: selectedSection)
            }
            .padding(.horizontal, TULIPLayout.screenHorizontalPadding)
            .padding(.top, TULIPSpacing.standard)
        }
        .padding(.bottom, TULIPSpacing.compact)
    }

    private var expandedSearchControl: some View {
        HStack(spacing: TULIPSpacing.compact) {
            Image(systemName: TULIPIconography.search)
                .font(.body.weight(.medium))
                .foregroundStyle(TULIPPalette.tertiaryText)
            TextField("Ask a question or search a topic", text: $query)
                .focused($searchFieldFocused)
                .textInputAutocapitalization(.sentences)
                .submitLabel(.search)
                .foregroundStyle(TULIPPalette.text)
            if !query.isEmpty {
                Button {
                    TULIPHaptics.button()
                    query = ""
                } label: {
                    Image(systemName: TULIPIconography.clear)
                        .foregroundStyle(TULIPPalette.tertiaryText)
                        .frame(width: 32, height: 32)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Clear search")
            }
        }
        .padding(.horizontal, TULIPLayout.rowHorizontalPadding)
        .frame(maxWidth: .infinity, minHeight: TULIPLayout.primaryControlHeight)
        .tulipFloatingChrome(in: Capsule(), interactive: true)
    }

    private var compactSearchControl: some View {
        Button {
            switchSearchSection(to: .search, focusSearch: true)
        } label: {
            Image(systemName: TULIPIconography.search)
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(Color.white)
                .frame(width: compactHeaderControlWidth, height: compactHeaderControlWidth)
                .contentShape(Circle())
        }
        .buttonStyle(.plain)
        .tulipFloatingChrome(in: Circle(), interactive: true)
        .accessibilityLabel("Show search")
    }

    private var compactBookmarkControl: some View {
        Button {
            switchSearchSection(to: .bookmarks)
        } label: {
            Image(systemName: "bookmark.fill")
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(TULIPPalette.blue)
                .frame(width: compactHeaderControlWidth, height: compactHeaderControlWidth)
                .contentShape(Circle())
        }
        .buttonStyle(.plain)
        .tulipFloatingChrome(in: Circle(), interactive: true)
        .accessibilityLabel("Show bookmarks")
        .accessibilityValue("Not selected")
    }

    private var expandedBookmarkControl: some View {
        Button {
            switchSearchSection(to: .bookmarks)
        } label: {
            Image(systemName: "bookmark.fill")
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(Color.white)
                .frame(maxWidth: .infinity, minHeight: TULIPLayout.primaryControlHeight)
                .contentShape(Capsule())
        }
        .buttonStyle(.plain)
        .tulipSolidControl(in: Capsule(), fill: TULIPPalette.blue)
        .accessibilityLabel("Bookmarks")
        .accessibilityValue("Selected")
    }

    private var compactHeaderControlWidth: CGFloat {
        TULIPLayout.primaryControlHeight
    }

    private func switchSearchSection(to section: Section, focusSearch: Bool = false) {
        guard selectedSection != section else { return }
        TULIPHaptics.selection()
        withAnimation(TULIPMotion.animation(.standard, reduceMotion: reduceMotion)) {
            selectedSection = section
        }
        guard focusSearch else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) {
            searchFieldFocused = true
        }
    }

    private var searchResetGesture: some Gesture {
        DragGesture(minimumDistance: 20)
            .onEnded { value in
                guard selectedSection == .search else { return }
                guard value.translation.height >= 44,
                      abs(value.translation.height) > abs(value.translation.width) * 1.15 else { return }
                TULIPHaptics.impact()
                query = ""
                searchFieldFocused = false
                scrollResetID += 1
                UIApplication.shared.sendAction(
                    #selector(UIResponder.resignFirstResponder),
                    to: nil,
                    from: nil,
                    for: nil
                )
            }
    }

    @ViewBuilder
    private var intelligenceContent: some View {
        switch intelligenceState {
        case .idle:
            EmptyView()
        case .thinking:
            HStack(spacing: TULIPSpacing.compact) {
                ProgressView()
                    .tint(TULIPPalette.lavender)
                VStack(alignment: .leading, spacing: TULIPSpacing.xSmall) {
                    Text("Understanding your question")
                        .font(TULIPTypography.supporting.weight(.semibold))
                        .foregroundStyle(TULIPPalette.text)
                    Text("Searching names, descriptions, evidence, causes, and effects…")
                        .font(TULIPTypography.metadata)
                        .foregroundStyle(TULIPPalette.secondaryText)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(TULIPLayout.cardContentPadding)
            .tulipFloatingChrome(in: RoundedRectangle(cornerRadius: TULIPRadius.card))
            .padding(.top, TULIPSpacing.large)
            .accessibilityElement(children: .combine)
        case .result(let result):
            intelligenceCard(result)
                .padding(.top, TULIPSpacing.large)
        case .noMatch:
            EmptyView()
        }
    }

    private func intelligenceCard(_ result: TULIPDiscoveryResult) -> some View {
        VStack(alignment: .leading, spacing: TULIPSpacing.compact) {
            HStack(spacing: TULIPSpacing.small) {
                Image(systemName: "sparkles")
                    .foregroundStyle(TULIPPalette.lavender)
                Text("ASK TULIP")
                    .font(TULIPTypography.sectionLabel)
                    .tracking(1.2)
                    .foregroundStyle(TULIPPalette.lavender)
                Spacer(minLength: TULIPSpacing.small)
                Text(result.source.label)
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(TULIPPalette.tertiaryText)
            }

            if let primary = result.primaryMatch {
                Text("This sounds like \(primary.node.name)")
                    .font(.title3.weight(.bold))
                    .foregroundStyle(TULIPPalette.text)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Text(result.answer)
                .font(TULIPTypography.body)
                .foregroundStyle(TULIPPalette.secondaryText)
                .fixedSize(horizontal: false, vertical: true)

            if result.usedPreviousContext {
                Label("Using your previous search for context", systemImage: "arrow.trianglehead.turn.up.right.circle")
                    .font(TULIPTypography.metadata)
                    .foregroundStyle(TULIPPalette.blue)
            }

            if let clarification = result.clarification {
                Label(clarification, systemImage: "questionmark.bubble")
                    .font(TULIPTypography.metadata)
                    .foregroundStyle(TULIPPalette.blue)
                    .fixedSize(horizontal: false, vertical: true)
            }

            if let scopeNote = result.scopeNote {
                Label(scopeNote, systemImage: "location.slash")
                    .font(TULIPTypography.metadata)
                    .foregroundStyle(TULIPPalette.tertiaryText)
                    .fixedSize(horizontal: false, vertical: true)
            }

            HStack(spacing: TULIPSpacing.small) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(result.confidenceLabel)
                        .font(TULIPTypography.metadata.weight(.semibold))
                        .foregroundStyle(TULIPPalette.tertiaryText)
                    Text(result.confidenceReason)
                        .font(.caption2)
                        .foregroundStyle(TULIPPalette.tertiaryText)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: TULIPSpacing.small)
                if let primary = result.primaryMatch {
                    Button {
                        TULIPHaptics.selection()
                        remember(primary.node.name)
                        onSelect(primary.node.name)
                    } label: {
                        HStack(spacing: TULIPSpacing.xSmall) {
                            Text("Open topic")
                            Image(systemName: "arrow.right")
                        }
                        .font(TULIPTypography.control)
                        .foregroundStyle(TULIPPalette.text)
                        .padding(.horizontal, TULIPSpacing.compact)
                        .frame(minHeight: TULIPLayout.minimumTouchTarget)
                    }
                    .buttonStyle(.plain)
                    .tulipSelectableChrome(
                        in: Capsule(),
                        isSelected: true,
                        selectionFill: TULIPPalette.lavender
                    )
                    .accessibilityLabel("Open \(primary.node.name)")
                }
            }
        }
        .padding(TULIPLayout.cardContentPadding)
        .tulipFloatingChrome(in: RoundedRectangle(cornerRadius: TULIPRadius.card))
        .accessibilityElement(children: .contain)
    }

    @ViewBuilder
    private func searchGroup<Content: View>(
        _ title: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        Text(title.uppercased())
            .font(.caption.weight(.bold))
            .tracking(1.4)
            .foregroundStyle(TULIPPalette.blue)
            .padding(.top, TULIPSpacing.large)
            .padding(.bottom, TULIPSpacing.small)
        content()
    }

    @ViewBuilder
    private func searchRow(
        name: String,
        sphere: String?,
        supportingText: String? = nil,
        trailingIcon: String = TULIPIconography.externalLink,
        onRemove: (() -> Void)? = nil
    ) -> some View {
        if let onRemove {
            TULIPSearchSwipeRow(
                onSelect: {
                    TULIPHaptics.selection()
                    remember(name)
                    onSelect(name)
                },
                onDelete: onRemove
            ) { trailingIconOpacity in
                searchRowContent(
                    name: name,
                    sphere: sphere,
                    supportingText: supportingText,
                    trailingIcon: trailingIcon,
                    trailingIconOpacity: trailingIconOpacity
                )
            }
                .accessibilityLabel(name)
                .accessibilityHint("Opens the topic inspector. Swipe left for delete.")
                .accessibilityAction(named: "Remove \(name)") {
                    onRemove()
                }
        } else {
            Button {
                TULIPHaptics.selection()
                remember(name)
                onSelect(name)
            } label: {
                searchRowContent(
                    name: name,
                    sphere: sphere,
                    supportingText: supportingText,
                    trailingIcon: trailingIcon
                )
            }
            .buttonStyle(.plain)
            .accessibilityHint("Opens the topic inspector")
        }
    }

    private func searchRowContent(
        name: String,
        sphere: String?,
        supportingText: String?,
        trailingIcon: String,
        trailingIconOpacity: CGFloat = 1
    ) -> some View {
        HStack(spacing: TULIPSpacing.compact) {
            VStack(alignment: .leading, spacing: TULIPSpacing.xSmall) {
                Text(name)
                    .font(.body.weight(.medium))
                    .foregroundStyle(TULIPPalette.text)
                if let detail = supportingText ?? sphere {
                    Text(detail)
                        .font(.caption)
                        .foregroundStyle(TULIPPalette.tertiaryText)
                }
            }
            Spacer()
            Image(systemName: trailingIcon)
                .font(.caption.weight(.semibold))
                .foregroundStyle(TULIPPalette.tertiaryText)
                .opacity(trailingIconOpacity)
        }
        .frame(minHeight: 54)
        .contentShape(Rectangle())
    }

    private func loadRecent() {
        recentNames = UserDefaults.standard.stringArray(forKey: "TULIPRecentSearches") ?? []
        #if DEBUG
        let arguments = ProcessInfo.processInfo.arguments
        if query.isEmpty,
           let index = arguments.firstIndex(of: "-TULIPSearchQuery"),
           arguments.indices.contains(index + 1) {
            query = arguments[index + 1]
        }
        #endif
    }

    @MainActor
    private func updateIntelligence() async {
        guard shouldInterpretQuery else {
            intelligenceState = .idle
            return
        }

        intelligenceState = .thinking
        TULIPNaturalLanguageSearch.prewarmOnDeviceUnderstanding()
        do {
            try await Task.sleep(nanoseconds: 100_000_000)
        } catch {
            return
        }
        guard !Task.isCancelled else { return }

        let activeQuery = query

        let localResult = await TULIPNaturalLanguageSearch.localResult(
            for: activeQuery,
            nodes: nodes,
            profiles: inspectorProfiles,
            context: previousDiscoveryContext
        )
        guard !Task.isCancelled else { return }
        if let localResult {
            intelligenceState = .result(localResult)
        }

        #if canImport(FoundationModels)
        if #available(iOS 26.0, *), TULIPNaturalLanguageSearch.canUseOnDeviceUnderstanding {
            // When a quick graph match is available, give SwiftUI one frame to
            // publish it. If it is not, ask the already-prewarmed on-device
            // model immediately instead of building every semantic vector first.
            if localResult != nil {
                do {
                    try await Task.sleep(nanoseconds: 120_000_000)
                } catch {
                    return
                }
            }
            guard !Task.isCancelled else { return }
            if let refined = await TULIPNaturalLanguageSearch.enhancedResult(
               for: activeQuery,
               nodes: nodes,
               profiles: inspectorProfiles,
               context: previousDiscoveryContext,
               fallback: localResult
            ), !Task.isCancelled {
                intelligenceState = .result(refined)
                return
            }

            if let localResult {
                intelligenceState = .result(localResult)
                return
            }

            // Foundation Models can occasionally decline or be interrupted.
            // Only then pay the one-time embedding cost and recover locally.
            await TULIPNaturalLanguageSearch.prepareSemanticIndex(
                nodes: nodes,
                profiles: inspectorProfiles
            )
            guard !Task.isCancelled else { return }
            if let semanticResult = await TULIPNaturalLanguageSearch.localResult(
                for: activeQuery,
                nodes: nodes,
                profiles: inspectorProfiles,
                context: previousDiscoveryContext
            ), !Task.isCancelled {
                intelligenceState = .result(semanticResult)
            } else if !Task.isCancelled {
                intelligenceState = .noMatch
            }
            return
        }
        #endif

        // Devices without Foundation Models still get the richer local
        // semantic pass, followed by an immediate second retrieval.
        await TULIPNaturalLanguageSearch.prepareSemanticIndex(
            nodes: nodes,
            profiles: inspectorProfiles
        )
        guard !Task.isCancelled else { return }
        if let semanticResult = await TULIPNaturalLanguageSearch.localResult(
            for: activeQuery,
            nodes: nodes,
            profiles: inspectorProfiles,
            context: previousDiscoveryContext
        ), !Task.isCancelled {
            intelligenceState = .result(semanticResult)
        } else if let localResult {
            intelligenceState = .result(localResult)
        } else if !Task.isCancelled {
            intelligenceState = .noMatch
        }
    }

    private func preserveDiscoveryContext() {
        guard case .result(let result) = intelligenceState,
              let context = result.conversationContext else { return }
        previousDiscoveryContext = context
    }

    private func remember(_ name: String) {
        var next = recentNames.filter { $0 != name }
        next.insert(name, at: 0)
        recentNames = Array(next.prefix(8))
        UserDefaults.standard.set(recentNames, forKey: "TULIPRecentSearches")
    }

    private func forget(_ name: String) {
        TULIPHaptics.button()
        recentNames.removeAll { $0 == name }
        UserDefaults.standard.set(recentNames, forKey: "TULIPRecentSearches")
    }

    private func removeBookmark(_ name: String) {
        TULIPHaptics.button()
        onRemoveBookmark(name)
    }
}

private struct TULIPSearchSwipeRow<Content: View>: View {
    private enum DragIntent: Equatable {
        case horizontal
        case vertical
    }

    private let actionWidth: CGFloat = 76
    private let onSelect: () -> Void
    private let onDelete: () -> Void
    private let content: (CGFloat) -> Content

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var rowWidth: CGFloat = 1
    @State private var offsetX: CGFloat = 0
    @State private var settledOffsetX: CGFloat = 0
    @State private var dragIntent: DragIntent?
    @State private var isDeleting = false
    @State private var suppressSelection = false

    init(
        onSelect: @escaping () -> Void,
        onDelete: @escaping () -> Void,
        @ViewBuilder content: @escaping (CGFloat) -> Content
    ) {
        self.onSelect = onSelect
        self.onDelete = onDelete
        self.content = content
    }

    var body: some View {
        let revealedWidth = max(0, -offsetX)
        let trailingIconOpacity = max(0, 1 - (revealedWidth / 12))

        ZStack(alignment: .trailing) {
            Capsule()
                .fill(TULIPPalette.red)
                .frame(width: max(actionWidth, revealedWidth), height: TULIPLayout.minimumTouchTarget)
                .opacity(revealedWidth > 0 ? 1 : 0)

            content(trailingIconOpacity)
                .background(TULIPPalette.background)
                .offset(x: offsetX)
                .onTapGesture(perform: handleRowTap)

            Button(role: .destructive, action: commitDelete) {
                Image(systemName: "trash.fill")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: actionWidth, height: TULIPLayout.minimumTouchTarget)
                    .background(TULIPPalette.red, in: Capsule())
            }
            .buttonStyle(.plain)
            .opacity(min(1, revealedWidth / actionWidth))
            .allowsHitTesting(offsetX <= -(actionWidth * 0.72) && !isDeleting)
            .accessibilityHidden(offsetX > -(actionWidth * 0.72) || isDeleting)
        }
        .clipped()
        .accessibilityAddTraits(.isButton)
        .accessibilityAction { handleRowTap() }
        .background {
            GeometryReader { geometry in
                Color.clear
                    .onAppear { rowWidth = max(1, geometry.size.width) }
                    .onChange(of: geometry.size.width) { _, width in
                        rowWidth = max(1, width)
                    }
            }
        }
        .simultaneousGesture(swipeGesture)
    }

    private var swipeGesture: some Gesture {
        DragGesture(minimumDistance: 10, coordinateSpace: .local)
            .onChanged { value in
                guard !isDeleting else { return }
                if dragIntent == nil {
                    let horizontal = abs(value.translation.width)
                    let vertical = abs(value.translation.height)
                    guard max(horizontal, vertical) >= 10 else { return }
                    dragIntent = horizontal > vertical * 1.12 ? .horizontal : .vertical
                }
                guard dragIntent == .horizontal else { return }
                suppressSelection = true
                offsetX = min(0, max(-rowWidth, settledOffsetX + value.translation.width))
            }
            .onEnded { value in
                defer {
                    dragIntent = nil
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) {
                        suppressSelection = false
                    }
                }
                guard dragIntent == .horizontal, !isDeleting else { return }

                let projectedOffset = min(
                    0,
                    max(-rowWidth, settledOffsetX + value.predictedEndTranslation.width)
                )
                if offsetX <= -(rowWidth * 0.62) || projectedOffset <= -(rowWidth * 0.78) {
                    commitDelete()
                } else if offsetX <= -(actionWidth * 0.5) || projectedOffset <= -(actionWidth * 0.82) {
                    settle(at: -actionWidth)
                } else {
                    closeAction()
                }
            }
    }

    private func settle(at offset: CGFloat) {
        withAnimation(TULIPMotion.animation(.quick, reduceMotion: reduceMotion)) {
            offsetX = offset
            settledOffsetX = offset
        }
    }

    private func closeAction() {
        settle(at: 0)
    }

    private func handleRowTap() {
        guard !suppressSelection, !isDeleting else { return }
        if offsetX < -1 {
            closeAction()
        } else {
            onSelect()
        }
    }

    private func commitDelete() {
        guard !isDeleting else { return }
        isDeleting = true
        withAnimation(TULIPMotion.animation(.quick, reduceMotion: reduceMotion)) {
            offsetX = -rowWidth
            settledOffsetX = -rowWidth
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + (reduceMotion ? 0 : 0.16)) {
            onDelete()
        }
    }
}

private enum InspectorSheetDrag {
    case expanded
    case collapsed
    case ignored
}

private enum InspectorRelationshipDirection: String {
    case trigger
    case effect
}

private struct InspectorRelationshipSelection: Identifiable {
    let relationship: TULIPRelationship
    let direction: InspectorRelationshipDirection

    var id: String { "\(direction.rawValue)-\(relationship.id)" }
}

private struct TULIPPDFExportIssue: Identifiable {
    let id = "pdf-export-failed"
}

struct TULIPInspectorView: View {
    let profile: TULIPInspectorProfile?
    let toggleRequest: Int
    let isBookmarked: Bool
    let shareURL: URL
    let onSelectNode: (String) -> Void
    let onToggleBookmark: () -> Void
    let onScrollDirection: (Bool) -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var isExpanded = false
    @State private var sheetPosition: CGFloat = 1
    @State private var sheetDragY: CGFloat = 0
    @State private var activeSheetDrag: InspectorSheetDrag?
    @State private var measurementExpanded = false
    @State private var selectedRelationship: InspectorRelationshipSelection?
    @State private var openSelectedNodeExpanded = false
    @State private var sharePayload: TULIPSharePayload?
    @State private var pdfExportIssue: TULIPPDFExportIssue?

    var body: some View {
        if let profile {
            GeometryReader { geometry in
                let expandedTop: CGFloat = 54
                let sheetHeight = max(360, geometry.size.height - expandedTop)
                // Keep enough of the collapsed sheet visible for the identity
                // row plus a clear gap above the overlaid navigation dock.
                let collapsedPeek: CGFloat = 200
                let collapsedOffset = max(0, sheetHeight - collapsedPeek)
                let sheetOffset = min(
                    collapsedOffset,
                    max(0, (collapsedOffset * sheetPosition) + sheetDragY)
                )
                let collapseProgress = collapsedOffset > 0
                    ? min(1, max(0, sheetOffset / collapsedOffset))
                    : (isExpanded ? 0 : 1)

                ZStack(alignment: .bottom) {
                    causalStage(profile)
                        .padding(.top, TULIPLayout.screenHeaderTopPadding)
                        .padding(.bottom, collapsedPeek - 8)

                    Text("Swipe down to explore connections")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(Color.white.opacity(0.72))
                        .frame(maxWidth: .infinity)
                        .frame(height: expandedTop)
                        .background(Color.black)
                        .frame(maxHeight: .infinity, alignment: .top)
                        .opacity(1 - collapseProgress)
                        .allowsHitTesting(false)
                        .zIndex(2)

                    TULIPPalette.raisedSurface
                        .frame(height: geometry.safeAreaInsets.bottom + 140)
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
                        .ignoresSafeArea(edges: .bottom)
                        .opacity(1 - collapseProgress)
                        .allowsHitTesting(false)

                    inspectorSheet(profile, collapseProgress: collapseProgress)
                        .frame(height: sheetHeight)
                        .offset(y: sheetOffset)
                }
                .contentShape(Rectangle())
                .simultaneousGesture(
                    inspectorSheetGesture(
                        viewportHeight: geometry.size.height,
                        collapsedPeek: collapsedPeek
                    )
                )
                .sheet(item: $sharePayload) { payload in
                    TULIPShareSheet(items: payload.items)
                }
                .tulipItemAlert(
                    item: $pdfExportIssue,
                    title: "PDF could not be prepared",
                    message: "Please try sharing the report again."
                )
            }
            .background(.black)
            .onChange(of: profile.name) { _, _ in
                let shouldExpand = openSelectedNodeExpanded
                openSelectedNodeExpanded = false
                isExpanded = shouldExpand
                sheetPosition = shouldExpand ? 0 : 1
                measurementExpanded = false
                sheetDragY = 0
                activeSheetDrag = nil
                selectedRelationship = nil
                onScrollDirection(false)
            }
            .onChange(of: toggleRequest) { _, _ in
                settleInspector(expanded: !isExpanded)
            }
        } else {
            TULIPEmptyState(
                title: "Choose a topic",
                message: "Select a node in Explore or Search to open its evidence."
            )
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(TULIPPalette.background)
        }
    }

    private func inspectorSheet(
        _ profile: TULIPInspectorProfile,
        collapseProgress: CGFloat
    ) -> some View {
        let contentVisibility = max(0, 1 - collapseProgress)

        return VStack(spacing: TULIPSpacing.zero) {
            inspectorHeader(profile, collapseProgress: collapseProgress)

            ScrollView {
                LazyVStack(alignment: .leading, spacing: TULIPLayout.sectionSpacing) {
                    if let description = profile.description, !description.isEmpty {
                        Text(description)
                            .font(.body)
                            .foregroundStyle(TULIPPalette.secondaryText)
                            .lineSpacing(4)
                            .padding(.horizontal, TULIPSpacing.xSmall)
                    }
                    relationshipSection(profile)
                    impactSection("Human impact", data: profile.human)
                    impactSection("Planet impact", data: profile.planet)
                    responseSection(profile.response)
                    recentEventsSection(profile.recentOccurrences)
                    measurementSection(profile.measurement)
                }
                .tulipSelectableEvidence()
                .padding(.horizontal, TULIPLayout.screenHorizontalPadding)
                .padding(.top, TULIPLayout.contentTopPadding)
                .padding(.bottom, TULIPLayout.dockContentClearance)
            }
            .id(profile.name)
            .modifier(
                TULIPDockScrollTrackingModifier(
                    isEnabled: collapseProgress < 0.01,
                    onCompactChange: onScrollDirection
                )
            )
            .scrollDisabled(collapseProgress >= 0.01)
            .scrollBounceBehavior(.basedOnSize)
            .allowsHitTesting(collapseProgress < 0.01)
            .scaleEffect(0.92 + (0.08 * contentVisibility), anchor: .top)
            .opacity(contentVisibility)
        }
        .background(TULIPPalette.raisedSurface)
        .clipShape(
            UnevenRoundedRectangle(
                topLeadingRadius: 34,
                bottomLeadingRadius: 0,
                bottomTrailingRadius: 0,
                topTrailingRadius: 34,
                style: .continuous
            )
        )
    }

    private func inspectorHeader(
        _ profile: TULIPInspectorProfile,
        collapseProgress: CGFloat
    ) -> some View {
        let expandedProgress = max(0, 1 - collapseProgress)

        return VStack(spacing: TULIPSpacing.small) {
            ZStack {
                Capsule()
                    .fill(.white.opacity(0.32))
                    .frame(width: 48, height: 4)

                HStack(spacing: TULIPSpacing.zero) {
                    Spacer()
                    HStack(spacing: TULIPSpacing.xSmall) {
                        Menu {
                            Button {
                                TULIPHaptics.button()
                                sharePayload = TULIPSharePayload(
                                    items: [
                                        "Explore \(profile.name) in The TULIP Project.",
                                        shareURL,
                                    ]
                                )
                            } label: {
                                Label("Share Link", systemImage: "link")
                            }

                            Button {
                                sharePDF(profile)
                            } label: {
                                Label("Share PDF", systemImage: "doc.richtext")
                            }
                        } label: {
                            Image(systemName: "square.and.arrow.up")
                                .font(.system(size: 17, weight: .semibold))
                                .foregroundStyle(TULIPPalette.text)
                                .frame(
                                    width: TULIPLayout.minimumTouchTarget,
                                    height: TULIPLayout.minimumTouchTarget
                                )
                        }
                        .buttonStyle(.plain)
                        .contentShape(Rectangle())
                        .accessibilityLabel("Share \(profile.name) as a link or PDF")

                        TULIPIconButton(
                            systemName: isBookmarked ? "bookmark.fill" : "bookmark",
                            accessibilityLabel: isBookmarked ? "Remove bookmark" : "Bookmark \(profile.name)"
                        ) {
                            TULIPHaptics.button()
                            onToggleBookmark()
                        }
                    }
                }
                .scaleEffect(0.88 + (0.12 * expandedProgress), anchor: .trailing)
                .opacity(expandedProgress)
                .allowsHitTesting(collapseProgress < 0.05)
                .accessibilityHidden(collapseProgress >= 0.05)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 22 + ((TULIPLayout.minimumTouchTarget - 22) * expandedProgress))
            .padding(.horizontal, TULIPLayout.screenHorizontalPadding)
            .padding(.top, TULIPSpacing.small)

            HStack(alignment: .center, spacing: TULIPSpacing.compact) {
                VStack(alignment: .leading, spacing: 4 * expandedProgress) {
                    Label(profile.sphere.uppercased(), systemImage: sphereSymbol(profile.sphere))
                        .font(.caption2.weight(.bold))
                        .tracking(1.3)
                        .foregroundStyle(TULIPPalette.blue)
                        .scaleEffect(0.88 + (0.12 * expandedProgress), anchor: .leading)
                        .opacity(expandedProgress)
                        .frame(height: 16 * expandedProgress, alignment: .top)
                        .clipped()

                    HStack(alignment: .firstTextBaseline, spacing: TULIPSpacing.small) {
                        Image(systemName: sphereSymbol(profile.sphere))
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(TULIPPalette.blue)
                            .frame(width: 20 * collapseProgress)
                            .scaleEffect(collapseProgress)
                            .opacity(collapseProgress)
                        Text(profile.name)
                            .font(.title3.bold())
                            .lineLimit(1)
                            .minimumScaleFactor(0.68)
                            .allowsTightening(true)
                            .foregroundStyle(TULIPPalette.text)
                    }
                    if let updated = profile.updated {
                        Text(formattedUpdated(updated))
                            .font(.caption2)
                            .foregroundStyle(TULIPPalette.tertiaryText)
                            .scaleEffect(0.88 + (0.12 * expandedProgress), anchor: .leading)
                            .opacity(expandedProgress)
                            .frame(height: 14 * expandedProgress, alignment: .top)
                            .clipped()
                    }
                }
                Spacer(minLength: 8)
                TULIPScoreBadge(
                    score: profile.urgency ?? 0,
                    band: profile.urgencyBand,
                    compactness: collapseProgress
                )
            }
            .frame(minHeight: 60)
            .padding(.horizontal, TULIPLayout.screenHorizontalPadding)
            .padding(
                .bottom,
                TULIPSpacing.compact + ((14 - TULIPSpacing.compact) * expandedProgress)
            )
        }
        .frame(maxWidth: .infinity)
        .background(TULIPPalette.raisedSurface)
        .contentShape(Rectangle())
        .onTapGesture {
            settleInspector(expanded: collapseProgress >= 0.5)
        }
        .accessibilityElement(children: .contain)
        .accessibilityAction(named: collapseProgress < 0.5 ? "Collapse inspector" : "Expand inspector") {
            settleInspector(expanded: collapseProgress >= 0.5)
        }
    }

    private func sharePDF(_ profile: TULIPInspectorProfile) {
        TULIPHaptics.impact(.medium, intensity: 0.72)
        do {
            let fileURL = try TULIPInspectorPDFExporter.makePDF(for: profile)
            sharePayload = TULIPSharePayload(items: [fileURL])
        } catch {
            pdfExportIssue = TULIPPDFExportIssue()
        }
    }

    private func causalStage(_ profile: TULIPInspectorProfile) -> some View {
        ScrollViewReader { proxy in
            ScrollView(.vertical) {
                VStack(spacing: TULIPSpacing.zero) {
                    causalRelationships(profile.outgoing, title: "Effects", color: TULIPPalette.blue)
                        .padding(.bottom, TULIPSpacing.xxLarge)

                    VStack(spacing: TULIPSpacing.compact) {
                        Label("Effects", systemImage: "arrow.up")
                            .font(.caption2.weight(.bold))
                            .tracking(1.4)
                            .foregroundStyle(TULIPPalette.blue)
                        Text(profile.name)
                            .font(.subheadline.bold())
                            .foregroundStyle(Color.black.opacity(0.9))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, TULIPSpacing.comfortable)
                            .frame(minHeight: 50)
                            .background(Color(white: 0.94), in: Capsule())
                        Label("Triggers", systemImage: "arrow.down")
                            .font(.caption2.weight(.bold))
                            .tracking(1.4)
                            .foregroundStyle(TULIPPalette.red)
                    }
                    .id("selected-node")
                    .padding(.vertical, TULIPSpacing.small)

                    causalRelationships(profile.incoming, title: "Triggers", color: TULIPPalette.red)
                        .padding(.top, TULIPSpacing.xxLarge)
                }
                .padding(.horizontal, TULIPSpacing.large)
                .padding(.vertical, TULIPSpacing.comfortable)
            }
            .scrollIndicators(.hidden)
            .onAppear {
                DispatchQueue.main.async {
                    proxy.scrollTo("selected-node", anchor: .center)
                }
            }
            .onChange(of: profile.name) { _, _ in
                DispatchQueue.main.async {
                    proxy.scrollTo("selected-node", anchor: .center)
                }
            }
        }
    }

    private func causalRelationships(
        _ relationships: [TULIPRelationship],
        title: String,
        color: Color
    ) -> some View {
        LazyVStack(spacing: TULIPSpacing.hairline) {
            ForEach(relationships) { relationship in
                Button(relationship.name) {
                    openRelatedInspector(relationship)
                }
                .buttonStyle(.plain)
                .font(.body.weight(.semibold))
                .multilineTextAlignment(.center)
                .foregroundStyle(color)
                .frame(maxWidth: .infinity, minHeight: 52)
                .contentShape(Rectangle())
                .accessibilityHint("Opens this topic's inspector")
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(title)
    }

    private func openRelatedInspector(_ relationship: TULIPRelationship) {
        openSelectedNodeExpanded = true
        measurementExpanded = false
        selectedRelationship = nil
        onScrollDirection(false)
        onSelectNode(relationship.name)
    }

    private func inspectorSheetGesture(viewportHeight: CGFloat, collapsedPeek: CGFloat) -> some Gesture {
        DragGesture(minimumDistance: 12, coordinateSpace: .local)
            .onChanged { value in
                if activeSheetDrag == nil {
                    let startsInCollapseRegion = value.startLocation.y <= viewportHeight * 0.25
                    let startsOnCollapsedSheet = value.startLocation.y >= viewportHeight - collapsedPeek - 20
                    if isExpanded, startsInCollapseRegion, value.translation.height > 0 {
                        activeSheetDrag = .expanded
                    } else if !isExpanded, startsOnCollapsedSheet, value.translation.height < 0 {
                        activeSheetDrag = .collapsed
                    } else if abs(value.translation.height) > 18 {
                        activeSheetDrag = .ignored
                    }
                }

                switch activeSheetDrag {
                case .expanded:
                    sheetDragY = max(0, value.translation.height)
                case .collapsed:
                    sheetDragY = min(0, value.translation.height)
                case .ignored, .none:
                    break
                }
            }
            .onEnded { value in
                let projected = value.predictedEndTranslation.height
                switch activeSheetDrag {
                case .expanded where value.translation.height > 56 || projected > 110:
                    settleInspector(expanded: false)
                case .collapsed where value.translation.height < -44 || projected < -90:
                    settleInspector(expanded: true)
                default:
                    settleInspector(expanded: isExpanded)
                }
                activeSheetDrag = nil
            }
    }

    private func settleInspector(expanded: Bool) {
        let stateChanged = expanded != isExpanded
        if stateChanged {
            TULIPHaptics.inspector(expanding: expanded)
        }
        if reduceMotion {
            let transaction = Transaction(animation: nil)
            withTransaction(transaction) {
                isExpanded = expanded
                sheetPosition = expanded ? 0 : 1
                sheetDragY = 0
                if !expanded {
                    finishInspectorCollapse()
                }
            }
            return
        }

        if expanded {
            let transaction = Transaction(animation: nil)
            withTransaction(transaction) {
                isExpanded = true
            }
            withAnimation(TULIPMotion.animation(.sheet, reduceMotion: false)) {
                sheetPosition = 0
                sheetDragY = 0
            }
        } else {
            withAnimation(
                TULIPMotion.animation(.sheet, reduceMotion: false),
                completionCriteria: .removed
            ) {
                sheetPosition = 1
                sheetDragY = 0
            } completion: {
                guard sheetPosition >= 0.999 else { return }
                let transaction = Transaction(animation: nil)
                withTransaction(transaction) {
                    isExpanded = false
                    finishInspectorCollapse()
                }
            }
        }
    }

    private func finishInspectorCollapse() {
        onScrollDirection(false)
    }

    @ViewBuilder
    private func relationshipSection(_ profile: TULIPInspectorProfile) -> some View {
        if !profile.incoming.isEmpty || !profile.outgoing.isEmpty {
            VStack(alignment: .leading, spacing: TULIPSpacing.compact) {
                Divider()
                    .overlay(Color.white.opacity(0.12))
                    .padding(.bottom, TULIPSpacing.xSmall)

                HStack(spacing: TULIPSpacing.small) {
                    Image(systemName: TULIPIconography.relationships)
                        .font(.caption.weight(.bold))
                    Text("RELATIONSHIPS")
                        .font(TULIPTypography.sectionLabel)
                        .tracking(1.5)
                }
                .foregroundStyle(TULIPPalette.blue)

                relationshipGroup("Triggers", relationships: profile.incoming, color: TULIPPalette.red, profile: profile)
                relationshipGroup("Effects", relationships: profile.outgoing, color: TULIPPalette.green, profile: profile)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, TULIPSpacing.xSmall)
        }
    }

    @ViewBuilder
    private func relationshipGroup(
        _ title: String,
        relationships: [TULIPRelationship],
        color: Color,
        profile: TULIPInspectorProfile
    ) -> some View {
        if !relationships.isEmpty {
            let direction: InspectorRelationshipDirection = title == "Triggers" ? .trigger : .effect

            Text(title)
                .font(.headline)
                .foregroundStyle(color)
            ScrollView(.horizontal) {
                LazyHStack(spacing: TULIPSpacing.small) {
                    ForEach(relationships) { relationship in
                        let isSelected = selectedRelationship?.id == "\(direction.rawValue)-\(relationship.id)"

                        Button(relationship.name) {
                            TULIPHaptics.selection()
                            showRelationship(relationship, direction: direction)
                        }
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(isSelected ? Color.black : TULIPPalette.text)
                        .padding(.horizontal, TULIPLayout.rowHorizontalPadding)
                        .frame(minHeight: 44)
                        .tulipSolidControl(
                            in: Capsule(),
                            fill: isSelected ? Color.white : TULIPPalette.surface
                        )
                        .accessibilityAddTraits(isSelected ? .isSelected : [])
                    }
                }
            }
            .scrollIndicators(.hidden)

            if let selection = selectedRelationship, selection.direction == direction {
                inlineRelationshipDetail(selection, profile: profile)
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
    }

    private func showRelationship(
        _ relationship: TULIPRelationship,
        direction: InspectorRelationshipDirection
    ) {
        measurementExpanded = false
        let selection = InspectorRelationshipSelection(relationship: relationship, direction: direction)
        withAnimation(TULIPMotion.animation(.standard, reduceMotion: reduceMotion)) {
            selectedRelationship = selectedRelationship?.id == selection.id ? nil : selection
        }
        onScrollDirection(false)
        settleInspector(expanded: true)
    }

    private func inlineRelationshipDetail(
        _ selection: InspectorRelationshipSelection,
        profile: TULIPInspectorProfile
    ) -> some View {
        let isTrigger = selection.direction == .trigger
        let source = isTrigger ? selection.relationship.name : profile.name
        let target = isTrigger ? profile.name : selection.relationship.name
        let color = relationshipColor(selection.direction)

        return VStack(alignment: .leading, spacing: TULIPSpacing.small) {
            Text("\(source) → \(target)")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(color)
                .fixedSize(horizontal: false, vertical: true)

            Text(selection.relationship.explanation)
                .font(.body)
                .foregroundStyle(TULIPPalette.secondaryText)
                .lineSpacing(4)
        }
        .padding(.top, TULIPSpacing.hairline)
    }

    private func relationshipColor(_ direction: InspectorRelationshipDirection) -> Color {
        direction == .trigger ? TULIPPalette.red : TULIPPalette.green
    }

    @ViewBuilder
    private func impactSection(_ title: String, data: TULIPImpactSummary?) -> some View {
        if let data {
            TULIPSection(
                title,
                systemImage: title == "Human impact" ? "person.2.fill" : "globe.americas.fill"
            ) {
                if let severity = data.severity {
                    Text(severity)
                        .font(.headline)
                        .foregroundStyle(TULIPPalette.text)
                }
                if let summary = data.summary {
                    Text(summary)
                        .font(.body)
                        .foregroundStyle(TULIPPalette.secondaryText)
                        .lineSpacing(4)
                }
                bulletList(data.consequences ?? [])
                if let hidden = data.hiddenCost {
                    labeledCopy("Hidden cost", hidden)
                }
                if let whoPays = data.whoPays {
                    labeledCopy("Who pays", whoPays)
                }
                if let limit = data.physicalLimit {
                    labeledCopy("Physical limit", limit)
                }
            }
        }
    }

    @ViewBuilder
    private func responseSection(_ data: TULIPResponseSummary?) -> some View {
        if let data {
            TULIPSection("Response", systemImage: "lightbulb.max.fill") {
                if let driver = data.defaultDriver {
                    labeledCopy("What drives it", driver)
                }
                bulletList(data.levers ?? [])
            }
        }
    }

    @ViewBuilder
    private func recentEventsSection(_ data: TULIPRecentOccurrences?) -> some View {
        if let occurrences = data?.occurrences, !occurrences.isEmpty {
            TULIPSection("Recent Major Events", titleColor: .white, systemImage: "newspaper.fill") {
                ForEach(occurrences) { occurrence in
                    VStack(alignment: .leading, spacing: TULIPSpacing.small) {
                        Text("\(TULIPDateFormatting.display(occurrence.date)) · \(occurrence.place)")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(TULIPPalette.secondaryText)
                        Text(occurrence.title)
                            .font(.headline)
                            .foregroundStyle(TULIPPalette.text)
                        Text(occurrence.statusLabel ?? "Reported")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(TULIPPalette.green)
                        ForEach(occurrence.sources, id: \.url) { source in
                            if let url = URL(string: source.url), url.scheme == "https" {
                                Link(destination: url) {
                                    Label(source.label, systemImage: "arrow.up.right")
                                        .font(.subheadline.weight(.semibold))
                                        .foregroundStyle(TULIPPalette.blue)
                                }
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, TULIPSpacing.small)
                }
            }
        }
    }

    @ViewBuilder
    private func measurementSection(_ data: TULIPMeasurement?) -> some View {
        if let data {
            VStack(alignment: .leading, spacing: TULIPSpacing.compact) {
                Button {
                    TULIPHaptics.button()
                    withAnimation(TULIPMotion.animation(.standard, reduceMotion: reduceMotion)) {
                        measurementExpanded.toggle()
                    }
                } label: {
                    HStack(spacing: TULIPSpacing.compact) {
                        Image(systemName: "ruler.fill")
                            .font(.caption2.weight(.medium))
                        Text("HOW THIS IS MEASURED")
                            .font(.caption2.weight(.medium))
                            .tracking(1.1)
                        Spacer()
                        Image(systemName: "chevron.down")
                            .font(.caption.weight(.semibold))
                            .rotationEffect(.degrees(measurementExpanded ? 180 : 0))
                    }
                    .foregroundStyle(TULIPPalette.tertiaryText)
                    .frame(minHeight: 44)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityValue(measurementExpanded ? "Expanded" : "Collapsed")

                if measurementExpanded {
                    VStack(alignment: .leading, spacing: TULIPSpacing.compact) {
                        labeledCopy("Metric", data.metric)
                        labeledCopy("Reported as", data.unit)
                        labeledCopy("Coverage", data.geography)
                        labeledCopy("Updates", data.cadence)
                        labeledCopy("Method", data.method)
                        labeledCopy("Uncertainty", data.uncertainty)
                        labeledCopy("Boundary", data.boundary)
                    }
                    .transition(.opacity)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, TULIPSpacing.xSmall)
            .padding(.vertical, TULIPSpacing.small)
        }
    }

    private func formattedUpdated(_ value: String) -> String {
        "Last updated \(TULIPDateFormatting.display(value).uppercased())"
    }

    private func sphereSymbol(_ sphere: String) -> String {
        let value = sphere.lowercased()
        if value.contains("air") || value.contains("atmosphere") { return "wind" }
        if value.contains("ocean") || value.contains("water") { return "water.waves" }
        if value.contains("glacier") || value.contains("ice") { return "snowflake" }
        if value.contains("plant") || value.contains("wildlife") || value.contains("bio") { return "leaf.fill" }
        if value.contains("power") || value.contains("energy") { return "bolt.fill" }
        if value.contains("digital") { return "cpu.fill" }
        if value.contains("farm") || value.contains("agriculture") { return "leaf.arrow.triangle.circlepath" }
        if value.contains("travel") || value.contains("shipping") { return "airplane" }
        if value.contains("market") { return "chart.line.uptrend.xyaxis" }
        if value.contains("society") { return "person.3.fill" }
        return "circle.hexagongrid.fill"
    }

    @ViewBuilder
    private func labeledCopy(_ label: String, _ value: String?) -> some View {
        if let value, !value.isEmpty {
            VStack(alignment: .leading, spacing: TULIPSpacing.xSmall) {
                Text(label.uppercased())
                    .font(.caption2.weight(.bold))
                    .tracking(1)
                    .foregroundStyle(TULIPPalette.tertiaryText)
                Text(TULIPMetricDisplay.text(value))
                    .font(.subheadline)
                    .foregroundStyle(TULIPPalette.secondaryText)
                    .lineSpacing(3)
            }
        }
    }

    @ViewBuilder
    private func bulletList(_ items: [String]) -> some View {
        ForEach(items, id: \.self) { item in
            HStack(alignment: .top, spacing: TULIPSpacing.small) {
                Circle()
                    .fill(TULIPPalette.lavender)
                    .frame(width: 5, height: 5)
                    .padding(.top, TULIPSpacing.small)
                Text(item)
                    .font(.subheadline)
                    .foregroundStyle(TULIPPalette.secondaryText)
                    .lineSpacing(3)
            }
        }
    }
}

private struct TULIPScrollOffsetKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) { value = nextValue() }
}

private struct TULIPDockScrollTrackingModifier: ViewModifier {
    let isEnabled: Bool
    let onCompactChange: (Bool) -> Void
    @State private var legacyOffset: CGFloat = 0

    @ViewBuilder
    func body(content: Content) -> some View {
        if #available(iOS 18.0, *) {
            content.onScrollGeometryChange(
                for: CGFloat.self,
                of: { geometry in
                    max(0, geometry.contentOffset.y + geometry.contentInsets.top)
                },
                action: { previousOffset, currentOffset in
                    guard isEnabled else {
                        onCompactChange(false)
                        return
                    }
                    if currentOffset <= 8 {
                        onCompactChange(false)
                    } else if currentOffset > previousOffset + 2 {
                        onCompactChange(true)
                    } else if currentOffset < previousOffset - 2 {
                        onCompactChange(false)
                    }
                }
            )
        } else {
            content
                .coordinateSpace(name: "tulip-legacy-scroll")
                .background {
                    GeometryReader { proxy in
                        Color.clear.preference(
                            key: TULIPScrollOffsetKey.self,
                            value: proxy.frame(in: .named("tulip-legacy-scroll")).minY
                        )
                    }
                }
                .onPreferenceChange(TULIPScrollOffsetKey.self) { value in
                    guard isEnabled else {
                        onCompactChange(false)
                        return
                    }
                    if value >= -4 {
                        onCompactChange(false)
                    } else if value < legacyOffset - 3 {
                        onCompactChange(true)
                    } else if value > legacyOffset + 3 {
                        onCompactChange(false)
                    }
                    legacyOffset = value
                }
        }
    }
}

private struct TULIPActivityHeaderHeightKey: PreferenceKey {
    static var defaultValue: CGFloat = 0

    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = max(value, nextValue())
    }
}

struct TULIPActivityView: View {
    let profiles: [TULIPActivityProfile]
    let resetRequest: Int
    let onScrollDirection: (Bool) -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var selectedKey = "food"
    @State private var mode = 0
    @State private var frozenHeaderHeight: CGFloat = 0
    @State private var contentResetRequest = 0
    @State private var isResetAnimating = false

    private var selectedProfile: TULIPActivityProfile? {
        profiles.first(where: { $0.key == selectedKey }) ?? profiles.first
    }

    var body: some View {
        ZStack(alignment: .top) {
            TULIPPalette.background
                .ignoresSafeArea()

            activityContent

            TULIPTopContentFade()
                .frame(height: frozenHeaderHeight + TULIPLayout.pinnedHeaderFadeExtension)
                .frame(maxHeight: .infinity, alignment: .top)
                .zIndex(0.5)

            frozenActivityHeader
                .background {
                    GeometryReader { geometry in
                        Color.clear.preference(
                            key: TULIPActivityHeaderHeightKey.self,
                            value: geometry.size.height
                        )
                    }
                }
                .zIndex(1)
        }
        .onPreferenceChange(TULIPActivityHeaderHeightKey.self) { height in
            frozenHeaderHeight = height
        }
        .preferredColorScheme(.dark)
        .onAppear {
            if !profiles.contains(where: { $0.key == selectedKey }), let first = profiles.first {
                selectedKey = first.key
            }
        }
        .onChange(of: selectedKey) { _, _ in
            if !isResetAnimating {
                TULIPHaptics.selection()
            }
            onScrollDirection(false)
        }
        .task(id: resetRequest) {
            guard resetRequest > 0 else { return }
            await resetActivity()
        }
    }

    @ViewBuilder
    private var activityContent: some View {
        if profiles.isEmpty {
            TULIPEmptyState(title: "Activity data unavailable", message: "The shared activity snapshot could not be loaded.")
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else {
            TabView(selection: $selectedKey) {
                ForEach(profiles) { profile in
                    activityPage(profile)
                        .id("\(profile.key)-\(contentResetRequest)")
                        .tag(profile.key)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
        }
    }

    @MainActor
    private func resetActivity() async {
        guard !profiles.isEmpty else { return }
        let defaultIndex = profiles.firstIndex(where: { $0.key == "food" }) ?? 0
        let currentIndex = profiles.firstIndex(where: { $0.key == selectedKey }) ?? defaultIndex

        isResetAnimating = true
        defer { isResetAnimating = false }
        mode = 0
        onScrollDirection(false)

        guard !reduceMotion, currentIndex > defaultIndex else {
            selectedKey = profiles[defaultIndex].key
            contentResetRequest += 1
            TULIPHaptics.selection()
            return
        }

        let destinationIndices = Array(stride(from: currentIndex - 1, through: defaultIndex, by: -1))
        for (stepIndex, profileIndex) in destinationIndices.enumerated() {
            guard !Task.isCancelled else { return }
            let progress = destinationIndices.count <= 1
                ? 1
                : Double(stepIndex) / Double(destinationIndices.count - 1)
            let duration = 0.15 - (0.08 * progress)
            withAnimation(.easeOut(duration: duration)) {
                selectedKey = profiles[profileIndex].key
            }
            try? await Task.sleep(for: .seconds(duration))
        }

        guard !Task.isCancelled else { return }
        contentResetRequest += 1
        TULIPHaptics.selection()
    }

    private var frozenActivityHeader: some View {
        VStack(alignment: .leading, spacing: TULIPSpacing.zero) {
            TULIPScreenHeader("Activity Impacts")

            categoryRail
                .padding(.top, TULIPSpacing.large)

            if let profile = selectedProfile {
                VStack(alignment: .leading, spacing: TULIPSpacing.standard) {
                    HStack(spacing: TULIPSpacing.compact) {
                        activityIcon(profile.key, color: themeColor(profile.key))
                            .frame(width: 28)
                        Text(profile.label)
                            .font(.title2.bold())
                            .foregroundStyle(TULIPPalette.text)
                    }
                    activityModeSelector
                }
                .padding(.horizontal, TULIPLayout.screenHorizontalPadding)
                .padding(.top, TULIPSpacing.large)
                .padding(.bottom, TULIPSpacing.standard)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var categoryRail: some View {
        ScrollViewReader { proxy in
            ScrollView(.horizontal) {
                TULIPGlassGroup(spacing: TULIPSpacing.small) {
                    LazyHStack(spacing: TULIPSpacing.small) {
                        ForEach(profiles) { profile in
                            Button(profile.label) {
                                withAnimation(TULIPMotion.animation(.standard, reduceMotion: reduceMotion)) {
                                    selectedKey = profile.key
                                }
                            }
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(selectedKey == profile.key ? .white : TULIPPalette.secondaryText)
                            .padding(.horizontal, TULIPLayout.rowHorizontalPadding)
                            .frame(minHeight: 44)
                            .tulipSelectableChrome(
                                in: Capsule(),
                                isSelected: selectedKey == profile.key,
                                selectionFill: themeColor(profile.key).opacity(0.82)
                            )
                            .id(profile.key)
                        }
                    }
                    .padding(.vertical, TULIPSpacing.small)
                }
                .padding(.horizontal, TULIPLayout.screenHorizontalPadding)
            }
            .scrollIndicators(.hidden)
            .scrollClipDisabled()
            .frame(height: 60)
            .onAppear { proxy.scrollTo(selectedKey, anchor: .center) }
            .onChange(of: selectedKey) { _, next in
                withAnimation(TULIPMotion.animation(.standard, reduceMotion: reduceMotion)) {
                    proxy.scrollTo(next, anchor: .center)
                }
            }
        }
    }

    private func activityPage(_ profile: TULIPActivityProfile) -> some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: TULIPLayout.sectionSpacing) {
                if mode == 0 {
                    impactPanel(profile)
                } else {
                    actionsPanel(profile)
                }
            }
            .padding(.top, frozenHeaderHeight)
            .padding(.horizontal, TULIPLayout.screenHorizontalPadding)
            .padding(.bottom, TULIPLayout.dockContentClearance)
        }
        .modifier(
            TULIPDockScrollTrackingModifier(
                isEnabled: profile.key == selectedKey,
                onCompactChange: onScrollDirection
            )
        )
    }

    private var activityModeOptions: [(id: Int, title: String, icon: String, color: Color)] {
        [
            (id: 0, title: "Impact", icon: "chart.bar.fill", color: TULIPPalette.red),
            (id: 1, title: "Actions", icon: "bolt.heart.fill", color: TULIPPalette.green),
        ]
    }

    @ViewBuilder
    private var activityModeSelector: some View {
#if TULIP_IOS27_SDK
        if #available(iOS 27.0, *) {
            Picker("Activity view", selection: $mode) {
                ForEach(activityModeOptions, id: \.id) { option in
                    Label(option.title, systemImage: option.icon)
                        .tag(option.id)
                }
            }
            .pickerStyle(.tabs)
            .tint(TULIPPalette.lavender)
            .onChange(of: mode) { _, _ in
                TULIPHaptics.selection()
            }
            .frame(maxWidth: .infinity)
            .accessibilityLabel("Activity view")
        } else {
            legacyActivityModeSelector
        }
#else
        legacyActivityModeSelector
#endif
    }

    private var legacyActivityModeSelector: some View {
        GeometryReader { geometry in
            HStack(spacing: TULIPSpacing.xSmall) {
                ForEach(activityModeOptions, id: \.id) { option in
                    Button {
                        TULIPHaptics.selection()
                        withAnimation(TULIPMotion.animation(.quick, reduceMotion: reduceMotion)) {
                            mode = option.id
                        }
                    } label: {
                        Label(option.title, systemImage: option.icon)
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(mode == option.id ? .white : option.color)
                            .frame(maxWidth: .infinity, minHeight: 42)
                            .background(
                                mode == option.id ? option.color.opacity(0.82) : Color.clear,
                                in: Capsule()
                            )
                            .contentShape(Capsule())
                    }
                    .buttonStyle(.plain)
                    .accessibilityAddTraits(mode == option.id ? .isSelected : [])
                }
            }
            .padding(TULIPSpacing.xSmall)
            .frame(width: geometry.size.width * 0.75)
            .frame(minHeight: 50)
            .tulipFloatingChrome(in: Capsule(), interactive: true)
            .frame(maxWidth: .infinity)
        }
        .frame(height: 50)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Activity view")
    }

    private func impactPanel(_ profile: TULIPActivityProfile) -> some View {
        let items = profile.lens.flattenedItems.filter { $0.hideBar != true }
        let scale = max(profile.lens.axisMax ?? 0, items.map(\.value).max() ?? 1)
        return TULIPSection(profile.lens.title ?? "Impact comparison") {
            ForEach(items) { item in
                VStack(alignment: .leading, spacing: TULIPSpacing.small) {
                    HStack(alignment: .firstTextBaseline) {
                        Text(item.label)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(TULIPPalette.text)
                        Spacer(minLength: 12)
                        Text(
                            "\(item.value.formatted(.number.precision(.fractionLength(0...2)))) \(compactImpactMetric(profile.lens.unitLabel))"
                        )
                            .font(.caption.weight(.bold).monospacedDigit())
                            .foregroundStyle(TULIPPalette.text)
                            .multilineTextAlignment(.trailing)
                            .lineLimit(2)
                    }
                    GeometryReader { proxy in
                        ZStack(alignment: .leading) {
                            Capsule().fill(.white.opacity(0.08))
                            Capsule()
                                .fill(
                                    LinearGradient(
                                        colors: [themeColor(profile.key), TULIPPalette.lavender],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .frame(width: max(5, proxy.size.width * min(1, item.value / max(1, scale))))
                        }
                    }
                    .frame(height: 8)
                    if let portion = item.typicalPortion {
                        Text("Serving Size: \(standardServingSize(portion))")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(TULIPPalette.secondaryText)
                    }
                    if let note = item.note {
                        Text(note)
                            .font(.subheadline)
                            .foregroundStyle(TULIPPalette.secondaryText)
                            .lineSpacing(3)
                    }
                }
                .padding(.vertical, TULIPSpacing.small)
            }
        }
    }

    private func actionsPanel(_ profile: TULIPActivityProfile) -> some View {
        VStack(spacing: TULIPLayout.sectionSpacing) {
            actionSection(
                "Personal",
                icon: "person.fill",
                items: profile.actions.personal ?? [],
                color: TULIPPalette.green
            )
            actionSection(
                "Community",
                icon: "person.3.fill",
                items: profile.actions.community ?? [],
                color: TULIPPalette.blue
            )
            actionSection(
                "Policy",
                icon: "building.columns.fill",
                items: profile.actions.policy ?? [],
                color: TULIPPalette.lavender
            )
        }
    }

    private func actionSection(_ title: String, icon: String, items: [String], color: Color) -> some View {
        TULIPSection(title, titleColor: color, systemImage: icon) {
            ForEach(items, id: \.self) { item in
                HStack(alignment: .top, spacing: TULIPSpacing.compact) {
                    Image(systemName: TULIPIconography.externalLink)
                        .font(.caption.weight(.bold))
                        .foregroundStyle(color)
                        .padding(.top, TULIPSpacing.xSmall)
                    Text(item)
                        .font(.body)
                        .foregroundStyle(TULIPPalette.secondaryText)
                        .lineSpacing(4)
                }
            }
        }
    }

    private func standardServingSize(_ portion: String) -> String {
        portion.replacingOccurrences(
            of: #"(\d)\s+g\b"#,
            with: "$1g",
            options: .regularExpression
        )
    }

    private func compactImpactMetric(_ metric: String?) -> String {
        (metric ?? "relative value")
            .replacingOccurrences(of: "kgCO2e per kg food", with: "kgCO₂e/kg food")
            .replacingOccurrences(of: "MtCO2e per year", with: "MtCO₂e/yr")
            .replacingOccurrences(of: " per year", with: "/yr")
            .replacingOccurrences(of: "CO2", with: "CO₂")
            .replacingOccurrences(of: "CH4", with: "CH₄")
    }

    private func themeColor(_ key: String) -> Color {
        switch key {
        case "food": .orange
        case "industry_farming", "deforestation_land_use": TULIPPalette.green
        case "methane", "electricity_generation", "air_conditioning_refrigerants": TULIPPalette.blue
        case "carbon_emission", "plastics_petrochemicals": TULIPPalette.red
        case "mining_critical_minerals", "ai_compute": TULIPPalette.lavender
        default: Color(red: 0.30, green: 0.82, blue: 0.84)
        }
    }

    @ViewBuilder
    private func activityIcon(_ key: String, color: Color) -> some View {
        if key == "industry_farming" {
            Image("IndustryFarmingIcon")
                .resizable()
                .renderingMode(.template)
                .scaledToFit()
                .foregroundStyle(color)
                .frame(width: 27, height: 27)
                .accessibilityHidden(true)
        } else {
            Image(systemName: TULIPIconography.activity(key))
                .font(.title3.weight(.semibold))
                .foregroundStyle(color)
                .accessibilityHidden(true)
        }
    }
}

private struct TULIPFootprintHeaderHeightKey: PreferenceKey {
    static var defaultValue: CGFloat = 0

    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = max(value, nextValue())
    }
}

struct TULIPFootprintView: View {
    let model: TULIPFootprintModel?
    let resetRequest: Int
    let onScrollDirection: (Bool) -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var step = 0
    @State private var answers: [String: String] = [:]
    @State private var selectedFlash: String?
    @State private var transitionDirection: Edge = .trailing
    @State private var frozenHeaderHeight: CGFloat = 0

    var body: some View {
        if let model {
            Group {
                if step < model.questions.count {
                    ZStack(alignment: .top) {
                        questionView(model.questions[step], model: model)
                            .id(step)
                            .padding(.top, frozenHeaderHeight)
                            .transition(
                                .asymmetric(
                                    insertion: .move(edge: transitionDirection).combined(with: .opacity),
                                    removal: .move(edge: transitionDirection == .trailing ? .leading : .trailing).combined(with: .opacity)
                                )
                            )

                        TULIPTopContentFade()
                            .frame(height: frozenHeaderHeight + TULIPLayout.pinnedHeaderFadeExtension)
                            .frame(maxHeight: .infinity, alignment: .top)
                            .zIndex(0.5)

                        footprintQuestionHeader(model)
                            .background {
                                GeometryReader { geometry in
                                    Color.clear.preference(
                                        key: TULIPFootprintHeaderHeightKey.self,
                                        value: geometry.size.height
                                    )
                                }
                            }
                            .zIndex(1)
                    }
                    .onPreferenceChange(TULIPFootprintHeaderHeightKey.self) { height in
                        frozenHeaderHeight = height
                    }
                } else {
                    summaryView(model)
                        .transition(.move(edge: .trailing).combined(with: .opacity))
                }
            }
            .background(TULIPPalette.background)
            .gesture(backGesture)
            .onAppear {
                restoreAnswers(model)
#if DEBUG
                if ProcessInfo.processInfo.arguments.contains("-TULIPShowFootprintResult") {
                    answers = model.baselineSelections
                    step = model.questions.count
                }
#endif
            }
            .onChange(of: answers) { _, _ in persistAnswers() }
            .onChange(of: step) { _, _ in
                onScrollDirection(false)
            }
            .onChange(of: resetRequest) { _, _ in
                returnToBubbleGraph(model)
            }
        } else {
            TULIPEmptyState(title: "Footprint model unavailable", message: "The shared questionnaire could not be loaded.")
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(TULIPPalette.background)
        }
    }

    private func footprintQuestionHeader(_ model: TULIPFootprintModel) -> some View {
        VStack(spacing: TULIPSpacing.zero) {
            TULIPScreenHeader(
                "My Footprint",
                subtitle: "See how your home, travel, food, and purchases shape your annual carbon, water, land, and material footprint."
            )
            if !answers.isEmpty {
                metricStrip(TULIPFootprintCalculator.calculate(model: model, answers: answers))
                    .padding(.horizontal, TULIPLayout.screenHorizontalPadding)
                    .padding(.top, TULIPLayout.contentTopPadding)
            }
            ProgressView(value: Double(step + 1) / Double(model.questions.count))
                .tint(TULIPPalette.lavender)
                .padding(.horizontal, TULIPLayout.screenHorizontalPadding)
                .padding(.top, TULIPSpacing.compact)
                .padding(.bottom, TULIPSpacing.small)
        }
    }

    private func questionView(_ question: TULIPFootprintQuestion, model: TULIPFootprintModel) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TULIPSpacing.large) {
                Text(question.title)
                    .font(.title2.bold())
                    .foregroundStyle(TULIPPalette.text)
                    .fixedSize(horizontal: false, vertical: true)
                VStack(spacing: TULIPSpacing.compact) {
                    ForEach(question.options) { option in
                        Button {
                            choose(option, for: question, model: model)
                        } label: {
                            Text(option.label)
                                .font(.body.weight(.semibold))
                                .foregroundStyle(selectedFlash == option.value ? Color.black : TULIPPalette.text)
                                .frame(maxWidth: .infinity, minHeight: 52, alignment: .leading)
                                .padding(.horizontal, TULIPLayout.rowHorizontalPadding)
                                .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .tulipSolidControl(
                            in: Capsule(),
                            fill: selectedFlash == option.value
                                ? Color.white
                                : (answers[question.key] == option.value
                                    ? TULIPPalette.lavender.opacity(0.72)
                                    : TULIPPalette.surface)
                        )
                        .accessibilityAddTraits(answers[question.key] == option.value ? .isSelected : [])
                    }
                }
            }
            .padding(.horizontal, TULIPLayout.screenHorizontalPadding)
            .padding(.top, TULIPSpacing.large)
            .padding(.bottom, TULIPLayout.dockContentClearance + TULIPSpacing.compact)
        }
        .modifier(
            TULIPDockScrollTrackingModifier(
                isEnabled: true,
                onCompactChange: onScrollDirection
            )
        )
        .scrollBounceBehavior(.basedOnSize)
    }

    private func choose(
        _ option: TULIPFootprintOption,
        for question: TULIPFootprintQuestion,
        model: TULIPFootprintModel
    ) {
        guard selectedFlash == nil else { return }
        TULIPHaptics.selection()
        answers[question.key] = option.value
        selectedFlash = option.value
        transitionDirection = .trailing
        DispatchQueue.main.asyncAfter(deadline: .now() + TULIPMotion.footprintAdvanceDelay) {
            selectedFlash = nil
            withAnimation(TULIPMotion.animation(.deliberate, reduceMotion: reduceMotion)) {
                step = min(model.questions.count, step + 1)
            }
        }
    }

    private var backGesture: some Gesture {
        DragGesture(minimumDistance: 24)
            .onEnded { value in
                guard value.translation.width >= 64,
                      abs(value.translation.width) > abs(value.translation.height) * 1.25,
                      step > 0 else { return }
                transitionDirection = .leading
                TULIPHaptics.impact()
                withAnimation(TULIPMotion.animation(.deliberate, reduceMotion: reduceMotion)) {
                    step -= 1
                }
            }
    }

    private func metricStrip(_ result: TULIPFootprintResult) -> some View {
        HStack(spacing: TULIPSpacing.small) {
            metricCompact("Carbon", value: result.carbon.formatted(.number.precision(.fractionLength(1))), unit: "t")
            metricCompact("Land", value: result.land.formatted(.number.precision(.fractionLength(0))), unit: "m²")
            metricCompact("Water", value: result.water.formatted(.number.precision(.fractionLength(0))), unit: "m³")
            metricCompact("RME", value: result.material.formatted(.number.precision(.fractionLength(1))), unit: "t")
        }
    }

    private func metricCompact(_ label: String, value: String, unit: String) -> some View {
        VStack(alignment: .leading, spacing: TULIPSpacing.hairline) {
            Text(label.uppercased())
                .font(.caption2.weight(.bold))
                .foregroundStyle(TULIPPalette.tertiaryText)
            Text("\(value) \(unit)")
                .font(.caption.weight(.semibold).monospacedDigit())
                .foregroundStyle(TULIPPalette.text)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func summaryView(_ model: TULIPFootprintModel) -> some View {
        let result = TULIPFootprintCalculator.calculate(model: model, answers: answers)
        let contributions = TULIPFootprintCalculator.carbonContributions(model: model, answers: answers)
        let insights = TULIPFootprintInsightGenerator.generate(model: model, answers: answers)

        return TULIPFootprintBubbleResultView(
            model: model,
            result: result,
            contributions: contributions,
            insights: insights,
            resetRequest: resetRequest,
            onScrollDirection: onScrollDirection,
            onReview: reviewAnswers,
            onStartOver: startOver
        )
    }

    private func returnToBubbleGraph(_ model: TULIPFootprintModel) {
        guard model.questions.allSatisfy({ answers[$0.key] != nil }) else { return }
        transitionDirection = .trailing
        withAnimation(TULIPMotion.animation(.quick, reduceMotion: reduceMotion)) {
            step = model.questions.count
        }
    }

    private func reviewAnswers() {
        transitionDirection = .leading
        withAnimation(TULIPMotion.animation(.deliberate, reduceMotion: reduceMotion)) { step = 0 }
    }

    private func startOver() {
        answers.removeAll()
        UserDefaults.standard.removeObject(forKey: "TULIPFootprintAnswers")
        transitionDirection = .leading
        withAnimation(TULIPMotion.animation(.deliberate, reduceMotion: reduceMotion)) { step = 0 }
    }

    private func restoreAnswers(_ model: TULIPFootprintModel) {
        guard let data = UserDefaults.standard.data(forKey: "TULIPFootprintAnswers"),
              let decoded = try? JSONDecoder().decode([String: String].self, from: data) else { return }
        answers = decoded
        if model.questions.allSatisfy({ decoded[$0.key] != nil }) {
            step = model.questions.count
        }
    }

    private func persistAnswers() {
        guard let data = try? JSONEncoder().encode(answers) else { return }
        UserDefaults.standard.set(data, forKey: "TULIPFootprintAnswers")
    }
}

private struct TULIPFootprintBubbleResultView: View {
    let model: TULIPFootprintModel
    let result: TULIPFootprintResult
    let contributions: [TULIPFootprintCarbonContribution]
    let insights: [TULIPFootprintInsight]
    let resetRequest: Int
    let onScrollDirection: (Bool) -> Void
    let onReview: () -> Void
    let onStartOver: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var bubblesVisible = false
    @State private var scrollCueBounces = false
    @State private var startOverProgress: CGFloat = 0
    @State private var isStartingOver = false
    @State private var isPressingStartOver = false
    @State private var startOverHapticTask: Task<Void, Never>?

    private let startOverHoldDuration: TimeInterval = 2

    private let compositionSlots: [FootprintBubbleCompositionSlot] = [
        .init(
            label: "Diet",
            center: CGPoint(x: 0.59, y: 0.35),
            labelOffset: .zero,
            color: .init(red: 0.80, green: 0.48, blue: 0.66),
            gradientStart: .top,
            gradientEnd: .bottomTrailing
        ),
        .init(
            label: "Home Type",
            center: CGPoint(x: 0.29, y: 0.72),
            labelOffset: .zero,
            color: .init(red: 0.84, green: 0.37, blue: 0.00),
            gradientStart: .topLeading,
            gradientEnd: .bottomTrailing
        ),
        .init(
            label: "Home Energy",
            center: CGPoint(x: 0.33, y: 0.18),
            labelOffset: CGPoint(x: 0.020, y: 0.014),
            color: .init(red: 0.94, green: 0.89, blue: 0.26),
            gradientStart: .topLeading,
            gradientEnd: .bottomTrailing
        ),
        .init(
            label: "Everyday Travel",
            center: CGPoint(x: 0.18, y: 0.16),
            labelOffset: CGPoint(x: -0.020, y: -0.012),
            color: .init(red: 0.00, green: 0.45, blue: 0.70),
            gradientStart: .bottomTrailing,
            gradientEnd: .topLeading
        ),
        .init(
            label: "Other Purchases",
            center: CGPoint(x: 0.18, y: 0.33),
            labelOffset: CGPoint(x: -0.008, y: 0),
            color: .init(red: 0.34, green: 0.71, blue: 0.91),
            gradientStart: .topLeading,
            gradientEnd: .bottomTrailing
        ),
        .init(
            label: "Flights",
            center: CGPoint(x: 0.25, y: 0.48),
            labelOffset: CGPoint(x: 0.006, y: 0.006),
            color: .init(red: 0.00, green: 0.62, blue: 0.45),
            gradientStart: .topLeading,
            gradientEnd: .bottomTrailing
        ),
        .init(
            label: "Food Waste",
            center: CGPoint(x: 0.56, y: 0.82),
            labelOffset: CGPoint(x: -0.006, y: 0),
            color: .init(red: 0.90, green: 0.62, blue: 0.00),
            gradientStart: .topLeading,
            gradientEnd: .bottomTrailing
        ),
        .init(
            label: "Clothing",
            center: CGPoint(x: 0.75, y: 0.82),
            labelOffset: CGPoint(x: 0.006, y: 0),
            color: .init(red: 0.65, green: 0.52, blue: 0.95),
            gradientStart: .topLeading,
            gradientEnd: .bottomTrailing
        ),
    ]

    private var rankedContributions: [TULIPFootprintCarbonContribution] {
        contributions.sorted {
            if $0.carbon == $1.carbon { return $0.label < $1.label }
            return $0.carbon > $1.carbon
        }
    }

    var body: some View {
        GeometryReader { viewport in
            let heroHeight = max(viewport.size.width, viewport.size.height)

            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: TULIPSpacing.large) {
                        bubbleCanvas(
                            size: CGSize(width: viewport.size.width, height: heroHeight),
                            onShowActions: {
                                TULIPHaptics.button()
                                withAnimation(TULIPMotion.animation(.standard, reduceMotion: reduceMotion)) {
                                    proxy.scrollTo("footprint-personalized-insights", anchor: .top)
                                }
                            }
                        )
                        .frame(height: heroHeight)
                        .id("footprint-bubble-hero")

                        TULIPFootprintInsightsView(insights: insights)
                            .padding(.horizontal, TULIPLayout.screenHorizontalPadding)
                            .id("footprint-personalized-insights")

                        TULIPFootprintResultDetailsView(
                            model: model,
                            result: result,
                            contributions: rankedContributions
                        )
                        .padding(.horizontal, TULIPLayout.screenHorizontalPadding)

                        resultControls
                            .padding(.horizontal, TULIPLayout.screenHorizontalPadding)
                    }
                    .padding(.bottom, TULIPLayout.dockContentClearance)
                }
                .scrollIndicators(.hidden)
                .scrollBounceBehavior(.basedOnSize)
                .modifier(
                    TULIPDockScrollTrackingModifier(
                        isEnabled: true,
                        onCompactChange: onScrollDirection
                    )
                )
                .onChange(of: resetRequest) { _, _ in
                    withAnimation(TULIPMotion.animation(.quick, reduceMotion: reduceMotion)) {
                        proxy.scrollTo("footprint-bubble-hero", anchor: .top)
                    }
                }
#if DEBUG
                .onAppear {
                    guard ProcessInfo.processInfo.arguments.contains("-TULIPShowFootprintInsights") else { return }
                    DispatchQueue.main.async {
                        proxy.scrollTo("footprint-personalized-insights", anchor: .top)
                    }
                }
#endif
            }
        }
        .background(.black)
        .onAppear {
            if !bubblesVisible {
                if reduceMotion {
                    bubblesVisible = true
                } else {
                    withAnimation(TULIPMotion.animation(.reveal, reduceMotion: false)) {
                        bubblesVisible = true
                    }
                }
            }

            guard !reduceMotion, !scrollCueBounces else { return }
            withAnimation(TULIPMotion.animation(.scrollCue, reduceMotion: reduceMotion)) {
                scrollCueBounces = true
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(
            "Your annual carbon footprint is \(carbonValue(result.carbon)). "
            + "The bubbles show the sources that make up that footprint."
        )
    }

    private func bubbleCanvas(size: CGSize, onShowActions: @escaping () -> Void) -> some View {
        let layouts = bubbleLayouts(in: size)

        return ZStack {
            Color.black

            TULIPGlassGroup(spacing: 0) {
                ZStack {
                    ForEach(layouts) { layout in
                        bubbleFill(layout)
                    }
                }
                .frame(width: size.width, height: size.height)
            }

            ForEach(layouts) { layout in
                bubbleLabel(layout)
            }

            VStack(spacing: 0) {
                TULIPScreenHeader("My Footprint") {
                    startOverButton
                }
                Spacer(minLength: 0)
            }

            Button(action: onShowActions) {
                Image("FootprintScrollCue")
                    .resizable()
                    .scaledToFit()
                    .foregroundStyle(Color.white.opacity(0.94))
                    .frame(width: 17, height: 13)
                    .shadow(color: .black.opacity(0.72), radius: 5, y: 2)
                    .offset(y: scrollCueBounces ? 6 : 0)
                    .frame(
                        width: TULIPLayout.minimumTouchTarget,
                        height: TULIPLayout.minimumTouchTarget
                    )
                    .contentShape(Rectangle())
            }
                .buttonStyle(.plain)
                .position(
                    x: size.width / 2,
                    y: max(24, size.height - TULIPLayout.dockContentClearance - 24)
                )
                .accessibilityLabel("Show five actions for you")
        }
        .clipped()
    }

    private func bubbleLayouts(in size: CGSize) -> [FootprintBubbleLayout] {
        let contributionByLabel = Dictionary(uniqueKeysWithValues: contributions.map { ($0.label, $0) })
        let largestImpact = max(0.1, contributions.map(\.carbon).max() ?? 0.1)
        let scale = min(size.width, size.height)
        let origin = CGPoint(
            x: (size.width - scale) / 2,
            y: (size.height - scale) / 2
        )
        var placements = compositionSlots.enumerated().compactMap { index, slot -> FootprintBubblePlacement? in
            guard let contribution = contributionByLabel[slot.label] else { return nil }
            let impact = min(1, max(0, contribution.carbon / largestImpact))
            let visualImpact = pow(impact, 0.62)
            // Circle area, rather than diameter, represents carbon contribution.
            // The minimum keeps very small categories and their labels usable.
            let diameterRatio = max(0.19, 0.63 * CGFloat(sqrt(impact)))
            let targetCenter = CGPoint(
                x: origin.x + (scale * slot.center.x),
                y: origin.y + (scale * slot.center.y)
            )
            return FootprintBubblePlacement(
                contribution: contribution,
                rank: index,
                diameter: scale * diameterRatio,
                center: targetCenter,
                targetCenter: targetCenter,
                labelOffset: CGPoint(
                    x: scale * slot.labelOffset.x,
                    y: scale * slot.labelOffset.y
                ),
                gradientStops: bubbleGradientStops(for: slot, visualImpact: visualImpact),
                gradientStart: slot.gradientStart,
                gradientEnd: slot.gradientEnd,
                opacity: 0.58 + (0.38 * visualImpact)
            )
        }

        packBubbles(&placements, in: size)

        return placements.map { placement in
            FootprintBubbleLayout(
                contribution: placement.contribution,
                rank: placement.rank,
                diameter: placement.diameter,
                center: placement.center,
                labelCenter: CGPoint(
                    x: placement.center.x + placement.labelOffset.x,
                    y: placement.center.y + placement.labelOffset.y
                ),
                gradientStops: placement.gradientStops,
                gradientStart: placement.gradientStart,
                gradientEnd: placement.gradientEnd,
                opacity: placement.opacity
            )
        }
    }

    private func packBubbles(_ placements: inout [FootprintBubblePlacement], in size: CGSize) {
        guard placements.count > 1 else {
            if !placements.isEmpty {
                clampBubble(&placements[0], in: size)
            }
            return
        }

        for index in placements.indices {
            clampBubble(&placements[index], in: size)
        }

        // Relax the authored composition into the available viewport. Bubbles may
        // still intersect, but every label gets a protected, readable clearing.
        for _ in 0..<120 {
            for leftIndex in placements.indices {
                for rightIndex in placements.indices where rightIndex > leftIndex {
                    let left = placements[leftIndex]
                    let right = placements[rightIndex]
                    let deltaX = right.center.x - left.center.x
                    let deltaY = right.center.y - left.center.y
                    let distance = max(0.001, hypot(deltaX, deltaY))
                    let leftLabelReach = hypot(left.labelOffset.x, left.labelOffset.y)
                        + labelProtectionRadius(for: left)
                    let rightLabelReach = hypot(right.labelOffset.x, right.labelOffset.y)
                        + labelProtectionRadius(for: right)
                    let requiredDistance = max(
                        left.radius + rightLabelReach,
                        right.radius + leftLabelReach
                    ) + 4

                    guard distance < requiredDistance else { continue }

                    let overlap = requiredDistance - distance
                    let directionX: CGFloat
                    let directionY: CGFloat
                    if distance <= 0.001 {
                        let angle = CGFloat(leftIndex + rightIndex + 1) * 0.91
                        directionX = cos(angle)
                        directionY = sin(angle)
                    } else {
                        directionX = deltaX / distance
                        directionY = deltaY / distance
                    }
                    let combinedRadius = max(1, left.radius + right.radius)
                    let leftShare = right.radius / combinedRadius
                    let rightShare = left.radius / combinedRadius

                    placements[leftIndex].center.x -= directionX * overlap * leftShare
                    placements[leftIndex].center.y -= directionY * overlap * leftShare
                    placements[rightIndex].center.x += directionX * overlap * rightShare
                    placements[rightIndex].center.y += directionY * overlap * rightShare
                }
            }

            for index in placements.indices {
                // A gentle pull preserves the deliberate visual composition while
                // the stronger collision pass keeps labels and edges safe.
                placements[index].center.x += (
                    placements[index].targetCenter.x - placements[index].center.x
                ) * 0.008
                placements[index].center.y += (
                    placements[index].targetCenter.y - placements[index].center.y
                ) * 0.008
                clampBubble(&placements[index], in: size)
            }
        }
    }

    private func labelProtectionRadius(for placement: FootprintBubblePlacement) -> CGFloat {
        min(52, max(32, placement.radius * 0.40))
    }

    private func clampBubble(_ placement: inout FootprintBubblePlacement, in size: CGSize) {
        let horizontalMargin: CGFloat = 8
        let topBoundary = TULIPLayout.screenHeaderTopPadding + 54
        let bottomBoundary = max(
            topBoundary,
            size.height - TULIPLayout.dockContentClearance - 54
        )
        let minimumX = horizontalMargin + placement.radius
        let maximumX = max(minimumX, size.width - horizontalMargin - placement.radius)
        let minimumY = topBoundary + placement.radius
        let maximumY = max(minimumY, bottomBoundary - placement.radius)

        placement.center.x = min(maximumX, max(minimumX, placement.center.x))
        placement.center.y = min(maximumY, max(minimumY, placement.center.y))
    }

    private func bubbleGradientStops(
        for slot: FootprintBubbleCompositionSlot,
        visualImpact: Double
    ) -> [Gradient.Stop] {
        let sampleCount = 32
        let impactBrightness = 0.82 + (0.18 * visualImpact)

        return (0...sampleCount).map { sample in
            let progress = Double(sample) / Double(sampleCount)
            let eased = progress * progress * (3 - (2 * progress))
            let colorProgress = pow(eased, 1.08)
            let brightness = colorProgress * impactBrightness

            return Gradient.Stop(
                color: Color(
                    red: min(1, slot.color.red * brightness),
                    green: min(1, slot.color.green * brightness),
                    blue: min(1, slot.color.blue * brightness)
                ),
                location: progress
            )
        }
    }

    @ViewBuilder
    private func bubbleFill(_ layout: FootprintBubbleLayout) -> some View {
        let bubble = Circle()
            .fill(
                LinearGradient(
                    gradient: Gradient(stops: layout.gradientStops),
                    startPoint: layout.gradientStart,
                    endPoint: layout.gradientEnd
                )
            )
            .frame(width: layout.diameter, height: layout.diameter)
            .scaleEffect(bubblesVisible ? 1 : 0.72)
            .opacity(bubblesVisible ? layout.opacity : 0)

        bubble
            .modifier(
                BubblePresentationModifier(
                    layout: layout,
                    bubblesVisible: bubblesVisible,
                    reduceMotion: reduceMotion
                )
            )
    }

    private struct BubblePresentationModifier: ViewModifier {
        let layout: FootprintBubbleLayout
        let bubblesVisible: Bool
        let reduceMotion: Bool

        func body(content: Content) -> some View {
            content
                .animation(
            TULIPMotion.animation(
                .reveal,
                reduceMotion: reduceMotion,
                delay: Double(layout.rank) * TULIPMotion.staggerDelay
            ),
                    value: bubblesVisible
                )
                .position(layout.center)
                .accessibilityHidden(true)
        }
    }

    private func bubbleLabel(_ layout: FootprintBubbleLayout) -> some View {
        let titleSize = min(20, max(10, layout.diameter * 0.080))
        let valueSize = min(16, max(9, layout.diameter * 0.058))
        return VStack(spacing: max(3, layout.diameter * 0.025)) {
            Text(bubbleDisplayLabel(layout.contribution.label))
                .font(.system(size: titleSize, weight: .bold, design: .default))
                .lineLimit(1)
                .minimumScaleFactor(0.55)
                .multilineTextAlignment(.center)
            Text(carbonValue(layout.contribution.carbon))
                .font(.system(size: valueSize, weight: .medium, design: .default).monospacedDigit())
                .lineLimit(1)
                .minimumScaleFactor(0.75)
        }
        .foregroundStyle(Color.white.opacity(0.95))
        .shadow(color: .black.opacity(0.62), radius: 3, y: 1)
        .frame(width: layout.diameter * 0.76)
        .scaleEffect(bubblesVisible ? 1 : 0.86)
        .opacity(bubblesVisible ? 1 : 0)
        .animation(
            TULIPMotion.animation(
                .deliberate,
                reduceMotion: reduceMotion,
                delay: 0.22 + Double(layout.rank) * TULIPMotion.staggerDelay
            ),
            value: bubblesVisible
        )
        .position(layout.labelCenter)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(layout.contribution.label), \(carbonValue(layout.contribution.carbon))")
    }

    private func bubbleDisplayLabel(_ label: String) -> String {
        switch label {
        case "Everyday Travel": "Travel"
        case "Home Energy": "Energy"
        case "Other Purchases": "Purchases"
        default: label
        }
    }

    private var resultControls: some View {
        Button {
            TULIPHaptics.button()
            onReview()
        } label: {
            Label("Review Answers", systemImage: "list.bullet.clipboard")
                .frame(maxWidth: .infinity, minHeight: TULIPLayout.primaryControlHeight)
        }
        .tulipSolidControl(in: Capsule())
        .font(TULIPTypography.control)
        .foregroundStyle(TULIPPalette.text)
        .buttonStyle(.plain)
        .frame(minHeight: TULIPLayout.minimumTouchTarget)
    }

    private var startOverButton: some View {
        startOverButtonLabel
            .onLongPressGesture(
                minimumDuration: startOverHoldDuration,
                maximumDistance: 32,
                pressing: updateStartOverPress,
                perform: commitStartOver
            )
            .accessibilityAddTraits(.isButton)
            .accessibilityLabel("Start Over")
            .accessibilityHint("Press and hold for two seconds to remove your saved answers")
            .accessibilityValue(isStartingOver ? "Starting over" : isPressingStartOver ? "Hold to continue" : "Ready")
            .accessibilityAction {
                commitStartOver()
            }
            .onDisappear {
                startOverHapticTask?.cancel()
            }
    }

    private var startOverButtonLabel: some View {
        Label("Start Over", systemImage: "arrow.counterclockwise")
            .font(TULIPTypography.control)
            .foregroundStyle(Color.white)
            .padding(.horizontal, TULIPSpacing.standard)
            .frame(minHeight: TULIPLayout.minimumTouchTarget)
            .background {
                startOverFill
            }
            .overlay {
                Capsule().stroke(Color.white.opacity(0.08), lineWidth: 0.6)
            }
            .contentShape(Capsule())
    }

    private var startOverFill: some View {
        GeometryReader { geometry in
            let fillWidth = geometry.size.width * startOverProgress
            ZStack(alignment: .leading) {
                Capsule().fill(TULIPPalette.surface)
                Rectangle()
                    .fill(TULIPPalette.blue)
                    .frame(width: fillWidth)
            }
            .clipShape(Capsule())
        }
    }

    private func updateStartOverPress(_ isPressing: Bool) {
        guard !isStartingOver else { return }
        if isPressing {
            guard !isPressingStartOver else { return }
            isPressingStartOver = true
            startOverHapticTask?.cancel()
            withAnimation(.linear(duration: startOverHoldDuration)) {
                startOverProgress = 1
            }
            startOverHapticTask = Task { @MainActor in
                var hapticProgress: CGFloat = 0
                while !Task.isCancelled, hapticProgress < 1 {
                    TULIPHaptics.startOverHold(progress: hapticProgress)
                    let interval = 0.18 - (0.12 * Double(hapticProgress))
                    do {
                        try await Task.sleep(nanoseconds: UInt64(interval * 1_000_000_000))
                    } catch {
                        return
                    }
                    hapticProgress = min(
                        1,
                        hapticProgress + CGFloat(interval / startOverHoldDuration)
                    )
                }
            }
        } else {
            isPressingStartOver = false
            startOverHapticTask?.cancel()
            startOverHapticTask = nil
            guard !isStartingOver else { return }
            withAnimation(TULIPMotion.animation(.quick, reduceMotion: reduceMotion)) {
                startOverProgress = 0
            }
        }
    }

    private func commitStartOver() {
        guard !isStartingOver else { return }
        isStartingOver = true
        isPressingStartOver = false
        startOverHapticTask?.cancel()
        startOverHapticTask = nil
        startOverProgress = 1
        TULIPHaptics.success()
        onStartOver()
    }

    private func carbonValue(_ value: Double) -> String {
        "\(value.formatted(.number.precision(.fractionLength(1)))) tCO₂e/yr"
    }
}

private struct TULIPFootprintInsightsView: View {
    let insights: [TULIPFootprintInsight]

    var body: some View {
        TULIPSection(
            "Five actions for you",
            titleColor: TULIPPalette.lavender,
            systemImage: "sparkles"
        ) {
            ForEach(Array(insights.enumerated()), id: \.element.id) { index, insight in
                insightRow(insight, number: index + 1)

                if index < insights.count - 1 {
                    Divider()
                        .overlay(TULIPPalette.tertiaryText.opacity(0.28))
                }
            }
        }
    }

    private func insightRow(_ insight: TULIPFootprintInsight, number: Int) -> some View {
        HStack(alignment: .top, spacing: TULIPSpacing.compact) {
            ZStack {
                Circle()
                    .fill(color(for: insight.categoryKey).opacity(0.16))
                Image(systemName: icon(for: insight.categoryKey))
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(color(for: insight.categoryKey))
            }
            .frame(width: 38, height: 38)
            .overlay(alignment: .topTrailing) {
                Text("\(number)")
                    .font(.system(size: 9, weight: .bold, design: .rounded))
                    .foregroundStyle(.black)
                    .frame(width: 17, height: 17)
                    .background(Color.white, in: Circle())
                    .offset(x: 4, y: -4)
            }
            .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: TULIPSpacing.small) {
                Text(insight.title)
                    .font(.headline)
                    .foregroundStyle(TULIPPalette.text)
                    .fixedSize(horizontal: false, vertical: true)

                Text(insight.action)
                    .font(TULIPTypography.body)
                    .foregroundStyle(TULIPPalette.text)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(.vertical, TULIPSpacing.xSmall)
        .accessibilityElement(children: .combine)
    }

    private func icon(for key: String) -> String {
        switch key {
        case "home_energy": "bolt.fill"
        case "everyday_travel": "bus.fill"
        case "flights": "airplane"
        case "diet": "fork.knife"
        case "food_waste": "takeoutbag.and.cup.and.straw.fill"
        case "new_clothes": "tshirt.fill"
        case "other_stuff": "shippingbox.fill"
        default: "leaf.fill"
        }
    }

    private func color(for key: String) -> Color {
        switch key {
        case "home_energy": TULIPPalette.red
        case "everyday_travel": TULIPPalette.blue
        case "flights": TULIPPalette.lavender
        case "diet": TULIPPalette.green
        case "food_waste": Color(red: 0.95, green: 0.72, blue: 0.24)
        case "new_clothes": Color(red: 0.91, green: 0.52, blue: 0.84)
        case "other_stuff": Color(red: 0.45, green: 0.83, blue: 0.82)
        default: TULIPPalette.text
        }
    }
}

private struct TULIPFootprintResultDetailsView: View {
    let model: TULIPFootprintModel
    let result: TULIPFootprintResult
    let contributions: [TULIPFootprintCarbonContribution]

    var body: some View {
        LazyVStack(spacing: TULIPSpacing.large) {
            HStack(spacing: TULIPSpacing.small) {
                Image(systemName: "globe.americas.fill")
                    .font(.caption.weight(.bold))
                Text("YOUR FOOTPRINT")
                    .font(TULIPTypography.sectionLabel)
                    .tracking(1.5)
            }
            .foregroundStyle(TULIPPalette.blue)
            .frame(maxWidth: .infinity, alignment: .leading)

            TULIPSection(
                "Your footprint in human terms",
                titleColor: TULIPPalette.text,
                systemImage: TULIPIconography.comparison
            ) {
                ForEach(equivalencies) { item in
                    HStack(alignment: .top, spacing: TULIPSpacing.compact) {
                        Image(systemName: item.icon)
                            .font(.headline)
                            .foregroundStyle(item.color)
                            .frame(width: TULIPLayout.minimumTouchTarget)

                        VStack(alignment: .leading, spacing: TULIPSpacing.xSmall) {
                            Text(item.label)
                                .font(TULIPTypography.metadata.weight(.bold))
                                .foregroundStyle(TULIPPalette.secondaryText)
                            Text(item.headline)
                                .font(.title3.bold())
                                .foregroundStyle(TULIPPalette.text)
                            Text(item.detail)
                                .font(TULIPTypography.supporting)
                                .foregroundStyle(TULIPPalette.secondaryText)
                        }

                        Spacer(minLength: TULIPSpacing.small)
                    }
                    .padding(.vertical, TULIPSpacing.xSmall)
                    .accessibilityElement(children: .combine)
                }
            }

            TULIPSection(
                "What builds your carbon footprint",
                systemImage: TULIPIconography.breakdown
            ) {
                let maximum = max(1, contributions.map(\.carbon).max() ?? 1)
                ForEach(contributions.filter { $0.carbon > 0 }) { contribution in
                    VStack(alignment: .leading, spacing: TULIPSpacing.small) {
                        HStack(alignment: .firstTextBaseline, spacing: TULIPSpacing.small) {
                            Text(contribution.label)
                                .font(TULIPTypography.supporting.weight(.semibold))
                                .foregroundStyle(TULIPPalette.text)
                            Spacer(minLength: TULIPSpacing.small)
                            Text(carbonValue(contribution.carbon))
                                .font(TULIPTypography.metadata.weight(.bold).monospacedDigit())
                                .foregroundStyle(TULIPPalette.secondaryText)
                        }
                        ProgressView(value: contribution.carbon, total: maximum)
                            .tint(TULIPPalette.lavender)
                    }
                    .padding(.vertical, TULIPSpacing.xSmall)
                    .accessibilityElement(children: .combine)
                }
            }

            TULIPSection("Compared with the worldwide average", systemImage: "scope") {
                comparisonRow(
                    "Carbon",
                    value: result.carbon,
                    average: model.annualReferences.carbonTonnes,
                    valueText: carbonValue(result.carbon),
                    averageText: carbonValue(model.annualReferences.carbonTonnes),
                    color: TULIPPalette.red
                )
                comparisonRow(
                    "Water",
                    value: result.water,
                    average: model.annualReferences.waterM3,
                    valueText: "\(whole(result.water)) m³ / year",
                    averageText: "\(whole(model.annualReferences.waterM3)) m³ / year",
                    color: TULIPPalette.blue
                )
                comparisonRow(
                    "Land",
                    value: result.land,
                    average: model.annualReferences.landM2,
                    valueText: "\(whole(result.land)) m² / year",
                    averageText: "\(whole(model.annualReferences.landM2)) m² / year",
                    color: TULIPPalette.green
                )
                comparisonRow(
                    "Materials",
                    value: result.material,
                    average: model.annualReferences.materialTonnes,
                    valueText: "\(decimal(result.material)) t RME / year",
                    averageText: "\(decimal(model.annualReferences.materialTonnes)) t RME / year",
                    color: TULIPPalette.lavender
                )
            }
        }
    }

    private func comparisonRow(
        _ label: String,
        value: Double,
        average: Double,
        valueText: String,
        averageText: String,
        color: Color
    ) -> some View {
        let ratio = value / max(average, 0.01)
        let percentage = Int((ratio * 100).rounded())
        let fill = LinearGradient(
            colors: [color.opacity(0.58), color],
            startPoint: .leading,
            endPoint: .trailing
        )

        return VStack(alignment: .leading, spacing: TULIPSpacing.small) {
            HStack(alignment: .firstTextBaseline, spacing: TULIPSpacing.small) {
                Text(label)
                    .font(TULIPTypography.supporting.weight(.semibold))
                    .foregroundStyle(TULIPPalette.text)
                Spacer(minLength: TULIPSpacing.small)
                Text(valueText)
                    .font(TULIPTypography.metadata.weight(.bold).monospacedDigit())
                    .foregroundStyle(TULIPPalette.secondaryText)
            }

            HStack(spacing: TULIPSpacing.small) {
                GeometryReader { proxy in
                    ZStack(alignment: .leading) {
                        Capsule()
                            .fill(Color.white.opacity(0.20))
                        Capsule()
                            .fill(fill)
                            .frame(width: proxy.size.width * min(max(ratio, 0), 1))
                    }
                }
                .frame(height: 8)

                Text("+")
                    .font(.title3.bold())
                    .foregroundStyle(fill)
                    .opacity(ratio > 1 ? 1 : 0)
                    .frame(width: 14)
                    .accessibilityHidden(true)

                Text("\(percentage)%")
                    .font(TULIPTypography.supporting.weight(.bold).monospacedDigit())
                    .foregroundStyle(TULIPPalette.text)
                    .frame(width: 54, alignment: .trailing)
            }

            Text("Worldwide average: \(averageText)")
            .font(TULIPTypography.metadata)
            .foregroundStyle(TULIPPalette.tertiaryText)
        }
        .padding(.vertical, TULIPSpacing.xSmall)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(
            "\(label). Your estimate is \(valueText), or \(percentage)% of the worldwide average. "
            + "The worldwide average is \(averageText)."
        )
    }

    private var equivalencies: [FootprintEquivalency] {
        let vehicleYears = result.carbon / 4.29
        let vehicleKilometres = readableCount(result.carbon / (0.000393 / 1.609344))
        let showers = readableCount(result.water * 1_000 / 65.1)
        let courts = result.land / 436.64
        let materialPackedSuitcases = (result.material * 1_000) / 23

        return [
            FootprintEquivalency(
                id: "carbon",
                label: "Carbon emissions",
                headline: vehicleYears >= 0.75
                    ? approximateCount(vehicleYears, singular: "car", plural: "cars")
                    : "~\(whole(Double(vehicleKilometres))) km",
                detail: vehicleYears >= 0.75
                    ? "driven for an entire year"
                    : "driven in a gasoline car",
                icon: "car.fill",
                color: TULIPPalette.red
            ),
            FootprintEquivalency(
                id: "water",
                label: "Water footprint",
                headline: "~\(whole(Double(showers))) showers",
                detail: "worth of water every year",
                icon: TULIPIconography.water,
                color: TULIPPalette.blue
            ),
            FootprintEquivalency(
                id: "land",
                label: "Land footprint",
                headline: approximateCount(courts, singular: "basketball court", plural: "basketball courts"),
                detail: "of cropland used throughout the year",
                icon: "basketball.fill",
                color: TULIPPalette.green
            ),
            FootprintEquivalency(
                id: "materials",
                label: "Material footprint",
                headline: approximateCount(
                    materialPackedSuitcases,
                    singular: "packed suitcase",
                    plural: "packed suitcases"
                ),
                detail: "at 23 kg each, equivalent in raw-material mass every year",
                icon: TULIPIconography.materials,
                color: TULIPPalette.lavender
            ),
        ]
    }

    private func readableCount(_ value: Double) -> Int {
        let interval = value >= 10_000 ? 1_000 : value >= 1_000 ? 100 : value >= 100 ? 10 : 1
        return max(1, Int((value / Double(interval)).rounded()) * interval)
    }

    private func approximateCount(_ value: Double, singular: String, plural: String) -> String {
        let rounded = max(1, Int(value.rounded()))
        return "~\(whole(Double(rounded))) \(rounded == 1 ? singular : plural)"
    }

    private func carbonValue(_ value: Double) -> String {
        "\(decimal(value)) tCO₂e / year"
    }

    private func decimal(_ value: Double) -> String {
        value.formatted(.number.precision(.fractionLength(1)))
    }

    private func whole(_ value: Double) -> String {
        value.formatted(.number.precision(.fractionLength(0)))
    }
}

private struct FootprintEquivalency: Identifiable {
    let id: String
    let label: String
    let headline: String
    let detail: String
    let icon: String
    let color: Color
}

private struct FootprintBubbleLayout: Identifiable {
    var id: String { contribution.id }

    let contribution: TULIPFootprintCarbonContribution
    let rank: Int
    let diameter: CGFloat
    let center: CGPoint
    let labelCenter: CGPoint
    let gradientStops: [Gradient.Stop]
    let gradientStart: UnitPoint
    let gradientEnd: UnitPoint
    let opacity: Double
}

private struct FootprintBubblePlacement {
    let contribution: TULIPFootprintCarbonContribution
    let rank: Int
    let diameter: CGFloat
    var center: CGPoint
    let targetCenter: CGPoint
    let labelOffset: CGPoint
    let gradientStops: [Gradient.Stop]
    let gradientStart: UnitPoint
    let gradientEnd: UnitPoint
    let opacity: Double

    var radius: CGFloat { diameter / 2 }
}

private struct FootprintBubbleCompositionSlot {
    let label: String
    let center: CGPoint
    let labelOffset: CGPoint
    let color: FootprintBubbleColor
    let gradientStart: UnitPoint
    let gradientEnd: UnitPoint
}

private struct FootprintBubbleColor {
    let red: Double
    let green: Double
    let blue: Double
}

enum TULIPMenuDestination: String, Identifiable, CaseIterable {
    case score = "TULIP Score"
    case sources = "Sources"
    case registries = "Registries"
    case about = "About"
    case contact = "Contact"
    case privacy = "Privacy"

    var id: String { rawValue }
}

struct TULIPMenuView: View {
    let onDismiss: () -> Void
    let onQuickStart: () -> Void

    @State private var destination: TULIPMenuDestination?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: TULIPSpacing.zero) {
                    Button("Quick Start") {
                        onDismiss()
                        onQuickStart()
                    }
                    .menuRowStyle()
                    ForEach(TULIPMenuDestination.allCases) { item in
                        Button(item.rawValue) {
                            TULIPHaptics.selection()
                            destination = item
                        }
                            .menuRowStyle()
                    }
                    ShareLink(
                        item: URL(string: "https://tulip-project-six.vercel.app/")!,
                        subject: Text("The TULIP Project"),
                        message: Text("Explore how environmental causes and consequences connect.")
                    ) {
                        Text("Share TULIP")
                    }
                    .menuRowStyle()
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, TULIPLayout.screenHorizontalPadding)
                .containerRelativeFrame(.vertical, alignment: .center)
            }
            .scrollBounceBehavior(.always)
            .tulipIOS27AdaptiveNavigationBar()
            .background(TULIPPalette.background)
            .navigationTitle("Menu")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        onDismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 19, weight: .medium))
                            .foregroundStyle(TULIPPalette.secondaryText)
                            .frame(width: 44, height: 44)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Close menu")
                }
            }
            .navigationDestination(item: $destination) { item in
                TULIPMenuDetailView(destination: item)
            }
        }
        .preferredColorScheme(.dark)
    }
}

private extension View {
    func menuRowStyle() -> some View {
        self
            .font(.body.weight(.medium))
            .foregroundStyle(TULIPPalette.text)
            .frame(maxWidth: .infinity, minHeight: 54, alignment: .leading)
            .contentShape(Rectangle())
    }
}

private struct TULIPRegistryDirectoryEntry: Identifiable {
    let id: String
    let title: String
    let detail: String
    let count: Int
    let path: String
    let systemImage: String
}

private struct TULIPMenuDetailView: View {
    let destination: TULIPMenuDestination
    @State private var searchQuery = ""
    @State private var showAllSources = false

    var body: some View {
        Group {
            if destination == .sources || destination == .registries {
                detailScroll
                    .searchable(
                        text: $searchQuery,
                        placement: .navigationBarDrawer(displayMode: .always),
                        prompt: Text(destination == .sources ? "Search sources" : "Search registries")
                    )
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
            } else {
                detailScroll
            }
        }
        .background(TULIPPalette.background)
        .navigationBarTitleDisplayMode(.inline)
    }

    private var detailScroll: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: TULIPLayout.sectionSpacing) {
                Text(destination.rawValue)
                    .font(.largeTitle.bold())
                    .foregroundStyle(TULIPPalette.text)
                content
            }
            .tulipSelectableEvidence()
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(TULIPLayout.screenHorizontalPadding)
            .padding(.bottom, TULIPSpacing.xxLarge)
        }
        .tulipIOS27AdaptiveNavigationBar()
    }

    @ViewBuilder
    private var content: some View {
        switch destination {
        case .score:
            scoreContent
        case .sources:
            sourcesContent
        case .registries:
            registriesContent
        case .about:
            aboutContent
        case .contact:
            contactContent
        case .privacy:
            privacyContent
        }
    }

    @ViewBuilder
    private var scoreContent: some View {
        Text("Global urgency · 1.0 to 10.0")
            .font(.caption.weight(.bold))
            .tracking(1.4)
            .foregroundStyle(TULIPPalette.lavender)
        Text("How urgent is this issue now?")
            .font(.title2.bold())
            .foregroundStyle(TULIPPalette.text)
        Text("The TULIP Score is a 1–10 urgency rating for climate and environmental problems. It combines evidence about how serious a problem is now, how close it is to a dangerous level, whether it is getting worse, and how widely it is happening.")
            .detailBody()

        info("Choose the evidence", "TULIP prefers recent, global measurements. When those are available, it asks four questions: How large is the problem now? How close is it to a dangerous threshold? How quickly is it changing? How much of the world does it affect?\n\nIf current measurements are incomplete, TULIP uses documented harm that has already occurred—to natural systems, people, and the economy. A model estimate is used only as a last resort and is clearly marked Modeled.", systemImage: "doc.text.magnifyingglass")
        info("Translate to one scale", "Climate problems are measured in incompatible units: degrees of warming, tonnes of pollution, hectares lost, people exposed, or dollars of damage. TULIP translates every measurement to a common 0–1 scale before combining them.\n\n0 is the reference condition. About 0.33 is concerning. About 0.67 is critical. 1 is extreme. Measurements between those anchors receive a value between them.", systemImage: "slider.horizontal.3")
        info("Blend the four signals", "For issues with current data: magnitude counts for 30%, dangerous-threshold position 30%, momentum 25%, and geographic extent 15%.\n\n(magnitude × 0.30) + (threshold × 0.30) + (momentum × 0.25) + (extent × 0.15) = weighted composite\n\nWhen documented harm is used instead, the blend is 35% physical or ecological harm, 30% harm to people or the economy, 20% persistence, and 15% geographic extent.\n\nTULIP Score = 1 + (9 × weighted composite).", systemImage: "function")
        info("See the formula in action", "For Global Temperature, the normalized values are 0.62 for current magnitude, 0.62 for threshold position, 0.71 for momentum, and 1.00 for global extent.\n\n(0.62 × 0.30) + (0.62 × 0.30) + (0.71 × 0.25) + (1.00 × 0.15) ≈ 0.70\n\n1 + (9 × 0.70) = 7.3\n\nA 7.3 does not mean 73% damage or a 73% chance of disaster. It means the available evidence places the issue high on TULIP’s urgency scale. It does not measure scientific confidence, popularity, or how easy the issue is to solve.", systemImage: "sum")
        info("How it stays auditable", "Receipt verification checks that stored components reproduce the score and band and that hashed content has not changed. This is computational verification, not scientific proof. Scientific review separately evaluates the measurement, anchors, transformation, scoring route, and continuing source support.", systemImage: "checkmark.seal.fill")
    }

    @ViewBuilder
    private var sourcesContent: some View {
        Text("Integrated global and regional networks providing observations, model projections, reported evidence, and policy metrics.")
            .detailBody()

        registryMetrics([
            ("Total", TULIPRegistryCatalog.sources.count),
            ("Open", TULIPRegistryCatalog.sourceSummary["operational_open"] ?? 0),
            ("Active", TULIPRegistryCatalog.sourceSummary["active_platform_integrations"] ?? 0),
            ("Evidence", TULIPRegistryCatalog.sourceSummary["evidence_only"] ?? 0),
        ])

        info("Evidence before assertion", "TULIP keeps measurements, modeled outputs, institutional reporting, and journalism visibly attributed. Source links remain attached to the claim or event they support so readers can inspect the original evidence.", systemImage: "link")

        ForEach(shownSources) { source in
            sourceRecord(source)
        }

        if shownSources.isEmpty {
            directoryEmptyState("No sources found")
        }

        if searchQuery.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
           !showAllSources,
           TULIPRegistryCatalog.sources.count > shownSources.count {
            Button("Show all \(TULIPRegistryCatalog.sources.count.formatted(.number)) sources") {
                showAllSources = true
            }
            .font(.headline)
            .foregroundStyle(TULIPPalette.text)
            .frame(maxWidth: .infinity, minHeight: 50)
            .tulipSolidControl(in: Capsule(), fill: TULIPPalette.lavender.opacity(0.72))
        }
    }

    @ViewBuilder
    private var registriesContent: some View {
        Text("Shared monitoring systems, dataset catalogs, disclosure layers, pipeline lineage, and research records available across the platform.")
            .detailBody()

        registryMetrics([
            ("Sources", TULIPRegistryCatalog.sources.count),
            ("Pipelines", TULIPRegistryCatalog.pipelineCount),
            ("Research", TULIPRegistryCatalog.researchCount),
            ("Bindings", TULIPRegistryCatalog.pipelineSummary["metric_bindings"] ?? 0),
        ])

        ForEach(shownRegistries) { registry in
            registryLink(registry)
        }

        if shownRegistries.isEmpty {
            directoryEmptyState("No registries found")
        }
    }

    @ViewBuilder
    private var aboutContent: some View {
        Text("Tracking Use, Loss, and Impact on the Planet")
            .font(.title2.bold())
            .foregroundStyle(TULIPPalette.text)
        Text("The TULIP Project helps people understand how human choices affect Earth’s atmosphere, oceans, ecosystems, economies, and future.")
            .detailBody()
        Text("It brings climate data and interconnected relationships into one explorable system. This makes complex causes and consequences easier to understand without reducing them to a single story.")
            .detailBody()

        TULIPSection("What you can do", systemImage: "sparkles") {
            detailBullet("Explore connected environmental causes and effects", icon: "circle.hexagongrid.fill")
            detailBullet("Follow what drives a problem and what it affects next", icon: "arrow.triangle.branch")
            detailBullet("Understand how human activity influences the climate", icon: "person.2.fill")
            detailBullet("Estimate your personal carbon, water, land, and material footprints", icon: "gauge.with.dots.needle.67percent")
        }

        info("How TULIP is built", "TULIP combines public datasets, institutional monitoring, reported disclosures, and modeled relationships. Not every connection carries the same level of certainty, and TULIP is not a substitute for primary scientific institutions.", systemImage: "square.stack.3d.up.fill")
    }

    @ViewBuilder
    private var contactContent: some View {
        Text("For partnerships, research collaboration, platform questions, data discussions, and institutional outreach related to TULIP.")
            .detailBody()
        Text("Contact opens your email app. TULIP receives only the information you choose to include after you send the message.")
            .detailBody()

        Link(destination: URL(string: "mailto:aniket1.warade@gmail.com?subject=TULIP%20app%20support")!) {
            Label("Email TULIP support", systemImage: "envelope.fill")
                .font(.headline)
                .foregroundStyle(TULIPPalette.text)
                .frame(maxWidth: .infinity, minHeight: 54, alignment: .center)
        }
        .tulipSolidControl(in: Capsule(), fill: TULIPPalette.lavender.opacity(0.72))
        .padding(.top, TULIPLayout.contentTopPadding)
    }

    @ViewBuilder
    private var privacyContent: some View {
        Text("TULIP does not use advertising trackers or sell personal information.")
            .font(.title3.weight(.semibold))
            .foregroundStyle(TULIPPalette.text)
        info("Information stored on this device", "Search history, Analyse navigation history, and footprint answers may be stored locally so the app can preserve your progress. This information stays on your device and can be removed by deleting the app or clearing its data.", systemImage: "iphone")
        info("When you contact TULIP", "The app opens your email app when you choose Contact. TULIP receives only the information you choose to include after you send the email. Correspondence is used only to respond to your request and maintain necessary records; it is not used for advertising or cross-app tracking.", systemImage: "envelope.fill")
        info("External sources", "Links to scientific sources open outside TULIP. Those sites have their own privacy practices. TULIP does not automatically send your footprint answers or app history to those sites.", systemImage: "safari.fill")
        info("Your choices", "You can use the graph, Analyse, Activity Impacts, and My Footprint without creating an account or contacting TULIP. To ask about retained correspondence or request deletion, email TULIP support.", systemImage: "hand.raised.fill")
        Link(destination: URL(string: "https://tulip-project-six.vercel.app/privacy.html")!) {
            Label("View the full privacy policy", systemImage: "arrow.up.right")
                .font(.headline)
                .foregroundStyle(TULIPPalette.blue)
                .frame(maxWidth: .infinity, minHeight: 50, alignment: .center)
        }
    }

    private var shownSources: [TULIPSourceRecord] {
        let query = normalizedSearchQuery
        let matches = query.isEmpty ? TULIPRegistryCatalog.sources : TULIPRegistryCatalog.sources.filter {
            [$0.name, $0.integrationBucket, $0.accessClassification, $0.platformUse, $0.notes]
                .compactMap { $0 }
                .joined(separator: " ")
                .lowercased()
                .contains(query)
        }
        return showAllSources || !query.isEmpty ? matches : Array(matches.prefix(20))
    }

    private var shownRegistries: [TULIPRegistryDirectoryEntry] {
        guard !normalizedSearchQuery.isEmpty else { return registryDirectory }
        return registryDirectory.filter { registry in
            [registry.title, registry.detail, registry.path]
                .joined(separator: " ")
                .lowercased()
                .contains(normalizedSearchQuery)
        }
    }

    private var normalizedSearchQuery: String {
        searchQuery.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    }

    private var registryDirectory: [TULIPRegistryDirectoryEntry] {
        [
            TULIPRegistryDirectoryEntry(
                id: "sources",
                title: "Source intake registry",
                detail: "Organizations, access classifications, ingestion methods, refresh patterns, verification state, and platform use.",
                count: TULIPRegistryCatalog.sources.count,
                path: "tulip-source-registry.json",
                systemImage: "building.columns.fill"
            ),
            TULIPRegistryDirectoryEntry(
                id: "pipelines",
                title: "Pipeline lineage",
                detail: "The jobs, snapshots, API routes, provenance notes, and metric bindings that carry evidence into TULIP.",
                count: TULIPRegistryCatalog.pipelineCount,
                path: "pipeline-lineage-registry.json",
                systemImage: "point.3.connected.trianglepath.dotted"
            ),
            TULIPRegistryDirectoryEntry(
                id: "research",
                title: "Research backlog and resolution ledger",
                detail: "Open questions and resolved records, including rationale, sphere, metric contract, review state, and supporting source URLs.",
                count: TULIPRegistryCatalog.researchCount,
                path: "research-backlog.json",
                systemImage: "checklist.checked"
            ),
        ]
    }

    private func sourceRecord(_ source: TULIPSourceRecord) -> some View {
        TULIPSection(source.name, titleColor: .white, systemImage: "doc.text.fill") {
            if let notes = source.notes, !notes.isEmpty {
                Text(TULIPMetricDisplay.text(notes)).detailBody()
            }
            if let use = source.platformUse, !use.isEmpty {
                detailValue("Use", TULIPMetricDisplay.text(use))
            }
            detailValue("Access", humanized(source.accessClassification ?? "Not classified"))
            detailValue("Refresh", humanized(source.refreshStyle ?? "Not specified"))
            if let url = URL(string: source.url), url.scheme == "https" {
                Link(destination: url) {
                    Label("Open source", systemImage: "arrow.up.right")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(TULIPPalette.blue)
                }
            }
        }
    }

    private func registryMetrics(_ metrics: [(String, Int)]) -> some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: TULIPSpacing.small) {
            ForEach(Array(metrics.enumerated()), id: \.offset) { _, metric in
                VStack(alignment: .leading, spacing: TULIPSpacing.xSmall) {
                    Text(metric.1.formatted(.number))
                        .font(.title2.bold().monospacedDigit())
                        .foregroundStyle(TULIPPalette.text)
                    Text(metric.0.uppercased())
                        .font(.caption2.weight(.bold))
                        .tracking(1)
                        .foregroundStyle(TULIPPalette.tertiaryText)
                }
                .frame(maxWidth: .infinity, minHeight: 72, alignment: .leading)
                .padding(.horizontal, TULIPLayout.rowHorizontalPadding)
                .background(TULIPPalette.surface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            }
        }
    }

    private func registryLink(_ registry: TULIPRegistryDirectoryEntry) -> some View {
        TULIPSection(registry.title, titleColor: .white, systemImage: registry.systemImage) {
            Text(registry.detail).detailBody()
            Text("\(registry.count.formatted(.number)) records")
                .font(.caption.weight(.bold))
                .foregroundStyle(TULIPPalette.lavender)
            Link(destination: URL(string: "https://tulip-project-six.vercel.app/\(registry.path)")!) {
                Label("Open registry", systemImage: "arrow.up.right")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(TULIPPalette.blue)
            }
        }
    }

    private func directoryEmptyState(_ title: String) -> some View {
        VStack(spacing: TULIPSpacing.small) {
            Image(systemName: "magnifyingglass")
                .font(.title2.weight(.medium))
                .foregroundStyle(TULIPPalette.tertiaryText)
            Text(title)
                .font(.headline)
                .foregroundStyle(TULIPPalette.text)
            Text("Try a different organization, topic, access type, or evidence term.")
                .font(.subheadline)
                .foregroundStyle(TULIPPalette.secondaryText)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, minHeight: 180)
        .accessibilityElement(children: .combine)
    }

    private func detailBullet(_ text: String, icon: String) -> some View {
        HStack(alignment: .top, spacing: TULIPSpacing.compact) {
            Image(systemName: icon)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(TULIPPalette.lavender)
                .frame(width: 22)
            Text(text).detailBody()
        }
    }

    private func detailValue(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: TULIPSpacing.xSmall) {
            Text(label.uppercased())
                .font(.caption2.weight(.bold))
                .tracking(1)
                .foregroundStyle(TULIPPalette.tertiaryText)
            Text(value)
                .font(.subheadline)
                .foregroundStyle(TULIPPalette.secondaryText)
        }
    }

    private func humanized(_ value: String) -> String {
        value.replacingOccurrences(of: "_", with: " ")
            .split(separator: " ")
            .map { $0.capitalized }
            .joined(separator: " ")
    }

    private func info(_ title: String, _ body: String, systemImage: String? = nil) -> some View {
        TULIPSection(title, systemImage: systemImage) {
            Text(body)
                .detailBody()
        }
    }
}

private extension View {
    func detailBody() -> some View {
        font(.body)
            .foregroundStyle(TULIPPalette.secondaryText)
            .lineSpacing(4)
            .fixedSize(horizontal: false, vertical: true)
    }
}

private struct TULIPSourceRecord: Decodable, Identifiable {
    let id: String
    let name: String
    let url: String
    let integrationBucket: String?
    let accessClassification: String?
    let platformUse: String?
    let refreshStyle: String?
    let notes: String?

    enum CodingKeys: String, CodingKey {
        case id, name, url, notes
        case integrationBucket = "integration_bucket"
        case accessClassification = "access_classification"
        case platformUse = "platform_use"
        case refreshStyle = "refresh_style"
    }
}

private struct TULIPSourceRegistry: Decodable {
    let sources: [TULIPSourceRecord]
    let summary: [String: Int]
}

private struct TULIPPipelineRegistry: Decodable {
    let pipelines: [TULIPPipelineRecord]
    let summary: [String: Int]
}

private struct TULIPPipelineRecord: Decodable {}

private struct TULIPResearchRegistry: Decodable {
    let campaignRecords: [TULIPResearchRecord]

    enum CodingKeys: String, CodingKey {
        case campaignRecords = "campaign_records"
    }
}

private struct TULIPResearchRecord: Decodable {}

func preloadTULIPRegistryCatalog() {
    TULIPRegistryCatalog.preload()
}

private enum TULIPRegistryCatalog {
    private static let sourceRegistry: TULIPSourceRegistry? = decode(
        prefix: "tulip-source-registry-",
        as: TULIPSourceRegistry.self
    )
    private static let pipelineRegistry: TULIPPipelineRegistry? = decode(
        prefix: "pipeline-lineage-registry-",
        as: TULIPPipelineRegistry.self
    )
    private static let researchRegistry: TULIPResearchRegistry? = decode(
        prefix: "research-backlog-",
        as: TULIPResearchRegistry.self
    )

    static let sources = sourceRegistry?.sources ?? []
    static let sourceSummary = sourceRegistry?.summary ?? [:]
    static let pipelineSummary = pipelineRegistry?.summary ?? [:]
    static let pipelineCount = pipelineRegistry?.pipelines.count ?? 0
    static let researchCount = researchRegistry?.campaignRecords.count ?? 0

    static func preload() {
        _ = sources.count
        _ = sourceSummary.count
        _ = pipelineSummary.count
        _ = pipelineCount
        _ = researchCount
    }

    private static func decode<Value: Decodable>(prefix: String, as type: Value.Type) -> Value? {
        guard let resourceURL = Bundle.main.resourceURL else { return nil }
        let assetsURL = resourceURL.appendingPathComponent("WebApp/assets", isDirectory: true)
        guard let urls = try? FileManager.default.contentsOfDirectory(
            at: assetsURL,
            includingPropertiesForKeys: nil,
            options: [.skipsHiddenFiles]
        ), let url = urls.first(where: {
            $0.lastPathComponent.hasPrefix(prefix) && $0.pathExtension == "json"
        }), let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(type, from: data)
    }
}
