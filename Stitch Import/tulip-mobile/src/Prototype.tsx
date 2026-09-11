import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties, type FormEvent, type PointerEvent as ReactPointerEvent, type TouchEvent as ReactTouchEvent } from "react";
import { createPortal } from "react-dom";
import {
  ActivityLogIcon,
  CheckCircledIcon,
  ChevronRightIcon,
  ClockIcon,
  Cross1Icon,
  ExternalLinkIcon,
  GlobeIcon,
  HamburgerMenuIcon,
  PersonIcon,
  RocketIcon,
} from "@radix-ui/react-icons";
import { BottomSheet, Carousel, KeyboardInput, MobileScroll, useKeyboard } from "./mobile";

import mobileNodeCatalog from "./mobile-node-catalog.json";
import mobileActivitySnapshot from "./mobile-activity-snapshot.json";
// @ts-ignore -- production relationship grammar helper is JavaScript.
import { getRelationshipQuestionAuxiliary } from "../../../src/relationship-semantics.js";
// @ts-ignore -- production Personal Footprint context helpers are JavaScript.
import { estimateGlobalCarbonPercentile, getFootprintEquivalencies } from "../../../src/personal-footprint-context.js";
// @ts-ignore -- shared metric presentation policy is JavaScript.
import { formatMetricDisplayText, metricizeDisplayValue } from "../../../src/metric-display.js";
// @ts-ignore -- shared production Personal Footprint model is JavaScript.
import * as SharedFootprintModel from "../../../src/personal-footprint-model.js";
// @ts-ignore -- shared production TULIP urgency bands are JavaScript.
import { TULIP_URGENCY_BANDS_V3, getTulipUrgencyBandV3 } from "../../../src/tulip-urgency-v3.js";
// Lazy registry assets from the desktop build. Vite emits these as standalone
// files so the large directories are downloaded only when someone opens them.
// @ts-ignore -- Vite asset URL imports are resolved at build time.
import sourceRegistryUrl from "../../../public/tulip-source-registry.json?url";
// @ts-ignore -- Vite asset URL imports are resolved at build time.
import pipelineRegistryUrl from "../../../public/pipeline-lineage-registry.json?url";
// @ts-ignore -- Vite asset URL imports are resolved at build time.
import researchBacklogUrl from "../../../public/research-backlog.json?url";

type Screen = "search" | "explore" | "analyse" | "activity" | "footprint";
type Icon = ComponentType<{ width?: number; height?: number }>;
type DesktopNode = { id: string; name: string };
type AppPoint = { x:number; y:number };
type AnalyseHistoryEntry = { name:string; expanded:boolean };
type AnalyseNavigationCache = { current:AnalyseHistoryEntry; history:AnalyseHistoryEntry[] };
type QuickStartStep = {
  id:string;
  screen:Screen;
  target:string;
  title:string;
  body:string;
  placement:"above"|"below";
  padding?:number;
  spotlight?:"target"|"canvas-center";
};
type QuickStartRect = {
  x:number;
  y:number;
  width:number;
  height:number;
  targetX:number;
  targetY:number;
  targetWidth:number;
  targetHeight:number;
  containerWidth:number;
  containerHeight:number;
};
type DesktopNodeData = DesktopNode & Record<string, any>;
type DesktopEdgeData = {
  source: string;
  target: string;
  influence?: number;
  topology_rule?: string;
  verb?: string;
  adverb?: string;
  relationship_description?: string;
  evidence?: Record<string, any>;
};
type DesktopGraph = {
  nodes: DesktopNodeData[];
  width: number;
  height: number;
  sphereRadius: number;
  renderPixelRatio?: number;
  camera: { x: number; y: number; zoom: number };
  targetCamera?: { x: number; y: number; zoom: number } | null;
  defaultZoom: number;
  exportBackgroundColor?: string;
  isFocusMode: boolean;
  selectedNode?: DesktopNodeData | null;
  rotationX: number;
  rotationY: number;
  needsCentering?: boolean;
  isDraggingGlobe?: boolean;
  isPanningCamera?: boolean;
  touchGesture?: unknown;
  autoRotatePausedUntil?: number;
  touchMomentum?: { kind:string; x:number; y:number } | null;
  layoutMode: "network" | "tree";
  showAllAnalyzeConnections: boolean;
  activeFilter: string;
  ambientHighlights: string[];
  ambientHighlightSet: Set<string>;
  ctx: CanvasRenderingContext2D;
  mobileHighlightedLabelsAsPills?: boolean;
  mobileLineOpacityMultiplier?: number;
  mobileLineWidthMultiplier?: number;
  mobileAmbientEdgeStride?: number;
  mobileHighlightedLabelColor?: string;
  mobileAutoRotateSpeedMultiplier?: number;
  disableEdgeIgnition?: boolean;
  idleFrameDurationMs?: number;
  targetFrameDurationMs?: number;
  touchTapSlop?: number;
  minimumManualZoom?: number;
  maximumManualZoom?: number;
  canvasResizeObserver?: ResizeObserver;
  handleVisibilityChange?: EventListener;
  resizeCanvas: () => void;
  requestRender: () => void;
  exitFocusMode: () => void;
  selectNode: (node: DesktopNodeData, options?: { instantSwap?: boolean }) => void;
  setFilter: (filter: string) => void;
  zoomToFit: () => void;
  tweenCamera: (x:number, y:number, zoom:number) => void;
  pause: () => void;
  resume: () => void;
  updatePhysics: (...args:any[]) => void;
  draw: () => void;
  isNodeInteractiveInAnalyze: (node: DesktopNodeData) => boolean;
  destroy: () => void;
};
type FootprintAnswer = Record<string, string | null>;
type FootprintOption = {
  value: string;
  label: string;
  note: string;
  co2?: number;
  nature?: number;
  water?: number;
  material?: number;
  homeBaselineCarbon?: number;
  transportMultiplier?: number;
  flightsMultiplier?: number;
  hvacMultiplier?: number;
  homeMultiplier?: number;
  homeDemandMultiplier?: number;
  homeUseMultiplier?: number;
};
type FootprintQuestion = {
  key: string;
  title: string;
  help: string;
  module: string;
  role: "contextual" | "direct";
  options: FootprintOption[];
};
type FootprintBreakdownItem = { key:string; label:string; module:string; carbon:number; co2:number; nature:number; water:number; material:number };
type FootprintSectionSummary = { label:string; carbon:number; land:number; water:number; material:number };
type FootprintResult = { carbon:number; land:number; water:number; material:number; answered:number; region:string; breakdown:FootprintBreakdownItem[]; sectionSummaries:FootprintSectionSummary[] };
type ExploreInfoSection = "score" | "sources" | "registries" | "about" | "contact" | "privacy";
type TulipNativeBridge = {
  haptic:(kind?:"selection"|"light"|"medium"|"success") => void;
  share:(payload:{ title:string; text:string; url:string }) => void;
  startupReady?:() => void;
  navigationState?:(payload:{ active:Screen; visible:boolean; compact:boolean; quickStartActive:boolean }) => void;
  openInspector?:(name:string) => void;
};
type SourceRegistryRecord = {
  id:string;
  name:string;
  url:string;
  access_classification?:string;
  integration_bucket?:string;
  ingestion_mode?:string;
  refresh_style?:string;
  fit?:string[];
  flags?:string[];
  platform_use?:string;
  notes?:string;
  verified_now?:boolean;
  needs_login?:boolean;
  platform_integration?:Record<string,any>;
};

const ANALYSE_HISTORY_STORAGE_KEY = "tulip-mobile-analyse-history-v1";
const ANALYSE_HISTORY_LIMIT = 24;
const QUICK_START_STORAGE_KEY = "tulip-mobile-quick-start-v1";
const QUICK_START_STEPS:QuickStartStep[] = [
  {
    id:"explore-spin",
    screen:"explore",
    target:'[data-quick-start="explore-canvas"]',
    title:"Spin to explore",
    body:"Watch the gesture, then drag the globe in any direction.",
    placement:"above",
    spotlight:"canvas-center",
    padding:10,
  },
  {
    id:"explore-node",
    screen:"explore",
    target:'[data-quick-start="explore-canvas"]',
    title:"Reveal connections",
    body:"Tap a node to see its connected phenomena.",
    placement:"above",
    spotlight:"canvas-center",
    padding:10,
  },
  {
    id:"explore-reset",
    screen:"explore",
    target:'[data-quick-start="explore-canvas"]',
    title:"Reset the globe",
    body:"Swipe diagonally from the bottom-left toward the middle-right.",
    placement:"above",
    spotlight:"canvas-center",
    padding:10,
  },
  {
    id:"explore-open-analyse",
    screen:"explore",
    target:'[data-quick-start="explore-canvas"]',
    title:"Open a phenomenon",
    body:"Tap a node to reveal its connections, then tap that same node again.",
    placement:"above",
    spotlight:"canvas-center",
    padding:10,
  },
  {
    id:"analyse-inspector",
    screen:"analyse",
    target:'[data-quick-start="analyse-grab-zone"]',
    title:"Meet the inspector",
    body:"Analyse opens with deeper evidence, impacts and relationships.",
    placement:"above",
    padding:18,
  },
  {
    id:"analyse-scroll",
    screen:"analyse",
    target:'.analysis-detail-content',
    title:"Read the evidence",
    body:"Scroll through the inspector to review the full analysis.",
    placement:"above",
    spotlight:"canvas-center",
    padding:10,
  },
  {
    id:"analyse-collapse",
    screen:"analyse",
    target:'[data-quick-start="analyse-grab-zone"]',
    title:"Explore connections",
    body:"Drag the inspector down to reveal connected phenomena.",
    placement:"above",
    padding:18,
  },
  {
    id:"analyse-node",
    screen:"analyse",
    target:'[data-quick-start="analyse-node"]',
    title:"Follow a connection",
    body:"Tap any connected phenomenon to learn more.",
    placement:"above",
    spotlight:"canvas-center",
    padding:10,
  },
  {
    id:"return-explore",
    screen:"analyse",
    target:'[data-quick-start="nav-explore"] .nav-icon',
    title:"Return to Explore",
    body:"Tap Explore to return to the globe.",
    placement:"above",
    padding:8,
  },
];
const QUICK_START_EXPLORE_CANVAS_STEPS = new Set(["explore-spin","explore-node","explore-reset","explore-open-analyse"]);
const QUICK_START_LIVE_STEPS = new Set([...QUICK_START_EXPLORE_CANVAS_STEPS,"analyse-scroll","analyse-collapse","analyse-node"]);

function hasCompletedQuickStart() {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(QUICK_START_STORAGE_KEY) === "complete";
  } catch {
    return false;
  }
}

function saveQuickStartCompletion() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUICK_START_STORAGE_KEY,"complete");
  } catch {
    // Completion persistence is optional; the walkthrough remains usable.
  }
}

function readAnalyseNavigationCache(): AnalyseNavigationCache | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(ANALYSE_HISTORY_STORAGE_KEY) || "null") as Partial<AnalyseNavigationCache> | null;
    if (!parsed?.current || typeof parsed.current.name !== "string") return null;
    const history = Array.isArray(parsed.history)
      ? parsed.history.filter((entry): entry is AnalyseHistoryEntry => Boolean(entry && typeof entry.name === "string" && typeof entry.expanded === "boolean")).slice(-ANALYSE_HISTORY_LIMIT)
      : [];
    return { current:{ name:parsed.current.name,expanded:Boolean(parsed.current.expanded) },history };
  } catch {
    return null;
  }
}

function writeAnalyseNavigationCache(current:AnalyseHistoryEntry,history:AnalyseHistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ANALYSE_HISTORY_STORAGE_KEY,JSON.stringify({ current,history:history.slice(-ANALYSE_HISTORY_LIMIT) }));
  } catch {
    // History caching is an enhancement; navigation must remain functional when storage is unavailable.
  }
}

const desktopNodes = mobileNodeCatalog as DesktopNodeData[];
const desktopNodeByName = new Map(desktopNodes.map((node) => [node.name,node]));
const desktopSearchIndex = desktopNodes.map((node) => ({ node,name:node.name.toLowerCase() }));
const EXPLORE_MOBILE_ZOOM = 0.975 * 1.15;
const EXPLORE_MAX_RENDER_PIXEL_RATIO = 2.75;
const EXPLORE_RENDER_PIXEL_BUDGET = 2_250_000;
const EXPLORE_NATIVE_REST_MAX_RENDER_PIXEL_RATIO = 3;
const EXPLORE_NATIVE_REST_RENDER_PIXEL_BUDGET = 3_400_000;
const EXPLORE_NATIVE_INTERACTION_MAX_RENDER_PIXEL_RATIO = 2;
const EXPLORE_NATIVE_INTERACTION_RENDER_PIXEL_BUDGET = 1_650_000;
const EXPLORE_CAMERA_VERTICAL_OFFSET = 14;
const ACTIVITY_SIDE_SWIPE_INSET = 200;
const ANALYSE_COLLAPSE_GESTURE_HEIGHT_RATIO = .65;
const ACCIDENTAL_TOUCH_SLOP = 12;
const SEARCH_HISTORY_KEY = "tulip_mobile_search_history_v1";
const DEFAULT_SEARCH_HISTORY = ["Carbon Emission", "Ocean Acidification"];
const SUGGESTED_SEARCH_TOPICS = [
  "Global Temperature",
  "Ocean Heat Content",
  "Methane Emissions",
  "Deforestation",
  "Carbon Emission",
  "Ocean Acidification",
];
const suggestedSearchNodes = SUGGESTED_SEARCH_TOPICS.map((name) => desktopNodeByName.get(name)).filter(Boolean) as DesktopNodeData[];

const createMobileGraphNodes = (nodes:DesktopNodeData[]) => nodes.map((node) => ({
  id:node.id,
  name:node.name,
  sphere:node.sphere,
  description:node.description,
  tulipScore:node.tulipScore,
  impactScore:node.impactScore,
  score:node.score && typeof node.score === "object" ? { baseline:node.score.baseline } : node.score,
  calibration:node.calibration ? {
    role:node.calibration.role,
    source_status:node.calibration.source_status,
  } : undefined,
  context:node.context ? { reach:node.context.reach } : undefined,
  vector:node.vector ? {
    societal_fallout:node.vector.societal_fallout,
    human_drivenness:node.vector.human_drivenness,
  } : undefined,
  humanImpact:node.humanImpact?.primaryPathways?.length ? { primaryPathways:[true] } : undefined,
  economicContext:node.economicContext ? true : undefined,
}));

const createMobileGraphEdges = (edges:DesktopEdgeData[]) => edges.map((edge) => ({
  source:edge.source,
  target:edge.target,
  influence:edge.influence,
  topology_rule:edge.topology_rule,
}));

function useAccidentalTouchGuard() {
  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) return;
    type Gesture = { pointerId:number; x:number; y:number; moved:boolean; control:Element | null };
    let gesture:Gesture | null = null;
    let blockedControl:Element | null = null;
    let blockedUntil = 0;
    const interactiveControl = (target:EventTarget | null) => target instanceof Element
      ? target.closest("button, a, input, textarea, select, summary, [role='button'], [role='menuitem'], [role='tab']")
      : null;
    const begin = (event:PointerEvent) => {
      if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
      gesture = { pointerId:event.pointerId,x:event.clientX,y:event.clientY,moved:false,control:interactiveControl(event.target) };
    };
    const move = (event:PointerEvent) => {
      if (!gesture || gesture.pointerId !== event.pointerId || gesture.moved) return;
      gesture.moved = Math.hypot(event.clientX - gesture.x,event.clientY - gesture.y) >= ACCIDENTAL_TOUCH_SLOP;
    };
    const finish = (event:PointerEvent) => {
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      if (gesture.moved && gesture.control) {
        blockedControl = gesture.control;
        blockedUntil = performance.now() + 450;
      }
      gesture = null;
    };
    const cancel = () => { gesture = null; };
    const blockSyntheticClick = (event:MouseEvent) => {
      if (!blockedControl) return;
      if (performance.now() > blockedUntil) {
        blockedControl = null;
        blockedUntil = 0;
        return;
      }
      if (interactiveControl(event.target) !== blockedControl) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      blockedControl = null;
      blockedUntil = 0;
    };
    root.addEventListener("pointerdown",begin,true);
    root.addEventListener("pointermove",move,true);
    root.addEventListener("pointerup",finish,true);
    root.addEventListener("pointercancel",cancel,true);
    root.addEventListener("click",blockSyntheticClick,true);
    return () => {
      root.removeEventListener("pointerdown",begin,true);
      root.removeEventListener("pointermove",move,true);
      root.removeEventListener("pointerup",finish,true);
      root.removeEventListener("pointercancel",cancel,true);
      root.removeEventListener("click",blockSyntheticClick,true);
    };
  },[]);
}


const navItems: Array<{ id: Screen; label: string; iconSrc: string }> = [
  { id: "search", label: "Search", iconSrc: "/assets/tulip/icons/webapp-search.svg" },
  { id: "explore", label: "Explore", iconSrc: "/assets/tulip/icons/webapp-explore.svg" },
  { id: "analyse", label: "Analyse", iconSrc: "/assets/tulip/icons/webapp-analyse.svg" },
  { id: "activity", label: "Impacts", iconSrc: "/assets/tulip/icons/webapp-activity-impacts.svg" },
  { id: "footprint", label: "Footprint", iconSrc: "/assets/tulip/icons/webapp-my-footprint.svg" },
];

const exploreFilters = [
  ["all","All"],
  ["atmosphere","Air"],
  ["oceans","Oceans"],
  ["cryosphere","Glaciers"],
  ["biosphere","Plants & Wildlife"],
  ["energy","Power & Heat"],
  ["digital","Digital"],
  ["agriculture","Farming"],
  ["transport","Travel & Shipping"],
  ["economy","Markets"],
  ["sociopolitical","Society"],
] as const;

const humanizeKey = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

type MobileInspectorProfile = {
  name:string;
  sphere:string;
  updated:string;
  description:string;
  urgency:number;
  urgencyBand:string;
  incoming:MobileRelationshipEntry[];
  outgoing:MobileRelationshipEntry[];
  human:Record<string,any>;
  planet:Record<string,any>;
  response:Record<string,any>;
  measurement:Record<string,any>;
  recentOccurrences:MobileRecentOccurrenceProfile | null;
  sources:[string,string][];
};

type MobileRelationshipEntry = [string,string,string?];
type MobileRecentOccurrence = {
  id:string;
  date:string;
  place:string;
  title:string;
  status:string;
  statusLabel:string;
  statusNote:string;
  summary:string;
  sources:Array<{label:string;url:string}>;
};
type MobileRecentOccurrenceProfile = {
  title:string;
  profileKind:string;
  occurrences:MobileRecentOccurrence[];
};

let inspectorProfilesCache:Record<string,MobileInspectorProfile> | null = null;
let inspectorProfilesPromise:Promise<Record<string,MobileInspectorProfile>> | null = null;
type MobileGraphSnapshot = { graphNodes:DesktopNodeData[]; graphEdges:DesktopEdgeData[] };
type MobileGraphResources = { TulipGraph:any; graphSnapshot:MobileGraphSnapshot };
let graphResourcesPromise:Promise<MobileGraphResources> | null = null;

function loadGraphResources() {
  if (!graphResourcesPromise) {
    graphResourcesPromise = Promise.all([
      // @ts-ignore -- the production graph module is JavaScript outside this TS project.
      import("../../../src/graph.js"),
      import("./mobile-graph-snapshot.json"),
    ]).then(([{ TulipGraph },{ default:graphSnapshot }]) => ({
      TulipGraph,
      graphSnapshot:graphSnapshot as unknown as MobileGraphSnapshot,
    }));
  }
  return graphResourcesPromise;
}

function loadInspectorProfiles() {
  if (inspectorProfilesCache) return Promise.resolve(inspectorProfilesCache);
  if (!inspectorProfilesPromise) {
    // Keep this dataset lazy, but load it through the module loader. Fetch does
    // not reliably support the native app's bundled `tulip://` URL scheme.
    inspectorProfilesPromise = import("./mobile-inspector-snapshot.json")
      .then(({default:profiles}) => profiles as unknown as Record<string,MobileInspectorProfile>)
      .then((profiles) => {
        inspectorProfilesCache = profiles;
        return profiles;
      });
  }
  return inspectorProfilesPromise;
}

function resolveInspectorProfile(requestedName:string,profiles:Record<string,MobileInspectorProfile>) {
  const aliases:Record<string,string> = { "carbon emission trends":"carbon emission","deforestation rate":"deforestation" };
  const normalized = requestedName.trim().toLowerCase();
  const resolved = aliases[normalized] || normalized;
  return profiles[resolved] || Object.values(profiles).find((profile) => profile.name.toLowerCase().includes(resolved)) || null;
}

type ActivityTheme = { start: string; end: string; glow: string };
type ActivityProfile = {
  key: string;
  label: string;
  description: string;
  lens: Record<string, any>;
  actions: Record<string, any>;
  theme: ActivityTheme;
};

const activityThemes: Record<string, ActivityTheme> = {
  food: { start:"rgba(255,183,77,.98)", end:"rgba(255,111,97,.96)", glow:"rgba(255,145,120,.24)" },
  industry_farming: { start:"rgba(163,230,53,.98)", end:"rgba(34,197,94,.96)", glow:"rgba(74,222,128,.22)" },
  methane: { start:"rgba(125,211,252,.98)", end:"rgba(14,165,233,.96)", glow:"rgba(56,189,248,.22)" },
  carbon_emission: { start:"rgba(244,114,182,.98)", end:"rgba(239,68,68,.96)", glow:"rgba(248,113,113,.24)" },
  electricity_generation: { start:"rgba(96,165,250,.98)", end:"rgba(45,212,191,.96)", glow:"rgba(96,165,250,.22)" },
  personal_conveyance: { start:"rgba(251,191,36,.98)", end:"rgba(249,115,22,.96)", glow:"rgba(251,146,60,.22)" },
  freight_logistics: { start:"rgba(248,196,113,.98)", end:"rgba(235,87,87,.96)", glow:"rgba(242,153,74,.22)" },
  food_waste: { start:"rgba(250,204,21,.98)", end:"rgba(132,204,22,.96)", glow:"rgba(163,230,53,.22)" },
  fertilizer_production: { start:"rgba(52,211,153,.98)", end:"rgba(16,185,129,.96)", glow:"rgba(52,211,153,.2)" },
  mining_critical_minerals: { start:"rgba(192,132,252,.98)", end:"rgba(99,102,241,.96)", glow:"rgba(129,140,248,.22)" },
  built_environment: { start:"rgba(147,197,253,.98)", end:"rgba(245,158,11,.96)", glow:"rgba(96,165,250,.22)" },
  deforestation_land_use: { start:"rgba(110,231,183,.98)", end:"rgba(34,197,94,.96)", glow:"rgba(74,222,128,.22)" },
  plastics_petrochemicals: { start:"rgba(248,113,113,.98)", end:"rgba(236,72,153,.96)", glow:"rgba(244,114,182,.22)" },
  data_centers: { start:"rgba(129,140,248,.98)", end:"rgba(45,212,191,.96)", glow:"rgba(94,234,212,.22)" },
  ai_compute: { start:"rgba(167,139,250,.98)", end:"rgba(59,130,246,.96)", glow:"rgba(129,140,248,.24)" },
  aviation: { start:"rgba(56,189,248,.98)", end:"rgba(14,165,233,.96)", glow:"rgba(56,189,248,.22)" },
  air_conditioning_refrigerants: { start:"rgba(103,232,249,.98)", end:"rgba(59,130,246,.96)", glow:"rgba(96,165,250,.22)" },
};

const fallbackActivityTheme: ActivityTheme = { start:"rgba(66,178,255,.96)", end:"rgba(28,214,220,.94)", glow:"rgba(43,205,238,.18)" };

const activityProfiles: ActivityProfile[] = (mobileActivitySnapshot as Array<Record<string, any>>).map((item) => {
  const lensKey = item.lensKey || item.key;
  return {
    key: item.key,
    label: item.label,
    description: item.description,
    lens:item.lens,
    actions:item.actions,
    theme: activityThemes[item.key] || activityThemes[lensKey] || fallbackActivityTheme,
  };
});

