// THROWAWAY comparison: accepted clock/water plus the optional scene painter.
// Read-only Payload project previews + local showreel. No production integration.
import opening from '../ascii-opening/approved-opening.json';
import { createField } from '../ascii-surge/field.js';
import { createMotion, defaults, variants } from '../ascii-surge/motion.js';
import { createScene, entrances, sceneDefaults } from './scene.js';
import { backgrounds } from './backgrounds.js';
const $ = id => document.getElementById(id);
const query = new URLSearchParams(location.search);
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const motion = createMotion(opening.speed, reduce.matches);
const scene = createScene();
let entrance = entrances.includes(query.get('entrance')) ? query.get('entrance') : 'recede';
let contact = variants.includes(query.get('variant')) ? query.get('variant') : 'erosion';
let background = Object.hasOwn(backgrounds, query.get('background')) ? query.get('background') : 'ink';
let paused = query.get('paused') === '1', initialized = false, assetsLoaded = false;
let raf = 0, last = null, kit, previousStatus = '', sceneTime = -1, rate = 1, scrubValue = 0;
const settings = { ...sceneDefaults, logoInStack: query.get('logoStack') === '1' };
let runSettings = { ...settings };
const field = createField(Object.freeze({ ...opening }), $('water').getContext('2d'),
  $('logo').getContext('2d'), $('reveal').getContext('2d'),
  (ctx, W, H) => scene.paint(ctx, W, H, sceneTime, entrance, runSettings, backgrounds[background].color));
