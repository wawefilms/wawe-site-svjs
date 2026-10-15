// Browser-only renderer budget probe; use at the same viewport/DPR before and after.
// await (await import('./perf.js')).measure()
export async function measure({assertBudget=false}={}) {
  const study=window.surgeStudy;
  const {defaults}=await import('./motion.js');
  const rows=[];
  for (const phase of ['loading','surge','recede']) {
    study.replay();study.pause();
    const duration=phase==='surge'?defaults.washSeconds:defaults.recedeSeconds;
    if (phase!=='loading') {study.ready();study.step(3.2/1.4+(phase==='surge'?duration*0.24:defaults.washSeconds+duration*0.11));}
    const durations=[];
    for(let i=0;i<75;i++) {
      const start=performance.now();study.step(phase==='loading'?1/120:duration*0.16/75);
      const cost=performance.now()-start;
      if(i>=15) durations.push(cost);
      // Yield to the compositor; don't benchmark a giant blocking JS task.
      await new Promise(requestAnimationFrame);
    }
    durations.sort((a,b)=>a-b);
    rows.push({phase,medianMs:+durations[30].toFixed(2),p95Ms:+durations[57].toFixed(2)});
  }
  const result={viewport:[innerWidth,innerHeight,devicePixelRatio],rows};
  console.table(rows);
  if(assertBudget && rows.some(row=>row.p95Ms>16.7)) throw Error('60Hz frame budget exceeded: '+JSON.stringify(result));
  return result;
}

// Regression for the former 50ms delta cap: real elapsed time must not be discarded.
export async function measureClock() {
  const study=window.surgeStudy;study.replay();
  await new Promise(requestAnimationFrame);
  const start=performance.now(), clock=study.snapshot().clock;
  const timer=setInterval(()=>{const end=performance.now()+100;while(performance.now()<end){}},120);
  try {
    await new Promise(resolve=>setTimeout(resolve,1200));
    clearInterval(timer);await new Promise(requestAnimationFrame);
    study.pause();
    const wallSeconds=(performance.now()-start)/1000;
    const animationSeconds=(study.snapshot().clock-clock)/1.4;
    const ratio=animationSeconds/wallSeconds;
    if(ratio<0.9 || ratio>1.1) throw Error('Animation clock stretched: '+JSON.stringify({wallSeconds,animationSeconds,ratio}));
    return {wallSeconds,animationSeconds,ratio};
  } finally {clearInterval(timer);study.pause();}
}
