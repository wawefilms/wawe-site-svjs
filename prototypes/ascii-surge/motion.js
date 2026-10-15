// Throwaway transition model. Only signalReady() can arm a surge; time cannot.
export const clamp = (n,a=0,b=1) => Math.max(a,Math.min(b,n));
export const mix = (a,b,t) => a+(b-a)*t;
export const smooth = (a,b,x) => { const t=clamp((x-a)/(b-a)); return t*t*(3-2*t); };
export const defaults = Object.freeze({ washSeconds:2.1, recedeSeconds:1.7,
  crestBand:42, edgeRelief:35, bodyInk:85, contactBand:95, carry:65, revealBand:110 });
export const variants = ['erosion','carry','fade'];
const PERIOD=6.8, OFFSET=3.6;
export function createMotion(speed, reduced=false) {
  let clock=0, ready=false, start=null, settings=null, count=0, skipped=reduced;
  return {
    signalReady() {
      if (ready || skipped) return false;
      ready=true;
      // Finish the live lap; promote its next off-screen entrance. Never reset clock.
      start=(Math.floor((clock+OFFSET)/PERIOD)+1)*PERIOD-OFFSET;
      return true;
    },
    tick(seconds, config) {
      if (skipped || this.snapshot().state==='settled') return;
      clock+=Math.max(0,seconds)*speed;
      if (ready && clock>=start && !settings) { settings={...config}; count++; }
    },
    reset(reduce=false) { clock=0; ready=false; start=null; settings=null; count=0; skipped=reduce; },
    skip() { skipped=true; },
    snapshot() {
      const age=settings ? Math.max(0,(clock-start)/speed) : 0;
      const state=skipped ? 'settled' : !ready ? 'loading' : !settings ? 'armed'
        : age<settings.washSeconds ? 'surge'
        : age<settings.washSeconds+settings.recedeSeconds ? 'recede' : 'settled';
      return { state, clock, ready, count, age, start, reduced:skipped,
        segment:settings ? {...settings, age} : null };
    }
  };
}
export function edgesAt(x,W,H,depth,t) {
  const relief=Math.min(t.edgeRelief,depth*0.18)*(0.55*Math.sin(x*0.009)+0.3*Math.sin(x*0.026+1.8)+0.15*Math.sin(x*0.06));
  // Margin includes every soft band: both ends enter/leave wholly off-screen.
  const margin=Math.max(180,t.revealBand,t.contactBand*1.8,t.crestBand*4)+t.edgeRelief;
  const from=H+Math.max(depth*0.35,margin);
  const to=-margin;
  const front=mix(H+depth*0.35,to,clamp(t.age/t.washSeconds))+relief;
  const tail=mix(from,to,clamp((t.age-t.washSeconds)/t.recedeSeconds))+relief;
  return {front,tail};
}
