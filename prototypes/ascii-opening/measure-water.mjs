// Prototype-only deterministic renderer probe: node prototypes/ascii-opening/measure-water.mjs
// Exercises the actual drawWater code with a measuring canvas, without a browser.
import fs from 'node:fs';
import vm from 'node:vm';
let source = fs.readFileSync(new URL('./main.js', import.meta.url), 'utf8');
// Recreate only the two old blending expressions for a red-capable comparison.
if (process.argv.includes('--before-fix')) source = source
  .replace('clamp(Math.max(activeFoam,residue))', 'clamp(activeFoam+residue)')
  .replace('smooth(0.12,0.95,activeFoam)', 'smooth(0.12,0.95,foam)');
let ink = 0, count = 0;
const context = {
  clearRect() { ink = 0; count = 0; },
  fillText() {
    const parts = this.fillStyle.match(/[\d.]+/g).map(Number);
    ink += (parts[0]*0.2126+parts[1]*0.7152+parts[2]*0.0722)*(parts[3] ?? 1);
    count++;
  },
  canvas: { dataset: {} }
};
const element = { getContext: () => context };
const sandbox = {
  URLSearchParams, Math, console,
  document: { getElementById: () => element, createElement: () => element },
  location: { search: '?mask=badge&palette=ascii&font=plex&theme=brand-dark&reach=100&size=52&cell=9.5&density=71&speed=1.4&amplitude=90&turbulence=100&contrast=100&spread=100&foamLife=60&sea=6&fadeStart=61&crestWidth=100&thicknessVariation=100' },
  matchMedia: () => ({ matches: false }),
  record: (t) => ({ time: t, ink: Math.round(ink), cells: count })
};
vm.createContext(sandbox);
const start = source.indexOf("try {\n  await Promise.all(['letters','badge']");
vm.runInContext(source.slice(0, start) + `
W=1512; H=863; logoBottom=H*0.76; reachY=logoBottom;
const rows=[];
for (let t=0;t<=3.61;t+=0.2) { time=t; drawWater(); rows.push(record(Number(t.toFixed(1)))); }
console.table(rows);
const tail=rows.filter(r=>r.time>=1.4 && r.time<=3.2);
for (let i=1;i<tail.length;i++) {
  if (tail[i].ink > tail[i-1].ink*1.02) throw new Error('Late-wave brightness rebound: '+JSON.stringify(tail.slice(i-1,i+1)));
}
console.log('PASS: no late-wave brightness rebound above 2% in the reported composition.');
`, sandbox);
