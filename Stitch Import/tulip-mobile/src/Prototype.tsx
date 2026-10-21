import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties, type FormEvent, type PointerEvent as ReactPointerEvent, type TouchEvent as ReactTouchEvent } from "react";
import { createPortal } from "react-dom";
import * as Dialog from "@radix-ui/react-dialog";
import '../../../src/inspector-photo.css';
// @ts-ignore -- shared vector category symbols are JavaScript outside this TS project.
import { getInspectorCategorySymbol } from '../../../src/inspector-category-symbols.js';
import relationshipsSymbol from '@fortawesome/fontawesome-free/svgs/solid/diagram-project.svg?url';
import humansSymbol from '@fortawesome/fontawesome-free/svgs/solid/people-group.svg?url';
import planetSymbol from '@fortawesome/fontawesome-free/svgs/solid/earth-americas.svg?url';
import responseSymbol from '@fortawesome/fontawesome-free/svgs/solid/lightbulb.svg?url';
import eventsSymbol from '@fortawesome/fontawesome-free/svgs/solid/newspaper.svg?url';
import measurementSymbol from '@fortawesome/fontawesome-free/svgs/solid/ruler-combined.svg?url';
import sourcesSymbol from '@fortawesome/fontawesome-free/svgs/solid/link.svg?url';
import {
  ActivityLogIcon,
  BackpackIcon,
  BarChartIcon,
  CheckCircledIcon,
  ChevronRightIcon,
  ClockIcon,
  CookieIcon,
  Cross1Icon,
  DotFilledIcon,
  ExternalLinkIcon,
  FileTextIcon,
  GlobeIcon,
  HamburgerMenuIcon,
  HomeIcon,
  PaperPlaneIcon,
  PersonIcon,
  RocketIcon,
} from "@radix-ui/react-icons";
import { BottomSheet, Carousel, KeyboardInput, MobileScroll, useKeyboard, useScreenPortal } from "./mobile";

import mobileNodeCatalog from "./mobile-node-catalog.json";
import mobileActivitySnapshot from "./mobile-activity-snapshot.json";
// @ts-ignore -- shared local search is JavaScript outside this TS project.
import { getNodeSearchTerms, searchNodes } from "../../../src/search.js";
// @ts-ignore -- production relationship grammar helper is JavaScript.
import { getRelationshipQuestionAuxiliary } from "../../../src/relationship-semantics.js";
// @ts-ignore -- production Personal Footprint context helpers are JavaScript.
import { estimateGlobalCarbonPercentile, getFootprintEquivalencies } from "../../../src/personal-footprint-context.js";
// @ts-ignore -- shared metric presentation policy is JavaScript.
import { formatMetricDisplayText, metricizeDisplayValue } from "../../../src/metric-display.js";
// @ts-ignore -- shared production Personal Footprint model is JavaScript.
import * as SharedFootprintModel from "../../../src/personal-footprint-model.js";
// @ts-ignore -- shared production TULIP urgency bands are JavaScript.
import { SCORE_METHOD_COPY } from "../../../src/tulip-score-method.js";
// Lazy registry assets from the desktop build. Vite emits these as standalone
// files so the large directories are downloaded only when someone opens them.
// @ts-ignore -- Vite asset URL imports are resolved at build time.
import sourceRegistryUrl from "../../../public/tulip-source-registry.json?url";
// @ts-ignore -- Vite asset URL imports are resolved at build time.
import pipelineRegistryUrl from "../../../public/pipeline-lineage-registry.json?url";
// @ts-ignore -- Vite asset URL imports are resolved at build time.
import researchBacklogUrl from "../../../public/research-backlog.json?url";

