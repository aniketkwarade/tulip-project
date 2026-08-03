/**
 * THE TULIP PROJECT - Canvas Graph Engine (Minimalist Realignment)
 * Renders nodes as large, flat lavender/gold/grey bubbles matching the reference design.
 */

import { getAdjective } from './data.js';
import { isCausalRelationship } from './relationship-semantics.js';

const SPHERE_CATEGORY_RGB = Object.freeze({
  atmosphere: '210, 170, 245',
  oceans: '70, 190, 235',
  cryosphere: '165, 220, 255',
  biosphere: '105, 205, 135',
  energy: '255, 190, 90',
  digital: '155, 145, 245',
  agriculture: '190, 205, 95',
  transport: '245, 145, 90',
  economy: '230, 135, 160',
  sociopolitical: '120, 185, 225',
  core: '184, 212, 255'
});

const PDF_GRAPH_RGB = Object.freeze({
  trigger: '201, 74, 27',
  effect: '0, 119, 182',
  atmosphere: '126, 78, 166',
  oceans: '18, 120, 151',
  cryosphere: '56, 126, 158',
  biosphere: '45, 137, 82',
  energy: '171, 105, 0',
  digital: '101, 83, 184',
  agriculture: '111, 128, 30',
  transport: '181, 82, 31',
  economy: '171, 70, 107',
  sociopolitical: '66, 119, 155',
  core: '82, 105, 145'
});

const TREE_NODE_LABEL_EDGE_GAP = 24;

