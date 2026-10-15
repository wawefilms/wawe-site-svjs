// Geometry regression for the reported corner-origin growth/mobile row bugs.
import assert from 'node:assert/strict';
import { sceneModel, sceneDefaults, layout, timing, contactSpring } from './scene.js';
for (const [W, H] of [[320, 568], [390, 844], [600, 800], [1440, 900], [1920, 1080]]) {
  const l = layout(W, H), { spread, end } = timing(sceneDefaults, l.count);
  assert.equal(l.hero.y, 0, 'hero is not flush with viewport top');
  assert.equal(l.hero.topR, 0, 'hero top corners remain rounded');
  assert(l.hero.r > 0, 'hero lost bottom rounding');
  assert.equal(l.logo.h, l.rowH, 'logo and cards have different row heights');
  assert(Math.abs(H - l.rowY - l.rowH - l.margin) < 1e-8, 'bottom and side gutters differ');
  for (const ratios of [Array(6).fill(16 / 9), [16 / 9, 9 / 16, 1, 2.36, 4 / 5, 16 / 9]]) {
    let centre;
    for (let t = .01; t < spread; t += .037) {
      const m = sceneModel(t, W, H, 'recede', sceneDefaults, ratios);
      for (const c of m.cards) {
        const p = [c.rect.x + c.rect.w / 2, c.rect.y + c.rect.h / 2];
        centre ??= p;
        assert(Math.hypot(p[0] - centre[0], p[1] - centre[1]) < 1e-8, 'growth or stack morph drifts from centre');
      }
      assert.equal(m.fluid.merge, 0, 'coincident stack layers must not inflate the outline');
      assert(m.fluid.wobble > 0, 'arrivals retain surface tension');
    }
    const previousX = new Map();
    for (let t = spread; t <= end; t += .017) {
      const m = sceneModel(t, W, H, 'recede', sceneDefaults, ratios);
      for (const c of m.cards) {
        const cx = c.rect.x + c.rect.w / 2, cy = c.rect.y + c.rect.h / 2;
        assert(Math.abs(cy - centre[1]) < 1e-8, 'unfurl leaves the shared horizontal axis');
        assert(cx >= (previousX.get(c.id) ?? centre[0]) - 1e-8, 'card reverses left');
        assert.equal(c.rotation, 0, 'linear separation has orbital rotation');
        previousX.set(c.id, cx);
      }
      assert.equal(m.fluid.blend, 2, 'material width is coupled to merge strength');
    }
    const stacked = sceneModel(spread - .001, W, H, 'recede', sceneDefaults, ratios);
    assert.deepEqual(stacked.cards.map(c => c.id), Array.from({ length: l.count }, (_, i) => l.count - 1 - i));
    assert.equal(stacked.fluid.topCover, 1, 'completed top face must own the entire surface');
    for (const logoInStack of [false, true]) {
      const settings = { ...sceneDefaults, logoInStack };
      const atStart = sceneModel(spread, W, H, 'recede', settings, ratios);
      for (let t = spread; t <= end; t += .013) {
        const m = sceneModel(t, W, H, 'recede', settings, ratios);
        if (t < spread + settings.unfurl) {
          const after = sceneModel(t + .0001, W, H, 'recede', settings, ratios);
          const expectedSpeed = (l.cards.at(-1).x + l.cards.at(-1).w / 2 - (m.origin.x + m.origin.w / 2)) / settings.unfurl;
          assert(Math.abs((after.sweepX - m.sweepX) / .0001 - expectedSpeed) < 1e-6, 'travelling stack pauses or changes speed at a deposit');
        }
        assert.equal(m.logoRect.w, l.logo.w, 'logo shrinks during stacking');
        for (const c of m.cards) if (c.deposited) assert.equal(c.tilt, 0, 'deposited card remains tilted');
        const cards = [...m.cards].sort((a, b) => a.id - b.id);
        const remainder = cards.filter(c => !c.deposited);
        for (const c of remainder) assert.deepEqual(c.rect, remainder[0].rect, 'remaining stack splits before deposition');
        for (const c of cards.filter(c => c.deposited)) assert.deepEqual(c.rect, l.cards[c.id], 'deposited card moves away from its slot');
        if (t >= atStart.depositStart) assert.deepEqual(cards[0].rect, l.cards[0], 'top card moves while remainder departs');
        assert.equal(m.identityClip, Math.max(l.identity.x, Math.min(l.identity.x + l.identity.w, cards[0].rect.x)), 'text is revealed by a clock rather than the trailing edge');
        assert.equal(!!m.logoCard, logoInStack);
        if (m.logoCard) assert.deepEqual(m.logoCard.rect, { ...l.logo, r: l.logo.w / 2 });
      }
      const before = sceneModel(spread - .01, W, H, 'recede', settings, ratios);
      assert.deepEqual(before.cards, sceneModel(spread - .01, W, H, 'recede', sceneDefaults, ratios).cards, 'variant changes initial stacking');
      const transport = sceneModel(spread + (atStart.depositStart - spread) / 2, W, H, 'recede', settings, ratios);
      assert.equal(transport.cards.filter(c => c.visible).length, 1, 'whole stack must travel under one top face');
    }
    const finals = ['recede', 'card', 'unfurl'].map(entrance => sceneModel(end, W, H, entrance, sceneDefaults, ratios));
    assert.deepEqual(finals[0].cards, finals[1].cards);
    assert.deepEqual(finals[1].cards, finals[2].cards);
    for (const m of finals) {
      assert.equal(m.fluid.merge, 0); assert.equal(m.fluid.wobble, 0); assert.equal(m.fluid.links.length, 0);
      for (const c of m.cards) {
        assert(c.rect.x >= 0 && c.rect.x + c.rect.w <= W);
        assert(c.rect.y === l.rowY && c.rect.y + c.rect.h <= H);
        assert(c.rect.w > 20 && c.rect.h > 20);
      }
    }
  }
  if (W < 700) {
    assert(l.logo.y >= l.rowY, 'logo is above the project row');
    assert(Math.abs(l.logo.y + l.logo.h - (l.rowY + l.rowH)) < 1e-8, 'logo is not bottom-anchored');
    assert(l.identity.y >= l.rowY && l.identity.y <= l.rowY + l.rowH, 'text is above the row');
    assert(l.identity.x + l.identity.w < l.cards[0].x, 'text overlaps first project');
    assert(l.count <= 3, 'mobile keeps too many projects');
  }
}
const normal = timing(sceneDefaults), slow = timing({ ...sceneDefaults, stackSpeed: 1 });
assert(normal.spread < slow.spread, 'stack-speed control does not accelerate stacking');
assert(Math.abs((normal.end - normal.spread) - (slow.end - slow.spread)) < 1e-9, 'stack-speed control changes separation duration');
assert.equal(sceneModel(normal.logoEnd / 2, 1440, 900).phase, 'logo');
assert.equal(sceneModel(normal.logoEnd / 2, 1440, 900).cards.length, 0, 'projects arrive before the logo prelude');
assert(sceneModel(.62, 1440, 900).logoProgress > sceneModel(.43, 1440, 900).logoProgress);
const contactSettings = { ...sceneDefaults, arrival: .55, morph: .3 };
const contactTiming = timing(contactSettings);
const secondBirth = contactTiming.logoEnd + contactTiming.arrival;
for (const [previousRatio, nextRatio] of [[9 / 16, 2.36], [2.36, 9 / 16]]) {
  const ratios = [16 / 9, 16 / 9, 16 / 9, 16 / 9, nextRatio, previousRatio];
  const old = sceneModel(secondBirth - .001, 1440, 900, 'recede', contactSettings, ratios);
  const growing = sceneModel(secondBirth + contactTiming.morph * .2, 1440, 900, 'recede', contactSettings, ratios);
  assert.deepEqual(growing.cards[0].rect, old.cards[0].rect, 'incoming card resizes previous card before touching an edge');
  assert.equal(growing.cards.at(-1).contact, false);
  assert(Math.abs(growing.cards.at(-1).rect.w / growing.cards.at(-1).rect.h - nextRatio) < 1e-8, 'incoming growth loses native ratio');
  const contact = sceneModel(secondBirth + contactTiming.morph * .42, 1440, 900, 'recede', contactSettings, ratios);
  const a = contact.cards[0].rect, b = contact.cards.at(-1).rect;
  assert(Math.min(Math.abs(a.w - b.w), Math.abs(a.h - b.h)) < 1e-8, 'morph starts before an edge is touched');
  const after = sceneModel(secondBirth + contactTiming.morph * .6, 1440, 900, 'recede', contactSettings, ratios).cards[0].rect;
  assert(nextRatio > previousRatio ? after.w > a.w && after.h < a.h : after.w < a.w && after.h > a.h, 'contact does not expand one axis while contracting the other');
}
assert(contactSpring(.3) > 1, 'contact response has no spring overshoot');
assert.equal(contactSpring(1), 1, 'spring does not settle exactly');
for (let t = .9; t < 2.2; t += .01) {
  const m = sceneModel(t, 1440, 900, 'recede', { ...sceneDefaults, logoInStack: true });
  assert.deepEqual(m.logoCard.rect, { ...m.layout.logo, r: m.layout.logo.w / 2 }, 'logo artwork geometry shrinks during an arrival');
}
for (const bottomPadding of [0, 18, 72, 180]) {
  const l = layout(1440, 900, { ...sceneDefaults, bottomPadding });
  assert(Math.abs(900 - l.rowY - l.rowH - bottomPadding) < 1e-8, 'bottom-padding setting ignored');
  const m = sceneModel(10, 1440, 900, 'recede', { ...sceneDefaults, bottomPadding });
  assert.equal(m.layout.rowY, l.rowY, 'scene does not use configured bottom padding');
}
console.log('PASS: full-size logo; native-ratio first-edge contact; spring response; constant-speed sweep; stationary flat deposits; matched gutters; responsive final row.');