type Screen = "search" | "explore" | "analyse" | "activity" | "footprint";
function InspectorCategorySymbol({sphere,collapsed = false}:{sphere:string;collapsed?:boolean}) {
  return <svg className={`inspector-category-symbol${collapsed ? " analysis-collapsed-category-symbol" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{getInspectorCategorySymbol(sphere).map((d:string) => <path key={d} d={d} />)}</svg>;
}
const INSPECTOR_SECTION_SYMBOLS = { relationships:relationshipsSymbol, humans:humansSymbol, planet:planetSymbol, response:responseSymbol, events:eventsSymbol, measurement:measurementSymbol, sources:sourcesSymbol };
function InspectorSectionSymbol({kind}:{kind:keyof typeof INSPECTOR_SECTION_SYMBOLS}) {
  return <span className="inspector-section-symbol" data-symbol={kind} aria-hidden="true" style={{maskImage:`url("${INSPECTOR_SECTION_SYMBOLS[kind]}")`,WebkitMaskImage:`url("${INSPECTOR_SECTION_SYMBOLS[kind]}")`}} />;
}
type Icon = ComponentType<{ width?: number; height?: number }>;
type DesktopNode = { id: string; name: string };
type AppPoint = { x:number; y:number };
type AnalyseHistoryEntry = { name:string; expanded:boolean };
type AnalyseNavigationCache = { current:AnalyseHistoryEntry; history:AnalyseHistoryEntry[] };
type QuickStartStep = {
  id:string;
  screen:Screen;
  target:string;
  instruction:string;
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
  incomingEdgesById: Map<string,DesktopEdgeData[]>;
  outgoingEdgesById: Map<string,DesktopEdgeData[]>;
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
  freeSphereRotation?: boolean;
  freeRotationOrientation?: [number,number,number,number] | null;
  freeRotationIdleAxis?: [number,number,number];
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
  ambientLineRhythm?: boolean;
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
  worldToScreen: (x:number,y:number) => AppPoint;
  findBestHitNode: (point:AppPoint) => DesktopNodeData | null;
  onSelectNode: (node:DesktopNodeData, interaction?:{ motionOrigin?:AppPoint }) => void;
  onReselectNode?: (node:DesktopNodeData, interaction?:{ motionOrigin?:AppPoint }) => void;
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
  getCollapsedAnalyzeSelection: (
    incomingEdges:DesktopEdgeData[],
    outgoingEdges:DesktopEdgeData[],
    maxConnections?:number,
    selectedNode?:DesktopNodeData,
    feedbackNodeIds?:Set<string>,
  ) => {
    displayedDriverEdges:DesktopEdgeData[];
    displayedImpactEdges:DesktopEdgeData[];
    representativeCandidates:any[];
  };
  destroy: () => void;
};

function systemPrefersReducedMotion() {
  return document.documentElement.dataset.tulipReduceMotion === "true"
    || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
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
  haptic:(kind?:"selection"|"light"|"medium"|"rotation"|"rotationMomentum"|"success") => void;
  share:(payload:{ title:string; text:string; url:string }) => void;
  interpretQuery?:(query:string, previousTopic?:string) => Promise<string[]>;
  printTopic?:(payload:{title:string;html:string}) => void;
  notificationSettings?:() => void;
  notificationOnboarding?:() => void;
  exit?:() => void;
  startupReady?:() => void;
  navigationState?:(payload:{ active:Screen; visible:boolean; compact:boolean; quickStartActive:boolean; onboardingActive?:boolean }) => void;
  openInspector?:(name:string) => void;
  exploreFrameReady?:(token:number) => void;
  quickStartPrompt?:(payload:{step:number; text:string; leaving:boolean; x:number; y:number; width:number; height:number; fontSize:number} | null) => void;
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
const INTRO_STORAGE_KEY = "tulip-mobile-introduction-v1";
const INTRO_RETRY_KEY = "tulip-mobile-introduction-retry";
const NOTIFICATION_ONBOARDING_KEY = "tulip-mobile-notification-onboarding-v1";
const INTRO_PAGES = [
  { heading:"Your planet. Better understood.", copy:"Explore how human choices affect our climate, nature, and the resources we depend on.", artwork:"planet" },
  { heading:"One change leads to another.", copy:"See what causes an environmental problem, what it affects next, and how the consequences reach us.", artwork:"connections" },
  { heading:"Make your footprint visible.", copy:"Estimate the carbon emissions and resource use behind how you eat, travel, live, and shop.", artwork:"footprint" },
  { heading:"See what we can change.", copy:"Explore solutions, from everyday choices to changes in our communities, businesses, and policies.", artwork:"solutions" },
] as const;

const INTRO_PAGE_DURATION_MS = 5250;
const INTRO_TRANSITION_DURATION_MS = 800;

function introductionTiming(name:"page"|"transition") {
  const configured = (window as Window & {
    __TULIP_INTRO_PAGE_MS__?:number;
    __TULIP_INTRO_TRANSITION_MS__?:number;
  })[name === "page" ? "__TULIP_INTRO_PAGE_MS__" : "__TULIP_INTRO_TRANSITION_MS__"];
  if (typeof configured === "number" && Number.isFinite(configured) && configured >= 0) return configured;
  return name === "page" ? INTRO_PAGE_DURATION_MS : INTRO_TRANSITION_DURATION_MS;
}

function readIntroductionPage():number | null {
  // A deliberate deep link must never be redirected into onboarding.
  if (window.location.hash && window.location.hash !== "#explore") return null;
  if (hasCompletedQuickStart()) return null;
  try {
    const saved = window.localStorage.getItem(INTRO_STORAGE_KEY);
    if (saved === "complete") return null;
    const page = Number(saved);
    return Number.isInteger(page) && page >= 0 && page < INTRO_PAGES.length ? page : 0;
  } catch { return 0; }
}

function saveIntroduction(value:number | "complete") {
  try { window.localStorage.setItem(INTRO_STORAGE_KEY,String(value)); } catch { /* Storage may be unavailable. */ }
}

function IntroductionArtwork({ page }: { page:number }) {
  const artwork = INTRO_PAGES[page].artwork;
  if (artwork === "planet") return <div className="introduction-artwork is-planet" data-artwork="planet" aria-hidden="true">
    <div className="introduction-planet"><GlobeIcon width={112} height={112} /></div>
    <span className="introduction-orbit orbit-one" /><span className="introduction-orbit orbit-two" />
    <span className="introduction-node node-one"><DotFilledIcon /></span>
    <span className="introduction-node node-two"><DotFilledIcon /></span>
    <span className="introduction-node node-three"><DotFilledIcon /></span>
  </div>;
  if (artwork === "connections") return <div className="introduction-artwork is-connections" data-artwork="connections" aria-hidden="true">
    <span className="introduction-link link-one" /><span className="introduction-link link-two" />
    <span className="introduction-chain-node chain-one"><DotFilledIcon /></span>
    <span className="introduction-chain-node chain-two"><DotFilledIcon /></span>
    <span className="introduction-chain-node chain-three"><DotFilledIcon /></span>
    <span className="introduction-chain-pulse pulse-primary" />
    <span className="introduction-chain-pulse pulse-secondary" />
  </div>;
  if (artwork === "footprint") return <div className="introduction-artwork is-footprint" data-artwork="footprint" aria-hidden="true">
    <span className="introduction-life-route route-food" /><span className="introduction-life-route route-travel" />
    <span className="introduction-life-route route-home" /><span className="introduction-life-route route-shop" />
    <span className="introduction-footprint-center"><PersonIcon width={34} height={34} /></span>
    <span className="introduction-life-icon life-food"><CookieIcon width={25} height={25} /></span>
    <span className="introduction-life-icon life-travel"><PaperPlaneIcon width={25} height={25} /></span>
    <span className="introduction-life-icon life-home"><HomeIcon width={25} height={25} /></span>
    <span className="introduction-life-icon life-shop"><BackpackIcon width={25} height={25} /></span>
  </div>;
  return <div className="introduction-artwork is-solutions" data-artwork="solutions" aria-hidden="true">
    <div className="introduction-action-grid">
      <span className="introduction-action-tile action-everyday"><BackpackIcon width={32} height={32} /></span>
      <span className="introduction-action-tile action-community"><GlobeIcon width={32} height={32} /></span>
      <span className="introduction-action-tile action-business"><BarChartIcon width={32} height={32} /></span>
      <span className="introduction-action-tile action-policy"><FileTextIcon width={32} height={32} /></span>
    </div>
  </div>;
}

function IntroductionStory({ page, current = false }: { page:number; current?:boolean }) {
  return <div className={`introduction-story${current ? " is-current" : " is-outgoing"}`} aria-hidden={current ? undefined : true}>
    <IntroductionArtwork page={page} />
    <div className="introduction-glass">
      {current ? <>
        <h1 id="introduction-heading" tabIndex={-1}>{INTRO_PAGES[page].heading}</h1>
        <p id="introduction-copy">{INTRO_PAGES[page].copy}</p>
      </> : <>
        <h1>{INTRO_PAGES[page].heading}</h1>
        <p>{INTRO_PAGES[page].copy}</p>
      </>}
    </div>
  </div>;
}

function Introduction({ page, phase, covered, onPage, onContinue, onReady, onFailure }: {
  page:number; phase:"pages"|"notifications"|"waiting"|"error"|"revealing"; covered:boolean;
  onPage:(page:number) => void; onContinue:() => void; onReady:() => void; onFailure:() => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const [outgoingPage,setOutgoingPage] = useState<number | null>(null);
  const [transitionDirection,setTransitionDirection] = useState<"forward"|"backward">("forward");
  const pageDuration = introductionTiming("page");
  const transitionDuration = introductionTiming("transition");
  useEffect(() => {
    if (!covered && phase === "pages") dialogRef.current?.querySelector<HTMLElement>("#introduction-heading")?.focus({preventScroll:true});
    dialogRef.current?.querySelector(".mobile-scroll")?.scrollTo(0,0);
  },[page,covered,phase]);
  const changePage = useCallback((next:number, direction:"forward"|"backward" = "forward") => {
    if (outgoingPage !== null || next === page || next < 0 || next >= INTRO_PAGES.length) return;
    setTransitionDirection(direction);
    setOutgoingPage(page);
    onPage(next);
    if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = window.setTimeout(() => {
      transitionTimerRef.current = null;
      setOutgoingPage(null);
    },systemPrefersReducedMotion() ? Math.min(200,transitionDuration) : transitionDuration);
  },[onPage,outgoingPage,page,transitionDuration]);
  useEffect(() => () => {
    if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
  },[]);
  useEffect(() => {
    if (covered || phase !== "pages") return;
    const timer = window.setTimeout(() => {
      if (page < INTRO_PAGES.length - 1) changePage(page + 1,"forward");
      else onContinue();
    },pageDuration);
    return () => window.clearTimeout(timer);
  },[changePage,covered,onContinue,outgoingPage,page,pageDuration,phase]);
  useEffect(() => {
    if (phase !== "waiting" || covered) return;
    const canvas = document.querySelector<HTMLCanvasElement>(".desktop-sphere-canvas");
    let frame:number | undefined;
    let settled = false;
    const timeout = window.setTimeout(() => { settled = true; onFailure(); },8000);
    const inspect = () => {
      if (settled) return;
      if (canvas?.dataset.renderError) {
        settled = true;
        window.clearTimeout(timeout);
        onFailure();
      } else if (canvas?.dataset.firstFrameRendered === "true") {
        settled = true;
        window.clearTimeout(timeout);
        // Let the successful canvas draw reach the compositor before removing its cover.
        frame = window.requestAnimationFrame(onReady);
      }
    };
    const observer = new MutationObserver(inspect);
    if (canvas) observer.observe(canvas,{attributes:true,attributeFilter:["data-first-frame-rendered","data-render-error"]});
    inspect();
    return () => { observer.disconnect(); window.clearTimeout(timeout); if (frame !== undefined) window.cancelAnimationFrame(frame); };
  },[phase,covered,onReady,onFailure]);
  const retry = () => {
    // A failed dynamic import is cached for the lifetime of a document. A reload
    // retries that import too, without remounting a successfully prepared sphere.
    try { window.sessionStorage.setItem(INTRO_RETRY_KEY,"true"); } catch { /* Manual continue remains available. */ }
    window.location.reload();
  };
  const progressStyle = {"--introduction-transition-duration":`${transitionDuration}ms`} as CSSProperties;
  return <section ref={dialogRef} className="introduction" role="dialog" aria-modal="true" aria-labelledby="introduction-heading" aria-describedby="introduction-copy" data-page={page + 1} data-page-duration={pageDuration} data-direction={transitionDirection} data-phase={phase} data-covered={covered} data-transitioning={outgoingPage !== null} style={progressStyle} inert={covered || phase === "revealing" || phase === "notifications"}>
    <MobileScroll className="introduction-scroll" engine="native"><div className="introduction-content">
      <img className="introduction-brandmark" src="/assets/tulip/tulip-earth-logo.svg" alt="Tulip Earth" width={126} height={52} />
      <div className="introduction-story-stage" aria-live="polite" aria-atomic="true">
        {outgoingPage !== null ? <IntroductionStory key={`outgoing-${outgoingPage}`} page={outgoingPage} /> : null}
        <IntroductionStory key={`current-${page}`} page={page} current />
      </div>
      <p className="introduction-status" role={phase === "error" ? "alert" : "status"}>{phase === "error" ? "The sphere couldn’t load. Please try again." : phase === "waiting" ? "Preparing your sphere…" : ""}</p>
      {phase === "error" ? <button className="introduction-primary" onClick={retry}>Retry</button> : page > 0 && phase === "pages" ? <button className="introduction-back" disabled={outgoingPage !== null} onClick={() => changePage(page - 1,"backward")}>Back</button> : null}
    </div></MobileScroll>
  </section>;
}
const QUICK_START_STEPS:QuickStartStep[] = [
  {
    id:"explore-spin",
    screen:"explore",
    target:'[data-quick-start="explore-canvas"]',
    instruction:"Spin to explore",
  },
  {
    id:"explore-node",
    screen:"explore",
    target:'[data-quick-start="explore-canvas"]',
    instruction:"Tap to open a topic",
  },
  {
    id:"explore-reset",
    screen:"explore",
    target:'[data-quick-start="explore-canvas"]',
    instruction:"Reset sphere by swiping from bottom left",
  },
  {
    id:"explore-different-node",
    screen:"explore",
    target:'[data-quick-start="explore-canvas"]',
    instruction:"Tap to open a different topic",
  },
  {
    id:"explore-open-analyse",
    screen:"explore",
    target:'[data-quick-start="explore-canvas"]',
    instruction:"Tap again to Analyse the topic",
  },
  {
    id:"analyse-collapse",
    screen:"analyse",
    target:'[data-quick-start="analyse-grab-zone"]',
    instruction:"Swipe down to see connected topics",
  },
  {
    id:"analyse-node",
    screen:"analyse",
    target:'[data-quick-start="analyse-node"]',
    instruction:"Tap a connected topic to learn about it",
  },
  {
    id:"analyse-back",
    screen:"analyse",
    target:'.analysis-sheet-shell',
    instruction:"Swipe from the left edge to go back",
  },
  {
    id:"return-explore",
    screen:"analyse",
    target:'[data-quick-start="nav-explore"]',
    instruction:"Tap Explore to reset",
  },
];
const QUICK_START_EXPLORE_CANVAS_STEPS = new Set(["explore-spin","explore-node","explore-reset","explore-different-node","explore-open-analyse"]);

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
const EXPLORE_SELECTION_ZOOM_MULTIPLIER = 1.15;
const EXPLORE_CONNECTION_LIMIT = 15;
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
const ANALYSE_STARTING_POINTS_KEY = "tulip_analyse_starting_points_used_v1";
function readUsedAnalyseStartingPoints():string[] {
  try {
    const saved = JSON.parse(window.localStorage.getItem(ANALYSE_STARTING_POINTS_KEY) || "[]");
    return Array.isArray(saved) ? [...new Set(saved.filter((name):name is string => typeof name === "string"))] : [];
  } catch { return []; }
}
const ANDROID_BOOKMARK_KEY = "tulip_android_bookmarks_v1";
const ANDROID_LAST_TOPIC_KEY = "tulip_android_last_topic_v1";
function readAndroidBookmarks():string[] {
  try {
    const saved = JSON.parse(window.localStorage.getItem(ANDROID_BOOKMARK_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((name):name is string => typeof name === "string") : [];
  } catch { return []; }
}
const escapePrintHtml = (value:unknown) => String(value ?? "").replace(/[&<>"']/g,(character) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[character] || character);
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


type InspectorPhotoData = {
  asset:string; width:number; height:number; alt:string; caption:string;
  credit:string; creditUrl?:string; sourceUrl:string; license:string; licenseUrl:string;
};

function InspectorPhotoViewer({ photo, name, onClose, onError, trigger }: {
  photo:InspectorPhotoData; name:string; onClose:() => void; onError:() => void;
  trigger:React.RefObject<HTMLButtonElement | null>;
}) {
  const { screenRef } = useScreenPortal();
  const swipe = useRef<{id:number;x:number;y:number} | null>(null);
  return <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
    <Dialog.Portal container={screenRef.current ?? undefined}>
      <Dialog.Overlay className="inspector-photo-viewer-overlay" />
      <Dialog.Content className="inspector-photo-viewer mobile-photo-viewer" aria-describedby="mobile-photo-caption" onCloseAutoFocus={(event) => { event.preventDefault(); trigger.current?.focus({preventScroll:true}); }}>
        <header className="inspector-photo-viewer-header"><Dialog.Title>Photo of {name}</Dialog.Title><Dialog.Close className="inspector-photo-viewer-close" aria-label="Close photograph"><Cross1Icon /></Dialog.Close></header>
        <div className="inspector-photo-viewer-stage" onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return;
          swipe.current = {id:event.pointerId,x:event.clientX,y:event.clientY};
          event.currentTarget.setPointerCapture(event.pointerId);
        }} onPointerUp={(event) => {
          const start = swipe.current; swipe.current = null;
          if (!start || start.id !== event.pointerId) return;
          const dx = event.clientX - start.x, dy = event.clientY - start.y;
          if (dy < -64 && -dy > Math.abs(dx) * 1.2) onClose();
        }} onPointerCancel={() => { swipe.current = null; }}>
          <img src={photo.asset} width={photo.width} height={photo.height} alt={photo.alt} draggable={false} onError={onError} />
        </div>
        <p className="inspector-photo-viewer-hint">Swipe up on the photo to close</p>
        <div className="inspector-photo-viewer-details"><Dialog.Description id="mobile-photo-caption">{photo.caption}</Dialog.Description><p className="inspector-photo-credit"><a href={photo.creditUrl || photo.sourceUrl} target="_blank" rel="noopener noreferrer">Photo: {photo.credit}</a> · <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">{photo.license}</a>{photo.creditUrl ? <> · <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer">Source</a></> : null} · Cropped</p></div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

type MobileInspectorProfile = {
  name:string;
  sphere:string;
  updated:string;
  description:string;
  photo?:InspectorPhotoData | null;
  urgency:number | null;
  assessment:Assessment;
  scoreBreakdown?:{
    topic:string; summary:string;
    components:{id:string;label:string;weight:string;value:string;explanation:string}[];
    formula:string | null; note:string | null;
  };
  urgencyBand:string | null;
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

function QuickStartTour({ stepIndex, onAdvance }: { stepIndex:number; onAdvance:() => void }) {
  const step = QUICK_START_STEPS[stepIndex];
  const [spotlight,setSpotlight] = useState<QuickStartRect | null>(null);
  const [gestureDemoComplete,setGestureDemoComplete] = useState(step.id !== "explore-spin");
  const [exitingStep,setExitingStep] = useState<number | null>(null);
  const promptRef = useRef<HTMLElement>(null);
  const promptAnchorRef = useRef<HTMLDivElement>(null);
  const hasSpotlight = spotlight !== null;
  // Keep one web-owned guide/focus target; iOS supplies only its visual glass
  // presentation. Older wrappers and browsers keep the CSS glass fallback.
  useLayoutEffect(() => {
    const present = (window as Window & {TULIPNative?:TulipNativeBridge}).TULIPNative?.quickStartPrompt;
    const panel = promptRef.current;
    const anchor = promptAnchorRef.current;
    if (!present || !panel || !anchor) return;
    let previous = "";
    const measure = () => {
      // Measure the resting slot, not the sliding glass. The native overlay
      // must not inherit a transient off-screen origin during an animation.
      const rect = anchor.getBoundingClientRect();
      const text = panel.querySelector("p")!;
      const payload = {step:stepIndex + 1,text:step.instruction,leaving:exitingStep === stepIndex,
        x:rect.x,y:rect.y,width:rect.width,height:rect.height,fontSize:parseFloat(getComputedStyle(text).fontSize)};
      const signature = JSON.stringify(payload);
      if (signature !== previous) { previous = signature; present(payload); }
    };
    const observer = new ResizeObserver(measure);
    observer.observe(anchor);
    window.addEventListener("resize",measure);
    measure();
    return () => { observer.disconnect(); window.removeEventListener("resize",measure); };
  },[stepIndex,step.instruction,exitingStep,hasSpotlight]);
  useEffect(() => () => {
    (window as Window & {TULIPNative?:TulipNativeBridge}).TULIPNative?.quickStartPrompt?.(null);
    delete document.documentElement.dataset.tulipNativeQuickStartPrompt;
  },[]);
  useEffect(() => {
    if (hasSpotlight) promptRef.current?.focus({preventScroll:true});
  },[step.id,hasSpotlight]);
  const gestureDemoCompleteRef = useRef(gestureDemoComplete);
  const onAdvanceRef = useRef(onAdvance);
  onAdvanceRef.current = onAdvance;
  gestureDemoCompleteRef.current = gestureDemoComplete;

  useEffect(() => {
    if (step.id !== "explore-spin") {
      setGestureDemoComplete(true);
      return;
    }
    if (systemPrefersReducedMotion()) {
      gestureDemoCompleteRef.current = true;
      setGestureDemoComplete(true);
      return;
    }
    setGestureDemoComplete(false);
    gestureDemoCompleteRef.current = false;
    const duration = 2550;
    const startedAt = performance.now();
    let animationFrame = 0;
    const animateGesture = (now:number) => {
      const linearProgress = Math.min(1,(now - startedAt) / duration);
      const progress = 1 - Math.pow(1 - linearProgress,3);
      const rotationOffset = linearProgress <= .5
        ? 1 - Math.pow(1 - (linearProgress / .5),3)
        : 1 - (1 - Math.pow(1 - ((linearProgress - .5) / .5),3)) * 1.35;
      window.dispatchEvent(new CustomEvent("tulip:quick-start-spin-demo",{detail:{progress,rotationOffset}}));
      if (linearProgress < 1) animationFrame = window.requestAnimationFrame(animateGesture);
      else setGestureDemoComplete(true);
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
    let exitTimer:number | null = null;
    let advanceScheduled = false;
    let exploredSpinDistance = 0;
    let practiceSwipes = 0;
    let targetPointer:{ id:number; x:number; y:number } | null = null;
    const scheduleAdvance = (delay = 180) => {
      if (advanceScheduled) return;
      advanceScheduled = true;
      advanceTimer = window.setTimeout(() => {
        if (systemPrefersReducedMotion()) {
          onAdvanceRef.current();
          return;
        }
        setExitingStep(stepIndex);
        exitTimer = window.setTimeout(() => onAdvanceRef.current(),180);
      },delay);
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
      if (!pointer || pointer.id !== event.pointerId || step.id !== "explore-spin") return;
      const movement = Math.hypot(event.clientX - pointer.x,event.clientY - pointer.y);
      if (!gestureDemoCompleteRef.current || movement < 28) return;
      exploredSpinDistance += movement;
      practiceSwipes += 1;
      if (practiceSwipes >= 2 && exploredSpinDistance >= 180) scheduleAdvance(700);
    };
    const handlePointerCancel = () => { targetPointer = null; };
    const handleExploreNodeTap = (event:Event) => {
      const detail = (event as CustomEvent<{id:string;confirmed:boolean}>).detail;
      if (!detail?.id) return;
      if (step.id === "explore-node" || step.id === "explore-different-node") scheduleAdvance();
      if (step.id === "explore-open-analyse" && detail.confirmed) scheduleAdvance();
    };
    const handleExploreReset = () => {
      if (step.id === "explore-reset") scheduleAdvance();
    };
    const handleAnalyseInspectorState = (event:Event) => {
      const detail = (event as CustomEvent<{expanded?:boolean;interaction?:string}>).detail;
      if (step.id === "analyse-collapse" && detail?.expanded === false && detail.interaction === "drag") scheduleAdvance();
    };
    const handleAnalyseNodeTap = () => {
      if (step.id === "analyse-node") scheduleAdvance(400);
    };
    const handleAnalyseBack = () => {
      if (step.id === "analyse-back") scheduleAdvance(400);
    };
    const handleExploreNavigation = () => {
      if (step.id === "return-explore") scheduleAdvance();
    };

    // Disable unrelated controls for pointer, keyboard, and assistive input.
    // The actual gesture surface remains live; the guide never simulates success.
    const changedInert = new Map<HTMLElement,boolean>();
    const updateInert = () => {
      const allowed = step.id === "return-explore" ? '[data-quick-start="nav-explore"]'
        : step.id === "analyse-collapse" ? ".quick-start-no-controls"
        : step.id === "analyse-node" ? '.analyse-causal-relation'
        : step.id === "analyse-back" ? ".quick-start-no-controls"
        : step.target;
      app.querySelectorAll<HTMLElement>("button,a,input,summary,[role=button]").forEach((control) => {
        if (control.closest(".quick-start-layer")) return;
        if (control.closest(allowed)) {
          if (changedInert.has(control)) control.inert = changedInert.get(control)!;
          return;
        }
        if (!changedInert.has(control)) changedInert.set(control,control.inert);
        control.inert = true;
      });
    };
    const measure = () => {
      const target = app.querySelector<HTMLElement>(step.target);
      if (!target) { setSpotlight(null); return; }
      const appRect = app.getBoundingClientRect();
      const scale = appRect.width / app.clientWidth || 1;
      if (step.id === "analyse-node" && promptRef.current) {
        // Keep every choice below the bubble, including when system text wraps.
        const top = `${Math.ceil((promptRef.current.getBoundingClientRect().bottom - appRect.top) / scale) + 12}px`;
        if (app.style.getPropertyValue("--quick-start-content-top") !== top) app.style.setProperty("--quick-start-content-top",top);
      }
      const targetRect = target.getBoundingClientRect();
      let x = (targetRect.left - appRect.left) / scale;
      let y = (targetRect.top - appRect.top) / scale;
      let width = targetRect.width / scale;
      let height = targetRect.height / scale;
      if (QUICK_START_EXPLORE_CANVAS_STEPS.has(step.id)) {
        const node = target.dataset.quickStartNode ? JSON.parse(target.dataset.quickStartNode) as AppPoint : null;
        if (node && step.id !== "explore-spin" && step.id !== "explore-reset") {
          x += node.x - 28;
          y += node.y - 28;
          width = height = 56;
        } else if (step.id === "explore-reset") {
          x += width * .12;
          y += height * .72;
          width *= .65;
          height *= .1;
        } else {
          x += width * .22;
          y += height * .47;
          width *= .56;
          height *= .12;
        }
      } else if (step.id === "analyse-back") {
        y += Math.min(height * .28,200);
        x += width * .14;
        width *= .72;
        height = 72;
      }
      const next:QuickStartRect = {
        x,y,width,height,
        targetX:(targetRect.left - appRect.left) / scale,
        targetY:(targetRect.top - appRect.top) / scale,
        targetWidth:targetRect.width / scale,targetHeight:targetRect.height / scale,
        containerWidth:app.clientWidth,containerHeight:app.clientHeight,
      };
      setSpotlight((previous) => previous && Object.keys(next).every((key) =>
        Math.abs(next[key as keyof QuickStartRect] - previous[key as keyof QuickStartRect]) < 1) ? previous : next);
    };
    const refresh = () => { updateInert(); measure(); };
    const resizeObserver = new ResizeObserver(refresh);
    resizeObserver.observe(app);
    const mutationObserver = new MutationObserver((mutations) => {
      if (mutations.every((mutation) => (mutation.target as Element).closest?.(".quick-start-layer"))) return;
      refresh();
    });
    mutationObserver.observe(app,{childList:true,subtree:true});
    const events:Array<[string,EventListener]> = [
      ["pointerdown",handlePointerDown as EventListener],
      ["pointerup",handlePointerUp as EventListener],
      ["pointercancel",handlePointerCancel],
      ["tulip:explore-node-tap",handleExploreNodeTap],
      ["tulip:explore-reset",handleExploreReset],
      ["tulip:analyse-inspector-state",handleAnalyseInspectorState],
      ["tulip:analyse-node-tap",handleAnalyseNodeTap],
      ["tulip:analyse-back",handleAnalyseBack],
      ["tulip:explore-navigation",handleExploreNavigation],
    ];
    events.forEach(([name,listener]) => window.addEventListener(name,listener,true));
    const firstFrame = window.requestAnimationFrame(refresh);
    // Follow moving canvas nodes and sheet settling without a React render per frame.
    const geometryTimer = window.setInterval(measure,120);
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.clearInterval(geometryTimer);
      if (advanceTimer !== null) window.clearTimeout(advanceTimer);
      if (exitTimer !== null) window.clearTimeout(exitTimer);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      app.style.removeProperty("--quick-start-content-top");
      changedInert.forEach((wasInert,control) => { control.inert = wasInert; });
      events.forEach(([name,listener]) => window.removeEventListener(name,listener,true));
    };
  },[step,stepIndex]);

  if (!spotlight) return <div className="quick-start-layer is-waiting" role="dialog" aria-label="Quick Start guide" data-step={step.id} />;

  const {x,y,width,height,containerWidth,containerHeight} = spotlight;
  const highlightStyle = {left:x,top:y,width,height} as CSSProperties;
  const target = {x:spotlight.targetX,y:spotlight.targetY,width:spotlight.targetWidth,height:spotlight.targetHeight};
  // Block only outside the expected surface, leaving vertical and horizontal
  // gestures owned by their existing scrollers and inspector.
  const interaction = step.id === "return-explore" ? {x:x - 10,y:y - 10,width:width + 20,height:height + 20}
    : target;
  const blockerStyles:CSSProperties[] = [
    {left:0,top:0,width:containerWidth,height:Math.max(0,interaction.y)},
    {left:0,top:interaction.y,width:Math.max(0,interaction.x),height:interaction.height},
    {left:interaction.x + interaction.width,top:interaction.y,width:Math.max(0,containerWidth - interaction.x - interaction.width),height:interaction.height},
    {left:0,top:interaction.y + interaction.height,width:containerWidth,height:Math.max(0,containerHeight - interaction.y - interaction.height)},
  ];
  const gesture = step.id === "explore-reset" ? "reset" : step.id === "analyse-back" ? "back"
    : step.id === "explore-spin" && !gestureDemoComplete ? "spin" : null;
  const gestureStyle = gesture === "reset" ? {
    left:target.x + target.width * .15,top:target.y + target.height * .78,
    "--gesture-x":`${target.width * .57}px`,"--gesture-y":`${-target.height * .26}px`,
  } as CSSProperties : gesture === "back" ? {
    left:target.x + 24,top:y + height / 2,"--gesture-x":`${target.width / 2 - 24}px`,"--gesture-y":"0px",
  } as CSSProperties : highlightStyle;
  return <div className="quick-start-layer" role="dialog" aria-label="Quick Start guide" data-step={step.id}>
    {step.id === "return-explore" ? <div className="quick-start-dimmer" aria-hidden="true" /> : null}
    {blockerStyles.map((style,index) => <div className="quick-start-blocker" style={style} key={index} />)}
    {step.id === "return-explore" ?
      <div className="quick-start-highlight" style={highlightStyle} aria-hidden="true">
        <span className="nav-pill-indicator" />
        <img className="nav-icon" src={navItems.find(item => item.id === "explore")!.iconSrc} alt="" />
      </div>
    : null}
    {step.id === "explore-spin" && !gestureDemoComplete ? <div className="quick-start-target-lock" aria-hidden="true" /> : null}
    {gesture ? <div key={gesture} className={`quick-start-gesture is-${gesture}`} style={gestureStyle} aria-hidden="true">
      <i className="quick-start-touch-dot is-primary" /><i className="quick-start-touch-dot is-echo" />
    </div> : null}
    <div ref={promptAnchorRef} className="quick-start-prompt-anchor" style={{"--quick-start-slide":`${containerWidth}px`} as CSSProperties}>
      <section key={step.id} ref={promptRef} tabIndex={-1} className={`quick-start-panel${stepIndex > 0 ? " is-entering" : ""}`} data-leaving={exitingStep === stepIndex} aria-live="polite" aria-atomic="true">
        <span className="quick-start-step-number" role="progressbar" aria-label="Quick Start progress" aria-valuemin={1} aria-valuemax={QUICK_START_STEPS.length} aria-valuenow={stepIndex + 1} aria-valuetext={`Step ${stepIndex + 1} of ${QUICK_START_STEPS.length}`}>{stepIndex + 1}</span>
        <div className="quick-start-prompt-viewport"><p>{step.instruction}</p></div>
      </section>
    </div>
  </div>;
}

function Brand() {
  return <div className="brand"><img src="/assets/tulip/tulip-earth-logo.svg" alt="Tulip Earth" width={434.89} height={178.3} /></div>;
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
      title:"Tulip Earth",
      text:"Explore how environmental causes and consequences connect with Tulip Earth.",
      url:"https://tulip-project-six.vercel.app/",
    });
  };
  const startQuickStart = () => {
    setMenuOpen(false);
    onStartQuickStart();
  };
  const menu = <section className="explore-menu-screen" role="dialog" aria-modal="true" aria-labelledby="explore-menu-title"><header><h1 id="explore-menu-title">Menu</h1><button className="explore-menu-cancel" onClick={() => setMenuOpen(false)} aria-label="Close TULIP menu">Cancel</button></header><nav className="explore-menu-popover" role="menu"><div className="explore-menu-items"><button role="menuitem" onClick={startQuickStart}>Quick Start</button>{nativeBridge?.notificationSettings ? <button role="menuitem" onClick={() => { setMenuOpen(false); nativeBridge.notificationSettings?.(); }}>Notifications</button> : null}{([['about','About'],['score','TULIP Score'],['sources','Sources'],['registries','Registries'],['privacy','Privacy'],['contact','Contact']] as Array<[ExploreInfoSection,string]>).map(([section,label]) => <button key={section} role="menuitem" onClick={() => openInfo(section)}>{label}</button>)}{nativeBridge ? <button role="menuitem" onClick={share}>Share</button> : null}</div></nav></section>;
  return <header className="top-bar explore-top-bar"><Brand /><div className="explore-menu-wrap"><button className="icon-button explore-menu-button" onClick={() => setMenuOpen(true)} aria-label="Open Tulip Earth menu" aria-expanded={menuOpen} aria-hidden={menuOpen || undefined} tabIndex={menuOpen ? -1 : 0}><HamburgerMenuIcon width={27} height={27} /></button>{menuOpen ? createPortal(menu,document.querySelector(".tulip-app") || document.body) : null}</div></header>;
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
  const presentationRef = useRef({active,suspended});
  presentationRef.current = {active,suspended};
  const selectedNodeIdRef = useRef<string | null>(null);
  const selectedZoomRef = useRef<number | null>(null);
  const preSelectionViewRef = useRef<{ rotationX:number; rotationY:number; orientation:[number,number,number,number] | null; idleAxis:[number,number,number]; cameraX:number; cameraY:number; zoom:number } | null>(null);
  const previousResetKeyRef = useRef(resetKey);
  const [connectionSummary,setConnectionSummary] = useState<{ triggers:number; effects:number } | null>(null);
  const activeFilterRef = useRef(activeFilter);
  activeFilterRef.current = activeFilter;
  const onAnalyseRef = useRef(onAnalyse);
  onAnalyseRef.current = onAnalyse;

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
        const confirmed = selectedNodeIdRef.current === node.id;
        if (canvas.closest<HTMLElement>(".tulip-app")?.dataset.quickStartStep === "explore-node") {
          canvas.dataset.quickStartFirstNode = node.id;
        }
        canvas.dispatchEvent(new CustomEvent("tulip:explore-node-tap",{bubbles:true,detail:{id:node.id,name:node.name,confirmed}}));
        if (confirmed) {
          const canvasRect = canvas.getBoundingClientRect();
          const scale = canvas.clientWidth > 0 ? canvasRect.width / canvas.clientWidth : 1;
          const origin = interaction?.motionOrigin
            ? {
                x:(interaction.motionOrigin.x - canvasRect.left) / Math.max(scale,.001),
                y:(interaction.motionOrigin.y - canvasRect.top) / Math.max(scale,.001),
              }
            : undefined;
          onAnalyseRef.current(node.name,origin);
          return;
        }
        const currentZoom = graphRef.current?.targetCamera?.zoom ?? graphRef.current?.camera.zoom ?? EXPLORE_MOBILE_ZOOM;
        if (!preSelectionViewRef.current) {
          preSelectionViewRef.current = {
            rotationX:graph.rotationX,
            rotationY:graph.rotationY,
            orientation:graph.freeRotationOrientation ? [...graph.freeRotationOrientation] : null,
            idleAxis:graph.freeRotationIdleAxis ? [...graph.freeRotationIdleAxis] : [0,-1,0],
            cameraX:graph.camera.x,
            cameraY:graph.camera.y,
            zoom:currentZoom,
          };
          selectedZoomRef.current = Math.min(
            EXPLORE_MOBILE_ZOOM * 1.4,
            currentZoom * EXPLORE_SELECTION_ZOOM_MULTIPLIER,
          );
        }
        selectedNodeIdRef.current = node.id;
        setConnectionSummary({
          triggers:graph.incomingEdgesById.get(node.id)?.length ?? 0,
          effects:graph.outgoingEdgesById.get(node.id)?.length ?? 0,
        });
        canvas.dataset.selectedNodeId = node.id;
        canvas.dataset.selectionZoom = (selectedZoomRef.current ?? currentZoom).toFixed(4);
      },
    ) as DesktopGraph;
      graphRef.current = graph;
    graph.onReselectNode = graph.onSelectNode;
    const app = canvas.closest<HTMLElement>(".tulip-app");
    const originalHitNode = graph.findBestHitNode.bind(graph);
    graph.findBestHitNode = (point) => {
      const step = app?.dataset.quickStartStep;
      const node = originalHitNode(point);
      if (!step) return node;
      if (step === "explore-open-analyse") return node?.id === selectedNodeIdRef.current ? node : null;
      if (step !== "explore-node" && step !== "explore-different-node") return null;
      if (selectedNodeIdRef.current || (step === "explore-different-node" && node?.id === canvas.dataset.quickStartFirstNode)) return null;
      return node;
    };
    let guideNodeId:string | null = null;
    let lastGuideStep:string | undefined;
    let lastGuideMeasure = 0;
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
    graph.freeSphereRotation = isNativeApp;
    graph.ambientLineRhythm = isNativeApp;
    const originalDraw = graph.draw.bind(graph);
    let interactionQualityActive:boolean | null = null;
    let hasPresentedFirstFrame = false;
    let pendingExploreFrameToken:number | null = null;
    let reportedExploreFrameToken:number | null = null;
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
      try {
        originalDraw();
      } catch (error) {
        canvas.dataset.renderError = "true";
        graph.pause();
        console.error("Explore sphere could not render",error);
        return;
      }
      const guideStep = app?.dataset.quickStartStep;
      if (guideStep && ["explore-node","explore-different-node","explore-open-analyse"].includes(guideStep)) {
        // Keep the chosen label still and measure at a low frequency. The globe
        // renderer owns its frames; React only receives changed guide geometry.
        graph.autoRotatePausedUntil = Date.now() + 240;
        graph.touchMomentum = null;
        if (guideStep !== lastGuideStep) guideNodeId = null;
        if (performance.now() - lastGuideMeasure > 100) {
          lastGuideMeasure = performance.now();
          const candidate = selectedNodeIdRef.current ? graph.selectedNode : graph.nodes
            .filter((node) => Number(node.z) >= .14 && (guideStep !== "explore-different-node" || node.id !== canvas.dataset.quickStartFirstNode))
            .filter((node) => {
              const point = graph.worldToScreen(node.x,node.y);
              return point.x > 48 && point.x < graph.width - 48 && point.y > graph.height * .25 && point.y < graph.height * .65
                && (graph.incomingEdgesById.get(node.id)?.length || graph.outgoingEdgesById.get(node.id)?.length);
            })
            .sort((a,b) => Number(b.id === guideNodeId) - Number(a.id === guideNodeId)
              || Number(graph.ambientHighlightSet.has(b.id)) - Number(graph.ambientHighlightSet.has(a.id))
              || Number(b.z) - Number(a.z))[0];
          if (candidate) {
            guideNodeId = candidate.id;
            const point = graph.worldToScreen(candidate.x,candidate.y);
            canvas.dataset.quickStartNode = JSON.stringify({id:candidate.id,name:candidate.name,x:point.x,y:point.y});
          }
        }
      } else if (guideStep !== lastGuideStep) {
        delete canvas.dataset.quickStartNode;
      }
      lastGuideStep = guideStep;
      if (!hasPresentedFirstFrame) {
        hasPresentedFirstFrame = true;
        canvas.dataset.firstFrameRendered = "true";
      }
      const nativeWindow = window as Window & {
        __TULIP_EXPLORE_PREPARE_TOKEN__?:number;
        TULIPNative?:TulipNativeBridge;
      };
      const token = nativeWindow.__TULIP_EXPLORE_PREPARE_TOKEN__;
      if (isNativeApp && Number.isInteger(token) && token !== pendingExploreFrameToken
          && token !== reportedExploreFrameToken && presentationRef.current.active
          && !presentationRef.current.suspended
          && canvas.dataset.nativePreparedExploreToken === String(token)) {
        pendingExploreFrameToken = token!;
        // Two presentation frames let WebKit commit the fresh canvas before
        // native chrome removes the outgoing tab.
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
          pendingExploreFrameToken = null;
          if (nativeWindow.__TULIP_EXPLORE_PREPARE_TOKEN__ !== token
              || !canvas.isConnected || presentationRef.current.suspended) return;
          reportedExploreFrameToken = token!;
          nativeWindow.TULIPNative?.exploreFrameReady?.(token!);
        }));
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
    graph.getCollapsedAnalyzeSelection = (incomingEdges,outgoingEdges) => {
      const totalConnections = incomingEdges.length + outgoingEdges.length;
      if (totalConnections <= EXPLORE_CONNECTION_LIMIT) {
        return {
          displayedDriverEdges:incomingEdges,
          displayedImpactEdges:outgoingEdges,
          representativeCandidates:[],
        };
      }

      const hasBothDirections = incomingEdges.length > 0 && outgoingEdges.length > 0;
      const incomingShare = Math.round(EXPLORE_CONNECTION_LIMIT * (incomingEdges.length / totalConnections));
      const maximumIncoming = hasBothDirections ? EXPLORE_CONNECTION_LIMIT - 1 : EXPLORE_CONNECTION_LIMIT;
      let incomingLimit = Math.min(
        incomingEdges.length,
        maximumIncoming,
        Math.max(incomingEdges.length ? 1 : 0,incomingShare),
      );
      let outgoingLimit = Math.min(
        outgoingEdges.length,
        EXPLORE_CONNECTION_LIMIT - incomingLimit,
      );
      const unfilled = EXPLORE_CONNECTION_LIMIT - incomingLimit - outgoingLimit;
      if (unfilled > 0) {
        const incomingRoom = incomingEdges.length - incomingLimit;
        const addIncoming = Math.min(unfilled,incomingRoom);
        incomingLimit += addIncoming;
        outgoingLimit += Math.min(unfilled - addIncoming,outgoingEdges.length - outgoingLimit);
      }
      return {
        displayedDriverEdges:incomingEdges.slice(0,incomingLimit),
        displayedImpactEdges:outgoingEdges.slice(0,outgoingLimit),
        representativeCandidates:[],
      };
    };
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
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileNodeById = new Map(graph.nodes.map((node) => [node.id,node]));
    let lastAmbientFillAt = 0;
    graph.updatePhysics = (...args:any[]) => {
      graph.mobileAutoRotateSpeedMultiplier = app?.dataset.onboardingActive === "true"
        ? (reducedMotion.matches || document.documentElement.dataset.tulipReduceMotion === "true" ? 0 : .3)
        : 1.4;
      originalUpdatePhysics(...args);
      lockExploreCameraOrigin();
      canvas.dataset.rotationX = graph.rotationX.toFixed(5);
      canvas.dataset.rotationY = graph.rotationY.toFixed(5);
      if ((window as Window & { __TULIP_ROTATION_DEBUG__?:boolean }).__TULIP_ROTATION_DEBUG__
        && graph.freeRotationOrientation) {
        canvas.dataset.freeRotationOrientation = graph.freeRotationOrientation.map((value) => value.toFixed(5)).join(",");
      }
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
          const priority = Math.max(.1,Number(node.tulipScore ?? 0));
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
      const selectedTopicName = graph.selectedNode?.name ?? "";
      const isHighlightedTopicLabel = graph.isFocusMode
        && Boolean(selectedNodeIdRef.current)
        && graphContext.fillStyle === "#101014"
        && selectedTopicName.includes(text.trim());
      graphContext.shadowColor = isAmbientRotation
        ? "rgba(0,0,0,.68)"
        : isHighlightedTopicLabel
          ? "rgba(0,0,0,.42)"
          : "rgba(0,0,0,0)";
      graphContext.shadowBlur = isAmbientRotation ? (isNativeApp ? 4 : 7) : isHighlightedTopicLabel ? 4 : 0;
      graphContext.shadowOffsetX = 0;
      graphContext.shadowOffsetY = isAmbientRotation || isHighlightedTopicLabel ? 2 : 0;
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
      setConnectionSummary(null);
      delete canvas.dataset.selectedNodeId;
      delete canvas.dataset.selectionZoom;
      delete canvas.dataset.cameraZoom;
      graph.exitFocusMode();
      if (preSelectionView) {
        graph.targetCamera = null;
        graph.rotationX = preSelectionView.rotationX;
        graph.rotationY = preSelectionView.rotationY;
        graph.freeRotationOrientation = preSelectionView.orientation ? [...preSelectionView.orientation] : null;
        graph.freeRotationIdleAxis = [...preSelectionView.idleAxis];
        graph.camera.x = preSelectionView.cameraX;
        graph.camera.y = preSelectionView.cameraY;
        graph.camera.zoom = preSelectionView.zoom;
        graph.needsCentering = false;
        graph.isDraggingGlobe = false;
        graph.touchGesture = null;
        graph.touchMomentum = null;
        graph.autoRotatePausedUntil = graph.freeSphereRotation ? 0 : Date.now() + 420;
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
      if (app?.dataset.quickStartStep && app.dataset.quickStartStep !== "explore-reset") return false;
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
        // Deep links keep Explore mounted but paused. Present one frame behind
        // the startup cover so canvas/font setup is paid during warmup instead
        // of stalling the first later navigation into Explore.
        if (!presentationRef.current.active || presentationRef.current.suspended) graph.draw();
        const prepareToken = (window as Window & { __TULIP_EXPLORE_PREPARE_TOKEN__?:number }).__TULIP_EXPLORE_PREPARE_TOKEN__;
        if (Number.isInteger(prepareToken) && presentationRef.current.active && !presentationRef.current.suspended) {
          canvas.dataset.nativePreparedExploreToken = String(prepareToken);
          graph.requestRender();
        }
      });
    };

      graph.setFilter(activeFilterRef.current);
      canvas.dataset.activeFilter = activeFilterRef.current;
      applyMobileFraming();
      if (!presentationRef.current.active || presentationRef.current.suspended) graph.pause();

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
    }).catch((error:unknown) => {
      if (cancelled) return;
      if (canvasRef.current) canvasRef.current.dataset.renderError = "true";
      console.error("Explore sphere could not initialize",error);
    });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.setFilter(activeFilter);
    if (canvasRef.current) canvasRef.current.dataset.activeFilter = activeFilter;
  }, [activeFilter]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    const shouldReset = previousResetKeyRef.current !== resetKey;
    previousResetKeyRef.current = resetKey;
    if (active) {
      const hadSelection = Boolean(selectedNodeIdRef.current || graph.isFocusMode || graph.selectedNode);
      selectedNodeIdRef.current = null;
      selectedZoomRef.current = null;
      preSelectionViewRef.current = null;
      setConnectionSummary(null);
      if (canvasRef.current) {
        delete canvasRef.current.dataset.selectedNodeId;
        delete canvasRef.current.dataset.selectionZoom;
        delete canvasRef.current.dataset.cameraZoom;
      }
      if (hadSelection) graph.exitFocusMode();
      if (shouldReset) {
        graph.rotationX = .2;
        graph.rotationY = 0;
        graph.freeRotationOrientation = null;
        graph.freeRotationIdleAxis = [0,-1,0];
      }
      graph.isDraggingGlobe = false;
      graph.isPanningCamera = false;
      graph.touchGesture = null;
      graph.touchMomentum = null;
      graph.targetCamera = null;
      graph.needsCentering = false;
      graph.autoRotatePausedUntil = graph.freeSphereRotation ? 0 : Date.now() + 1200;
      if (shouldReset && canvasRef.current) {
        canvasRef.current.dataset.resetCount = String(Number(canvasRef.current.dataset.resetCount || 0) + 1);
      }
      graph.resume();
      const stage = canvasRef.current?.parentElement;
      if (stage && (graph.width !== stage.clientWidth || graph.height !== stage.clientHeight)) graph.resizeCanvas();
      window.requestAnimationFrame(() => {
        if (!canvasRef.current?.parentElement) return;
        graph.defaultZoom = EXPLORE_MOBILE_ZOOM;
        graph.camera.zoom = EXPLORE_MOBILE_ZOOM;
        graph.camera.x = graph.width / 2;
        graph.camera.y = graph.height / 2 + EXPLORE_CAMERA_VERTICAL_OFFSET;
        graph.requestRender();
        const prepareToken = (window as Window & { __TULIP_EXPLORE_PREPARE_TOKEN__?:number }).__TULIP_EXPLORE_PREPARE_TOKEN__;
        if (Number.isInteger(prepareToken)) {
          canvasRef.current.dataset.nativePreparedExploreToken = String(prepareToken);
        }
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
    const stage = canvasRef.current?.parentElement;
    if (stage && (graph.width !== stage.clientWidth || graph.height !== stage.clientHeight)) graph.resizeCanvas();
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
      if (demoStartRotationY === null || progress <= .01) {
        demoStartRotationY = graph.rotationY;
        graph.freeRotationOrientation = null;
      }
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

  return <div className={`explore-screen app-screen ${active ? "is-active" : "is-inactive"}`} aria-hidden={!active}><div className="sphere-stage"><canvas ref={canvasRef} data-quick-start="explore-canvas" className="desktop-sphere-canvas" aria-label="Interactive Tulip Earth network sphere. Tap a node to reveal connections, move the sphere to inspect them, tap a connected node to follow it, or swipe diagonally from bottom left to middle right to reset." /></div>{connectionSummary ? <div className="explore-connection-summary" role="status" aria-live="polite"><span><strong>{connectionSummary.triggers}</strong> Triggers</span><i aria-hidden="true" /><span><strong>{connectionSummary.effects}</strong> Effects</span></div> : null}<ExploreTopBar onOpenInfo={onOpenInfo} onStartQuickStart={onStartQuickStart} /></div>;
}

function SearchScreen({ onClose, onResult }: { onClose: () => void; onResult: (name: string) => void }) {
  const isAndroid = Boolean((window as Window & { __TULIP_ANDROID_APP__?:boolean }).__TULIP_ANDROID_APP__);
  const [section,setSection] = useState<"search"|"bookmarks">("search");
  const [bookmarks] = useState(readAndroidBookmarks);
  const [answerProfile,setAnswerProfile] = useState<{query:string;profile:MobileInspectorProfile} | null>(null);
  const [query, setQuery] = useState("");
  const [interpretation, setInterpretation] = useState<{ query:string; terms:string[] } | null>(null);
  const [interpreting, setInterpreting] = useState(false);
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
  const androidBridge = (window as Window & { TULIPNative?:TulipNativeBridge }).TULIPNative;
  useEffect(() => {
    const trimmed = query.trim();
    const directMatch = desktopSearchIndex.some((entry) => entry.name.includes(trimmed.toLowerCase()));
    const needsInterpretation = trimmed.length >= 5 && (!directMatch || /[? ]/.test(trimmed));
    if (!androidBridge?.interpretQuery || !needsInterpretation) {
      setInterpreting(false);
      setInterpretation(null);
      return;
    }
    let cancelled = false;
    setInterpreting(true);
    const timer = window.setTimeout(() => {
      let previousTopic = "";
      try { previousTopic = window.localStorage.getItem(ANDROID_LAST_TOPIC_KEY) || ""; } catch { /* Context is optional. */ }
      void androidBridge.interpretQuery!(trimmed,previousTopic)
        .then((terms) => { if (!cancelled) setInterpretation({query:trimmed,terms}); })
        .catch(() => { if (!cancelled) setInterpretation({query:trimmed,terms:[]}); })
        .finally(() => { if (!cancelled) setInterpreting(false); });
    },300);
    return () => { cancelled = true; window.clearTimeout(timer); };
  },[androidBridge,query,history]);
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
  const visibleNodes = useMemo<DesktopNodeData[]>(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];
    let learnedCounts: Record<string,number> = {};
    if ((window as Window & { __TULIP_ANDROID_APP__?:boolean }).__TULIP_ANDROID_APP__) {
      try { learnedCounts = JSON.parse(window.localStorage.getItem("tulip_android_search_learning_v1") || "{}"); }
      catch { /* Local ranking remains deterministic. */ }
    }
    const learnedScore = (name:string) => Math.min(4,Math.log2(1 + (Number(learnedCounts[name]) || 0)));
    const direct = desktopSearchIndex
      .filter((entry) => entry.name.includes(normalizedQuery))
      .sort((a,b) => Number(b.name.startsWith(normalizedQuery)) - Number(a.name.startsWith(normalizedQuery)) || learnedScore(b.node.name) - learnedScore(a.node.name) || a.name.localeCompare(b.name))
      .slice(0,8)
      .map((entry) => entry.node);
    if (direct.length && !query.includes("?")) return direct;
    const exactLocalMatches: DesktopNodeData[] = searchNodes(desktopNodes,query,8).map((match:{node:DesktopNodeData}) => match.node);
    const stopWords = new Set(["about","after","again","could","does","from","have","into","lasting","longer","many","much","their","there","these","this","those","what","when","where","which","while","with","would","your","are","why","how","the","and","for","has","its","more","than"]);
    const meaningfulWords = normalizedQuery.replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter((word) => word.length >= 4 && !stopWords.has(word)).map((word) => word.replace(/ies$/, "").replace(/ing$/, "").replace(/s$/, ""));
    const lexicalMatches = meaningfulWords.length ? desktopNodes.map((node) => {
      const terms = getNodeSearchTerms(node).join(" ").toLowerCase();
      const score = meaningfulWords.reduce((total,word) => total + (terms.includes(word) ? 5 : 0),0);
      return {node,score:score + (score ? learnedScore(node.name) : 0)};
    }).filter((entry) => entry.score > 0).sort((a,b) => b.score - a.score || a.node.name.localeCompare(b.node.name)).slice(0,8).map((entry) => entry.node) : [];
    const contextualNames = /allerg|pollen|hay fever/.test(normalizedQuery)
      ? ["Pollen Allergen Spikes", ...(/longer|spring|season/.test(normalizedQuery) ? ["Global Temperature"] : [])]
      : /(water|lake|river)/.test(normalizedQuery) && /(green|scum|bloom)/.test(normalizedQuery)
        ? ["Harmful Algal Blooms"]
        : /wilt/.test(normalizedQuery) && /(hot|heat)/.test(normalizedQuery)
          ? ["Farm Heat Stress", "Atmospheric Evaporative Demand"] : [];
    const contextualMatches = contextualNames.map((name) => desktopNodeByName.get(name)).filter((node):node is DesktopNodeData => Boolean(node));
    const localMatches = exactLocalMatches.length ? exactLocalMatches : contextualMatches.length ? contextualMatches : lexicalMatches;
    const terms = interpretation?.query === query.trim() ? interpretation.terms : [];
    if (!terms.length) return direct.length ? direct : localMatches;
    const words = terms.flatMap((term) => term.toLowerCase().split(/[^a-z0-9]+/)).filter((word) => word.length > 3);
    const ranked = desktopSearchIndex.map((entry) => {
      const termScore = terms.reduce((score,term) => score + (entry.name.includes(term.toLowerCase()) ? 8 : 0),0);
      const wordScore = words.reduce((score,word) => score + (entry.name.includes(word) ? 2 : 0),0);
      return {node:entry.node,score:termScore + wordScore + (termScore || wordScore ? learnedScore(entry.node.name) : 0)};
    }).filter((entry) => entry.score > 0)
      .sort((a,b) => b.score - a.score || a.node.name.localeCompare(b.node.name))
      .slice(0,8).map((entry) => entry.node);
    return ranked.length ? ranked : direct.length ? direct : localMatches;
  }, [query,interpretation]);
  const showAnswer = isAndroid && (query.includes("?") || query.trim().split(/\s+/).length >= 5);
  useEffect(() => {
    const primary = visibleNodes[0];
    if (!showAnswer || !primary) { setAnswerProfile(null); return; }
    let cancelled = false;
    void loadInspectorProfiles().then((profiles) => {
      const profile = resolveInspectorProfile(primary.name,profiles);
      if (!cancelled && profile) setAnswerProfile({query:query.trim(),profile});
    }).catch(() => { if (!cancelled) setAnswerProfile(null); });
    return () => { cancelled = true; };
  },[query,showAnswer,visibleNodes]);
  const currentAnswer = answerProfile?.query === query.trim() && answerProfile.profile.name === visibleNodes[0]?.name ? answerProfile.profile : null;
  const answerText = currentAnswer ? /\b(why|cause|causing|driver|driving)\b|longer/.test(query.toLowerCase())
    ? currentAnswer.incoming[0]?.[1] || currentAnswer.description
    : /\b(effect|impact|happen|lead to)\b/.test(query.toLowerCase())
      ? currentAnswer.outgoing[0]?.[1] || currentAnswer.description
      : /\b(action|solution|help|do about)\b/.test(query.toLowerCase())
        ? currentAnswer.response.defaultDriver || currentAnswer.description
        : currentAnswer.description : "";
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
    if ((window as Window & { __TULIP_ANDROID_APP__?:boolean }).__TULIP_ANDROID_APP__) {
      try {
        const key = "tulip_android_search_learning_v1";
        const counts = JSON.parse(window.localStorage.getItem(key) || "{}");
        counts[node.name] = Math.min(1000,(Number(counts[node.name]) || 0) + 1);
        window.localStorage.setItem(key,JSON.stringify(counts));
        window.localStorage.setItem(ANDROID_LAST_TOPIC_KEY,node.name);
      } catch { /* Search keeps working without storage. */ }
    }
    keyboard.hide();
    onResult(node.name);
  };
  return <div ref={screenRef} className="app-screen search-screen">
    <header ref={frozenHeaderRef} className="search-frozen-header">
      <div className="search-brand-row search-controls-row"><button className="icon-button muted" onClick={closeSearch} aria-label="Close search"><Cross1Icon width={20} height={20} /></button></div>
      {isAndroid ? <div className="android-search-tabs" role="tablist" aria-label="Search sections"><button type="button" role="tab" aria-selected={section === "search"} onClick={() => setSection("search")}>Search</button><button type="button" role="tab" aria-selected={section === "bookmarks"} onClick={() => { keyboard.hide(); setSection("bookmarks"); }}>Bookmarks</button></div> : null}
      {section === "search" ? <label className="search-line" data-quick-start="search-field"><KeyboardInput ref={inputRef} value={query} onChange={(event) => { setOpenHistoryName(null); setQuery(event.target.value); }} onBlur={() => keyboard.hide()} placeholder="Search a topic" aria-label="Search Tulip Earth" autoComplete="off" /></label> : null}
    </header>
    <MobileScroll className="search-scroll-surface" engine="native">
      <main className="search-surface" onPointerDown={(event) => { if (!(event.target as HTMLElement).closest(".search-history-item")) setOpenHistoryName(null); }}>
        {section === "search" && showAnswer && currentAnswer ? <section className="android-search-answer" aria-label="Ask Tulip Earth answer"><p className="android-search-answer-eyebrow">ASK TULIP EARTH · LOCAL GRAPH</p><h2>This sounds like {currentAnswer.name}</h2><p>{answerText}</p><button type="button" onClick={() => { const node = desktopNodeByName.get(currentAnswer.name); if (node) chooseNode(node); }}>Open topic →</button></section> : null}
        {section === "bookmarks" ? <section className="android-bookmark-list" aria-label="Bookmarks">{bookmarks.length ? bookmarks.map((name) => <button key={name} type="button" onClick={() => { keyboard.hide(); onResult(name); }}>{name}<ExternalLinkIcon aria-hidden="true" /></button>) : <p>Open a topic in Analyse and tap the bookmark button to save it here.</p>}</section> : query.trim() ? <section className="search-results-list" aria-label="Search suggestions" aria-live="polite">{visibleNodes.map((node) => <button key={node.id} onClick={() => chooseNode(node)}><span>{node.name}</span><ExternalLinkIcon aria-hidden="true" /></button>)}{visibleNodes.length === 0 ? <p className="search-no-match">{interpreting ? "Understanding your question on this device…" : "No matching topics"}</p> : null}</section> : <div className="search-discovery"><section className="search-history" aria-labelledby="recent-searches-heading"><h2 id="recent-searches-heading">Recent Searches</h2>{historyNodes.map((node) => <SearchHistoryItem key={node.id} node={node} open={openHistoryName === node.name} onOpen={() => setOpenHistoryName(node.name)} onChoose={() => chooseNode(node)} onRemove={() => removeHistoryNode(node.name)} />)}{historyNodes.length ? <button className="search-clear-history" onClick={() => saveHistory([])}>Clear all</button> : <p className="search-empty-history">No recent searches</p>}</section><section className="search-suggestions" aria-labelledby="suggested-topics-heading"><h2 id="suggested-topics-heading">Suggested Topics</h2><div>{suggestedSearchNodes.map((node) => <button key={node.id} onClick={() => chooseNode(node)}>{node.name}</button>)}</div></section></div>}
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
    <summary><span className="inspector-symbol-label"><InspectorSectionSymbol kind="events" />{profile.title}</span><ChevronRightIcon /></summary>
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

  const relationship = (label:string,direction:"effects"|"triggers") => !desktopNodeByName.has(label)
    ? <p key={label} className="analyse-causal-empty">{label}</p> : (
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

type AnalyseScreenProps = { active?:boolean; name:string; initiallyExpanded?:boolean; entryOrigin?:AppPoint | null; transition?:"idle"|"forward"|"back"; onSelectNode:(name:string) => void; onBack:() => void; onExpandedChange?:(name:string,expanded:boolean) => void; onNavCompactChange?:(compact:boolean) => void };

function AnalyseScreen(props:AnalyseScreenProps) {
  const { active = true,name } = props;
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
  if (!profile) return <div className={`analyse-screen app-screen is-inspector-loading ${active ? "is-active" : "is-inactive"}`} role="status" aria-hidden={!active}><p>{loadFailed ? "Inspector data could not be loaded." : "Loading inspector…"}</p></div>;
  return <AnalyseScreenContent {...props} profile={profile} />;
}

function AnalyseStartingPoints({ used, onSelect }: {used:string[];onSelect:(name:string,total:number) => void}) {
  const [profiles,setProfiles] = useState<Record<string,MobileInspectorProfile>>(inspectorProfilesCache || {});
  const [loadFailed,setLoadFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void loadInspectorProfiles().then((loaded) => { if (!cancelled) setProfiles(loaded); }).catch(() => { if (!cancelled) setLoadFailed(true); });
    return () => { cancelled = true; };
  },[]);
  const ranked = useMemo(() => Object.values(profiles)
    .filter((profile) => profile.assessment?.nodeKind === "issue" && Number.isFinite(profile.assessment.value))
    .sort((a,b) => (b.assessment.value! - a.assessment.value!) || a.name.localeCompare(b.name)),[profiles]);
  const unused = ranked.filter((profile) => !used.includes(profile.name));
  const startingPoints = (unused.length ? unused : ranked).slice(0,6);
  return <div className="analyse-starting-screen app-screen is-active">
    <MobileScroll className="analyse-starting-scroll"><main className="analyse-starting-content">
      <header><h1>Analyse</h1><p>Choose a topic to see its connections and impacts.</p></header>
      <div className="analyse-starting-heading"><h2>Starting points</h2><span>Highest current TULIP Scores</span></div>
      {startingPoints.length ? <div className="analyse-starting-list">{startingPoints.map((profile) => <button type="button" key={profile.name} onClick={() => onSelect(profile.name,ranked.length)}>
        <span className="analyse-starting-topic"><small><InspectorCategorySymbol sphere={profile.sphere} />{profile.sphere}</small><strong>{profile.name}</strong></span>
        <span className="analyse-starting-score"><strong>{profile.assessment.value?.toFixed(1)}</strong><ChevronRightIcon aria-hidden="true" /></span>
      </button>)}</div> : <p className="analyse-starting-status" role="status">{loadFailed ? "Starting points could not be loaded." : "Loading starting points…"}</p>}
      <p className="analyse-starting-note">Scores are provisional internal estimates of current impact.</p>
    </main></MobileScroll>
  </div>;
}

function AnalyseScreenContent({ active = true,name, profile, initiallyExpanded = false, entryOrigin, transition = "idle", onSelectNode, onBack, onExpandedChange, onNavCompactChange }: AnalyseScreenProps & { profile:MobileInspectorProfile }) {
  const androidNative = Boolean((window as Window & { __TULIP_ANDROID_APP__?:boolean }).__TULIP_ANDROID_APP__);
  const androidBridge = (window as Window & { TULIPNative?:TulipNativeBridge }).TULIPNative;
  const [actionMenuOpen,setActionMenuOpen] = useState(false);
  const [shareStatus,setShareStatus] = useState("");
  useEffect(() => { setActionMenuOpen(false); setShareStatus(""); },[name,active]);
  const shareTopic = async () => {
    const url = new URL("https://tulip-project-six.vercel.app/");
    const node = desktopNodeByName.get(profile.name);
    if (node) url.searchParams.set("node",node.id);
    const payload = {title:profile.name,text:`Explore ${profile.name} in Tulip Earth.`,url:url.href};
    try {
      if (androidNative && androidBridge) androidBridge.share(payload);
      else if (navigator.share) await navigator.share(payload);
      else { await navigator.clipboard.writeText(url.href); setShareStatus("Link copied"); return; }
      setActionMenuOpen(false);
    } catch (error) {
      if ((error as Error).name !== "AbortError") setShareStatus("Unable to share right now. Please try again.");
    }
  };
  const [isBookmarked,setIsBookmarked] = useState(() => readAndroidBookmarks().includes(name));
  const toggleBookmark = () => {
    const current = readAndroidBookmarks();
    const next = current.includes(name) ? current.filter((item) => item !== name) : [name,...current];
    try { window.localStorage.setItem(ANDROID_BOOKMARK_KEY,JSON.stringify(next)); } catch { /* Bookmark remains available for this session. */ }
    setIsBookmarked(next.includes(name));
    setActionMenuOpen(false);
  };
  const printTopic = () => {
    const assessment = profile.assessment;
    const scoreCopy = assessment ? `<h2>TULIP Score</h2><p>${assessment.value != null ? assessment.value.toFixed(1) + " / 10" : escapePrintHtml(assessment.label)}${assessment.valueLabel ? " · " + escapePrintHtml(assessment.valueLabel) : ""}</p><p>${escapePrintHtml(assessment.explanation)}</p>` : "";
    const list = (items:MobileRelationshipEntry[]) => `<ul>${items.map(([label,detail]) => `<li><strong>${escapePrintHtml(label)}</strong>${detail ? ` — ${escapePrintHtml(detail)}` : ""}</li>`).join("")}</ul>`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:sans-serif;color:#17171b;line-height:1.5;padding:28px;max-width:780px;margin:auto}h1{font-size:30px}h2{font-size:18px;margin-top:28px}p,li{font-size:13px}footer{margin-top:36px;font-size:11px;color:#555}</style></head><body><h1>${escapePrintHtml(profile.name)}</h1><p>${escapePrintHtml(profile.sphere)} · Last updated ${escapePrintHtml(formatAppDate(profile.updated))}</p><p>${escapePrintHtml(profile.description)}</p><h2>Triggers</h2>${list(profile.incoming)}<h2>Effects</h2>${list(profile.outgoing)}<h2>Impact on Humans</h2><p>${escapePrintHtml(profile.human.summary)}</p><h2>Impact on the Planet</h2><p>${escapePrintHtml(profile.planet.summary)}</p><h2>What Can Be Done</h2><p>${escapePrintHtml(profile.response.defaultDriver)}</p><ul>${(profile.response.levers || []).map((item:string) => `<li>${escapePrintHtml(item)}</li>`).join("")}</ul>${scoreCopy}<h2>Monitoring Sources</h2><ul>${profile.sources.map(([label,url]) => `<li>${escapePrintHtml(label)} — ${escapePrintHtml(url)}</li>`).join("")}</ul><footer>Tulip Earth · This is an educational summary. See original sources for methods and limitations.</footer></body></html>`;
    androidBridge?.printTopic?.({title:profile.name,html});
    setActionMenuOpen(false);
  };
  const sheetRef = useRef<HTMLDivElement>(null);
  const inspectorScrolledRef = useRef(false);
  const backSwipeRef = useRef<{ pointerId:number; x:number; y:number; fromLeftEdge:boolean } | null>(null);
  const ignoreHandleClickUntilRef = useRef(0);
  const dragStartRef = useRef<AnalyseSheetDrag | null>(null);
  const collapseRegionRef = useRef<{ pointerId:number; x:number; y:number } | null>(null);
  const collapseRegionDragRef = useRef<{ pointerId:number; y:number } | null>(null);
  const dragTranslateRef = useRef<number | null>(null);
  const dragFrameRef = useRef<number | null>(null);
  const dragSettleFrameRef = useRef<number | null>(null);
  const pendingDragTranslateRef = useRef<number | null>(null);
  const expandedCueTimerRef = useRef<number | null>(null);
  const [expanded,setExpanded] = useState(initiallyExpanded && !entryOrigin);
  const [scoreExplanationOpen,setScoreExplanationOpen] = useState(false);
  const keyboard = useKeyboard();
  const photoTriggerRef = useRef<HTMLButtonElement>(null);
  const photoKey = `${name}:${profile.photo?.asset || ""}`;
  const currentPhotoKey = useRef(photoKey); currentPhotoKey.current = photoKey;
  const [failedPhotoKey,setFailedPhotoKey] = useState<string | null>(null);
  const [photoViewer,setPhotoViewer] = useState<{key:string;name:string;photo:InspectorPhotoData} | null>(null);
  const headerPhoto = active && profile.name === name && failedPhotoKey !== photoKey ? profile.photo : null;
  const photoFailed = () => { if (currentPhotoKey.current === photoKey) { setFailedPhotoKey(photoKey); setPhotoViewer(null); } };
  useEffect(() => { setPhotoViewer(null); },[name,active]);

  const [isInspectorScrolled,setIsInspectorScrolled] = useState(false);
  const [showExpandedCue,setShowExpandedCue] = useState(false);
  const [openingFromExplore,setOpeningFromExplore] = useState(Boolean(entryOrigin));
  const [isSheetDragging,setIsSheetDragging] = useState(false);
  const [connection, setConnection] = useState<{label:string;detail:string;direction:"incoming"|"outgoing"} | null>(null);
  useLayoutEffect(() => {
    const shell = sheetRef.current;
    const screen = shell?.closest<HTMLElement>(".analyse-screen");
    const header = shell?.querySelector<HTMLElement>(".analysis-sheet-grab-zone");
    if (!shell || !screen || !header) return;
    const measure = () => {
      const peek = Math.min(shell.clientHeight,Math.max(COLLAPSED_ANALYSE_PEEK,header.offsetHeight + 100));
      screen.style.setProperty("--analysis-collapsed-peek",`${peek}px`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    observer.observe(shell);
    measure();
    return () => observer.disconnect();
  },[name]);
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
    window.dispatchEvent(new CustomEvent("tulip:analyse-inspector-state",{detail:{expanded:shouldExpand,name,interaction:!cancelled && travelled > ANALYSE_SHEET_GESTURE_SLOP ? "drag" : undefined}}));
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
    if ((event.target as Element).closest(".inspector-photo-viewer")) return;
    if (event.currentTarget.closest<HTMLElement>(".tulip-app")?.dataset.quickStartStep === "analyse-back") return;
    event.stopPropagation();
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    const shell = sheetRef.current;
    if (!shell) return;
    const peek = parseFloat(getComputedStyle(shell).getPropertyValue("--analysis-collapsed-peek")) || COLLAPSED_ANALYSE_PEEK;
    const collapsedTranslate = Math.max(0,shell.clientHeight - peek);
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
    // Capture only a real drag; early capture retargets a handle tap to its parent.
  };
  const moveSheetDrag = (event: React.PointerEvent<HTMLElement>) => {
    event.stopPropagation();
    const drag = dragStartRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.cancelable) event.preventDefault();
    const movement = (event.clientY - drag.y) / drag.scale;
    if (Math.abs(movement) > ANALYSE_SHEET_GESTURE_SLOP && !event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
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
    if ((event.target as Element).closest(".inspector-photo-viewer")) return;
    if (event.currentTarget.closest<HTMLElement>(".tulip-app")?.dataset.quickStartStep === "analyse-back") return;
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
    if (event.pointerType === "touch") return;
    const localX = event.clientX - event.currentTarget.getBoundingClientRect().left;
    const target = event.target as Element;
    if (!event.isPrimary || event.button !== 0 || !target.closest(".analysis-sheet-shell")
      || target.closest("button,a,summary,.mobile-carousel")) return;
    backSwipeRef.current = { pointerId:event.pointerId,x:event.clientX,y:event.clientY,fromLeftEdge:localX <= 28 };
  };
  const commitBackSwipe = (pointerId:number,x:number,y:number) => {
    const start = backSwipeRef.current;
    backSwipeRef.current = null;
    if (!start || start.pointerId !== pointerId) return;
    const dx = x - start.x;
    const dy = y - start.y;
    if ((dx <= -64 || (start.fromLeftEdge && dx >= 64)) && Math.abs(dx) > Math.abs(dy) * 1.5) onBack();
  };
  const beginTouchBackSwipe = (event:ReactTouchEvent<HTMLDivElement>) => {
    const target = event.target as Element;
    const touch = event.touches.length === 1 ? event.touches[0] : null;
    if (!touch || !target.closest(".analysis-sheet-shell") || target.closest("button,a,summary,.mobile-carousel")) {
      backSwipeRef.current = null;
      return;
    }
    backSwipeRef.current = {pointerId:-1,x:touch.clientX,y:touch.clientY,fromLeftEdge:touch.clientX - event.currentTarget.getBoundingClientRect().left <= 28};
  };
  return <div className={`analyse-screen app-screen ${active ? "is-active" : "is-inactive"} ${expanded ? "is-inspector-expanded" : ""} ${openingFromExplore ? "is-opening-from-explore" : ""} ${transition === "idle" ? "" : `is-node-${transition}`}`} aria-hidden={!active} onPointerDownCapture={beginCollapseRegion} onPointerMoveCapture={moveCollapseRegion} onPointerUpCapture={finishCollapseRegion} onPointerCancelCapture={(event) => finishCollapseRegion(event,true)} onPointerDown={beginBackSwipe} onPointerUp={(event) => { if (event.pointerType !== "touch") commitBackSwipe(event.pointerId,event.clientX,event.clientY); }} onPointerCancel={(event) => { if (event.pointerType !== "touch") backSwipeRef.current = null; }} onTouchStart={beginTouchBackSwipe} onTouchEnd={(event) => { const touch = event.changedTouches[0]; if (touch) commitBackSwipe(-1,touch.clientX,touch.clientY); }} onTouchCancel={() => { backSwipeRef.current = null; }}>
    <AnalyseRelationshipScroller profile={profile} onSelectNode={onSelectNode} />
    <BottomSheet open={actionMenuOpen} onOpenChange={setActionMenuOpen} title="Share" snap={0.4}>
      <div className="mobile-inspector-share-options">
        <button type="button" onClick={() => { void shareTopic(); }}>{!androidNative && !navigator.share ? "Copy Link" : "Share Link"}</button>
        {androidNative ? <><button type="button" onClick={printTopic}>Export PDF</button><button type="button" onClick={toggleBookmark}>{isBookmarked ? "Remove Bookmark" : "Bookmark Topic"}</button></> : null}
        {shareStatus ? <p role="status">{shareStatus}</p> : null}
      </div>
    </BottomSheet>
    {showExpandedCue && !photoViewer ? <div className="analysis-expanded-cue" role="status" aria-live="polite">Swipe down to explore more.</div> : null}
    {photoViewer && headerPhoto && photoViewer.key === photoKey ? <InspectorPhotoViewer photo={photoViewer.photo} name={photoViewer.name} onClose={() => setPhotoViewer(null)} onError={photoFailed} trigger={photoTriggerRef} /> : null}
    <BottomSheet open={scoreExplanationOpen} onOpenChange={setScoreExplanationOpen} title="TULIP Score" snap={0.75}>
      <div className="score-explanation">
        <h3>{profile.name}</h3>
        <p>{profile.scoreBreakdown?.summary || profile.assessment?.explanation || SCORE_METHOD_COPY.missing}</p>
        {profile.scoreBreakdown?.components.map((component) => <section className="score-component" key={component.id} aria-label={`${component.label}, ${component.weight} of score`}>
          <div className="score-component-heading"><h4>{component.label} <span>{component.weight}</span></h4><strong>{component.value}<small> / 10</small></strong></div>
          <p>{component.explanation}</p>
        </section>)}
        {profile.scoreBreakdown?.formula ? <div className="score-calculation"><h4>The calculation</h4><p>{profile.scoreBreakdown.formula}</p></div> : null}
        {profile.scoreBreakdown?.note ? <p className="score-rounding-note">{profile.scoreBreakdown.note}</p> : null}
      </div>
    </BottomSheet>
    {openingFromExplore ? <div className="analyse-entry-node" style={entryStyle} aria-hidden="true"><span>{profile.name}</span></div> : null}
    <div ref={sheetRef} className={`analysis-sheet-shell ${expanded ? "is-expanded" : "is-collapsed"}${isSheetDragging ? " is-dragging" : ""}${isInspectorScrolled ? " is-inspector-scrolled" : ""}`} style={sheetStyle}>
      <MobileScroll className="analyse-scroll" engine="native">
        <main className="analysis-sheet">
          <div className="analysis-sheet-grab-zone" data-quick-start="analyse-grab-zone" {...bindSheetDrag()}>
            <button className="analysis-sheet-handle" type="button" aria-label={expanded ? "Collapse node inspector" : "Expand node inspector"} aria-expanded={expanded} onClick={toggleSheet}><span /></button>
            <div className="analysis-title-row">
              <div><p className="eyebrow accent"><InspectorCategorySymbol sphere={profile.sphere} />{profile.sphere}</p><h1 title={profile.name}><InspectorCategorySymbol sphere={profile.sphere} collapsed /><span>{profile.name}</span></h1><p className="analysis-source-date">Last updated {formatAppDate(profile.updated)}</p></div>
              <div className="mobile-inspector-header-actions"><button type="button" className="mobile-score-summary" onClick={() => setScoreExplanationOpen(true)} aria-label={`${profile.assessment?.accessibilityLabel || profile.assessment?.label || "Not yet scored"} Explain TULIP Score`}>
                {profile.assessment?.value != null ? <div className="mobile-score-lockup"><strong>{profile.assessment.value.toFixed(1)}</strong></div> : <span className="assessment-note">{profile.assessment?.label || "Not yet scored"}</span>}
              </button><button type="button" className="mobile-inspector-share" aria-label={`Share ${profile.name}`} aria-haspopup="dialog" onClick={() => { keyboard.hide(); setShareStatus(""); setActionMenuOpen(true); }}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m13 4 8 7-8 7v-4c-5 0-8 2-10 6 0-8 4-12 10-12V4Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button></div>
            </div>
          </div>
          <div className="analysis-detail-content" aria-hidden={!expanded}>
            {expanded && headerPhoto ? <figure className="inspector-photo"><button ref={photoTriggerRef} type="button" className="inspector-photo-trigger" aria-label={`View photograph of ${name}`} aria-haspopup="dialog" onClick={() => {
              if (performance.now() < ignoreHandleClickUntilRef.current) return;
              keyboard.hide(); setPhotoViewer({key:photoKey,name,photo:headerPhoto});
            }}><img src={headerPhoto.asset} width={headerPhoto.width} height={headerPhoto.height} alt={headerPhoto.alt} decoding="async" draggable={false} onError={photoFailed} /></button></figure> : null}
            <section className="detail-section overview-section"><p className="body-copy">{profile.description}</p></section>
            <section className="detail-section relationship-section"><p className="eyebrow inspector-symbol-label"><InspectorSectionSymbol kind="relationships" />Relationships</p><h3 className="relationship-trigger-word">Triggers</h3><Carousel key={`incoming-${connection?.direction === "incoming" ? connection.label : "none"}`} engine="native" ariaLabel="Pick a Trigger">{incomingRelationships.map(([label,detail]) => <button key={label} aria-pressed={connection?.direction === "incoming" && connection.label === label} onClick={() => setConnection({label,detail,direction:"incoming"})}>{label}</button>)}</Carousel><h3 className="relationship-effect-word">Effects</h3><Carousel key={`outgoing-${connection?.direction === "outgoing" ? connection.label : "none"}`} engine="native" ariaLabel="Pick an Effect">{outgoingRelationships.map(([label,detail]) => <button key={label} aria-pressed={connection?.direction === "outgoing" && connection.label === label} onClick={() => setConnection({label,detail,direction:"outgoing"})}>{label}</button>)}</Carousel>{connection ? <article className="connection-card" aria-live="polite"><p className="connection-question">{connectionQuestion}</p><p className="connection-answer">{connection.detail}</p></article> : null}</section>
            <section className="detail-section inspector-block"><div className="inspector-block-heading"><p className="eyebrow inspector-symbol-label"><InspectorSectionSymbol kind="humans" />Impact on Humans</p></div><p className="body-copy">{profile.human.summary}</p><p className="affects"><strong>AFFECTS:</strong> {profile.human.domains.join(", ") || "No additional domain asserted"}</p><ul className="consequence-list">{profile.human.consequences.map((item:string) => <li key={item}>{item}</li>)}</ul><InspectorField label="Hidden Cost"><p>{profile.human.hiddenCost}</p></InspectorField><InspectorField label="Who Pays for It"><p>{profile.human.whoPays}</p></InspectorField></section>
            <section className="detail-section inspector-block"><div className="inspector-block-heading"><p className="eyebrow inspector-symbol-label"><InspectorSectionSymbol kind="planet" />Impact on the Planet</p></div><p className="body-copy">{profile.planet.summary}</p><p className="affects"><strong>AFFECTS:</strong> {profile.planet.domains.join(", ") || "No additional system asserted"}</p><ul className="consequence-list">{profile.planet.consequences.map((item:string) => <li key={item}>{item}</li>)}</ul><InspectorField label="Limits and uncertainty"><p>{profile.planet.physicalLimit}</p></InspectorField></section>
            <section className="detail-section inspector-block"><p className="eyebrow inspector-symbol-label"><InspectorSectionSymbol kind="response" />What Can Be Done</p><InspectorField label="What drives this"><p>{profile.response.defaultDriver}</p></InspectorField><InspectorField label="Actions that can help"><ul className="lever-list">{profile.response.levers.map((item:string) => <li key={item}>{item}</li>)}</ul></InspectorField></section>
            {profile.recentOccurrences ? <RecentMajorEvents key={profile.name} profile={profile.recentOccurrences} /> : null}
            <details className="detail-section inspector-block inspector-disclosure"><summary><span className="inspector-symbol-label"><InspectorSectionSymbol kind="measurement" />How This Is Measured</span><ChevronRightIcon /></summary><dl className="measurement-grid"><div><dt>Metric</dt><dd>{formatMetricDisplayText(profile.measurement.metric)}</dd></div><div><dt>Unit</dt><dd>{formatMetricDisplayText(profile.measurement.unit)}</dd></div><div><dt>Geography</dt><dd>{formatMetricDisplayText(profile.measurement.geography)}</dd></div><div><dt>Cadence</dt><dd>{formatMetricDisplayText(profile.measurement.cadence)}</dd></div><div><dt>Method</dt><dd>{formatMetricDisplayText(profile.measurement.method)}</dd></div><div><dt>Uncertainty</dt><dd>{formatMetricDisplayText(profile.measurement.uncertainty)}</dd></div><div><dt>Interpretation boundary</dt><dd>{formatMetricDisplayText(profile.measurement.boundary)}</dd></div></dl></details>
            <details className="detail-section inspector-block inspector-disclosure monitoring-block"><summary><span className="inspector-symbol-label"><InspectorSectionSymbol kind="sources" />Monitoring Sources</span><ChevronRightIcon /></summary><div className="monitoring-links">{profile.sources.map(([label,url]) => <a key={url} href={url} target="_blank" rel="noreferrer"><span>{label}</span><ExternalLinkIcon /></a>)}</div></details>
          </div>
        </main>
      </MobileScroll>
    </div>
  </div>;
}

const formatImpactValue = (value: number) => Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
const compactImpactUnit = (unit: string) => formatMetricDisplayText(String(unit || "relative value")).replace(" per year", "/yr").replace(" per kg food", "/kg");

function ActivityScreen({ active = true,resetRequest, onNavCompactChange }: { active?:boolean; resetRequest:number; onNavCompactChange?:(compact:boolean) => void }) {
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
    rail.scrollTo({left:Math.max(0,centeredLeft),behavior:systemPrefersReducedMotion() ? "auto" : "smooth"});
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
    if (systemPrefersReducedMotion() || currentIndex <= defaultIndex) {
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
  return <div ref={screenRef} className={`app-screen activity-screen ${active ? "is-active" : "is-inactive"}`} aria-hidden={!active} style={themeStyle} onPointerDownCapture={beginEdgeSwipe} onPointerUpCapture={finishEdgeSwipe} onPointerCancelCapture={() => { edgeSwipeRef.current = null; }}><header ref={frozenHeaderRef} className="activity-frozen-header"><div className="page-heading"><div><h1>Activity Impacts</h1></div></div><Carousel className="scope-carousel activity-scope-carousel" contentClassName="scope-list activity-scope-list" engine="native" ariaLabel="Activity categories">{activityProfiles.map((item) => <button key={item.key} className={scope === item.key ? "selected" : ""} onClick={() => { setScopeTransition(null); setScope(item.key); }}>{item.label}</button>)}</Carousel></header><MobileScroll className="activity-scroll-surface" engine="native"><main key={`${scope}-${view}`} className={`page-content activity-content${scopeTransition ? ` is-scope-${scopeTransition}` : ""}`}><section className="activity-focus"><div className="activity-focus-heading"><div><p className="eyebrow">Activity</p><h2>{profile.label}</h2></div><div className="segment-control activity-mode-toggle" aria-label="Activity content mode"><button className={view === "impact" ? "selected" : ""} onClick={() => setView("impact")}>Impact</button><button data-quick-start="activity-actions" className={view === "actions" ? "selected" : ""} onClick={() => setView("actions")}>Actions</button></div></div></section>{view === "impact" ? <ActivityImpactPanel profile={profile} /> : <ActivityActionsPanel profile={profile} />}</main></MobileScroll></div>;
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
const FOOTPRINT_SELECTION_ACK_MS = 60;
const FOOTPRINT_FORWARD_EXIT_MS = 180;
const FOOTPRINT_FORWARD_SETTLE_MS = 220;

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

function FootprintScreen({ active = true,resetRequest, onNavCompactChange }: { active?:boolean; resetRequest:number; onNavCompactChange:(compact:boolean) => void }) {
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
        ?.scrollTo({top:0,behavior:systemPrefersReducedMotion() ? "auto" : "smooth"});
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
            },FOOTPRINT_FORWARD_SETTLE_MS);
          });
        });
      },FOOTPRINT_FORWARD_EXIT_MS);
    },FOOTPRINT_SELECTION_ACK_MS);
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
  return <div ref={screenRef} className={`app-screen footprint-screen ${active ? "is-active" : "is-inactive"} ${showingSummary ? "is-summary" : "is-questionnaire"}`} aria-hidden={!active}><header ref={frozenHeaderRef} className="footprint-frozen-header"><div className="footprint-title-row"><div><h1>My Footprint</h1><p className="subtitle">A benchmark estimate across home, travel, food and purchasing.</p></div></div>{showingSummary || result.answered === 0 ? null : <FootprintMetricStrip result={result} trends={metricTrends} />}<div className="progress-track"><i style={{width:`${showingSummary ? 100 : ((step + 1) / footprintQuestions.length) * 100}%`}} /></div></header><MobileScroll key={showingSummary ? "footprint-summary" : "footprint-questions"} className="footprint-scroll-surface"><main className={`page-content footprint-content is-${questionTransition}`} onTouchStart={beginBackSwipe} onTouchEnd={finishBackSwipe} onTouchCancel={() => { backSwipeRef.current = null; }} onPointerDown={beginPointerBackSwipe} onPointerUp={finishPointerBackSwipe} onPointerCancel={() => { backSwipeRef.current = null; }}>{!showingSummary ? <section className="question-card"><p className="question-number">{question.title}</p><div className="answer-list" data-quick-start="footprint-answers">{question.options.map((option) => <button key={option.value} className={selected === option.value ? "selected" : ""} onClick={() => choose(option.value)} aria-pressed={selected === option.value}><strong>{option.label}</strong></button>)}</div></section> : <FootprintSummary result={result} onReview={() => setStep(0)} onReset={reset} />}</main></MobileScroll></div>;
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
  return <div className="desktop-info-copy score-info-copy"><h2>{SCORE_METHOD_COPY.title}</h2>{["summary","components","formula","missing","evidence","limits"].map(key => <p key={key}>{SCORE_METHOD_COPY[key]}</p>)}</div>;
}

