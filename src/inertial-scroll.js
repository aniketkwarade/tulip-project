// Mouse wheels arrive as isolated steps. Trackpads and touch surfaces already
// provide their own momentum, so leave those native gestures alone.
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function scrollTarget(start, axis, delta) {
  for (let element = start; element instanceof Element; element = element.parentElement) {
    const style = getComputedStyle(element);
    const overflow = axis === 'y' ? style.overflowY : style.overflowX;
    const max = axis === 'y' ? element.scrollHeight - element.clientHeight : element.scrollWidth - element.clientWidth;
    const position = axis === 'y' ? element.scrollTop : element.scrollLeft;
    if (!/^(auto|scroll)$/.test(overflow) || max < 2) continue;
    if (delta < 0 && position > 0.5 || delta > 0 && position < max - 0.5) return element;
  }
  return null;
}

export function initializeInertialScrolling(root = document) {
  let active = null;
  let frame = 0;
  let lastTime = 0;
  const stop = () => { if (frame) cancelAnimationFrame(frame); frame = 0; active = null; };
  const animate = now => {
    if (!active || !active.element.isConnected) { stop(); return; }
    const elapsed = clamp(now - (lastTime || now), 1, 50);
    lastTime = now;
    const { element, axis, target } = active;
    const key = axis === 'y' ? 'scrollTop' : 'scrollLeft';
    const next = element[key] + (target - element[key]) * (1 - Math.exp(-elapsed / 90));
    element[key] = Math.abs(target - next) < 0.6 ? target : next;
    if (Math.abs(target - element[key]) < 0.6) { stop(); return; }
    frame = requestAnimationFrame(animate);
  };
  root.addEventListener('wheel', event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || reducedMotion()) return;
    if (!(event.target instanceof Element) || event.target.closest('#graph-canvas,[data-native-wheel],input,textarea,select,[contenteditable="true"]')) return;
    const axis = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? 'x' : 'y';
    const raw = axis === 'y' ? event.deltaY : event.deltaX;
    // Pixel-sized trackpad deltas already include the OS's deceleration tail.
    if (event.deltaMode === 0 && Math.abs(raw) < 60) { stop(); return; }
    const delta = event.deltaMode === 1 ? raw * 35 : event.deltaMode === 2 ? raw * innerHeight : raw;
    const element = scrollTarget(event.target, axis, delta);
    if (!element) return;
    event.preventDefault();
    if (!active || active.element !== element || active.axis !== axis) {
      stop();
      active = { element, axis, target: axis === 'y' ? element.scrollTop : element.scrollLeft };
    }
    const max = axis === 'y' ? element.scrollHeight - element.clientHeight : element.scrollWidth - element.clientWidth;
    active.target = clamp(active.target + delta, 0, max);
    if (!frame) { lastTime = 0; frame = requestAnimationFrame(animate); }
  }, { passive: false });
  for (const event of ['pointerdown', 'touchstart', 'keydown']) root.addEventListener(event, stop, { passive: true });
  return stop;
}
