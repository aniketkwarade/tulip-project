import SwiftUI
import UIKit

@main
struct TULIPApp: App {
    @StateObject private var webBridge = TULIPWebBridge()
    @StateObject private var dataStore = TULIPDataStore()

    var body: some Scene {
        WindowGroup {
            TULIPNativeAppRoot(bridge: webBridge, dataStore: dataStore)
                .preferredColorScheme(.dark)
        }
    }
}

private struct TULIPNativeAppRoot: View {
    private static let startupSequenceDuration: TimeInterval = 3
    private static let selectedTabStorageKey = "TULIPSelectedTab"

    @ObservedObject var bridge: TULIPWebBridge
    @ObservedObject var dataStore: TULIPDataStore
    @StateObject private var bookmarkStore = TULIPBookmarkStore()

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.scenePhase) private var scenePhase
    @State private var selectedTab = Self.initialTab()
    @State private var selectedNodeName = Self.launchValue(after: "-TULIPStartNode")
        ?? "Global Temperature"
    @State private var webViewMounted = false
    @State private var webAppReady = false
    @State private var startupSequenceComplete = false
    @State private var startupDeadlineReached = false
    @State private var startupSequenceWorkItem: DispatchWorkItem?
    @State private var webNavigationState = TULIPNativeDockState()
    @State private var dockCompact = false
    @State private var menuPresented = false
    @State private var filtersPresented = false
    @State private var activeFilter = "all"
    @State private var searchKeyboardVisible = false
    @State private var searchResetRequest = 0
    @State private var inspectorToggleRequest = 0
    @State private var activityResetRequest = 0
    @State private var footprintResetRequest = 0

    private var essentialDataReady: Bool {
        !dataStore.nodes.isEmpty || dataStore.loadError != nil
    }

    // Each destination waits only for the data it actually renders. Explore's
    // graph is self-contained, so decoding the native inspector snapshot must
    // never delay its first usable frame.
    private var appReady: Bool {
        if startupDeadlineReached { return true }
        switch selectedTab {
        case .explore:
            // The shell is the first SwiftUI frame. WebKit readiness is local
            // to the graph surface so navigation never waits on its process.
            return true
        case .analyse:
            return essentialDataReady && dataStore.inspectorDataReady
        case .search, .activity, .footprint:
            return essentialDataReady
        }
    }

    private var exploreRenderingActive: Bool {
        selectedTab == .explore && !menuPresented && !filtersPresented
    }

    private static func launchValue(after flag: String) -> String? {
        let arguments = ProcessInfo.processInfo.arguments
        guard let index = arguments.firstIndex(of: flag), arguments.indices.contains(index + 1) else {
            return nil
        }
        return arguments[index + 1]
    }

    private static func initialTab() -> TULIPNativeTab {
        if let launchTab = launchValue(after: "-TULIPStartTab")
            .flatMap(TULIPNativeTab.init(rawValue:)) {
            return launchTab
        }

        if let storedTab = UserDefaults.standard.string(forKey: selectedTabStorageKey)
            .flatMap(TULIPNativeTab.init(rawValue:)) {
            return storedTab
        }

        return .explore
    }

    var body: some View {
        ZStack {
            TULIPPalette.background.ignoresSafeArea()

            if webViewMounted {
                TULIPWebAppView(
                    bridge: bridge,
                    onStartupReady: {
                        withAnimation(TULIPMotion.animation(.quick, reduceMotion: reduceMotion)) {
                            webAppReady = true
                        }
                        bridge.setRenderingActive(exploreRenderingActive)
                    },
                    onDockStateChange: { webNavigationState = $0 },
                    onOpenInspector: openInspector
                )
                .ignoresSafeArea()
                .opacity(selectedTab == .explore ? 1 : 0)
                .allowsHitTesting(selectedTab == .explore)
                .accessibilityHidden(selectedTab != .explore)
            }

            if selectedTab != .explore {
                nativeScreen
                    .ignoresSafeArea(.container, edges: .bottom)
                    .transition(.opacity)
                    .zIndex(1)
            }

            if appReady && selectedTab == .explore && !webNavigationState.isQuickStartActive {
                TULIPExploreHeader(
                    onShowMenu: {
                        TULIPHaptics.impact(.medium, intensity: 0.78)
                        menuPresented = true
                    }
                )
                .padding(.horizontal, TULIPLayout.screenHeaderTopPadding)
                .safeAreaPadding(
                    .top,
                    TULIPSpacing.small + TULIPLayout.exploreHeaderVerticalOffset
                )
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                .transition(.opacity)
                .zIndex(2)
            }

            if appReady
                && !(selectedTab == .explore && webNavigationState.isQuickStartActive)
                && !(selectedTab == .search && searchKeyboardVisible) {
                TULIPNativeDock(
                    state: TULIPNativeDockState(
                        active: selectedTab,
                        isVisible: true,
                        isCompact: dockCompact,
                        isQuickStartActive: false
                    ),
                    onSelect: selectTab,
                    onOpenExploreFilters: showExploreFilters
                )
                .padding(.horizontal, TULIPLayout.dockOuterHorizontalPadding)
                .safeAreaPadding(.bottom, TULIPSpacing.hairline)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
                .transition(.opacity)
                .zIndex(3)
            }

            if !startupSequenceComplete && selectedTab == .explore {
                TULIPExploreLoadingView()
                    .transition(.opacity)
                    .zIndex(4)
            } else if !startupSequenceComplete || !appReady {
                TULIPStartupView()
                    .transition(.opacity)
                    .zIndex(4)
            }
        }
        .tulipIOS27StatusBarStyle()
        .animation(TULIPMotion.animation(.quick, reduceMotion: reduceMotion), value: selectedTab)
        .task {
            // Commit the lightweight native launch frame before constructing
            // WKWebView. A cold WebKit process can otherwise delay the first
            // visible frame on device.
            await Task.yield()
            try? await Task.sleep(nanoseconds: 16_000_000)
            guard !Task.isCancelled else { return }
            webViewMounted = true
        }
        .task(id: selectedTab) {
            // Explore owns its graph data. Load native snapshots only when a
            // native destination asks for them, so they never compete with a
            // cold WebKit launch.
            guard selectedTab != .explore else { return }
            if selectedTab == .search {
                // Selecting Search is a strong interaction signal. Warm the
                // reusable language-model session while its compact data loads.
                TULIPNaturalLanguageSearch.prewarmOnDeviceUnderstanding()
            }
            await dataStore.loadEssentials()
            if selectedTab == .search {
                await dataStore.loadSearchProfiles()
                await TULIPNaturalLanguageSearch.prepareIndex(
                    nodes: dataStore.nodes,
                    profiles: dataStore.searchProfiles
                )
            } else if selectedTab == .analyse {
                await dataStore.loadInspectorProfiles()
            }
        }
        .task(id: webAppReady) {
            guard webAppReady else { return }
            // Let Explore commit its first interactive frame before warming a
            // compact native Search corpus. The full inspector database stays
            // demand-loaded by Analyse.
            await Task.yield()
            try? await Task.sleep(nanoseconds: 750_000_000)
            guard !Task.isCancelled else { return }
            TULIPHaptics.prepare()
            await dataStore.loadEssentials()
            await dataStore.loadSearchProfiles()
            await TULIPNaturalLanguageSearch.prepareIndex(
                nodes: dataStore.nodes,
                profiles: dataStore.searchProfiles
            )
            await TULIPNaturalLanguageSearch.prepareSemanticIndex(
                nodes: dataStore.nodes,
                profiles: dataStore.searchProfiles
            )
        }
        .onChange(of: exploreRenderingActive, initial: true) { _, active in
            bridge.setRenderingActive(active)
        }
        .onAppear {
            armStartupSequence()
            updateDisplayIdleTimer(for: scenePhase)
        }
        .onChange(of: scenePhase) { _, phase in
            updateDisplayIdleTimer(for: phase)
        }
        .onChange(of: selectedTab) { _, tab in
            UserDefaults.standard.set(tab.rawValue, forKey: Self.selectedTabStorageKey)
        }
        .onDisappear {
            startupSequenceWorkItem?.cancel()
            startupSequenceWorkItem = nil
            UIApplication.shared.isIdleTimerDisabled = false
        }
        .fullScreenCover(isPresented: $menuPresented) {
            TULIPMenuView(
                onDismiss: {
                    TULIPHaptics.button()
                    menuPresented = false
                },
                onQuickStart: {
                    TULIPHaptics.impact(.medium, intensity: 0.78)
                    menuPresented = false
                    selectedTab = .explore
                    bridge.startQuickStart()
                }
            )
        }
        .fullScreenCover(isPresented: $filtersPresented) {
            TULIPExploreFilterSheet(
                selection: $activeFilter,
                onSelect: { filter in
                    activeFilter = filter
                    bridge.setExploreFilter(filter)
                    filtersPresented = false
                },
                onDismiss: {
                    TULIPHaptics.button()
                    filtersPresented = false
                }
            )
        }
    }

    private func updateDisplayIdleTimer(for phase: ScenePhase) {
        UIApplication.shared.isIdleTimerDisabled = phase == .active
    }

    private func armStartupSequence() {
        guard !startupSequenceComplete,
              startupSequenceWorkItem == nil else { return }

        let workItem = DispatchWorkItem {
            if !webAppReady {
                bridge.forceRevealAfterStartupDeadline()
            }
            withAnimation(TULIPMotion.animation(.quick, reduceMotion: reduceMotion)) {
                if !appReady {
                    startupDeadlineReached = true
                }
                startupSequenceComplete = true
            }
            startupSequenceWorkItem = nil
        }
        startupSequenceWorkItem = workItem
        DispatchQueue.main.asyncAfter(
            deadline: .now() + Self.startupSequenceDuration,
            execute: workItem
        )
    }

    @ViewBuilder
    private var nativeScreen: some View {
        switch selectedTab {
        case .search:
            TULIPSearchView(
                nodes: dataStore.nodes,
                inspectorProfiles: dataStore.searchProfiles,
                bookmarkedNames: bookmarkStore.names,
                resetRequest: searchResetRequest,
                onSelect: openInspector,
                onRemoveBookmark: bookmarkStore.remove,
                onKeyboardVisibilityChange: { searchKeyboardVisible = $0 }
            )
        case .analyse:
            TULIPInspectorView(
                profile: dataStore.profile(named: selectedNodeName),
                toggleRequest: inspectorToggleRequest,
                isBookmarked: bookmarkStore.contains(selectedNodeName),
                shareURL: shareURL(for: selectedNodeName),
                onSelectNode: openInspector,
                onToggleBookmark: { bookmarkStore.toggle(selectedNodeName) },
                onScrollDirection: setDockCompact
            )
        case .activity:
            TULIPActivityView(
                profiles: dataStore.activityProfiles,
                resetRequest: activityResetRequest,
                onScrollDirection: setDockCompact
            )
        case .footprint:
            TULIPFootprintView(
                model: dataStore.footprintModel,
                resetRequest: footprintResetRequest,
                onScrollDirection: setDockCompact
            )
        case .explore:
            EmptyView()
        }
    }

    private func selectTab(_ tab: TULIPNativeTab, allowsReselectAction: Bool) {
        dockCompact = false
        if tab == selectedTab {
            guard allowsReselectAction else { return }
            switch tab {
            case .explore:
                bridge.resetExplore()
            case .analyse:
                inspectorToggleRequest += 1
            case .activity:
                activityResetRequest += 1
            case .search:
                searchResetRequest += 1
            case .footprint:
                footprintResetRequest += 1
            }
            return
        }

        if selectedTab == .search {
            searchKeyboardVisible = false
        }
        selectedTab = tab
        if tab == .explore { bridge.showExplore() }
    }

    private func openInspector(_ name: String) {
        selectedNodeName = name
        dockCompact = false
        selectedTab = .analyse
    }

    private func showExploreFilters() {
        selectedTab = .explore
        dockCompact = false
        bridge.showExplore()
        filtersPresented = true
    }

    private func setDockCompact(_ compact: Bool) {
        guard selectedTab == .analyse
                || selectedTab == .activity
                || selectedTab == .footprint else { return }
        if compact != dockCompact {
            dockCompact = compact
        }
    }

    private func shareURL(for name: String) -> URL {
        var components = URLComponents(string: "https://tulip-project-six.vercel.app/")!
        if let nodeID = dataStore.nodes.first(where: { $0.name == name })?.id {
            components.queryItems = [URLQueryItem(name: "node", value: nodeID)]
        }
        return components.url ?? URL(string: "https://tulip-project-six.vercel.app/")!
    }
}

