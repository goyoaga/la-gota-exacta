import './style.css';
import { CAPACITY, FLOW_ML_PER_SECOND, chooseRound, resultFor } from './game.js';
import { createScene } from './scene.js';

const $ = (id) => document.getElementById(id);
const refs = {
  canvas: $('scene'), sceneWrap: $('scene-wrap'), confetti: $('confetti-layer'), fallback: $('scene-fallback'),
  target: $('target'), instructionTarget: $('instruction-target'), vesselName: $('vessel-name'), caption: $('scene-caption'),
  pour: $('pour'), pourLabel: $('pour-label'), ready: $('ready-view'),
  result: $('result-view'), resultKicker: $('result-kicker'),
  resultTitle: $('result-title'), actual: $('actual'), resultTarget: $('result-target'),
  difference: $('difference'), direction: $('direction'), best: $('best'),
  again: $('again'), bookmark: $('bookmark'), dialog: $('bookmark-dialog'),
  instruction: $('bookmark-instruction'),
};
const format = (value) => new Intl.NumberFormat('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
const STORAGE_KEY = 'la-gota-exacta-best-v1';
let best = null;
try {
  const saved = Number(localStorage.getItem(STORAGE_KEY));
  if (localStorage.getItem(STORAGE_KEY) !== null && Number.isFinite(saved) && saved >= 0) best = saved;
} catch { /* Private mode can block storage; the current session still works. */ }

let visual;
try {
  visual = createScene(refs.canvas, refs.sceneWrap);
} catch (error) {
  console.error('No se pudo crear la escena 3D', error);
  refs.canvas.hidden = true;
  refs.fallback.hidden = false;
  refs.pour.disabled = true;
}

let round = null;
let state = 'ready';
let volume = 0;
let startedAt = 0;
let frame = 0;
let activePointer = null;
let keyboardActive = false;

function celebrateExact() {
  refs.sceneWrap.classList.add('celebrate');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#edb85c', '#e36b57', '#4ebeb4', '#f5e7b5', '#2d8e91'];
  const pieces = document.createDocumentFragment();
  for (let i = 0; i < 44; i += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = `${21 + Math.random() * 58}%`;
    piece.style.top = `${10 + Math.random() * 18}%`;
    piece.style.width = `${5 + Math.random() * 4}px`;
    piece.style.height = `${7 + Math.random() * 6}px`;
    piece.style.backgroundColor = colors[i % colors.length];
    piece.style.setProperty('--drift', `${Math.round((Math.random() - .5) * 290)}px`);
    piece.style.setProperty('--fall', `${Math.round(220 + Math.random() * 180)}px`);
    piece.style.setProperty('--spin', `${Math.round((Math.random() - .5) * 1150)}deg`);
    piece.style.animationDelay = `${(Math.random() * .3).toFixed(2)}s`;
    piece.addEventListener('animationend', () => piece.remove(), { once: true });
    pieces.append(piece);
  }
  refs.confetti.replaceChildren(pieces);
}

function newRound() {
  cancelAnimationFrame(frame);
  round = chooseRound(round);
  state = 'ready';
  volume = 0;
  activePointer = null;
  keyboardActive = false;
  refs.target.textContent = round.target;
  refs.instructionTarget.textContent = `${round.target} ml`;
  refs.vesselName.textContent = round.vessel.name;
  refs.caption.textContent = 'EL NIVEL DEL VASO ES TU PISTA';
  refs.ready.hidden = false;
  refs.result.hidden = true;
  refs.sceneWrap.classList.remove('celebrate');
  refs.confetti.replaceChildren();
  refs.pour.disabled = !visual;
  refs.pourLabel.textContent = 'MANTÉN PULSADO AQUÍ';
  visual?.setPouring(false);
  visual?.setVessel(round.vessel);
}

function tick(now) {
  if (state !== 'pouring') return;
  volume = Math.min(CAPACITY, Math.max(0, (now - startedAt) / 1000 * FLOW_ML_PER_SECOND));
  visual.setVolume(volume);
  if (volume >= CAPACITY) {
    finish();
    return;
  }
  frame = requestAnimationFrame(tick);
}

function begin() {
  if (state !== 'ready' || !visual) return;
  state = 'pouring';
  startedAt = performance.now();
  refs.pour.classList.add('is-pouring');
  refs.pourLabel.textContent = 'SUELTA PARA DETENER';
  refs.caption.textContent = 'SUELTA CUANDO CREAS QUE LLEGASTE';
  visual.setPouring(true);
  frame = requestAnimationFrame(tick);
}

function finish() {
  if (state !== 'pouring') return;
  // A final clock read avoids losing the interval between the last frame and release.
  volume = Math.min(CAPACITY, Math.max(0, (performance.now() - startedAt) / 1000 * FLOW_ML_PER_SECOND));
  state = 'result';
  cancelAnimationFrame(frame);
  visual.setVolume(volume);
  visual.setPouring(false);
  refs.pour.classList.remove('is-pouring');
  refs.caption.textContent = 'UN INTENTO. ¿QUÉ TAL FUE?';
  const outcome = resultFor(volume, round.target);
  if (best === null || outcome.difference < best) {
    best = outcome.difference;
    try { localStorage.setItem(STORAGE_KEY, String(best)); } catch { /* Session-only record. */ }
  }
  refs.resultKicker.textContent = outcome.grade === 'exact' ? '¡QUÉ PRECISIÓN!' : 'EL VEREDICTO';
  refs.resultTitle.textContent = outcome.grade === 'exact' ? '¡Gota exacta!' : outcome.grade === 'close' ? 'Casi perfecto.' : outcome.direction === 'short' ? 'Faltó un poco.' : 'Te pasaste.';
  refs.actual.textContent = `${format(volume)} ml`;
  refs.resultTarget.textContent = `${round.target} ml`;
  refs.difference.textContent = `${format(outcome.difference)} ml`;
  refs.direction.textContent = outcome.direction === 'equal' ? 'EXACTO: 0,0 ML DE DIFERENCIA' : outcome.direction === 'short' ? 'POR DEBAJO DEL OBJETIVO' : 'POR ENCIMA DEL OBJETIVO';
  refs.best.textContent = `MEJOR MARCA PERSONAL · ${format(best)} ML`;
  refs.ready.hidden = true;
  refs.result.hidden = false;
  if (outcome.grade === 'exact') celebrateExact();
  refs.again.focus({ preventScroll: true });
}

refs.pour.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 && event.pointerType === 'mouse') return;
  event.preventDefault();
  activePointer = event.pointerId;
  refs.pour.setPointerCapture(event.pointerId);
  begin();
});
refs.pour.addEventListener('pointerup', (event) => {
  if (event.pointerId !== activePointer) return;
  activePointer = null;
  finish();
});
refs.pour.addEventListener('pointercancel', () => { activePointer = null; finish(); });
refs.pour.addEventListener('lostpointercapture', () => { activePointer = null; finish(); });
refs.pour.addEventListener('keydown', (event) => {
  if (event.code !== 'Space' || event.repeat) return;
  event.preventDefault();
  keyboardActive = true;
  begin();
});
window.addEventListener('keyup', (event) => {
  if (event.code !== 'Space' || !keyboardActive) return;
  event.preventDefault();
  keyboardActive = false;
  finish();
});
refs.pour.addEventListener('blur', () => { keyboardActive = false; finish(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); });
window.addEventListener('blur', finish);
refs.again.addEventListener('click', newRound);

refs.bookmark.addEventListener('click', () => {
  const agent = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/i.test(agent);
  const mobile = /Android|iPhone|iPad|iPod/i.test(agent);
  const mac = /Macintosh|Mac OS X/i.test(agent);
  refs.instruction.textContent = ios
    ? 'En Safari, pulsa Compartir y luego «Añadir marcador» (o «Añadir a favoritos»). Si estás dentro de Instagram, abre primero el juego en Safari.'
    : mobile
      ? 'Abre el menú ⋮ de tu navegador y elige «Añadir a favoritos» o «Marcador». Si estás dentro de Instagram, ábrelo primero en tu navegador.'
      : `Pulsa ${mac ? '⌘' : 'Ctrl'} + D en tu navegador y confirma el marcador.`;
  if (typeof refs.dialog.showModal === 'function') refs.dialog.showModal();
  else window.alert(refs.instruction.textContent);
});

newRound();
