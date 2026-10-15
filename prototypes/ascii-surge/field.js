// THROWAWAY fork of ascii-opening/main.js: retain its exact waiting kernel.
// The reference study is intentionally untouched. cfg is the locked JSON, never panel values.
import { edgesAt, smooth, mix, clamp } from './motion.js';
import { createGlyphAtlas } from './glyph-atlas.js';
// Optional study scene uses the exact same water/reveal mask; the default stays unchanged.
export function createField(cfg, water, logo, reveal, paintScene = null) {
const palettes = { ascii: '.,:;~=+*oO#@' };
const fonts = { plex: 'Plex, monospace' };
let time = 0, W = 0, H = 0, logoBottom = 0, reachY = 0, transition = null;
let atlas=null;
const maskCanvas = document.createElement('canvas');
const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
const images = {};
const hash = (x,y) => { const n = Math.sin(x*127.1+y*311.7)*43758.5453; return n-Math.floor(n); };
function noise(x,y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = smooth(0,1,x-ix), fy = smooth(0,1,y-iy);
  return mix(mix(hash(ix,iy),hash(ix+1,iy),fx),mix(hash(ix,iy+1),hash(ix+1,iy+1),fx),fy);
}
// Dense water samples revisit the same small noise lattices. Cache whole integer
// ranges, then interpolate via four array reads rather than twelve sin/hash calls.
const lattices=[];
function lattice(slot,minX,maxX,minY,maxY) {
  const x0=Math.floor(minX),x1=Math.floor(maxX)+1,y0=Math.floor(minY),y1=Math.floor(maxY)+1;
  const key=`${x0}:${x1}:${y0}:${y1}`;
  if(lattices[slot]?.key===key) return lattices[slot].sample;
  const width=x1-x0+1,data=new Float64Array(width*(y1-y0+1));
  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) data[(y-y0)*width+x-x0]=hash(x,y);
  const sample=(x,y)=>{
    const ix=Math.floor(x),iy=Math.floor(y),fx=smooth(0,1,x-ix),fy=smooth(0,1,y-iy);
    const p=(iy-y0)*width+ix-x0;
    return mix(mix(data[p],data[p+1],fx),mix(data[p+width],data[p+width+1],fx),fy);
  };
  lattices[slot]={key,sample};return sample;
}
function edges(x) { return edgesAt(x, W, H, H-reachY, transition); }
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
  if (transition && transition.age>=transition.washSeconds) return;
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
    let alpha = 1, ox = 0, oy = 0;
    if (transition) {
      const { front } = edges(x0+x);
      const wet = Math.max(0, y0+y-front);
      const dissolve = smooth(0, transition.contactBand, wet);
      if (transition.variant === 'erosion') {
        alpha = 1-smooth(seed*0.7, Math.min(1,seed*0.7+0.3),dissolve);
      } else if (transition.variant === 'carry') {
        alpha = 1-smooth(0,transition.contactBand*1.8,wet);
        oy = -wet*transition.carry/100;
        ox = Math.sin(seed*12+wet*0.025)*wet*0.14;
      } else alpha = 1-dissolve;
    }
    if (alpha < 0.005) continue;
    logo.fillStyle=`rgb(${ink} / ${(0.86+drift*0.14)*alpha})`;
    logo.fillText(ramp[Math.floor(level*ramp.length)],x0+x+ox,y0+y+oy);
  }
}
function drawWater() {
  water.clearRect(0,0,W,H);
  const depth = H-reachY;
  if (depth <= 0) return;
  const cell = cfg.cell, row = cell*1.18, ramp = palettes[cfg.palette];
  water.canvas.dataset.cellSize = String(cell);
  setFont(water,cell);
  const period = 6.8, clock = time+3.6, cycle = Math.floor(clock/period);
  // No second loop after takeover. Blend before the original breaker can dissipate.
  const phase = transition ? Math.min(0.5,transition.age*cfg.speed/period) : clock%period/period;
  const takeover = transition ? smooth(0,Math.min(0.35,transition.washSeconds*0.15),transition.age) : 0;
  if (takeover>0 && !atlas) atlas=createGlyphAtlas(cell,Math.min(devicePixelRatio||1,2),fonts[cfg.font],ramp,water.canvas);
  atlas?.begin(takeover>0,W,H);
  const relief = Math.min(cfg.amplitude,depth*0.65);
  const spread = depth*(0.12+cfg.spread/100*0.36);
  const turbulence = cfg.turbulence/100;
  const variation = cfg.thicknessVariation/100;
  const fadeStart = cfg.fadeStart/100;
  const life = 1.8+cfg.foamLife/100*3.8;
  const travel = time*24;
  const waterWarp=lattice(0,0,W*0.013,(-row+travel)*0.012,(H+row+travel)*0.012);
  const waterNoise=lattice(1,0,(W+35)*0.024,(-row+travel)*0.025,(H+row+travel)*0.025);
  const waterFine=lattice(2,-35*0.085,W*0.085,(-row+travel*1.35)*0.078,(H+row+travel*1.35)*0.078);
  const light = cfg.theme === 'light';
  let foamMemory = 0;
  for (let previous=0; previous<4; previous++) {
    const age = (phase+previous-0.72)*period;
    if (age >= 0) foamMemory += smooth(0,0.8,age)*Math.exp(-age/life)*(1-smooth(18,24,age));
  }
  // A persistent offshore body + ONE incoming breaker, sampled as one scalar field.
  // Old foam persists as a dissipating wake, not another independently moving wave.
  // Preserve the exact waiting-grid coordinates (including floating-point sums).
  // Starting the loop at zero would change floor(y/row) thresholds on some rows.
  const rows=[];
  const firstY=Math.ceil((reachY+cell)/row)*row;
  for (let y=firstY;y<H+row;y+=row) rows.push(y);
  if (transition) for (let y=firstY-row;y>=-row;y-=row) rows.unshift(y);
  for (let x=cell/2;x<W;x+=cell) {
    const coast = reachY+relief*(0.5+0.25*Math.sin(x*0.009+time*0.7)
      +0.15*Math.sin(x*0.026-time*0.95)+0.1*Math.sin(x*0.06+time*0.6));
    const baseline = coast+depth*0.50;
    const localPhase = phase + 0.025*Math.sin(x*0.009+cycle*1.7);
    const advance = 1-Math.pow(1-clamp(localPhase/0.74),1.5);
    const curl = relief*turbulence*(noise(x*0.016,time*0.3)-0.5);
    // Extra offscreen margin guarantees every crest enters from below.
    // Continue through the dissipation band instead of parking at the old limit.
    const openingFront = mix(H+depth*0.35,coast+spread*0.18,advance)+curl
      -depth*(1-fadeStart)*smooth(0.6,1,localPhase);
    const edge = transition ? edges(x) : null;
    const front = edge ? mix(openingFront,edge.front,takeover) : openingFront;
    const breaking = mix(smooth(0.35,0.75,localPhase),0.85,takeover);
    const spent = smooth(0.74,1.01,localPhase)*(1-takeover);
    const crestWidth = mix(Math.max(cell*0.9,depth*0.045)*(1+breaking*1.5)*cfg.crestWidth/100,
      transition?.crestBand ?? 0,takeover);
    // One displacement per column preserves a coherent crest cross-section.
    // Higher variation blends back toward the old per-cell folding.
    const crestBend = (noise(x*0.024,time*0.35)-0.5)*turbulence*crestWidth*2;
    const localFadeStart = clamp(fadeStart+(noise(x*0.012,time*0.18)-0.5)*(1-fadeStart)*0.4,0,0.98);
    for (const y of rows) {
      // Reject provably invisible cells before the expensive noise evaluations.
      const seed = hash(Math.floor(x/cell),Math.floor(y/row));
      if (seed > cfg.density/100) continue;
      const revealAmount = edge ? smooth(-transition.revealBand/2,transition.revealBand/2,y-edge.tail) : 0;
      const shoreMask = mix(1-smooth(localFadeStart,1,(H-y)/depth),1,takeover)*(1-revealAmount);
      if (shoreMask === 0) continue;
      const d = y-front;
      // Domain-warped coherent noise carries foam along the shoreward current.
      const warp = waterWarp(x*0.013,(y+travel)*0.012)*turbulence*35;
      const n = waterNoise((x+warp)*0.024,(y+travel)*0.025);
      const fine = waterFine((x-warp)*0.085,(y+travel*1.35)*0.078);
      const lace = smooth(0.24,0.72,n*0.7+fine*0.3);
      const crestDistance = d+mix(crestBend,(n-0.5)*turbulence*crestWidth*2,variation);
      const crestTexture = mix(0.9+lace*0.1,0.4+lace*0.6,variation);
      const crest = Math.exp(-Math.pow(crestDistance/crestWidth,2))*(1-spent)*crestTexture;
      const wake = d>0 ? Math.exp(-d/spread)*(1-spent)*(0.3+breaking*0.7)*lace : 0;
      const spray = d<0 ? Math.exp(d/(crestWidth*1.7))*breaking*(1-spent)*Math.pow(fine,3) : 0;
      // Absolute-age foam memory is continuous across the incoming-wave cycle.
      const residue = foamMemory*Math.exp(-Math.pow((y-coast-spread*0.48)/spread,2))*lace*0.6;
      const body = mix(smooth(baseline-depth*0.10,baseline+depth*0.25,y)*cfg.sea/100,
        smooth(front,front+crestWidth*2,y)*(transition?.bodyInk ?? 0)/100,takeover);
      const incoming = smooth(front,front+spread,y)*(1-spent)*0.2;
      // Residue replaces the spent breaker instead of adding a second dose of
      // foam (and cream highlights) during the landing overlap.
      const activeFoam = crest*0.9+wake*0.85+spray;
      const foam = clamp(Math.max(activeFoam,residue));
      // Distance-based dissipation, not a clip at the reach line. The fade
      // starts at ~75% of the journey by default, with a slowly irregular edge.
      const energy = clamp((foam+body*(0.35+n*0.45)+incoming)*shoreMask);
      // Static per-cell thresholds avoid per-frame random flashing.
      const occupancy = clamp(energy*1.65)*cfg.density/100;
      if (seed > occupancy || energy<0.015) continue;
      const value = clamp(foam*0.78+body*0.14+fine*0.16,0,0.999);
      const alpha = clamp((0.18+energy*0.82)*cfg.contrast/100)*shoreMask;
      if (cfg.theme === 'brand-dark') {
        // Wash Blue → Paper Cream highlights, on Ink Navy; no new site tokens.
        // Only the active breaker earns bright highlights; old foam stays blue.
        const highlight = smooth(0.12,0.95,activeFoam)*0.82;
        if (takeover>0 && atlas) {
          atlas.draw(water,Math.floor(value*ramp.length),highlight,alpha,
            x+(fine-0.5)*cell*turbulence,y+(n-0.5)*row*turbulence*0.6);
          continue;
        }
        const rgb = [mix(46,240,highlight),mix(107,227,highlight),mix(184,209,highlight)].map(Math.round);
        water.fillStyle = `rgba(${rgb.join(',')},${alpha})`;
      } else water.fillStyle = light ? `rgb(14 67 142 / ${alpha})` : `rgb(215 228 228 / ${alpha})`;
      water.fillText(ramp[Math.floor(value*ramp.length)],
        x+(fine-0.5)*cell*turbulence, y+(n-0.5)*row*turbulence*0.6);
    }
  }
  atlas?.flush();
  water.globalAlpha=1;
}
const card = document.createElement('canvas');
const revealMask=document.createElement('canvas');
let revealMaskKey='';
function prepareRevealMask() {
  const t=transition, band=t.revealBand;
  const pad=Math.ceil(Math.max(180,band,t.contactBand*1.8,t.crestBand*4)+t.edgeRelief*3+band);
  const key=`${W}:${H}:${H-reachY}:${band}:${pad}:${t.edgeRelief}`;
  if (key!==revealMaskKey) {
    revealMaskKey=key; revealMask.width=W; revealMask.height=H+pad*2;
    const ctx=revealMask.getContext('2d'), origin=edges(0).tail;
    for (let x=0;x<W;x+=3) {
      const tail=pad+edges(x+1.5).tail-origin;
      const gradient=ctx.createLinearGradient(0,tail-band/2,0,tail+band/2);
      for(let i=0;i<=16;i++) gradient.addColorStop(i/16,`rgba(0,0,0,${smooth(0,1,i/16)})`);
      ctx.fillStyle=gradient;ctx.fillRect(x,0,3,revealMask.height);
    }
  }
  return pad;
}
function prepareCard() {
  card.width=W; card.height=H;
  const ctx=card.getContext('2d');
  const width=Math.min(W*0.84, (H-180)*16/9,1200), height=width*9/16;
  const x=(W-width)/2,y=(H-height)/2;
  ctx.fillStyle='#12355e'; ctx.fillRect(x,y,width,height);
  ctx.strokeStyle='#52789f'; ctx.strokeRect(x+0.5,y+0.5,width-1,height-1);
  ctx.fillStyle='#f0e3d1'; ctx.textAlign='center';
  ctx.font='12px Plex, monospace'; ctx.fillText('SHOWREEL / PLACEHOLDER',W/2,H/2);
  ctx.fillStyle='#a6bdd5'; ctx.font='10px Plex, monospace';
  ctx.fillText('Stacking comes later',W/2,H/2+25);
}
function drawReveal(settled) {
  reveal.clearRect(0,0,W,H);
  if (!settled && !transition) return;
  if (settled) { reveal.drawImage(card,0,0,W,H); return; }
  if (transition.age<=transition.washSeconds) return;
  // Geometry is translation-only: build the soft shared edge once, not hundreds
  // of gradients on every frame. The moving mask stays aligned with water.
  const pad=prepareRevealMask();
  reveal.drawImage(revealMask,0,edges(0).tail-pad);
  reveal.globalCompositeOperation='source-in';
  reveal.drawImage(card,0,0,W,H);
  reveal.globalCompositeOperation='source-over';
}
function resize() {
  W = innerWidth; H = innerHeight;
  atlas?.dispose(); atlas=null;
  const dpr = Math.min(devicePixelRatio || 1,2);
  for (const ctx of [water,logo,reveal]) {
    ctx.canvas.width = Math.round(W*dpr); ctx.canvas.height = Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  prepareLogo(); prepareCard();
  // Only the optional stacking painter needs a high-resolution scene surface.
  // The accepted placeholder, water geometry and soft reveal mask are unchanged.
  if (paintScene) {
    card.width=Math.round(W*dpr); card.height=Math.round(H*dpr);
    card.getContext('2d').setTransform(card.width/W,0,0,card.height/H,0,0);
  }
}
return {
  async load() {
    const img=new Image(); img.src=new URL('../ascii-opening/badge-mask.png',import.meta.url).href;
    await Promise.all([img.decode(),document.fonts.load('12px Plex')]);
    images.badge=img; resize();
  },
  resize,
  render(clock,segment,settled=false) {
    time=clock; transition=segment;
    if (paintScene && (settled || segment?.age >= segment?.washSeconds)) {
      const ctx=card.getContext('2d'); ctx.clearRect(0,0,W,H);
      paintScene(ctx,W,H);
    }
    drawReveal(settled);
    if (settled) { atlas?.hide(); water.clearRect(0,0,W,H); logo.clearRect(0,0,W,H); }
    else { drawLogo(); drawWater(); }
  }
};
}
