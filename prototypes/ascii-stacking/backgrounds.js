// Study-only shades of the brand's Ink Navy (#0a1f38), not new brand tokens.
// Channel scaling preserves its blue hue; the accepted opening remains navy.
const ink = [10, 31, 56];
const shade = factor => '#' + ink.map(c => Math.round(c * factor).toString(16).padStart(2, '0')).join('');
export const backgrounds = Object.freeze({
  ink: { label: 'Ink Navy · original', color: shade(1) },
  deep: { label: 'Deep Ink · 72%', color: shade(.72) },
  midnight: { label: 'Midnight Ink · 45%', color: shade(.45) },
  nearBlack: { label: 'Near-black Ink · 25%', color: shade(.25) }
});