const footprintQuestionsMobileSnapshot: FootprintQuestion[] = [
  { key:"geography", title:"Where are you located?", help:"This sets your starting baseline. Different places have very different energy grids and transport patterns.", module:"Context", role:"contextual", options:[
    {value:"clean_transit",label:"Nordics / France / Switzerland",note:"Cleaner electricity and stronger transit.",homeBaselineCarbon:1.8,transportMultiplier:.75,flightsMultiplier:1},
    {value:"clean_car",label:"US Pacific Northwest / Parts of Latin America",note:"Cleaner electricity, more car dependence.",homeBaselineCarbon:2.6,transportMultiplier:1.1,flightsMultiplier:1},
    {value:"mixed_transit",label:"UK / Japan / South Korea",note:"Mixed electricity with good transit.",homeBaselineCarbon:3,transportMultiplier:.8,flightsMultiplier:1},
    {value:"mixed_car",label:"Most of the US / Canada",note:"Mixed electricity and higher car dependence.",homeBaselineCarbon:4.3,transportMultiplier:1.1,flightsMultiplier:1},
    {value:"fossil_transit",label:"China / India / Southeast Asia",note:"Fossil-heavy electricity with mixed transit access.",homeBaselineCarbon:4.8,transportMultiplier:.9,flightsMultiplier:1},
    {value:"fossil_car",label:"Australia / Middle East / South Africa",note:"Fossil-heavy electricity and higher car dependence.",homeBaselineCarbon:5.8,transportMultiplier:1.2,flightsMultiplier:1},
  ]},
  { key:"hvac", title:"How much heating or air conditioning do you use?", help:"This adjusts your home energy use.", module:"Context", role:"contextual", options:[
    {value:"rarely",label:"Rarely",note:"Minimal heating or cooling",hvacMultiplier:.8},{value:"seasonally",label:"Seasonally",note:"Typical summer or winter use",hvacMultiplier:1},{value:"heavily",label:"Almost year-round",note:"Heavy heating or cooling demand",hvacMultiplier:1.2},
  ]},
  { key:"household_size", title:"How many people share your home and its energy use?", help:"This adjusts your share of home energy use.", module:"Context", role:"contextual", options:[
    {value:"solo",label:"1 Person",note:"You carry the full home share",homeMultiplier:1.18},{value:"two",label:"2 People",note:"Typical shared-home baseline",homeMultiplier:1},{value:"three",label:"3 People",note:"Energy is shared",homeMultiplier:.82},{value:"four",label:"4 People",note:"Energy is shared further",homeMultiplier:.68},{value:"five_plus",label:"5+ People",note:"Lower per-person home share",homeMultiplier:.58},
  ]},
  { key:"home_type", title:"Which home feels most like yours?", help:"A simple proxy for home size and type.", module:"Home", role:"direct", options:[
    {value:"small_apt",label:"Small Apartment / Shared Room",note:"Compact home",nature:1,water:2,material:2,homeDemandMultiplier:.65},{value:"average_apt",label:"Average Apartment / Condo",note:"Typical multi-unit home",nature:2,water:3,material:3,homeDemandMultiplier:1},{value:"small_house",label:"Small Townhome / House",note:"Smaller house",nature:4,water:4,material:5,homeDemandMultiplier:1.35},{value:"average_house",label:"Average Detached House",note:"Typical detached home",nature:6,water:6,material:7,homeDemandMultiplier:1.75},{value:"large_house",label:"Large Detached House",note:"Larger material footprint",nature:9,water:8,material:10,homeDemandMultiplier:2.4},
  ]},
  { key:"home_energy", title:"Compared with similar homes in your area, how energy-intensive is yours?", help:"This moves your local baseline up or down based on how much energy your home uses.", module:"Home", role:"direct", options:[
    {value:"lower_area",label:"Lower Than Typical for My Area",note:"Smaller bills or lighter heating and cooling",nature:1,water:2,material:2,homeUseMultiplier:.75},{value:"typical_area",label:"About Typical for My Area",note:"Roughly average for similar homes nearby",nature:2,water:3,material:3,homeUseMultiplier:1},{value:"higher_area",label:"Higher Than Typical for My Area",note:"More space, more appliances, or heavier HVAC use",nature:3,water:4,material:4,homeUseMultiplier:1.3},{value:"very_high_area",label:"Much Higher Than Typical for My Area",note:"Very high home energy demand",nature:4,water:5,material:5,homeUseMultiplier:1.65},
  ]},
  { key:"everyday_travel", title:"In a typical week, how do you mostly get around?", help:"Your usual day-to-day travel pattern.", module:"Travel", role:"direct", options:[
    {value:"walk_transit",label:"Mostly Walk, Bike, or Transit",note:"Low-carbon daily travel",co2:.4,nature:1,water:1,material:1},{value:"mixed",label:"Mix Of Transit and Occasional Car",note:"A mixed travel pattern",co2:1.2,nature:2,water:3,material:3},{value:"small_ev",label:"Mostly Drive a Smaller Car / EV",note:"More efficient private travel",co2:1.2,nature:6,water:9,material:10},{value:"regular_gas",label:"Mostly Drive a Regular Gas Car",note:"Typical private-car commuting",co2:3.8,nature:4,water:4,material:5},{value:"multiple_cars",label:"Multiple Cars / Long Daily Drives",note:"High private travel demand",co2:6,nature:8,water:10,material:14},
  ]},
  { key:"flights", title:"About how much flying do you do in a year?", help:"Include both work and personal flights.", module:"Travel", role:"direct", options:[
    {value:"rare",label:"Rarely or Never",note:"Minimal flight impact",co2:.1,nature:.1,water:.1,material:.1},{value:"annual",label:"1-2 Shorter Trips",note:"Occasional flying",co2:1.2,nature:.5,water:.5,material:.5},{value:"regular",label:"About 1 Long-haul / 3-4 Shorter",note:"Moderate flying",co2:3,nature:1,water:1,material:1},{value:"frequent",label:"2+ Long-haul / 5-8 Shorter",note:"Frequent flying",co2:6,nature:2,water:2,material:2},{value:"very_frequent",label:"Very Frequent Flyer",note:"High volume air travel",co2:10,nature:4,water:3,material:3},
  ]},
  { key:"diet", title:"Which option best matches how you usually eat?", help:"A simple diet proxy based on your habits.", module:"Food", role:"direct", options:[
    {value:"vegan",label:"Vegan",note:"No animal products",co2:1,nature:5,water:10,material:4},{value:"vegetarian",label:"Vegetarian",note:"No meat, some dairy or eggs",co2:1.5,nature:8,water:14,material:6},{value:"plant_forward",label:"Mostly Plant-forward",note:"Mostly plants, occasional meat",co2:2.1,nature:12,water:18,material:8},{value:"mixed",label:"Mixed Diet",note:"Meat a few times a week",co2:3.3,nature:20,water:25,material:11},{value:"meat_heavy",label:"Meat With Most Meals",note:"Frequent meat and dairy",co2:4.7,nature:30,water:32,material:14},
  ]},
  { key:"food_waste", title:"How much food from your home usually goes uneaten?", help:"Think about spoilage, leftovers, and food you throw away.", module:"Food", role:"direct", options:[
    {value:"very_low",label:"Very Little",note:"Meals are planned well",co2:.1,nature:1,water:1,material:1},{value:"some",label:"Some Leftovers Now and Then",note:"Some spoilage or uneaten food",co2:.4,nature:3,water:3,material:2},{value:"average",label:"About Average",note:"Standard household pattern",co2:.8,nature:5,water:5,material:3},{value:"high",label:"Quite a Bit Most Weeks",note:"Frequent uneaten food",co2:1.2,nature:8,water:7,material:5},
  ]},
  { key:"new_clothes", title:"How often do you buy new clothes or shoes?", help:"Includes clothing, shoes and accessories.", module:"Purchasing", role:"direct", options:[
    {value:"rare",label:"Rarely (mostly repair / secondhand)",note:"Very few new purchases",co2:.2,nature:1,water:2,material:1},{value:"occasional",label:"A Few Times a Year",note:"Seasonal basics",co2:.5,nature:3,water:10,material:3},{value:"monthly",label:"New Items Most Months",note:"Regular clothing shopping",co2:1,nature:6,water:20,material:6},{value:"frequent",label:"Frequent Refreshes / Trend-led",note:"High-turnover clothing buying",co2:1.8,nature:12,water:35,material:10},
  ]},
  { key:"other_stuff", title:"How often do you buy new things for yourself or your home, like electronics, décor, furniture, hobby gear, or replacement items?", help:"Excludes groceries and clothing.", module:"Purchasing", role:"direct", options:[
    {value:"rare",label:"Rarely",note:"Repair-first, light buying",co2:.2,nature:1,water:1,material:2},{value:"occasional",label:"A Few Times a Year",note:"Moderate replacement cycle",co2:.6,nature:3,water:3,material:8},{value:"bimonthly",label:"Every Month or Two",note:"Regular convenience buying",co2:1.2,nature:5,water:5,material:16},{value:"monthly",label:"Most Months",note:"Frequent retail orders",co2:2,nature:8,water:8,material:24},{value:"heavy",label:"Large or Frequent Purchases",note:"Constant flow of new goods",co2:3.5,nature:12,water:12,material:38},
  ]},
];
const footprintQuestions = SharedFootprintModel.PERSONAL_FOOTPRINT_QUESTIONS as unknown as FootprintQuestion[];

const baselineAnswers = SharedFootprintModel.PERSONAL_FOOTPRINT_BASELINE_SELECTIONS as Record<string,string>;
const footprintFactors = { land:SharedFootprintModel.PERSONAL_FOOTPRINT_PHYSICAL_FACTORS.landM2PerPoint, water:SharedFootprintModel.PERSONAL_FOOTPRINT_PHYSICAL_FACTORS.waterM3PerPoint, material:SharedFootprintModel.PERSONAL_FOOTPRINT_PHYSICAL_FACTORS.materialTonnesPerPoint };
const footprintBreakdownColors = ["#60a5fa","#22d3ee","#4ade80","#c4b5fd","#fbbf24","#fb7185","#a3e635","#f97316"];
const footprintBreakdownLabels = SharedFootprintModel.PERSONAL_FOOTPRINT_LABELS as Record<string,string>;

function footprintOption(key: string, value: string) {
  return footprintQuestions.find((question) => question.key === key)?.options.find((option) => option.value === value);
}

function calculateFootprintMobileSnapshot(answers: FootprintAnswer) {
  const resolved = (key: string) => answers[key] || baselineAnswers[key];
  const geography = footprintOption("geography", resolved("geography"));
  const hvac = footprintOption("hvac", resolved("hvac"));
  const household = footprintOption("household_size", resolved("household_size"));
  const homeType = footprintOption("home_type", resolved("home_type"));
  const homeEnergy = footprintOption("home_energy", resolved("home_energy"));
  const householdFactor = household?.homeMultiplier || 1;
  const hvacFactor = hvac?.hvacMultiplier || 1;
  const homeDemand = homeType?.homeDemandMultiplier || 1;
  const homeUse = homeEnergy?.homeUseMultiplier || 1;
  const homeCarbon = (geography?.homeBaselineCarbon || 3) * householdFactor * hvacFactor * homeDemand * homeUse;
  const totals = { carbon: 0, nature: 0, water: 0, material: 0 };
  const breakdown: Array<{ key:string; label:string; module:string; carbon:number; nature:number; water:number; material:number }> = [];

  footprintQuestions.filter((question) => question.role === "direct").forEach((question) => {
    const option = footprintOption(question.key, resolved(question.key));
    let factor = 1;
    if (question.key === "everyday_travel") factor = geography?.transportMultiplier || 1;
    if (question.key === "flights") factor = geography?.flightsMultiplier || 1;
    const carbon = question.key === "home_type" ? homeCarbon * .55 : question.key === "home_energy" ? homeCarbon * .45 : (option?.co2 || 0) * factor;
    const isHomeQuestion = question.key === "home_type" || question.key === "home_energy";
    const natureWaterFactor = question.key === "home_energy"
      ? householdFactor * hvacFactor * homeUse
      : question.key === "home_type"
        ? householdFactor * hvacFactor
        : factor;
    const materialFactor = isHomeQuestion ? householdFactor : factor;
    const nature = (option?.nature || 0) * natureWaterFactor;
    const water = (option?.water || 0) * natureWaterFactor;
    const material = (option?.material || 0) * materialFactor;
    totals.carbon += carbon;
    totals.nature += nature;
    totals.water += water;
    totals.material += material;
    breakdown.push({ key:question.key,label:footprintBreakdownLabels[question.key] || question.title,module:question.module,carbon,nature,water,material });
  });

  const sectionSummaries = ["Home","Travel","Food","Purchasing"].map((label) => {
    const items = breakdown.filter((item) => item.module === label);
    const carbon = items.reduce((sum,item) => sum + item.carbon,0);
    const nature = items.reduce((sum,item) => sum + item.nature,0);
    const water = items.reduce((sum,item) => sum + item.water,0);
    const material = items.reduce((sum,item) => sum + item.material,0);
    return {
      label,
      carbon: Math.round(carbon * 10) / 10,
      land: Math.round((nature * footprintFactors.land) / 10) * 10,
      water: Math.round((water * footprintFactors.water) / 10) * 10,
      material: Math.round(material * footprintFactors.material * 10) / 10,
    };
  });
  return {
    carbon: Math.round(totals.carbon * 10) / 10,
    land: Math.round((totals.nature * footprintFactors.land) / 10) * 10,
    water: Math.round((totals.water * footprintFactors.water) / 10) * 10,
    material: Math.round(totals.material * footprintFactors.material * 10) / 10,
    answered: Object.values(answers).filter(Boolean).length,
    region: geography?.label || "Average baseline",
    breakdown: [...breakdown].sort((a,b) => b.carbon - a.carbon),
    sectionSummaries,
  };
}

const calculateFootprint = (answers:FootprintAnswer) => SharedFootprintModel.calculatePersonalFootprint(answers) as FootprintResult;

function cloneQuickStartVisual(source:HTMLElement) {
  const clone = source.cloneNode(true) as HTMLElement;
  const sourceElements = [source,...Array.from(source.querySelectorAll<HTMLElement>("*"))];
  const cloneElements = [clone,...Array.from(clone.querySelectorAll<HTMLElement>("*"))];
  sourceElements.forEach((sourceElement,index) => {
    const cloneElement = cloneElements[index];
    if (!cloneElement) return;
    const computedStyle = window.getComputedStyle(sourceElement);
    for (const property of Array.from(computedStyle)) {
      cloneElement.style.setProperty(property,computedStyle.getPropertyValue(property),computedStyle.getPropertyPriority(property));
    }
    cloneElement.removeAttribute("id");
    cloneElement.removeAttribute("data-quick-start");
    cloneElement.removeAttribute("aria-live");
    cloneElement.setAttribute("tabindex","-1");
    if (sourceElement instanceof HTMLInputElement && cloneElement instanceof HTMLInputElement) cloneElement.value = sourceElement.value;
    if (sourceElement instanceof HTMLCanvasElement && cloneElement instanceof HTMLCanvasElement) {
      cloneElement.width = sourceElement.width;
      cloneElement.height = sourceElement.height;
      try {
        cloneElement.getContext("2d")?.drawImage(sourceElement,0,0);
      } catch {
        // The live canvas remains interactive underneath if a browser declines to copy its pixels.
      }
    }
  });
  clone.setAttribute("aria-hidden","true");
  return clone;
}