function AboutTulipInfo() {
  return <div className="desktop-info-copy"><h2>Tracking Use, Loss, and Impact on the Planet</h2><p className="info-lead">Tulip Earth helps people understand how human choices affect Earth’s atmosphere, oceans, ecosystems, economies, and future.</p><p>It brings climate data and interconnected relationships into one explorable system.</p><p>This makes complex causes and consequences easier to understand without reducing them to a single story.</p><section><h3>What You Can Do</h3><ul><li>Explore connected environmental causes and effects</li><li>Follow what drives a problem and what it affects next</li><li>Understand how human activity influences the climate</li><li>Estimate your personal carbon, water, land, and material footprints</li></ul></section><p>Tulip Earth combines public datasets, institutional monitoring, reported disclosures, and modeled relationships.</p><p>Not every connection carries the same level of certainty, and Tulip Earth is not a substitute for primary scientific institutions.</p></div>;
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
  if (isNativeApp) return <div className="desktop-info-copy"><h2>Contact</h2><p className="info-lead">For partnerships, research collaboration, platform questions, data discussions, and institutional outreach related to Tulip Earth.</p><p>Contact opens your email app. Tulip Earth receives only the information you choose to include after you send the message.</p><a className="direct-email-link" href="mailto:aniket1.warade@gmail.com?subject=Tulip%20Earth%20app%20support">Email Tulip Earth support</a></div>;
  return <div className="desktop-info-copy"><h2>Contact</h2><p className="info-lead">For partnerships, research collaboration, platform questions, data discussions, and institutional outreach related to Tulip Earth.</p><form className="mobile-contact-form" onSubmit={submit}><input type="hidden" name="_subject" value="New Tulip Earth contact form message" /><input type="hidden" name="_template" value="table" /><label><span>Name</span><KeyboardInput name="name" autoComplete="name" maxLength={100} required /></label><label><span>Email</span><KeyboardInput type="email" name="email" autoComplete="email" maxLength={160} required /></label><label><span>Organization <small>Optional</small></span><KeyboardInput name="organization" autoComplete="organization" maxLength={140} /></label><label><span>Topic</span><select name="topic" required defaultValue=""><option value="" disabled>Select a topic</option><option>Platform question</option><option>Research collaboration</option><option>Data or evidence</option><option>Partnership</option><option>Other</option></select></label><label><span>Message</span><textarea name="message" rows={7} maxLength={4000} required /></label><p className="contact-privacy-note">Submitting sends the information above to Tulip Earth so we can respond. It is not used for advertising or tracking.</p><button type="submit">Send message</button><p className="contact-status" role="status" aria-live="polite">{status}</p></form><a className="direct-email-link" href="mailto:aniket1.warade@gmail.com">aniket1.warade@gmail.com</a></div>;
}

