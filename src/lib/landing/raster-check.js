// Browser-only regression; not imported by the production runtime.
import { createFluidSurface } from './fluid.js';
import { sceneModel, sceneDefaults } from './scene.js';

export function checkPaddingCache() {
  const target = document.createElement('canvas'); target.width = 1440; target.height = 900;
  const image = document.createElement('canvas'); image.width = image.height = 16;
  const art = image.getContext('2d');
  if (!art) throw new Error('Canvas2D unavailable');
  art.fillStyle = '#00ff00'; art.fillRect(0, 0, 16, 16);
  const images = Array(6).fill(image), ratios = Array(6).fill(16 / 9);
  const surface = createFluidSurface();
  try {
    const initial = sceneModel(100, 1440, 900);
    if (!surface.draw(target.getContext('2d'), initial, images, ratios)) throw new Error('WebGL unavailable');
    const r = initial.cards.find(c => c.id === 0)?.rect;
    if (!r) throw new Error('Missing initial card');
    const oldPoint = [r.x + r.w / 2, r.y + r.h - 10];
    const before = surface.sample([oldPoint])[0][3];
    const moved = sceneModel(100, 1440, 900, 'recede', { ...sceneDefaults, bottomPadding: 160 });
    surface.draw(target.getContext('2d'), moved, images, ratios);
    const next = moved.cards.find(c => c.id === 0)?.rect;
    if (!next) throw new Error('Missing repositioned card');
    const after = surface.sample([oldPoint])[0][3];
    const current = surface.sample([[next.x + next.w / 2, next.y + next.h / 2]])[0][3];
    if (before < 240 || after > 10 || current < 240) throw new Error('Settled raster cache ignores vertical layout changes');
    return { pass: true, before, after, current };
  } finally { surface.dispose(); }
}