private struct TULIPExploreHeader: View {
    let onShowMenu: () -> Void

    var body: some View {
        HStack(spacing: TULIPSpacing.compact) {
            HStack(spacing: TULIPSpacing.compact * TULIPLayout.exploreLogoScale) {
                Image("TULIPMonogram")
                    .resizable()
                    .scaledToFit()
                    .frame(
                        width: 47.25 * TULIPLayout.exploreLogoScale,
                        height: 47.25 * TULIPLayout.exploreLogoScale
                    )
                Text("THE\nTULIP\nPROJECT")
                    .font(.system(size: 11.25 * TULIPLayout.exploreLogoScale, weight: .bold))
                    .tracking(1.575 * TULIPLayout.exploreLogoScale)
                    .foregroundStyle(.white)
                    .lineSpacing(-TULIPLayout.exploreLogoScale)
            }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("The TULIP Project")

            Spacer()

            controls
        }
    }

    private var controls: some View {
        Button(action: onShowMenu) {
            Image(systemName: TULIPIconography.menu)
                .font(.system(size: 21.25, weight: .semibold))
                .foregroundStyle(TULIPPalette.text)
                .frame(width: TULIPLayout.minimumTouchTarget, height: TULIPLayout.minimumTouchTarget)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Open menu")
    }
}

private struct TULIPExploreFilterSheet: View {
    @Binding var selection: String
    let onSelect: (String) -> Void
    let onDismiss: () -> Void