function end() { return scene.duration(runSettings, innerWidth, innerHeight); }
let previousDuration = end();
function done() { return motion.snapshot().reduced || (motion.snapshot().state === 'settled' && sceneTime >= end() && !scene.animating()); }
function snapshot() {
  const s = motion.snapshot();
  return { ...s, entrance, background, variant: contact, paused, assetsLoaded, sceneTime, duration: end(),
    phase: sceneTime < 0 ? s.state : scene.model(sceneTime, innerWidth, innerHeight, entrance, runSettings).phase,
    settings: { ...runSettings }, media: scene.details() };
}
function selectBackground(value) {
  if (!Object.hasOwn(backgrounds, value)) return;
  background = value;
  const url = new URL(location.href); url.searchParams.set('background', value); history.replaceState(null, '', url);
  kit?.setValue('appearance.background', value); draw();
}
function draw() {
  if (!initialized) return;
  previousDuration = end();
  const s = motion.snapshot();
  if (s.reduced) sceneTime = end();
  document.body.dataset.sceneVisible = String(sceneTime >= 0);
  scene.sync(sceneTime, entrance, runSettings, !paused && !document.hidden && !s.reduced, rate);
  field.render(s.clock, s.segment ? { ...s.segment, variant: contact } : null, s.state === 'settled');
  const phase = snapshot().phase;
  const info = !assetsLoaded ? 'Loading projects from cms.wawefilms.com + local showreel; opening remains live.'
    : scene.details()?.surface?.warning ? scene.details().surface.warning
    : scene.details()?.autoplayBlocked ? 'Video playback blocked. Use Replay new segment to retry; decoded stills remain visible.'
    : s.reduced ? 'Reduced motion · static final composition.'
    : s.state === 'loading' ? 'Assets Ready starts the full arc. Preview new segment skips the hold/wash.'
    : `${phase.toUpperCase()} · ${s.count} surge · ${entrance.toUpperCase()}${paused ? ' · PAUSED' : ''}\nSwitch entrance at the same instant, or replay the new segment. Tuning applies on replay.`;
  if (info !== previousStatus) {
    previousStatus = info; document.body.dataset.state = phase;
    $('scene').textContent = phase === 'settled' ? `WAWE FILMS. Showreel and project previews: ${scene.details()?.projects.slice(0, scene.model(sceneTime, innerWidth, innerHeight, entrance, runSettings).layout.count).map(p => p.title).join(', ')}. Composition study.` : `WAWE FILMS — ${phase}`;
    kit?.setValue('review.state', info);
  }
}
function advance(dt) {
  const before = motion.snapshot();
  motion.tick(dt, defaults);
  const after = motion.snapshot();
  if (after.reduced) sceneTime = end();
  else if (after.segment) {
    sceneTime = before.state === 'settled' ? Math.min(end(), sceneTime + dt) : Math.min(end(), after.age - after.segment.washSeconds);
  }
  draw();
}
function frame(now) {
  const dt = last === null ? 0 : Math.max(0, (now - last) / 1000); last = now;
  advance(dt * rate);
  if (!done()) raf = requestAnimationFrame(frame);
}
function playback() {
  cancelAnimationFrame(raf); last = null; draw();
  if (initialized && !paused && !document.hidden && !done()) raf = requestAnimationFrame(frame);
}
function setPaused(value = true) { paused = value; kit?.setValue('review.paused', value); playback(); }
function ready() {
  if (!assetsLoaded || motion.snapshot().ready) return;
  runSettings = { ...settings }; motion.signalReady(); playback();
}
function syncScrub(value) { scrubValue = value; kit?.setValue('review.scrub', value); }
function replay() {
  scene.reset();
  runSettings = { ...settings }; sceneTime = -1;
  motion.reset(reduce.matches); syncScrub(0); previousStatus = ''; setPaused(false);
}
function position(time) {
  motion.reset(reduce.matches);
  if (reduce.matches) { sceneTime = end(); return; }
  motion.signalReady();
  motion.tick(motion.snapshot().start / opening.speed + defaults.washSeconds + time, defaults);
  sceneTime = time;
}
function preview() {
  if (!assetsLoaded) return;
  scene.reset();
  runSettings = { ...settings }; position(0); syncScrub(0); previousStatus = ''; setPaused(false);
}
function seek(seconds) {
  if (!assetsLoaded) return;
  position(Math.max(0, Math.min(end(), seconds)));
  scene.seek(sceneTime, entrance, runSettings);
  syncScrub(sceneTime / end() * 100); setPaused(true);
}
function selectEntrance(value) {
  if (!entrances.includes(value)) return;
  entrance = value;
  const url = new URL(location.href); url.searchParams.set('entrance', value); history.replaceState(null, '', url);
  kit?.setValue('review.entrance', value); draw();
}
function selectVariant(value) {
  if (!variants.includes(value)) return;
  contact = value;
  const url = new URL(location.href); url.searchParams.set('variant', value); history.replaceState(null, '', url);
  kit?.setValue('review.logoContact', value); draw();
}
window.addEventListener('resize', () => {
  if (!initialized) return;
  if (sceneTime >= previousDuration) sceneTime = end();
  previousStatus = ''; field.resize(); playback();
});
document.addEventListener('visibilitychange', playback);
reduce.addEventListener('change', () => {
  if (reduce.matches) { motion.skip(); sceneTime = end(); playback(); }
});
async function loadReviewUI() {
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '../vendor/dialkit/styles.css'; document.head.append(css);
  await new Promise((resolve, reject) => {
    const script = document.createElement('script'); script.src = '../vendor/dialkit/browser.global.js';
    script.onload = resolve; script.onerror = () => reject(new Error('DialKit failed to load')); document.head.append(script);
  });
  DialKit.createDialRoot({ position: 'top-right' });
  kit = DialKit.createDialKit('Morphing stack → showreel', {
    review: { state: previousStatus,
      entrance: { type: 'select', default: entrance, options: [
        { value: 'recede', label: 'A · Hero revealed by recede' },
        { value: 'card', label: 'B · Hero grows from card' },
        { value: 'unfurl', label: 'C · Hero emerges during unfurl' }] },
      assetsReady: { type: 'action', label: 'Assets Ready · full arc' },
      preview: { type: 'action', label: 'Replay new segment' },
      replay: { type: 'action', label: 'Reset to opening' },
      paused, scrub: [0, 0, 100, .1], speed: [1, .2, 1, .1],
      settled: { type: 'action', label: 'View final composition' },
      logoContact: { type: 'select', default: contact, options: [
        { value: 'erosion', label: 'Local erosion' }, { value: 'carry', label: 'Carried-away glyphs' }, { value: 'fade', label: 'Soft contact fade' }] }
    },
    appearance: { _collapsed: false, background: { type: 'select', default: background,
      options: Object.entries(backgrounds).map(([value, preset]) => ({ value, label: preset.label })) } },
    layout: { _collapsed: false, bottomPadding: [innerWidth < 700 ? 18 : Math.max(28, innerWidth * .052), 0, 180, 1] },
    spreading: { _collapsed: false, spreadSpeed: [1.8 / settings.unfurl, .5, 6, .1] },
    stacking: { _collapsed: true, logoInStack: settings.logoInStack, stackSpeed: [settings.stackSpeed, .5, 3, .05],
      arrival: [settings.arrival, .2, .55, .01], morph: [settings.morph, .3, .8, .01],
      viscosity: [settings.viscosity, 0, 1.5, .05], wobble: [settings.wobble, 0, 16, .01] }
  }, { id: 'ascii-stacking-study', persist: false, defaultCollapsed: false, onAction(name) {
    if (name === 'review.assetsReady') ready();
    if (name === 'review.preview') preview();
    if (name === 'review.replay') replay();
    if (name === 'review.settled') seek(end());
  } });
  const input = document.querySelector('.dialkit-text-input');
  input.readOnly = true; input.setAttribute('aria-live', 'polite');
  kit.subscribe(values => {
    if (values.stacking.logoInStack !== settings.logoInStack) {
      const url = new URL(location.href);
      url.searchParams.set('logoStack', values.stacking.logoInStack ? '1' : '0'); history.replaceState(null, '', url);
    }
    Object.assign(settings, values.stacking);
    settings.unfurl = 1.8 / values.spreading.spreadSpeed;
    settings.bottomPadding = values.layout.bottomPadding;
    if (runSettings.bottomPadding !== settings.bottomPadding) {
      runSettings.bottomPadding = settings.bottomPadding; draw();
    }
    rate = values.review.speed;
    if (values.appearance.background !== background) selectBackground(values.appearance.background);
    if (values.review.entrance !== entrance) selectEntrance(values.review.entrance);
    if (values.review.logoContact !== contact) selectVariant(values.review.logoContact);
    if (values.review.paused !== paused) setPaused(values.review.paused);
    if (values.review.scrub !== scrubValue) seek(values.review.scrub / 100 * end());
  }, false);
  $('status').hidden = true; document.body.dataset.controlsReady = 'true';
}
try {
  await field.load(); initialized = true; document.body.dataset.ready = 'true'; playback();
  window.stackingStudy = { snapshot, ready, replay, preview, seek, pause: setPaused, selectEntrance, selectVariant, selectBackground,
    step(seconds = 1 / 60) { if (!paused) throw new Error('Pause before stepping'); advance(seconds); },
    surface: points => scene.sampleSurface(points), loseFluidContext: () => scene.loseContext(),
    model: () => scene.model(sceneTime, innerWidth, innerHeight, entrance, runSettings) };
  // Opening paints before any new scene assets or review tooling are requested.
  requestAnimationFrame(() => setTimeout(async () => {
    try {
      await Promise.all([scene.load(draw), loadReviewUI(), document.fonts.load('600 24px "Pilcrow Rounded"')]);
      assetsLoaded = true; playback();
    } catch (error) { $('status').hidden = false; $('status').textContent = error.message; console.error(error); }
  }, 0));
} catch (error) { $('status').textContent = `Study failed to load: ${error.message}`; console.error(error); }
