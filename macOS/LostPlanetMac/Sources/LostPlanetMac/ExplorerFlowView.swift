import SwiftUI

struct ExplorerFlowView: View {
    @State private var selectedSphere: ClimateSphere? = .all
    @State private var selectedNodeID: String? = "global-temperature"
    @State private var searchText = ""
    @State private var trail: [String] = ["global-temperature"]
    @State private var columnVisibility: NavigationSplitViewVisibility = .all

    private var selectedNode: ClimateNode {
        ClimateCatalog.node(id: selectedNodeID) ?? ClimateCatalog.nodes[1]
    }

    private var visibleNodes: [ClimateNode] {
        ClimateCatalog.nodes.filter { node in
            let inSphere = selectedSphere == nil || selectedSphere == .all || node.sphere == selectedSphere
            let matchesSearch = searchText.isEmpty || node.name.localizedCaseInsensitiveContains(searchText)
            return inSphere && matchesSearch
        }
    }

    var body: some View {
        NavigationSplitView(columnVisibility: $columnVisibility) {
            SphereSidebar(selection: $selectedSphere)
                .navigationSplitViewColumnWidth(min: 180, ideal: 210, max: 250)
        } content: {
            NetworkCanvas(
                nodes: visibleNodes,
                selectedNodeID: selectedNodeID,
                trail: trail,
                onSelect: selectNode
            )
            .navigationTitle(selectedSphere?.rawValue ?? "All systems")
            .navigationSubtitle("Evidence-backed relationship explorer")
        } detail: {
            NodeInspector(
                node: selectedNode,
                trailCount: trail.count,
                continueTrail: continueTrail,
                selectRelated: selectNamedNode
            )
            .navigationSplitViewColumnWidth(min: 320, ideal: 370, max: 460)
        }
        .searchable(text: $searchText, placement: .toolbar, prompt: "Search TULIP")
        .toolbar { toolbarContent }
        .onSubmit(of: .search) {
            if let firstMatch = visibleNodes.first {
                selectNode(firstMatch)
            }
        }
        .frame(minWidth: 1_080, minHeight: 700)
    }

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        ToolbarItem(placement: .navigation) {
            Button("Back", systemImage: "chevron.backward") {
                stepBack()
            }
            .disabled(trail.count < 2)
            .help("Return to the previous node")
        }

        if #available(macOS 26, *) {
            ToolbarSpacer(.fixed)
            ToolbarItem(placement: .primaryAction) {
                Button("Copy link", systemImage: "link") {
                    copySelectedLink()
                }
                .buttonStyle(.glass)
            }
            ToolbarSpacer(.fixed)
            ToolbarItem(placement: .primaryAction) {
                Button("Restart trail", systemImage: "arrow.counterclockwise") {
                    resetTrail()
                }
                .buttonStyle(.glassProminent)
            }
        } else {
            ToolbarItemGroup(placement: .primaryAction) {
                Button("Copy link", systemImage: "link") {
                    copySelectedLink()
                }
                Button("Restart trail", systemImage: "arrow.counterclockwise") {
                    resetTrail()
                }
            }
        }
    }

    private func selectNode(_ node: ClimateNode) {
        selectedNodeID = node.id
        if trail.last != node.id {
            trail.append(node.id)
        }
    }

    private func selectNamedNode(_ name: String) {
        guard let node = ClimateCatalog.nodes.first(where: { $0.name == name }) else { return }
        selectNode(node)
    }

    private func continueTrail() {
        guard let next = ClimateCatalog.node(id: selectedNode.nextNodeID) else { return }
        selectNode(next)
    }

    private func stepBack() {
        guard trail.count > 1 else { return }
        trail.removeLast()
        selectedNodeID = trail.last
    }

    private func resetTrail() {
        selectedSphere = .all
        searchText = ""
        selectedNodeID = "global-temperature"
        trail = ["global-temperature"]
    }

    private func copySelectedLink() {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString("https://tulip-project-six.vercel.app/?node=\(selectedNode.id)", forType: .string)
    }
}

