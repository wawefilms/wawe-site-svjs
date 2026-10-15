// THROWAWAY: all review controls live in DialKit; ?variant=erosion|carry|fade.
import opening from '../ascii-opening/approved-opening.json';
import { createField } from './field.js';
import { createMotion, defaults, variants } from './motion.js';
const $=id=>document.getElementById(id);
const query=new URLSearchParams(location.search);
let variant=variants.includes(query.get('variant')) ? query.get('variant') : 'erosion';
let paused=query.get('paused')==='1', raf=0, last=null, initialized=false, kit;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const motion=createMotion(opening.speed,reduce.matches);
const settings={...defaults};
const field=createField(Object.freeze({...opening}),$('water').getContext('2d'),$('logo').getContext('2d'),$('reveal').getContext('2d'));
const descriptions={
  loading:'Waiting for Assets Ready. Opening loops indefinitely.',
  armed:'Ready latched. The next off-screen entrance becomes the surge.',
  surge:'One upward surge. Only touched glyphs dissolve.',
  recede:'The same body leaves upward, uncovering the placeholder.',
  settled:'Placeholder only. Replay clears readiness; stacking comes later.'
};
let previousStatus='';
function draw() {
  if (!initialized) return;
  const s=motion.snapshot();
  field.render(s.clock,s.segment ? {...s.segment,variant} : null,s.state==='settled');
  const status=`${s.state.toUpperCase()} · ${s.count} surge${paused ? ' · PAUSED' : ''}\n${s.reduced ? 'Reduced motion: settled, no animation.' : descriptions[s.state]}`;
  // No DOM/textarea updates or DialKit notifications in the per-frame hot path.
  if (status!==previousStatus) {
    previousStatus=status; document.body.dataset.state=s.state;
    $('scene').textContent=s.state==='settled' ? 'Showreel placeholder — stacking comes later' : `WAWE FILMS — ${s.state}`;
    kit?.setValue('review.state',status);
  }
}
function frame(now) {
  // Visible-page elapsed time, not a capped per-frame step. Slow frames must not
  // slow the entire film down. Visibility/pause reset last instead of catching up.
  const dt=last===null ? 0 : Math.max(0,(now-last)/1000); last=now;
  motion.tick(dt,settings); draw();
  if (motion.snapshot().state!=='settled') raf=requestAnimationFrame(frame);
}
function playback() {
  cancelAnimationFrame(raf); last=null; draw();
  if (initialized && !paused && !document.hidden && motion.snapshot().state!=='settled') raf=requestAnimationFrame(frame);
}
function ready() { if (initialized) { motion.signalReady(); draw(); } }
function setPaused(value=true) { paused=value;kit?.setValue('review.paused',value);playback(); }
function replay() {motion.reset(reduce.matches);previousStatus='';setPaused(false);}
function selectVariant(value) {
  if(!variants.includes(value)) return;
  variant=value;
  const url=new URL(location.href);url.searchParams.set('variant',value);history.replaceState(null,'',url);
  kit?.setValue('review.logoContact',value);draw();
}
window.addEventListener('resize',()=>{if(initialized){field.resize();draw();}});
document.addEventListener('visibilitychange',playback);
reduce.addEventListener('change',()=>{if(reduce.matches){motion.skip();previousStatus='';playback();}});
async function loadReviewUI() {
  // DialKit is review tooling, never an opening-paint dependency.
  const css=document.createElement('link');css.rel='stylesheet';css.href='../vendor/dialkit/styles.css';document.head.append(css);
  await new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src='../vendor/dialkit/browser.global.js';
    script.onload=resolve;script.onerror=()=>reject(new Error('DialKit failed to load'));document.head.append(script);
  });
  DialKit.createDialRoot({position:'top-right'});
  kit=DialKit.createDialKit('Opening → surge',{
    review:{state:previousStatus,logoContact:{type:'select',default:variant,options:[
      {value:'erosion',label:'A · Local erosion'},{value:'carry',label:'B · Carried-away glyphs'},{value:'fade',label:'C · Soft contact fade'}]},
      paused,assetsReady:{type:'action',label:'Assets Ready'},replay:{type:'action',label:'Replay / reset'}},
    surge:{_collapsed:true,washSeconds:[settings.washSeconds,1,5,0.1],crestBand:[settings.crestBand,18,90,1],edgeRelief:[settings.edgeRelief,0,80,1],bodyInk:[settings.bodyInk,30,100,1]},
    contact:{_collapsed:true,contactBand:[settings.contactBand,30,180,1],carry:[settings.carry,20,100,1]},
    recede:{_collapsed:true,recedeSeconds:[settings.recedeSeconds,1,5,0.1],revealBand:[settings.revealBand,30,220,1]}
  },{id:'ascii-surge-study',persist:false,defaultCollapsed:false,onAction(name){
    if(name==='review.assetsReady') ready();
    if(name==='review.replay') replay();
  }});
  // Vendored DialKit has a text control but no read-only display type. Scope this
  // display-only treatment to our own state textarea; don't modify the vendor.
  const stateInput=document.querySelector('.dialkit-text-input');
  stateInput.readOnly=true;stateInput.setAttribute('aria-live','polite');
  kit.subscribe(values=>{
    Object.assign(settings,values.surge,values.contact,values.recede);
    if(values.review.logoContact!==variant) selectVariant(values.review.logoContact);
    if(values.review.paused!==paused) setPaused(values.review.paused);
  },false);
  $('status').hidden=true;
  document.body.dataset.controlsReady='true';
}
try {
  await field.load(); initialized=true;document.body.dataset.ready='true';playback();
  window.surgeStudy={snapshot:()=>({...motion.snapshot(),variant,paused}),ready,replay,pause:setPaused,
    step(seconds=1/60){if(!paused) throw new Error('Pause before stepping');motion.tick(seconds,settings);draw();},selectVariant};
  // Let the actual opening paint before downloading/initialising review tooling.
  requestAnimationFrame(()=>setTimeout(()=>loadReviewUI().catch(error=>{
    $('status').hidden=false;$('status').textContent=error.message;console.error(error);
  }),0));
} catch(error) {$('status').textContent=`Study failed to load: ${error.message}`;console.error(error);}
