// THROWAWAY shoreline study. No CMS, readiness gate, wash or showreel.
const $ = (id) => document.getElementById(id);
// Approved snapshot: ./approved-opening.json. Keep these defaults aligned;
// next-phase DialKit controls tune the transition, not this locked opening.
const defaults = { mask: 'badge', palette: 'ascii', font: 'plex', theme: 'brand-dark', logoMotion: 'flow',
  reach: 100, size: 52, cell: 9.5, density: 71, speed: 1.4,
  amplitude: 90, turbulence: 100, contrast: 100, spread: 100, foamLife: 60, sea: 6,
  fadeStart: 61, crestWidth: 100, thicknessVariation: 100 };
const bounds = { reach: [0,100,1], size: [20,65,1], cell: [2,20,0.5],
  density: [20,100,1], speed: [0.2,2,0.1], amplitude: [0,90,1], turbulence: [0,100,1],
  contrast: [20,100,1], spread: [10,100,1], foamLife: [10,100,1], sea: [0,100,1],
  fadeStart: [0,95,1], crestWidth: [50,150,1], thicknessVariation: [0,100,1] };
const palettes = { ascii: '.,:;~=+*oO#@', mixed: '·.:;~+*oO#', stipple: '·∙:⠂⠒⠲⠶•' };
const fonts = { plex: 'Plex, monospace', geist: 'Geist, monospace', system: 'ui-monospace, Menlo, Consolas, monospace' };
const choices = { mask: ['letters','badge'], palette: Object.keys(palettes), font: Object.keys(fonts), theme: ['dark','light','brand-dark'], logoMotion: ['flow','glyphs'] };
const qs = new URLSearchParams(location.search), cfg = { ...defaults };
for (const key of Object.keys(cfg)) {
  if (!qs.has(key)) continue;
  if (bounds[key]) {
    const n = Number(qs.get(key));
    if (Number.isFinite(n)) cfg[key] = Math.max(bounds[key][0], Math.min(bounds[key][1], n));
  } else if (choices[key].includes(qs.get(key))) cfg[key] = qs.get(key);
}
// Old `churn` deliberately has no alias: glyph substitution is not fluid turbulence.
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reduce.matches || qs.get('paused') === '1';
let time = Number(qs.get('time'));
if (!Number.isFinite(time) || time < 0) time = 0;
let W = 0, H = 0, logoBottom = 0, reachY = 0, frameId = 0, last = 0, kit;
const water = $('water').getContext('2d'), logo = $('logo').getContext('2d');
const maskCanvas = document.createElement('canvas');
const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
const images = {};
const clamp = (n, a=0, b=1) => Math.max(a,Math.min(b,n));
const hash = (x,y) => { const n = Math.sin(x*127.1+y*311.7)*43758.5453; return n-Math.floor(n); };
const smooth = (a,b,x) => { const n = clamp((x-a)/(b-a)); return n*n*(3-2*n); };
const mix = (a,b,t) => a+(b-a)*t;
function noise(x,y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = smooth(0,1,x-ix), fy = smooth(0,1,y-iy);
  return mix(mix(hash(ix,iy),hash(ix+1,iy),fx),mix(hash(ix,iy+1),hash(ix+1,iy+1),fx),fy);
}
function setURL() {
  const params = new URLSearchParams(Object.entries(cfg).map(([k,v]) => [k,String(v)]));
  if (paused) { params.set('paused','1'); params.set('time',time.toFixed(3)); }
  history.replaceState(null,'',`?${params}`);
}
function summary() {
  document.documentElement.dataset.theme = cfg.theme;
  $('summary').textContent = `${cfg.theme.toUpperCase()} / ${cfg.mask.toUpperCase()} / REACH ${cfg.reach}%${paused ? ' / PAUSED' : ''}`;
}
function setFont(ctx, cell) {
  ctx.font = `400 ${cell*1.4}px ${fonts[cfg.font]}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
}
let logoGeometry;
function prepareLogo() {
  const image = images[cfg.mask];
  if (!image) return;
  const height = Math.min(H*cfg.size/100,W*0.72*image.height/image.width);
  const width = height*image.width/image.height, x0 = (W-width)/2, y0 = (H-height)/2;
  logoBottom = y0+height; reachY = H-(H-logoBottom)*cfg.reach/100;
  $('reach-line').style.top = `${reachY}px`; $('logo-line').style.top = `${logoBottom}px`;
  $('fade-line').style.top = `${H-(H-reachY)*cfg.fadeStart/100}px`;
  const key = `${cfg.mask}:${width}:${height}`;
  if (logoGeometry?.key === key) return;
  maskCanvas.width = Math.ceil(width); maskCanvas.height = Math.ceil(height);
  maskCtx.drawImage(image,0,0,width,height);
  const pixels = maskCtx.getImageData(0,0,maskCanvas.width,maskCanvas.height).data;
  // The mask chooses character centres; it never cuts through a character.
  logoGeometry = { key, width, height, pixels, stride: maskCanvas.width };
}
function drawLogo() {
  if (!logoGeometry) return;
  logo.clearRect(0,0,W,H);
  const { width,height,pixels,stride } = logoGeometry;
  const x0=(W-width)/2, y0=(H-height)/2;
  const cell = cfg.cell, row = cell*1.18, ramp = palettes[cfg.palette];
  setFont(logo,cell);
  logo.canvas.dataset.cellSize = String(cell);
  const flowing = cfg.logoMotion === 'flow';
  const dx = flowing ? time*cell*0.18 : 0;
  const dy = flowing ? -time*row*0.35 : 0;
  const col0 = Math.floor(-dx/cell)-1, row0 = Math.floor(-dy/row)-1;
  const ink = cfg.theme === 'light' ? '14 67 142' : cfg.theme === 'brand-dark' ? '240 227 209' : '238 234 226';
  for (let r=row0;r*row+dy<height+row;r++) for (let c=col0;c*cell+dx<width+cell;c++) {
    const x=c*cell+dx, y=r*row+dy;
    if (x<0 || y<0 || x>=width || y>=height) continue;
    if (pixels[(Math.floor(y)*stride+Math.floor(x))*4] < 107) continue;
    const seed=hash(c,r);
    const drift=noise(c*0.32+time*0.16,r*0.27-time*0.22);
    // Per-cell phase spreads choices across the ENTIRE palette, not its middle.
    // Continuous time changes glyphs gradually, rather than re-randomising frames.
    const phase=seed+time*0.045+(drift-0.5)*0.12;
    const level=phase-Math.floor(phase);
    logo.fillStyle=`rgb(${ink} / ${0.86+drift*0.14})`;
    logo.fillText(ramp[Math.floor(level*ramp.length)],x0+x,y0+y);
  }
}
function drawWater() {
  water.clearRect(0,0,W,H);
  const depth = H-reachY;
  if (depth <= 0) return;
  const cell = cfg.cell, row = cell*1.18, ramp = palettes[cfg.palette];
  water.canvas.dataset.cellSize = String(cell);
  setFont(water,cell);
  const period = 6.8, clock = time+3.6, cycle = Math.floor(clock/period), phase = clock%period/period;
  const relief = Math.min(cfg.amplitude,depth*0.65);
  const spread = depth*(0.12+cfg.spread/100*0.36);
  const turbulence = cfg.turbulence/100;
  const variation = cfg.thicknessVariation/100;
  const fadeStart = cfg.fadeStart/100;
  const life = 1.8+cfg.foamLife/100*3.8;
  const travel = time*24;
  const light = cfg.theme === 'light';
  let foamMemory = 0;
  for (let previous=0; previous<4; previous++) {
    const age = (phase+previous-0.72)*period;
    if (age >= 0) foamMemory += smooth(0,0.8,age)*Math.exp(-age/life)*(1-smooth(18,24,age));
  }
  // A persistent offshore body + ONE incoming breaker, sampled as one scalar field.
  // Old foam persists as a dissipating wake, not another independently moving wave.
  for (let x=cell/2;x<W;x+=cell) {
    const coast = reachY+relief*(0.5+0.25*Math.sin(x*0.009+time*0.7)
      +0.15*Math.sin(x*0.026-time*0.95)+0.1*Math.sin(x*0.06+time*0.6));
    const baseline = coast+depth*0.50;
    const localPhase = phase + 0.025*Math.sin(x*0.009+cycle*1.7);
    const advance = 1-Math.pow(1-clamp(localPhase/0.74),1.5);
    const curl = relief*turbulence*(noise(x*0.016,time*0.3)-0.5);
    // Extra offscreen margin guarantees every crest enters from below.
    // Continue through the dissipation band instead of parking at the old limit.
    const front = mix(H+depth*0.35,coast+spread*0.18,advance)+curl
      -depth*(1-fadeStart)*smooth(0.6,1,localPhase);
    const breaking = smooth(0.35,0.75,localPhase);
    const spent = smooth(0.74,1.01,localPhase);
    const crestWidth = Math.max(cell*0.9,depth*0.045)*(1+breaking*1.5)*cfg.crestWidth/100;
    // One displacement per column preserves a coherent crest cross-section.
    // Higher variation blends back toward the old per-cell folding.
    const crestBend = (noise(x*0.024,time*0.35)-0.5)*turbulence*crestWidth*2;
    const localFadeStart = clamp(fadeStart+(noise(x*0.012,time*0.18)-0.5)*(1-fadeStart)*0.4,0,0.98);
    for (let y=Math.ceil((reachY+cell)/row)*row;y<H+row;y+=row) {
      const d = y-front;
      // Domain-warped coherent noise carries foam along the shoreward current.
      const warp = noise(x*0.013,(y+travel)*0.012)*turbulence*35;
      const n = noise((x+warp)*0.024,(y+travel)*0.025);
      const fine = noise((x-warp)*0.085,(y+travel*1.35)*0.078);
      const lace = smooth(0.24,0.72,n*0.7+fine*0.3);
      const crestDistance = d+mix(crestBend,(n-0.5)*turbulence*crestWidth*2,variation);
      const crestTexture = mix(0.9+lace*0.1,0.4+lace*0.6,variation);
      const crest = Math.exp(-Math.pow(crestDistance/crestWidth,2))*(1-spent)*crestTexture;
      const wake = d>0 ? Math.exp(-d/spread)*(1-spent)*(0.3+breaking*0.7)*lace : 0;
      const spray = d<0 ? Math.exp(d/(crestWidth*1.7))*breaking*(1-spent)*Math.pow(fine,3) : 0;
      // Absolute-age foam memory is continuous across the incoming-wave cycle.
      const residue = foamMemory*Math.exp(-Math.pow((y-coast-spread*0.48)/spread,2))*lace*0.6;
      const body = smooth(baseline-depth*0.10,baseline+depth*0.25,y)*cfg.sea/100;
      const incoming = smooth(front,front+spread,y)*(1-spent)*0.2;
      // Residue replaces the spent breaker instead of adding a second dose of
      // foam (and cream highlights) during the landing overlap.
      const activeFoam = crest*0.9+wake*0.85+spray;
      const foam = clamp(Math.max(activeFoam,residue));
      // Distance-based dissipation, not a clip at the reach line. The fade
      // starts at ~75% of the journey by default, with a slowly irregular edge.
      const shoreMask = 1-smooth(localFadeStart,1,(H-y)/depth);
      const energy = clamp((foam+body*(0.35+n*0.45)+incoming)*shoreMask);
      // Static per-cell thresholds avoid per-frame random flashing.
      const seed = hash(Math.floor(x/cell),Math.floor(y/row));
      const occupancy = clamp(energy*1.65)*cfg.density/100;
      if (seed > occupancy || energy<0.015) continue;
      const value = clamp(foam*0.78+body*0.14+fine*0.16,0,0.999);
      const alpha = clamp((0.18+energy*0.82)*cfg.contrast/100)*shoreMask;
      if (cfg.theme === 'brand-dark') {
        // Wash Blue → Paper Cream highlights, on Ink Navy; no new site tokens.
        // Only the active breaker earns bright highlights; old foam stays blue.
        const highlight = smooth(0.12,0.95,activeFoam)*0.82;
        const rgb = [mix(46,240,highlight),mix(107,227,highlight),mix(184,209,highlight)].map(Math.round);
        water.fillStyle = `rgba(${rgb.join(',')},${alpha})`;
      } else water.fillStyle = light ? `rgb(14 67 142 / ${alpha})` : `rgb(215 228 228 / ${alpha})`;
      water.fillText(ramp[Math.floor(value*ramp.length)],
        x+(fine-0.5)*cell*turbulence, y+(n-0.5)*row*turbulence*0.6);
    }
  }
}
function resize() {
  W = innerWidth; H = innerHeight;
  const dpr = Math.min(devicePixelRatio || 1,2);
  for (const ctx of [water,logo]) {
    ctx.canvas.width = Math.round(W*dpr); ctx.canvas.height = Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  prepareLogo(); drawLogo(); drawWater();
}
function frame(now) {
  time += (last ? Math.min((now-last)/1000,0.05) : 0)*cfg.speed; last = now;
  drawLogo(); drawWater(); frameId = requestAnimationFrame(frame);
}
function playback() {
  cancelAnimationFrame(frameId); last = 0;
  if (!paused && !document.hidden) frameId = requestAnimationFrame(frame);
  summary();
}
// All tuning controls are generated by the project's vendored vanilla DialKit.
const select = (value,options) => ({ type:'select',default:value,options });
const slider = (key) => [cfg[key],...bounds[key]];
const controlPaths = {
  'appearance.treatment':'theme','appearance.logoMask':'mask','appearance.glyphPalette':'palette','appearance.monoFont':'font',
  'appearance.globalCellPx':'cell','logo.logoHeight':'size','logo.motion':'logoMotion',
  'shoreline.reach':'reach','shoreline.fillDensity':'density',
  'shoreline.fadeStartPercent':'fadeStart','shoreline.crestWidthPercent':'crestWidth','shoreline.thicknessVariation':'thicknessVariation',
  'shoreline.travelSpeed':'speed','shoreline.coastRelief':'amplitude','shoreline.foamTurbulence':'turbulence',
  'shoreline.foamSpread':'spread','shoreline.foamPersistence':'foamLife','shoreline.offshoreTexture':'sea','shoreline.inkStrength':'contrast'
};
function panelValues() {
  const values = {};
  for (const [path,key] of Object.entries(controlPaths)) {
    const [folder,field] = path.split('.'); (values[folder] ??= {})[field] = cfg[key];
  }
  return values;
}
async function action(name) {
  if (name === 'reset') {
    Object.assign(cfg,defaults); time=0; kit.setValues(panelValues());
  } else if (name === 'copyLink') {
    setURL();
    try { await navigator.clipboard.writeText(location.href); $('status').textContent = 'Settings link copied. Pause first to share the exact frame.'; }
    catch { $('status').textContent = 'Copy the address bar URL to share these settings.'; }
  } else if (name === 'help') {
    $('status').textContent = 'Global Cell Px sets both grids. Flowing texture moves characters through the fixed artwork; Fixed grid changes only glyphs and intensity. Pause freezes both. Fade Start sets where water dissipation begins; Thickness Variation evens the crest without calming its wake.';
  }
}
try {
  await Promise.all(['letters','badge'].map(async key => {
    const img = new Image(); img.src=`./${key}-mask.png`; await img.decode(); images[key]=img;
  }));
  await Promise.all([document.fonts.load('12px Plex'),document.fonts.load('12px Geist')]);
  DialKit.createDialRoot({ position:'top-right' });
  kit = DialKit.createDialKit('Shoreline study', {
    appearance: {
      treatment:select(cfg.theme,[{value:'dark',label:'Dark / off-white'},{value:'light',label:'Light / WAWE blue'},{value:'brand-dark',label:'Brand dark / navy + blue'}]),
      logoMask:select(cfg.mask,[{value:'letters',label:'Lettering only'},{value:'badge',label:'Circular badge'}]),
      glyphPalette:select(cfg.palette,choices.palette),monoFont:select(cfg.font,choices.font),globalCellPx:slider('cell')
    },
    logo: { logoHeight:slider('size'),motion:select(cfg.logoMotion,[{value:'flow',label:'Flowing texture'},{value:'glyphs',label:'Fixed grid / changing glyphs'}]) },
    shoreline: { reach:slider('reach'),fillDensity:slider('density'),
      fadeStartPercent:slider('fadeStart'),crestWidthPercent:slider('crestWidth'),thicknessVariation:slider('thicknessVariation'),
      travelSpeed:slider('speed'),coastRelief:slider('amplitude'),foamTurbulence:slider('turbulence'),
      foamSpread:slider('spread'),foamPersistence:slider('foamLife'),offshoreTexture:slider('sea'),inkStrength:slider('contrast') },
    paused, compositionGuides:false,
    copyLink:{type:'action',label:'Copy settings link'},reset:{type:'action',label:'Reset study'},help:{type:'action',label:'What do these controls mean?'}
  }, { id:'ascii-shoreline-study',persist:false,defaultCollapsed:true,onAction:action });
  kit.subscribe(values => {
    for (const [path,key] of Object.entries(controlPaths)) {
      const [folder,field] = path.split('.'); cfg[key] = values[folder][field];
    }
    paused = values.paused;
    $('guides').hidden = !values.compositionGuides;
    summary(); setURL(); prepareLogo(); drawLogo(); drawWater(); playback();
  },false);
  summary(); resize(); playback();
  document.body.dataset.ready='true';
  if (qs.has('churn')) $('status').textContent = 'Old churn setting retired. Foam turbulence now changes the water shape, not random character flicker.';
} catch (error) { $('status').textContent = `Prototype failed to load: ${error.message}`; console.error(error); }
reduce.addEventListener('change',() => { if (reduce.matches) { paused=true; kit?.setValue('paused',true); playback(); } });
document.addEventListener('visibilitychange',playback);
window.addEventListener('resize',resize);