    private let filters: [(key: String, label: String, color: Color)] = [
        ("all", "All", .white),
        ("atmosphere", "Air", Color(red: 0.82, green: 0.67, blue: 0.96)),
        ("oceans", "Oceans", Color(red: 0.34, green: 0.70, blue: 1)),
        ("cryosphere", "Glaciers", Color(red: 0.65, green: 0.86, blue: 1)),
        ("biosphere", "Plants & Wildlife", TULIPPalette.green),
        ("energy", "Power & Heat", .orange),
        ("digital", "Digital", TULIPPalette.lavender),
        ("agriculture", "Farming", Color(red: 0.75, green: 0.82, blue: 0.31)),
        ("transport", "Travel & Shipping", Color(red: 0.29, green: 0.82, blue: 0.84)),
        ("economy", "Markets", Color(red: 1, green: 0.66, blue: 0.32)),
        ("sociopolitical", "Society", Color(red: 0.95, green: 0.52, blue: 0.68)),
    ]

    var body: some View {
        VStack(spacing: TULIPSpacing.zero) {
            collapseHandle

            HStack {
                Text("Pick a System")
                    .font(.title.bold())
                    .foregroundStyle(TULIPPalette.text)
                Spacer()
            }
            .padding(.horizontal, TULIPLayout.screenHorizontalPadding)
            .padding(.top, TULIPSpacing.small)
            .padding(.bottom, TULIPSpacing.compact)

            List(filters, id: \.key) { filter in
                Button {
                    TULIPHaptics.selection()
                    onSelect(filter.key)
                } label: {
                    HStack(spacing: TULIPSpacing.compact) {
                        Circle()
                            .fill(filter.color)
                            .frame(width: 9, height: 9)
                        Text(filter.label)
                            .foregroundStyle(TULIPPalette.text)
                        Spacer()
                        if selection == filter.key {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(TULIPPalette.lavender)
                        }
                    }
                    .frame(minHeight: 44)
                }
            }
            .scrollContentBackground(.hidden)
            .scrollBounceBehavior(.always)
            .background(TULIPPalette.background)
        }
        .background(TULIPPalette.background.ignoresSafeArea())
        .preferredColorScheme(.dark)
    }