export class TulipGraph {
  constructor(canvas, nodes, edges, onSelectNode, onHoverNode = null, onSelectEdge = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.nodes = nodes;
    this.edges = edges;
    this.onSelectNode = onSelectNode;
    this.onHoverNode = onHoverNode;
    this.onSelectEdge = onSelectEdge;
    this.nodeById = new Map();
    this.incomingIdsById = new Map();
    this.outgoingIdsById = new Map();
    this.incomingEdgesById = new Map();
    this.outgoingEdgesById = new Map();
    this.adjacentIdsById = new Map();
    this.nodeDegreeById = new Map();

    // Camera transform (zoomed in slightly to make bubbles feel large)
    this.camera = { x: 0, y: 0, zoom: 0.7296 };
    this.dragStart = { x: 0, y: 0 };
    this.cameraStart = { x: 0, y: 0 };
    this.isDraggingGlobe = false;

    // Node Interaction
    this.selectedNode = null;
    this.hoveredNode = null;
    this.hoveredEdge = null;
    this.selectedEdge = null;
    this.backgroundPress = null;
    this.suppressBackgroundClick = false;
    this.exportBackgroundColor = null;
    this.draggedNode = null;
    this.hoverTimeout = null;
    this.leaveTimeout = null;
    this.defaultZoom = 0.7296;
    this.targetCamera = null;

    // 3D Globe parameters
    this.rotationX = 0.2; // initial tilt
    this.rotationY = 0.0;
    this.rotationStart = { x: 0, y: 0 };
    this.sphereRadius = 240;
    this.axisTiltAngle = 0.0;
    this.axisTiltPhase = 0.0;
    this.ambientHighlights = [];
    this.ambientHighlightSet = new Set();
    this.isFocusMode = false;
    this.needsCentering = false;
    this.activeFilter = 'all';
    this.layoutMode = 'network'; // 'network' or 'tree'
    this.layoutTransition = 0.0;
    this.isPanningCamera = false;
    this.showIncomingInfluences = true;
    this.showOutgoingInfluences = true;
    Object.defineProperties(this, {
      showTriggers: {
        configurable: true,
        get: () => this.showIncomingInfluences,
        set: value => { this.showIncomingInfluences = value !== false; }
      },
      showEffects: {
        configurable: true,
        get: () => this.showOutgoingInfluences,
        set: value => { this.showOutgoingInfluences = value !== false; }
      }
    });
    this.showAllAnalyzeConnections = false;
    this.pendingFocusSwap = false;
    this.instantFocusSwapFrame = false;
    this.autoRotatePausedUntil = 0;
    this.cachedAnalyzeFocusData = null;
    this.cachedAnalyzeFocusKey = null;
    this.cachedTreeLayout = null;
    this.cachedTreeLayoutKey = null;
    this.analyzeRevealState = new Map();
    this.analyzeEdgeRankingCache = new Map();
    this.returningFromAnalyzeTree = false;
    this.sphereReturnMomentumUntil = 0;
    this.lastAnalyzeSelectedId = null;
    this.lastAnalyzeDisplayedIds = new Set();
    this.lastShowAllAnalyzeConnections = false;
    this.userCollapsedAnalyzeConnections = false;
    this.edgeIgnitionStartedAt = 0;
    this.edgeIgnitionNodeId = null;
    this.filterWakeStartedAt = 0;
    this.filterWakeDuration = 720;

    this.buildIndexes();
    this.assignDiscoveryProfiles();

    // Initialize positions in a tighter spread
    this.initPositions();
    this.resizeCanvas();

    // Event listeners
    window.addEventListener('resize', () => this.resizeCanvas());
    this.watchPixelRatio = () => {
      this.pixelRatioMediaQuery?.removeEventListener?.('change', this.handlePixelRatioChange);
      this.pixelRatioMediaQuery = window.matchMedia?.(
        `(resolution: ${window.devicePixelRatio || 1}dppx)`
      );
      this.handlePixelRatioChange = () => {
        this.watchPixelRatio();
        this.resizeCanvas();
      };
      this.pixelRatioMediaQuery?.addEventListener?.('change', this.handlePixelRatioChange);
    };
    this.watchPixelRatio();
    if (typeof ResizeObserver !== 'undefined') {
      this.canvasResizeObserver = new ResizeObserver(() => {
        window.requestAnimationFrame(() => this.resizeCanvas());
      });
      this.canvasResizeObserver.observe(this.canvas.parentElement);
    }
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        this._textWidthCache?.clear();
        this.resizeCanvas();
      });
    }
    this.setupEvents();
    this.handleVisibilityChange = () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    };
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    this.animationFrameId = null;
    this.lastRenderedAt = 0;
    this.settledFrameCount = 0;
    this.isRunning = true;
    this.requestRender();
  }

  emitHoverState(node, pos = this.mousePos) {
    if (!this.onHoverNode) return;
    const rect = this.canvas.getBoundingClientRect();
    this.onHoverNode(node, {
      x: pos?.x ?? null,
      y: pos?.y ?? null,
      width: rect.width,
      height: rect.height
    });
  }

  measureTextCached(text, font) {
    if (!this._textWidthCache) {
      this._textWidthCache = new Map();
    }
    const key = `${font}|${text}`;
    let width = this._textWidthCache.get(key);
    if (width === undefined) {
      this.ctx.save();
      this.ctx.font = font;
      width = this.ctx.measureText(text).width;
      this.ctx.restore();
      this._textWidthCache.set(key, width);
    }
    return width;
  }

  getTreeMinimumLabelScale() {
    return 0.82;
  }

  getTreeNodeScreenRadius(node, zoom = this.camera.zoom) {
    const screenRadius = (node.radius || 3) * zoom;
    const degFactor = node.degree && this.maxDegree ? (node.degree / this.maxDegree) : 0.2;
    const analyzeState = node.analyzeState || this.getAnalyzeNodeState(node);
    const isFocusedNode = node.id === this.selectedNode?.id || node.id === this.hoveredNode?.id;
    const followableScale = (analyzeState === 'followable' || isFocusedNode) ? 1.08 : 1;

    return screenRadius * (1.45 + 0.45 * degFactor) * followableScale;
  }

  getTreeLabelLines(node) {
    const words = node.name.trim().split(/\s+/).filter(Boolean);
    if (words.length > 4) {
      return [words.slice(0, 4).join(' '), words.slice(4).join(' ')];
    }
    return [node.name];
  }

  getTreeLabelTypography(node, treeLabelScale = 1, isHoveredFollowable = false) {
    const style = node.labelStyle || 'focus';
    let nameFont = '';
    let lineHeight = 15;

    if (style === 'neighbor') {
      if (isHoveredFollowable) {
        nameFont = '800 18px "Inter Display", "InterDisplay", "Inter", sans-serif';
        lineHeight = 21;
      } else {
        nameFont = '400 18px "Inter Display", "InterDisplay", "Inter", sans-serif';
        lineHeight = 21;
      }
    } else if (style === 'ambient') {
      nameFont = '500 15px "Inter Display", "InterDisplay", "Inter", sans-serif';
      lineHeight = 18;
    } else {
      nameFont = '800 27px "Inter Display", "InterDisplay", "Inter", sans-serif';
      lineHeight = 31;
    }

    if (treeLabelScale < 0.999) {
      nameFont = this.scaleFontString(nameFont, treeLabelScale);
      lineHeight *= treeLabelScale;
    }

    return { nameFont, lineHeight };
  }

  getTreeLabelBoxForLayout(node, x, y, options = {}) {
    const {
      zoom = 1,
      treeLabelScale = 1,
      isSelected = false,
      isHoveredFollowable = false
    } = options;

    const lines = this.getTreeLabelLines(node);
    const { nameFont, lineHeight } = this.getTreeLabelTypography(node, treeLabelScale, isHoveredFollowable);
    const maxWidth = Math.max(...lines.map(line => this.measureTextCached(line, nameFont)));
    const screenPosX = x * zoom;
    const screenPosY = y * zoom;
    const screenHighlightRadius = this.getTreeNodeScreenRadius(node, zoom);
    const horizontalGap = screenHighlightRadius + TREE_NODE_LABEL_EDGE_GAP;
    const startY = screenPosY - ((lines.length - 1) * lineHeight) / 2;

    let minX;
    let maxX;

    if (isSelected) {
      minX = screenPosX - maxWidth / 2 - 12;
      maxX = screenPosX + maxWidth / 2 + 12;
    } else if (x < 0) {
      const labelX = screenPosX - horizontalGap;
      minX = labelX - maxWidth - 12;
      maxX = labelX + 8;
    } else {
      const labelX = screenPosX + horizontalGap;
      minX = labelX - 8;
      maxX = labelX + maxWidth + 12;
    }

    return {
      minX,
      maxX,
      minY: startY - lineHeight,
      maxY: startY + lines.length * lineHeight + 10,
      lineHeight
    };
  }

  getTreeGroupDisplayName(group) {
    const displayNames = {
      atmosphere: 'Air & Skies',
      oceans: 'Oceans & Water',
      cryosphere: 'Ice & Glaciers',
      biosphere: 'Plants & Wildlife',
      energy: 'Power & Heat',
      digital: 'Digital Infrastructure',
      agriculture: 'Farming & Food',
      transport: 'Travel & Shipping',
      economy: 'Markets & Money',
      sociopolitical: 'Society & Politics',
      loop: 'Reinforcing loop'
    };

    const sphereKey = (group?.sphere || '').toLowerCase();
    return (group?.label || displayNames[sphereKey] || group?.sphere || '').toUpperCase();
  }

  getTreeGroupScreenBoundsForLayout(group, isLeft, zoom, treeLabelScale = 1, layoutPositions = null) {
    if (!group || group.sphere === 'loop' || !Number.isFinite(zoom) || zoom <= 0) return null;

    const nodeIds = group.nodeIds || [];
    const screenPositions = [];
    let labelOuterScreenEdge = (isLeft ? group.x - 220 : group.x + 220) * zoom;

    nodeIds.forEach(nodeId => {
      const node = this.nodeById.get(nodeId);
      const pos = layoutPositions?.[nodeId] || node;
      if (!node || !pos) return;

      screenPositions.push({
        x: pos.x * zoom,
        y: pos.y * zoom
      });

      const labelBox = this.getTreeLabelBoxForLayout(node, pos.x, pos.y, {
        zoom,
        treeLabelScale,
        isSelected: nodeId === this.selectedNode?.id
      });

      labelOuterScreenEdge = isLeft
        ? Math.min(labelOuterScreenEdge, labelBox.minX)
        : Math.max(labelOuterScreenEdge, labelBox.maxX);
    });

    if (screenPositions.length === 0) return null;

    const defaultBracketScreenX = (isLeft ? group.x - 220 : group.x + 220) * zoom;
    const bracketMargin = 42;
    const requiredBracketScreenX = isLeft
      ? Math.min(defaultBracketScreenX, labelOuterScreenEdge - bracketMargin)
      : Math.max(defaultBracketScreenX, labelOuterScreenEdge + bracketMargin);

    const tagFont = '800 15px "Inter Display", "InterDisplay", "Inter", sans-serif';
    const tagWidth = this.measureTextCached(this.getTreeGroupDisplayName(group), tagFont);
    const tagOffset = 22;
    const tagScreenX = isLeft ? requiredBracketScreenX - tagOffset : requiredBracketScreenX + tagOffset;
    const labelMinX = isLeft ? tagScreenX - tagWidth : tagScreenX;
    const labelMaxX = isLeft ? tagScreenX : tagScreenX + tagWidth;

    const sortedY = screenPositions.map(pos => pos.y).sort((a, b) => a - b);
    const screenMinY = sortedY[0];
    const screenMaxY = sortedY[sortedY.length - 1];
    const isSingleNode = screenPositions.length === 1;
    const bracketMinY = isSingleNode ? screenMinY - 26 : screenMinY - 6;
    const bracketMaxY = isSingleNode ? screenMaxY + 26 : screenMaxY + 6;

    return {
      minX: Math.min(requiredBracketScreenX, labelMinX),
      maxX: Math.max(requiredBracketScreenX, labelMaxX),
      minY: bracketMinY,
      maxY: bracketMaxY
    };
  }

  buildIndexes() {
    this.nodeById.clear();
    this.incomingIdsById.clear();
    this.outgoingIdsById.clear();
    this.incomingEdgesById.clear();
    this.outgoingEdgesById.clear();
    this.adjacentIdsById.clear();
    this.nodeDegreeById.clear();

    this.nodes.forEach(node => {
      this.nodeById.set(node.id, node);
      this.incomingIdsById.set(node.id, new Set());
      this.outgoingIdsById.set(node.id, new Set());
      this.incomingEdgesById.set(node.id, []);
      this.outgoingEdgesById.set(node.id, []);
      this.adjacentIdsById.set(node.id, new Set());
      this.nodeDegreeById.set(node.id, 0);
    });

    this.edges.forEach(edge => {
      edge.edgeKey = this.buildEdgeKey(edge.source, edge.target);
      const sourceNode = this.nodeById.get(edge.source) || null;
      const targetNode = this.nodeById.get(edge.target) || null;
      edge.sourceNode = sourceNode;
      edge.targetNode = targetNode;

      if (!sourceNode || !targetNode) return;

      this.outgoingIdsById.get(edge.source)?.add(edge.target);
      this.incomingIdsById.get(edge.target)?.add(edge.source);
      this.outgoingEdgesById.get(edge.source)?.push(edge);
      this.incomingEdgesById.get(edge.target)?.push(edge);
      this.adjacentIdsById.get(edge.source)?.add(edge.target);
      this.adjacentIdsById.get(edge.target)?.add(edge.source);
      this.nodeDegreeById.set(edge.source, (this.nodeDegreeById.get(edge.source) || 0) + 1);
      this.nodeDegreeById.set(edge.target, (this.nodeDegreeById.get(edge.target) || 0) + 1);
    });
  }

  clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  assignDiscoveryProfiles() {
    const familiarBridgeIds = new Set([
      'carbon_emission',
      'deforestation',
      'methane',
      'industry_farming',
      'temp',
      'wet_bulb_heat',
      'urbanization',
      'resource_depletion'
    ]);

    const maxDegree = Math.max(1, ...this.nodes.map(node => this.nodeDegreeById.get(node.id) || 0));

    this.nodes.forEach(node => {
      const incomingIds = this.incomingIdsById.get(node.id) || new Set();
      const outgoingIds = this.outgoingIdsById.get(node.id) || new Set();
      const adjacentIds = this.adjacentIdsById.get(node.id) || new Set();
      const degree = this.nodeDegreeById.get(node.id) || 0;
      const normalizedDegree = this.clamp01(degree / maxDegree);

      const neighborSpheres = new Set();
      adjacentIds.forEach(id => {
        const neighbor = this.nodeById.get(id);
        if (neighbor?.sphere && neighbor.sphere !== node.sphere) {
          neighborSpheres.add(neighbor.sphere);
        }
      });

      let bridgeEdgeCount = 0;
      this.edges.forEach(edge => {
        if ((edge.source === node.id || edge.target === node.id) && edge.topology_rule === 'generated_bridge') {
          bridgeEdgeCount += 1;
        }
      });

      const calibrationRole = node.calibration?.role || 'generated';
      const sourceStatus = node.calibration?.source_status || 'unknown';
      let novelty = calibrationRole === 'generated' ? 0.86 : 0.52;
      if (sourceStatus === 'primary_research_link') novelty += 0.08;
      if (sourceStatus === 'web_verified_official') novelty -= 0.03;
      if (familiarBridgeIds.has(node.id)) novelty -= 0.34;
      novelty = this.clamp01(novelty);

      const societalFallout = this.clamp01(node.vector?.societal_fallout ?? 0.5);
      const humanDrivenness = this.clamp01(node.vector?.human_drivenness ?? 0.5);
      const hasHumanImpact = node.humanImpact?.primaryPathways?.length ? 1 : 0;
      const hasEconomicContext = node.economicContext ? 1 : 0;
      const reachBonus =
        node.context?.reach === 'global'
          ? 0.18
          : node.context?.reach === 'regional'
            ? 0.1
            : 0.04;
      const consequence = this.clamp01(
        societalFallout * 0.56 +
        humanDrivenness * 0.18 +
        hasHumanImpact * 0.14 +
        hasEconomicContext * 0.06 +
        reachBonus
      );

      const crossSphereRatio = this.clamp01(neighborSpheres.size / 6);
      const bridgeSignal = this.clamp01(bridgeEdgeCount / 4);
      const connectivity = this.clamp01(
        normalizedDegree * 0.56 +
        crossSphereRatio * 0.24 +
        bridgeSignal * 0.2
      );

      const chainCompleteness = incomingIds.size > 0 && outgoingIds.size > 0 ? 1 : (incomingIds.size > 0 || outgoingIds.size > 0 ? 0.58 : 0.2);
      const summarySupport = node.description ? 1 : 0.35;
      const explainability = this.clamp01(
        chainCompleteness * 0.5 +
        summarySupport * 0.15 +
        hasHumanImpact * 0.2 +
        hasEconomicContext * 0.1 +
        bridgeSignal * 0.05
      );

      const urgency = this.clamp01(((node.tulipScore ?? node.score?.baseline ?? 1) - 1) / 9);
      const discoveryScore = this.clamp01(
        novelty * 0.32 +
        consequence * 0.24 +
        connectivity * 0.2 +
        explainability * 0.14 +
        urgency * 0.1
      );

      const isBridgeConcept =
        familiarBridgeIds.has(node.id) ||
        connectivity >= 0.58 ||
        bridgeSignal >= 0.34 ||
        (consequence >= 0.7 && explainability >= 0.68);
      const isFrontierConcept =
        !isBridgeConcept &&
        novelty >= 0.62 &&
        explainability >= 0.48;
      const segment = isFrontierConcept ? 'frontier' : (isBridgeConcept ? 'bridge' : 'anchor');

      const reasonParts = [];
      if (segment === 'frontier') reasonParts.push('frontier concept with low assumed familiarity');
      if (segment === 'bridge') reasonParts.push('bridge concept that unlocks adjacent systems');
      if (segment === 'anchor') reasonParts.push('familiar anchor for orientation');
      if (consequence >= 0.7) reasonParts.push('strong human-system consequences');
      if (connectivity >= 0.65) reasonParts.push(`connects across ${Math.max(1, neighborSpheres.size)} adjacent spheres`);
      if (explainability >= 0.7) reasonParts.push('clear upstream-to-downstream causal chain');

      node.discovery = {
        score: Math.round(discoveryScore * 100),
        novelty: Math.round(novelty * 100),
        consequence: Math.round(consequence * 100),
        connectivity: Math.round(connectivity * 100),
        explainability: Math.round(explainability * 100),
        urgency: Math.round(urgency * 100),
        segment,
        reason: reasonParts.join('; ')
      };
    });
  }

  initPositions() {
    const N = this.nodes.length;
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    // Calculate node degrees based on total connection count
    let maxDegree = 1;
    this.nodes.forEach(node => {
      node.degree = this.nodeDegreeById.get(node.id) || 0;
      if (node.degree > maxDegree) {
        maxDegree = node.degree;
      }
    });
    this.maxDegree = maxDegree;

    // Distribute 9 cluster centers for the 9 environmental spheres using Fibonacci layout
    const spheresList = ['atmosphere', 'oceans', 'cryosphere', 'biosphere', 'energy', 'digital', 'agriculture', 'transport', 'economy', 'sociopolitical'];
    const sphereCenters = {};
    const numSpheres = spheresList.length;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    spheresList.forEach((sph, idx) => {
      const y = 1 - (idx / (numSpheres - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = goldenAngle * idx;
      sphereCenters[sph] = {
        x: Math.cos(theta) * r,
        y: y,
        z: Math.sin(theta) * r
      };
    });

    this.nodes.forEach((node, i) => {
      // Standard Fibonacci distribution on sphere coordinates
      const yBase = 1 - (i / (N - 1)) * 2;
      const radiusBase = Math.sqrt(1 - yBase * yBase);
      const thetaBase = phi * i;

      const baseX = Math.cos(thetaBase) * radiusBase;
      const baseY = yBase;
      const baseZ = Math.sin(thetaBase) * radiusBase;

      // Group nodes towards their respective sphere cluster center
      const center = sphereCenters[node.sphere || 'other'] || { x: 0, y: 0, z: 0 };
      const clusterStrength = 0.22; // 22% pull towards the sphere cluster center

      let x = baseX + (center.x - baseX) * clusterStrength;
      let y = baseY + (center.y - baseY) * clusterStrength;
      let z = baseZ + (center.z - baseZ) * clusterStrength;

      // Project back to unit sphere shell to retain structure
      const len = Math.sqrt(x * x + y * y + z * z) || 1.0;
      node.sphereX = x / len;
      node.sphereY = y / len;
      node.sphereZ = z / len;

      node.x = 0;
      node.y = 0;
      node.z = 0;
      node.vx = 0;
      node.vy = 0;
      node.radius = 3.22;

      node.visualRadius = 3.22;
      node.visualOpacity = 0.2;
    });
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const scaleVal = document.documentElement.style.getPropertyValue('--ui-scale');
    const parsedScale = scaleVal ? parseFloat(scaleVal) : 1;
    const scale = Number.isFinite(parsedScale) && parsedScale > 0 ? parsedScale : 1;

    const isDenseAnalyzeTree = this.layoutMode === 'tree'
      && this.isFocusMode
      && this.getDirectInteractiveEdges().length > 40;
    const width = Math.max(1, rect.width / scale);
    const height = Math.max(1, rect.height / scale);
    const nativePixelRatio = Math.max(1, (window.devicePixelRatio || 1) * scale);
    const maximumPixelRatio = isDenseAnalyzeTree ? 2.5 : 3;
    const pixelBudget = isDenseAnalyzeTree ? 12_000_000 : 16_000_000;
    const budgetPixelRatio = Math.sqrt(pixelBudget / (width * height));
    const dpr = Math.max(1, Math.min(nativePixelRatio, maximumPixelRatio, budgetPixelRatio));
    this.renderPixelRatio = dpr;
    this.width = width;
    this.height = height;
    const renderWidth = Math.max(1, Math.round(this.width * dpr));
    const renderHeight = Math.max(1, Math.round(this.height * dpr));
    if (this.canvas.width !== renderWidth || this.canvas.height !== renderHeight) {
      this.canvas.width = renderWidth;
      this.canvas.height = renderHeight;
    }
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    
    // Leave a reliable label-safe gutter between the filter rail and fixed footer.
    this.sphereRadius = Math.min(this.width, this.height) * 0.55;

    if (this.isFocusMode) {
      this.invalidateAnalyzeCaches();
      this.zoomToFit();
    } else {
      const verticalOffset = window.innerWidth <= 950 ? 10 : 45;
      this.camera.x = this.width / 2;
      this.camera.y = this.height / 2 + verticalOffset;

      if (this.targetCamera) {
        this.targetCamera.x = this.width / 2;
        this.targetCamera.y = this.height / 2 + verticalOffset;
      }
    }
    this.requestRender();
  }

  wakeUp() {
    this.alpha = 1.0;
    this.requestRender();
  }

  nudge() {
    if (this.alpha < 0.08) {
      this.alpha = 0.18;
    }
    this.requestRender();
  }

  tweenCamera(x, y, zoom) {
    this.targetCamera = { x, y, zoom };
    this.requestRender();
  }

  selectNode(node, options = {}) {
    const isChangingFocus =
      this.isFocusMode &&
      this.layoutMode === 'network' &&
      this.selectedNode &&
      node &&
      this.selectedNode.id !== node.id;

    this.pendingFocusSwap = options.instantSwap === true || isChangingFocus;
    if (!this.selectedNode || !node || this.selectedNode.id !== node.id) {
      this.userCollapsedAnalyzeConnections = false;
    }
    const shouldIgnitePath = Boolean(
      node &&
      (!this.selectedNode || this.selectedNode.id !== node.id) &&
      !window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    );
    this.selectedNode = node;
    if (shouldIgnitePath) {
      this.edgeIgnitionNodeId = node.id;
      this.edgeIgnitionStartedAt = performance.now();
    }
    this.selectedEdge = null;
    this.hoveredEdge = null;
    this.invalidateAnalyzeCaches();
    this.requestRender();
  }

  setSelectedEdge(edge) {
    const previousEdgeKey = this.selectedEdge
      ? (this.selectedEdge.edgeKey || this.buildEdgeKey(this.selectedEdge.source, this.selectedEdge.target))
      : '';
    const nextEdge = edge || null;
    const nextEdgeKey = nextEdge
      ? (nextEdge.edgeKey || this.buildEdgeKey(nextEdge.source, nextEdge.target))
      : '';

    this.selectedEdge = nextEdge;

    if (previousEdgeKey !== nextEdgeKey) {
      this.invalidateAnalyzeCaches();
      if (this.isFocusMode) {
        this.zoomToFit();
      }
    }
    this.requestRender();
  }

  invalidateAnalyzeCaches() {
    this.cachedAnalyzeFocusData = null;
    this.cachedAnalyzeFocusKey = null;
    this.cachedTreeLayout = null;
    this.cachedTreeLayoutKey = null;
    this.requestRender();
  }

  getAnalyzeFocusCacheKey(selectedNode = this.selectedNode) {
    if (!this.isFocusMode || !selectedNode) return null;
    const selectedEdgeKey = this.selectedEdge
      ? (this.selectedEdge.edgeKey || this.buildEdgeKey(this.selectedEdge.source, this.selectedEdge.target))
      : '';
    return [
      selectedNode.id,
      this.showTriggers ? '1' : '0',
      this.showEffects ? '1' : '0',
      this.showAllAnalyzeConnections ? '1' : '0',
      this.userCollapsedAnalyzeConnections ? '1' : '0',
      selectedEdgeKey
    ].join('|');
  }

  getAnalyzeFocusData(selectedNode = this.selectedNode) {
    const cacheKey = this.getAnalyzeFocusCacheKey(selectedNode);
    if (!cacheKey) return null;
    if (this.cachedAnalyzeFocusData && this.cachedAnalyzeFocusKey === cacheKey) {
      return this.cachedAnalyzeFocusData;
    }

    const focusData = this.computeAnalyzeFocusData(selectedNode);
    this.cachedAnalyzeFocusData = focusData;
    this.cachedAnalyzeFocusKey = cacheKey;
    return focusData;
  }

  getTreeLayoutCacheKey(selectedNode = this.selectedNode) {
    const focusKey = this.getAnalyzeFocusCacheKey(selectedNode);
    if (!focusKey) return null;
    return [
      focusKey,
      this.width || 0,
      this.height || 0
    ].join('|');
  }

  getTreeLayout(selectedNode = this.selectedNode) {
    const cacheKey = this.getTreeLayoutCacheKey(selectedNode);
    if (!cacheKey) return null;
    if (this.cachedTreeLayout && this.cachedTreeLayoutKey === cacheKey) {
      return this.cachedTreeLayout;
    }

    const layout = this.computeTreeLayout(selectedNode);
    this.cachedTreeLayout = layout;
    this.cachedTreeLayoutKey = cacheKey;
    return layout;
  }

  buildEdgeKey(sourceId, targetId) {
    return `${sourceId}->${targetId}`;
  }

  rankAnalyzeEdges(edges, direction) {
    if (edges.length > 0) {
      const ownerId = direction === 'incoming' ? edges[0].target : edges[0].source;
      const cacheKey = `${direction}:${ownerId}`;
      const cached = this.analyzeEdgeRankingCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const ranked = [...edges].sort((a, b) => {
        const aNode = this.nodeById.get(direction === 'incoming' ? a.source : a.target);
        const bNode = this.nodeById.get(direction === 'incoming' ? b.source : b.target);
        const aScore = Math.abs(a.influence || 0) * 100 + (aNode?.discovery?.score || 0);
        const bScore = Math.abs(b.influence || 0) * 100 + (bNode?.discovery?.score || 0);
        if (bScore !== aScore) return bScore - aScore;
        return (aNode?.name || '').localeCompare(bNode?.name || '');
      });
      this.analyzeEdgeRankingCache.set(cacheKey, ranked);
      return ranked;
    }

    return [...edges].sort((a, b) => {
      const aNode = this.nodeById.get(direction === 'incoming' ? a.source : a.target);
      const bNode = this.nodeById.get(direction === 'incoming' ? b.source : b.target);
      const aScore = Math.abs(a.influence || 0) * 100 + (aNode?.discovery?.score || 0);
      const bScore = Math.abs(b.influence || 0) * 100 + (bNode?.discovery?.score || 0);
      if (bScore !== aScore) return bScore - aScore;
      return (aNode?.name || '').localeCompare(bNode?.name || '');
    });
  }

  getAnalyzeEdgeScore(edge, direction) {
    const node = this.nodeById.get(direction === 'incoming' ? edge.source : edge.target);
    return Math.abs(edge.influence || 0) * 100 + (node?.discovery?.score || 0);
  }

  getCollapsedAnalyzeSelection(incomingEdges, outgoingEdges, maxConnections = 8) {
    // Keep the selected node's causal story legible when one side is much
    // smaller than the other. Ranking every edge in a single pool made a
    // high-degree anchor such as Carbon Emission appear to have only a couple
    // of effects: its many upstream drivers consumed the display budget. This
    // is a presentation constraint, not an evidence constraint, so preserve
    // the entire small side where it fits and use the remaining slots for the
    // highest-ranked relationships on the large side.
    const totalConnections = incomingEdges.length + outgoingEdges.length;
    const preserveIncoming = incomingEdges.length > 0 && incomingEdges.length <= Math.floor(maxConnections / 2);
    const preserveOutgoing = outgoingEdges.length > 0 && outgoingEdges.length <= Math.floor(maxConnections / 2);

    if (totalConnections <= maxConnections) {
      return {
        displayedDriverEdges: incomingEdges,
        displayedImpactEdges: outgoingEdges
      };
    }

    if (preserveIncoming && !preserveOutgoing) {
      return {
        displayedDriverEdges: incomingEdges,
        displayedImpactEdges: outgoingEdges.slice(0, Math.max(0, maxConnections - incomingEdges.length))
      };
    }

    if (preserveOutgoing && !preserveIncoming) {
      return {
        displayedDriverEdges: incomingEdges.slice(0, Math.max(0, maxConnections - outgoingEdges.length)),
        displayedImpactEdges: outgoingEdges
      };
    }

    const rankedCandidates = [
      ...incomingEdges.map(edge => ({
        edge,
        direction: 'incoming',
        nodeId: edge.source,
        score: this.getAnalyzeEdgeScore(edge, 'incoming')
      })),
      ...outgoingEdges.map(edge => ({
        edge,
        direction: 'outgoing',
        nodeId: edge.target,
        score: this.getAnalyzeEdgeScore(edge, 'outgoing')
      }))
    ].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aNode = this.nodeById.get(a.nodeId);
      const bNode = this.nodeById.get(b.nodeId);
      return (aNode?.name || '').localeCompare(bNode?.name || '');
    });

    const keptNodeIds = new Set(rankedCandidates.slice(0, maxConnections).map(item => item.nodeId));

    return {
      displayedDriverEdges: incomingEdges.filter(edge => keptNodeIds.has(edge.source)),
      displayedImpactEdges: outgoingEdges.filter(edge => keptNodeIds.has(edge.target))
    };
  }

  shouldAutoExpandAnalyzeConnections(incomingEdges = [], outgoingEdges = []) {
    const directIds = new Set([
      ...incomingEdges.map(edge => edge.source),
      ...outgoingEdges.map(edge => edge.target)
    ]);
    return directIds.size <= 8;
  }

  findAnalyzeLoop(selectedId, preferredNodeIds = []) {
    const preferredSet = new Set(preferredNodeIds);
    const loops = [];
    const maxLoopLength = 4;

    const walk = (currentId, visitedIds, pathEdges, influenceProduct) => {
      if (pathEdges.length >= maxLoopLength) return;
      const outgoing = (this.outgoingEdgesById.get(currentId) || []).filter(isCausalRelationship);

      outgoing.forEach(edge => {
        const nextId = edge.target;
        const nextInfluence = influenceProduct * (edge.influence || 0);

        if (nextId === selectedId && pathEdges.length >= 1 && nextInfluence > 0) {
          const traversedNodeIds = [
            ...pathEdges.map(item => item.target),
            currentId
          ].filter(id => id && id !== selectedId);
          const uniqueNodeIds = [...new Set(traversedNodeIds)];
          const preferredHits = uniqueNodeIds.reduce((count, id) => count + (preferredSet.has(id) ? 1 : 0), 0);
          loops.push({
            edges: [...pathEdges, edge],
            nodeIds: uniqueNodeIds,
            score: nextInfluence * 100 + preferredHits * 12
          });
          return;
        }

        if (visitedIds.has(nextId) || nextId === selectedId) return;
        visitedIds.add(nextId);
        walk(nextId, visitedIds, [...pathEdges, edge], nextInfluence);
        visitedIds.delete(nextId);
      });
    };

    walk(selectedId, new Set([selectedId]), [], 1);
    loops.sort((a, b) => b.score - a.score || a.nodeIds.length - b.nodeIds.length);
    return loops[0] || null;
  }

  computeAnalyzeFocusData(selectedNode = this.selectedNode) {
    if (!this.isFocusMode || !selectedNode) return null;

    const selectedId = selectedNode.id;
    const incomingEdges = this.rankAnalyzeEdges(
      (this.incomingEdgesById.get(selectedId) || []).filter(isCausalRelationship),
      'incoming'
    );
    const outgoingEdges = this.rankAnalyzeEdges(
      (this.outgoingEdgesById.get(selectedId) || []).filter(isCausalRelationship),
      'outgoing'
    );
    // Keep the default view legible and frame-safe. Larger neighborhoods retain
    // every reviewed relationship behind the explicit Expand control.
    const autoExpandAllConnections = this.shouldAutoExpandAnalyzeConnections(incomingEdges, outgoingEdges);
    const displayAllConnections = this.showAllAnalyzeConnections || (autoExpandAllConnections && !this.userCollapsedAnalyzeConnections);
    const collapsedSelection = displayAllConnections
      ? { displayedDriverEdges: incomingEdges, displayedImpactEdges: outgoingEdges }
      : this.getCollapsedAnalyzeSelection(incomingEdges, outgoingEdges, 8);

    let displayedDriverEdges = this.showTriggers === false
      ? []
      : collapsedSelection.displayedDriverEdges;
    let displayedImpactEdges = this.showEffects === false
      ? []
      : collapsedSelection.displayedImpactEdges;

    // An inspector-selected relationship must remain legible even when its
    // endpoint would normally be hidden behind the collapsed Expand state.
    // Promote only that relationship, preserving the density of the rest.
    const selectedRelationshipEdge =
      this.selectedEdge &&
      isCausalRelationship(this.selectedEdge) &&
      (this.selectedEdge.source === selectedId || this.selectedEdge.target === selectedId)
        ? this.selectedEdge
        : null;
    if (selectedRelationshipEdge) {
      const selectedRelationshipKey =
        selectedRelationshipEdge.edgeKey ||
        this.buildEdgeKey(selectedRelationshipEdge.source, selectedRelationshipEdge.target);
      const containsSelectedRelationship = edges => edges.some(edge =>
        (edge.edgeKey || this.buildEdgeKey(edge.source, edge.target)) === selectedRelationshipKey
      );

      if (
        selectedRelationshipEdge.target === selectedId &&
        this.showTriggers !== false &&
        !containsSelectedRelationship(displayedDriverEdges)
      ) {
        displayedDriverEdges = [...displayedDriverEdges, selectedRelationshipEdge];
      }
      if (
        selectedRelationshipEdge.source === selectedId &&
        this.showEffects !== false &&
        !containsSelectedRelationship(displayedImpactEdges)
      ) {
        displayedImpactEdges = [...displayedImpactEdges, selectedRelationshipEdge];
      }
    }

    const displayedDriverIds = displayedDriverEdges.map(edge => edge.source);
    const displayedImpactIds = displayedImpactEdges.map(edge => edge.target);
    const displayedDriverIdSet = new Set(displayedDriverIds);
    const displayedImpactIdSet = new Set(displayedImpactIds);
    const preferredLoopIds = [...displayedDriverIds, ...displayedImpactIds];
    const loop = this.findAnalyzeLoop(selectedId, preferredLoopIds);
    const loopNodeIds = loop
      ? loop.nodeIds.filter(id => !displayedDriverIdSet.has(id) && !displayedImpactIdSet.has(id))
      : [];

    // Keep click emphasis scoped to the selected node plus its direct displayed drivers/effects.
    // Loop nodes can still exist in expanded/tree layouts, but they should not read as co-selected.
    const highlightedIds = new Set([selectedId, ...displayedDriverIds, ...displayedImpactIds]);
    const contextIds = new Set([
      ...incomingEdges.map(edge => edge.source),
      ...outgoingEdges.map(edge => edge.target)
    ]);
    const visibleIds = new Set([...highlightedIds, ...loopNodeIds, ...contextIds]);

    const interactiveEdges = [...displayedDriverEdges, ...displayedImpactEdges];
    const emphasizedEdgeKeys = new Set();
    displayedDriverEdges.forEach(edge => emphasizedEdgeKeys.add(edge.edgeKey));
    displayedImpactEdges.forEach(edge => emphasizedEdgeKeys.add(edge.edgeKey));
    if (loop?.edges?.length) {
      loop.edges.forEach(edge => emphasizedEdgeKeys.add(edge.edgeKey));
    }

    return {
      selectedId,
      interactiveEdges,
      interactiveEdgeSet: new Set(interactiveEdges),
      displayedDriverIds,
      displayedImpactIds,
      loopNodeIds,
      highlightedIds,
      contextIds,
      visibleIds,
      emphasizedEdgeKeys,
      autoExpandAllConnections,
      displayAllConnections,
      hiddenConnectionCount: Math.max(0, incomingEdges.length - displayedDriverIds.length) + Math.max(0, outgoingEdges.length - displayedImpactIds.length),
      hiddenTriggerCount: Math.max(0, incomingEdges.length - displayedDriverIds.length),
      hiddenEffectCount: Math.max(0, outgoingEdges.length - displayedImpactIds.length)
    };
  }

  syncAnalyzeRevealState(focusData) {
    if (!this.isFocusMode || !focusData?.selectedId) {
      this.analyzeRevealState.clear();
      this.lastAnalyzeSelectedId = null;
      this.lastAnalyzeDisplayedIds = new Set();
      this.lastShowAllAnalyzeConnections = false;
      return;
    }

    const selectedId = focusData.selectedId;
    const currentDisplayedIds = new Set([
      ...focusData.displayedDriverIds,
      ...focusData.displayedImpactIds,
      ...focusData.loopNodeIds
    ]);
    const selectedChanged = this.lastAnalyzeSelectedId !== selectedId;
    const isExpanding = !selectedChanged && !this.lastShowAllAnalyzeConnections && this.showAllAnalyzeConnections;

    if (selectedChanged) {
      this.analyzeRevealState.clear();
    }

    if (isExpanding) {
      const originNode = this.nodeById.get(selectedId);
      const origin = {
        x: originNode?.x ?? 0,
        y: originNode?.y ?? 0,
        z: originNode?.z ?? 1
      };
      const startTime = performance.now();

      currentDisplayedIds.forEach(id => {
        if (this.lastAnalyzeDisplayedIds.has(id)) return;
        const node = this.nodeById.get(id);
        if (!node) return;

        this.analyzeRevealState.set(id, {
          startTime,
          duration: this.layoutMode === 'tree' ? 180 : 220,
          origin
        });
        node.x = origin.x;
        node.y = origin.y;
        node.z = origin.z;
        node.opacityMultiplier = 0.0;
      });
    }

    [...this.analyzeRevealState.keys()].forEach(id => {
      if (!currentDisplayedIds.has(id)) {
        this.analyzeRevealState.delete(id);
      }
    });

    this.lastAnalyzeSelectedId = selectedId;
    this.lastAnalyzeDisplayedIds = currentDisplayedIds;
    this.lastShowAllAnalyzeConnections = this.showAllAnalyzeConnections;
  }

  computeTreeLayout(selectedNode) {
    if (!selectedNode) return null;
    const selectedId = selectedNode.id;
    const focusData = this.getAnalyzeFocusData(selectedNode);
    const drivers = [...(focusData?.displayedDriverIds || [])];
    const impacts = [...(focusData?.displayedImpactIds || [])].filter(id => !drivers.includes(id));
    const loopNodes = [...(focusData?.loopNodeIds || [])].filter(id => !drivers.includes(id) && !impacts.includes(id));
    const sphereOrder = ['atmosphere', 'oceans', 'cryosphere', 'biosphere', 'energy', 'digital', 'agriculture', 'transport', 'economy', 'sociopolitical'];
    const orderIndex = sphere => {
      const idx = sphereOrder.indexOf(sphere);
      return idx === -1 ? sphereOrder.length : idx;
    };
    const sortNodesForTree = (a, b) => {
      const ay = a?.sphereY ?? 0;
      const by = b?.sphereY ?? 0;
      if (Math.abs(ay - by) > 0.015) return ay - by;
      return a.name.localeCompare(b.name);
    };
    const minTreeLabelScale = this.getTreeMinimumLabelScale();
    const getTreeNodeLabelMetrics = node => {
      const lines = this.getTreeLabelLines(node);
      const { nameFont, lineHeight } = this.getTreeLabelTypography(node, minTreeLabelScale);
      const maxWidth = Math.max(...lines.map(line => this.measureTextCached(line, nameFont)));
      return {
        lineHeight,
        lineCount: lines.length,
        blockHeight: lineHeight * lines.length,
        maxWidth
      };
    };
    const getVerticalLabelGap = (prevNode, nextNode) => {
      const prevMetrics = getTreeNodeLabelMetrics(prevNode);
      const nextMetrics = getTreeNodeLabelMetrics(nextNode);
      return Math.round(
        prevMetrics.blockHeight / 2 +
        nextMetrics.blockHeight / 2 +
        prevMetrics.lineHeight +
        nextMetrics.lineHeight +
        18
      );
    };
    const getTreeZoomCompression = () => {
      const minZoom = 0.88;
      const maxZoom = 1.78;
      const referenceZoom = this.targetCamera?.zoom ?? this.camera.zoom ?? minZoom;
      const clampedZoom = Math.max(minZoom, Math.min(maxZoom, referenceZoom));
      const normalized = (clampedZoom - minZoom) / (maxZoom - minZoom);
      return 1 - (normalized * 0.58);
    };
    // Group drivers by sphere
    const driversBySphere = {};
    drivers.forEach(id => {
      const node = this.nodeById.get(id);
      if (node) {
        const sphere = node.sphere || 'other';
        if (!driversBySphere[sphere]) driversBySphere[sphere] = [];
        driversBySphere[sphere].push(node);
      }
    });

    // Group impacts by sphere
    const impactsBySphere = {};
    impacts.forEach(id => {
      const node = this.nodeById.get(id);
      if (node) {
        const sphere = node.sphere || 'other';
        if (!impactsBySphere[sphere]) impactsBySphere[sphere] = [];
        impactsBySphere[sphere].push(node);
      }
    });

    const estimateColumnHeight = groups => {
      const groupEntries = Object.values(groups);
      if (groupEntries.length === 0) return 0;
      return groupEntries.reduce((sum, nodes, idx) => {
        const sortedNodes = nodes.slice().sort(sortNodesForTree);
        let height = 0;
        for (let i = 1; i < sortedNodes.length; i += 1) {
          height += getVerticalLabelGap(sortedNodes[i - 1], sortedNodes[i]);
        }
        if (idx < groupEntries.length - 1) {
          height += 170;
        }
        return sum + height;
      }, 0);
    };

    const estimatedDriverHeight = estimateColumnHeight(driversBySphere);
    const estimatedImpactHeight = estimateColumnHeight(impactsBySphere);
    const estimatedTreeHeight = Math.max(estimatedDriverHeight, estimatedImpactHeight);
    const isExpandedTree = Boolean(focusData?.displayAllConnections);
    const sideX = this.sphereRadius * (isExpandedTree ? 1.88 : 1.46);
    const baseNodeGap = isExpandedTree ? 116 : 128;
    const baseGroupGap = isExpandedTree ? 196 : 220;
    const targetTreeHeight = this.sphereRadius * (isExpandedTree ? 1.55 : 1.82);
    const gapScale = estimatedTreeHeight > targetTreeHeight
      ? Math.max(isExpandedTree ? 0.72 : 0.82, targetTreeHeight / estimatedTreeHeight)
      : 1;
    const nodeGap = Math.max(isExpandedTree ? 84 : 96, Math.round(baseNodeGap * gapScale));
    const groupGap = Math.max(isExpandedTree ? 136 : 156, Math.round(baseGroupGap * gapScale));
    const zoomCompressionFactor = this.layoutMode === 'tree' && this.isFocusMode
      ? getTreeZoomCompression()
      : 1;
    const minimumNodeGap = [];
    const minimumZoomRatios = [];

    const positions = {};
    const driverGroups = [];
    const impactGroups = [];
    const loopGroups = [];
    const driverColumns = [];
    const impactColumns = [];

    // Layout drivers
    const sortedDriverSpheres = Object.keys(driversBySphere).sort((a, b) => orderIndex(a) - orderIndex(b));
    let currentDriverY = 0;
    sortedDriverSpheres.forEach((sphere, gIdx) => {
      const groupNodes = driversBySphere[sphere].slice().sort(sortNodesForTree);
      const startY = currentDriverY;
      const groupX = -sideX;
      const groupNodeIds = [];

      groupNodes.forEach((node, nIdx) => {
        positions[node.id] = { yRaw: currentDriverY, x: groupX };
        groupNodeIds.push(node.id);
        if (nIdx < groupNodes.length - 1) {
          const nextNode = groupNodes[nIdx + 1];
          const requiredLabelGap = getVerticalLabelGap(node, nextNode);
          const baseLabelGap = Math.max(nodeGap, Math.round(requiredLabelGap * gapScale));
          minimumNodeGap.push(baseLabelGap);
          minimumZoomRatios.push(requiredLabelGap / Math.max(1, baseLabelGap));
          currentDriverY += baseLabelGap;
        }
      });
      const endY = currentDriverY;
      if (groupNodeIds.length > 0) {
        driverGroups.push({ sphere, minYRaw: startY, maxYRaw: endY, x: groupX, nodeIds: groupNodeIds });
        driverColumns.push(...groupNodeIds);
      }
      if (groupNodeIds.length > 0 && gIdx < sortedDriverSpheres.length - 1) {
        currentDriverY += groupGap;
      }
    });

    // Layout impacts
    const sortedImpactSpheres = Object.keys(impactsBySphere).sort((a, b) => orderIndex(a) - orderIndex(b));
    let currentImpactY = 0;
    sortedImpactSpheres.forEach((sphere, gIdx) => {
      const groupNodes = impactsBySphere[sphere].slice().sort(sortNodesForTree);
      const startY = currentImpactY;
      const groupX = sideX;
      const groupNodeIds = [];
      
      groupNodes.forEach((node, nIdx) => {
        positions[node.id] = { yRaw: currentImpactY, x: groupX };
        groupNodeIds.push(node.id);
        if (nIdx < groupNodes.length - 1) {
          const nextNode = groupNodes[nIdx + 1];
          const requiredLabelGap = getVerticalLabelGap(node, nextNode);
          const baseLabelGap = Math.max(nodeGap, Math.round(requiredLabelGap * gapScale));
          minimumNodeGap.push(baseLabelGap);
          minimumZoomRatios.push(requiredLabelGap / Math.max(1, baseLabelGap));
          currentImpactY += baseLabelGap;
        }
      });
      const endY = currentImpactY;
      if (groupNodeIds.length > 0) {
        impactGroups.push({ sphere, minYRaw: startY, maxYRaw: endY, x: groupX, nodeIds: groupNodeIds });
        impactColumns.push(...groupNodeIds);
      }
      if (groupNodeIds.length > 0 && gIdx < sortedImpactSpheres.length - 1) {
        currentImpactY += groupGap;
      }
    });

    const getColumnHeight = nodeIds => {
      if (!nodeIds.length) return 0;
      let minY = Infinity;
      let maxY = -Infinity;
      nodeIds.forEach(id => {
        const yRaw = positions[id]?.yRaw;
        if (!Number.isFinite(yRaw)) return;
        if (yRaw < minY) minY = yRaw;
        if (yRaw > maxY) maxY = yRaw;
      });
      return Number.isFinite(minY) && Number.isFinite(maxY) ? (maxY - minY) : 0;
    };

    const driverCenterY = getColumnHeight(driverColumns) / 2;
    const impactCenterY = getColumnHeight(impactColumns) / 2;

    drivers.forEach(id => {
      if (positions[id]) {
        positions[id].x = -Math.abs(positions[id].x);
        positions[id].y = positions[id].yRaw - driverCenterY;
        positions[id].z = 1.0;
        positions[id].opacityMultiplier = 1.0;
      }
    });

    impacts.forEach(id => {
      if (positions[id]) {
        positions[id].x = Math.abs(positions[id].x);
        positions[id].y = positions[id].yRaw - impactCenterY;
        positions[id].z = 1.0;
        positions[id].opacityMultiplier = 1.0;
      }
    });

    const computeTreeFitZoomForLayout = () => {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      [...drivers, ...impacts, selectedId].forEach(id => {
        const pos = positions[id];
        if (!pos) return;
        if (pos.x < minX) minX = pos.x;
        if (pos.x > maxX) maxX = pos.x;
        if (pos.y < minY) minY = pos.y;
        if (pos.y > maxY) maxY = pos.y;
      });

      if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return 0.9;

      const isExpandedTreeLayout = Boolean(focusData?.displayAllConnections);
      const paddingX = isExpandedTreeLayout ? 320 : 300;
      const paddingY = isExpandedTreeLayout ? 140 : 150;
      const availableWidth = this.width - paddingX * 2;
      const availableHeight = this.height - paddingY * 2;
      return Math.min(
        availableWidth / Math.max(1, maxX - minX),
        availableHeight / Math.max(1, maxY - minY)
      );
    };

    const minimumTreeZoom = Math.max(0.06, Math.min(1.05, computeTreeFitZoomForLayout() * 1.22));
    const labelCollisionMargin = 10;
    const rootClearanceMargin = 18;
    const rootLabelBox = this.getTreeLabelBoxForLayout(selectedNode, 0, 0, {
      zoom: minimumTreeZoom,
      treeLabelScale: minTreeLabelScale,
      isSelected: true
    });

    const nudgeNodeByScreenDelta = (nodeId, deltaScreenY) => {
      if (!positions[nodeId] || Math.abs(deltaScreenY) < 0.01) return;
      positions[nodeId].y += deltaScreenY / Math.max(0.001, minimumTreeZoom);
    };

    const resolveColumnCollisions = nodeIds => {
      const sortedNodeIds = nodeIds
        .filter(id => positions[id])
        .sort((a, b) => positions[a].y - positions[b].y);

      const topHalf = sortedNodeIds.filter(id => positions[id].y < 0).sort((a, b) => positions[b].y - positions[a].y);
      const bottomHalf = sortedNodeIds.filter(id => positions[id].y >= 0).sort((a, b) => positions[a].y - positions[b].y);

      let previousBoundary = rootLabelBox.minY - rootClearanceMargin;
      topHalf.forEach(nodeId => {
        const node = this.nodeById.get(nodeId);
        if (!node) return;
        const box = this.getTreeLabelBoxForLayout(node, positions[nodeId].x, positions[nodeId].y, {
          zoom: minimumTreeZoom,
          treeLabelScale: minTreeLabelScale
        });
        const allowedMaxY = previousBoundary;
        if (box.maxY > allowedMaxY) {
          nudgeNodeByScreenDelta(nodeId, allowedMaxY - box.maxY);
        }
        const nextBox = this.getTreeLabelBoxForLayout(node, positions[nodeId].x, positions[nodeId].y, {
          zoom: minimumTreeZoom,
          treeLabelScale: minTreeLabelScale
        });
        previousBoundary = nextBox.minY - labelCollisionMargin;
      });

      previousBoundary = rootLabelBox.maxY + rootClearanceMargin;
      bottomHalf.forEach(nodeId => {
        const node = this.nodeById.get(nodeId);
        if (!node) return;
        const box = this.getTreeLabelBoxForLayout(node, positions[nodeId].x, positions[nodeId].y, {
          zoom: minimumTreeZoom,
          treeLabelScale: minTreeLabelScale
        });
        const allowedMinY = previousBoundary;
        if (box.minY < allowedMinY) {
          nudgeNodeByScreenDelta(nodeId, allowedMinY - box.minY);
        }
        const nextBox = this.getTreeLabelBoxForLayout(node, positions[nodeId].x, positions[nodeId].y, {
          zoom: minimumTreeZoom,
          treeLabelScale: minTreeLabelScale
        });
        previousBoundary = nextBox.maxY + labelCollisionMargin;
      });
    };

    resolveColumnCollisions(driverColumns);
    resolveColumnCollisions(impactColumns);

    const applyVerticalCompression = nodeIds => {
      nodeIds.forEach(id => {
        if (!positions[id]) return;
        positions[id].y *= zoomCompressionFactor;
      });
    };

    applyVerticalCompression(driverColumns);
    applyVerticalCompression(impactColumns);

    const refreshGroupBounds = groups => {
      groups.forEach(group => {
        const ys = group.nodeIds
          .map(id => positions[id]?.y)
          .filter(value => Number.isFinite(value))
          .sort((a, b) => a - b);
        if (!ys.length) return;
        group.minY = ys[0];
        group.maxY = ys[ys.length - 1];
        if (group.minY === group.maxY) {
          group.minY -= 30;
          group.maxY += 30;
        }
      });
    };

    refreshGroupBounds(driverGroups);
    refreshGroupBounds(impactGroups);

    if (loopNodes.length > 0) {
      const loopY = Math.max(180, Math.max(getColumnHeight(driverColumns), getColumnHeight(impactColumns)) * 0.3 + 110);
      const loopStartX = -((loopNodes.length - 1) * nodeGap * 0.48);
      loopNodes.forEach((id, index) => {
        positions[id] = {
          x: loopStartX + index * nodeGap * 0.96,
          y: loopY,
          z: 1.0,
          opacityMultiplier: 1.0
        };
      });
      loopGroups.push({
        sphere: 'loop',
        x: 0,
        minY: loopY - 30,
        maxY: loopY + 30,
        nodeIds: loopNodes,
        label: 'Reinforcing loop'
      });
    }

    // Root node
    positions[selectedId] = {
      x: 0,
      y: 0,
      z: 1.0,
      opacityMultiplier: 1.0
    };

    return {
      positions,
      driverGroups,
      impactGroups,
      loopGroups,
      drivers,
      driverSet: new Set(drivers),
      impacts,
      impactSet: new Set(impacts),
      loopNodes,
      nodeGap: minimumNodeGap.length > 0 ? Math.min(...minimumNodeGap) : nodeGap,
      groupGap,
      minLabelZoom: minimumZoomRatios.length > 0 ? Math.max(...minimumZoomRatios) * 1.04 : 0,
      minTreeLabelScale
    };
  }

  drawGroupLabels(groups, isLeft) {
    const ctx = this.ctx;
    
    const displayNames = {
      atmosphere: 'Air & Skies',
      oceans: 'Oceans & Water',
      cryosphere: 'Ice & Glaciers',
      biosphere: 'Plants & Wildlife',
      energy: 'Power & Heat',
      digital: 'Digital Infrastructure',
      agriculture: 'Farming & Food',
      transport: 'Travel & Shipping',
      economy: 'Markets & Money',
      sociopolitical: 'Society & Politics',
      loop: 'Reinforcing loop'
    };

    const getSphereColor = (sphere, opacity) => {
      const palette = this.exportBackgroundColor ? PDF_GRAPH_RGB : SPHERE_CATEGORY_RGB;
      const rgb = palette[String(sphere || '').toLowerCase()] || palette.core;
      return `rgba(${rgb}, ${opacity})`;
    };

    const getTreeGroupOuterScreenEdge = group => {
      const nodeIds = group.nodeIds || [];
      const fallbackScreenX = this.worldToScreen(isLeft ? group.x - 220 : group.x + 220, 0).x;
      let outerEdge = fallbackScreenX;
      const treeLabelScale = this.getTreeLabelScale();

      nodeIds.forEach(nodeId => {
        const node = this.nodeById.get(nodeId);
        if (!node || !node.labelOpacity || node.labelOpacity <= 0.01) return;

        const analyzeState = node.analyzeState || this.getAnalyzeNodeState(node);
        const isHoveredFollowable = this.isFocusMode && this.hoveredNode?.id === node.id && analyzeState === 'followable';
        const screenPos = this.worldToScreen(node.x, node.y);
        const screenHighlightRadius = this.getTreeNodeScreenRadius(node);

        const { nameFont } = this.getTreeLabelTypography(node, treeLabelScale, isHoveredFollowable);

        const words = node.name.split(' ');
        const lines = words.length > 4
          ? [words.slice(0, 4).join(' '), words.slice(4).join(' ')]
          : [node.name];
        const maxWidth = Math.max(...lines.map(line => this.measureTextCached(line, nameFont)));

        const horizontalGap = screenHighlightRadius + TREE_NODE_LABEL_EDGE_GAP;
        if (node.x < 0) {
          const nodeOuterEdge = screenPos.x - horizontalGap - maxWidth - 12;
          outerEdge = Math.min(outerEdge, nodeOuterEdge);
        } else if (node.x > 0) {
          const nodeOuterEdge = screenPos.x + horizontalGap + maxWidth + 12;
          outerEdge = Math.max(outerEdge, nodeOuterEdge);
        }
      });

      return outerEdge;
    };

    const drawableGroups = groups
      .map(group => {
        const { sphere, x } = group;

        if (sphere === 'loop') return null;
        if (this.activeFilter !== 'all' && !this.isFocusMode && sphere !== this.activeFilter) {
          return null;
        }

        const visibleNodePos = [];
        const nodeIds = group.nodeIds || [];
        nodeIds.forEach(id => {
          const node = this.nodeById.get(id);
          if (node && this.isNodeVisibleInCurrentView(node)) {
            visibleNodePos.push(this.worldToScreen(node.x, node.y));
          }
        });

        if (visibleNodePos.length === 0) return null;

        visibleNodePos.sort((a, b) => a.y - b.y);
        const screenMinY = visibleNodePos[0].y;
        const screenMaxY = visibleNodePos[visibleNodePos.length - 1].y;
        const defaultBracketScreenX = this.worldToScreen(isLeft ? x - 220 : x + 220, 0).x;
        const labelOuterScreenEdge = getTreeGroupOuterScreenEdge(group);
        const bracketMargin = 42;
        const requiredBracketScreenX = isLeft
          ? Math.min(defaultBracketScreenX, labelOuterScreenEdge - bracketMargin)
          : Math.max(defaultBracketScreenX, labelOuterScreenEdge + bracketMargin);

        return {
          group,
          screenMinY,
          screenMaxY,
          requiredBracketScreenX,
          visibleNodeCount: visibleNodePos.length
        };
      })
      .filter(Boolean);

    if (drawableGroups.length === 0) return;

    let alignedBracketScreenX = isLeft
      ? Math.min(...drawableGroups.map(entry => entry.requiredBracketScreenX))
      : Math.max(...drawableGroups.map(entry => entry.requiredBracketScreenX));

    if (this.exportBackgroundColor) {
      const tagFont = '800 15px "Inter Display", "InterDisplay", "Inter", sans-serif';
      const widestTag = Math.max(
        ...drawableGroups.map(({ group }) => this.measureTextCached(this.getTreeGroupDisplayName(group), tagFont))
      );
      const exportEdgeInset = widestTag + 46;
      alignedBracketScreenX = isLeft
        ? Math.max(alignedBracketScreenX, exportEdgeInset)
        : Math.min(alignedBracketScreenX, this.width - exportEdgeInset);
    }

    drawableGroups.forEach(({ group, screenMinY, screenMaxY, visibleNodeCount }) => {
      const { sphere } = group;
      const bracketScreenX = alignedBracketScreenX;
      
      const tickSize = 6;
      const tickDirection = isLeft ? 1 : -1;
      
      const isSingleNode = visibleNodeCount === 1;
      const bracketMinY = isSingleNode ? screenMinY - 26 : screenMinY - 6;
      const bracketMaxY = isSingleNode ? screenMaxY + 26 : screenMaxY + 6;

      ctx.save();
      ctx.strokeStyle = getSphereColor(sphere, this.exportBackgroundColor ? 0.72 : 0.45);
      ctx.lineWidth = 1.5;
      
      // Draw vertical bracket line in screen space
      ctx.beginPath();
      ctx.moveTo(bracketScreenX, bracketMinY);
      ctx.lineTo(bracketScreenX, bracketMaxY);
      
      // Draw end ticks in screen space
      ctx.moveTo(bracketScreenX, bracketMinY);
      ctx.lineTo(bracketScreenX + tickSize * tickDirection, bracketMinY);
      ctx.moveTo(bracketScreenX, bracketMaxY);
      ctx.lineTo(bracketScreenX + tickSize * tickDirection, bracketMaxY);
      ctx.stroke();
      ctx.restore();
      
      // Draw tag label in screen space
      ctx.save();
      
      const tagFontSize = 15;
      const tagOffset = 22;

      ctx.font = `800 ${tagFontSize}px "Inter Display", "InterDisplay", "Inter", sans-serif`;
      ctx.fillStyle = getSphereColor(sphere, this.exportBackgroundColor ? 0.96 : 0.7);
      ctx.textAlign = isLeft ? 'right' : 'left';
      ctx.textBaseline = 'middle';
      
      const labelScreenX = isLeft ? bracketScreenX - tagOffset : bracketScreenX + tagOffset;
      // Centered between screen Y limits of the visible nodes, plus minor adjustment for uppercase cap-height balance
      const labelScreenY = (screenMinY + screenMaxY) / 2 + 0.5;
      
      const sphereKey = sphere.toLowerCase();
      const displayName = (group.label || displayNames[sphereKey] || sphere).toUpperCase();
      ctx.fillText(displayName, labelScreenX, labelScreenY);
      ctx.restore();
    });
  }

  getNodeHit(node, pos) {
    const screenPos = this.worldToScreen(node.x, node.y);
    const screenRadius = node.radius * this.camera.zoom;
    const analyzeState = node.analyzeState || this.getAnalyzeNodeState(node);

    // Check 1: Click on the orb (screen space)
    const dx = pos.x - screenPos.x;
    const dy = pos.y - screenPos.y;
    const orbClickRad = this.isFocusMode && analyzeState === 'followable'
      ? Math.max(22, screenRadius * 2.35)
      : Math.max(15, screenRadius * 1.5);
    if (dx * dx + dy * dy < orbClickRad * orbClickRad) {
      return {
        type: 'orb',
        proximity: 1 - Math.min(1, Math.sqrt(dx * dx + dy * dy) / orbClickRad),
        centerX: screenPos.x,
        centerY: screenPos.y
      };
    }

    // Check 2: Click on the text label (only if label is visible/active)
    if (node.labelOpacity && node.labelOpacity > 0.05) {
      const style = node.labelStyle || 'focus';
      let nameFont = '';
      let yOffsetName = 18;
      let lineHeight = 15;
      const treeLabelScale = this.layoutMode === 'tree' && this.isFocusMode ? this.getTreeLabelScale() : 1;

      const hasFocus = this.selectedNode !== null || this.hoveredNode !== null;
      const activeSelectedId = this.selectedNode ? this.selectedNode.id : null;
      const activeHoveredId = this.hoveredNode ? this.hoveredNode.id : null;
      const isSelected = activeSelectedId && activeSelectedId === node.id;
      const isHovered = activeHoveredId && activeHoveredId === node.id;
      const isAmbientHighlight = !hasFocus && this.ambientHighlightSet.has(node.id);
      const isNeighbor =
        (activeSelectedId && this.adjacentIdsById.get(activeSelectedId)?.has(node.id)) ||
        (!this.isFocusMode && activeHoveredId && this.adjacentIdsById.get(activeHoveredId)?.has(node.id));
      const isHighlighted = isSelected || isHovered || isNeighbor || isAmbientHighlight;

      if (style === 'neighbor') {
        if (!this.isFocusMode && isHighlighted) {
          nameFont = '600 17.25px "Inter Display", "InterDisplay", "Inter", sans-serif';
          yOffsetName = 18;
        } else {
          nameFont = '400 15px "Inter Display", "InterDisplay", "Inter", sans-serif';
          yOffsetName = 16;
        }
        lineHeight = 21;
      } else if (style === 'ambient') {
        if (!this.isFocusMode && isHighlighted) {
          nameFont = '700 13.8px "Inter Display", "InterDisplay", "Inter", sans-serif';
          yOffsetName = 17;
        } else {
          nameFont = '500 12px "Inter Display", "InterDisplay", "Inter", sans-serif';
          yOffsetName = 18;
        }
        lineHeight = 18;
      } else {
        if (!this.isFocusMode && isHighlighted) {
          nameFont = '900 27.6px "Inter Display", "InterDisplay", "Inter", sans-serif';
          yOffsetName = 30;
        } else {
          nameFont = '800 24px "Inter Display", "InterDisplay", "Inter", sans-serif';
          yOffsetName = 26;
        }
        lineHeight = 28;
      }

      if (this.layoutMode === 'tree' && this.isFocusMode) {
        ({ nameFont, lineHeight } = this.getTreeLabelTypography(node, treeLabelScale));
        yOffsetName *= treeLabelScale;
      }

      const words = node.name.split(' ');
      const lineCount = words.length > 4 ? 2 : 1;
      const degFactor = node.degree && this.maxDegree ? (node.degree / this.maxDegree) : 0.2;
      const glowMultiplier = this.isFocusMode && analyzeState === 'followable'
        ? (1.8 + 2.4 * degFactor) * 1.25
        : (isHighlighted ? (1.8 + 2.4 * degFactor) : 1.0);
      const screenGlowRadius = screenRadius * glowMultiplier;
      const centerY = this.height / 2;
      const placeAbove = this.layoutMode !== 'tree' && screenPos.y < centerY;
      const glowSpacing = 12;

      const nameWidth = this.measureTextCached(node.name, nameFont);

      let textMinX;
      let textMaxX;
      let textMinY;
      let textMaxY;
      const totalHeight = lineHeight * lineCount;

      if (this.layoutMode === 'tree' && this.isFocusMode) {
        const horizontalGap = this.getTreeNodeScreenRadius(node) + TREE_NODE_LABEL_EDGE_GAP;
        let maxWidth = nameWidth;
        if (words.length > 4) {
          const lines = [words.slice(0, 4).join(' '), words.slice(4).join(' ')];
          maxWidth = Math.max(...lines.map(line => this.measureTextCached(line, nameFont)));
        }

        const startY = screenPos.y - ((lineCount - 1) * lineHeight) / 2;
        if (node.id === activeSelectedId) {
          textMinX = screenPos.x - maxWidth / 2 - 12;
          textMaxX = screenPos.x + maxWidth / 2 + 12;
        } else if (node.x < 0) {
          textMinX = screenPos.x - horizontalGap - maxWidth - 12;
          textMaxX = screenPos.x - horizontalGap + 8;
        } else {
          textMinX = screenPos.x + horizontalGap - 8;
          textMaxX = screenPos.x + horizontalGap + maxWidth + 12;
        }
        textMinY = startY - lineHeight;
        textMaxY = startY + totalHeight + 12;
      } else {
        textMinX = screenPos.x - nameWidth / 2 - 12;
        textMaxX = screenPos.x + nameWidth / 2 + 12;
        let startY = placeAbove
          ? (screenPos.y - screenGlowRadius - yOffsetName - glowSpacing)
          : (screenPos.y + screenGlowRadius + yOffsetName + glowSpacing);

        if (placeAbove && lineCount > 1) {
          startY -= (lineCount - 1) * lineHeight;
        }
        if (this.isFocusMode && Number.isFinite(node.renderedNetworkLabelStartY)) {
          startY = node.renderedNetworkLabelStartY;
        }
        textMinY = startY - lineHeight;
        textMaxY = startY + totalHeight + 12;
      }

      if (pos.x >= textMinX && pos.x <= textMaxX && pos.y >= textMinY && pos.y <= textMaxY) {
        const centerX = (textMinX + textMaxX) / 2;
        const centerY = (textMinY + textMaxY) / 2;
        const dxCenter = Math.abs(pos.x - centerX) / Math.max(1, (textMaxX - textMinX) / 2);
        const dyCenter = Math.abs(pos.y - centerY) / Math.max(1, (textMaxY - textMinY) / 2);
        return {
          type: 'label',
          proximity: 1 - Math.min(1, (dxCenter + dyCenter) / 2),
          centerX,
          centerY
        };
      }
    }

    return null;
  }

  isNodeVisibleInCurrentView(node) {
    if (!this.isFocusMode && node.z < 0) return false;
    if (!this.isFocusMode && this.activeFilter !== 'all' && node.sphere !== this.activeFilter) return false;

    if (this.layoutMode === 'tree' && this.isFocusMode && this.cachedTreeLayout) {
      const layoutPos = this.cachedTreeLayout.positions[node.id];
      if (!layoutPos) return false;

      const isHiddenTrigger = this.cachedTreeLayout.driverSet?.has(node.id) && this.showTriggers === false;
      const isHiddenEffect = this.cachedTreeLayout.impactSet?.has(node.id) && this.showEffects === false;
      if (isHiddenTrigger || isHiddenEffect) return false;
    }

    const opacityMultiplier = node.opacityMultiplier ?? 1.0;
    const visualOpacity = node.visualOpacity ?? 0.0;
    const labelOpacity = node.labelOpacity ?? 0.0;

    if (opacityMultiplier <= 0.02) return false;
    if (visualOpacity <= 0.02 && labelOpacity <= 0.05) return false;

    return true;
  }

  getAnalyzeNodeState(node) {
    if (!this.isFocusMode || !this.selectedNode) return 'browse';
    if (node.id === this.selectedNode.id) return 'active';

    const focusData = this.getAnalyzeFocusData(this.selectedNode);
    if (focusData?.highlightedIds?.has(node.id)) {
      return 'highlighted';
    }

    const isDirectTrigger = this.incomingIdsById.get(this.selectedNode.id)?.has(node.id);
    const isDirectEffect = this.outgoingIdsById.get(this.selectedNode.id)?.has(node.id);
    if (focusData?.displayAllConnections && (isDirectTrigger || isDirectEffect)) {
      return 'followable';
    }

    return 'context';
  }

  isNodeInteractiveInAnalyze(node) {
    const state = this.getAnalyzeNodeState(node);
    return state === 'highlighted' || state === 'followable';
  }

  findBestHitNode(pos) {
    const candidates = [];

    this.nodes.forEach(node => {
      if (!this.isNodeVisibleInCurrentView(node)) return;
      if (this.isFocusMode && !this.isNodeInteractiveInAnalyze(node)) return;

      const hit = this.getNodeHit(node, pos);
      if (!hit) return;

      const visualOpacity = node.visualOpacity ?? 0.0;
      const labelOpacity = node.labelOpacity ?? 0.0;
      const typePriority = hit.type === 'orb' ? 2 : 1;
      const depthScore = this.isFocusMode ? 0 : (node.z ?? 0) * 5;
      const score =
        typePriority * 100 +
        hit.proximity * 10 +
        depthScore +
        visualOpacity * 2 +
        labelOpacity;

      candidates.push({ node, score });
    });

    candidates.sort((a, b) => b.score - a.score);
    return candidates.length > 0 ? candidates[0].node : null;
  }

  getTreeZoomMetrics(focusData = null, treeLayout = null) {
    if (!this.isFocusMode || !this.selectedNode) return null;

    const resolvedFocusData = focusData || this.getAnalyzeFocusData(this.selectedNode);
    const activeIds = resolvedFocusData?.displayAllConnections
      ? (resolvedFocusData?.visibleIds || new Set([this.selectedNode.id]))
      : (resolvedFocusData?.highlightedIds || new Set([this.selectedNode.id]));
    const activeNodes = this.nodes.filter(node => activeIds.has(node.id));

    if (activeNodes.length === 0) return null;

    const resolvedTreeLayout = treeLayout || this.cachedTreeLayout || this.getTreeLayout(this.selectedNode);
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    activeNodes.forEach(node => {
      const pos = resolvedTreeLayout?.positions?.[node.id];
      const tx = pos ? pos.x : node.x;
      const ty = pos ? pos.y : node.y;

      if (tx < minX) minX = tx;
      if (tx > maxX) maxX = tx;
      if (ty < minY) minY = ty;
      if (ty > maxY) maxY = ty;
    });

    if (minX === Infinity || maxX === -Infinity) {
      minX = -this.sphereRadius;
      maxX = this.sphereRadius;
      minY = -this.sphereRadius;
      maxY = this.sphereRadius;
    }

    const isExpandedTree = this.layoutMode === 'tree' && this.isFocusMode && !!resolvedFocusData?.displayAllConnections;
    const horizontalPadding = isExpandedTree ? 84 : 72;
    const verticalPadding = isExpandedTree ? 92 : 80;
    const treeLabelScale = resolvedTreeLayout?.minTreeLabelScale || this.getTreeMinimumLabelScale();

    let contentMinX = minX;
    let contentMaxX = maxX;
    let contentMinY = minY;
    let contentMaxY = maxY;
    let fitZoom = Math.min(
      (this.width - horizontalPadding * 2) / Math.max(1, maxX - minX),
      (this.height - verticalPadding * 2) / Math.max(1, maxY - minY)
    );

    const expandBoundsForTreeChrome = zoom => {
      let expandedMinX = minX;
      let expandedMaxX = maxX;
      let expandedMinY = minY;
      let expandedMaxY = maxY;

      activeNodes.forEach(node => {
        const pos = resolvedTreeLayout?.positions?.[node.id];
        const tx = pos ? pos.x : node.x;
        const ty = pos ? pos.y : node.y;
        const labelBox = this.getTreeLabelBoxForLayout(node, tx, ty, {
          zoom,
          treeLabelScale,
          isSelected: node.id === this.selectedNode?.id
        });

        expandedMinX = Math.min(expandedMinX, labelBox.minX / zoom);
        expandedMaxX = Math.max(expandedMaxX, labelBox.maxX / zoom);
        expandedMinY = Math.min(expandedMinY, labelBox.minY / zoom);
        expandedMaxY = Math.max(expandedMaxY, labelBox.maxY / zoom);
      });

      const groupSpecs = [
        ...(resolvedTreeLayout?.driverGroups || []).map(group => ({ group, isLeft: true })),
        ...(resolvedTreeLayout?.impactGroups || []).map(group => ({ group, isLeft: false }))
      ];

      groupSpecs.forEach(({ group, isLeft }) => {
        const groupBounds = this.getTreeGroupScreenBoundsForLayout(
          group,
          isLeft,
          zoom,
          treeLabelScale,
          resolvedTreeLayout?.positions
        );
        if (!groupBounds) return;

        expandedMinX = Math.min(expandedMinX, groupBounds.minX / zoom);
        expandedMaxX = Math.max(expandedMaxX, groupBounds.maxX / zoom);
        expandedMinY = Math.min(expandedMinY, groupBounds.minY / zoom);
        expandedMaxY = Math.max(expandedMaxY, groupBounds.maxY / zoom);
      });

      return {
        minX: expandedMinX,
        maxX: expandedMaxX,
        minY: expandedMinY,
        maxY: expandedMaxY
      };
    };

    for (let i = 0; i < 3; i += 1) {
      const expandedBounds = expandBoundsForTreeChrome(Math.max(0.001, fitZoom));
      contentMinX = expandedBounds.minX;
      contentMaxX = expandedBounds.maxX;
      contentMinY = expandedBounds.minY;
      contentMaxY = expandedBounds.maxY;

      fitZoom = Math.min(
        (this.width - horizontalPadding * 2) / Math.max(1, contentMaxX - contentMinX),
        (this.height - verticalPadding * 2) / Math.max(1, contentMaxY - contentMinY)
      );
    }

    const boxWidth = contentMaxX - contentMinX;
    const boxHeight = contentMaxY - contentMinY;

    return {
      activeNodes,
      treeLayout: resolvedTreeLayout,
      isExpandedTree,
      minX: contentMinX,
      maxX: contentMaxX,
      minY: contentMinY,
      maxY: contentMaxY,
      boxWidth,
      boxHeight,
      fitZoom
    };
  }

  getTreeLabelScale() {
    if (!(this.layoutMode === 'tree' && this.isFocusMode && this.selectedNode)) return 1;
    return this.getTreeMinimumLabelScale();
  }

  scaleFontString(font, scale) {
    if (scale >= 0.999) return font;
    return font.replace(/(\d+(?:\.\d+)?)px/, (_, size) => `${(parseFloat(size) * scale).toFixed(2)}px`);
  }

  boostFontWeight(font, factor = 1) {
    if (factor <= 1) return font;
    return font.replace(/^(\d{3})(\s+)/, (_, weight, spacing) => {
      const boostedWeight = Math.min(900, Math.round(parseInt(weight, 10) * factor));
      return `${boostedWeight}${spacing}`;
    });
  }

  getRadialSphereZoom() {
    const horizontalLabelClearance = 170;
    const verticalLabelClearance = 180;
    const sphereDiameter = Math.max(1, this.sphereRadius * 2);
    const availableWidth = Math.max(1, this.width - horizontalLabelClearance * 2);
    const availableHeight = Math.max(1, this.height - verticalLabelClearance * 2);

    const centeredSphereZoom = Math.max(0.28, Math.min(
      this.defaultZoom,
      availableWidth / sphereDiameter,
      availableHeight / sphereDiameter
    ));

    return centeredSphereZoom * 1.15;
  }

  zoomToFit() {
    if (!this.isFocusMode || !this.selectedNode) return;

    if (this.layoutMode !== 'tree') {
      this.tweenCamera(this.width / 2, this.height / 2, this.getRadialSphereZoom());
      return;
    }

    const focusData = this.getAnalyzeFocusData(this.selectedNode);
    let treeLayout = this.getTreeLayout(this.selectedNode);
    this.cachedTreeLayout = treeLayout;
    const treeMetrics = this.getTreeZoomMetrics(focusData, treeLayout);
    if (!treeMetrics) return;

    treeLayout = treeMetrics.treeLayout;
    const minX = treeMetrics.minX;
    const maxX = treeMetrics.maxX;
    const minY = treeMetrics.minY;
    const maxY = treeMetrics.maxY;
    const targetZoom = Math.max(0.06, Math.min(0.9, treeMetrics.fitZoom));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const targetX = this.width / 2 - centerX * targetZoom;
    const targetY = this.height / 2 - centerY * targetZoom;

    this.tweenCamera(targetX, targetY, targetZoom);
  }

  updateCamera() {
    if (this.targetCamera) {
      const isAnalyzeTree = this.isFocusMode && this.layoutMode === 'tree';
      const isReturningFromAnalyzeTree = this.returningFromAnalyzeTree && !this.isFocusMode;
      const lerpFactor = isAnalyzeTree
        ? 0.16
        : (isReturningFromAnalyzeTree ? 0.18 : (this.isFocusMode ? 0.11 : 0.09));
      this.camera.x += (this.targetCamera.x - this.camera.x) * lerpFactor;
      this.camera.y += (this.targetCamera.y - this.camera.y) * lerpFactor;
      this.camera.zoom += (this.targetCamera.zoom - this.camera.zoom) * lerpFactor;

      const dx = this.targetCamera.x - this.camera.x;
      const dy = this.targetCamera.y - this.camera.y;
      const dz = this.targetCamera.zoom - this.camera.zoom;
      if (dx * dx + dy * dy < 0.01 && dz * dz < 0.0001) {
        this.camera.x = this.targetCamera.x;
        this.camera.y = this.targetCamera.y;
        this.camera.zoom = this.targetCamera.zoom;
        this.targetCamera = null;
      }
    }
  }

  screenToWorld(sx, sy) {
    return {
      x: (sx - this.camera.x) / this.camera.zoom,
      y: (sy - this.camera.y) / this.camera.zoom
    };
  }

  worldToScreen(wx, wy) {
    return {
      x: wx * this.camera.zoom + this.camera.x,
      y: wy * this.camera.zoom + this.camera.y
    };
  }

  isScreenPointNearViewport(point, padding = 120) {
    return point.x >= -padding
      && point.x <= this.width + padding
      && point.y >= -padding
      && point.y <= this.height + padding;
  }

  hasInteractiveRelationshipFocus() {
    return this.isFocusMode && Boolean(this.selectedNode);
  }

  getDirectInteractiveEdges() {
    if (!this.hasInteractiveRelationshipFocus()) return [];
    return this.getAnalyzeFocusData(this.selectedNode)?.interactiveEdges || [];
  }

  isDirectInteractiveEdge(edge) {
    if (!this.hasInteractiveRelationshipFocus()) return false;
    if ((edge.visualOpacity || 0) <= 0.12) return false;
    if (edge.source !== this.selectedNode.id && edge.target !== this.selectedNode.id) return false;
    const focusData = this.getAnalyzeFocusData(this.selectedNode);
    return !focusData || focusData.interactiveEdgeSet?.has(edge);
  }

  getInteractiveEdgePoints(edge) {
    if (!this.isDirectInteractiveEdge(edge)) return null;

    const source = edge.sourceNode;
    const target = edge.targetNode;
    if (!source || !target) return null;

    const sourcePos = this.worldToScreen(source.x, source.y);
    const targetPos = this.worldToScreen(target.x, target.y);

    if (this.layoutMode === 'tree' && this.isFocusMode) {
      const cp1 = {
        x: (source.x + (target.x - source.x) * 0.5) * this.camera.zoom + this.camera.x,
        y: source.y * this.camera.zoom + this.camera.y
      };
      const cp2 = {
        x: (source.x + (target.x - source.x) * 0.5) * this.camera.zoom + this.camera.x,
        y: target.y * this.camera.zoom + this.camera.y
      };
      return { sourcePos, targetPos, cp1, cp2, isCurve: true };
    }

    return { sourcePos, targetPos, isCurve: false };
  }

  distanceToSegment(point, start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSq = dx * dx + dy * dy;
    if (lengthSq === 0) return Math.hypot(point.x - start.x, point.y - start.y);
    const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSq));
    return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
  }

  sampleBezierPoint(t, p0, p1, p2, p3) {
    const oneMinusT = 1 - t;
    return {
      x: oneMinusT ** 3 * p0.x + 3 * oneMinusT ** 2 * t * p1.x + 3 * oneMinusT * t ** 2 * p2.x + t ** 3 * p3.x,
      y: oneMinusT ** 3 * p0.y + 3 * oneMinusT ** 2 * t * p1.y + 3 * oneMinusT * t ** 2 * p2.y + t ** 3 * p3.y
    };
  }

  distanceToBezier(point, p0, p1, p2, p3) {
    let minDistance = Infinity;
    let previous = p0;
    for (let index = 1; index <= 18; index += 1) {
      const current = this.sampleBezierPoint(index / 18, p0, p1, p2, p3);
      minDistance = Math.min(minDistance, this.distanceToSegment(point, previous, current));
      previous = current;
    }
    return minDistance;
  }

  findHitEdge(pos) {
    if (!this.hasInteractiveRelationshipFocus()) return null;
    let bestEdge = null;
    let bestDistance = Infinity;
    const threshold = this.layoutMode === 'tree' ? 20 : 18;

    this.getDirectInteractiveEdges().forEach(edge => {
      const points = this.getInteractiveEdgePoints(edge);
      if (!points) return;
      const distance = points.isCurve
        ? this.distanceToBezier(pos, points.sourcePos, points.cp1, points.cp2, points.targetPos)
        : this.distanceToSegment(pos, points.sourcePos, points.targetPos);
      if (distance <= threshold && distance < bestDistance) {
        bestEdge = edge;
        bestDistance = distance;
      }
    });

    return bestEdge;
  }

  setupEvents() {
    this.isMouseOverCanvas = false;
    this.mousePos = null;
    this.canvas.addEventListener('mouseenter', () => {
      this.isMouseOverCanvas = true;
    });
    this.canvas.addEventListener('mouseleave', () => {
      this.isMouseOverCanvas = false;
      this.hoveredNode = null;
      this.hoveredEdge = null;
      this.mousePos = null;
      this.emitHoverState(null, null);
      this.requestRender();
    });

    const getMousePos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleVal = document.documentElement.style.getPropertyValue('--ui-scale');
      const scale = scaleVal ? parseFloat(scaleVal) : 1;
      return {
        x: (e.clientX - rect.left) / scale,
        y: (e.clientY - rect.top) / scale
      };
    };

    this.canvas.addEventListener('mousedown', (e) => {
      this.requestRender();
      const pos = getMousePos(e);
      const clickedNode = this.findBestHitNode(pos);
      const clickedEdge = !clickedNode ? this.findHitEdge(pos) : null;
      this.backgroundPress = null;
      this.suppressBackgroundClick = false;

      this.targetCamera = null;

      if (clickedNode) {
        this.isFocusMode = true;
        this.needsCentering = true;
        this.selectNode(clickedNode, { instantSwap: true });
        this.hoveredNode = null;
        this.onSelectNode(clickedNode, {
          motionOrigin: { x: e.clientX, y: e.clientY }
        });
        
        // Restore the centered radial sphere frame or fit the active tree.
        this.zoomToFit();
        return;
      }

      if (clickedEdge) {
        this.selectedEdge = clickedEdge;
        this.hoveredEdge = clickedEdge;
        this.onSelectEdge?.(clickedEdge);
        return;
      }

      this.backgroundPress = {
        x: e.clientX,
        y: e.clientY,
        moved: false,
        hadSelectedEdge: Boolean(this.selectedEdge)
      };

      if (this.layoutMode === 'tree' && this.isFocusMode) {
        this.isPanningCamera = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
        this.cameraStart = { x: this.camera.x, y: this.camera.y };
      } else {
        this.isDraggingGlobe = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
        this.rotationStart = { x: this.rotationX, y: this.rotationY };
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this.requestRender();
      const pos = getMousePos(e);
      this.mousePos = pos;

      if (this.backgroundPress && !this.backgroundPress.moved) {
        const dx = e.clientX - this.backgroundPress.x;
        const dy = e.clientY - this.backgroundPress.y;
        this.backgroundPress.moved = Math.hypot(dx, dy) > 5;
      }

      const scaleVal = document.documentElement.style.getPropertyValue('--ui-scale');
      const scale = scaleVal ? parseFloat(scaleVal) : 1;

      if (this.isPanningCamera) {
        const dx = (e.clientX - this.dragStart.x) / scale;
        const dy = (e.clientY - this.dragStart.y) / scale;
        this.camera.x = this.cameraStart.x + dx;
        this.camera.y = this.cameraStart.y + dy;
        if (this.targetCamera) this.targetCamera = null;
        return;
      }

      if (this.isDraggingGlobe) {
        this.needsCentering = false; // user interaction overrides auto-centering
        const dx = (e.clientX - this.dragStart.x) / scale;
        const dy = (e.clientY - this.dragStart.y) / scale;
        const zoomFactor = Math.max(0.1, this.camera.zoom);
        this.rotationY = this.rotationStart.y + (dx * 0.005) / zoomFactor;
        this.rotationX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.rotationStart.x - (dy * 0.005) / zoomFactor));
        return;
      }

      // In Focus/Analyze Mode, any node on the front hemisphere is hoverable
      if (this.isFocusMode) {
        const foundHoverNode = this.findBestHitNode(pos);
        const foundHoverEdge = foundHoverNode ? null : this.findHitEdge(pos);
        this.hoveredNode = foundHoverNode;
        this.hoveredEdge = foundHoverEdge;
        this.emitHoverState(null, pos);
        this.canvas.style.cursor = (foundHoverNode || foundHoverEdge) ? 'pointer' : (this.isDraggingGlobe ? 'grabbing' : 'grab');
        return;
      }

      // Hover Check (front hemisphere only)
      const foundHover = this.findBestHitNode(pos);

      if (foundHover) {
        this.hoveredNode = foundHover;
      } else {
        this.hoveredNode = null;
      }

      this.emitHoverState(this.hoveredNode, pos);

      this.canvas.style.cursor = foundHover ? 'pointer' : (this.isDraggingGlobe ? 'grabbing' : 'grab');
    });

    const endDrag = (event = null) => {
      const releasedOnCanvas = event?.currentTarget === this.canvas;
      if (releasedOnCanvas && this.backgroundPress) {
        this.suppressBackgroundClick = this.backgroundPress.moved;
      }
      const shouldClearSelectedEdge = Boolean(
        event?.type === 'mouseup'
        && releasedOnCanvas
        && this.backgroundPress?.hadSelectedEdge
        && !this.backgroundPress.moved
      );
      this.isDraggingGlobe = false;
      this.isPanningCamera = false;
      this.backgroundPress = null;
      if (shouldClearSelectedEdge) {
        this.hoveredEdge = null;
        this.onSelectEdge?.(null);
      }
      this.requestRender();
    };

    this.canvas.addEventListener('mouseup', endDrag);
    window.addEventListener('mouseup', endDrag);
    this.canvas.addEventListener('mouseleave', () => endDrag());

    this.canvas.addEventListener('click', (event) => {
      if (this.suppressBackgroundClick) {
        this.suppressBackgroundClick = false;
        return;
      }
      if (!this.selectedEdge) return;

      const pos = getMousePos(event);
      const clickedNode = this.findBestHitNode(pos);
      const clickedEdge = !clickedNode ? this.findHitEdge(pos) : null;
      if (clickedNode || clickedEdge) return;

      this.hoveredEdge = null;
      this.onSelectEdge?.(null);
      this.requestRender();
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.targetCamera = null; // Interrupt camera tween
      
      const rect = this.canvas.getBoundingClientRect();
      const scaleVal = document.documentElement.style.getPropertyValue('--ui-scale');
      const scale = scaleVal ? parseFloat(scaleVal) : 1;
      const mouseX = (e.clientX - rect.left) / scale;
      const mouseY = (e.clientY - rect.top) / scale;
      
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.925;
      const focusData = this.isFocusMode && this.selectedNode
        ? this.getAnalyzeFocusData(this.selectedNode)
        : null;
      const treeMetrics = (this.layoutMode === 'tree' && this.isFocusMode && this.selectedNode)
        ? this.getTreeZoomMetrics(focusData)
        : null;
      const radialMinimumZoom = this.getRadialSphereZoom() * 0.75;
      const minManualZoom = this.isFocusMode && this.selectedNode
        ? (this.layoutMode === 'tree'
          ? Math.max(0.06, Math.min(0.9, treeMetrics?.fitZoom || this.camera.zoom))
          : radialMinimumZoom)
        : 0.3;
      const newZoom = Math.max(minManualZoom, Math.min(3.0, this.camera.zoom * zoomFactor));

      if (this.layoutMode === 'tree' && this.isFocusMode) {
        // Zoom relative to cursor position in tree mode (Figma/D3 style)
        const worldPos = this.screenToWorld(mouseX, mouseY);
        this.camera.zoom = newZoom;
        this.camera.x = mouseX - worldPos.x * newZoom;
        this.camera.y = mouseY - worldPos.y * newZoom;
      } else {
        // Radial zoom always uses the virtual sphere origin as its anchor.
        this.needsCentering = false;
        this.camera.zoom = newZoom;
        this.camera.x = this.width / 2;
        this.camera.y = this.height / 2;
      }
      this.requestRender();
    }, { passive: false });
  }

  updatePhysics() {
    const instantFocusSwap = this.pendingFocusSwap === true;
    this.instantFocusSwapFrame = instantFocusSwap;
    this.cachedAnalyzeFocusData = this.isFocusMode && this.selectedNode
      ? this.getAnalyzeFocusData(this.selectedNode)
      : null;
    this.syncAnalyzeRevealState(this.cachedAnalyzeFocusData);

    // 0. Compute Tree Layout coordinates once per frame if in tree mode
    if (this.layoutMode === 'tree' && this.isFocusMode && this.selectedNode) {
      this.cachedTreeLayout = this.getTreeLayout(this.selectedNode);
    } else {
      this.cachedTreeLayout = null;
      this.cachedTreeLayoutKey = null;
    }

    // 1. Handle auto-rotation when idle (disabled in focus mode)
    if (
      !this.isFocusMode &&
      !this.selectedNode &&
      !this.hoveredNode &&
      !this.isDraggingGlobe &&
      Date.now() >= this.autoRotatePausedUntil
    ) {
      const hasReturnMomentum = (
        this.returningFromAnalyzeTree ||
        performance.now() < this.sphereReturnMomentumUntil
      );
      let speedMultiplier = 1.35;
      if (this.isMouseOverCanvas && this.mousePos) {
        speedMultiplier = 1.12;
        const dx = this.mousePos.x - this.width / 2;
        const dy = this.mousePos.y - this.height / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.sphereRadius * 0.8) {
          speedMultiplier = hasReturnMomentum ? 0.9 : 0.45;
        }
      }
      // Begin rotating while the tree is still collapsing so the sphere feels
      // alive immediately instead of waiting for the final layout tail.
      const rawTransitionFactor = 1.0 - (this.layoutTransition || 0);
      const transitionFactor = hasReturnMomentum
        ? Math.max(0.58, rawTransitionFactor)
        : rawTransitionFactor;
      this.rotationY += 0.00155 * speedMultiplier * transitionFactor;
      this.axisTiltPhase = (this.axisTiltPhase || 0) + 0.001 * speedMultiplier * transitionFactor;
    }

    // 2. Smoothly rotate the globe to center the focused node at the front
    const centeringNode = this.isFocusMode ? this.selectedNode : (this.hoveredNode || this.selectedNode);
    if (this.needsCentering && centeringNode && !this.isDraggingGlobe) {
      const node = centeringNode;
      const dist = Math.sqrt(node.sphereX * node.sphereX + node.sphereZ * node.sphereZ);
      const targetRotY = -Math.atan2(-node.sphereX, node.sphereZ);
      const targetRotX = Math.atan2(node.sphereY, dist);
      const deltaRotY = Math.atan2(
        Math.sin(targetRotY - this.rotationY),
        Math.cos(targetRotY - this.rotationY)
      );

      // Lerp rotation smoothly
      const rotLerpFactor = this.isFocusMode ? 0.075 : 0.067;
      this.rotationX += (targetRotX - this.rotationX) * rotLerpFactor;
      this.rotationY += deltaRotY * rotLerpFactor;

      // Also dynamically adjust camera framing during centering in network mode
      if (this.layoutMode === 'network') {
        this.zoomToFit();
      }

      // Stop centering once close enough
      const centeringThreshold = this.isFocusMode ? 0.05 : 0.01;
      if (Math.abs(targetRotX - this.rotationX) < centeringThreshold && Math.abs(targetRotY - this.rotationY) < centeringThreshold) {
        this.needsCentering = false;
      }
    }

    // Clamp X rotation to prevent flipping upside down
    this.rotationX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.rotationX));

    // Update layout transition factor (0.0 = globe, 1.0 = tree)
    const targetTransition = (this.layoutMode === 'tree' && this.isFocusMode && this.selectedNode) ? 1.0 : 0.0;
    if (this.layoutTransition === undefined) this.layoutTransition = targetTransition;
    const isEnteringAnalyzeTree = targetTransition === 1.0;
    const isReturningFromAnalyzeTree = this.returningFromAnalyzeTree && targetTransition === 0.0;
    const transitionLerp = isEnteringAnalyzeTree ? 0.18 : (isReturningFromAnalyzeTree ? 0.16 : 0.1);
    this.layoutTransition += (targetTransition - this.layoutTransition) * transitionLerp;
    if (isReturningFromAnalyzeTree && this.layoutTransition < 0.012) {
      this.returningFromAnalyzeTree = false;
      this.sphereReturnMomentumUntil = Math.max(
        this.sphereReturnMomentumUntil,
        performance.now() + 360
      );
    }

    // 3. Project 3D sphere coordinates to 2D
    const cosX = Math.cos(this.rotationX);
    const sinX = Math.sin(this.rotationX);
    const cosY = Math.cos(this.rotationY);
    const sinY = Math.sin(this.rotationY);

    const hasFocus = this.selectedNode !== null || this.hoveredNode !== null;
    const activeSelectedId = this.selectedNode ? this.selectedNode.id : null;
    const activeHoveredId = this.hoveredNode ? this.hoveredNode.id : null;
    const selectedIncoming = activeSelectedId ? (this.incomingIdsById.get(activeSelectedId) || new Set()) : null;
    const selectedOutgoing = activeSelectedId ? (this.outgoingIdsById.get(activeSelectedId) || new Set()) : null;
    const hoveredIncoming = !this.isFocusMode && activeHoveredId ? (this.incomingIdsById.get(activeHoveredId) || new Set()) : null;
    const hoveredOutgoing = !this.isFocusMode && activeHoveredId ? (this.outgoingIdsById.get(activeHoveredId) || new Set()) : null;

    // Calculate dynamic tilt angles to wobble/precess the rotation axis
    const tiltPhase = this.axisTiltPhase || 0;
    const tiltZ = 0.35 + 0.2 * Math.sin(tiltPhase) + 0.05 * Math.sin(tiltPhase * 0.47); // Z-axis tilt with gentle precession
    const tiltX = 0.18 * Math.cos(tiltPhase * 0.83) + 0.05 * Math.sin(tiltPhase * 1.31); // X-axis wobble to expose new screen regions
    const cosTZ = Math.cos(tiltZ);
    const sinTZ = Math.sin(tiltZ);
    const cosTX = Math.cos(tiltX);
    const sinTX = Math.sin(tiltX);
    const frameNow = performance.now();

    this.nodes.forEach(node => {
      // 1. Rotate Y (sphere's self-spin around its poles)
      const sx = node.sphereX * cosY - node.sphereZ * sinY;
      const sy = node.sphereY;
      const sz = node.sphereX * sinY + node.sphereZ * cosY;

      // 2. Apply dynamic tilt Z-axis
      const tx = sx * cosTZ - sy * sinTZ;
      const ty = sx * sinTZ + sy * cosTZ;
      const tz = sz;

      // 3. Apply dynamic tilt X-axis
      const ux = tx;
      const uy = ty * cosTX - tz * sinTX;
      const uz = ty * sinTX + tz * cosTX;

      // 4. Rotate X (viewer's pitch/angle looking at the sphere)
      const rx = ux;
      const ry = uy * cosX - uz * sinX;
      const rz = uy * sinX + uz * cosX;

      // Center of globe is at (0, 0) in world space
      const netX = rx * this.sphereRadius;
      const netY = ry * this.sphereRadius;
      const netZ = rz;

      let treeX, treeY, treeZ, targetOpacityMultiplier;

      const layout = this.cachedTreeLayout;
      if (layout && layout.positions[node.id]) {
        const pos = layout.positions[node.id];
        treeX = pos.x;
        treeY = pos.y;
        treeZ = pos.z;
        
        let opacityMultiplier = pos.opacityMultiplier;
        if (layout.driverSet?.has(node.id) && this.showTriggers === false) {
          opacityMultiplier = 0.0;
        }
        if (layout.impactSet?.has(node.id) && this.showEffects === false) {
          opacityMultiplier = 0.0;
        }
        targetOpacityMultiplier = opacityMultiplier;
      } else {
        // If not present in tree layout, fade out or snap to its globe position
        treeX = netX;
        treeY = netY;
        treeZ = -2.0;
        targetOpacityMultiplier = (this.layoutMode === 'tree' && this.isFocusMode) ? 0.0 : 1.0;
      }

      // Calculate final target positions as a blend between globe (netX/Y/Z) and tree (treeX/Y/Z)
      let targetX = netX + (treeX - netX) * this.layoutTransition;
      let targetY = netY + (treeY - netY) * this.layoutTransition;
      let targetZ = netZ + (treeZ - netZ) * this.layoutTransition;

      if (this.layoutMode === 'tree' && this.isFocusMode && targetOpacityMultiplier === 0.0) {
        // Keep the discarded node in its current visual position while fading out, instead of shooting back to the globe
        targetX = node.x !== undefined ? node.x : netX;
        targetY = node.y !== undefined ? node.y : netY;
        targetZ = node.z !== undefined ? node.z : -2.0;
      }

      const revealState = this.analyzeRevealState.get(node.id);
      if (revealState) {
        const rawProgress = this.clamp01((frameNow - revealState.startTime) / revealState.duration);
        const easedProgress = 1 - Math.pow(1 - rawProgress, 3);
        targetX = revealState.origin.x + (targetX - revealState.origin.x) * easedProgress;
        targetY = revealState.origin.y + (targetY - revealState.origin.y) * easedProgress;
        targetZ = revealState.origin.z + (targetZ - revealState.origin.z) * easedProgress;
        targetOpacityMultiplier *= Math.max(0.08, easedProgress);

        if (rawProgress >= 1) {
          this.analyzeRevealState.delete(node.id);
        }
      }

      // Initialize position/opacityMultiplier if not defined or zero to prevent snapping
      if (node.x === undefined || node.x === 0) node.x = targetX;
      if (node.y === undefined || node.y === 0) node.y = targetY;
      if (node.z === undefined || node.z === 0) node.z = targetZ;
      if (node.opacityMultiplier === undefined) node.opacityMultiplier = 1.0;

      // When fully in network mode (transition is 0) or tree mode (transition is 1), 
      // set positions instantly to prevent flattening or lagging.
      if (this.layoutTransition < 0.001) {
        node.x = targetX;
        node.y = targetY;
        node.z = targetZ;
        node.opacityMultiplier = targetOpacityMultiplier;
      } else if (this.layoutTransition > 0.999) {
        node.x = targetX;
        node.y = targetY;
        node.z = targetZ;
        node.opacityMultiplier = targetOpacityMultiplier;
      } else {
        // Otherwise, smoothly LERP during transition states
        const lerpSpeed = isEnteringAnalyzeTree ? 0.18 : (isReturningFromAnalyzeTree ? 0.2 : 0.1);
        node.x += (targetX - node.x) * lerpSpeed;
        node.y += (targetY - node.y) * lerpSpeed;
        node.z += (targetZ - node.z) * lerpSpeed;
        node.opacityMultiplier += (targetOpacityMultiplier - node.opacityMultiplier) * lerpSpeed;
      }

      // Update label opacity and style dynamically
      const isSelected = activeSelectedId && activeSelectedId === node.id;
      const isHovered = activeHoveredId && activeHoveredId === node.id;
      const isAmbientHighlight = !hasFocus && this.ambientHighlightSet.has(node.id);
      const analyzeState = this.getAnalyzeNodeState(node);
      node.analyzeState = analyzeState;
      
      const isSelectedNeighborTrigger = activeSelectedId && selectedIncoming?.has(node.id);
      const isSelectedNeighborEffect = activeSelectedId && selectedOutgoing?.has(node.id);

      const isHoveredNeighborTrigger = !this.isFocusMode && activeHoveredId && hoveredIncoming?.has(node.id);
      const isHoveredNeighborEffect = !this.isFocusMode && activeHoveredId && hoveredOutgoing?.has(node.id);

      const isNeighborTrigger = (isSelectedNeighborTrigger && this.showTriggers !== false) || 
                               (isHoveredNeighborTrigger && this.showTriggers !== false);
      const isNeighborEffect = (isSelectedNeighborEffect && this.showEffects !== false) || 
                              (isHoveredNeighborEffect && this.showEffects !== false);

      const isNeighbor = isNeighborTrigger || isNeighborEffect;
      const isFilteredOut = !this.isFocusMode && this.activeFilter !== 'all' && node.sphere !== this.activeFilter;
      const isAnalyzeHighlighted = this.isFocusMode && analyzeState === 'highlighted';
      const isSelectedRelationshipEndpoint = Boolean(
        this.isFocusMode &&
        this.selectedEdge &&
        (node.id === this.selectedEdge.source || node.id === this.selectedEdge.target)
      );

      const shouldShowLabel = this.isFocusMode
        ? (isSelected || isHovered || isAnalyzeHighlighted || isSelectedRelationshipEndpoint)
        : (isSelected || isHovered || isAmbientHighlight || isNeighbor) && (isNeighbor || node.z >= -0.2) && !isFilteredOut;
      let targetLabelOpacity = shouldShowLabel ? 1.0 : 0.0;
      if (node.opacityMultiplier !== undefined) {
        targetLabelOpacity *= node.opacityMultiplier;
      }
      if (this.isFocusMode && analyzeState === 'context' && !isSelectedRelationshipEndpoint) {
        targetLabelOpacity = 0.0;
      }

      if (node.labelOpacity === undefined) node.labelOpacity = 0.0;
      const isRetiringAmbientLabel =
        !this.isFocusMode &&
        !shouldShowLabel &&
        node.labelStyle === 'ambient';
      if (instantFocusSwap) {
        node.labelOpacity = targetLabelOpacity;
      } else {
        const labelLerpSpeed = targetLabelOpacity > node.labelOpacity
          ? (this.isFocusMode ? 0.16 : 0.04)
          : (isRetiringAmbientLabel ? 0.2 : 0.06);
        node.labelOpacity += (targetLabelOpacity - node.labelOpacity) * labelLerpSpeed;
      }

      if (shouldShowLabel) {
        if (isNeighbor) node.labelStyle = 'neighbor';
        else if (isAmbientHighlight) node.labelStyle = 'ambient';
        else node.labelStyle = 'focus';
      }
    });

    // 4. Update ambient highlights when idle
    if (!hasFocus) {
      this.ambientHighlightCooldown = (this.ambientHighlightCooldown || 0) - 1;
      if (this.ambientHighlightCooldown <= 0) {
        this.ambientHighlightCooldown = 15; // Run every 15 frames (~250ms)
        this.ambientCyclesUntilNextAddition = Math.max(0, (this.ambientCyclesUntilNextAddition || 0) - 1);

        const targetHighlightCount = 8;
        const highlightEnterZThreshold = 0.14;
        const highlightExitZThreshold = -0.16;
        this.ambientHighlightAges = this.ambientHighlightAges || new Map();
        this.recentAmbientRetirements = (this.recentAmbientRetirements || [])
          .map(entry => ({ ...entry, cyclesRemaining: entry.cyclesRemaining - 1 }))
          .filter(entry => entry.cyclesRemaining > 0);
        const previousAmbientCount = this.ambientHighlights.length;
        const previousAmbientIds = new Set(this.ambientHighlights);

        // 1. Keep currently highlighted nodes latched until they are meaningfully past the front rim.
        let activeHighlights = this.ambientHighlights
          .map(id => this.nodeById.get(id))
          .filter(node => {
            if (!node) return false;
            if (this.activeFilter !== 'all' && node.sphere !== this.activeFilter) return false;
            if (node.name.startsWith('North Atlantic') && !node.isNorthAtlanticHighlightEligible) return false;
            return node.z >= highlightExitZThreshold;
          });
        const retainedAmbientIds = new Set(activeHighlights.map(node => node.id));
        previousAmbientIds.forEach(id => {
          if (!retainedAmbientIds.has(id)) {
            const retiredNode = this.nodeById.get(id);
            if (retiredNode) {
              this.recentAmbientRetirements.push({
                id,
                sphereX: retiredNode.sphereX,
                sphereY: retiredNode.sphereY,
                sphereZ: retiredNode.sphereZ,
                cyclesRemaining: 18
              });
            }
          }
        });
        let removedHighlightThisCycle = activeHighlights.length < previousAmbientCount;

        // 2. Increment ages of active highlights
        activeHighlights.forEach(node => {
          const currentAge = this.ambientHighlightAges.get(node.id) || 0;
          this.ambientHighlightAges.set(node.id, currentAge + 1);
        });

        // 3. Find candidates that are sufficiently front-facing to earn a fresh highlight.
        const eligiblePool = this.nodes.filter(node => {
          if (this.activeFilter !== 'all' && node.sphere !== this.activeFilter) return false;
          if (node.name.startsWith('North Atlantic') && !node.isNorthAtlanticHighlightEligible) return false;
          if (retainedAmbientIds.has(node.id)) return false;
          return node.z >= highlightEnterZThreshold;
        });

        // 4. Rolling retirement: If we are at capacity, retire at most ONE oldest highlight that has been active for a while
        this.ambientCyclesSinceLastRetirement = (this.ambientCyclesSinceLastRetirement || 0) + 1;
        if (activeHighlights.length >= targetHighlightCount && eligiblePool.length > 0) {
          let oldestNode = null;
          let maxAge = -1;
          for (const node of activeHighlights) {
            const age = this.ambientHighlightAges.get(node.id) || 0;
            if (age > maxAge) {
              maxAge = age;
              oldestNode = node;
            }
          }
          // Retire only if:
          // - The oldest node has been active for at least 32 cycles (~8 seconds)
          // - AND we haven't retired any node voluntarily in the last 20 cycles (~5 seconds)
          if (oldestNode && maxAge >= 32 && this.ambientCyclesSinceLastRetirement >= 20) {
            activeHighlights = activeHighlights.filter(n => n.id !== oldestNode.id);
            this.ambientHighlightAges.delete(oldestNode.id);
            this.ambientCyclesSinceLastRetirement = 0; // Reset global retirement timer
            this.recentAmbientRetirements.push({
              id: oldestNode.id,
              sphereX: oldestNode.sphereX,
              sphereY: oldestNode.sphereY,
              sphereZ: oldestNode.sphereZ,
              cyclesRemaining: 18
            });
            removedHighlightThisCycle = true;
          }
        }

        if (removedHighlightThisCycle) {
          this.ambientCyclesUntilNextAddition = Math.max(this.ambientCyclesUntilNextAddition || 0, 4);
        }

        const desiredHighlightCount = Math.min(targetHighlightCount, activeHighlights.length + eligiblePool.length);
        const getNodeAmbientPriorityScore = node => node.tulipScore ?? node.score?.baseline ?? 0;
        const additionsAllowedThisCycle =
          activeHighlights.length === 0
            ? desiredHighlightCount
            : (this.ambientCyclesUntilNextAddition > 0
              ? 0
              : Math.max(0, Math.min(1, desiredHighlightCount - activeHighlights.length)));
        let additionsThisCycle = 0;

        // 5. Fill vacancies using Weighted Farthest Point Sampling, but only roll in one newcomer at a time.
        while (activeHighlights.length < desiredHighlightCount && additionsThisCycle < additionsAllowedThisCycle) {
          let bestCandidate = null;
          let bestScore = -Infinity;

          for (const node of eligiblePool) {
            if (activeHighlights.some(h => h.id === node.id)) continue;

            // Calculate minimum 3D distance to all already selected highlights
            let minDist = Infinity;
            for (const selected of activeHighlights) {
              const dx = node.sphereX - selected.sphereX;
              const dy = node.sphereY - selected.sphereY;
              const dz = node.sphereZ - selected.sphereZ;
              const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);
              if (dist3D < minDist) {
                minDist = dist3D;
              }
            }

            // Spatial distance weight (exponential decay penalty for close neighbors)
            const distWeight = minDist === Infinity ? 1.0 : (1.0 - Math.exp(-minDist / 0.55));

            let recentRetirementMinDist = Infinity;
            for (const retired of this.recentAmbientRetirements) {
              const dx = node.sphereX - retired.sphereX;
              const dy = node.sphereY - retired.sphereY;
              const dz = node.sphereZ - retired.sphereZ;
              const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);
              if (dist3D < recentRetirementMinDist) {
                recentRetirementMinDist = dist3D;
              }
            }
            if (recentRetirementMinDist < 0.78) continue;
            const retirementDistanceWeight =
              recentRetirementMinDist === Infinity
                ? 1.0
                : Math.min(1.35, 0.85 + recentRetirementMinDist * 0.45);

            // Category diversity weight (penalize categories that are already represented)
            const categoryCount = activeHighlights.reduce((count, selected) => count + (selected.sphere === node.sphere ? 1 : 0), 0);
            const categoryWeight = 1.0 / (categoryCount + 1);

            // Screen space front bias
            const frontBias = 0.5 + 0.5 * (node.z ?? 0);

            // Discovery bonus
            const discoveryBonus = 1.0 + (node.discovery?.score || 0) / 300.0;

            // Base priority score
            const basePriority = Math.max(0.1, getNodeAmbientPriorityScore(node));

            const candidateScore = basePriority * distWeight * retirementDistanceWeight * categoryWeight * frontBias * discoveryBonus;

            if (candidateScore > bestScore) {
              bestScore = candidateScore;
              bestCandidate = node;
            }
          }

          if (bestCandidate) {
            activeHighlights.push(bestCandidate);
            this.ambientHighlightAges.set(bestCandidate.id, 0); // New highlight starts at age 0
            additionsThisCycle += 1;
            this.ambientCyclesUntilNextAddition = 4;
          } else {
            break;
          }
        }

        this.ambientHighlights = activeHighlights.map(node => node.id);
        this.ambientHighlightSet = new Set(this.ambientHighlights);

        // Clean up unused ages to prevent leaks
        for (const key of this.ambientHighlightAges.keys()) {
          if (!this.ambientHighlightSet.has(key)) {
            this.ambientHighlightAges.delete(key);
          }
        }
      }
    } else {
      this.ambientHighlights = [];
      this.ambientHighlightSet.clear();
      if (this.ambientHighlightAges) this.ambientHighlightAges.clear();
      this.ambientHighlightCooldown = 0;
      this.ambientCyclesUntilNextAddition = 0;
    }

    // 5. Update edge visual opacities for smooth transition
    this.edges.forEach(edge => {
      let targetOpacity = 0.22;
      let forceImmediateEdgeOpacity = false;
      
      const source = edge.sourceNode;
      const target = edge.targetNode;
      const sourceFiltered = source && !this.isFocusMode && this.activeFilter !== 'all' && source.sphere !== this.activeFilter;
      const targetFiltered = target && !this.isFocusMode && this.activeFilter !== 'all' && target.sphere !== this.activeFilter;

      if (sourceFiltered || targetFiltered) {
        // Filters spotlight one sphere without erasing the system around it.
        // Cross-sphere connections remain slightly stronger than fully
        // contextual connections so the selected category retains its place
        // in the broader network.
        const touchesActiveSphere =
          source?.sphere === this.activeFilter ||
          target?.sphere === this.activeFilter;
        targetOpacity = touchesActiveSphere ? 0.11 : 0.04;
      } else if (this.isFocusMode && this.cachedAnalyzeFocusData && activeSelectedId) {
        const edgeKey = edge.edgeKey;
        const sourceVisible = this.cachedAnalyzeFocusData.visibleIds.has(edge.source);
        const targetVisible = this.cachedAnalyzeFocusData.visibleIds.has(edge.target);
        if (!sourceVisible || !targetVisible) {
          targetOpacity = 0.0;
          forceImmediateEdgeOpacity = true;
        } else if (this.cachedAnalyzeFocusData.emphasizedEdgeKeys.has(edgeKey)) {
          targetOpacity = 1.0;
        } else {
          targetOpacity = 0.0;
          forceImmediateEdgeOpacity = true;
        }
      } else if (activeSelectedId || activeHoveredId) {
        const isSelectedTrigger = activeSelectedId && edge.target === activeSelectedId;
        const isSelectedEffect = activeSelectedId && edge.source === activeSelectedId;
        const isHoveredTrigger = !this.isFocusMode && activeHoveredId && edge.target === activeHoveredId;
        const isHoveredEffect = !this.isFocusMode && activeHoveredId && edge.source === activeHoveredId;

        const isTrigger = isSelectedTrigger || isHoveredTrigger;
        const isEffect = isSelectedEffect || isHoveredEffect;

        const showAsTrigger = isTrigger && this.showTriggers !== false;
        const showAsEffect = isEffect && this.showEffects !== false;

        targetOpacity = (showAsTrigger || showAsEffect) ? 1.0 : 0.0;
      }
      if (edge.visualOpacity === undefined) edge.visualOpacity = 0.0;
      if (instantFocusSwap || forceImmediateEdgeOpacity) {
        edge.visualOpacity = targetOpacity;
      } else {
        edge.visualOpacity += (targetOpacity - edge.visualOpacity) * (this.isFocusMode ? 0.14 : 0.033);
      }
    });

    if (instantFocusSwap) {
      this.pendingFocusSwap = false;
    }
  }

  requestRender() {
    this.settledFrameCount = 0;
    if (!this.isRunning || document.hidden || this.animationFrameId !== null) return;
    this.animationFrameId = requestAnimationFrame(timestamp => this.animate(timestamp));
  }

  animate(timestamp = performance.now()) {
    this.animationFrameId = null;
    if (!this.isRunning) return;

    const isIdleBrowse = !this.isFocusMode
      && !this.selectedNode
      && !this.hoveredNode
      && !this.isDraggingGlobe
      && !this.isPanningCamera;
    const minimumFrameDuration = isIdleBrowse ? 32 : 16;
    if (timestamp - this.lastRenderedAt < minimumFrameDuration) {
      this.animationFrameId = requestAnimationFrame(nextTimestamp => this.animate(nextTimestamp));
      return;
    }
    this.lastRenderedAt = timestamp;

    this.updatePhysics();
    this.updateCamera();
    this.draw();

    if (this.edgeIgnitionStartedAt && timestamp - this.edgeIgnitionStartedAt > 1120) {
      this.edgeIgnitionStartedAt = 0;
      this.edgeIgnitionNodeId = null;
    }
    if (this.filterWakeStartedAt && timestamp - this.filterWakeStartedAt > this.filterWakeDuration) {
      this.filterWakeStartedAt = 0;
    }

    const targetTransition = this.layoutMode === 'tree' && this.isFocusMode && this.selectedNode ? 1 : 0;
    const canSleep = this.isFocusMode
      && !this.needsCentering
      && !this.targetCamera
      && !this.isDraggingGlobe
      && !this.isPanningCamera
      && !this.pendingFocusSwap
      && !this.edgeIgnitionStartedAt
      && !this.filterWakeStartedAt
      && this.analyzeRevealState.size === 0
      && Math.abs((this.layoutTransition || 0) - targetTransition) < 0.002;

    this.settledFrameCount = canSleep ? this.settledFrameCount + 1 : 0;
    if (this.settledFrameCount < 24) {
      this.animationFrameId = requestAnimationFrame(nextTimestamp => this.animate(nextTimestamp));
    }
  }

  draw() {
    const ctx = this.ctx;
    const dpr = this.renderPixelRatio || Math.min(window.devicePixelRatio || 1, 3);
    const w = this.canvas.width;
    const h = this.canvas.height;

    const viewMode = document.getElementById('app-container')?.dataset.viewMode;
    const usesBlackCanvas = viewMode === 'explore' || viewMode === 'study';
    ctx.fillStyle = this.exportBackgroundColor || (usesBlackCanvas ? '#000000' : '#121214');
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    // Scale context by DPR for high-DPI sharpness
    ctx.scale(dpr, dpr);

    ctx.save();
    ctx.translate(this.camera.x, this.camera.y);
    ctx.scale(this.camera.zoom, this.camera.zoom);

    // Make a depth-sorted copy of nodes for rendering
    const sortedNodes = [...this.nodes].sort((a, b) => a.z - b.z);

    // Draw Category-Coded Radial Glow backdrop in Focus Mode
    // GLOW REMOVED AS PER REQUEST
    /*
    if (this.isFocusMode && this.selectedNode) {
      const activeGlowNode = this.selectedNode;
      const colorType = this.getNodeColorType(activeGlowNode);
      ctx.save();
      
      const glowRad = this.sphereRadius * 2.5;
      const radGrad = ctx.createRadialGradient(
        activeGlowNode.x, activeGlowNode.y, 20,
        activeGlowNode.x, activeGlowNode.y, glowRad
      );
      
      let glowColor = '';
      if (colorType === 'lavender') {
        glowColor = 'rgba(235, 175, 235, 0.075)';
      } else if (colorType === 'gold') {
        glowColor = 'rgba(255, 200, 120, 0.075)';
      } else {
        glowColor = 'rgba(0, 210, 196, 0.065)';
      }
      
      radGrad.addColorStop(0, glowColor);
      radGrad.addColorStop(0.4, glowColor.replace(/0\.0(\d+)/, (_, d) => `0.0${Math.floor(Number(d)/2)}`));
      radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(activeGlowNode.x, activeGlowNode.y, glowRad, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    */

    // 1. Draw connections very subtly in background
    this.drawEdges();

    // 2. Draw nodes as solid flat bubbles in depth sorted order
    this.drawNodes(sortedNodes);

    ctx.restore(); // Restore camera transform

    // Draw tree grouping brackets and labels in screen space
    if (this.layoutMode === 'tree' && this.isFocusMode && this.selectedNode && this.cachedTreeLayout) {
      if (this.showTriggers !== false) {
        this.drawGroupLabels(this.cachedTreeLayout.driverGroups, true);
      }
      if (this.showEffects !== false) {
        this.drawGroupLabels(this.cachedTreeLayout.impactGroups, false);
      }
      if (this.cachedTreeLayout.loopGroups?.length) {
        this.drawGroupLabels(this.cachedTreeLayout.loopGroups, false);
      }
    }

    // 3. Draw text labels in screen space
    this.drawLabels(sortedNodes);

    ctx.restore(); // Restore dpr scale
  }

  getNodeColorType(node) {
    const sphere = node.sphere;
    if (sphere === 'atmosphere' || sphere === 'cryosphere') {
      return 'lavender'; // Soft lilac/purple
    }

    if (sphere === 'energy' || sphere === 'agriculture' || sphere === 'economy') {
      return 'gold'; // Soft warm gold
    }

    return 'blue'; // Earth Blue category family
  }

  getNodeCategoryRgb(node) {
    return SPHERE_CATEGORY_RGB[node?.sphere] || SPHERE_CATEGORY_RGB.core;
  }

  getMotionHash(value = '') {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
    }
    return Math.abs(hash);
  }

  getEdgePoint(edge, progress) {
    const source = edge.sourceNode;
    const target = edge.targetNode;
    if (!source || !target) return null;
    const t = Math.max(0, Math.min(1, progress));

    if (this.layoutMode === 'tree' && this.isFocusMode) {
      const cp1x = source.x + (target.x - source.x) * 0.5;
      const cp1y = source.y;
      const cp2x = source.x + (target.x - source.x) * 0.5;
      const cp2y = target.y;
      const inverse = 1 - t;
      return {
        x: inverse ** 3 * source.x
          + 3 * inverse ** 2 * t * cp1x
          + 3 * inverse * t ** 2 * cp2x
          + t ** 3 * target.x,
        y: inverse ** 3 * source.y
          + 3 * inverse ** 2 * t * cp1y
          + 3 * inverse * t ** 2 * cp2y
          + t ** 3 * target.y
      };
    }

    return {
      x: source.x + (target.x - source.x) * t,
      y: source.y + (target.y - source.y) * t
    };
  }

  drawEdgeIgnitionPulse(edge) {
    if (!this.edgeIgnitionStartedAt || !this.edgeIgnitionNodeId) return;
    if (edge.source !== this.edgeIgnitionNodeId && edge.target !== this.edgeIgnitionNodeId) return;

    const delay = this.getMotionHash(edge.edgeKey || `${edge.source}->${edge.target}`) % 150;
    const elapsed = performance.now() - this.edgeIgnitionStartedAt - delay;
    const duration = 720;
    if (elapsed < 0 || elapsed > duration) return;

    const progress = elapsed / duration;
    const point = this.getEdgePoint(edge, progress);
    if (!point) return;

    const isIncoming = edge.target === this.edgeIgnitionNodeId;
    const color = isIncoming ? '255, 92, 38' : '0, 172, 255';
    const envelope = Math.sin(Math.PI * progress);
    const radius = (2.6 + envelope * 2.4) / Math.max(0.5, this.camera.zoom);

    this.ctx.save();
    this.ctx.fillStyle = `rgba(${color}, ${0.5 + envelope * 0.5})`;
    this.ctx.shadowColor = `rgba(${color}, 0.95)`;
    this.ctx.shadowBlur = 18 / Math.max(0.5, this.camera.zoom);
    this.ctx.beginPath();
    this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawEdges() {
    const ctx = this.ctx;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const selectedEdge = this.selectedEdge;
    const hoveredEdge = this.hoveredEdge;
    this.edges.forEach(edge => {
      const opacity = edge.visualOpacity || 0;
      if (opacity <= 0.01) return;

      const source = edge.sourceNode;
      const target = edge.targetNode;
      if (!source || !target) return;

      if (this.layoutMode === 'tree' && this.isFocusMode && this.cachedTreeLayout) {
        if (!this.cachedTreeLayout.positions[source.id] || !this.cachedTreeLayout.positions[target.id]) {
          return;
        }
      }

      const avgZ = (source.z + target.z) / 2;
      const depthAlpha = Math.max(0.0, 0.5 + 0.5 * avgZ);
      if (depthAlpha <= 0.02) return;
      ctx.beginPath();

      // Color mapping based on trigger/effect direction in study mode
      const activeSelectedId = this.selectedNode ? this.selectedNode.id : null;
      const edgeKey = edge.edgeKey;
      const isSelectedEdge = selectedEdge === edge;
      const isHoveredEdge = hoveredEdge === edge;
      const effectiveOpacity = selectedEdge && !isSelectedEdge ? opacity * 0.42 : opacity;
      const isEmphasizedAnalyzeEdge = Boolean(
        this.isFocusMode &&
        this.cachedAnalyzeFocusData?.emphasizedEdgeKeys?.has(edgeKey)
      );
      if (this.isFocusMode && this.cachedAnalyzeFocusData && !isEmphasizedAnalyzeEdge) {
        return;
      }
      if (
        this.layoutMode === 'tree' &&
        this.isFocusMode &&
        activeSelectedId &&
        edge.source !== activeSelectedId &&
        edge.target !== activeSelectedId
      ) {
        return;
      }
      if (this.layoutMode === 'tree' && this.isFocusMode && activeSelectedId) {
        const treePositions = this.cachedTreeLayout?.positions || {};
        const sourcePos = treePositions[edge.source];
        const targetPos = treePositions[edge.target];
        if (!sourcePos || !targetPos) return;

        const isIncomingToSelected = edge.target === activeSelectedId;
        const isOutgoingFromSelected = edge.source === activeSelectedId;
        if (isIncomingToSelected && sourcePos.x >= -1) return;
        if (isOutgoingFromSelected && targetPos.x <= 1) return;

        const neighbor = edge.source === activeSelectedId ? target : source;
        if (!this.isScreenPointNearViewport(this.worldToScreen(neighbor.x, neighbor.y), 120)) return;
      }
      let color = '';
      const triggerRgb = this.exportBackgroundColor ? PDF_GRAPH_RGB.trigger : '255, 92, 38';
      const effectRgb = this.exportBackgroundColor ? PDF_GRAPH_RGB.effect : '0, 172, 255';
      const emphasizedOpacity = this.exportBackgroundColor ? 0.98 : 0.85;
      if (this.isFocusMode && activeSelectedId) {
        if (activeSelectedId && (edge.source === activeSelectedId || edge.target === activeSelectedId)) {
          if (isEmphasizedAnalyzeEdge) {
            if (edge.target === activeSelectedId) {
              // Trigger (incoming) connection to selected node: Deep Orange (Colorblind Accessible)
              color = `rgba(${triggerRgb}, ${emphasizedOpacity * depthAlpha * effectiveOpacity})`;
            } else {
              // Effect (outgoing) connection from selected node: Blue (Colorblind Accessible)
              color = `rgba(${effectRgb}, ${emphasizedOpacity * depthAlpha * effectiveOpacity})`;
            }
          } else {
            if (edge.target === activeSelectedId) {
              color = `rgba(118, 62, 46, ${0.42 * depthAlpha * effectiveOpacity})`;
            } else {
              color = `rgba(44, 88, 112, ${0.4 * depthAlpha * effectiveOpacity})`;
            }
          }
        } else {
          // Ambient/unrelated connection
          const type = this.getNodeColorType(source);
          if (type === 'lavender') {
            color = `rgba(235, 175, 235, ${0.15 * depthAlpha})`;
          } else if (type === 'gold') {
            color = `rgba(255, 200, 120, ${0.15 * depthAlpha})`;
          } else {
            color = `rgba(80, 195, 255, ${0.15 * depthAlpha})`;
          }
        }
      } else {
        const type = this.getNodeColorType(source);
        if (type === 'lavender') {
          color = `rgba(235, 175, 235, ${0.58 * depthAlpha * effectiveOpacity})`;
        } else if (type === 'gold') {
          color = `rgba(255, 200, 120, ${0.58 * depthAlpha * effectiveOpacity})`;
        } else {
          color = `rgba(80, 195, 255, ${0.54 * depthAlpha * effectiveOpacity})`;
        }
      }

      ctx.save();
      ctx.strokeStyle = color;
      ctx.setLineDash([]);
      if (this.layoutMode === 'tree' && this.isFocusMode) {
        const treeEdgeWidth = (0.4 + 0.34 * effectiveOpacity) * 2.0 * 1.1 * 1.18 * 1.5;
        ctx.lineWidth = Math.max(2.03, treeEdgeWidth);
      } else {
        ctx.lineWidth = this.isFocusMode ? (0.45 + 0.45 * effectiveOpacity) * 1.5 * 1.1 : (0.8 + 0.7 * effectiveOpacity) * 1.5 * 1.1;
        if (this.layoutMode === 'tree') ctx.lineWidth *= 1.18;
      }

      if (isHoveredEdge && !isSelectedEdge) {
        ctx.lineWidth *= 1.35;
      }

      if (isSelectedEdge) {
        const pulse = 0.86 + 0.14 * Math.sin(performance.now() / 240);
        ctx.strokeStyle = this.exportBackgroundColor
          ? `rgba(28, 31, 38, ${pulse})`
          : `rgba(255, 255, 255, ${pulse})`;
        ctx.lineWidth = Math.max(ctx.lineWidth * 1.125, 1.75 / Math.max(0.1, this.camera.zoom));
        ctx.shadowColor = this.exportBackgroundColor
          ? 'rgba(28, 31, 38, 0.28)'
          : 'rgba(255, 255, 255, 0.98)';
        ctx.shadowBlur = 18 / Math.max(0.1, this.camera.zoom);
      }

      if (this.layoutMode === 'tree' && this.isFocusMode) {
        // Draw elegant bezier curve for tree layout (flowing left to right)
        const cp1x = source.x + (target.x - source.x) * 0.5;
        const cp1y = source.y;
        const cp2x = source.x + (target.x - source.x) * 0.5;
        const cp2y = target.y;
        ctx.moveTo(source.x, source.y);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, target.x, target.y);
      } else {
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
      }
      ctx.stroke();
      this.drawEdgeIgnitionPulse(edge);
      ctx.restore();
    });
  }

  drawNodes(sortedNodes) {
    const ctx = this.ctx;
    const canvasW = this.width;
    const canvasH = this.height;
    const instantFocusSwap = this.instantFocusSwapFrame === true;

    ctx.save();

    const hasFocus = this.selectedNode !== null || this.hoveredNode !== null;
    const activeSelectedId = this.selectedNode ? this.selectedNode.id : null;
    const activeHoveredId = this.hoveredNode ? this.hoveredNode.id : null;
    const selectedAdjacent = activeSelectedId ? (this.adjacentIdsById.get(activeSelectedId) || new Set()) : null;
    const hoveredAdjacent = !this.isFocusMode && activeHoveredId ? (this.adjacentIdsById.get(activeHoveredId) || new Set()) : null;
    const selectedIncoming = activeSelectedId ? (this.incomingIdsById.get(activeSelectedId) || new Set()) : null;
    const selectedOutgoing = activeSelectedId ? (this.outgoingIdsById.get(activeSelectedId) || new Set()) : null;

    // Iterate over depth sorted nodes (back to front)
    sortedNodes.forEach(node => {
      const screenPos = this.worldToScreen(node.x, node.y);
      const isSelected = activeSelectedId && activeSelectedId === node.id;
      const isHovered = activeHoveredId && activeHoveredId === node.id;
      const isAmbientHighlight = !hasFocus && this.ambientHighlightSet.has(node.id);
      const analyzeState = node.analyzeState || this.getAnalyzeNodeState(node);
      const isHoveredFollowable = this.isFocusMode && isHovered && analyzeState === 'followable';
      const isDirectTrigger = this.isFocusMode && activeSelectedId && selectedIncoming?.has(node.id);
      const isDirectEffect = this.isFocusMode && activeSelectedId && selectedOutgoing?.has(node.id);
      const isSelectedRelationshipEndpoint = Boolean(
        this.hasInteractiveRelationshipFocus()
        && this.selectedEdge
        && (node.id === this.selectedEdge.source || node.id === this.selectedEdge.target)
      );
      // Check neighbor relationship status for spotlighting
      const isSelectedNeighbor = activeSelectedId && selectedAdjacent?.has(node.id);
      const isHoveredNeighbor = !this.isFocusMode && activeHoveredId && hoveredAdjacent?.has(node.id);

      const isNeighbor = isSelectedNeighbor || isHoveredNeighbor;
      const isActiveFilterMatch =
        !this.isFocusMode &&
        this.activeFilter !== 'all' &&
        node.sphere === this.activeFilter;
      let filterWakeStrength = 0;
      if (isActiveFilterMatch && this.filterWakeStartedAt) {
        const delay = this.getMotionHash(node.id) % 160;
        const elapsed = performance.now() - this.filterWakeStartedAt - delay;
        if (elapsed >= 0 && elapsed <= 520) {
          filterWakeStrength = Math.sin(Math.PI * (elapsed / 520));
        }
      }
      const isHighlighted = isSelected || isHovered || isNeighbor || isAmbientHighlight || isActiveFilterMatch;

      // Calculate depth scaling factors
      let rDepthScale = Math.max(0.01, 0.55 + 0.45 * node.z); // back nodes are ~55% of normal size
      let oDepthScale = Math.max(0.01, Math.min(1.0, (0.45 + 0.55 * node.z) * 1.5)); // 150% depth opacity scaling for sphere dots

      // In Study Mode, prevent active nodes from shrinking or fading out too much when rotated behind
      if (this.isFocusMode && isHighlighted) {
        rDepthScale = Math.max(0.75, rDepthScale);
        oDepthScale = Math.max(0.65, oDepthScale);
      }

      // Check if filtered out (never applies in Study Mode / Focus Mode)
      const isFilteredOut = !this.isFocusMode && this.activeFilter !== 'all' && node.sphere !== this.activeFilter;

      // Calculate target visual values based on impactScore for highlighted nodes (150% brightness scale)
      let targetRad = 2.8 * rDepthScale; // scaled up by 40% from 2.0
      let targetOpacity = 0.6 * oDepthScale; // 150% scaled up from 0.4

      const score = node.impactScore || 50;

      if (isFilteredOut) {
        // Keep the complete sphere visible as quiet, non-interactive context.
        // Matching nodes retain the full visual treatment below.
        targetRad = 2.15 * rDepthScale;
        targetOpacity = 0.14 * oDepthScale;
      } else if (isHighlighted) {
        if (isSelected || isHovered) {
          // Focused hovered/selected node is 50% smaller (scaled from 6.0 - 12.0 down to 3.0 - 6.0)
          targetRad = 0.5 * (6.0 + (score / 100) * 6.0) * rDepthScale;
          targetOpacity = Math.min(1.0, (0.85 + (score / 100) * 0.15) * 1.5);
        } else if (isNeighbor) {
          // Connected neighbors are 50% smaller
          targetRad = 0.5 * (4.0 + (score / 100) * 4.0) * rDepthScale;
          targetOpacity = Math.min(1.0, (0.75 + (score / 100) * 0.25) * Math.max(0.75, oDepthScale) * 1.5);
        } else if (isActiveFilterMatch) {
          targetRad = 3.2 * rDepthScale;
          targetOpacity = Math.min(1.0, 0.88 * oDepthScale);
        } else if (isAmbientHighlight) {
          // Ambient highlights stay clearly visible in browse mode without overtaking focused nodes.
          targetRad = 0.6 * (4.5 + (score / 100) * 4.5) * rDepthScale;
          targetOpacity = Math.min(1.0, (0.8 + (score / 100) * 0.2) * oDepthScale * 1.5);
        }
      } else {
        // Simple background / default dim dots scaled up by 40% (150% brightness scale)
        if (this.isFocusMode) {
          targetRad = 1.2 * 1.4 * rDepthScale;
          targetOpacity = Math.min(1.0, 0.39 * oDepthScale); // 150% of 0.26
        } else {
          targetRad = 2.0 * 1.4 * rDepthScale;
          targetOpacity = Math.min(1.0, 1.0 * oDepthScale); // 150% of 0.72
        }
      }

      if (this.isFocusMode) {
        if (analyzeState === 'followable') {
          targetRad *= 1.06;
          targetOpacity = Math.max(targetOpacity, 0.95 * oDepthScale);
        } else if (analyzeState === 'context') {
          targetRad *= 0.92;
          targetOpacity = Math.max(targetOpacity * 0.42, 0.33 * oDepthScale);
        }
      }

      // 15% bigger node dots
      targetRad *= 1.15;
      if (filterWakeStrength > 0) {
        targetRad *= 1 + filterWakeStrength * 0.3;
        targetOpacity = Math.max(targetOpacity, 0.84 + filterWakeStrength * 0.16);
      }

      // Initialize visual properties if not present
      if (node.visualRadius === undefined) node.visualRadius = targetRad;
      if (node.visualOpacity === undefined) node.visualOpacity = targetOpacity;

      // Apply opacityMultiplier if set (used in tree view to fade out background nodes)
      if (node.opacityMultiplier !== undefined) {
        targetOpacity *= node.opacityMultiplier;
      }

      // Smooth interpolation (lerp)
      const lerpSpeed = this.isFocusMode ? 0.12 : 0.033;
      if (instantFocusSwap) {
        node.visualRadius = targetRad;
        node.visualOpacity = targetOpacity;
      } else {
        node.visualRadius += (targetRad - node.visualRadius) * lerpSpeed;
        node.visualOpacity += (targetOpacity - node.visualOpacity) * lerpSpeed;
      }

      const targetHighlight = (isHighlighted && !isFilteredOut) ? 1.0 : 0.0;
      if (node.highlightProgress === undefined) node.highlightProgress = targetHighlight;
      if (instantFocusSwap) {
        node.highlightProgress = targetHighlight;
      } else {
        node.highlightProgress += (targetHighlight - node.highlightProgress) * lerpSpeed;
      }

      const rad = Math.max(0.01, node.visualRadius);
      const opacity = Math.max(0.0, node.visualOpacity);
      const padding = rad * 4;

      // Frustum culling
      if (
        screenPos.x < -padding || 
        screenPos.x > canvasW + padding || 
        screenPos.y < -padding || 
        screenPos.y > canvasH + padding
      ) {
        return;
      }

      node.radius = rad;

      // Draw simple highlighted dots instead of large glow fields
      const categoryRgb = this.getNodeCategoryRgb(node);
      const allowHighlightDot = !(this.isFocusMode && analyzeState === 'context');
      const isFocusedNode = isHovered || isSelected;
      const dotPulse = (analyzeState === 'followable' || isFocusedNode) ? (1 + 0.06 * Math.sin(Date.now() / 432)) : 1;
      const followableDotScale = (analyzeState === 'followable' || isFocusedNode) ? 1.08 : 1;

      // 1. Draw a slightly larger solid dot for highlighted nodes
      if (allowHighlightDot && node.highlightProgress > 0.01) {
        const degFactor = node.degree && this.maxDegree ? (node.degree / this.maxDegree) : 0.2;
        const highlightDotMultiplier = (1.45 + 0.45 * degFactor) * dotPulse * followableDotScale;
        const highlightDotRadius = rad * highlightDotMultiplier;

        let fillColor = '';
        const opacityMultiplier = 0.95 + 0.05 * degFactor;
        let finalOpacity = Math.min(1.0, opacity * opacityMultiplier * 1.35 * 1.5) * node.highlightProgress;
        if (analyzeState === 'followable' || isFocusedNode) {
          finalOpacity = Math.min(1.0, finalOpacity * (1.03 + 0.08 * Math.sin(Date.now() / 432)));
        }

        if (isHoveredFollowable || isFocusedNode) {
          fillColor = this.exportBackgroundColor
            ? `rgba(28, 31, 38, ${Math.min(1.0, finalOpacity * 1.15)})`
            : `rgba(255, 255, 255, ${Math.min(1.0, finalOpacity * 1.15)})`;
        } else if (isDirectTrigger) {
          fillColor = `rgba(${this.exportBackgroundColor ? PDF_GRAPH_RGB.trigger : '255, 92, 38'}, ${finalOpacity})`;
        } else if (isDirectEffect) {
          fillColor = `rgba(${this.exportBackgroundColor ? PDF_GRAPH_RGB.effect : '0, 172, 255'}, ${finalOpacity})`;
        } else {
          fillColor = `rgba(${categoryRgb}, ${finalOpacity})`;
        }

        ctx.save();
        if (isActiveFilterMatch && !isFocusedNode) {
          ctx.shadowColor = `rgba(${categoryRgb}, 0.82)`;
          ctx.shadowBlur = 14 / Math.max(0.1, this.camera.zoom);
        }
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.arc(node.x, node.y, highlightDotRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 2. Draw solid dim dot if highlightProgress < 0.99
      if (node.highlightProgress < 0.99) {
        let fillColor = '';
        const dimOpacity = Math.min(1.0, opacity * 1.425 * (1.0 - node.highlightProgress)); // 150% brightness boost (0.95 * 1.5 = 1.425)
        if (isHoveredFollowable) {
          fillColor = this.exportBackgroundColor
            ? `rgba(28, 31, 38, ${Math.min(1.0, dimOpacity + 0.25)})`
            : `rgba(255, 255, 255, ${Math.min(1.0, dimOpacity + 0.25)})`;
        } else if (isDirectTrigger) {
          fillColor = `rgba(${this.exportBackgroundColor ? PDF_GRAPH_RGB.trigger : '180, 76, 52'}, ${Math.min(1.0, dimOpacity + 0.2)})`;
        } else if (isDirectEffect) {
          fillColor = `rgba(${this.exportBackgroundColor ? PDF_GRAPH_RGB.effect : '54, 150, 215'}, ${Math.min(1.0, dimOpacity + 0.2)})`;
        } else {
          fillColor = `rgba(${categoryRgb}, ${dimOpacity})`;
        }

        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.arc(node.x, node.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isSelectedRelationshipEndpoint) {
        const pulse = 0.92 + 0.08 * Math.sin(performance.now() / 240);
        ctx.save();
        ctx.shadowColor = this.exportBackgroundColor
          ? 'rgba(28, 31, 38, 0.32)'
          : 'rgba(255, 255, 255, 1)';
        ctx.shadowBlur = 20 / Math.max(0.1, this.camera.zoom);
        ctx.fillStyle = this.exportBackgroundColor
          ? `rgba(28, 31, 38, ${pulse})`
          : `rgba(255, 255, 255, ${pulse})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, Math.max(rad * 1.75, 5 / Math.max(0.1, this.camera.zoom)), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (filterWakeStrength > 0.02) {
        ctx.save();
        ctx.strokeStyle = `rgba(${categoryRgb}, ${filterWakeStrength * 0.48})`;
        ctx.lineWidth = 1.1 / Math.max(0.5, this.camera.zoom);
        ctx.beginPath();
        ctx.arc(
          node.x,
          node.y,
          rad * (1.8 + (1 - filterWakeStrength) * 1.4),
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.restore();
      }
    });

    ctx.restore();
  }

  drawLabels(sortedNodes) {
    const ctx = this.ctx;
    const centralPillScale = 0.85;
    const centralPillFontFamily = '"Inter Display", "InterDisplay", "Inter", sans-serif';
    const hasFocus = this.selectedNode !== null || this.hoveredNode !== null;
    const activeSelectedId = this.selectedNode ? this.selectedNode.id : null;
    const activeHoveredId = this.hoveredNode ? this.hoveredNode.id : null;
    const selectedIncoming = activeSelectedId ? (this.incomingIdsById.get(activeSelectedId) || new Set()) : null;
    const selectedOutgoing = activeSelectedId ? (this.outgoingIdsById.get(activeSelectedId) || new Set()) : null;
    const hoveredIncoming = !this.isFocusMode && activeHoveredId ? (this.incomingIdsById.get(activeHoveredId) || new Set()) : null;
    const hoveredOutgoing = !this.isFocusMode && activeHoveredId ? (this.outgoingIdsById.get(activeHoveredId) || new Set()) : null;
    const focusLabelBoxes = [];
    const boxesOverlap = (a, b) => !(
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom
    );

    if (this.isFocusMode && this.layoutMode !== 'tree' && this.selectedNode) {
      const selectedScreenPos = this.worldToScreen(this.selectedNode.x, this.selectedNode.y);
      const estimatedSelectedWidth = Math.min(230, Math.max(130, this.selectedNode.name.length * 8));
      focusLabelBoxes.push({
        left: selectedScreenPos.x - estimatedSelectedWidth / 2,
        right: selectedScreenPos.x + estimatedSelectedWidth / 2,
        top: selectedScreenPos.y - 22,
        bottom: selectedScreenPos.y + 22
      });
    }

    const drawCentralNodePill = (node, lines, labelX, startY, lineHeight) => {
      const metrics = lines.map(line => ctx.measureText(line));
      const textWidth = Math.max(...metrics.map(metric => metric.width), 1);
      const ascent = Math.max(...metrics.map(metric => metric.actualBoundingBoxAscent || lineHeight * 0.76));
      const descent = Math.max(...metrics.map(metric => metric.actualBoundingBoxDescent || lineHeight * 0.24));
      const paddingX = 17 * centralPillScale;
      const paddingY = 9 * centralPillScale;
      const pillX = labelX - textWidth / 2 - paddingX;
      const pillY = startY - ascent - paddingY;
      const pillWidth = textWidth + paddingX * 2;
      const pillHeight = ascent + descent + (lines.length - 1) * lineHeight + paddingY * 2;
      const pillRadius = pillHeight / 2;
      const categoryRgb = this.getNodeCategoryRgb(node);
      const reduceTransparency = window.matchMedia?.('(prefers-reduced-transparency: reduce)')?.matches === true;

      const tracePill = () => {
        ctx.beginPath();
        ctx.moveTo(pillX + pillRadius, pillY);
        ctx.lineTo(pillX + pillWidth - pillRadius, pillY);
        ctx.arc(pillX + pillWidth - pillRadius, pillY + pillRadius, pillRadius, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(pillX + pillRadius, pillY + pillHeight);
        ctx.arc(pillX + pillRadius, pillY + pillRadius, pillRadius, Math.PI / 2, Math.PI * 1.5);
        ctx.closePath();
      };

      ctx.save();

      if (this.exportBackgroundColor) {
        tracePill();
        const exportGradient = ctx.createLinearGradient(pillX, pillY, pillX + pillWidth, pillY);
        exportGradient.addColorStop(0, `rgba(${categoryRgb}, 0.78)`);
        exportGradient.addColorStop(0.5, `rgba(${categoryRgb}, 0.96)`);
        exportGradient.addColorStop(1, `rgba(${categoryRgb}, 0.78)`);
        ctx.fillStyle = exportGradient;
        ctx.fill();

        tracePill();
        ctx.strokeStyle = `rgba(${categoryRgb}, 0.72)`;
        ctx.lineWidth = Math.max(1, centralPillScale);
        ctx.stroke();
        ctx.restore();
        return;
      }

      tracePill();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 18 * centralPillScale;
      ctx.shadowOffsetY = 7 * centralPillScale;
      ctx.fillStyle = `rgba(${categoryRgb}, ${reduceTransparency ? 0.98 : 0.76})`;
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      tracePill();
      const materialHighlight = ctx.createLinearGradient(
        pillX,
        pillY,
        pillX + pillWidth,
        pillY + pillHeight
      );
      materialHighlight.addColorStop(0, reduceTransparency ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.38)');
      materialHighlight.addColorStop(0.48, reduceTransparency ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.08)');
      materialHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = materialHighlight;
      ctx.fill();

      tracePill();
      ctx.strokeStyle = reduceTransparency
        ? 'rgba(255, 255, 255, 0.5)'
        : 'rgba(255, 255, 255, 0.38)';
      ctx.lineWidth = Math.max(1, 1.1 * centralPillScale);
      ctx.stroke();

      tracePill();
      ctx.clip();
      const topHighlight = ctx.createLinearGradient(pillX, pillY, pillX, pillY + pillHeight * 0.48);
      topHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.34)');
      topHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = topHighlight;
      ctx.fillRect(pillX, pillY, pillWidth, pillHeight * 0.52);

      ctx.restore();
    };

    sortedNodes.forEach(node => {
      // Render text labels smoothly in screen space using node.labelOpacity
      if (node.labelOpacity && node.labelOpacity > 0.01) {
        const screenPos = this.worldToScreen(node.x, node.y);
        if (
          this.layoutMode === 'tree'
          && this.isFocusMode
          && !this.isScreenPointNearViewport(screenPos, 100)
        ) {
          return;
        }
        const screenRadius = node.radius * this.camera.zoom;
        const colorType = this.getNodeColorType(node);

        const isSelected = activeSelectedId && activeSelectedId === node.id;
        const isHovered = activeHoveredId && activeHoveredId === node.id;
        const isSelectedRelationshipEndpoint = Boolean(
          this.hasInteractiveRelationshipFocus()
          && this.selectedEdge
          && (node.id === this.selectedEdge.source || node.id === this.selectedEdge.target)
        );
        const isAmbientHighlight = !hasFocus && this.ambientHighlightSet.has(node.id);
        const analyzeState = node.analyzeState || this.getAnalyzeNodeState(node);
        const isHoveredFollowable = this.isFocusMode && isHovered && analyzeState === 'followable';
        
        const isSelectedNeighborTrigger = activeSelectedId && selectedIncoming?.has(node.id);
        const isSelectedNeighborEffect = activeSelectedId && selectedOutgoing?.has(node.id);
        const isHoveredNeighborTrigger = !this.isFocusMode && activeHoveredId && hoveredIncoming?.has(node.id);
        const isHoveredNeighborEffect = !this.isFocusMode && activeHoveredId && hoveredOutgoing?.has(node.id);
        const isNeighborTrigger = (isSelectedNeighborTrigger && this.showTriggers !== false) || 
                                 (isHoveredNeighborTrigger && this.showTriggers !== false);
        const isNeighborEffect = (isSelectedNeighborEffect && this.showEffects !== false) || 
                                (isHoveredNeighborEffect && this.showEffects !== false);
        const isNeighbor = isNeighborTrigger || isNeighborEffect;
        
        const isHighlighted = isSelected || isHovered || isNeighbor || isAmbientHighlight;
        const isFilteredOut = !this.isFocusMode && this.activeFilter !== 'all' && node.sphere !== this.activeFilter;

        // Offset labels based on the visible highlighted dot size
        const degFactor = node.degree && this.maxDegree ? (node.degree / this.maxDegree) : 0.2;
        const highlightDotMultiplier = (isHighlighted && !isFilteredOut) ? (1.45 + 0.45 * degFactor) : 1.0;
        const screenHighlightRadius = this.layoutMode === 'tree' && this.isFocusMode
          ? this.getTreeNodeScreenRadius(node)
          : screenRadius * highlightDotMultiplier;

        const words = node.name.split(' ');
        const lines = [];
        if (!this.isFocusMode && isHighlighted && words.length > 2) {
          const splitIndex = Math.ceil(words.length / 2);
          lines.push(words.slice(0, splitIndex).join(' '));
          lines.push(words.slice(splitIndex).join(' '));
        } else if (words.length > 4) {
          lines.push(words.slice(0, 4).join(' '));
          lines.push(words.slice(4).join(' '));
        } else {
          lines.push(node.name);
        }

        let nameFont = '';
        let labelColor = '';
        let yOffsetName = 15;
        let lineHeight = 15;
        const style = node.labelStyle || 'focus';
        const treeLabelScale = this.layoutMode === 'tree' && this.isFocusMode ? this.getTreeLabelScale() : 1;
        const analyzeLabelOpacityBoost = this.isFocusMode ? 1.4 : 1;
        const analyzeLabelWeightBoost = this.isFocusMode ? 1.2 : 1;
        const getBoostedLabelOpacity = (opacity) => Math.min(1, opacity * analyzeLabelOpacityBoost);

        if (style === 'neighbor') {
          if (isHoveredFollowable) {
            nameFont = '800 15px "Inter Display", "InterDisplay", "Inter", sans-serif';
            lineHeight = 18;
            yOffsetName = 16;
          } else if (!this.isFocusMode && isHighlighted) {
            nameFont = '600 17.25px "Inter Display", "InterDisplay", "Inter", sans-serif';
            lineHeight = 21;
            yOffsetName = 18;
          } else {
            nameFont = '400 15px "Inter Display", "InterDisplay", "Inter", sans-serif';
            lineHeight = 18;
            yOffsetName = 16;
          }
          // Determine if Trigger or Effect neighbor
          const activeId = this.isFocusMode ? activeSelectedId : (activeHoveredId || activeSelectedId);
          const connId = activeId || node.lastConnectedId;
          let colorHex = this.exportBackgroundColor
            ? 'rgba(28, 31, 38'
            : 'rgba(255, 255, 255'; // fallback
          if (connId) {
            const isTrigger = this.incomingIdsById.get(connId)?.has(node.id);
            const isEffect = this.outgoingIdsById.get(connId)?.has(node.id);
            if (isTrigger) {
              colorHex = `rgba(${this.exportBackgroundColor ? PDF_GRAPH_RGB.trigger : '255, 92, 38'}`; // Deep Orange
            } else if (isEffect) {
              colorHex = `rgba(${this.exportBackgroundColor ? PDF_GRAPH_RGB.effect : '0, 172, 255'}`; // Blue
            }
          }
          labelColor = isHoveredFollowable
            ? `rgba(255, 255, 255, ${getBoostedLabelOpacity(0.98 * node.labelOpacity)})`
            : `${colorHex}, ${getBoostedLabelOpacity(0.9 * node.labelOpacity)})`;
        } else if (style === 'ambient') {
          if (!this.isFocusMode && isHighlighted) {
            nameFont = '700 13.8px "Inter Display", "InterDisplay", "Inter", sans-serif';
            lineHeight = 17;
            yOffsetName = 17;
          } else {
            nameFont = '500 12px "Inter Display", "InterDisplay", "Inter", sans-serif';
            lineHeight = 15;
            yOffsetName = 15;
          }
          labelColor = `rgba(255, 255, 255, ${getBoostedLabelOpacity(0.75 * node.labelOpacity)})`;
        } else { // active focused/selected
          if (!this.isFocusMode && isHighlighted) {
            nameFont = '900 27.6px "Inter Display", "InterDisplay", "Inter", sans-serif';
            lineHeight = 32;
            yOffsetName = 30;
          } else {
            nameFont = '800 24px "Inter Display", "InterDisplay", "Inter", sans-serif';
            lineHeight = 28;
            yOffsetName = 26;
          }
          labelColor = `rgba(255, 255, 255, ${getBoostedLabelOpacity(node.labelOpacity)})`;
        }

        if (this.layoutMode === 'tree' && this.isFocusMode) {
          ({ nameFont, lineHeight } = this.getTreeLabelTypography(node, treeLabelScale, isHoveredFollowable));
          yOffsetName *= treeLabelScale;
        }

        if (isSelectedRelationshipEndpoint) {
          labelColor = this.exportBackgroundColor
            ? `rgba(28, 31, 38, ${getBoostedLabelOpacity(node.labelOpacity)})`
            : `rgba(255, 255, 255, ${getBoostedLabelOpacity(node.labelOpacity)})`;
        }

        const isCentralFocusLabel = this.isFocusMode && node.id === activeSelectedId;
        ctx.font = isCentralFocusLabel
          ? nameFont
              .replace(/^\d+/, '400')
              .replace(/([\d.]+)px.+$/, (_, size) => `${Number(size) * 0.75 * centralPillScale}px ${centralPillFontFamily}`)
          : this.boostFontWeight(nameFont, analyzeLabelWeightBoost);
        ctx.fillStyle = isCentralFocusLabel ? '#101014' : labelColor;
        const renderedLineHeight = isCentralFocusLabel ? lineHeight * centralPillScale : lineHeight;

        const centerY = this.height / 2;
        const placeAbove = this.layoutMode !== 'tree' && screenPos.y < centerY;

        if (this.layoutMode === 'tree' && this.isFocusMode) {
          const horizontalGap = screenHighlightRadius + TREE_NODE_LABEL_EDGE_GAP;
          let labelX = screenPos.x;
          let startY = screenPos.y - ((lines.length - 1) * renderedLineHeight) / 2;

          if (node.id === activeSelectedId) {
            ctx.textAlign = 'center';
          } else if (node.x < 0) {
            ctx.textAlign = 'right';
            labelX = screenPos.x - horizontalGap;
          } else {
            ctx.textAlign = 'left';
            labelX = screenPos.x + horizontalGap;
          }

          if (node.id === activeSelectedId) {
            drawCentralNodePill(node, lines, labelX, startY, renderedLineHeight);
          }

          lines.forEach((line, idx) => {
            ctx.fillText(line, labelX, startY + idx * renderedLineHeight);
          });
        } else {
          ctx.textAlign = 'center';
          const glowSpacing = 12;
          let startY = placeAbove
            ? (screenPos.y - screenHighlightRadius - yOffsetName - glowSpacing)
            : (screenPos.y + screenHighlightRadius + yOffsetName + glowSpacing);

          if (placeAbove && lines.length > 1) {
            startY -= (lines.length - 1) * renderedLineHeight;
          }

          if (this.isFocusMode && node.id === activeSelectedId) {
            startY = screenPos.y + renderedLineHeight * 0.32;
            drawCentralNodePill(node, lines, screenPos.x, startY, renderedLineHeight);
          } else if (this.isFocusMode) {
            const maxLineWidth = Math.max(...lines.map(line => ctx.measureText(line).width), 1);
            const labelHeight = Math.max(renderedLineHeight, lines.length * renderedLineHeight);
            const buildBox = y => ({
              left: screenPos.x - maxLineWidth / 2 - 7,
              right: screenPos.x + maxLineWidth / 2 + 7,
              top: y - renderedLineHeight - 4,
              bottom: y - renderedLineHeight + labelHeight + 5
            });
            let labelBox = buildBox(startY);
            const nudge = (placeAbove ? -1 : 1) * (renderedLineHeight + 5);
            let attempts = 0;
            while (focusLabelBoxes.some(box => boxesOverlap(labelBox, box)) && attempts < 5) {
              startY += nudge;
              labelBox = buildBox(startY);
              attempts += 1;
            }
            if (this.showAllAnalyzeConnections) {
              const viewportLabelMargin = 18;
              if (labelBox.top < viewportLabelMargin) {
                startY += viewportLabelMargin - labelBox.top;
                labelBox = buildBox(startY);
              } else if (labelBox.bottom > this.height - viewportLabelMargin) {
                startY -= labelBox.bottom - (this.height - viewportLabelMargin);
                labelBox = buildBox(startY);
              }
            }
            focusLabelBoxes.push(labelBox);
          }

          node.renderedNetworkLabelStartY = startY;
          lines.forEach((line, idx) => {
            ctx.fillText(line, screenPos.x, startY + idx * renderedLineHeight);
          });
        }
      }
    });
  }

  exitFocusMode() {
    const isLeavingAnalyzeTree = this.layoutMode === 'tree' && this.isFocusMode;
    this.returningFromAnalyzeTree = this.returningFromAnalyzeTree || isLeavingAnalyzeTree;
    if (isLeavingAnalyzeTree) {
      this.sphereReturnMomentumUntil = Math.max(
        this.sphereReturnMomentumUntil,
        performance.now() + 900
      );
    }
    this.isFocusMode = false;
    this.selectedNode = null;
    this.hoveredNode = null;
    this.selectedEdge = null;
    this.hoveredEdge = null;
    this.invalidateAnalyzeCaches();
    this.emitHoverState(null, null);
    this.needsCentering = false;
    this.pendingFocusSwap = false;
    this.instantFocusSwapFrame = false;
    // Start auto-rotation immediately without a pause, allowing the transition factor to handle smooth acceleration
    this.autoRotatePausedUntil = 0;
    this.tweenCamera(this.width / 2, this.height / 2 + 45, this.defaultZoom);
    this.requestRender();
  }

  setFilter(filter) {
    this.activeFilter = filter;
    this.filterWakeStartedAt = (
      filter !== 'all' &&
      !window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    ) ? performance.now() : 0;
    this.ambientHighlights = [];
    this.hoveredNode = null;
    this.emitHoverState(null, null);
    this.requestRender();
  }



  pause() {
    this.isRunning = false;
    this.emitHoverState(null, null);
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.requestRender();
    }
  }

  destroy() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
