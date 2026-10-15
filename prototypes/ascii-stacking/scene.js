// THROWAWAY: centred native-ratio growth → one viscous surface → bottom row.
import { clamp, mix, smooth } from '../ascii-surge/motion.js';
import { loadMedia } from './media.js';
import { createFluidSurface } from './fluid.js';
export const entrances = ['recede', 'card', 'unfurl'];
export const sceneDefaults = Object.freeze({ arrival: .32, morph: .58, stackSpeed: 1.8, unfurl: .75, viscosity: .9, wobble: 2, logoInStack: false, bottomPadding: null });
const defaultRatios = Array(6).fill(16 / 9);
export const orderFor = count => Array.from({ length: count }, (_, i) => count - 1 - i);
// Let the unchanged receding edge expose the bottom-row centre before growing
// the badge; otherwise the entire circle birth happens invisibly under water.
const LOGO_START = .42, LOGO_LEAD = .9;
function bezier(value, x1, y1, x2, y2) {
  const x = clamp(value); if (x === 0 || x === 1) return x;
  let lo = 0, hi = 1, t = x;
  for (let i = 0; i < 14; i++) {
    const u = 1 - t, bx = 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t;
    if (bx < x) lo = t; else hi = t;
    t = (lo + hi) / 2;
  }
  return 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t * t * y2 + t ** 3;
}
export const ease = value => bezier(value, .77, 0, .175, 1);
const travelEase = value => bezier(value, .32, .72, 0, 1);
const blendRect = (a, b, t) => ({
  ...Object.fromEntries(['x', 'y', 'w', 'h', 'r'].map(k => [k, mix(a[k], b[k], t)])),
  ...(b.topR === undefined ? {} : { topR: mix(a.topR ?? a.r, b.topR, t) })
});
export function timing(settings = sceneDefaults, count = 6) {
  const speed = settings.stackSpeed ?? sceneDefaults.stackSpeed;
  const arrival = settings.arrival / speed, morph = settings.morph / speed;
  const spread = LOGO_LEAD + (count - 1) * arrival + morph + .18 / speed;
  return { logoEnd: LOGO_LEAD, arrival, morph, spread, end: spread + settings.unfurl + .3 };
}
export function layout(W, H, settings = sceneDefaults) {
  const mobile = W < 700, margin = mobile ? 18 : Math.max(28, W * .052);
  const bottom = clamp(settings.bottomPadding ?? margin, 0, Math.max(0, H * .3));
  const rowH = mobile ? Math.min(84, H * .14) : Math.min(168, H * .18);
  const rowY = H - bottom - rowH, logoSize = rowH;
  const logo = { x: margin + (mobile ? 0 : 10), y: rowY, w: logoSize, h: logoSize };
  const textX = logo.x + logo.w + (mobile ? 11 : 40);
  const stripX = mobile ? textX + 72 + 12 : W * .355;
  const stripW = W - margin - stripX, gap = mobile ? 7 : Math.min(22, W * .014);
  const count = mobile ? (stripW >= 170 ? 3 : 2) : 6;
  const wide = mobile ? 2 : 3.35, unit = (stripW - gap * (count - 1)) / (wide + count - 1);
  let x = stripX;
  const cards = Array.from({ length: count }, (_, i) => {
    const w = unit * (i === 0 ? wide : 1), r = { x, y: rowY, w, h: rowH, r: Math.min(mobile ? 13 : 24, w / 2) };
    x += w + gap; return r;
  });
  const hero = { x: margin, y: 0, w: W - 2 * margin, h: 0, r: mobile ? 16 : 22, topR: 0 };
  hero.h = Math.max(60, rowY - 26 - hero.y);
  return { W, H, mobile, margin, hero, logo, cards, rowH, rowY, gap, count,
    identity: { x: textX, y: logo.y + logo.h / 2, w: stripX - textX - 12, font: mobile ? 12 : Math.min(27, W * .018) } };
}
function stackGeometry(l, ratios) {
  const area = l.rowH * l.rowH * (l.mobile ? .9 : 1.05);
  const cx = l.logo.x + l.logo.w / 2, cy = l.rowY + l.rowH / 2;
  return ratios.slice(0, l.count).map(ratio => {
    const w = Math.min(Math.sqrt(area * ratio), 2 * (cx - 2)), h = w / ratio;
    return { x: cx - w / 2, y: cy - h / 2, w, h, r: Math.min(18, h * .13) };
  });
}
// Analytic damped spring: mass 1, stiffness 100, damping 10. Deterministic
// sampling keeps replay/scrubbing independent of frame rate; settle the tail.
export function contactSpring(value) {
  const p = clamp(value), seconds = p * 1.2;
  const response = 1 - Math.exp(-5 * seconds) * (Math.cos(Math.sqrt(75) * seconds) + 5 / Math.sqrt(75) * Math.sin(Math.sqrt(75) * seconds));
  return mix(response, 1, smooth(.8, 1, p));
}
function stackState(time, shapes, pace, order, logo) {
  let envelope = { ...logo, r: logo.w / 2 };
  const arrivals = new Map(), growth = pace.morph * .42;
  for (let birth = 0; birth < order.length; birth++) {
    const id = order[birth], age = time - birth * pace.arrival;
    if (age < 0) break;
    const target = shapes[id], previous = envelope;
    const contactScale = Math.min(previous.w / target.w, previous.h / target.h);
    const contact = { ...target, w: target.w * contactScale, h: target.h * contactScale };
    contact.x = target.x + (target.w - contact.w) / 2;
    contact.y = target.y + (target.h - contact.h) / 2;
    const morph = contactSpring((age - growth) / (pace.morph - growth));
    if (age >= growth) envelope = blendRect(previous, target, morph);
    let rect;
    if (age < growth) {
      const scale = mix(.14, 1, ease(age / growth));
      const w = contact.w * scale, h = contact.h * scale;
      rect = { x: target.x + (target.w - w) / 2, y: target.y + (target.h - h) / 2, w, h, r: Math.min(w, h) * .2 };
    } else rect = blendRect(contact, target, morph);
    arrivals.set(id, { rect, complete: age >= pace.morph, arrival: clamp(age / pace.morph), contact: age >= growth });
  }
  return { envelope, arrivals };
}
export function sceneModel(time, W, H, entrance = 'recede', settings = sceneDefaults, ratios = defaultRatios) {
  const l = layout(W, H, settings), order = orderFor(l.count), pace = timing(settings, l.count);
  const { spread, end, logoEnd } = pace;
  const t = clamp(time, 0, end), stackTime = t - logoEnd, moving = t >= spread;
  const shapes = stackGeometry(l, ratios), origin = shapes[0];
  const stack = stackState(stackTime, shapes, pace, order, l.logo);
  const travel = clamp((t - spread) / settings.unfurl);
  const liquid = 1 - smooth(.85, 1, clamp((t - spread) / (settings.unfurl + .3)));
  // One constant-speed sweep, measured in distance, not eased stop/start legs.
  const centre = r => r.x + r.w / 2;
  const startX = centre(origin), finishX = centre(l.cards.at(-1));
  const sweepX = mix(startX, finishX, travel);
  const depositTimes = l.cards.map(r => spread + (centre(r) - startX) / (finishX - startX) * settings.unfurl);
  const depositStart = depositTimes[0], transportDuration = depositStart - spread;
  const upcoming = l.cards.findIndex(r => centre(r) > sweepX + 1e-8);
  const activeId = upcoming < 0 ? l.count - 1 : upcoming;
  const previous = activeId === 0 ? origin : l.cards[activeId - 1];
  const next = l.cards[activeId];
  const legProgress = clamp((sweepX - centre(previous)) / (centre(next) - centre(previous)));
  const traveller = blendRect(previous, next, ease(legProgress));
  traveller.x = sweepX - traveller.w / 2;
  const depositing = t >= depositStart;
  const legDuration = (settings.unfurl - transportDuration) / Math.max(1, l.count - 1);
  const separation = depositTimes.map((stop, id) => clamp((t - (id === 0 ? spread : depositTimes[id - 1])) / (stop - (id === 0 ? spread : depositTimes[id - 1]))));
  const cards = [];
  for (let birth = 0; birth < order.length; birth++) {
    const id = order[birth], age = stackTime - birth * pace.arrival;
    if (age < 0 || time < 0) continue;
    const state = stack.arrivals.get(id), arrival = state.arrival;
    let rect = state.complete ? { ...stack.envelope } : { ...state.rect };
    const progress = separation[id];
    const deposited = moving && t >= depositTimes[id] - 1e-9;
    if (moving) rect = deposited ? { ...l.cards[id] } : { ...traveller };
    const visible = !moving || deposited || id === activeId;
    const tilt = deposited ? 0 : moving ? .14 * Math.sin(Math.PI * legProgress) : .14 * (1 - arrival);
    cards.push({ id, birth, rect, progress, arrival, deposited, visible, tilt, contact: state.contact, rotation: 0, opacity: 1 });
  }
  const front = cards.find(c => c.id === 0);
  const logoExposure = moving ? clamp(((front?.rect.x ?? origin.x) - origin.x) / (l.logo.w * .8)) * l.logo.w : 0;
  const logoClip = !moving || t >= end ? l.logo.x + l.logo.w : l.logo.x + logoExposure;
  const logoCard = settings.logoInStack && t >= logoEnd ? { id: 6, birth: -1,
    rect: { ...l.logo, r: l.logo.w / 2 }, tilt: 0, rotation: 0, opacity: 1, visible: !moving || logoExposure > .001 } : null;
  const identityClip = moving ? clamp(front.rect.x, l.identity.x, l.identity.x + l.identity.w) : l.identity.x;
  const merge = moving ? l.rowH * .22 * settings.viscosity * liquid : 0;
  const links = [];
  if (moving && liquid > .001 && settings.viscosity > 0) {
    const spatial = [...(logoCard ? [logoCard] : []), ...cards].filter(c => c.visible).sort((a, b) => a.rect.x - b.rect.x);
    for (let i = 0; i < spatial.length - 1; i++) {
      const a = spatial[i].rect, b = spatial[i + 1].rect;
      const h = Math.min(a.h, b.h), gap = b.x - a.x - a.w;
      const nextId = spatial[i + 1].id;
      const releaseStart = nextId === 0 ? spread : depositTimes[nextId - 1];
      const release = (t - releaseStart) / (depositTimes[nextId] - releaseStart);
      const tension = (1 - smooth(.9, 1.6, release)) * liquid;
      const v = clamp(Math.max(0, gap) / Math.max(1, h * 1.2 * settings.viscosity));
      const rEnd = h * .39 * (1 - v) ** 2 * tension - (1 - tension) * 4;
      const rMid = rEnd * (1 - .88 * smooth(0, .75, v)) * tension - (1 - tension) * 3;
      if (rEnd <= -3) continue;
      links.push({ ends: [a.x + a.w / 2, a.y + a.h / 2, b.x + b.w / 2, b.y + b.h / 2],
        shape: [rEnd, rMid, h * .06 * v * tension, Math.min(merge * .65, Math.max(rMid, 0) * 1.5)] });
    }
  }
  return { layout: l, cards, spread, end, time: t, moving, origin, separation,
    depositStart, legDuration, activeId, depositing, traveller, logoCard, logoClip, identityClip,
    depositTimes, sweepX, stackEnvelope: stack.envelope, logoRect: { ...l.logo },
    phase: time < 0 ? 'waiting' : t < logoEnd ? 'logo' : t >= end ? 'settled' : moving ? 'unfurl' : 'stacking',
    logoProgress: time < LOGO_START ? 0 : travelEase((t - LOGO_START) / .36),
    firstArrival: ease(stackTime / pace.morph),
    heroProgress: entrance === 'recede' ? 1 : ease((t - spread - (entrance === 'unfurl' ? .2 : 0)) / (settings.unfurl * .86)),
    fluid: { merge, wobble: settings.wobble * l.rowH / 150 * liquid, blend: 2,
      layered: 1, logoClip, logoEnvelope: moving ? null : stack.envelope, topCover: moving ? 0 : smooth(.85, 1, cards.at(-1)?.arrival ?? 0), links } };
}
function rounded(ctx, r) {
  ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, [r.topR ?? r.r, r.topR ?? r.r, r.r, r.r]);
}
function cover(ctx, image, r) {
  const width = image.videoWidth || image.naturalWidth || image.width, height = image.videoHeight || image.naturalHeight || image.height;
  if (!width || !height || r.w <= 0 || r.h <= 0) return;
  const scale = Math.max(r.w / width, r.h / height), sw = r.w / scale, sh = r.h / scale;
  ctx.drawImage(image, (width - sw) / 2, (height - sh) / 2, sw, sh, r.x, r.y, r.w, r.h);
}
function card(ctx, image, r) {
  if (r.w <= 0 || r.h <= 0) return;
  ctx.save(); rounded(ctx, r); ctx.clip(); cover(ctx, image, r); ctx.restore();
}
export function createScene() {
  let media = null, surface = null, desired = new Set(), usedVideo = new Set(), blocked = new Set(), repaint = () => {};
  let badgeSurface = null, badgeColor = '';
  function logoTexture(background) {
    if (!badgeSurface || badgeColor !== background) {
      badgeColor = background; badgeSurface = document.createElement('canvas');
      badgeSurface.width = badgeSurface.height = 512;
      const ctx = badgeSurface.getContext('2d');
      ctx.fillStyle = background; ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(media.badge, 0, 0, 512, 512);
    }
    return badgeSurface;
  }
  const getRatios = () => media?.projects.map(p => p.ratio) ?? defaultRatios;
  const model = (time, W, H, entrance, settings) => sceneModel(time, W, H, entrance, settings, getRatios());
  const currentTiming = settings => timing(settings, layout(innerWidth, innerHeight).count);
  return {
    async load(onUpdate) { repaint = onUpdate; media = await loadMedia(onUpdate); surface = createFluidSurface(); },
    details() { return media ? { projects: media.projects.map(({ id, title, slug, ratio, videoUrl, posterUrl }) => ({ id, title, slug, ratio, videoUrl, posterUrl })),
      hero: '/showreel-mock.webm', warnings: media.warnings, autoplayBlocked: blocked.size > 0, surface: surface?.info(),
      playback: { heroTime: media.hero.currentTime, heroPaused: media.hero.paused, playingProjects: media.projects.filter(p => !p.video.paused).map(p => p.id) } } : null; },
    model,
    duration(settings, W, H) { return timing(settings, layout(W, H).count).end; },
    sampleSurface(points) { return surface?.sample(points); },
    loseContext() { surface?.loseContext(); },
    animating() { return [...desired].some(v => !blocked.has(v)); },
    reset() { if (media) { media.pause(); media.reset(); } desired.clear(); usedVideo.clear(); blocked.clear(); },
    dispose() { media?.dispose(); surface?.dispose(); },
    seek(time, entrance, settings) {
      if (!media) return;
      media.pause(); desired.clear();
      const { spread, logoEnd, arrival } = currentTiming(settings), order = orderFor(layout(innerWidth, innerHeight).count);
      const heroStart = entrance === 'recede' ? 0 : spread + (entrance === 'unfurl' ? .2 : 0);
      const seekVideo = (video, seconds) => { if (Number.isFinite(video.duration)) video.currentTime = Math.min(Math.max(0, video.duration - .05), Math.max(0, seconds)); };
      seekVideo(media.hero, .6 + Math.max(0, time - heroStart));
      usedVideo.clear();
      media.projects.forEach((p, i) => {
        if (!order.includes(i)) return;
        const age = time - logoEnd - order.indexOf(i) * arrival;
        if (age >= 0) usedVideo.add(i);
        seekVideo(p.video, .6 + Math.max(0, i === 0 ? age : Math.min(age, arrival)));
      });
    },
    sync(time, entrance, settings, playing, rate) {
      if (!media) return;
      const next = new Set(), { spread, logoEnd, arrival } = currentTiming(settings), order = orderFor(layout(innerWidth, innerHeight).count);
      if (playing && time >= 0) {
        if (time >= logoEnd) {
          const id = order[Math.min(order.length - 1, Math.floor((time - logoEnd) / arrival))];
          next.add(media.projects[id].video); usedVideo.add(id);
        }
        if (entrance === 'recede' || time >= spread + (entrance === 'unfurl' ? .2 : 0)) next.add(media.hero);
      }
      for (const video of desired) if (!next.has(video)) video.pause();
      for (const video of next) {
        video.playbackRate = rate;
        if (!desired.has(video)) {
          blocked.delete(video);
          video.play().catch(error => { if (error.name !== 'AbortError' && desired.has(video)) { blocked.add(video); repaint(); } });
        }
      }
      desired = next;
    },
    paint(ctx, W, H, time, entrance, settings, background = '#0a1f38') {
      if (!media || time < 0) return;
      // Travels through the existing reveal mask: never recolour the opening.
      ctx.fillStyle = background; ctx.fillRect(0, 0, W, H);
      const images = media.projects.map((p, i) => usedVideo.has(i) ? p.video : p.poster);
      const m = model(time, W, H, entrance, settings), l = m.layout, hero = l.hero;
      if (entrance === 'recede' || m.phase === 'settled') card(ctx, media.hero, hero);
      else if (entrance === 'unfurl' && m.heroProgress > 0) {
        ctx.save(); rounded(ctx, { ...hero, y: hero.y + hero.h * (1 - m.heroProgress), h: hero.h * m.heroProgress });
        ctx.clip(); cover(ctx, media.hero, hero); ctx.restore();
      }
      if (!m.logoCard && !m.moving && m.firstArrival < 1 && m.logoProgress > 0) {
        // The badge never shrinks to accommodate an arriving card. Keep its
        // full-size artwork behind the contact-led silhouette; only occlude it.
        const size = l.logo.w * mix(.08, 1, m.logoProgress);
        const cx = l.logo.x + l.logo.w / 2, cy = l.logo.y + l.logo.h / 2;
        ctx.save(); rounded(ctx, m.stackEnvelope); ctx.clip();
        ctx.drawImage(media.badge, cx - size / 2, cy - size / 2, size, size); ctx.restore();
      }
      if (m.moving) {
        if (!m.logoCard) {
          ctx.save(); ctx.beginPath(); ctx.rect(l.logo.x, l.logo.y, Math.max(0, m.logoClip - l.logo.x), l.logo.h); ctx.clip();
          ctx.drawImage(media.badge, l.logo.x, l.logo.y, l.logo.w, l.logo.h); ctx.restore();
        }
        // Geometry-driven occlusion: the stack's trailing edge uncovers letters.
        // Draw behind the fluid surface so a liquid neck can still cover them.
        const text = l.identity;
        ctx.save(); ctx.beginPath(); ctx.rect(text.x, text.y - 22, Math.max(0, m.identityClip - text.x), 44); ctx.clip();
        ctx.fillStyle = '#f0e3d1'; ctx.font = `600 ${text.font}px "Pilcrow Rounded", sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('SHOWREEL', text.x, text.y); ctx.restore();
        const frontX = m.cards.find(c => c.id === 0).rect.x;
        if (!l.mobile && frontX > text.x - 20) {
          ctx.fillStyle = 'rgba(240,227,209,.65)'; ctx.fillRect(text.x - 20, text.y - 18, Math.min(1, frontX - text.x + 20), 36);
        }
      }
      if (m.logoCard) images.push(logoTexture(background));
      if (!surface?.draw(ctx, m, images, [...getRatios(), 1])) {
        if (m.logoCard) {
          ctx.save(); ctx.beginPath(); ctx.rect(0, 0, m.logoClip, H); ctx.clip();
          if (!m.moving) { rounded(ctx, m.stackEnvelope); ctx.clip(); }
          card(ctx, images[6], m.logoCard.rect); ctx.restore();
        }
        for (const c of m.cards) if (c.visible) card(ctx, images[c.id], c.rect);
      }
      if (entrance === 'card' && m.moving && m.heroProgress < 1) {
        const growing = blendRect(m.origin, hero, m.heroProgress);
        card(ctx, images[0], growing); ctx.save(); ctx.globalAlpha = ease(m.heroProgress / .3); card(ctx, media.hero, growing); ctx.restore();
      } else if (entrance === 'card' && m.heroProgress === 1 && m.phase !== 'settled') card(ctx, media.hero, hero);
    }
  };
}