    private var collapseHandle: some View {
        Button(action: onDismiss) {
            Capsule()
                .fill(TULIPPalette.secondaryText.opacity(0.72))
                .frame(width: 54, height: 5)
                .frame(maxWidth: .infinity, minHeight: 40)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Collapse system list")
        .simultaneousGesture(
            DragGesture(minimumDistance: 8)
                .onEnded { value in
                    if value.translation.height > 32 {
                        onDismiss()
                    }
                }
        )
    }
}

private struct TULIPNativeDock: View {
    let state: TULIPNativeDockState
    let onSelect: (TULIPNativeTab, Bool) -> Void
    let onOpenExploreFilters: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var previewTab: TULIPNativeTab?
    @State private var indicatorX: CGFloat?
    @State private var isScrubbing = false
    @State private var suppressButtonTap = false
    @State private var exploreLongPressTriggered = false
    @State private var bouncingTab: TULIPNativeTab?
    @State private var bounceScale: CGFloat = 1

    private let horizontalInset = TULIPLayout.dockHorizontalInset
    private let dockHeight = TULIPLayout.dockHeight

    var body: some View {
        GeometryReader { geometry in
            let width = geometry.size.width
            let displayedTab = previewTab ?? state.active

            ZStack {
                glassSurface

                Capsule(style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color(red: 0.60, green: 0.60, blue: 0.81),
                                Color(red: 0.32, green: 0.30, blue: 0.75),
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: indicatorWidth(for: width), height: 48)
                    .shadow(color: Color(red: 0.23, green: 0.22, blue: 0.67).opacity(0.26), radius: 8, y: 3)
                    .position(
                        x: indicatorX ?? center(for: displayedTab, width: width),
                        y: dockHeight / 2
                    )

                HStack(spacing: TULIPSpacing.zero) {
                    ForEach(TULIPNativeTab.allCases) { tab in
                        dockButton(for: tab, displayedTab: displayedTab)
                    }
                }
                .padding(.horizontal, horizontalInset)
            }
            .frame(height: dockHeight)
            .scaleEffect(0.95 * (state.isCompact ? 0.85 : 1), anchor: .bottom)
            .animation(TULIPMotion.animation(.standard, reduceMotion: reduceMotion), value: state.isCompact)
            .contentShape(Rectangle())
            .simultaneousGesture(scrubGesture(width: width))
            .onChange(of: state.active) { _, active in
                previewTab = nil
                withAnimation(TULIPMotion.animation(.standard, reduceMotion: reduceMotion)) {
                    indicatorX = center(for: active, width: width)
                }
            }
        }
        .frame(height: dockHeight)
        .accessibilityElement(children: .contain)
    }