private struct SphereSidebar: View {
    @Binding var selection: ClimateSphere?

    var body: some View {
        List(ClimateSphere.allCases, selection: $selection) { sphere in
            Label(sphere.rawValue, systemImage: sphere.symbol)
                .symbolRenderingMode(.hierarchical)
                .foregroundStyle(sphere == .all ? .primary : sphere.color)
                .tag(sphere)
        }
        .navigationTitle("TULIP")
        .listStyle(.sidebar)
    }
}

private struct NetworkCanvas: View {
    let nodes: [ClimateNode]
    let selectedNodeID: String?
    let trail: [String]
    let onSelect: (ClimateNode) -> Void

    var body: some View {
        GeometryReader { proxy in
            ZStack {
                LinearGradient(
                    colors: [
                        Color(red: 0.025, green: 0.045, blue: 0.075),
                        Color(red: 0.018, green: 0.09, blue: 0.12),
                        Color.black
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                Canvas { context, size in
                    for (sourceID, targetID) in ClimateCatalog.links {
                        guard
                            let source = nodes.first(where: { $0.id == sourceID }),
                            let target = nodes.first(where: { $0.id == targetID })
                        else { continue }

                        var path = Path()
                        path.move(to: point(for: source, in: size))
                        path.addLine(to: point(for: target, in: size))
                        let active = trail.contains(sourceID) && trail.contains(targetID)
                        context.stroke(
                            path,
                            with: .color(active ? target.sphere.color : .white.opacity(0.18)),
                            style: StrokeStyle(lineWidth: active ? 2.5 : 1.2, lineCap: .round)
                        )
                    }
                }

                ForEach(nodes) { node in
                    NodeMark(
                        node: node,
                        isSelected: node.id == selectedNodeID,
                        isInTrail: trail.contains(node.id),
                        action: { onSelect(node) }
                    )
                    .position(point(for: node, in: proxy.size))
                }

                VStack {
                    Spacer()
                    HStack {
                        Label("Trigger", systemImage: "arrow.right")
                        Label("Selected path", systemImage: "circle.fill")
                    }
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.bottom, 14)
                }
            }
        }
        .accessibilityLabel("Interactive climate relationship network")
    }

    private func point(for node: ClimateNode, in size: CGSize) -> CGPoint {
        CGPoint(x: size.width * node.position.x, y: size.height * node.position.y)
    }
}

private struct NodeMark: View {
    let node: ClimateNode
    let isSelected: Bool
    let isInTrail: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 7) {
                ZStack {
                    Circle()
                        .fill(node.sphere.color.opacity(isSelected ? 0.95 : 0.54))
                        .frame(width: isSelected ? 54 : 40, height: isSelected ? 54 : 40)
                    Circle()
                        .stroke(.white.opacity(isSelected ? 0.9 : 0.28), lineWidth: isSelected ? 2 : 1)
                        .frame(width: isSelected ? 62 : 48, height: isSelected ? 62 : 48)
                    if isInTrail {
                        Image(systemName: "checkmark")
                            .font(.caption.bold())
                            .foregroundStyle(.black.opacity(0.74))
                    }
                }
                Text(node.name)
                    .font(.caption.weight(isSelected ? .semibold : .regular))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)
                    .frame(width: 128)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(node.name)
        .accessibilityValue("Urgency \(node.urgency, format: .number.precision(.fractionLength(1))) out of 10")
    }
}