function QuickStartTour({ stepIndex, onAdvance, onSkip }: { stepIndex:number; onAdvance:() => void; onSkip:() => void }) {
  const step = QUICK_START_STEPS[stepIndex];
  const [spotlight,setSpotlight] = useState<QuickStartRect | null>(null);
  const [gestureDemoComplete,setGestureDemoComplete] = useState(step.id !== "explore-spin");
  const [spinExplorationProgress,setSpinExplorationProgress] = useState(0);
  const [awaitingAnalyseConfirmation,setAwaitingAnalyseConfirmation] = useState(false);
  const highlightRef = useRef<HTMLDivElement>(null);
  const gestureDemoCompleteRef = useRef(gestureDemoComplete);
  const pendingAnalyseNodeRef = useRef<string | null>(null);
  const onAdvanceRef = useRef(onAdvance);
  onAdvanceRef.current = onAdvance;
  gestureDemoCompleteRef.current = gestureDemoComplete;

  useEffect(() => {
    pendingAnalyseNodeRef.current = null;
    setAwaitingAnalyseConfirmation(false);
    setSpinExplorationProgress(0);
  },[step.id]);

  useEffect(() => {
    if (step.id !== "explore-spin") {
      setGestureDemoComplete(true);
      return;
    }
    setGestureDemoComplete(false);
    gestureDemoCompleteRef.current = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion ? 160 : 2550;
    const startedAt = performance.now();
    let animationFrame = 0;
    const animateGesture = (now:number) => {
      const linearProgress = Math.min(1,(now - startedAt) / duration);
      const progress = 1 - Math.pow(1 - linearProgress,3);
      const directionProgress = linearProgress <= .5
        ? 1 - Math.pow(1 - (linearProgress / .5),3)
        : 1 - (1 - Math.pow(1 - ((linearProgress - .5) / .5),3)) * 1.35;
      window.dispatchEvent(new CustomEvent("tulip:quick-start-spin-demo",{detail:{progress,rotationOffset:directionProgress}}));
      if (linearProgress < 1) {
        animationFrame = window.requestAnimationFrame(animateGesture);
        return;
      }
      setGestureDemoComplete(true);
    };
    animationFrame = window.requestAnimationFrame(animateGesture);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.dispatchEvent(new CustomEvent("tulip:quick-start-spin-demo",{detail:{cancelled:true}}));
    };
  },[step.id]);

  useEffect(() => {
    const app = document.querySelector<HTMLElement>(".tulip-app");
    if (!app) return;
    let advanceTimer:number | null = null;
    let advanceScheduled = false;
    let exploredSpinDistance = 0;
    let targetPointer:{ id:number; x:number; y:number } | null = null;
    const scheduleAdvance = (delay = 180) => {
      if (advanceScheduled) return;
      advanceScheduled = true;
      advanceTimer = window.setTimeout(() => onAdvanceRef.current(),delay);
    };
    const handleDocumentClick = (event:MouseEvent) => {
      if (QUICK_START_LIVE_STEPS.has(step.id) || step.id === "analyse-inspector") return;
      const target = app.querySelector<HTMLElement>(step.target);
      if (!target || !(event.target instanceof Node) || !target.contains(event.target)) return;
      scheduleAdvance();
    };
    const handlePointerDown = (event:PointerEvent) => {
      const target = app.querySelector<HTMLElement>(step.target);
      targetPointer = target && event.target instanceof Node && target.contains(event.target)
        ? {id:event.pointerId,x:event.clientX,y:event.clientY}
        : null;
    };
    const handlePointerUp = (event:PointerEvent) => {
      const pointer = targetPointer;
      targetPointer = null;
      if (!pointer || pointer.id !== event.pointerId) return;
      const movement = Math.hypot(event.clientX - pointer.x,event.clientY - pointer.y);
      if (step.id === "explore-spin") {
        if (!gestureDemoCompleteRef.current || movement < 28) return;
        exploredSpinDistance += movement;
        const progress = Math.min(1,exploredSpinDistance / 180);
        setSpinExplorationProgress(progress);
        if (progress >= 1) scheduleAdvance(1100);
        return;
      }
      if (QUICK_START_LIVE_STEPS.has(step.id)) return;
      if (movement <= ACCIDENTAL_TOUCH_SLOP) scheduleAdvance();
    };
    const handlePointerCancel = () => { targetPointer = null; };
    const handleExploreNodeTap = (event:Event) => {
      const nodeId = String((event as CustomEvent<{id?:string}>).detail?.id || "");
      if (step.id === "explore-node") {
        scheduleAdvance();
        return;
      }
      if (step.id !== "explore-open-analyse" || !nodeId) return;
      if (pendingAnalyseNodeRef.current === nodeId) {
        scheduleAdvance();
        return;
      }
      pendingAnalyseNodeRef.current = nodeId;
      setAwaitingAnalyseConfirmation(true);
    };
    const handleExploreReset = () => {
      if (step.id === "explore-reset") scheduleAdvance();
    };
    const handleAnalyseInspectorState = (event:Event) => {
      const expanded = Boolean((event as CustomEvent<{expanded?:boolean}>).detail?.expanded);
      if (step.id === "analyse-collapse" && !expanded) scheduleAdvance();
    };
    const handleAnalyseNodeTap = () => {
      if (step.id === "analyse-node") scheduleAdvance();
    };
    const handleScroll = (event:Event) => {
      if (step.id !== "analyse-scroll" || !(event.target instanceof HTMLElement)) return;
      if (!event.target.matches(".analyse-scroll .mobile-scroll") || event.target.scrollTop < 36) return;
      scheduleAdvance();
    };
    const measure = () => {
      const target = app.querySelector<HTMLElement>(step.target);
      if (!target) {
        setSpotlight(null);
        return;
      }
      const appRect = app.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const padding = step.padding || 0;
      let x = targetRect.left - appRect.left - padding;
      let y = targetRect.top - appRect.top - padding;
      let width = targetRect.width + (padding * 2);
      let height = targetRect.height + (padding * 2);
      if (step.spotlight === "canvas-center") {
        const size = Math.max(240,Math.min(appRect.width - 20,appRect.height - 330));
        x = (targetRect.left - appRect.left) + (targetRect.width - size) / 2;
        y = (targetRect.top - appRect.top) + (targetRect.height - size) / 2;
        width = size;
        height = size;
      }
      x = Math.max(8,Math.min(appRect.width - width - 8,x));
      y = Math.max(8,Math.min(appRect.height - height - 8,y));
      setSpotlight({
        x,
        y,
        width,
        height,
        targetX:targetRect.left - appRect.left,
        targetY:targetRect.top - appRect.top,
        targetWidth:targetRect.width,
        targetHeight:targetRect.height,
        containerWidth:appRect.width,
        containerHeight:appRect.height,
      });
    };
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(app);
    const mutationObserver = new MutationObserver((mutations) => {
      if (mutations.every((mutation) => (mutation.target as Element).closest?.(".quick-start-layer"))) return;
      measure();
    });
    mutationObserver.observe(app,{childList:true,subtree:true});
    window.addEventListener("pointerdown",handlePointerDown,true);
    window.addEventListener("pointerup",handlePointerUp,true);
    window.addEventListener("pointercancel",handlePointerCancel,true);
    window.addEventListener("click",handleDocumentClick,true);
    window.addEventListener("tulip:explore-node-tap",handleExploreNodeTap);
    window.addEventListener("tulip:explore-reset",handleExploreReset);
    window.addEventListener("tulip:analyse-inspector-state",handleAnalyseInspectorState);
    window.addEventListener("tulip:analyse-node-tap",handleAnalyseNodeTap);
    window.addEventListener("scroll",handleScroll,true);
    window.addEventListener("resize",measure);
    const firstFrame = window.requestAnimationFrame(measure);
    const settleTimer = window.setTimeout(measure,260);
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.clearTimeout(settleTimer);
      if (advanceTimer !== null) window.clearTimeout(advanceTimer);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("pointerdown",handlePointerDown,true);
      window.removeEventListener("pointerup",handlePointerUp,true);
      window.removeEventListener("pointercancel",handlePointerCancel,true);
      window.removeEventListener("click",handleDocumentClick,true);
      window.removeEventListener("tulip:explore-node-tap",handleExploreNodeTap);
      window.removeEventListener("tulip:explore-reset",handleExploreReset);
      window.removeEventListener("tulip:analyse-inspector-state",handleAnalyseInspectorState);
      window.removeEventListener("tulip:analyse-node-tap",handleAnalyseNodeTap);
      window.removeEventListener("scroll",handleScroll,true);
      window.removeEventListener("resize",measure);
    };
  },[step]);

  useEffect(() => {
    const app = document.querySelector<HTMLElement>(".tulip-app");
    const target = app?.querySelector<HTMLElement>(step.target);
    const highlight = highlightRef.current;
    if (!app || !target || !highlight || !spotlight) return;
    if (QUICK_START_LIVE_STEPS.has(step.id)) {
      highlight.replaceChildren();
      return;
    }
    const visual = cloneQuickStartVisual(target);
    visual.classList.add("quick-start-visual-clone");
    visual.style.position = "absolute";
    visual.style.left = `${spotlight.targetX - spotlight.x}px`;
    visual.style.top = `${spotlight.targetY - spotlight.y}px`;
    visual.style.width = `${spotlight.targetWidth}px`;
    visual.style.height = `${spotlight.targetHeight}px`;
    visual.style.margin = "0";
    visual.style.pointerEvents = "none";
    visual.style.userSelect = "none";
    visual.style.animation = "none";
    visual.style.transition = "none";
    highlight.replaceChildren(visual);
    return () => highlight.replaceChildren();
  },[spotlight,step]);

  useEffect(() => {
    if (step.id !== "analyse-inspector" || !spotlight) return;
    document.querySelector<HTMLButtonElement>('.analysis-sheet-handle[aria-label="Expand node inspector"]')?.click();
    const timer = window.setTimeout(() => onAdvanceRef.current(),1400);
    return () => window.clearTimeout(timer);
  },[spotlight,step.id]);

  useEffect(() => {
    const handleKeyDown = (event:KeyboardEvent) => {
      if (event.key === "Escape") onSkip();
    };
    window.addEventListener("keydown",handleKeyDown);
    return () => window.removeEventListener("keydown",handleKeyDown);
  },[onSkip]);

  if (!spotlight) {
    return <div className="quick-start-layer is-waiting" role="dialog" aria-label="Quick Start guide" data-step={step.id}><section className="quick-start-panel quick-start-panel-centered"><h2>Getting this step ready…</h2><div className="quick-start-actions"><button className="quick-start-skip" onClick={onSkip}>Skip</button></div></section></div>;
  }

  const {x,y,width,height,containerWidth,containerHeight} = spotlight;
  const belowSpace = containerHeight - (y + height);
  const aboveSpace = y;
  const placement = step.placement === "above"
    ? (aboveSpace >= 166 || belowSpace < aboveSpace ? "above" : "below")
    : (belowSpace >= 166 || aboveSpace < belowSpace ? "below" : "above");
  const panelStyle = placement === "above"
    ? { bottom:Math.max(16,containerHeight - y + 14) }
    : { top:Math.max(16,y + height + 14) };
  const blockerStyles:CSSProperties[] = [
    {left:0,top:0,width:containerWidth,height:y},
    {left:0,top:y,width:x,height},
    {left:x + width,top:y,width:Math.max(0,containerWidth - x - width),height},
    {left:0,top:y + height,width:containerWidth,height:Math.max(0,containerHeight - y - height)},
  ];
  const highlightStyle = {left:x,top:y,width,height} as CSSProperties;
  const isLiveSurfaceStep = QUICK_START_LIVE_STEPS.has(step.id);
  return <div className="quick-start-layer" role="dialog" aria-label="Quick Start guide" data-step={step.id}>
    {!isLiveSurfaceStep ? <div className="quick-start-dimmer" aria-hidden="true" /> : null}
    {!isLiveSurfaceStep ? blockerStyles.map((style,index) => <div className="quick-start-blocker" style={style} key={index} />) : null}
    <div ref={highlightRef} className="quick-start-highlight" style={highlightStyle} aria-hidden="true" />
    {step.id === "explore-spin" && !gestureDemoComplete ? <>
      <div className="quick-start-target-lock" aria-hidden="true" />
      <div className="quick-start-spin-demo" style={highlightStyle} aria-hidden="true">
        <i className="quick-start-touch-dot is-primary" />
        <i className="quick-start-touch-dot is-echo" />
      </div>
    </> : null}
    <section className={`quick-start-panel is-${placement}`} style={panelStyle} aria-live="polite">
      <div className="quick-start-progress" aria-label={`Step ${stepIndex + 1} of ${QUICK_START_STEPS.length}`}><i style={{width:`${((stepIndex + 1) / QUICK_START_STEPS.length) * 100}%`}} /></div>
      <h2>{step.title}</h2>
      <p>{step.id === "explore-spin" && gestureDemoComplete
        ? spinExplorationProgress >= 1
          ? "Great—watch the globe settle."
          : spinExplorationProgress >= .45
            ? "Keep spinning—try another direction."
            : "Now drag the globe freely to explore."
        : step.id === "explore-open-analyse" && awaitingAnalyseConfirmation
          ? "Now tap that same node again to open Analyse."
          : step.body}</p>
    </section>
    <button className="quick-start-skip-menu" onClick={onSkip}>Skip</button>
  </div>;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? "brand-compact" : ""}`} aria-label="The Tulip Project">{!compact ? <img src="/assets/tulip/logo-monogram.svg" alt="" /> : null}<span>THE<br className={compact ? "brand-break" : ""} /> TULIP<br className={compact ? "brand-break" : ""} /> PROJECT</span></div>;
}

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

function ExploreTopBar({ onOpenInfo, onStartQuickStart }: { onOpenInfo:(section:ExploreInfoSection) => void; onStartQuickStart:() => void }) {
  const [menuOpen,setMenuOpen] = useState(false);
  const nativeBridge = (window as Window & { TULIPNative?:TulipNativeBridge }).TULIPNative;
  useEffect(() => {
    if (!menuOpen) return;
    const dismissWithKeyboard = (event:KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown",dismissWithKeyboard);
    return () => {
      document.removeEventListener("keydown",dismissWithKeyboard);
    };
  },[menuOpen]);
  const openInfo = (section:ExploreInfoSection) => {
    setMenuOpen(false);
    onOpenInfo(section);
  };
  const share = () => {
    setMenuOpen(false);
    nativeBridge?.share({
      title:"The TULIP Project",
      text:"Explore how environmental causes and consequences connect with The TULIP Project.",
      url:"https://tulip-project-six.vercel.app/",
    });
  };
  const startQuickStart = () => {
    setMenuOpen(false);
    onStartQuickStart();
  };
  const menu = <section className="explore-menu-screen" role="dialog" aria-modal="true" aria-labelledby="explore-menu-title"><header><h1 id="explore-menu-title">Menu</h1><button className="explore-menu-cancel" onClick={() => setMenuOpen(false)} aria-label="Close TULIP menu">Cancel</button></header><nav className="explore-menu-popover" role="menu"><div className="explore-menu-items"><button role="menuitem" onClick={startQuickStart}>Quick Start</button>{([['score','TULIP Score'],['sources','Sources'],['registries','Registries'],['about','About'],['contact','Contact'],['privacy','Privacy']] as Array<[ExploreInfoSection,string]>).map(([section,label]) => <button key={section} role="menuitem" onClick={() => openInfo(section)}>{label}</button>)}{nativeBridge ? <button role="menuitem" onClick={share}>Share TULIP</button> : null}</div></nav></section>;
  return <header className="top-bar explore-top-bar"><Brand /><div className="explore-menu-wrap"><button className="icon-button explore-menu-button" onClick={() => setMenuOpen(true)} aria-label="Open TULIP menu" aria-expanded={menuOpen} aria-hidden={menuOpen || undefined} tabIndex={menuOpen ? -1 : 0}><HamburgerMenuIcon width={27} height={27} /></button>{menuOpen ? createPortal(menu,document.querySelector(".tulip-app") || document.body) : null}</div></header>;
}

function BottomNav({ active, compact = false, onChange, onExploreLongPress }: { active: Screen; compact?:boolean; onChange: (screen: Screen) => void; onExploreLongPress:() => void }) {
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const scrubRef = useRef<{ pointerId:number; startX:number; startY:number; axis:"pending"|"horizontal"|"vertical"; moved:boolean; longPressTriggered:boolean } | null>(null);
  const scrubbedScreenRef = useRef<Screen | null>(null);
  const suppressClickRef = useRef(false);
  const longPressTimerRef = useRef<number | null>(null);
  const bounceFrameRef = useRef<number | null>(null);
  const bounceTimerRef = useRef<number | null>(null);
  const [scrubbedScreen, setScrubbedScreen] = useState<Screen | null>(null);
  const [bouncingScreen,setBouncingScreen] = useState<Screen | null>(null);
  useEffect(() => () => {
    if (bounceFrameRef.current !== null) window.cancelAnimationFrame(bounceFrameRef.current);
    if (bounceTimerRef.current !== null) window.clearTimeout(bounceTimerRef.current);
  },[]);
  const bounce = (screen:Screen) => {
    if (bounceFrameRef.current !== null) window.cancelAnimationFrame(bounceFrameRef.current);
    if (bounceTimerRef.current !== null) window.clearTimeout(bounceTimerRef.current);
    setBouncingScreen(null);
    bounceFrameRef.current = window.requestAnimationFrame(() => {
      bounceFrameRef.current = null;
      setBouncingScreen(screen);
      bounceTimerRef.current = window.setTimeout(() => {
        bounceTimerRef.current = null;
        setBouncingScreen(null);
      },380);
    });
  };
  const cancelLongPress = () => {
    if (longPressTimerRef.current !== null) window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  };
  const setIndicatorX = (x:number) => {
    const indicator = indicatorRef.current;
    const nav = navRef.current;
    if (!indicator || !nav) return;
    indicator.style.transform = `translate3d(${x}px,0,0) translateX(-50%)`;
    nav.classList.add("is-pill-ready");
  };
  const positionIndicatorAtScreen = (screen:Screen) => {
    const nav = navRef.current;
    const button = nav?.querySelector<HTMLButtonElement>(`.nav-item[data-screen="${screen}"]`);
    if (!nav || !button) return;
    setIndicatorX(button.offsetLeft + button.offsetWidth / 2);
  };
  const trackIndicatorAtX = (clientX:number) => {
    const nav = navRef.current;
    const buttons = [...(nav?.querySelectorAll<HTMLButtonElement>(".nav-item") || [])];
    if (!nav || !buttons.length) return;
    const navRect = nav.getBoundingClientRect();
    const renderedScale = nav.offsetWidth ? navRect.width / nav.offsetWidth : 1;
    const localX = (clientX - navRect.left) / Math.max(.01,renderedScale);
    const minimumX = buttons[0].offsetLeft + buttons[0].offsetWidth / 2;
    const lastButton = buttons[buttons.length - 1];
    const maximumX = lastButton.offsetLeft + lastButton.offsetWidth / 2;
    setIndicatorX(Math.min(maximumX,Math.max(minimumX,localX)));
  };
  useLayoutEffect(() => {
    const sync = () => {
      if (scrubRef.current?.axis !== "horizontal") positionIndicatorAtScreen(active);
    };
    sync();
    const observer = typeof ResizeObserver === "undefined" || !navRef.current ? null : new ResizeObserver(sync);
    if (observer && navRef.current) observer.observe(navRef.current);
    window.addEventListener("resize",sync);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize",sync);
    };
  },[active,compact]);
  const screenAtX = (clientX:number) => {
    const buttons = [...(navRef.current?.querySelectorAll<HTMLButtonElement>(".nav-item") || [])];
    let nearestScreen:Screen | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const button of buttons) {
      const screen = button.dataset.screen as Screen | undefined;
      if (!screen) continue;
      const rect = button.getBoundingClientRect();
      const distance = Math.abs(clientX - (rect.left + rect.width / 2));
      if (distance < nearestDistance) {
        nearestScreen = screen;
        nearestDistance = distance;
      }
    }
    return nearestScreen;
  };
  const previewAtX = (clientX:number) => {
    const next = screenAtX(clientX);
    trackIndicatorAtX(clientX);
    scrubbedScreenRef.current = next;
    setScrubbedScreen(next);
    return next;
  };
  const beginScrub = (event:ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const initialScreen = screenAtX(event.clientX);
    scrubbedScreenRef.current = initialScreen;
    scrubRef.current = { pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,axis:"pending",moved:false,longPressTriggered:false };
    event.currentTarget.setPointerCapture(event.pointerId);
    if (initialScreen === "explore") {
      cancelLongPress();
      longPressTimerRef.current = window.setTimeout(() => {
        if (!scrubRef.current || scrubRef.current.moved || scrubbedScreenRef.current !== "explore") return;
        scrubRef.current.longPressTriggered = true;
        suppressClickRef.current = true;
        onExploreLongPress();
      },520);
    }
  };
  const moveScrub = (event:ReactPointerEvent<HTMLElement>) => {
    const scrub = scrubRef.current;
    if (!scrub || scrub.pointerId !== event.pointerId) return;
    const dx = event.clientX - scrub.startX;
    const dy = event.clientY - scrub.startY;
    const distance = Math.hypot(dx,dy);
    if (distance >= 8 && scrub.axis === "pending") {
      if (Math.abs(dx) > Math.abs(dy) * 1.15) scrub.axis = "horizontal";
      else if (Math.abs(dy) > Math.abs(dx) * 1.15 || distance >= 16) scrub.axis = "vertical";
    }
    if (distance >= 8) {
      scrub.moved = true;
      cancelLongPress();
    }
    if (scrub.axis === "vertical") {
      scrubbedScreenRef.current = null;
      setScrubbedScreen(null);
      return;
    }
    if (scrub.axis !== "horizontal") return;
    navRef.current?.classList.add("is-scrubbing");
    const next = previewAtX(event.clientX);
    if (next !== "explore") cancelLongPress();
  };
  const finishScrub = (event:ReactPointerEvent<HTMLElement>) => {
    const scrub = scrubRef.current;
    if (!scrub || scrub.pointerId !== event.pointerId) return;
    cancelLongPress();
    if (scrub.axis === "vertical") {
      scrubRef.current = null;
      scrubbedScreenRef.current = null;
      setScrubbedScreen(null);
      suppressClickRef.current = true;
      window.setTimeout(() => { suppressClickRef.current = false; },0);
      return;
    }
    const next = screenAtX(event.clientX) || scrubbedScreenRef.current;
    if (scrub.axis === "horizontal") trackIndicatorAtX(event.clientX);
    scrubRef.current = null;
    scrubbedScreenRef.current = null;
    setScrubbedScreen(null);
    suppressClickRef.current = true;
    window.setTimeout(() => { suppressClickRef.current = false; },0);
    if (!scrub.longPressTriggered && next) {
      bounce(next);
      onChange(next);
    }
    window.requestAnimationFrame(() => positionIndicatorAtScreen(next || active));
  };
  const cancelScrub = () => {
    cancelLongPress();
    scrubRef.current = null;
    scrubbedScreenRef.current = null;
    setScrubbedScreen(null);
    window.requestAnimationFrame(() => positionIndicatorAtScreen(active));
  };
  const displayActive = scrubbedScreen || active;
  return <nav ref={navRef} className={`bottom-nav${compact ? " is-inspector-compact" : ""}${scrubbedScreen ? " is-scrubbing" : ""}`} aria-label="Primary navigation" onPointerDown={beginScrub} onPointerMove={moveScrub} onPointerUp={finishScrub} onPointerCancel={cancelScrub} onContextMenu={(event) => event.preventDefault()}><span ref={indicatorRef} className="nav-pill-indicator" aria-hidden="true" />{navItems.map(({ id, label, iconSrc }) => <button key={id} data-screen={id} data-quick-start={`nav-${id}`} className={`nav-item ${displayActive === id ? "active" : ""} ${bouncingScreen === id ? "is-bouncing" : ""}`} onClick={() => { if (suppressClickRef.current) return; bounce(id); onChange(id); }} aria-label={id === "explore" ? "Explore. Press and hold for filters." : label} aria-haspopup={id === "explore" ? "dialog" : undefined} aria-current={active === id ? "page" : undefined}><img className="nav-icon" src={iconSrc} alt="" aria-hidden="true" /></button>)}</nav>;
}

function ExploreScreen({ active, suspended, activeFilter, resetKey, onOpenInfo, onStartQuickStart, onAnalyse }: { active: boolean; suspended:boolean; activeFilter:string; resetKey:number; onOpenInfo:(section:ExploreInfoSection) => void; onStartQuickStart:() => void; onAnalyse: (name: string, origin?:AppPoint) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphRef = useRef<DesktopGraph | null>(null);
  const selectedNodeIdRef = useRef<string | null>(null);
  const selectedZoomRef = useRef<number | null>(null);
  const preSelectionViewRef = useRef<{ rotationX:number; rotationY:number; cameraX:number; cameraY:number; zoom:number } | null>(null);
  const activeFilterRef = useRef(activeFilter);
  activeFilterRef.current = activeFilter;

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => undefined;
    // The graph engine is the heaviest executable module in the phone build.
    // Load it only when Explore mounts so deep links to Analyse, Activity, and
    // Footprint can become interactive without parsing the sphere renderer.
    // @ts-ignore -- the production graph module is JavaScript outside this TS project.
    void loadGraphResources().then(({ TulipGraph,graphSnapshot }) => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const stage = canvas.parentElement;
      if (!stage) return;
      const previousUiScale = document.documentElement.style.getPropertyValue("--ui-scale");

      const graph = new TulipGraph(
      canvas,
      createMobileGraphNodes(graphSnapshot.graphNodes),
      createMobileGraphEdges(graphSnapshot.graphEdges),
      (node: DesktopNode, interaction?:{ motionOrigin?:AppPoint }) => {
        canvas.dispatchEvent(new CustomEvent("tulip:explore-node-tap",{bubbles:true,detail:{id:node.id,name:node.name}}));
        if (selectedNodeIdRef.current === node.id) {
          const canvasRect = canvas.getBoundingClientRect();
          const scale = canvas.clientWidth > 0 ? canvasRect.width / canvas.clientWidth : 1;
          const origin = interaction?.motionOrigin
            ? {
                x:(interaction.motionOrigin.x - canvasRect.left) / Math.max(scale,.001),
                y:(interaction.motionOrigin.y - canvasRect.top) / Math.max(scale,.001),
              }
            : undefined;
          onAnalyse(node.name,origin);
          return;
        }
        selectedZoomRef.current = graphRef.current?.targetCamera?.zoom ?? graphRef.current?.camera.zoom ?? EXPLORE_MOBILE_ZOOM;
        if (!preSelectionViewRef.current) {
          preSelectionViewRef.current = {
            rotationX:graph.rotationX,
            rotationY:graph.rotationY,
            cameraX:graph.camera.x,
            cameraY:graph.camera.y,
            zoom:selectedZoomRef.current,
          };
        }
        selectedNodeIdRef.current = node.id;
        canvas.dataset.selectedNodeId = node.id;
        canvas.dataset.selectionZoom = selectedZoomRef.current.toFixed(4);
      },
    ) as DesktopGraph;
      graphRef.current = graph;
    graph.exportBackgroundColor = "#000000";
    graph.mobileLineOpacityMultiplier = .408;
    canvas.dataset.mobileLineOpacityMultiplier = graph.mobileLineOpacityMultiplier.toFixed(3);
    graph.mobileLineWidthMultiplier = .88;
    graph.mobileAmbientEdgeStride = 2;
    graph.mobileHighlightedLabelColor = "#ffffff";
    graph.mobileAutoRotateSpeedMultiplier = 1.4;
    canvas.dataset.highlightedLabelColor = graph.mobileHighlightedLabelColor;
    canvas.dataset.autoRotateSpeedMultiplier = String(graph.mobileAutoRotateSpeedMultiplier);
    graph.disableEdgeIgnition = true;
    // Match the native display: ProMotion devices can render at 120 Hz while
    // standard displays retain the 60 Hz ceiling. Use a conservative 60 Hz
    // fallback for ordinary web previews where native display data is absent.
    const nativeMaximumFps = Number((window as Window & { __TULIP_NATIVE_MAX_FPS__?:number }).__TULIP_NATIVE_MAX_FPS__);
    const supportsProMotion = Number.isFinite(nativeMaximumFps) && nativeMaximumFps >= 100;
    const targetRefreshRate = supportsProMotion ? 120 : 60;
    graph.targetFrameDurationMs = supportsProMotion ? 8 : 16;
    graph.idleFrameDurationMs = graph.targetFrameDurationMs;
    canvas.dataset.idleFrameDurationMs = String(graph.idleFrameDurationMs);
    canvas.dataset.targetFrameDurationMs = String(graph.targetFrameDurationMs);
    canvas.dataset.targetRefreshRate = String(targetRefreshRate);
    const isNativeApp = Boolean((window as Window & { __TULIP_NATIVE_APP__?:boolean }).__TULIP_NATIVE_APP__);
    const originalDraw = graph.draw.bind(graph);
    let interactionQualityActive:boolean | null = null;
    let hasPresentedFirstFrame = false;
    const applyAdaptiveNativeResolution = (interacting:boolean) => {
      if (!isNativeApp || interactionQualityActive === interacting) return;
      interactionQualityActive = interacting;
      const width = Math.max(1,graph.width || stage.clientWidth);
      const height = Math.max(1,graph.height || stage.clientHeight);
      const maximumDpr = interacting
        ? EXPLORE_NATIVE_INTERACTION_MAX_RENDER_PIXEL_RATIO
        : EXPLORE_NATIVE_REST_MAX_RENDER_PIXEL_RATIO;
      const pixelBudget = interacting
        ? EXPLORE_NATIVE_INTERACTION_RENDER_PIXEL_BUDGET
        : EXPLORE_NATIVE_REST_RENDER_PIXEL_BUDGET;
      const budgetDpr = Math.sqrt(pixelBudget / Math.max(1,width * height));
      const dpr = Math.max(1,Math.min(window.devicePixelRatio || 1,maximumDpr,budgetDpr));
      graph.renderPixelRatio = dpr;
      canvas.width = Math.max(1,Math.round(width * dpr));
      canvas.height = Math.max(1,Math.round(height * dpr));
      canvas.dataset.renderPixelRatio = dpr.toFixed(2);
      canvas.dataset.renderQuality = interacting ? "interaction" : "rest";
      graph.targetFrameDurationMs = interacting && supportsProMotion ? 8 : 16;
      graph.idleFrameDurationMs = 16;
      canvas.dataset.targetRefreshRate = String(interacting && supportsProMotion ? 120 : 60);
      canvas.dataset.targetFrameDurationMs = String(graph.targetFrameDurationMs);
      canvas.dataset.idleFrameDurationMs = String(graph.idleFrameDurationMs);
    };
    graph.draw = () => {
      applyAdaptiveNativeResolution(Boolean(
        graph.isDraggingGlobe
        || graph.isPanningCamera
        || graph.touchGesture
        || graph.touchMomentum
      ));
      originalDraw();
      if (!hasPresentedFirstFrame) {
        hasPresentedFirstFrame = true;
        canvas.dataset.firstFrameRendered = "true";
      }
    };
    graph.touchTapSlop = ACCIDENTAL_TOUCH_SLOP;
    graph.minimumManualZoom = EXPLORE_MOBILE_ZOOM * .8;
    graph.maximumManualZoom = EXPLORE_MOBILE_ZOOM * 1.4;
    canvas.dataset.startingZoom = EXPLORE_MOBILE_ZOOM.toFixed(4);
    canvas.dataset.minimumZoom = graph.minimumManualZoom.toFixed(4);
    canvas.dataset.maximumZoom = graph.maximumManualZoom.toFixed(4);
    canvas.dataset.cameraOriginLocked = "true";
    // The desktop focus view intentionally excludes its active node from hit
    // testing. Explore uses that same focus renderer for its first-tap reveal,
    // but needs the active node to remain tappable so a second tap can confirm
    // the selection and open Analyse.
    const isDesktopInteractiveFocusNode = graph.isNodeInteractiveInAnalyze.bind(graph);
    graph.isNodeInteractiveInAnalyze = (node: DesktopNodeData) => (
      node.id === graph.selectedNode?.id || isDesktopInteractiveFocusNode(node)
    );
    const lockExploreCameraOrigin = () => {
      const originX = graph.width / 2;
      const originY = graph.height / 2 + EXPLORE_CAMERA_VERTICAL_OFFSET;
      graph.camera.x = originX;
      graph.camera.y = originY;
      if (graph.targetCamera) {
        graph.targetCamera.x = originX;
        graph.targetCamera.y = originY;
      }
      const encodedOrigin = `${originX.toFixed(1)},${originY.toFixed(1)}`;
      if (canvas.dataset.cameraOrigin !== encodedOrigin) canvas.dataset.cameraOrigin = encodedOrigin;
    };
    const originalUpdatePhysics = graph.updatePhysics.bind(graph);
    const mobileNodeById = new Map(graph.nodes.map((node) => [node.id,node]));
    let lastAmbientFillAt = 0;
    graph.updatePhysics = (...args:any[]) => {
      originalUpdatePhysics(...args);
      lockExploreCameraOrigin();
      if (graph.isFocusMode || graph.selectedNode) return;
      const targetCount = 7;
      const activeNodes = graph.ambientHighlights
        .map((id) => mobileNodeById.get(id))
        .filter(Boolean) as DesktopNodeData[];
      const activeSetIsValid = activeNodes.length >= targetCount && activeNodes.every((node) => (
        graph.activeFilter === "all" || node.sphere === graph.activeFilter
      ));
      if (activeSetIsValid) return;
      const now = performance.now();
      if (now - lastAmbientFillAt < 180) return;
      lastAmbientFillAt = now;
      const activeIds = new Set(activeNodes.map((node) => node.id));
      const candidates = graph.nodes
        .filter((node) => !activeIds.has(node.id))
        .filter((node) => graph.activeFilter === "all" || node.sphere === graph.activeFilter)
        .filter((node) => !node.name.startsWith("North Atlantic") || node.isNorthAtlanticHighlightEligible)
        .filter((node) => Number(node.z ?? -1) >= .14);
      while (activeNodes.length < targetCount && candidates.length) {
        let bestIndex = 0;
        let bestScore = -Infinity;
        candidates.forEach((node,index) => {
          const priority = Math.max(.1,Number(node.tulipScore ?? node.score?.baseline ?? 0));
          const distance = activeNodes.length
            ? Math.min(...activeNodes.map((activeNode) => Math.hypot(
                Number(node.sphereX ?? 0) - Number(activeNode.sphereX ?? 0),
                Number(node.sphereY ?? 0) - Number(activeNode.sphereY ?? 0),
                Number(node.sphereZ ?? 0) - Number(activeNode.sphereZ ?? 0),
              )))
            : 1;
          const score = priority * Math.max(.25,distance) * (.55 + Math.max(0,Number(node.z ?? 0)));
          if (score > bestScore) {
            bestScore = score;
            bestIndex = index;
          }
        });
        const [nextNode] = candidates.splice(bestIndex,1);
        activeNodes.push(nextNode);
        activeIds.add(nextNode.id);
      }
      graph.ambientHighlights = activeNodes.map((node) => node.id);
      graph.ambientHighlightSet = new Set(graph.ambientHighlights);
    };
    const graphContext = graph.ctx;
    const originalFillText = graphContext.fillText.bind(graphContext);
    graphContext.fillText = (text:string,x:number,y:number,maxWidth?:number) => {
      graphContext.save();
      const isAmbientRotation = !graph.isFocusMode && !graph.selectedNode && !selectedNodeIdRef.current;
      graphContext.shadowColor = isAmbientRotation ? "rgba(0,0,0,.96)" : "rgba(0,0,0,0)";
      graphContext.shadowBlur = isAmbientRotation ? (isNativeApp ? 3 : 7) : 0;
      graphContext.shadowOffsetX = 0;
      graphContext.shadowOffsetY = isAmbientRotation ? 2 : 0;
      if (maxWidth === undefined) originalFillText(text,x,y);
      else originalFillText(text,x,y,maxWidth);
      graphContext.restore();
    };
    const fitDesktopCamera = graph.zoomToFit.bind(graph);
    graph.zoomToFit = () => {
      if (graph.isFocusMode && graph.layoutMode === "network") {
        graph.targetCamera = null;
        graph.camera.x = graph.width / 2;
        graph.camera.y = graph.height / 2 + EXPLORE_CAMERA_VERTICAL_OFFSET;
        graph.camera.zoom = selectedZoomRef.current ?? graph.camera.zoom;
        canvas.dataset.cameraZoom = graph.camera.zoom.toFixed(4);
        graph.requestRender();
        return;
      }
      fitDesktopCamera();
    };

    const resizeForPrototype = () => {
      const width = Math.max(1, stage.clientWidth);
      const height = Math.max(1, stage.clientHeight);
      const visualScale = stage.getBoundingClientRect().width / width;
      document.documentElement.style.setProperty("--ui-scale", String(visualScale || 1));
      const nativeDpr = window.devicePixelRatio || 1;
      const maximumDpr = isNativeApp ? EXPLORE_NATIVE_REST_MAX_RENDER_PIXEL_RATIO : EXPLORE_MAX_RENDER_PIXEL_RATIO;
      const pixelBudget = isNativeApp ? EXPLORE_NATIVE_REST_RENDER_PIXEL_BUDGET : EXPLORE_RENDER_PIXEL_BUDGET;
      const pixelBudgetDpr = Math.sqrt(pixelBudget / Math.max(1,width * height));
      const dpr = Math.max(1,Math.min(nativeDpr,maximumDpr,pixelBudgetDpr));
      graph.width = width;
      graph.height = height;
      graph.renderPixelRatio = dpr;
      canvas.dataset.renderPixelRatio = dpr.toFixed(2);
      canvas.dataset.maximumRenderPixelRatio = String(maximumDpr);
      interactionQualityActive = null;
      graph.sphereRadius = Math.min(width, height) * 0.55;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      if (!graph.isFocusMode) {
        graph.defaultZoom = EXPLORE_MOBILE_ZOOM;
        graph.camera.zoom = EXPLORE_MOBILE_ZOOM;
        graph.camera.x = width / 2;
        graph.camera.y = height / 2 + EXPLORE_CAMERA_VERTICAL_OFFSET;
      }
      lockExploreCameraOrigin();
      graph.requestRender();
    };
    graph.resizeCanvas = resizeForPrototype;

    const clearExploreFocus = () => {
      if (!selectedNodeIdRef.current && !graph.isFocusMode) return;
      const preSelectionView = preSelectionViewRef.current;
      selectedNodeIdRef.current = null;
      selectedZoomRef.current = null;
      preSelectionViewRef.current = null;
      delete canvas.dataset.selectedNodeId;
      delete canvas.dataset.selectionZoom;
      delete canvas.dataset.cameraZoom;
      graph.exitFocusMode();
      if (preSelectionView) {
        graph.targetCamera = null;
        graph.rotationX = preSelectionView.rotationX;
        graph.rotationY = preSelectionView.rotationY;
        graph.camera.x = preSelectionView.cameraX;
        graph.camera.y = preSelectionView.cameraY;
        graph.camera.zoom = preSelectionView.zoom;
        graph.needsCentering = false;
        graph.isDraggingGlobe = false;
        graph.touchGesture = null;
        graph.touchMomentum = null;
        graph.autoRotatePausedUntil = performance.now() + 420;
        canvas.dataset.restoredRotation = `${preSelectionView.rotationX.toFixed(5)},${preSelectionView.rotationY.toFixed(5)}`;
        canvas.dataset.restoredZoom = preSelectionView.zoom.toFixed(4);
        canvas.dataset.resetCount = String(Number(canvas.dataset.resetCount || 0) + 1);
        graph.requestRender();
      }
      canvas.dispatchEvent(new CustomEvent("tulip:explore-reset",{bubbles:true}));
    };
    type ResetGesture = { x:number; y:number; candidate:boolean };
    let touchResetGesture:ResetGesture | null = null;
    let mouseResetGesture:ResetGesture | null = null;
    const isResetStart = (clientX:number,clientY:number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      return x <= rect.width * .38 && y >= rect.height * .68 && y <= rect.height * .94;
    };
    const completesResetGesture = (gesture:ResetGesture | null,clientX:number,clientY:number) => {
      if (!gesture?.candidate || !selectedNodeIdRef.current) return false;
      const rect = canvas.getBoundingClientRect();
      const dx = clientX - gesture.x;
      const dy = clientY - gesture.y;
      const endX = clientX - rect.left;
      const endY = clientY - rect.top;
      return dx >= rect.width * .3
        && -dy >= rect.height * .12
        && Math.abs(dx) > Math.abs(dy) * .5
        && endX >= rect.width * .52
        && endY >= rect.height * .3
        && endY <= rect.height * .72;
    };
    const handleTouchStart = (event:TouchEvent) => {
      const touch = event.touches[0];
      touchResetGesture = touch ? { x:touch.clientX,y:touch.clientY,candidate:isResetStart(touch.clientX,touch.clientY) } : null;
      if (touchResetGesture?.candidate) canvas.dataset.resetGesture = "tracking";
    };
    const handleTouchEnd = (event:TouchEvent) => {
      const touch = event.changedTouches[0];
      const shouldReset = touch ? completesResetGesture(touchResetGesture,touch.clientX,touch.clientY) : false;
      touchResetGesture = null;
      delete canvas.dataset.resetGesture;
      if (shouldReset) clearExploreFocus();
    };
    const handleMouseDown = (event:MouseEvent) => {
      mouseResetGesture = { x:event.clientX,y:event.clientY,candidate:isResetStart(event.clientX,event.clientY) };
      if (mouseResetGesture.candidate) canvas.dataset.resetGesture = "tracking";
    };
    const handleMouseUp = (event:MouseEvent) => {
      const shouldReset = completesResetGesture(mouseResetGesture,event.clientX,event.clientY);
      mouseResetGesture = null;
      delete canvas.dataset.resetGesture;
      if (shouldReset) clearExploreFocus();
    };
    const cancelResetGesture = () => {
      touchResetGesture = null;
      mouseResetGesture = null;
      delete canvas.dataset.resetGesture;
    };
    canvas.addEventListener("touchstart",handleTouchStart,{ passive:true });
    canvas.addEventListener("touchend",handleTouchEnd,{ passive:true });
    canvas.addEventListener("touchcancel",cancelResetGesture,{ passive:true });
    canvas.addEventListener("mousedown",handleMouseDown);
    canvas.addEventListener("touchmove",lockExploreCameraOrigin,{ passive:true });
    canvas.addEventListener("wheel",lockExploreCameraOrigin,{ passive:true });
    window.addEventListener("mouseup",handleMouseUp);

    const applyMobileFraming = () => {
      window.requestAnimationFrame(() => {
        resizeForPrototype();
      });
    };

      graph.setFilter(activeFilterRef.current);
      canvas.dataset.activeFilter = activeFilterRef.current;
      applyMobileFraming();
      if (!active || suspended) graph.pause();

      cleanup = () => {
      canvas.removeEventListener("touchstart",handleTouchStart);
      canvas.removeEventListener("touchend",handleTouchEnd);
      canvas.removeEventListener("touchcancel",cancelResetGesture);
      canvas.removeEventListener("mousedown",handleMouseDown);
      canvas.removeEventListener("touchmove",lockExploreCameraOrigin);
      canvas.removeEventListener("wheel",lockExploreCameraOrigin);
      window.removeEventListener("mouseup",handleMouseUp);
      graph.canvasResizeObserver?.disconnect();
      if (graph.handleVisibilityChange) {
        document.removeEventListener("visibilitychange", graph.handleVisibilityChange);
      }
      graph.destroy();
      graphContext.fillText = originalFillText;
      if (previousUiScale) document.documentElement.style.setProperty("--ui-scale", previousUiScale);
      else document.documentElement.style.removeProperty("--ui-scale");
      // The desktop engine currently installs one anonymous resize listener.
      // Neutralize its target after teardown so React Strict Mode remounts stay safe.
      graph.resizeCanvas = () => undefined;
      graphRef.current = null;
      };
    });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [onAnalyse]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.setFilter(activeFilter);
    if (canvasRef.current) canvasRef.current.dataset.activeFilter = activeFilter;
  }, [activeFilter]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    if (active) {
      selectedNodeIdRef.current = null;
      selectedZoomRef.current = null;
      preSelectionViewRef.current = null;
      if (canvasRef.current) {
        delete canvasRef.current.dataset.selectedNodeId;
        delete canvasRef.current.dataset.selectionZoom;
        delete canvasRef.current.dataset.cameraZoom;
      }
      graph.exitFocusMode();
      graph.rotationX = .2;
      graph.rotationY = 0;
      graph.isDraggingGlobe = false;
      graph.isPanningCamera = false;
      graph.touchGesture = null;
      graph.touchMomentum = null;
      graph.targetCamera = null;
      graph.needsCentering = false;
      graph.autoRotatePausedUntil = performance.now() + 1200;
      if (canvasRef.current) {
        canvasRef.current.dataset.resetCount = String(Number(canvasRef.current.dataset.resetCount || 0) + 1);
      }
      graph.resume();
      graph.resizeCanvas();
      window.requestAnimationFrame(() => {
        if (!canvasRef.current?.parentElement) return;
        graph.defaultZoom = EXPLORE_MOBILE_ZOOM;
        graph.camera.zoom = EXPLORE_MOBILE_ZOOM;
        graph.camera.x = graph.width / 2;
        graph.camera.y = graph.height / 2 + EXPLORE_CAMERA_VERTICAL_OFFSET;
        graph.requestRender();
      });
    } else {
      graph.pause();
    }
  }, [active,resetKey]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || !active) return;
    if (suspended) {
      graph.pause();
      return;
    }
    graph.resume();
    graph.resizeCanvas();
    graph.requestRender();
  },[active,suspended]);

  useEffect(() => {
    let demoStartRotationY:number | null = null;
    let demoMaxRotationDelta = 0;
    const handleQuickStartSpinDemo = (event:Event) => {
      const graph = graphRef.current;
      const canvas = canvasRef.current;
      const detail = (event as CustomEvent<{progress?:number; rotationOffset?:number; cancelled?:boolean}>).detail;
      if (detail?.cancelled) {
        if (graph) {
          graph.isDraggingGlobe = false;
          graph.autoRotatePausedUntil = Date.now() + 420;
          graph.requestRender();
        }
        return;
      }
      const progress = Number(detail?.progress);
      const rotationOffset = Number(detail?.rotationOffset);
      if (!active || !graph || !canvas || !Number.isFinite(progress)) return;
      if (demoStartRotationY === null || progress <= .01) demoStartRotationY = graph.rotationY;
      graph.needsCentering = false;
      graph.touchMomentum = null;
      graph.isDraggingGlobe = progress < 1;
      graph.autoRotatePausedUntil = Date.now() + 1800;
      graph.rotationY = demoStartRotationY + (Number.isFinite(rotationOffset) ? rotationOffset : progress) * 1.32;
      demoMaxRotationDelta = Math.max(demoMaxRotationDelta,Math.abs(graph.rotationY - demoStartRotationY));
      canvas.dataset.quickStartDemoProgress = progress.toFixed(3);
      canvas.dataset.quickStartDemoOffset = (Number.isFinite(rotationOffset) ? rotationOffset : progress).toFixed(3);
      canvas.dataset.quickStartDemoRotationY = graph.rotationY.toFixed(5);
      canvas.dataset.quickStartDemoMaxRotationDelta = demoMaxRotationDelta.toFixed(5);
      canvas.dataset.quickStartDemoDragging = String(graph.isDraggingGlobe);
      graph.requestRender();
    };
    window.addEventListener("tulip:quick-start-spin-demo",handleQuickStartSpinDemo);
    return () => window.removeEventListener("tulip:quick-start-spin-demo",handleQuickStartSpinDemo);
  },[active]);

  return <div className={`explore-screen app-screen ${active ? "is-active" : "is-inactive"}`} aria-hidden={!active}><div className="sphere-stage"><canvas ref={canvasRef} data-quick-start="explore-canvas" className="desktop-sphere-canvas" aria-label="Interactive TULIP network sphere. Tap a node to reveal connections, move the sphere to inspect them, tap a connected node to follow it, or swipe diagonally from bottom left to middle right to reset." /></div><ExploreTopBar onOpenInfo={onOpenInfo} onStartQuickStart={onStartQuickStart} /></div>;
}

function SearchScreen({ onClose, onResult }: { onClose: () => void; onResult: (name: string) => void }) {
  const [query, setQuery] = useState("");
  const [openHistoryName, setOpenHistoryName] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(SEARCH_HISTORY_KEY) || "null");
      return Array.isArray(saved) ? saved.filter((item): item is string => typeof item === "string").slice(0,5) : DEFAULT_SEARCH_HISTORY;
    } catch {
      return DEFAULT_SEARCH_HISTORY;
    }
  });
  const keyboard = useKeyboard();
  const screenRef = useRef<HTMLDivElement>(null);
  const frozenHeaderRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const screen = screenRef.current;
    const header = frozenHeaderRef.current;
    if (!screen || !header) return;
    const syncHeight = () => screen.style.setProperty("--search-frozen-header-height",`${header.offsetHeight}px`);
    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(header);
    observer.observe(screen);
    window.addEventListener("resize",syncHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize",syncHeight);
    };
  },[]);
  const visibleNodes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];
    return desktopSearchIndex
      .filter((entry) => entry.name.includes(normalizedQuery))
      .sort((a,b) => Number(b.name.startsWith(normalizedQuery)) - Number(a.name.startsWith(normalizedQuery)) || a.name.localeCompare(b.name))
      .slice(0,8)
      .map((entry) => entry.node);
  }, [query]);
  const historyNodes = useMemo(() => history.map((name) => desktopNodeByName.get(name)).filter(Boolean) as DesktopNodeData[], [history]);
  const closeSearch = () => { keyboard.hide(); onClose(); };
  const saveHistory = (nextHistory: string[]) => {
    setHistory(nextHistory);
    try {
      window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(nextHistory));
    } catch {
      // Search remains functional when local storage is unavailable.
    }
  };
  const removeHistoryNode = (name: string) => saveHistory(history.filter((item) => item !== name));
  const chooseNode = (node: DesktopNodeData) => {
    const nextHistory = [node.name, ...history.filter((name) => name !== node.name)].slice(0,5);
    saveHistory(nextHistory);
    keyboard.hide();
    onResult(node.name);
  };
  return <div ref={screenRef} className="app-screen search-screen">
    <header ref={frozenHeaderRef} className="search-frozen-header">
      <div className="search-brand-row search-controls-row"><button className="icon-button muted" onClick={closeSearch} aria-label="Close search"><Cross1Icon width={20} height={20} /></button></div>
      <label className="search-line" data-quick-start="search-field"><KeyboardInput ref={inputRef} value={query} onChange={(event) => { setOpenHistoryName(null); setQuery(event.target.value); }} onBlur={() => keyboard.hide()} placeholder="Search a topic" aria-label="Search TULIP" autoComplete="off" /></label>
    </header>
    <MobileScroll className="search-scroll-surface" engine="native">
      <main className="search-surface" onPointerDown={(event) => { if (!(event.target as HTMLElement).closest(".search-history-item")) setOpenHistoryName(null); }}>
        {query.trim() ? <section className="search-results-list" aria-label="Search suggestions" aria-live="polite">{visibleNodes.map((node) => <button key={node.id} onClick={() => chooseNode(node)}><span>{node.name}</span><ExternalLinkIcon aria-hidden="true" /></button>)}{visibleNodes.length === 0 ? <p className="search-no-match">No matching topics</p> : null}</section> : <div className="search-discovery"><section className="search-history" aria-labelledby="recent-searches-heading"><h2 id="recent-searches-heading">Recent Searches</h2>{historyNodes.map((node) => <SearchHistoryItem key={node.id} node={node} open={openHistoryName === node.name} onOpen={() => setOpenHistoryName(node.name)} onChoose={() => chooseNode(node)} onRemove={() => removeHistoryNode(node.name)} />)}{historyNodes.length ? <button className="search-clear-history" onClick={() => saveHistory([])}>Clear all</button> : <p className="search-empty-history">No recent searches</p>}</section><section className="search-suggestions" aria-labelledby="suggested-topics-heading"><h2 id="suggested-topics-heading">Suggested Topics</h2><div>{suggestedSearchNodes.map((node) => <button key={node.id} onClick={() => chooseNode(node)}>{node.name}</button>)}</div></section></div>}
      </main>
    </MobileScroll>
  </div>;
}

function SearchHistoryItem({ node, open, onOpen, onChoose, onRemove }: { node:DesktopNodeData; open:boolean; onOpen:() => void; onChoose:() => void; onRemove:() => void }) {
  const DELETE_ACTION_WIDTH = 88;
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef(0);
  const gestureRef = useRef<{ pointerId:number; x:number; y:number; width:number; startOffset:number; horizontal:boolean } | null>(null);
  const settle = (nextOffset:number) => {
    offsetRef.current = nextOffset;
    setOffset(nextOffset);
  };
  useEffect(() => {
    if (open || dragging) return;
    offsetRef.current = 0;
    setOffset(0);
  },[open,dragging]);
  const begin = (event:ReactPointerEvent<HTMLButtonElement>) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    gestureRef.current = { pointerId:event.pointerId,x:event.clientX,y:event.clientY,width:event.currentTarget.clientWidth,startOffset:offsetRef.current,horizontal:false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event:ReactPointerEvent<HTMLButtonElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (!gesture.horizontal && Math.abs(dx) >= ACCIDENTAL_TOUCH_SLOP && Math.abs(dx) > Math.abs(dy) * 1.2) {
      gesture.horizontal = true;
      setDragging(true);
      if (dx < 0) onOpen();
    }
    if (!gesture.horizontal) return;
    event.preventDefault();
    offsetRef.current = Math.max(-gesture.width,Math.min(0,gesture.startOffset + dx));
    setOffset(offsetRef.current);
  };
  const finish = (event:ReactPointerEvent<HTMLButtonElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    setDragging(false);
    if (offsetRef.current <= -gesture.width * .78) {
      settle(-gesture.width);
      window.setTimeout(onRemove,160);
    } else if (offsetRef.current <= -DELETE_ACTION_WIDTH * .42) {
      settle(-DELETE_ACTION_WIDTH);
    } else {
      settle(0);
    }
  };
  const cancel = () => { gestureRef.current = null; setDragging(false); settle(offsetRef.current <= -DELETE_ACTION_WIDTH * .5 ? -DELETE_ACTION_WIDTH : 0); };
  const chooseOrClose = () => {
    if (offsetRef.current < 0) {
      settle(0);
      return;
    }
    onChoose();
  };
  return <div className={`search-history-item ${dragging ? "is-dragging" : ""}`}><button className="search-history-delete" onClick={onRemove} aria-label={`Delete ${node.name} from recent searches`}>Delete</button><button className="search-history-content" style={{ "--history-swipe-x":`${offset}px` } as CSSProperties} onPointerDown={begin} onPointerMove={move} onPointerUp={finish} onPointerCancel={cancel} onClick={chooseOrClose} aria-label={`${node.name}, ${node.sphere}. Swipe left for delete options.`}><ClockIcon aria-hidden="true" /><span><strong>{node.name}</strong><small>{node.sphere}</small></span></button></div>;
}

function InspectorField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="inspector-field"><p className="eyebrow">{label}</p><div>{children}</div></div>;
}

const TULIP_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatRecentEventDate(value:string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value || "Date unavailable";
  const [year,month,day] = value.split("-");
  const monthName = TULIP_MONTHS[Number(month) - 1];
  return monthName ? `${year}-${monthName}-${day}` : "Date unavailable";
}

function formatAppDate(value:string) {
  const cleaned = value
    .replace(/^last updated:?\s*/i,"")
    .replace(/^reviewed\s*/i,"")
    .trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) return formatRecentEventDate(cleaned.slice(0,10));
  const monthMatch = cleaned.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthMatch) {
    const monthIndex = TULIP_MONTHS.findIndex((month) => month.toLowerCase() === monthMatch[1].slice(0,3).toLowerCase());
    if (monthIndex >= 0) return `${monthMatch[2]}-${TULIP_MONTHS[monthIndex]}`;
  }
  return cleaned || value;
}

function RecentMajorEvents({ profile }: { profile:MobileRecentOccurrenceProfile }) {
  return <details className="detail-section inspector-block inspector-disclosure recent-major-events" open>
    <summary><span>{profile.title}</span><ChevronRightIcon /></summary>
    <div className="recent-major-events-list">
      {profile.occurrences.map((occurrence) => <article className="recent-major-event-card" key={occurrence.id}>
        <p className="recent-major-event-meta"><time dateTime={occurrence.date}>{formatRecentEventDate(occurrence.date)}</time><span aria-hidden="true">·</span><span>{occurrence.place}</span></p>
        <div className="recent-major-event-title-row"><h3>{occurrence.title}</h3><span className={`recent-major-event-status status-${occurrence.status}`} title={occurrence.statusNote}>{occurrence.statusLabel}</span></div>
        {occurrence.summary ? <p className="recent-major-event-summary">{occurrence.summary}</p> : null}
        {occurrence.sources.length ? <div className="recent-major-event-sources">{occurrence.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer"><span>{source.label}</span><ExternalLinkIcon /></a>)}</div> : null}
      </article>)}
    </div>
  </details>;
}

type AnalyseRelationshipProfile = MobileInspectorProfile;

function AnalyseRelationshipScroller({ profile, onSelectNode }: { profile: AnalyseRelationshipProfile; onSelectNode: (name: string) => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const scroll = stage?.querySelector<HTMLDivElement>(".mobile-scroll");
    const selected = selectedRef.current;
    if (!scroll || !selected) return;

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        const centered = selected.offsetTop - (scroll.clientHeight - selected.offsetHeight) / 2;
        scroll.scrollTop = Math.max(0,centered);
      });
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [profile.name]);

  const relationship = (label:string,direction:"effects"|"triggers") => (
    <button
      key={label}
      type="button"
      className={`analyse-causal-relation is-${direction}`}
      onClick={(event) => {
        event.currentTarget.dispatchEvent(new CustomEvent("tulip:analyse-node-tap",{bubbles:true,detail:{name:label,direction}}));
        onSelectNode(label);
      }}
    >
      {label}
    </button>
  );

  return <div ref={stageRef} className="analyse-causal-stage" data-quick-start="analyse-node">
    <MobileScroll className="analyse-causal-scroll">
      <main className="analyse-causal-content" aria-label={`Relationships for ${profile.name}`}>
        <section className="analyse-causal-section effects" aria-label="Effects">
          <div className="analyse-causal-list">{profile.outgoing.map(([label]) => relationship(label,"effects"))}</div>
        </section>
        <div ref={selectedRef} className="analyse-selected-anchor">
          <span className="analyse-direction-cue is-effects"><i aria-hidden="true">↑</i><b>Effects</b></span>
          <div className="analyse-selected-pill">{profile.name}</div>
          <span className="analyse-direction-cue is-triggers"><b>Triggers</b><i aria-hidden="true">↓</i></span>
        </div>
        <section className="analyse-causal-section triggers" aria-label="Triggers">
          <div className="analyse-causal-list">{profile.incoming.map(([label]) => relationship(label,"triggers"))}</div>
        </section>
      </main>
    </MobileScroll>
  </div>;
}

const COLLAPSED_ANALYSE_PEEK = 200;
const IOS_SCROLL_PROXY_DISTANCE = 180;
const ANALYSE_SHEET_FLICK_VELOCITY = .42;
const ANALYSE_SHEET_PROJECTION_MS = 150;
const ANALYSE_SHEET_TAP_SLOP = 8;
const ANALYSE_SHEET_GESTURE_SLOP = 34;
const ANALYSE_SHEET_COMMIT_DISTANCE = 56;

type AnalyseSheetDrag = {
  pointerId:number;
  y:number;
  lastY:number;
  lastTime:number;
  velocity:number;
  startTranslate:number;
  collapsedTranslate:number;
  scale:number;
  startedExpanded:boolean;
  unlockSafariChrome:boolean;
};

type AnalyseScreenProps = { name:string; initiallyExpanded?:boolean; entryOrigin?:AppPoint | null; transition?:"idle"|"forward"|"back"; onSelectNode:(name:string) => void; onBack:() => void; onExpandedChange?:(name:string,expanded:boolean) => void; onNavCompactChange?:(compact:boolean) => void };

function AnalyseScreen(props:AnalyseScreenProps) {
  const { name } = props;
  const [profile,setProfile] = useState<MobileInspectorProfile | null>(() => inspectorProfilesCache ? resolveInspectorProfile(name,inspectorProfilesCache) : null);
  const [loadFailed,setLoadFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setLoadFailed(false);
    void loadInspectorProfiles().then((profiles) => {
      if (!cancelled) setProfile(resolveInspectorProfile(name,profiles));
    }).catch(() => {
      inspectorProfilesPromise = null;
      if (!cancelled) setLoadFailed(true);
    });
    return () => { cancelled = true; };
  },[name]);
  if (!profile) return <div className="analyse-screen app-screen is-inspector-loading" role="status"><p>{loadFailed ? "Inspector data could not be loaded." : "Loading inspector…"}</p></div>;
  return <AnalyseScreenContent {...props} profile={profile} />;
}

function AnalyseScreenContent({ name, profile, initiallyExpanded = false, entryOrigin, transition = "idle", onSelectNode, onBack, onExpandedChange, onNavCompactChange }: AnalyseScreenProps & { profile:MobileInspectorProfile }) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const inspectorScrolledRef = useRef(false);
  const backSwipeRef = useRef<{ pointerId:number; x:number; y:number } | null>(null);
  const ignoreHandleClickUntilRef = useRef(0);
  const dragStartRef = useRef<AnalyseSheetDrag | null>(null);
  const collapseRegionRef = useRef<{ pointerId:number; x:number; y:number } | null>(null);
  const collapseRegionDragRef = useRef<{ pointerId:number; y:number } | null>(null);
  const dragTranslateRef = useRef<number | null>(null);
  const dragFrameRef = useRef<number | null>(null);
  const dragSettleFrameRef = useRef<number | null>(null);
  const pendingDragTranslateRef = useRef<number | null>(null);
  const expandedCueTimerRef = useRef<number | null>(null);
  const [expanded,setExpanded] = useState(false);
  const [isInspectorScrolled,setIsInspectorScrolled] = useState(false);
  const [showExpandedCue,setShowExpandedCue] = useState(false);
  const [openingFromExplore,setOpeningFromExplore] = useState(Boolean(entryOrigin));
  const [isSheetDragging,setIsSheetDragging] = useState(false);
  const [connection, setConnection] = useState<{label:string;detail:string;direction:"incoming"|"outgoing"} | null>(null);
  const prioritizeSelected = useCallback((entries:MobileRelationshipEntry[],direction:"incoming"|"outgoing") => {
    if (!connection || connection.direction !== direction) return entries;
    const selectedIndex = entries.findIndex(([label]) => label === connection.label);
    if (selectedIndex <= 0) return entries;
    return [entries[selectedIndex],...entries.slice(0,selectedIndex),...entries.slice(selectedIndex + 1)];
  },[connection]);
  const incomingRelationships = useMemo(() => prioritizeSelected(profile.incoming,"incoming"),[prioritizeSelected,profile.incoming]);
  const outgoingRelationships = useMemo(() => prioritizeSelected(profile.outgoing,"outgoing"),[prioritizeSelected,profile.outgoing]);
  const connectionQuestion = connection ? (() => {
    const sourceName = connection.direction === "incoming" ? connection.label : profile.name;
    const targetName = connection.direction === "incoming" ? profile.name : connection.label;
    const sourceNode = desktopNodes.find((item) => item.name === sourceName);
    return `How ${getRelationshipQuestionAuxiliary(sourceNode || sourceName)} ${sourceName} affect ${targetName}?`;
  })() : "";
  useEffect(() => setConnection(null),[name]);
  useEffect(() => {
    const scroller = sheetRef.current?.querySelector<HTMLElement>(".analyse-scroll .mobile-scroll");
    if (!scroller) return;
    let frame = 0;
    inspectorScrolledRef.current = false;
    setIsInspectorScrolled(false);
    scroller.scrollTop = 0;
    const syncScrolledState = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const next = inspectorScrolledRef.current ? scroller.scrollTop > 4 : scroller.scrollTop > 24;
        if (next === inspectorScrolledRef.current) return;
        inspectorScrolledRef.current = next;
        setIsInspectorScrolled(next);
      });
    };
    scroller.addEventListener("scroll",syncScrolledState,{passive:true});
    syncScrolledState();
    return () => {
      scroller.removeEventListener("scroll",syncScrolledState);
      if (frame) window.cancelAnimationFrame(frame);
    };
  },[name]);
  useEffect(() => {
    const scroller = sheetRef.current?.querySelector<HTMLElement>(".analyse-scroll .mobile-scroll");
    onNavCompactChange?.(false);
    if (!expanded || !scroller) return;
    let frame = 0;
    let compactTimer = 0;
    let compact = false;
    let lastScrollTop = scroller.scrollTop;
    const setCompact = (next:boolean) => {
      if (compact === next) return;
      compact = next;
      onNavCompactChange?.(next);
    };
    const syncNavSize = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const nextScrollTop = scroller.scrollTop;
        const delta = nextScrollTop - lastScrollTop;
        lastScrollTop = nextScrollTop;
        if (nextScrollTop <= 8) {
          if (compactTimer) window.clearTimeout(compactTimer);
          compactTimer = 0;
          setCompact(false);
        } else if (delta > 2 && !compact && !compactTimer) {
          // Let the sticky identity header finish its own layout reduction first;
          // otherwise that reflow looks like an immediate upward scroll.
          compactTimer = window.setTimeout(() => {
            compactTimer = 0;
            lastScrollTop = scroller.scrollTop;
            if (lastScrollTop > 8) setCompact(true);
          },90);
        } else if (delta < -2 && compact) {
          setCompact(false);
        }
      });
    };
    scroller.addEventListener("scroll",syncNavSize,{passive:true});
    return () => {
      scroller.removeEventListener("scroll",syncNavSize);
      if (frame) window.cancelAnimationFrame(frame);
      if (compactTimer) window.clearTimeout(compactTimer);
      onNavCompactChange?.(false);
    };
  },[expanded,name,onNavCompactChange]);
  useEffect(() => {
    if (!initiallyExpanded) return;
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => setExpanded(true));
    });
    const finishTimer = window.setTimeout(() => setOpeningFromExplore(false),620);
    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
      window.clearTimeout(finishTimer);
    };
  },[entryOrigin,initiallyExpanded]);
  useEffect(() => onExpandedChange?.(name,expanded),[expanded,name,onExpandedChange]);
  useEffect(() => {
    const notify = () => window.dispatchEvent(new CustomEvent("tulip:analyse-inspector-state",{detail:{expanded,name}}));
    notify();
    const frame = window.requestAnimationFrame(notify);
    return () => window.cancelAnimationFrame(frame);
  },[expanded,name]);
  useEffect(() => {
    if (expandedCueTimerRef.current !== null) window.clearTimeout(expandedCueTimerRef.current);
    if (!expanded) {
      setShowExpandedCue(false);
      expandedCueTimerRef.current = null;
      return;
    }
    setShowExpandedCue(true);
    expandedCueTimerRef.current = window.setTimeout(() => {
      setShowExpandedCue(false);
      expandedCueTimerRef.current = null;
    },3000);
    return () => {
      if (expandedCueTimerRef.current !== null) window.clearTimeout(expandedCueTimerRef.current);
      expandedCueTimerRef.current = null;
    };
  },[expanded]);
  const applySheetDragVisual = useCallback((translate:number) => {
    const shell = sheetRef.current;
    if (!shell) return;
    const limit = dragStartRef.current?.collapsedTranslate || 1;
    const progress = 1 - Math.max(0,Math.min(1,translate / limit));
    shell.style.transform = `translate3d(0, ${translate}px, 0)`;
    shell.style.transition = "none";
    shell.style.setProperty("--score-scale",String(.6 + (.4 * progress)));
  },[]);
  const flushSheetDragFrame = useCallback(() => {
    if (dragFrameRef.current !== null) {
      window.cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = null;
    }
    const pending = pendingDragTranslateRef.current;
    if (pending === null) return dragTranslateRef.current;
    pendingDragTranslateRef.current = null;
    dragTranslateRef.current = pending;
    applySheetDragVisual(pending);
    return pending;
  },[applySheetDragVisual]);
  const settleSheetDrag = useCallback((pointerId?: number, cancelled = false) => {
    const drag = dragStartRef.current;
    if (!drag || (pointerId !== undefined && drag.pointerId !== pointerId)) return;
    const nextTranslate = flushSheetDragFrame() ?? drag.startTranslate;
    const movement = nextTranslate - drag.startTranslate;
    const travelled = Math.abs(movement);
    if (travelled > ANALYSE_SHEET_TAP_SLOP) ignoreHandleClickUntilRef.current = performance.now() + 320;
    const projectedTranslate = Math.max(0,Math.min(
      drag.collapsedTranslate,
      nextTranslate + (drag.velocity * ANALYSE_SHEET_PROJECTION_MS),
    ));
    const isFlick = Math.abs(drag.velocity) >= ANALYSE_SHEET_FLICK_VELOCITY;
    const velocityAgreesWithTravel = Math.sign(drag.velocity) === Math.sign(movement);
    const shouldExpand = cancelled || travelled <= ANALYSE_SHEET_GESTURE_SLOP
      ? drag.startedExpanded
      : movement <= -ANALYSE_SHEET_COMMIT_DISTANCE
        ? true
        : movement >= ANALYSE_SHEET_COMMIT_DISTANCE
          ? false
          : isFlick && velocityAgreesWithTravel
        ? drag.velocity < 0
        : projectedTranslate < drag.collapsedTranslate * .5;
    setExpanded(shouldExpand);
    window.dispatchEvent(new CustomEvent("tulip:analyse-inspector-state",{detail:{expanded:shouldExpand,name}}));
    setIsSheetDragging(false);
    const shell = sheetRef.current;
    if (shell) {
      if (dragSettleFrameRef.current !== null) window.cancelAnimationFrame(dragSettleFrameRef.current);
      dragSettleFrameRef.current = window.requestAnimationFrame(() => {
        dragSettleFrameRef.current = null;
        shell.style.removeProperty("transform");
        shell.style.removeProperty("transition");
      });
    }
    pendingDragTranslateRef.current = null;
    dragTranslateRef.current = null;
    dragStartRef.current = null;
  },[flushSheetDragFrame,name]);
  useEffect(() => {
    const finishOutsideReact = (event: PointerEvent) => settleSheetDrag(event.pointerId);
    window.addEventListener("pointerup",finishOutsideReact,true);
    window.addEventListener("pointercancel",finishOutsideReact,true);
    return () => {
      window.removeEventListener("pointerup",finishOutsideReact,true);
      window.removeEventListener("pointercancel",finishOutsideReact,true);
      if (dragFrameRef.current !== null) window.cancelAnimationFrame(dragFrameRef.current);
      if (dragSettleFrameRef.current !== null) window.cancelAnimationFrame(dragSettleFrameRef.current);
    };
  },[settleSheetDrag]);
  const beginSheetDrag = (event: React.PointerEvent<HTMLElement>, gestureStartY = event.clientY) => {
    event.stopPropagation();
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    const shell = sheetRef.current;
    if (!shell) return;
    const collapsedTranslate = Math.max(0,shell.clientHeight - COLLAPSED_ANALYSE_PEEK);
    const startTranslate = expanded ? 0 : collapsedTranslate;
    const rect = shell.getBoundingClientRect();
    const scale = rect.height > 0 ? rect.height / shell.clientHeight : 1;
    const unlockSafariChrome = document.documentElement.dataset.tulipScrollProxy === "armed";
    const now = performance.now();
    dragStartRef.current = { pointerId:event.pointerId,y:gestureStartY,lastY:event.clientY,lastTime:now,velocity:0,startTranslate,collapsedTranslate,scale,startedExpanded:expanded,unlockSafariChrome };
    dragTranslateRef.current = startTranslate;
    pendingDragTranslateRef.current = null;
    setIsSheetDragging(true);
    applySheetDragVisual(startTranslate);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveSheetDrag = (event: React.PointerEvent<HTMLElement>) => {
    event.stopPropagation();
    const drag = dragStartRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.cancelable) event.preventDefault();
    const movement = (event.clientY - drag.y) / drag.scale;
    const nextTranslate = Math.max(0,Math.min(drag.collapsedTranslate,drag.startTranslate + movement));
    const now = performance.now();
    const elapsed = Math.max(1,now - drag.lastTime);
    const instantaneousVelocity = ((event.clientY - drag.lastY) / drag.scale) / elapsed;
    drag.velocity = (drag.velocity * .7) + (instantaneousVelocity * .3);
    drag.lastY = event.clientY;
    drag.lastTime = now;
    if (drag.unlockSafariChrome && movement < 0) {
      window.scrollTo(0,Math.min(IOS_SCROLL_PROXY_DISTANCE,Math.max(1,-movement * 2.5)));
    }
    pendingDragTranslateRef.current = nextTranslate;
    if (dragFrameRef.current === null) {
      dragFrameRef.current = window.requestAnimationFrame(() => {
        dragFrameRef.current = null;
        const pending = pendingDragTranslateRef.current;
        if (pending === null) return;
        pendingDragTranslateRef.current = null;
        dragTranslateRef.current = pending;
        applySheetDragVisual(pending);
      });
    }
  };
  const finishSheetDrag = (event: React.PointerEvent<HTMLElement>) => {
    event.stopPropagation();
    settleSheetDrag(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const cancelSheetDrag = (event: React.PointerEvent<HTMLElement>) => {
    event.stopPropagation();
    settleSheetDrag(event.pointerId,true);
  };
  const bindSheetDrag = () => ({
    onPointerDown:beginSheetDrag,
    onPointerMove:moveSheetDrag,
    onPointerUp:finishSheetDrag,
    onPointerCancel:cancelSheetDrag,
    onLostPointerCapture:finishSheetDrag,
  });
  const beginCollapseRegion = (event:React.PointerEvent<HTMLDivElement>) => {
    if (!expanded || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    const screen = event.currentTarget.closest<HTMLElement>(".analyse-screen");
    const screenRect = screen?.getBoundingClientRect();
    if (!screenRect || event.clientY - screenRect.top > screenRect.height * ANALYSE_COLLAPSE_GESTURE_HEIGHT_RATIO) return;
    collapseRegionRef.current = { pointerId:event.pointerId,x:event.clientX,y:event.clientY };
  };
  const moveCollapseRegion = (event:React.PointerEvent<HTMLDivElement>) => {
    if (collapseRegionDragRef.current?.pointerId === event.pointerId) {
      moveSheetDrag(event);
      return;
    }
    const pending = collapseRegionRef.current;
    if (!pending || pending.pointerId !== event.pointerId || dragStartRef.current) return;
    const dx = event.clientX - pending.x;
    const dy = event.clientY - pending.y;
    if (Math.hypot(dx,dy) < ANALYSE_SHEET_GESTURE_SLOP) return;
    if (dy <= 0 || dy <= Math.abs(dx) * 1.2) {
      collapseRegionRef.current = null;
      return;
    }
    collapseRegionRef.current = null;
    collapseRegionDragRef.current = { pointerId:event.pointerId,y:pending.y };
    beginSheetDrag(event,pending.y);
    moveSheetDrag(event);
  };
  const finishCollapseRegion = (event:React.PointerEvent<HTMLDivElement>,cancelled = false) => {
    if (collapseRegionRef.current?.pointerId === event.pointerId) collapseRegionRef.current = null;
    const activeDrag = collapseRegionDragRef.current;
    if (activeDrag?.pointerId === event.pointerId) {
      settleSheetDrag(event.pointerId,cancelled);
      if (!cancelled && event.clientY - activeDrag.y >= ANALYSE_SHEET_COMMIT_DISTANCE) {
        setExpanded(false);
        window.dispatchEvent(new CustomEvent("tulip:analyse-inspector-state",{detail:{expanded:false,name}}));
      }
      collapseRegionDragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const sheetStyle = {
    "--score-scale":expanded ? 1 : .6,
  } as CSSProperties;
  const toggleSheet = () => {
    if (performance.now() < ignoreHandleClickUntilRef.current) return;
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    window.dispatchEvent(new CustomEvent("tulip:analyse-inspector-state",{detail:{expanded:nextExpanded,name}}));
  };
  const entryStyle = entryOrigin ? {
    "--entry-origin-x":`${entryOrigin.x}px`,
    "--entry-origin-y":`${entryOrigin.y}px`,
  } as CSSProperties : undefined;
  const beginBackSwipe = (event:ReactPointerEvent<HTMLDivElement>) => {
    const localX = event.clientX - event.currentTarget.getBoundingClientRect().left;
    if (!event.isPrimary || localX > 28 || (event.pointerType === "mouse" && event.button !== 0)) return;
    backSwipeRef.current = { pointerId:event.pointerId,x:event.clientX,y:event.clientY };
  };
  const finishBackSwipe = (event:ReactPointerEvent<HTMLDivElement>) => {
    const start = backSwipeRef.current;
    backSwipeRef.current = null;
    if (!start || start.pointerId !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (dx >= 64 && dx > Math.abs(dy) * 1.35) onBack();
  };
  return <div className={`analyse-screen app-screen ${expanded ? "is-inspector-expanded" : ""} ${openingFromExplore ? "is-opening-from-explore" : ""} ${transition === "idle" ? "" : `is-node-${transition}`}`} onPointerDownCapture={beginCollapseRegion} onPointerMoveCapture={moveCollapseRegion} onPointerUpCapture={finishCollapseRegion} onPointerCancelCapture={(event) => finishCollapseRegion(event,true)} onPointerDown={beginBackSwipe} onPointerUp={finishBackSwipe} onPointerCancel={() => { backSwipeRef.current = null; }}>
    <AnalyseRelationshipScroller profile={profile} onSelectNode={onSelectNode} />
    {showExpandedCue ? <div className="analysis-expanded-cue" role="status" aria-live="polite">Swipe down to explore more.</div> : null}
    {openingFromExplore ? <div className="analyse-entry-node" style={entryStyle} aria-hidden="true"><span>{profile.name}</span></div> : null}
    <div ref={sheetRef} className={`analysis-sheet-shell ${expanded ? "is-expanded" : "is-collapsed"}${isSheetDragging ? " is-dragging" : ""}${isInspectorScrolled ? " is-inspector-scrolled" : ""}`} style={sheetStyle}>
      <MobileScroll className="analyse-scroll" engine="native">
        <main className="analysis-sheet">
          <div className="analysis-sheet-grab-zone" data-quick-start="analyse-grab-zone" {...bindSheetDrag()}>
            <button className="analysis-sheet-handle" type="button" aria-label={expanded ? "Collapse node inspector" : "Expand node inspector"} aria-expanded={expanded} onClick={toggleSheet}><span /></button>
            <div className="analysis-title-row">
              <div><p className="eyebrow accent">{profile.sphere}</p><h1 title={profile.name}>{profile.name}</h1><p className="analysis-source-date">Last updated {formatAppDate(profile.updated)}</p></div>
              <div className="mobile-score-lockup" aria-label={`TULIP urgency ${profile.urgency.toFixed(1)}, ${profile.urgencyBand}`}><strong>{profile.urgency.toFixed(1)}</strong><span>{profile.urgencyBand}</span></div>
            </div>
          </div>
          <div className="analysis-detail-content" aria-hidden={!expanded}>
            <section className="detail-section overview-section"><p className="body-copy">{profile.description}</p></section>
            <section className="detail-section relationship-section"><p className="eyebrow">Relationships</p><h3>Pick a <strong className="relationship-trigger-word">Trigger</strong></h3><Carousel key={`incoming-${connection?.direction === "incoming" ? connection.label : "none"}`} engine="native" ariaLabel="Pick a Trigger">{incomingRelationships.map(([label,detail]) => <button key={label} aria-pressed={connection?.direction === "incoming" && connection.label === label} onClick={() => setConnection({label,detail,direction:"incoming"})}>{label}</button>)}</Carousel><h3>Pick an <strong className="relationship-effect-word">Effect</strong></h3><Carousel key={`outgoing-${connection?.direction === "outgoing" ? connection.label : "none"}`} engine="native" ariaLabel="Pick an Effect">{outgoingRelationships.map(([label,detail]) => <button key={label} aria-pressed={connection?.direction === "outgoing" && connection.label === label} onClick={() => setConnection({label,detail,direction:"outgoing"})}>{label}</button>)}</Carousel>{connection ? <article className="connection-card" aria-live="polite"><p className="connection-question">{connectionQuestion}</p><p className="connection-answer">{connection.detail}</p></article> : null}</section>
            <section className="detail-section inspector-block"><div className="inspector-block-heading"><p className="eyebrow">Impact on Humans</p></div><p className="body-copy">{profile.human.summary}</p><p className="affects"><strong>AFFECTS:</strong> {profile.human.domains.join(", ") || "No additional domain asserted"}</p><ul className="consequence-list">{profile.human.consequences.map((item:string) => <li key={item}>{item}</li>)}</ul><InspectorField label="Hidden Cost"><p>{profile.human.hiddenCost}</p></InspectorField><InspectorField label="Who Pays for It"><p>{profile.human.whoPays}</p></InspectorField></section>
            <section className="detail-section inspector-block"><div className="inspector-block-heading"><p className="eyebrow">Impact on the Planet</p></div><p className="body-copy">{profile.planet.summary}</p><p className="affects"><strong>AFFECTS:</strong> {profile.planet.domains.join(", ") || "No additional system asserted"}</p><ul className="consequence-list">{profile.planet.consequences.map((item:string) => <li key={item}>{item}</li>)}</ul><InspectorField label="Physical Limit"><p>{profile.planet.physicalLimit}</p></InspectorField></section>
            <section className="detail-section inspector-block"><p className="eyebrow">What Can Be Done</p><InspectorField label="Default Driver"><p>{profile.response.defaultDriver}</p></InspectorField><InspectorField label="System Levers"><ul className="lever-list">{profile.response.levers.map((item:string) => <li key={item}>{item}</li>)}</ul></InspectorField></section>
            {profile.recentOccurrences ? <RecentMajorEvents key={profile.name} profile={profile.recentOccurrences} /> : null}
            <details className="detail-section inspector-block inspector-disclosure"><summary><span>How This Is Measured</span><ChevronRightIcon /></summary><dl className="measurement-grid"><div><dt>Metric</dt><dd>{formatMetricDisplayText(profile.measurement.metric)}</dd></div><div><dt>Unit</dt><dd>{formatMetricDisplayText(profile.measurement.unit)}</dd></div><div><dt>Geography</dt><dd>{formatMetricDisplayText(profile.measurement.geography)}</dd></div><div><dt>Cadence</dt><dd>{formatMetricDisplayText(profile.measurement.cadence)}</dd></div><div><dt>Method</dt><dd>{formatMetricDisplayText(profile.measurement.method)}</dd></div><div><dt>Uncertainty</dt><dd>{formatMetricDisplayText(profile.measurement.uncertainty)}</dd></div><div><dt>Interpretation boundary</dt><dd>{formatMetricDisplayText(profile.measurement.boundary)}</dd></div></dl></details>
            <details className="detail-section inspector-block inspector-disclosure monitoring-block"><summary><span>Monitoring Sources</span><ChevronRightIcon /></summary><div className="monitoring-links">{profile.sources.map(([label,url]) => <a key={url} href={url} target="_blank" rel="noreferrer"><span>{label}</span><ExternalLinkIcon /></a>)}</div></details>
          </div>
        </main>
      </MobileScroll>
    </div>
  </div>;
}

const formatImpactValue = (value: number) => Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
const compactImpactUnit = (unit: string) => formatMetricDisplayText(String(unit || "relative value")).replace(" per year", "/yr").replace(" per kg food", "/kg");

function ActivityScreen({ resetRequest, onNavCompactChange }: { resetRequest:number; onNavCompactChange?:(compact:boolean) => void }) {
  const [scope,setScope] = useState(activityProfiles[0]?.key || "food");
  const [view,setView] = useState<"impact"|"actions">("impact");
  const [scopeTransition,setScopeTransition] = useState<"next"|"previous"|null>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const frozenHeaderRef = useRef<HTMLElement>(null);
  const navCompactRef = useRef(false);
  const edgeSwipeRef = useRef<{ pointerId:number; edge:"left"|"right"; x:number; y:number } | null>(null);
  const scopeTransitionTimerRef = useRef<number | null>(null);
  const resetTimersRef = useRef<number[]>([]);
  const scopeRef = useRef(scope);
  scopeRef.current = scope;
  const profile = activityProfiles.find((item) => item.key === scope) || activityProfiles[0];
  const setNavCompact = useCallback((next:boolean) => {
    if (navCompactRef.current === next) return;
    navCompactRef.current = next;
    onNavCompactChange?.(next);
  },[onNavCompactChange]);
  const moveToAdjacentScope = useCallback((direction:"next"|"previous") => {
    const currentIndex = activityProfiles.findIndex((item) => item.key === scope);
    const nextIndex = currentIndex + (direction === "next" ? 1 : -1);
    const nextProfile = activityProfiles[nextIndex];
    if (!nextProfile) return;
    if (scopeTransitionTimerRef.current !== null) window.clearTimeout(scopeTransitionTimerRef.current);
    setScopeTransition(direction);
    setScope(nextProfile.key);
    scopeTransitionTimerRef.current = window.setTimeout(() => {
      scopeTransitionTimerRef.current = null;
      setScopeTransition(null);
    },240);
  },[scope]);
  useEffect(() => {
    const screen = screenRef.current;
    const header = frozenHeaderRef.current;
    if (!screen || !header) return;
    const syncHeight = () => screen.style.setProperty("--activity-frozen-header-height",`${header.offsetTop + header.offsetHeight}px`);
    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(header);
    observer.observe(screen);
    window.addEventListener("resize",syncHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize",syncHeight);
    };
  }, []);
  useEffect(() => {
    const scroller = screenRef.current?.querySelector<HTMLElement>(".activity-scroll-surface .mobile-scroll");
    if (!scroller) return;
    setNavCompact(false);
    scroller.scrollTo({ top:0, behavior:"auto" });
  },[scope,view,setNavCompact]);
  useEffect(() => {
    const scroller = screenRef.current?.querySelector<HTMLElement>(".activity-scroll-surface .mobile-scroll");
    if (!scroller) return;
    let frame = 0;
    let lastScrollTop = scroller.scrollTop;
    const syncNavSize = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const nextScrollTop = scroller.scrollTop;
        const delta = nextScrollTop - lastScrollTop;
        lastScrollTop = nextScrollTop;
        if (nextScrollTop <= 8 || delta < -2) setNavCompact(false);
        else if (delta > 2) setNavCompact(true);
      });
    };
    scroller.addEventListener("scroll",syncNavSize,{passive:true});
    return () => {
      scroller.removeEventListener("scroll",syncNavSize);
      if (frame) window.cancelAnimationFrame(frame);
      setNavCompact(false);
    };
  },[setNavCompact]);
  useEffect(() => {
    const rail = screenRef.current?.querySelector<HTMLElement>(".activity-scope-carousel");
    const selected = rail?.querySelector<HTMLElement>(".activity-scope-list button.selected");
    if (!rail || !selected) return;
    const centeredLeft = selected.offsetLeft - (rail.clientWidth - selected.offsetWidth) / 2;
    rail.scrollTo({left:Math.max(0,centeredLeft),behavior:"smooth"});
  },[scope]);
  useEffect(() => () => {
    if (scopeTransitionTimerRef.current !== null) window.clearTimeout(scopeTransitionTimerRef.current);
    resetTimersRef.current.forEach((timer) => window.clearTimeout(timer));
  },[]);
  useEffect(() => {
    resetTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    resetTimersRef.current = [];
    if (resetRequest === 0 || activityProfiles.length === 0) return;

    const defaultIndex = Math.max(0,activityProfiles.findIndex((item) => item.key === "food"));
    const currentIndex = Math.max(defaultIndex,activityProfiles.findIndex((item) => item.key === scopeRef.current));
    const scroller = screenRef.current?.querySelector<HTMLElement>(".activity-scroll-surface .mobile-scroll");
    setView("impact");
    setNavCompact(false);

    const finish = () => {
      setScopeTransition(null);
      scroller?.scrollTo({top:0,behavior:"auto"});
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || currentIndex <= defaultIndex) {
      setScope(activityProfiles[defaultIndex].key);
      finish();
      return;
    }

    setScopeTransition("previous");
    const destinationIndices = Array.from(
      {length:currentIndex - defaultIndex},
      (_,index) => currentIndex - index - 1,
    );
    let elapsed = 0;
    destinationIndices.forEach((profileIndex,index) => {
      const progress = destinationIndices.length <= 1 ? 1 : index / (destinationIndices.length - 1);
      elapsed += Math.round(150 - (80 * progress));
      resetTimersRef.current.push(window.setTimeout(() => {
        setScope(activityProfiles[profileIndex].key);
        if (index === destinationIndices.length - 1) finish();
      },elapsed));
    });

    return () => {
      resetTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      resetTimersRef.current = [];
    };
  },[resetRequest,setNavCompact]);
  const beginEdgeSwipe = (event:ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("button, a, .activity-scope-carousel")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const sideSwipeInset = Math.min(ACTIVITY_SIDE_SWIPE_INSET,Math.max(50,(rect.width / 2) - 1));
    const edge = localX <= sideSwipeInset ? "left" : localX >= rect.width - sideSwipeInset ? "right" : null;
    edgeSwipeRef.current = edge ? {pointerId:event.pointerId,edge,x:event.clientX,y:event.clientY} : null;
  };
  const finishEdgeSwipe = (event:ReactPointerEvent<HTMLDivElement>) => {
    const start = edgeSwipeRef.current;
    edgeSwipeRef.current = null;
    if (!start || start.pointerId !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 44 || Math.abs(dx) <= Math.abs(dy) * 1.1) return;
    if (start.edge === "right" && dx < 0) moveToAdjacentScope("next");
    else if (start.edge === "left" && dx > 0) moveToAdjacentScope("previous");
  };
  if (!profile) return null;
  const themeStyle = {
    "--activity-start": profile.theme.start,
    "--activity-end": profile.theme.end,
    "--activity-flat": profile.theme.start,
    "--activity-glow": profile.theme.glow,
    "--activity-gradient": `linear-gradient(90deg, ${profile.theme.start} 0%, ${profile.theme.end} 100%)`,
  } as CSSProperties;
  return <div ref={screenRef} className="app-screen activity-screen" style={themeStyle} onPointerDownCapture={beginEdgeSwipe} onPointerUpCapture={finishEdgeSwipe} onPointerCancelCapture={() => { edgeSwipeRef.current = null; }}><header ref={frozenHeaderRef} className="activity-frozen-header"><div className="page-heading"><div><h1>Activity Impacts</h1></div></div><Carousel className="scope-carousel activity-scope-carousel" contentClassName="scope-list activity-scope-list" engine="native" ariaLabel="Activity categories">{activityProfiles.map((item) => <button key={item.key} className={scope === item.key ? "selected" : ""} onClick={() => { setScopeTransition(null); setScope(item.key); }}>{item.label}</button>)}</Carousel></header><MobileScroll className="activity-scroll-surface" engine="native"><main key={`${scope}-${view}`} className={`page-content activity-content${scopeTransition ? ` is-scope-${scopeTransition}` : ""}`}><section className="activity-focus"><div className="activity-focus-heading"><div><p className="eyebrow">Activity</p><h2>{profile.label}</h2></div><div className="segment-control activity-mode-toggle" aria-label="Activity content mode"><button className={view === "impact" ? "selected" : ""} onClick={() => setView("impact")}>Impact</button><button data-quick-start="activity-actions" className={view === "actions" ? "selected" : ""} onClick={() => setView("actions")}>Actions</button></div></div></section>{view === "impact" ? <ActivityImpactPanel profile={profile} /> : <ActivityActionsPanel profile={profile} />}</main></MobileScroll></div>;
}

function ActivityImpactPanel({ profile }: { profile: ActivityProfile }) {
  const lens = profile.lens;
  const groups = Array.isArray(lens.groups) && lens.groups.length ? lens.groups : [{ key:"all", title:"", items:lens.items || [] }];
  const items = groups.flatMap((group: Record<string, any>) => group.items || []);
  const axisMax = Math.max(Number(lens.axisMax || 0), ...items.filter((item:Record<string,any>) => !item.excludeFromScale).map((item:Record<string,any>) => Number(item.value || 0)), 1);
  return <section className="activity-impact-panel"><div className="activity-groups">{groups.map((group:Record<string,any>) => <section className="activity-group" aria-label={group.title || "Impact measures"} key={group.key || group.title}>{(group.items || []).map((item:Record<string,any>) => <ActivityImpactRow key={`${group.key}-${item.label}`} item={item} axisMax={axisMax} unit={lens.unitLabel || "relative value"} />)}</section>)}</div></section>;
}

function ActivityImpactRow({ item, axisMax, unit }: { item: Record<string, any>; axisMax: number; unit: string }) {
  const width = Math.max(0, Math.min(100,(Number(item.value || 0) / axisMax) * 100));
  const components = Array.isArray(item.components) ? item.components : [];
  const componentTotal = components.reduce((sum:number,component:Record<string,any>) => sum + Number(component.value || 0),0);
  return <article className={`activity-impact-row ${item.emphasis ? "is-emphasis" : ""} ${item.speculative ? "is-speculative" : ""}`}><div className="activity-row-head"><div><h4>{item.label}</h4>{item.typicalPortion ? <span>Typical portion: {formatMetricDisplayText(item.typicalPortion)}</span> : null}</div><p><strong>{formatImpactValue(item.value)}</strong><span>{compactImpactUnit(unit)}</span></p></div>{item.hideBar ? null : <div className="activity-bar-track"><i style={{"--activity-bar-width":`${width}%`} as CSSProperties}>{components.map((component:Record<string,any>) => <b key={component.label} style={{width:`${componentTotal ? (Number(component.value || 0)/componentTotal)*100 : 0}%`,background:component.color}} title={`${component.label}: ${formatImpactValue(component.value)}`} />)}</i></div>}{item.emphasis ? <span className="activity-emphasis">{item.emphasis}</span> : null}{item.note ? <p className="activity-row-note">{formatMetricDisplayText(item.note)}</p> : null}</article>;
}

function ActivityActionsPanel({ profile }: { profile: ActivityProfile }) {
  const actions = profile.actions;
  return <section className="activity-actions-panel"><article className="activity-action-lead"><span>{actions.confidence}</span><h3><strong>Immediate action</strong>{actions.strongestAction}</h3></article><ActivityActionTier icon={PersonIcon} title="Personal" items={actions.personal || []} tone="personal" /><ActivityActionTier icon={GlobeIcon} title="Community" items={actions.community || []} tone="community" /><ActivityActionTier icon={RocketIcon} title="Policy" items={actions.policy || []} tone="policy" /></section>;
}

function ActivityActionTier({ icon: CardIcon, title, items, tone }: { icon: Icon; title: string; items:string[]; tone:string }) {
  return <article className={`activity-action-tier ${tone}`}><header><CardIcon /><h3>{title}</h3></header><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></article>;
}

type FootprintMetricTrend = "up" | "down" | "neutral";
type FootprintMetricKey = "carbon" | "water" | "land" | "material";

function getFootprintMetricTrend(currentValue:number, previousValue:number | undefined):FootprintMetricTrend {
  if (typeof previousValue !== "number") return "neutral";
  if (currentValue > previousValue) return "up";
  if (currentValue < previousValue) return "down";
  return "neutral";
}

function FootprintMetricStrip({ result, trends }: { result: ReturnType<typeof calculateFootprint>; trends:Record<FootprintMetricKey,FootprintMetricTrend> }) {
  const hasAnswers = result.answered > 0;
  const metrics = [
    { label:"Carbon Emissions", value:hasAnswers ? `${result.carbon.toFixed(1)} tCO2e/yr` : "--", tone:"carbon" as const, trend:trends.carbon },
    { label:"Water Usage", value:hasAnswers ? `${result.water.toLocaleString("en-US")} m³/yr` : "--", tone:"water" as const, trend:trends.water },
    { label:"Land Impact", value:hasAnswers ? `${result.land.toLocaleString("en-US")} m²·yr` : "--", tone:"land" as const, trend:trends.land },
    { label:"Raw Material Usage", value:hasAnswers ? `${result.material.toFixed(1)} t RME/yr` : "--", tone:"material" as const, trend:trends.material },
  ];
  return <section className={`footprint-metric-strip ${hasAnswers ? "has-values" : "is-empty"}`} aria-label="Current footprint metrics" aria-live="polite">{metrics.map((metric) => <span className={`footprint-metric-chip ${metric.tone} is-${metric.trend}`} key={metric.label}>{metric.trend === "neutral" ? <i aria-hidden="true" /> : <i aria-hidden="true">{metric.trend === "up" ? "↑" : "↓"}</i>}<strong>{metric.label}</strong><span>{metric.value}</span></span>)}</section>;
}

function FootprintScreen({ resetRequest, onNavCompactChange }: { resetRequest:number; onNavCompactChange:(compact:boolean) => void }) {
  const [answers, setAnswers] = useState<FootprintAnswer>({});
  const [step, setStep] = useState(0);
  const [questionTransition,setQuestionTransition] = useState<"idle" | "back-exit" | "back-enter" | "forward-exit" | "forward-enter" | "forward-settle">("idle");
  const advanceTimerRef = useRef<number | null>(null);
  const forwardExitTimerRef = useRef<number | null>(null);
  const backExitTimerRef = useRef<number | null>(null);
  const backEnterFrameRef = useRef<number | null>(null);
  const backSettleFrameRef = useRef<number | null>(null);
  const forwardSettleTimerRef = useRef<number | null>(null);
  const backSwipeRef = useRef<{ x:number; y:number } | null>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const frozenHeaderRef = useRef<HTMLElement>(null);
  const baselineResult = useMemo(() => calculateFootprint({}), []);
  const result = useMemo(() => calculateFootprint(answers), [answers]);
  const baselineMetrics = useMemo(() => ({carbon:baselineResult.carbon,water:baselineResult.water,land:baselineResult.land,material:baselineResult.material}),[baselineResult]);
  const previousMetricsRef = useRef<Record<FootprintMetricKey,number>>(baselineMetrics);
  const previousTrendsRef = useRef<Record<FootprintMetricKey,FootprintMetricTrend>>({carbon:"neutral",water:"neutral",land:"neutral",material:"neutral"});
  const [metricTrends,setMetricTrends] = useState<Record<FootprintMetricKey,FootprintMetricTrend>>(previousTrendsRef.current);
  const showingSummary = step >= footprintQuestions.length;
  const question = footprintQuestions[Math.min(step, footprintQuestions.length - 1)];
  const selected = answers[question.key];
  useEffect(() => {
    if (resetRequest === 0) return;
    const hasCompleteResult = footprintQuestions.every((item) => answers[item.key] !== undefined);
    if (!hasCompleteResult) return;
    cancelBackTransition();
    setStep(footprintQuestions.length);
    window.requestAnimationFrame(() => {
      screenRef.current?.querySelector<HTMLElement>(".footprint-scroll-surface .mobile-scroll")
        ?.scrollTo({top:0,behavior:"smooth"});
    });
  },[resetRequest]);
  useEffect(() => {
    if (result.answered === 0) {
      previousMetricsRef.current = baselineMetrics;
      previousTrendsRef.current = {carbon:"neutral",water:"neutral",land:"neutral",material:"neutral"};
      setMetricTrends(previousTrendsRef.current);
      return;
    }
    const currentMetrics:Record<FootprintMetricKey,number> = {carbon:result.carbon,water:result.water,land:result.land,material:result.material};
    const nextTrends = (Object.keys(currentMetrics) as FootprintMetricKey[]).reduce<Record<FootprintMetricKey,FootprintMetricTrend>>((next,key) => {
      const changedTrend = getFootprintMetricTrend(currentMetrics[key],previousMetricsRef.current[key]);
      next[key] = changedTrend === "neutral" ? previousTrendsRef.current[key] : changedTrend;
      return next;
    },{carbon:"neutral",water:"neutral",land:"neutral",material:"neutral"});
    previousMetricsRef.current = currentMetrics;
    previousTrendsRef.current = nextTrends;
    setMetricTrends(nextTrends);
  },[baselineMetrics,result.answered,result.carbon,result.water,result.land,result.material]);
  useEffect(() => () => {
    if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
    if (forwardExitTimerRef.current !== null) window.clearTimeout(forwardExitTimerRef.current);
    if (backExitTimerRef.current !== null) window.clearTimeout(backExitTimerRef.current);
    if (backEnterFrameRef.current !== null) window.cancelAnimationFrame(backEnterFrameRef.current);
    if (backSettleFrameRef.current !== null) window.cancelAnimationFrame(backSettleFrameRef.current);
    if (forwardSettleTimerRef.current !== null) window.clearTimeout(forwardSettleTimerRef.current);
  }, []);
  useEffect(() => {
    const screen = screenRef.current;
    const header = frozenHeaderRef.current;
    if (!screen || !header) return;
    const syncHeight = () => screen.style.setProperty("--footprint-frozen-header-height",`${header.offsetTop + header.offsetHeight}px`);
    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(header);
    observer.observe(screen);
    window.addEventListener("resize",syncHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize",syncHeight);
    };
  }, []);
  useEffect(() => {
    const scroller = screenRef.current?.querySelector<HTMLElement>(".footprint-scroll-surface .mobile-scroll");
    if (!scroller) return;
    let frame = 0;
    let lastScrollTop = scroller.scrollTop;
    onNavCompactChange(false);
    const syncNavSize = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const nextScrollTop = scroller.scrollTop;
        const delta = nextScrollTop - lastScrollTop;
        lastScrollTop = nextScrollTop;
        if (nextScrollTop <= 8 || delta < -2) onNavCompactChange(false);
        else if (delta > 2) onNavCompactChange(true);
      });
    };
    scroller.addEventListener("scroll",syncNavSize,{passive:true});
    return () => {
      scroller.removeEventListener("scroll",syncNavSize);
      if (frame) window.cancelAnimationFrame(frame);
      onNavCompactChange(false);
    };
  },[showingSummary,onNavCompactChange]);
  const choose = (value: string) => {
    if (questionTransition !== "idle") return;
    setAnswers((current) => ({...current,[question.key]:value}));
    if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = window.setTimeout(() => {
      advanceTimerRef.current = null;
      setQuestionTransition("forward-exit");
      forwardExitTimerRef.current = window.setTimeout(() => {
        forwardExitTimerRef.current = null;
        setStep((current) => Math.min(footprintQuestions.length,current + 1));
        setQuestionTransition("forward-enter");
        backEnterFrameRef.current = window.requestAnimationFrame(() => {
          backEnterFrameRef.current = null;
          backSettleFrameRef.current = window.requestAnimationFrame(() => {
            backSettleFrameRef.current = null;
            setQuestionTransition("forward-settle");
            forwardSettleTimerRef.current = window.setTimeout(() => {
              forwardSettleTimerRef.current = null;
              setQuestionTransition("idle");
            },420);
          });
        });
      },420);
    },90);
  };
  const cancelBackTransition = () => {
    if (backExitTimerRef.current !== null) window.clearTimeout(backExitTimerRef.current);
    if (backEnterFrameRef.current !== null) window.cancelAnimationFrame(backEnterFrameRef.current);
    if (backSettleFrameRef.current !== null) window.cancelAnimationFrame(backSettleFrameRef.current);
    if (forwardSettleTimerRef.current !== null) window.clearTimeout(forwardSettleTimerRef.current);
    backExitTimerRef.current = null;
    backEnterFrameRef.current = null;
    backSettleFrameRef.current = null;
    forwardSettleTimerRef.current = null;
    if (forwardExitTimerRef.current !== null) window.clearTimeout(forwardExitTimerRef.current);
    forwardExitTimerRef.current = null;
    setQuestionTransition("idle");
  };
  const reset = () => {
    if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = null;
    cancelBackTransition();
    setAnswers({});
    setStep(0);
  };
  const goBack = () => {
    if (questionTransition !== "idle" || step === 0 || showingSummary) return;
    if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = null;
    setQuestionTransition("back-exit");
    backExitTimerRef.current = window.setTimeout(() => {
      backExitTimerRef.current = null;
      setStep((value) => Math.max(0,value - 1));
      setQuestionTransition("back-enter");
      backEnterFrameRef.current = window.requestAnimationFrame(() => {
        backEnterFrameRef.current = null;
        backSettleFrameRef.current = window.requestAnimationFrame(() => {
          backSettleFrameRef.current = null;
          setQuestionTransition("idle");
        });
      });
    }, 190);
  };
  const beginBackSwipe = (event:ReactTouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    backSwipeRef.current = touch ? { x:touch.clientX,y:touch.clientY } : null;
  };
  const completeBackSwipe = (x:number,y:number) => {
    const start = backSwipeRef.current;
    backSwipeRef.current = null;
    if (!start || showingSummary || step === 0) return;
    const dx = x - start.x;
    const dy = y - start.y;
    if (dx >= 64 && Math.abs(dx) > Math.abs(dy) * 1.35) goBack();
  };
  const finishBackSwipe = (event:ReactTouchEvent<HTMLElement>) => {
    const touch = event.changedTouches[0];
    if (touch) completeBackSwipe(touch.clientX,touch.clientY);
    else backSwipeRef.current = null;
  };
  const beginPointerBackSwipe = (event:ReactPointerEvent<HTMLElement>) => {
    backSwipeRef.current = { x:event.clientX,y:event.clientY };
  };
  const finishPointerBackSwipe = (event:ReactPointerEvent<HTMLElement>) => completeBackSwipe(event.clientX,event.clientY);
  return <div ref={screenRef} className={`app-screen footprint-screen ${showingSummary ? "is-summary" : "is-questionnaire"}`}><header ref={frozenHeaderRef} className="footprint-frozen-header"><div className="footprint-title-row"><div><h1>My Footprint</h1><p className="subtitle">A benchmark estimate across home, travel, food and purchasing.</p></div></div>{showingSummary || result.answered === 0 ? null : <FootprintMetricStrip result={result} trends={metricTrends} />}<div className="progress-track"><i style={{width:`${showingSummary ? 100 : ((step + 1) / footprintQuestions.length) * 100}%`}} /></div></header><MobileScroll key={showingSummary ? "footprint-summary" : "footprint-questions"} className="footprint-scroll-surface"><main className={`page-content footprint-content is-${questionTransition}`} onTouchStart={beginBackSwipe} onTouchEnd={finishBackSwipe} onTouchCancel={() => { backSwipeRef.current = null; }} onPointerDown={beginPointerBackSwipe} onPointerUp={finishPointerBackSwipe} onPointerCancel={() => { backSwipeRef.current = null; }}>{!showingSummary ? <section className="question-card"><p className="question-number">{question.title}</p><div className="answer-list" data-quick-start="footprint-answers">{question.options.map((option) => <button key={option.value} className={selected === option.value ? "selected" : ""} onClick={() => choose(option.value)} aria-pressed={selected === option.value}><strong>{option.label}</strong></button>)}</div></section> : <FootprintSummary result={result} onReview={() => setStep(0)} onReset={reset} />}</main></MobileScroll></div>;
}

function FootprintSummary({ result, onReview, onReset }: { result: ReturnType<typeof calculateFootprint>; onReview: () => void; onReset: () => void }) {
  const rank = estimateGlobalCarbonPercentile(result.carbon);
  const equivalencies = getFootprintEquivalencies({ carbonTotal:result.carbon,waterTotalM3:result.water,landTotalM2:result.land,materialTotalTonnes:result.material });
  const equivalencyByKey = new Map<string,Record<string,string>>(equivalencies.map((item:Record<string,string>) => [item.key,item]));
  let cumulativeCarbon = 0;
  const waterfall = result.breakdown.map((item,index) => {
    const start = cumulativeCarbon;
    cumulativeCarbon += item.carbon;
    return {...item,startPercent:(start / Math.max(result.carbon,.1)) * 100,widthPercent:(item.carbon / Math.max(result.carbon,.1)) * 100,color:footprintBreakdownColors[index % footprintBreakdownColors.length]};
  });
  return <section className="footprint-result">{rank ? <section className="footprint-rank"><strong>{rank.populationLabel}</strong><span>has a lower estimated annual carbon footprint · 2019 WID reference</span></section> : null}<h3 className="footprint-section-title">Your footprint in human terms</h3><div className="metric-grid"><MetricCard label="Carbon" value={result.carbon.toFixed(1)} unit="tCO2e/yr" tone="carbon" context={equivalencyByKey.get("carbon")} /><MetricCard label="Land" value={result.land.toLocaleString("en-US")} unit="m²·yr" tone="land" context={equivalencyByKey.get("land")} /><MetricCard label="Water" value={result.water.toLocaleString("en-US")} unit="m³/yr" tone="water" context={equivalencyByKey.get("water")} /><MetricCard label="RME" value={result.material.toFixed(1)} unit="t RME/yr" tone="rme" context={equivalencyByKey.get("materials")} /></div><section className="breakdown-card"><header><h3>What builds your carbon footprint</h3><strong>{result.carbon.toFixed(1)} tCO2e/yr</strong></header>{waterfall.map((item) => <div className="breakdown-row" key={item.key}><span>{item.label}</span><div><i style={{left:`${item.startPercent}%`,width:`${Math.max(item.widthPercent,1)}%`,background:item.color}} /></div><strong>{item.carbon.toFixed(1)}</strong></div>)}<div className="breakdown-total"><span>Total carbon footprint</span><strong>{result.carbon.toFixed(1)}</strong></div></section><section className="footprint-section-table" aria-labelledby="footprint-section-table-title"><h3 id="footprint-section-table-title">Annual footprint by section</h3><div className="footprint-table" role="table"><div className="footprint-table-row is-header" role="row"><span>Section</span><span>Carbon</span><span>Water</span><span>Land</span><span>RME</span></div>{result.sectionSummaries.map((section) => <div className="footprint-table-row" role="row" key={section.label}><strong>{section.label}</strong><span>{section.carbon.toFixed(1)} t</span><span>{section.water.toLocaleString("en-US")} m³</span><span>{section.land.toLocaleString("en-US")} m²</span><span>{section.material.toFixed(1)} t</span></div>)}<div className="footprint-table-row is-total" role="row"><strong>Total</strong><span>{result.carbon.toFixed(1)} t</span><span>{result.water.toLocaleString("en-US")} m³</span><span>{result.land.toLocaleString("en-US")} m²</span><span>{result.material.toFixed(1)} t</span></div></div></section><p className="method-note">This is a benchmarked proxy, not a direct measurement. The carbon rank uses 2019 World Inequality Lab thresholds; comparisons communicate scale, while the scientific units carry the estimate.</p><div className="result-actions"><button onClick={onReview}>Review answers</button><button onClick={onReset}>Start over</button></div></section>;
}

function MetricCard({ label, value, unit, tone, context }: { label:string; value:string; unit:string; tone:string; context?:Record<string,string> }) {
  return <article className={`metric-card ${tone}`}><div className="metric-card-heading"><p className="eyebrow">{label}</p><p><strong>{value}</strong><span>{unit}</span></p></div>{context ? <div className="metric-human-copy"><strong>{context.headline}</strong><span>{context.descriptor}</span></div> : null}</article>;
}

function TulipScoreInfo() {
  const bandDescription = TULIP_URGENCY_BANDS_V3.map((band:Record<string,any>) => `${band.min.toFixed(1)}–${band.max.toFixed(1)} is ${band.label}`).join(", ").replace(/, ([^,]+)$/,", and $1");
  const exampleBand = getTulipUrgencyBandV3(7.3);
  return <div className="desktop-info-copy score-info-copy"><p className="info-eyebrow">Global urgency · 1.0 to 10.0</p><h2>How urgent is this issue now?</h2><p>The TULIP Score is a 1–10 urgency rating for climate and environmental problems. It combines evidence about how serious a problem is now, how close it is to a dangerous level, whether it is getting worse, and how widely it is happening.</p><details open><summary>Choose the evidence</summary><div><p>TULIP prefers recent, global measurements. When those are available, it asks four questions: <strong>How large is the problem now? How close is it to a dangerous threshold? How quickly is it changing? How much of the world does it affect?</strong></p><p>If current measurements are incomplete, TULIP uses documented harm that has already occurred—to natural systems, people, and the economy. A model estimate is used only as a last resort and is clearly marked <strong>Modeled</strong>.</p></div></details><details><summary>Translate to one scale</summary><div><p>Climate problems are measured in incompatible units: degrees of warming, tonnes of pollution, hectares lost, people exposed, or dollars of damage. Before combining them, TULIP translates every measurement to a common <strong>0–1 scale</strong>.</p><p><strong>0 means the reference condition. About 0.33 means concerning. About 0.67 means critical. 1 means extreme.</strong> A measurement between two points receives a value between them. This makes different kinds of problems comparable without pretending their original units are the same.</p></div></details><details><summary>Blend the four signals</summary><div><p>For issues with current data, current magnitude counts for <strong>30%</strong>, dangerous-threshold position for <strong>30%</strong>, momentum for <strong>25%</strong>, and geographic extent for <strong>15%</strong>.</p><p><strong>(magnitude × 0.30) + (threshold × 0.30) + (momentum × 0.25) + (extent × 0.15) = the weighted composite.</strong></p><p>When TULIP uses documented harm instead, the blend changes to <strong>35% physical or ecological harm, 30% harm to people or the economy, 20% persistence, and 15% geographic extent</strong>.</p><p><strong>TULIP Score = 1 + (9 × weighted composite).</strong> The result is rounded to one decimal place. <strong>{bandDescription}.</strong></p></div></details><details><summary>See the formula in action</summary><div><p>For Global Temperature, TULIP translates the evidence into four values: <strong>0.62 for current magnitude, 0.62 for threshold position, 0.71 for momentum, and 1.00 for global extent.</strong></p><p><strong>(0.62 × 0.30) + (0.62 × 0.30) + (0.71 × 0.25) + (1.00 × 0.15) ≈ 0.70.</strong> Convert it to 1–10: <strong>1 + (9 × 0.70) = 7.3.</strong> Global Temperature therefore receives a TULIP Score of <strong>7.3, or {exampleBand}</strong>.</p><p>A 7.3 does not mean 73% damage or a 73% chance of disaster. It means the available evidence places the issue high on TULIP's urgency scale. The score does not measure scientific confidence, popularity, or how easy the issue is to solve.</p><p><strong>Receipt verification is computational, not scientific proof.</strong> It checks that stored components reproduce the score and band and that hashed content has not changed. Scientific review separately evaluates the measurement, anchors, transformation, scoring route, and continuing source support.</p></div></details></div>;
}

function AboutTulipInfo() {
  return <div className="desktop-info-copy"><h2>Tracking Use, Loss, and Impact on the Planet</h2><p className="info-lead">The TULIP Project helps people understand how human choices affect Earth’s atmosphere, oceans, ecosystems, economies, and future.</p><p>It brings climate data and interconnected relationships into one explorable system.</p><p>This makes complex causes and consequences easier to understand without reducing them to a single story.</p><section><h3>What You Can Do</h3><ul><li>Explore connected environmental causes and effects</li><li>Follow what drives a problem and what it affects next</li><li>Understand how human activity influences the climate</li><li>Estimate your personal carbon, water, land, and material footprints</li></ul></section><p>TULIP combines public datasets, institutional monitoring, reported disclosures, and modeled relationships.</p><p>Not every connection carries the same level of certainty, and TULIP is not a substitute for primary scientific institutions.</p></div>;
}

function ContactTulipInfo() {
  const isNativeApp = Boolean((window as Window & { __TULIP_NATIVE_APP__?:boolean }).__TULIP_NATIVE_APP__);
  const [status,setStatus] = useState("Required fields must be completed. No tracking identifiers are added.");
  const submit = async (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("Sending…");
    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const response = await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      if (!response.ok) throw new Error("Contact request failed");
      form.reset();
      setStatus("Message sent. Thank you.");
    } catch {
      setStatus("This form could not send right now. Email aniket1.warade@gmail.com instead.");
    }
  };
  if (isNativeApp) return <div className="desktop-info-copy"><h2>Contact</h2><p className="info-lead">For partnerships, research collaboration, platform questions, data discussions, and institutional outreach related to TULIP.</p><p>Contact opens your email app. TULIP receives only the information you choose to include after you send the message.</p><a className="direct-email-link" href="mailto:aniket1.warade@gmail.com?subject=TULIP%20app%20support">Email TULIP support</a></div>;
  return <div className="desktop-info-copy"><h2>Contact</h2><p className="info-lead">For partnerships, research collaboration, platform questions, data discussions, and institutional outreach related to TULIP.</p><form className="mobile-contact-form" onSubmit={submit}><input type="hidden" name="_subject" value="New TULIP contact form message" /><input type="hidden" name="_template" value="table" /><label><span>Name</span><KeyboardInput name="name" autoComplete="name" maxLength={100} required /></label><label><span>Email</span><KeyboardInput type="email" name="email" autoComplete="email" maxLength={160} required /></label><label><span>Organization <small>Optional</small></span><KeyboardInput name="organization" autoComplete="organization" maxLength={140} /></label><label><span>Topic</span><select name="topic" required defaultValue=""><option value="" disabled>Select a topic</option><option>Platform question</option><option>Research collaboration</option><option>Data or evidence</option><option>Partnership</option><option>Other</option></select></label><label><span>Message</span><textarea name="message" rows={7} maxLength={4000} required /></label><p className="contact-privacy-note">Submitting sends the information above to TULIP so we can respond. It is not used for advertising or tracking.</p><button type="submit">Send message</button><p className="contact-status" role="status" aria-live="polite">{status}</p></form><a className="direct-email-link" href="mailto:aniket1.warade@gmail.com">aniket1.warade@gmail.com</a></div>;
}

function PrivacyTulipInfo() {
  return <div className="desktop-info-copy privacy-info-copy"><h2>Privacy</h2><p className="info-lead">TULIP does not use advertising trackers or sell personal information.</p><section><h3>Information stored on this device</h3><p>Search history, Analyse navigation history, and footprint answers may be stored locally so the app can preserve your progress. This information stays on your device and can be removed by deleting the app or clearing its data.</p></section><section><h3>When you contact TULIP</h3><p>The app opens your email app when you choose Contact. TULIP receives only the information you choose to include after you send the email. Correspondence is used only to respond to your request and maintain necessary records; it is not used for advertising or cross-app tracking.</p></section><section><h3>External sources</h3><p>Links to scientific sources open outside TULIP. Those sites have their own privacy practices. TULIP does not automatically send your footprint answers or app history to those sites.</p></section><section><h3>Your choices</h3><p>You can use the graph, Analyse, Activity Impacts, and My Footprint without creating an account or contacting TULIP. To ask about retained correspondence or request deletion, email the address below.</p></section><a className="direct-email-link" href="mailto:aniket1.warade@gmail.com">aniket1.warade@gmail.com</a><a className="direct-email-link" href="https://tulip-project-six.vercel.app/privacy.html" target="_blank" rel="noreferrer">View the full privacy policy</a></div>;
}

function SourceDirectoryInfo({ mode }: { mode:"sources"|"registries" }) {
  const [sourceRegistry,setSourceRegistry] = useState<Record<string,any> | null>(null);
  const [pipelineRegistry,setPipelineRegistry] = useState<Record<string,any> | null>(null);
  const [researchRegistry,setResearchRegistry] = useState<Record<string,any> | null>(null);
  const [query,setQuery] = useState("");
  const [showAllSources,setShowAllSources] = useState(false);
  const [showAllPipelines,setShowAllPipelines] = useState(false);
  const [showAllResearch,setShowAllResearch] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const sourceRequest = fetch(sourceRegistryUrl).then((response) => response.json()).then(metricizeDisplayValue);
        if (mode === "sources") {
          const sources = await sourceRequest;
          if (!cancelled) setSourceRegistry(sources);
          return;
        }
        const [sources,pipelines,research] = await Promise.all([sourceRequest,fetch(pipelineRegistryUrl).then((response) => response.json()).then(metricizeDisplayValue),fetch(researchBacklogUrl).then((response) => response.json()).then(metricizeDisplayValue)]);
        if (!cancelled) {
          setSourceRegistry(sources);
          setPipelineRegistry(pipelines);
          setResearchRegistry(research);
        }
      } catch {
        if (!cancelled) setSourceRegistry({sources:[],summary:{},error:true});
      }
    };
    load();
    return () => { cancelled = true; };
  },[mode]);
  if (!sourceRegistry) return <p className="info-loading">Loading the desktop {mode === "sources" ? "source directory" : "registries"}…</p>;
  if (sourceRegistry.error) return <p className="info-loading">The desktop registry could not be loaded.</p>;
  const allSources = (sourceRegistry.sources || []) as SourceRegistryRecord[];
  const normalizedQuery = query.trim().toLowerCase();
  const matchingSources = normalizedQuery ? allSources.filter((source) => `${source.name} ${source.integration_bucket} ${source.access_classification} ${source.fit?.join(" ")} ${source.notes}`.toLowerCase().includes(normalizedQuery)) : allSources;
  const shownSources = showAllSources || normalizedQuery ? matchingSources : matchingSources.slice(0,40);
  if (mode === "sources") return <div className="registry-info"><p className="info-lead">Integrated global and regional networks providing observations, model projections, and policy metrics.</p><div className="registry-summary-grid">{Object.entries(sourceRegistry.summary || {}).map(([label,value]) => <article key={label}><strong>{Number(value).toLocaleString("en-US")}</strong><span>{humanizeKey(label)}</span></article>)}</div><label className="registry-search"><span>Search the complete source directory</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Organization, access type, or evidence use" /></label><div className="registry-record-list">{shownSources.map((source) => <SourceRecord key={source.id} source={source} />)}</div>{!showAllSources && !normalizedQuery && matchingSources.length > shownSources.length ? <button className="registry-show-all" onClick={() => setShowAllSources(true)}>Show all {matchingSources.length.toLocaleString("en-US")} sources</button> : null}</div>;
  const pipelines = pipelineRegistry?.pipelines || [];
  const campaignRecords = researchRegistry?.campaign_records || [];
  return <div className="registry-info"><p className="info-lead">Shared monitoring systems, dataset catalogs, disclosure layers, pipeline lineage, and research records available across the platform.</p><h2>Environmental Registries</h2><div className="registry-summary-grid">{Object.entries(sourceRegistry.summary || {}).slice(0,6).map(([label,value]) => <article key={label}><strong>{Number(value).toLocaleString("en-US")}</strong><span>{humanizeKey(label)}</span></article>)}</div><details className="registry-directory-section"><summary>Source intake registry <span>{allSources.length.toLocaleString("en-US")}</span></summary><div className="registry-record-list">{(showAllSources ? allSources : allSources.slice(0,24)).map((source) => <SourceRecord key={source.id} source={source} />)}</div>{!showAllSources && allSources.length > 24 ? <button className="registry-show-all" onClick={() => setShowAllSources(true)}>Show all source records</button> : null}</details><details className="registry-directory-section"><summary>Pipeline lineage <span>{pipelines.length.toLocaleString("en-US")}</span></summary><div className="registry-summary-grid">{Object.entries(pipelineRegistry?.summary || {}).map(([label,value]) => <article key={label}><strong>{Number(value).toLocaleString("en-US")}</strong><span>{humanizeKey(label)}</span></article>)}</div><div className="registry-record-list">{(showAllPipelines ? pipelines : pipelines.slice(0,20)).map((pipeline:Record<string,any>) => <article className="registry-record" key={pipeline.pipeline_id}><div><strong>{humanizeKey(pipeline.pipeline_id)}</strong><span>{pipeline.job?.cadence || "Cadence not specified"}</span></div><p>{pipeline.job?.provenance}</p><dl><div><dt>Snapshot</dt><dd>{pipeline.snapshot?.path}</dd></div><div><dt>API route</dt><dd>{pipeline.delivery?.api_route}</dd></div><div><dt>Bindings</dt><dd>{pipeline.bindings?.length || 0}</dd></div></dl></article>)}</div>{!showAllPipelines && pipelines.length > 20 ? <button className="registry-show-all" onClick={() => setShowAllPipelines(true)}>Show all pipeline records</button> : null}</details><details className="registry-directory-section"><summary>Research backlog and resolution ledger <span>{campaignRecords.length.toLocaleString("en-US")}</span></summary><div className="registry-summary-grid">{Object.entries(researchRegistry?.summary || {}).slice(0,10).map(([label,value]) => <article key={label}><strong>{Number(value).toLocaleString("en-US")}</strong><span>{humanizeKey(label)}</span></article>)}</div><div className="registry-record-list">{(showAllResearch ? campaignRecords : campaignRecords.slice(0,20)).map((record:Record<string,any>) => <article className="registry-record" key={record.id}><div><strong>{record.display_name}</strong><span>{humanizeKey(record.status)} · {humanizeKey(record.action)}</span></div><p>{record.rationale}</p><dl><div><dt>Sphere</dt><dd>{record.sphere}</dd></div><div><dt>Metric</dt><dd>{record.metric_contract_id || "Not assigned"}</dd></div><div><dt>Reviewed</dt><dd>{record.reviewed_at ? formatAppDate(record.reviewed_at) : "Pending"}</dd></div></dl>{record.source_urls?.length ? <div className="registry-record-links">{record.source_urls.map((url:string,index:number) => <a key={url} href={url} target="_blank" rel="noreferrer">Source {index + 1}<ExternalLinkIcon /></a>)}</div> : null}</article>)}</div>{!showAllResearch && campaignRecords.length > 20 ? <button className="registry-show-all" onClick={() => setShowAllResearch(true)}>Show all research records</button> : null}</details></div>;
}

function SourceRecord({ source }: { source:SourceRegistryRecord }) {
  return <article className="registry-record"><div><strong>{source.name}</strong><span>{humanizeKey(source.integration_bucket || "unclassified")} · {humanizeKey(source.access_classification || "access not classified")}</span></div>{source.notes ? <p>{formatMetricDisplayText(source.notes)}</p> : null}<dl><div><dt>Use</dt><dd>{formatMetricDisplayText(source.platform_use || "Reference and evidence support")}</dd></div><div><dt>Ingestion</dt><dd>{humanizeKey(source.ingestion_mode || "not specified")}</dd></div><div><dt>Refresh</dt><dd>{humanizeKey(source.refresh_style || "not specified")}</dd></div><div><dt>Status</dt><dd>{source.verified_now ? "Verified now" : "Registry record"}{source.needs_login ? " · Login needed" : ""}</dd></div></dl>{source.fit?.length ? <div className="registry-tags">{source.fit.map((tag) => <span key={tag}>{humanizeKey(tag)}</span>)}</div> : null}<a href={source.url} target="_blank" rel="noreferrer">Open source<ExternalLinkIcon /></a></article>;
}

function ExploreInfoPanel({ section, onClose }: { section:ExploreInfoSection; onClose:() => void }) {
  const titles:Record<ExploreInfoSection,string> = {score:"TULIP Score",sources:"Sources",registries:"Registries",about:"About TULIP",contact:"Contact",privacy:"Privacy"};
  return <section className="explore-info-panel" role="dialog" aria-modal="true" aria-labelledby="explore-info-title"><header><h1 id="explore-info-title">{titles[section]}</h1><button className="icon-button" onClick={onClose} aria-label={`Close ${titles[section]}`}><Cross1Icon width={22} height={22} /></button></header><MobileScroll className="explore-info-scroll"><main>{section === "score" ? <TulipScoreInfo /> : section === "sources" ? <SourceDirectoryInfo mode="sources" /> : section === "registries" ? <SourceDirectoryInfo mode="registries" /> : section === "about" ? <AboutTulipInfo /> : section === "privacy" ? <PrivacyTulipInfo /> : <ContactTulipInfo />}</main></MobileScroll></section>;
}

export default function Prototype() {
  useAccidentalTouchGuard();
  const keyboard = useKeyboard();
  useLayoutEffect(() => {
    // The initial HTML paints this shell before the JavaScript bundle loads.
    // Remove it only after React has committed the matching warmup overlay.
    document.getElementById("tulip-startup-shell")?.remove();
  },[]);
  const initialAnalyseCache = useMemo(() => readAnalyseNavigationCache(),[]);
  const [screen, setScreen] = useState<Screen>(() => {
    const requested = window.location.hash.slice(1) as Screen;
    return navItems.some((item) => item.id === requested) ? requested : "explore";
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [infoSection,setInfoSection] = useState<ExploreInfoSection | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [nodeName, setNodeName] = useState(initialAnalyseCache?.current.name || "Global Temperature");
  const [analyseExpandedOnOpen,setAnalyseExpandedOnOpen] = useState(initialAnalyseCache?.current.expanded || false);
  const [analyseEntryOrigin,setAnalyseEntryOrigin] = useState<AppPoint | null>(null);
  const [analyseTransition,setAnalyseTransition] = useState<"idle"|"forward"|"back">("idle");
  const [inspectorNavCompact,setInspectorNavCompact] = useState(false);
  const [activityNavCompact,setActivityNavCompact] = useState(false);
  const [footprintNavCompact,setFootprintNavCompact] = useState(false);
  const [exploreResetKey, setExploreResetKey] = useState(0);
  const [activityResetKey,setActivityResetKey] = useState(0);
  const [footprintResetKey,setFootprintResetKey] = useState(0);
  const [nativeRenderingActive,setNativeRenderingActive] = useState(
    () => (window as Window & { __TULIP_NATIVE_RENDERING_ACTIVE__?:boolean }).__TULIP_NATIVE_RENDERING_ACTIVE__ !== false,
  );
  // The iPhone shell owns the launch presentation. Keeping a second web
  // overlay here allowed the logo to remain after the native deadline while
  // the sphere's JavaScript thread was still busy initializing.
  const [startupWarmupVisible,setStartupWarmupVisible] = useState(
    () => !Boolean((window as Window & { __TULIP_NATIVE_APP__?:boolean }).__TULIP_NATIVE_APP__),
  );
  const [quickStartStep,setQuickStartStep] = useState<number | null>(null);
  const [quickStartCompleteVisible,setQuickStartCompleteVisible] = useState(false);
  const quickStartAutoPendingRef = useRef(
    !hasCompletedQuickStart()
      && window.matchMedia("(max-width: 700px)").matches
      && (!window.location.hash || window.location.hash === "#explore"),
  );
  const quickStartCompleteTimerRef = useRef<number | null>(null);
  const analyseHistoryRef = useRef<AnalyseHistoryEntry[]>(initialAnalyseCache?.history || []);
  const analyseNodeNameRef = useRef(nodeName);
  const analyseExpandedRef = useRef(initialAnalyseCache?.current.expanded || false);
  const analyseTransitionTimerRef = useRef<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    let dismissed = false;
    let minimumTimer:number | null = null;
    let maximumTimer:number | null = null;
    let readinessFrame:number | null = null;
    const isNativeApp = Boolean((window as Window & { __TULIP_NATIVE_APP__?:boolean }).__TULIP_NATIVE_APP__);
    const minimumWarmupMs = isNativeApp ? 120 : 900;
    const maximumWarmupMs = isNativeApp ? 650 : 2400;
    const startedAt = performance.now();
    const root = document.documentElement;
    root.dataset.featurePreload = "loading";
    root.dataset.startupWarmupMaxBreaths = isNativeApp ? "1" : "2";
    const dismissWarmup = () => {
      if (cancelled || dismissed) return;
      dismissed = true;
      setStartupWarmupVisible(false);
      (window as Window & { TULIPNative?:TulipNativeBridge }).TULIPNative?.startupReady?.();
    };
    const dismissAfterMinimumBreath = () => {
      const remaining = Math.max(0,minimumWarmupMs - (performance.now() - startedAt));
      minimumTimer = window.setTimeout(dismissWarmup,remaining);
    };
    const dismissWhenRendererIsReady = () => {
      const waitForRenderer = () => {
        if (cancelled) return;
        const canvas = document.querySelector<HTMLCanvasElement>(".desktop-sphere-canvas");
        const rendererReady = screen !== "explore" || canvas?.dataset.firstFrameRendered === "true";
        if (!rendererReady) {
          readinessFrame = window.requestAnimationFrame(waitForRenderer);
          return;
        }
        dismissAfterMinimumBreath();
      };
      waitForRenderer();
    };
    // The static HTML mark has already painted. Warm both heavy feature
    // resources concurrently while the matching React mark is breathing.
    maximumTimer = window.setTimeout(dismissWarmup,maximumWarmupMs);
    // Native Analyse is SwiftUI, so parsing the multi-megabyte web inspector
    // snapshot here only delays first paint. The browser build still warms it.
    const featureWarmups = isNativeApp
      ? [loadGraphResources()]
      : [loadGraphResources(),loadInspectorProfiles()];
    void Promise.all(featureWarmups).then(() => {
      if (!cancelled) {
        root.dataset.featurePreload = "ready";
        dismissWhenRendererIsReady();
      }
    }).catch(() => {
      graphResourcesPromise = null;
      inspectorProfilesPromise = null;
      if (!cancelled) {
        root.dataset.featurePreload = "failed";
        dismissAfterMinimumBreath();
      }
    });
    return () => {
      cancelled = true;
      if (minimumTimer !== null) window.clearTimeout(minimumTimer);
      if (maximumTimer !== null) window.clearTimeout(maximumTimer);
      if (readinessFrame !== null) window.cancelAnimationFrame(readinessFrame);
      delete root.dataset.featurePreload;
      delete root.dataset.startupWarmupMaxBreaths;
    };
  },[]);
  useEffect(() => {
    document.documentElement.dataset.tulipScreen = screen;
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeColor) themeColor.content = screen === "analyse" ? "#1d1d21" : "#000000";
    return () => {
      delete document.documentElement.dataset.tulipScreen;
      if (themeColor) themeColor.content = "#000000";
    };
  }, [screen]);
  useEffect(() => () => {
    if (analyseTransitionTimerRef.current !== null) window.clearTimeout(analyseTransitionTimerRef.current);
    if (quickStartCompleteTimerRef.current !== null) window.clearTimeout(quickStartCompleteTimerRef.current);
  },[]);
  useEffect(() => {
    const phoneViewport = window.matchMedia("(max-width: 700px)");
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
    const userAgent = window.navigator.userAgent;
    const isIOS = /iP(?:hone|ad|od)/.test(userAgent)
      || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
    const isSafari = /Safari/i.test(userAgent) && !/(CriOS|FxiOS|EdgiOS|OPiOS)/i.test(userAgent);
    if (!phoneViewport.matches || standalone || !isIOS || !isSafari) return;

    const root = document.documentElement;
    const proxyLimit = IOS_SCROLL_PROXY_DISTANCE;
    let returnStartY:number | null = null;
    let returnStartScrollY = 0;
    let returningFromTop = false;
    let proxyGestureActive = false;
    let autoUnlockFrame:number | null = null;
    let autoUnlockTimer:number | null = null;
    let autoUnlockAttempts = 0;
    let autoUnlockAborted = false;

    const setProxyMode = (mode:"armed"|"active") => {
      root.dataset.tulipScrollProxy = mode;
      root.style.setProperty("--tulip-scroll-proxy-distance",`${proxyLimit}px`);
    };
    const syncProxyMode = () => {
      if (proxyGestureActive) return;
      setProxyMode(window.scrollY > 24 ? "active" : "armed");
    };
    const cancelAutoUnlock = (rearm = false) => {
      autoUnlockAborted = true;
      if (autoUnlockFrame !== null) window.cancelAnimationFrame(autoUnlockFrame);
      if (autoUnlockTimer !== null) window.clearTimeout(autoUnlockTimer);
      autoUnlockFrame = null;
      autoUnlockTimer = null;
      if (rearm) {
        window.scrollTo(0,1);
        setProxyMode("armed");
      }
    };
    const attemptAutoUnlock = () => {
      if (autoUnlockAborted || document.visibilityState === "hidden") return;
      autoUnlockAttempts += 1;
      const viewportBefore = window.visualViewport?.height ?? window.innerHeight;
      const startedAt = performance.now();
      const duration = 260;
      window.scrollTo(0,1);
      setProxyMode("armed");
      const advanceRunway = (now:number) => {
        if (autoUnlockAborted) return;
        const progress = Math.max(0,Math.min(1,(now - startedAt) / duration));
        const eased = 1 - Math.pow(1 - progress,3);
        window.scrollTo(0,1 + ((proxyLimit - 1) * eased));
        if (progress < 1) {
          autoUnlockFrame = window.requestAnimationFrame(advanceRunway);
          return;
        }
        autoUnlockFrame = null;
        autoUnlockTimer = window.setTimeout(() => {
          autoUnlockTimer = null;
          if (autoUnlockAborted) return;
          const viewportAfter = window.visualViewport?.height ?? window.innerHeight;
          if (viewportAfter - viewportBefore > 12) {
            setProxyMode("active");
            return;
          }
          window.scrollTo(0,1);
          setProxyMode("armed");
          if (autoUnlockAttempts < 2) autoUnlockTimer = window.setTimeout(attemptAutoUnlock,420);
        },140);
      };
      autoUnlockFrame = window.requestAnimationFrame(advanceRunway);
    };
    const seedProxy = () => {
      if (document.fullscreenElement || (document as FullscreenDocument).webkitFullscreenElement) return;
      cancelAutoUnlock();
      autoUnlockAborted = false;
      autoUnlockAttempts = 0;
      window.scrollTo(0,1);
      setProxyMode("armed");
      autoUnlockTimer = window.setTimeout(attemptAutoUnlock,80);
    };
    const beginReturnGesture = (event:TouchEvent) => {
      if (document.fullscreenElement || (document as FullscreenDocument).webkitFullscreenElement) return;
      if (event.touches.length !== 1) return;
      cancelAutoUnlock(true);
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(".analysis-sheet-shell")) return;
      if (root.dataset.tulipScrollProxy === "armed") {
        proxyGestureActive = true;
        return;
      }
      if (root.dataset.tulipScrollProxy !== "active") return;
      const scrollSurface = target?.closest<HTMLElement>(".mobile-scroll");
      if (!scrollSurface || scrollSurface.scrollTop > 1) return;
      returnStartY = event.touches[0].clientY;
      returnStartScrollY = window.scrollY;
      returningFromTop = true;
    };
    const moveReturnGesture = (event:TouchEvent) => {
      if (!returningFromTop || returnStartY === null || event.touches.length !== 1) return;
      const downwardDistance = event.touches[0].clientY - returnStartY;
      if (downwardDistance <= 6) return;
      window.scrollTo(0,Math.max(1,returnStartScrollY - downwardDistance));
    };
    const blockAppDragWhileArmed = (event:PointerEvent) => {
      if (document.fullscreenElement || (document as FullscreenDocument).webkitFullscreenElement) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(".analysis-sheet-shell")) return;
      if (proxyGestureActive && event.pointerType === "touch") event.stopPropagation();
    };
    const endReturnGesture = () => {
      returnStartY = null;
      returningFromTop = false;
      proxyGestureActive = false;
      syncProxyMode();
    };
    const syncFullscreenProxy = () => {
      const isFullscreen = Boolean(document.fullscreenElement || (document as FullscreenDocument).webkitFullscreenElement);
      if (isFullscreen) {
        cancelAutoUnlock();
        window.scrollTo(0,0);
        delete root.dataset.tulipScrollProxy;
        root.style.removeProperty("--tulip-scroll-proxy-distance");
      } else {
        seedProxy();
      }
    };

    setProxyMode("armed");
    const seedFrame = window.requestAnimationFrame(seedProxy);
    window.addEventListener("pageshow",seedProxy);
    window.addEventListener("scroll",syncProxyMode,{ passive:true });
    window.addEventListener("touchstart",beginReturnGesture,{ capture:true,passive:true });
    window.addEventListener("touchmove",moveReturnGesture,{ capture:true,passive:true });
    window.addEventListener("touchend",endReturnGesture,{ capture:true,passive:true });
    window.addEventListener("touchcancel",endReturnGesture,{ capture:true,passive:true });
    window.addEventListener("pointermove",blockAppDragWhileArmed,true);
    document.addEventListener("fullscreenchange",syncFullscreenProxy);
    document.addEventListener("webkitfullscreenchange",syncFullscreenProxy);
    return () => {
      cancelAutoUnlock();
      window.cancelAnimationFrame(seedFrame);
      window.removeEventListener("pageshow",seedProxy);
      window.removeEventListener("scroll",syncProxyMode);
      window.removeEventListener("touchstart",beginReturnGesture,true);
      window.removeEventListener("touchmove",moveReturnGesture,true);
      window.removeEventListener("touchend",endReturnGesture,true);
      window.removeEventListener("touchcancel",endReturnGesture,true);
      window.removeEventListener("pointermove",blockAppDragWhileArmed,true);
      document.removeEventListener("fullscreenchange",syncFullscreenProxy);
      document.removeEventListener("webkitfullscreenchange",syncFullscreenProxy);
      delete root.dataset.tulipScrollProxy;
      root.style.removeProperty("--tulip-scroll-proxy-distance");
    };
  }, []);
  useEffect(() => {
    const syncHash = () => {
      const next = window.location.hash.slice(1) as Screen;
      if (navItems.some((item) => item.id === next)) setScreen(next);
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);
  const navigate = (nextScreen: Screen) => {
    keyboard.hide();
    setInspectorNavCompact(false);
    setActivityNavCompact(false);
    setFootprintNavCompact(false);
    const isReselection = nextScreen === screen;
    if (isReselection && nextScreen === "activity") setActivityResetKey((value) => value + 1);
    if (isReselection && nextScreen === "footprint") setFootprintResetKey((value) => value + 1);
    if (nextScreen === "explore") setExploreResetKey((value) => value + 1);
    if (nextScreen === "analyse") {
      setAnalyseExpandedOnOpen(false);
      setAnalyseEntryOrigin(null);
      analyseExpandedRef.current = false;
      writeAnalyseNavigationCache({ name:nodeName,expanded:false },analyseHistoryRef.current);
    }
    window.location.hash = nextScreen;
    setScreen(nextScreen);
  };
  useEffect(() => {
    if (!Boolean((window as Window & { __TULIP_NATIVE_APP__?:boolean }).__TULIP_NATIVE_APP__)) return;
    const handleNativeNavigation = (event:Event) => {
      const detail = (event as CustomEvent<{ action?:string; screen?:string; filter?:string; active?:boolean }>).detail;
      if (detail?.action === "setRenderingActive") {
        setNativeRenderingActive(detail.active !== false);
        return;
      }
      if (detail?.action === "select") {
        const nextScreen = detail.screen as Screen;
        if (navItems.some((item) => item.id === nextScreen)) navigate(nextScreen);
        return;
      }
      if (detail?.action === "resetExplore") {
        if (screen !== "explore") navigate("explore");
        else setExploreResetKey((value) => value + 1);
        return;
      }
      if (detail?.action === "openExploreFilters") {
        keyboard.hide();
        if (screen !== "explore") navigate("explore");
        setFiltersOpen(true);
        return;
      }
      if (detail?.action === "setExploreFilter" && detail.filter) {
        if (screen !== "explore") navigate("explore");
        setActiveFilter(detail.filter);
        setFiltersOpen(false);
        return;
      }
      if (detail?.action === "startQuickStart") {
        startQuickStart();
      }
    };
    window.addEventListener("tulip-native-navigation",handleNativeNavigation);
    return () => window.removeEventListener("tulip-native-navigation",handleNativeNavigation);
  },[keyboard,screen]);
  const startQuickStart = useCallback(() => {
    quickStartAutoPendingRef.current = false;
    setFiltersOpen(false);
    setInfoSection(null);
    setQuickStartCompleteVisible(false);
    keyboard.hide();
    if (screen !== "explore") navigate("explore");
    setQuickStartStep(0);
  },[keyboard,screen]);
  const skipQuickStart = useCallback(() => {
    saveQuickStartCompletion();
    setQuickStartStep(null);
    keyboard.hide();
  },[keyboard]);
  const finishQuickStart = useCallback(() => {
    saveQuickStartCompletion();
    setQuickStartStep(null);
    keyboard.hide();
    navigate("explore");
    setQuickStartCompleteVisible(true);
    if (quickStartCompleteTimerRef.current !== null) window.clearTimeout(quickStartCompleteTimerRef.current);
    quickStartCompleteTimerRef.current = window.setTimeout(() => {
      quickStartCompleteTimerRef.current = null;
      setQuickStartCompleteVisible(false);
    },3200);
  },[keyboard]);
  const advanceQuickStart = useCallback(() => {
    if (quickStartStep === null) return;
    if (quickStartStep >= QUICK_START_STEPS.length - 1) {
      finishQuickStart();
      return;
    }
    setQuickStartStep(quickStartStep + 1);
  },[finishQuickStart,quickStartStep]);
  useEffect(() => {
    if (quickStartStep === null) return;
    const desiredScreen = QUICK_START_STEPS[quickStartStep]?.screen;
    if (!desiredScreen) return;
    setFiltersOpen(false);
    setInfoSection(null);
    if (screen !== desiredScreen) {
      keyboard.hide();
      navigate(desiredScreen);
    }
  },[quickStartStep]);
  useEffect(() => {
    if (startupWarmupVisible || !quickStartAutoPendingRef.current) return;
    quickStartAutoPendingRef.current = false;
    startQuickStart();
  },[startupWarmupVisible,startQuickStart]);
  const playAnalyseTransition = useCallback((direction:"forward"|"back") => {
    if (analyseTransitionTimerRef.current !== null) window.clearTimeout(analyseTransitionTimerRef.current);
    setAnalyseTransition(direction);
    analyseTransitionTimerRef.current = window.setTimeout(() => {
      analyseTransitionTimerRef.current = null;
      setAnalyseTransition("idle");
    },360);
  },[]);
  const showAnalysis = useCallback((name: string, initiallyExpanded = false, entryOrigin?:AppPoint) => {
    keyboard.hide();
    analyseHistoryRef.current = [];
    analyseNodeNameRef.current = name;
    analyseExpandedRef.current = initiallyExpanded;
    setNodeName(name);
    setAnalyseExpandedOnOpen(initiallyExpanded);
    setAnalyseEntryOrigin(entryOrigin || null);
    setAnalyseTransition("idle");
    writeAnalyseNavigationCache({ name,expanded:initiallyExpanded },[]);
    window.location.hash = "analyse";
    setScreen("analyse");
  }, [keyboard]);
  const openAnalysisNode = useCallback((name:string) => {
    if (name === nodeName) return;
    keyboard.hide();
    const nextHistory = [...analyseHistoryRef.current,{ name:nodeName,expanded:analyseExpandedRef.current }].slice(-ANALYSE_HISTORY_LIMIT);
    analyseHistoryRef.current = nextHistory;
    analyseNodeNameRef.current = name;
    analyseExpandedRef.current = true;
    setAnalyseExpandedOnOpen(true);
    setAnalyseEntryOrigin(null);
    playAnalyseTransition("forward");
    setNodeName(name);
    writeAnalyseNavigationCache({ name,expanded:true },nextHistory);
  },[keyboard,nodeName,playAnalyseTransition]);
  const goBackInAnalysis = useCallback(() => {
    const previous = analyseHistoryRef.current.at(-1);
    if (!previous) return;
    const nextHistory = analyseHistoryRef.current.slice(0,-1);
    analyseHistoryRef.current = nextHistory;
    analyseNodeNameRef.current = previous.name;
    analyseExpandedRef.current = previous.expanded;
    setAnalyseExpandedOnOpen(previous.expanded);
    setAnalyseEntryOrigin(null);
    playAnalyseTransition("back");
    setNodeName(previous.name);
    writeAnalyseNavigationCache(previous,nextHistory);
  },[playAnalyseTransition]);
  const rememberAnalyseExpanded = useCallback((name:string,expanded:boolean) => {
    if (name !== analyseNodeNameRef.current) return;
    analyseExpandedRef.current = expanded;
    writeAnalyseNavigationCache({ name,expanded },analyseHistoryRef.current);
  },[]);
  const openAnalysisFromExplore = useCallback((name:string,origin?:AppPoint) => {
    const nativeBridge = (window as Window & { TULIPNative?:TulipNativeBridge }).TULIPNative;
    if (nativeBridge?.openInspector) {
      nativeBridge.openInspector(name);
      return;
    }
    showAnalysis(name,true,origin);
  },[showAnalysis]);
  const bottomNavVisible = !keyboard.visible && !infoSection;
  const bottomNavCompact = (screen === "analyse" && inspectorNavCompact)
    || (screen === "activity" && activityNavCompact)
    || (screen === "footprint" && footprintNavCompact);
  useEffect(() => {
    (window as Window & { TULIPNative?:TulipNativeBridge }).TULIPNative?.navigationState?.({
      active:screen,
      visible:bottomNavVisible,
      compact:bottomNavCompact,
      quickStartActive:quickStartStep !== null,
    });
  },[bottomNavCompact,bottomNavVisible,quickStartStep,screen]);
  return <div className={`tulip-app${quickStartStep !== null ? " is-quick-start" : ""}${bottomNavVisible ? " has-bottom-nav" : ""}`}>
    {startupWarmupVisible ? <div className="startup-warmup" role="status" aria-label="Preparing TULIP"><img src="/assets/app-icon/tulip-icon-192.png?v=20260813-1" alt="" aria-hidden="true" width={192} height={192} /></div> : null}
    <ExploreScreen active={screen === "explore"} suspended={screen !== "explore" || filtersOpen || Boolean(infoSection) || !nativeRenderingActive} activeFilter={activeFilter} resetKey={exploreResetKey} onOpenInfo={setInfoSection} onStartQuickStart={startQuickStart} onAnalyse={openAnalysisFromExplore} />
    {screen === "search" ? <SearchScreen onClose={() => navigate("explore")} onResult={(name) => showAnalysis(name)} /> : null}
    {screen === "analyse" ? <AnalyseScreen key={nodeName} name={nodeName} initiallyExpanded={analyseExpandedOnOpen} entryOrigin={analyseEntryOrigin} transition={analyseTransition} onSelectNode={openAnalysisNode} onBack={goBackInAnalysis} onExpandedChange={rememberAnalyseExpanded} onNavCompactChange={setInspectorNavCompact} /> : null}
    {screen === "activity" ? <ActivityScreen resetRequest={activityResetKey} onNavCompactChange={setActivityNavCompact} /> : null}
    {screen === "footprint" ? <FootprintScreen resetRequest={footprintResetKey} onNavCompactChange={setFootprintNavCompact} /> : null}
    {bottomNavVisible ? <BottomNav active={screen} compact={bottomNavCompact} onChange={navigate} onExploreLongPress={() => setFiltersOpen(true)} /> : null}
    {infoSection ? <ExploreInfoPanel section={infoSection} onClose={() => setInfoSection(null)} /> : null}
    <BottomSheet open={filtersOpen} onOpenChange={setFiltersOpen} title="Pick a System" snap={0.62}><div className="explore-filter-list">{exploreFilters.map(([value,label]) => <button key={value} className={activeFilter === value ? "active" : ""} onClick={() => { setActiveFilter(value); setFiltersOpen(false); }} aria-pressed={activeFilter === value}><span className="filter-swatch" data-filter={value} /><span>{label}</span>{activeFilter === value ? <CheckCircledIcon /> : null}</button>)}</div></BottomSheet>
    {quickStartStep !== null ? <QuickStartTour stepIndex={quickStartStep} onAdvance={advanceQuickStart} onSkip={skipQuickStart} /> : null}
    {quickStartCompleteVisible ? <div className="quick-start-complete" role="status" aria-live="polite"><CheckCircledIcon /><span><strong>You’re ready.</strong> Explore TULIP at your own pace.</span></div> : null}
  </div>;
}