    private var glassSurface: some View {
        Color.clear
            .frame(height: dockHeight)
            .tulipFloatingChrome(in: Capsule(style: .continuous), interactive: true)
            .shadow(color: .black.opacity(0.38), radius: 20, y: 10)
    }

    @ViewBuilder
    private func dockButton(
        for tab: TULIPNativeTab,
        displayedTab: TULIPNativeTab
    ) -> some View {
        let button = Button {
            if tab == .explore && exploreLongPressTriggered {
                exploreLongPressTriggered = false
                return
            }
            guard !suppressButtonTap else { return }
            activate(tab)
        } label: {
            tab.dockIcon
                .resizable()
                .renderingMode(.template)
                .scaledToFit()
                .frame(width: tab.iconSize.width, height: tab.iconSize.height)
                .foregroundStyle(tab == displayedTab ? Color.white : Color(white: 0.48))
                .scaleEffect(
                    tab == displayedTab
                        ? 1.15 * (bouncingTab == tab ? bounceScale : 1)
                        : 1
                )
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .accessibilityLabel(tab.accessibilityLabel)
        .accessibilityAddTraits(tab == state.active ? .isSelected : [])

        if tab == .explore {
            button.simultaneousGesture(
                LongPressGesture(minimumDuration: 0.52, maximumDistance: 12)
                    .onEnded { _ in
                        exploreLongPressTriggered = true
                        TULIPHaptics.impact(.medium)
                        onOpenExploreFilters()
                    }
            )
        } else {
            button
        }
    }

    private func scrubGesture(width: CGFloat) -> some Gesture {
        DragGesture(minimumDistance: 8, coordinateSpace: .local)
            .onChanged { value in
                let dx = value.translation.width
                let dy = value.translation.height
                guard abs(dx) > abs(dy) * 1.15 else { return }
                isScrubbing = true
                let next = tab(at: value.location.x, width: width)
                if previewTab != next {
                    TULIPHaptics.selection()
                }
                previewTab = next
                indicatorX = min(
                    center(for: .activity, width: width),
                    max(center(for: .search, width: width), value.location.x)
                )
            }
            .onEnded { value in
                let dx = value.translation.width
                let dy = value.translation.height
                guard isScrubbing, abs(dx) > abs(dy) * 1.15 else {
                    isScrubbing = false
                    previewTab = nil
                    indicatorX = nil
                    return
                }

                let next = tab(at: value.location.x, width: width)
                suppressButtonTap = true
                activate(next, haptic: false, allowsReselectAction: false)
                withAnimation(TULIPMotion.animation(.standard, reduceMotion: reduceMotion)) {
                    indicatorX = center(for: next, width: width)
                }
                isScrubbing = false
                previewTab = nil
                DispatchQueue.main.asyncAfter(deadline: .now() + TULIPMotion.selectionFeedbackDelay) {
                    suppressButtonTap = false
                }
            }
    }

    private func activate(
        _ tab: TULIPNativeTab,
        haptic: Bool = true,
        allowsReselectAction: Bool = true
    ) {
        if haptic {
            TULIPHaptics.selection()
        }
        if !reduceMotion {
            bouncingTab = tab
            bounceScale = 1
            withAnimation(TULIPMotion.animation(.feedbackUp, reduceMotion: false)) {
                bounceScale = 1.035
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + TULIPMotion.selectionFeedbackDelay) {
                withAnimation(TULIPMotion.animation(.feedbackDown, reduceMotion: false)) {
                    bounceScale = 1
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + TULIPMotion.selectionResetDelay) {
                    bouncingTab = nil
                }
            }
        }
        onSelect(tab, allowsReselectAction)
    }

    private func center(for tab: TULIPNativeTab, width: CGFloat) -> CGFloat {
        let usableWidth = max(1, width - horizontalInset * 2)
        let itemWidth = usableWidth / CGFloat(TULIPNativeTab.allCases.count)
        let index = CGFloat(TULIPNativeTab.allCases.firstIndex(of: tab) ?? 0)
        return horizontalInset + itemWidth * (index + 0.5)
    }

    private func indicatorWidth(for width: CGFloat) -> CGFloat {
        let usableWidth = max(1, width - horizontalInset * 2)
        return min(72, usableWidth / CGFloat(TULIPNativeTab.allCases.count))
    }

    private func tab(at x: CGFloat, width: CGFloat) -> TULIPNativeTab {
        let usableWidth = max(1, width - horizontalInset * 2)
        let normalized = min(0.999, max(0, (x - horizontalInset) / usableWidth))
        let index = min(
            TULIPNativeTab.allCases.count - 1,
            max(0, Int(normalized * CGFloat(TULIPNativeTab.allCases.count)))
        )
        return TULIPNativeTab.allCases[index]
    }
}

private extension TULIPNativeTab {
    var dockIcon: Image {
        Image(assetName)
    }