private struct NodeInspector: View {
    let node: ClimateNode
    let trailCount: Int
    let continueTrail: () -> Void
    let selectRelated: (String) -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                header
                Divider()
                urgency
                Divider()
                relatedSection(title: "What set this in motion?", names: node.drivers, symbol: "arrow.down.right")
                Divider()
                relatedSection(title: "What does this trigger?", names: node.effects, symbol: "arrow.up.right")
                Divider()
                sourceNotes
            }
            .padding(24)
        }
        .safeAreaInset(edge: .bottom) {
            trailActions
                .padding(18)
        }
        .navigationTitle(node.name)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label(node.sphere.rawValue, systemImage: node.sphere.symbol)
                .font(.caption.weight(.semibold))
                .foregroundStyle(node.sphere.color)
            Text(node.name)
                .font(.largeTitle.weight(.semibold))
            Text(node.summary)
                .font(.body)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var urgency: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline) {
                Text("TULIP urgency")
                    .font(.headline)
                Spacer()
                Text(node.urgency, format: .number.precision(.fractionLength(1)))
                    .font(.title2.monospacedDigit().weight(.semibold))
            }
            ProgressView(value: node.urgency, total: 10)
                .tint(node.urgency >= 8.5 ? .orange : .blue)
            Text("Composite signal · current evidence snapshot")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
    }

    private func relatedSection(title: String, names: [String], symbol: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.headline)
            ForEach(names, id: \.self) { name in
                if ClimateCatalog.nodes.contains(where: { $0.name == name }) {
                    Button {
                        selectRelated(name)
                    } label: {
                        Label(name, systemImage: symbol)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .buttonStyle(.link)
                } else {
                    Label(name, systemImage: symbol)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private var sourceNotes: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Monitoring sources")
                .font(.headline)
            Text("NASA Earthdata · NOAA climate indicators · peer-reviewed relationship evidence")
                .font(.callout)
                .foregroundStyle(.secondary)
            Text("Plain content by design: evidence, data marks, and long-form reading surfaces do not receive glass treatment.")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
    }

    @ViewBuilder
    private var trailActions: some View {
        if #available(macOS 26, *) {
            LiquidTrailActions(
                node: node,
                trailCount: trailCount,
                continueTrail: continueTrail
            )
        } else {
            LegacyTrailActions(
                node: node,
                trailCount: trailCount,
                continueTrail: continueTrail
            )
        }
    }
}

@available(macOS 26, *)
private struct LiquidTrailActions: View {
    let node: ClimateNode
    let trailCount: Int
    let continueTrail: () -> Void

    var body: some View {
        GlassEffectContainer(spacing: 12) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text("CONTINUE THIS TRAIL")
                            .font(.caption2.weight(.bold))
                            .tracking(1.2)
                        Text(node.nextReason ?? "You reached the end of this trail.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(2)
                    }
                    Spacer(minLength: 12)
                    Text("\(trailCount) visited")
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal, 16)
                .padding(.top, 14)
                .padding(.bottom, node.nextNodeID == nil ? 14 : 0)
                .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 18, style: .continuous))

                if node.nextNodeID != nil {
                    Button(action: continueTrail) {
                        Label("Follow strongest connection", systemImage: "arrow.forward")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                    }
                    .buttonStyle(.glassProminent)
                    .buttonBorderShape(.roundedRectangle(radius: 18))
                    .controlSize(.large)
                    .keyboardShortcut(.return, modifiers: [.command])
                    .tint(node.sphere.color)
                    .accessibilityHint("Moves to the strongest evidence-backed downstream connection")
                }
            }
        }
    }
}

private struct LegacyTrailActions: View {
    let node: ClimateNode
    let trailCount: Int
    let continueTrail: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Continue this trail")
                    .font(.headline)
                Spacer()
                Text("\(trailCount) visited")
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(.secondary)
            }
            Text(node.nextReason ?? "You reached the end of this trail.")
                .font(.caption)
                .foregroundStyle(.secondary)
            if node.nextNodeID != nil {
                Button("Follow strongest connection", systemImage: "arrow.forward", action: continueTrail)
                    .buttonStyle(.borderedProminent)
                    .keyboardShortcut(.return, modifiers: [.command])
            }
        }
        .padding(16)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(.separator.opacity(0.45), lineWidth: 1)
        }
    }
}