function PrivacyTulipInfo() {
  return <div className="desktop-info-copy privacy-info-copy"><h2>Privacy</h2><p className="info-lead">Tulip Earth does not use advertising trackers or sell personal information.</p><section><h3>Information stored on this device</h3><p>Search history, Analyse navigation history, and footprint answers may be stored locally so the app can preserve your progress. This information stays on your device and can be removed by deleting the app or clearing its data.</p></section><section><h3>When you contact Tulip Earth</h3><p>The app opens your email app when you choose Contact. Tulip Earth receives only the information you choose to include after you send the email. Correspondence is used only to respond to your request and maintain necessary records; it is not used for advertising or cross-app tracking.</p></section><section><h3>External sources</h3><p>Links to scientific sources open outside Tulip Earth. Those sites have their own privacy practices. Tulip Earth does not automatically send your footprint answers or app history to those sites.</p></section><section><h3>Your choices</h3><p>You can use the graph, Analyse, Activity Impacts, and My Footprint without creating an account or contacting Tulip Earth. To ask about retained correspondence or request deletion, email the address below.</p></section><a className="direct-email-link" href="mailto:aniket1.warade@gmail.com">aniket1.warade@gmail.com</a><a className="direct-email-link" href="https://tulip-project-six.vercel.app/privacy.html" target="_blank" rel="noreferrer">View the full privacy policy</a></div>;
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
  const titles:Record<ExploreInfoSection,string> = {score:"TULIP Score",sources:"Sources",registries:"Registries",about:"About Tulip Earth",contact:"Contact",privacy:"Privacy"};
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
  const [analyseHasSelection,setAnalyseHasSelection] = useState(Boolean(initialAnalyseCache));
  const [usedAnalyseStartingPoints,setUsedAnalyseStartingPoints] = useState(readUsedAnalyseStartingPoints);
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
  const [nativeStartupVisible,setNativeStartupVisible] = useState(() => (window as Window & { __TULIP_NATIVE_STARTUP_COMPLETE__?:boolean }).__TULIP_NATIVE_STARTUP_COMPLETE__ === false);
  const [introductionPage,setIntroductionPage] = useState(readIntroductionPage);
  const [introductionPhase,setIntroductionPhase] = useState<"pages"|"notifications"|"waiting"|"error"|"revealing">(() => {
    try { return window.sessionStorage.getItem(INTRO_RETRY_KEY) === "true" ? "waiting" : "pages"; } catch { return "pages"; }
  });
  const [revealReducedMotion,setRevealReducedMotion] = useState(false);
  const onboardingActive = introductionPage !== null;
  const onboardingActiveRef = useRef(onboardingActive);
  onboardingActiveRef.current = onboardingActive;
  const revealStartedRef = useRef(false);
  const introductionActionRef = useRef(false);
  const startupCovered = startupWarmupVisible || nativeStartupVisible;
  const [quickStartStep,setQuickStartStep] = useState<number | null>(null);
  const [quickStartCompleteVisible,setQuickStartCompleteVisible] = useState(false);
  const quickStartAutoPendingRef = useRef(
    !hasCompletedQuickStart()
      && (!window.location.hash || window.location.hash === "#explore"),
  );
  const quickStartCompleteTimerRef = useRef<number | null>(null);
  const analyseHistoryRef = useRef<AnalyseHistoryEntry[]>(initialAnalyseCache?.history || []);
  const analyseNodeNameRef = useRef(nodeName);
  const analyseFromStartingPointRef = useRef(false);
  const analyseExpandedRef = useRef(initialAnalyseCache?.current.expanded || false);
  const analyseTransitionTimerRef = useRef<number | null>(null);
  useEffect(() => {
    try { window.sessionStorage.removeItem(INTRO_RETRY_KEY); } catch { /* Optional retry state. */ }
    const handleStartupComplete = () => setNativeStartupVisible(false);
    window.addEventListener("tulip-native-startup-complete",handleStartupComplete);
    return () => window.removeEventListener("tulip-native-startup-complete",handleStartupComplete);
  },[]);
  const changeIntroductionPage = (page:number) => {
    introductionActionRef.current = false;
    setIntroductionPage(page);
    setIntroductionPhase("pages");
    saveIntroduction(page);
  };
  const continueIntroduction = () => {
    if (introductionActionRef.current) return;
    introductionActionRef.current = true;
    setIntroductionPage(3);
    saveIntroduction(3);
    const nativeBridge = (window as Window & { TULIPNative?:TulipNativeBridge }).TULIPNative;
    let notificationsComplete = false;
    try { notificationsComplete = window.localStorage.getItem(NOTIFICATION_ONBOARDING_KEY) === "complete"; } catch { /* Optional persistence. */ }
    if (nativeBridge?.notificationOnboarding && !notificationsComplete) {
      keyboard.hide();
      setIntroductionPhase("notifications");
      return;
    }
    setIntroductionPhase("waiting");
  };
  useEffect(() => {
    if (introductionPhase !== "notifications") return;
    const complete = (event:Event) => {
      if ((event as CustomEvent<{action?:string}>).detail?.action !== "completeNotificationOnboarding") return;
      try { window.localStorage.setItem(NOTIFICATION_ONBOARDING_KEY,"complete"); } catch { /* Optional persistence. */ }
      setIntroductionPhase("waiting");
    };
    window.addEventListener("tulip-native-navigation",complete);
    (window as Window & { TULIPNative?:TulipNativeBridge }).TULIPNative?.notificationOnboarding?.();
    return () => window.removeEventListener("tulip-native-navigation",complete);
  },[introductionPhase]);
  const beginIntroductionReveal = useCallback(() => {
    if (revealStartedRef.current) return;
    revealStartedRef.current = true;
    saveIntroduction("complete");
    setRevealReducedMotion(systemPrefersReducedMotion());
    setIntroductionPhase("revealing");
  },[]);
  const failIntroduction = useCallback(() => setIntroductionPhase("error"),[]);
  useEffect(() => {
    if (!onboardingActive || introductionPhase !== "revealing") return;
    const timer = window.setTimeout(() => {
      quickStartAutoPendingRef.current = false;
      // Atomic handoff: preserve the same canvas, orientation and camera.
      setIntroductionPage(null);
      setQuickStartStep(0);
    },revealReducedMotion ? 200 : 900);
    return () => window.clearTimeout(timer);
  },[onboardingActive,introductionPhase,revealReducedMotion]);
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
      if (onboardingActiveRef.current) return;
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
    if (isReselection && nextScreen === "explore") setExploreResetKey((value) => value + 1);
    if (nextScreen === "analyse") {
      setAnalyseHasSelection(false);
      analyseFromStartingPointRef.current = false;
      analyseHistoryRef.current = [];
      setAnalyseExpandedOnOpen(false);
      setAnalyseEntryOrigin(null);
      analyseExpandedRef.current = false;
      try { window.sessionStorage.removeItem(ANALYSE_HISTORY_STORAGE_KEY); } catch { /* Navigation remains usable. */ }
    }
    window.location.hash = nextScreen;
    setScreen(nextScreen);
  };
  useEffect(() => {
    if (!Boolean((window as Window & { __TULIP_NATIVE_APP__?:boolean }).__TULIP_NATIVE_APP__)) return;
    const handleNativeNavigation = (event:Event) => {
      const detail = (event as CustomEvent<{ action?:string; screen?:string; filter?:string; active?:boolean; token?:number }>).detail;
      if (detail?.action === "setRenderingActive") {
        setNativeRenderingActive(detail.active !== false);
        return;
      }
      if (detail?.action === "prepareExplore" && Number.isInteger(detail.token)) {
        (window as Window & { __TULIP_EXPLORE_PREPARE_TOKEN__?:number }).__TULIP_EXPLORE_PREPARE_TOKEN__ = detail.token;
        setNativeRenderingActive(true);
        if (!onboardingActiveRef.current) navigate("explore");
        return;
      }
      if (onboardingActiveRef.current) return;
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
    if (onboardingActiveRef.current) return;
    quickStartAutoPendingRef.current = false;
    setFiltersOpen(false);
    setInfoSection(null);
    setQuickStartCompleteVisible(false);
    setActiveFilter("all");
    const canvas = document.querySelector<HTMLElement>('[data-quick-start="explore-canvas"]');
    if (canvas) delete canvas.dataset.quickStartFirstNode;
    keyboard.hide();
    navigate("explore");
    setQuickStartStep(0);
  },[keyboard,screen]);
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
    },4200);
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
    if (startupCovered || onboardingActive || !quickStartAutoPendingRef.current) return;
    quickStartAutoPendingRef.current = false;
    startQuickStart();
  },[startupCovered,onboardingActive,startQuickStart]);
  const playAnalyseTransition = useCallback((direction:"forward"|"back") => {
    if (analyseTransitionTimerRef.current !== null) window.clearTimeout(analyseTransitionTimerRef.current);
    setAnalyseTransition(direction);
    analyseTransitionTimerRef.current = window.setTimeout(() => {
      analyseTransitionTimerRef.current = null;
      setAnalyseTransition("idle");
    },360);
  },[]);
  const showAnalysis = useCallback((name: string, initiallyExpanded = false, entryOrigin?:AppPoint) => {
    if ((window as Window & { __TULIP_ANDROID_APP__?:boolean }).__TULIP_ANDROID_APP__) {
      try { window.localStorage.setItem(ANDROID_LAST_TOPIC_KEY,name); } catch { /* Search remains available. */ }
    }
    keyboard.hide();
    setAnalyseHasSelection(true);
    analyseFromStartingPointRef.current = false;
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
  const openAnalyseStartingPoint = useCallback((name:string,total:number) => {
    setUsedAnalyseStartingPoints((current) => {
      const next = current.includes(name) ? current : [...current,name];
      const saved = next.length >= total ? [] : next;
      try { window.localStorage.setItem(ANALYSE_STARTING_POINTS_KEY,JSON.stringify(saved)); } catch { /* Keep this session's order. */ }
      return saved;
    });
    showAnalysis(name,true);
    analyseFromStartingPointRef.current = true;
  },[showAnalysis]);
  useEffect(() => {
    const openPendingTopic = () => {
      const nativeWindow = window as Window & { __TULIP_PENDING_TOPIC__?:string };
      const topic = nativeWindow.__TULIP_PENDING_TOPIC__;
      const node = desktopNodes.find((item) => item.id === topic) || desktopNodeByName.get(topic || "");
      if (!node) return;
      nativeWindow.__TULIP_PENDING_TOPIC__ = "";
      showAnalysis(node.name,true);
    };
    openPendingTopic();
    window.addEventListener("tulip-android-open-topic",openPendingTopic);
    return () => window.removeEventListener("tulip-android-open-topic",openPendingTopic);
  },[showAnalysis]);
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
    if (!previous) {
      if (analyseFromStartingPointRef.current) {
        analyseFromStartingPointRef.current = false;
        setAnalyseHasSelection(false);
        setInspectorNavCompact(false);
        try { window.sessionStorage.removeItem(ANALYSE_HISTORY_STORAGE_KEY); } catch { /* Navigation remains usable. */ }
      }
      return;
    }
    const nextHistory = analyseHistoryRef.current.slice(0,-1);
    analyseHistoryRef.current = nextHistory;
    analyseNodeNameRef.current = previous.name;
    analyseExpandedRef.current = previous.expanded;
    setAnalyseExpandedOnOpen(previous.expanded);
    setAnalyseEntryOrigin(null);
    playAnalyseTransition("back");
    setNodeName(previous.name);
    writeAnalyseNavigationCache(previous,nextHistory);
    window.dispatchEvent(new CustomEvent("tulip:analyse-back"));
  },[playAnalyseTransition]);
  useEffect(() => {
    if (!(window as Window & { __TULIP_ANDROID_APP__?:boolean }).__TULIP_ANDROID_APP__) return;
    const handleBack = () => {
      if (document.querySelector(".explore-menu-screen")) {
        document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape"}));
      } else if (infoSection) {
        setInfoSection(null);
      } else if (filtersOpen) {
        setFiltersOpen(false);
      } else if (onboardingActive || quickStartStep !== null) {
        return;
      } else if (screen === "analyse" && analyseHistoryRef.current.length) {
        goBackInAnalysis();
      } else if (screen !== "explore") {
        navigate("explore");
      } else {
        (window as Window & { TULIPNative?:TulipNativeBridge }).TULIPNative?.exit?.();
      }
    };
    window.addEventListener("tulip-android-back",handleBack);
    return () => window.removeEventListener("tulip-android-back",handleBack);
  },[screen,infoSection,filtersOpen,onboardingActive,quickStartStep,goBackInAnalysis]);
  const rememberAnalyseExpanded = useCallback((name:string,expanded:boolean) => {
    if (name !== analyseNodeNameRef.current) return;
    analyseExpandedRef.current = expanded;
    writeAnalyseNavigationCache({ name,expanded },analyseHistoryRef.current);
  },[]);
  const openAnalysisFromExplore = useCallback((name:string,origin?:AppPoint) => {
    const nativeBridge = (window as Window & { TULIPNative?:TulipNativeBridge }).TULIPNative;
    if (nativeBridge?.openInspector && quickStartStep === null) {
      nativeBridge.openInspector(name);
      return;
    }
    showAnalysis(name,true,quickStartStep === null ? origin : undefined);
  },[showAnalysis,quickStartStep]);
  // Reserve native chrome while a returning installation is about to resume
  // Quick Start, including the brief interval after the native splash fades.
  const onboardingOwnsNavigation = onboardingActive || (quickStartStep === null && quickStartAutoPendingRef.current);
  const bottomNavVisible = !onboardingOwnsNavigation && !keyboard.visible && !infoSection;
  const bottomNavCompact = quickStartStep === null && ((screen === "analyse" && inspectorNavCompact)
    || (screen === "activity" && activityNavCompact)
    || (screen === "footprint" && footprintNavCompact));
  useEffect(() => {
    (window as Window & { TULIPNative?:TulipNativeBridge }).TULIPNative?.navigationState?.({
      active:screen,
      visible:bottomNavVisible,
      compact:bottomNavCompact,
      quickStartActive:quickStartStep !== null,
      onboardingActive:onboardingOwnsNavigation,
    });
  },[bottomNavCompact,bottomNavVisible,quickStartStep,screen,onboardingOwnsNavigation]);
  return <div data-onboarding-active={onboardingActive} data-introduction-phase={onboardingActive ? introductionPhase : undefined} data-introduction-page={introductionPage ?? undefined} data-reveal-reduced-motion={revealReducedMotion} data-quick-start-step={quickStartStep === null ? undefined : QUICK_START_STEPS[quickStartStep].id} className={`tulip-app${quickStartStep !== null ? " is-quick-start" : ""}${bottomNavVisible ? " has-bottom-nav" : ""}`}>
    {startupWarmupVisible ? <div className="startup-warmup" role="status" aria-label="Preparing Tulip Earth"><img src="/assets/app-icon/tulip-earth-loading.png?v=20260920-glow" alt="" aria-hidden="true" width={320} height={320} /></div> : null}
    <div className="app-surfaces" inert={onboardingActive} aria-hidden={onboardingActive || undefined}>
    <ExploreScreen active={screen === "explore"} suspended={screen !== "explore" || filtersOpen || Boolean(infoSection) || !nativeRenderingActive || (onboardingActive && introductionPage !== 3)} activeFilter={activeFilter} resetKey={exploreResetKey} onOpenInfo={setInfoSection} onStartQuickStart={startQuickStart} onAnalyse={openAnalysisFromExplore} />
    {screen === "search" ? <SearchScreen onClose={() => navigate("explore")} onResult={(name) => showAnalysis(name)} /> : null}
    {analyseHasSelection ? <AnalyseScreen key={nodeName} active={screen === "analyse"} name={nodeName} initiallyExpanded={analyseExpandedOnOpen} entryOrigin={analyseEntryOrigin} transition={analyseTransition} onSelectNode={openAnalysisNode} onBack={goBackInAnalysis} onExpandedChange={rememberAnalyseExpanded} onNavCompactChange={setInspectorNavCompact} /> : screen === "analyse" ? <AnalyseStartingPoints used={usedAnalyseStartingPoints} onSelect={openAnalyseStartingPoint} /> : null}
    <ActivityScreen active={screen === "activity"} resetRequest={activityResetKey} onNavCompactChange={setActivityNavCompact} />
    <FootprintScreen active={screen === "footprint"} resetRequest={footprintResetKey} onNavCompactChange={setFootprintNavCompact} />
    {bottomNavVisible ? <BottomNav active={screen} compact={bottomNavCompact} onChange={(next) => {
      if (quickStartStep !== null && (QUICK_START_STEPS[quickStartStep].id !== "return-explore" || next !== "explore")) return;
      navigate(next);
      if (next === "explore") window.dispatchEvent(new CustomEvent("tulip:explore-navigation"));
    }} onExploreLongPress={() => { if (quickStartStep === null) setFiltersOpen(true); }} /> : null}
    {infoSection ? <ExploreInfoPanel section={infoSection} onClose={() => setInfoSection(null)} /> : null}
    <BottomSheet open={filtersOpen} onOpenChange={setFiltersOpen} title="Pick a System" snap={0.62}><div className="explore-filter-list">{exploreFilters.map(([value,label]) => <button key={value} className={activeFilter === value ? "active" : ""} onClick={() => { setActiveFilter(value); setFiltersOpen(false); }} aria-pressed={activeFilter === value}><span className="filter-swatch" data-filter={value} /><span>{label}</span>{activeFilter === value ? <CheckCircledIcon /> : null}</button>)}</div></BottomSheet>
    </div>
    {introductionPage !== null ? <Introduction page={introductionPage} phase={introductionPhase} covered={startupCovered} onPage={changeIntroductionPage} onContinue={continueIntroduction} onReady={beginIntroductionReveal} onFailure={failIntroduction} /> : null}
    {quickStartStep !== null ? <QuickStartTour stepIndex={quickStartStep} onAdvance={advanceQuickStart} /> : null}
    {quickStartCompleteVisible ? <div className="quick-start-complete" role="status" aria-live="polite">
      <div className="quick-start-celebration" aria-hidden="true">
        <img src="/assets/app-icon/tulip-earth-loading.png?v=20260920-glow" alt="" />
        {Array.from({length:12},(_,index) => <i key={index} style={{"--spark-angle":`${index * 30}deg`,"--spark-distance":`${66 + (index % 3) * 14}px`,"--spark-delay":`${(index % 4) * 40}ms`} as CSSProperties} />)}
      </div>
      <strong>You’re ready.</strong><p>Explore Tulip Earth at your own pace.</p>
    </div> : null}
  </div>;
}

type Assessment = {
  valueKind?: string | null;
  valueLabel?: string | null;
  accessibilityLabel?: string;
  nodeId:string; nodeKind:string; version:string; status:string;
  value:number | null; label:string; explanation:string;
  horizon:{start:number;end:number}; scenario:string;
};
