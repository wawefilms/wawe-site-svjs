// Browser-only raster regression, using the actual shader and diagnostic art.
import { createFluidSurface } from './fluid.js';
import { sceneModel, sceneDefaults } from './scene.js';
export function checkFluid() {
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const target = document.createElement('canvas'); target.width = 1440 * dpr; target.height = 900 * dpr;
  const ctx = target.getContext('2d'); ctx.scale(dpr, dpr);
  const solid = colour => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 144;
    const ctx = c.getContext('2d'); ctx.fillStyle = colour; ctx.fillRect(0, 0, 256, 144); return c;
  };
  const images = Array(6).fill(solid('#ff0000')); images[5] = solid('#0000ff');
  const ratios = [16/9,16/9,16/9,16/9,16/9,1920/814];
  const surface = createFluidSurface();
  const render = model => {
    ctx.clearRect(0, 0, 1440, 900);
    assert(surface.draw(ctx, model, images, ratios), 'Fluid shader fell back');
    return model;
  };
  const draw = time => render(sceneModel(time, 1440, 900, 'unfurl', sceneDefaults, ratios));
  try {
    // Isolate the advancing material boundary from noise and other overlapping cards.
    const fixture = sceneModel(.6, 1440, 900, 'unfurl', sceneDefaults, ratios);
    fixture.cards = [
      { id: 0, rect: { x: 100, y: 300, w: 300, h: 180, r: 16 }, rotation: 0, opacity: 1 },
      { id: 5, rect: { x: 180, y: 340, w: 140, h: 100, r: 12 }, rotation: 0, opacity: 1 }
    ];
    fixture.fluid = { ...fixture.fluid, wobble: 0, links: [] };
    render(fixture);
    const xs = Array.from({ length: 41 }, (_, i) => 310 + i * .5);
    const samples = surface.sample(xs.map(x => [x, 390]));
    const blendedWidth = samples.filter(p => p[0] > 20 && p[2] > 20).length * .5;
    assert(blendedWidth > 0 && blendedWidth <= 4, `Material boundary too broad/hard: ${blendedWidth}px`);
    assert(samples[0][2] > 240 && samples.at(-1)[0] > 240, 'Materials do not resolve to solid artwork');

    // A flat card should have small surface-tension deviations, not broad scallops.
    fixture.cards = [fixture.cards[0]];
    fixture.fluid.wobble = sceneDefaults.wobble;
    render(fixture);
    const edgeXs = Array.from({ length: 80 }, (_, i) => 140 + i * 2.5);
    const ys = Array.from({ length: 49 }, (_, i) => 294 + i * .25);
    const pixels = surface.sample(edgeXs.flatMap(x => ys.map(y => [x, y])));
    const top = edgeXs.map((_, i) => ys[pixels.slice(i * ys.length, (i + 1) * ys.length).findIndex(p => p[3] > 160)]);
    const edgeRange = Math.max(...top) - Math.min(...top);
    assert(Number.isFinite(edgeRange) && edgeRange > 0 && edgeRange <= 4, `Wobble is rigid or excessive: ${edgeRange}px`);
    const fringe = edgeXs.map((_, i) => pixels.slice(i * ys.length, (i + 1) * ys.length).filter(p => p[3] > 10 && p[3] < 245).length * .25);
    assert(Math.max(...fringe) <= 2 / dpr, 'Outer alpha fringe is too soft');
    assert(surface.info().dpr === dpr, 'Surface does not use display resolution');

    let connection;
    const m = draw(1.4);
    for (let t = m.spread + .25; t < m.end - .4 && !connection; t += .1) {
      const n = draw(t), cards = [...n.cards].sort((a,b) => a.rect.x - b.rect.x);
      for (let i = 0; i < cards.length - 1; i++) {
        const a = cards[i].rect, b = cards[i + 1].rect, gap = b.x - a.x - a.w;
        if (gap < 16 || gap > 70) continue;
        const alpha = surface.sample([[(a.x + a.w + b.x) / 2, (a.y + a.h / 2 + b.y + b.h / 2) / 2]])[0][3];
        if (alpha > 200) { connection = { time: t, gap, alpha }; break; }
      }
    }
    assert(connection, 'No opaque fluid neck crosses separated cards');
    draw(m.end);
    const before = ctx.getImageData(0, 0, target.width, target.height).data;
    draw(m.end); // Cached path must preserve DPR and destination size.
    const after = ctx.getImageData(0, 0, target.width, target.height).data;
    assert(before.every((v, i) => v === after[i]), 'Cached settled raster differs');
    return { pass: true, dpr, blendedWidth, edgeRange, maxFringe: Math.max(...fringe), connection };
  } finally { surface.dispose(); }
}