    var assetName: String {
        switch self {
        case .search: "NavSearch"
        case .explore: "NavExplore"
        case .analyse: "NavAnalyse"
        case .activity: "NavActivity"
        case .footprint: "NavFootprint"
        }
    }

    var iconSize: CGSize {
        switch self {
        case .search: CGSize(width: 21.6, height: 21.6)
        case .explore: CGSize(width: 22.4, height: 22.4)
        case .analyse: CGSize(width: 23.2, height: 23.2)
        case .activity: CGSize(width: 21.6, height: 19.2)
        case .footprint: CGSize(width: 22.4, height: 22.4)
        }
    }

    var accessibilityLabel: String {
        switch self {
        case .search: "Search"
        case .explore: "Explore"
        case .analyse: "Analyse"
        case .activity: "Impacts"
        case .footprint: "My Footprint"
        }
    }
}

private struct TULIPStartupView: View {
    var body: some View {
        ZStack {
            Color.black
            TULIPBreathingLaunchMark(size: 96)
        }
        .ignoresSafeArea()
        .accessibilityHidden(true)
    }
}

private struct TULIPExploreLoadingView: View {
    var body: some View {
        ZStack {
            TULIPPalette.background
            TULIPBreathingLaunchMark(size: 96)
        }
        .ignoresSafeArea()
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Preparing Tulip")
    }
}

/// Reveals the animated mark after the system's blank black launch screen.
/// On black, opacity maps directly to the requested relative luminance.
private struct TULIPBreathingLaunchMark: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var isVisible = false

