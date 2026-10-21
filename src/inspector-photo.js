import { safeHttpsUrl } from './security.js';

let activeViewer = null;
const renderedPhotos = new WeakMap();

export function dismissInspectorPhotoViewer() {
  activeViewer?.close();
}

function photoCredit(photo) {
  const credit = document.createElement('p');
  credit.className = 'inspector-photo-credit';
  const links = [[`Photo: ${photo.credit}`, photo.creditUrl || photo.sourceUrl], [photo.license, photo.licenseUrl]];
  if (photo.creditUrl) links.push(['Source', photo.sourceUrl]);
  for (const [label, url] of links) {
    if (credit.childNodes.length) credit.append(' · ');
    const link = document.createElement('a');
    link.textContent = label;
    const safeUrl = safeHttpsUrl(url);
    if (safeUrl) { link.href = safeUrl; link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    credit.append(link);
  }
  credit.append(' · Cropped');
  return credit;
}

function openPhotoViewer(photo, nodeName, trigger) {
  dismissInspectorPhotoViewer();
  const dialog = document.createElement('dialog');
  dialog.className = 'inspector-photo-viewer';
  dialog.setAttribute('aria-labelledby', 'inspector-photo-viewer-title');
  const header = document.createElement('header');
  header.className = 'inspector-photo-viewer-header';
  const title = document.createElement('h2');
  title.id = 'inspector-photo-viewer-title';
  title.textContent = `Photo of ${nodeName}`;
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'inspector-photo-viewer-close';
  close.setAttribute('aria-label', 'Close photograph');
  close.textContent = '×';
  close.addEventListener('click', () => dialog.close());
  header.append(title, close);
  const stage = document.createElement('div');
  stage.className = 'inspector-photo-viewer-stage';
  const img = document.createElement('img');
  img.src = photo.asset;
  img.width = photo.width;
  img.height = photo.height;
  img.alt = photo.alt;
  img.draggable = false;
  img.addEventListener('error', () => dialog.close(), {once: true});
  stage.append(img);
  const details = document.createElement('div');
  details.className = 'inspector-photo-viewer-details';
  const caption = document.createElement('p');
  caption.textContent = photo.caption;
  details.append(caption, photoCredit(photo));
  const hint = document.createElement('p');
  hint.className = 'inspector-photo-viewer-hint';
  hint.textContent = 'Swipe up on the photo to close';
  dialog.append(header, stage, hint, details);
  let swipe = null;
  stage.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    swipe = {id: event.pointerId, x: event.clientX, y: event.clientY};
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointerup', event => {
    const start = swipe;
    swipe = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (dy < -64 && -dy > Math.abs(dx) * 1.2) dialog.close();
  });
  stage.addEventListener('pointercancel', () => { swipe = null; });
  dialog.addEventListener('close', () => {
    dialog.remove();
    if (activeViewer === dialog) activeViewer = null;
    if (trigger.isConnected && !trigger.closest('[hidden]')) trigger.focus({preventScroll: true});
  }, {once: true});
  document.body.append(dialog);
  activeViewer = dialog;
  dialog.showModal();
  close.focus();
}

export function renderInspectorPhoto(host, photo, nodeName = 'this topic') {
  if (!host) return;
  const previous = renderedPhotos.get(host);
  if (previous?.photo === photo && previous?.nodeName === nodeName) return;
  dismissInspectorPhotoViewer();
  host.replaceChildren();
  renderedPhotos.set(host, {photo, nodeName});
  if (!photo || !/^\/node-photos\/[a-z0-9-]+\.jpg$/.test(photo.asset)) {
    delete host.dataset.asset;
    host.hidden = true;
    return;
  }
  host.dataset.asset = photo.asset;
  host.hidden = false;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'inspector-photo-trigger';
  button.setAttribute('aria-label', `View photograph of ${nodeName}`);
  button.setAttribute('aria-haspopup', 'dialog');
  const img = document.createElement('img');
  img.width = photo.width;
  img.height = photo.height;
  img.alt = photo.alt;
  img.decoding = 'async';
  img.draggable = false;
  img.addEventListener('error', () => {
    if (host.contains(img)) { host.hidden = true; host.replaceChildren(); dismissInspectorPhotoViewer(); }
  }, {once: true});
  button.addEventListener('click', () => openPhotoViewer(photo, nodeName, button));
  button.append(img);
  host.append(button);
  img.src = photo.asset;
}