// Regression for the exposed previous-image rim, including zero wobble.
export function checkStackCoverage() {
  const surface = createFluidSurface(), target = document.createElement('canvas');
  target.width = 1440; target.height = 900;
  const images = Array.from({ length: 6 }, (_, id) => {
    const c = document.createElement('canvas'); c.width = c.height = 16;
    const ctx = c.getContext('2d'); ctx.fillStyle = id === 0 ? '#0000ff' : '#ff0000';
    ctx.fillRect(0, 0, 16, 16); return c;
  });
  try {
    for (const viscosity of [0, .9, 1.5]) {
      const settings = { ...sceneDefaults, wobble: 0, viscosity };
      const initial = sceneModel(0, 1440, 900, 'recede', settings);
      const m = sceneModel(initial.spread - .01, 1440, 900, 'recede', settings);
      surface.draw(target.getContext('2d'), m, images, Array(6).fill(16 / 9));
      const r = m.cards.at(-1).rect, points = [];
      for (let y = r.y - 25; y <= r.y + r.h + 25; y += 3)
        for (let x = r.x - 25; x <= r.x + r.w + 25; x += 3) points.push([x, y]);
      const visible = surface.sample(points).filter(p => p[3] > 200);
      const previous = visible.filter(p => p[0] > 15 || p[2] < 240);
      if (!visible.length || previous.length) throw new Error(`Previous image exposed: ${previous.length}/${visible.length} pixels, viscosity ${viscosity}`);
    }
    return { pass: true, viscosity: [0, .9, 1.5], wobble: 0 };
  } finally { surface.dispose(); }
}

export function checkLogoStack() {
  const settings = { ...sceneDefaults, logoInStack: true, wobble: 0 };
  const target = document.createElement('canvas'); target.width = 1440; target.height = 900;
  const images = Array.from({ length: 7 }, (_, id) => {
    const c = document.createElement('canvas'); c.width = c.height = 16;
    const ctx = c.getContext('2d'); ctx.fillStyle = id === 6 ? '#00ff00' : '#ff0000';
    ctx.fillRect(0, 0, 16, 16); return c;
  });
  const surface = createFluidSurface(), ratios = [...Array(6).fill(16 / 9), 1];
  const start = sceneModel(0, 1440, 900, 'recede', settings);
  try {
    let connection;
    for (let t = start.spread + .01; t < start.depositStart; t += .01) {
      const m = sceneModel(t, 1440, 900, 'recede', settings);
      if (!surface.draw(target.getContext('2d'), m, images, ratios)) throw new Error('Logo variant shader failed');
      const a = m.logoCard.rect, b = m.cards.find(c => c.id === 0).rect;
      const gap = b.x - a.x - a.w;
      if (gap < 5 || gap > 80) continue;
      const pixel = surface.sample([[(a.x + a.w + b.x) / 2, a.y + a.h / 2]])[0];
      if (pixel[3] > 200) { connection = { time: t, gap, alpha: pixel[3] }; break; }
    }
    if (!connection) throw new Error('Logo is not connected to the departing project surface');
    const m = sceneModel(start.end, 1440, 900, 'recede', settings);
    surface.draw(target.getContext('2d'), m, images, ratios);
    const r = m.logoCard.rect, centre = surface.sample([[r.x + r.w / 2, r.y + r.h / 2]])[0];
    if (centre[1] < 240 || centre[3] < 240) throw new Error('Seventh atlas cell does not render the logo');
    return { pass: true, connection, logoPixel: centre };
  } finally { surface.dispose(); }
}

export function checkPerspective() {
  const target = document.createElement('canvas'); target.width = 1440; target.height = 900;
  const image = document.createElement('canvas'); image.width = 400; image.height = 200;
  const art = image.getContext('2d'); art.fillStyle = '#ff0000'; art.fillRect(0, 0, 400, 200);
  const surface = createFluidSurface();
  const fixture = sceneModel(0, 1440, 900);
  fixture.cards = [{ id: 0, rect: { x: 100, y: 300, w: 400, h: 200, r: 0 }, rotation: 0, tilt: .14, opacity: 1 }];
  fixture.fluid = { ...fixture.fluid, wobble: 0, merge: 0, links: [], topCover: 0 };
  const edge = x => {
    const ys = Array.from({ length: 81 }, (_, i) => 290 + i * .25);
    const samples = surface.sample(ys.map(y => [x, y]));
    return ys[samples.findIndex(p => p[3] > 160)];
  };
  try {
    if (!surface.draw(target.getContext('2d'), fixture, [image], [2])) throw new Error('Perspective shader failed');
    const warped = edge(460) - edge(140);
    if (!(warped > 3)) throw new Error('Perspective changes only artwork, not the silhouette');
    fixture.cards[0].tilt = 0;
    surface.draw(target.getContext('2d'), fixture, [image], [2]);
    const flat = edge(460) - edge(140);
    if (flat !== 0) throw new Error('Deposited surface does not return flat');
    return { pass: true, warpedEdgeDelta: warped, flatEdgeDelta: flat };
  } finally { surface.dispose(); }
}