    private static let halfCycleDuration: TimeInterval = 1.5
    private static let revealDuration: TimeInterval = 0.65

    let size: CGFloat

    @ViewBuilder
    var body: some View {
        Group {
            if reduceMotion {
                launchMark
            } else {
                launchMark
                    .phaseAnimator([false, true]) { content, isContracted in
                        content
                            .scaleEffect(isContracted ? 0.90 : 1)
                            .opacity(isContracted ? 0.70 : 1)
                    } animation: { _ in
                        .easeInOut(duration: Self.halfCycleDuration)
                    }
            }
        }
        .opacity(isVisible ? 1 : 0)
        .task {
            guard !isVisible else { return }
            // Commit a blank native frame after the static black launch screen,
            // then reveal the animated mark without a visible handoff seam.
            await Task.yield()
            withAnimation(.easeOut(duration: reduceMotion ? 0.18 : Self.revealDuration)) {
                isVisible = true
            }
        }
    }

    private var launchMark: some View {
        Image("LaunchMark")
            .resizable()
            .scaledToFit()
            .frame(width: size, height: size)
            .accessibilityHidden(true)
    }
}

private struct TULIPBrandMark: View {
    let size: CGFloat

    var body: some View {
        Image("TULIPMonogram")
            .renderingMode(.template)
            .resizable()
            .scaledToFit()
            .foregroundStyle(
                LinearGradient(
                    colors: [
                        .white,
                        Color(red: 0.84, green: 0.82, blue: 1),
                        Color(red: 0.42, green: 0.40, blue: 0.64),
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .frame(width: size, height: size)
    }
}
