// Narrow deterministic contract probe, not a substitute for watching the study.
// node prototypes/ascii-surge/check.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createMotion, defaults, edgesAt, smooth, mix, clamp } from './motion.js';
const cfg=JSON.parse(fs.readFileSync(new URL('../ascii-opening/approved-opening.json',import.meta.url)));
for (const wait of [0,0.5,2.285,5,30,3600]) {
  const m=createMotion(cfg.speed);
  m.tick(wait,defaults);
  assert.equal(m.snapshot().state,'loading');
  assert.equal(m.snapshot().count,0);
  const clock=m.snapshot().clock;
  assert.equal(m.signalReady(),true);
  assert.equal(m.signalReady(),false);
  assert.equal(m.snapshot().clock,clock);
  assert.equal(m.snapshot().state,'armed');
  const remaining=(m.snapshot().start-clock)/cfg.speed;
  m.tick(remaining+0.001,defaults);
  assert.equal(m.snapshot().state,'surge');
  assert.equal(m.snapshot().count,1);
  m.tick(defaults.washSeconds,defaults);
  assert.equal(m.snapshot().state,'recede');
  m.tick(defaults.recedeSeconds,defaults);
  assert.equal(m.snapshot().state,'settled');
  for (let n=0;n<10;n++) { m.signalReady();m.tick(100,defaults); }
  assert.equal(m.snapshot().count,1);
  m.reset(); assert.equal(m.snapshot().state,'loading');assert.equal(m.snapshot().ready,false);
}
const reduced=createMotion(cfg.speed,true);
assert.equal(reduced.signalReady(),false); reduced.tick(100,defaults);
assert.equal(reduced.snapshot().state,'settled');assert.equal(reduced.snapshot().count,0);
reduced.reset(true);assert.equal(reduced.snapshot().state,'settled');
for (const [W,H,depth] of [[1280,800,192],[390,844,282]]) {
  for (let x=0;x<W;x+=19) {
    let before={front:Infinity,tail:Infinity};
    for(let age=0;age<=7.5;age+=0.05) {
      const e=edgesAt(x,W,H,depth,{...defaults,age});
      assert.ok(e.front<=before.front && e.tail<=before.tail,'edges never move backwards');
      before=e;
    }
  }
}
// Exercise both actual drawWater implementations against the same capturing canvas.
function renderer(continuation) {
  let calls=[];
  const context={canvas:{dataset:{}}, clearRect(){calls=[];}, fillText(g,x,y){
    const ink=this.fillStyle.replace(/[\d.]+/g,n=>String(+Number(n).toFixed(9)));
    calls.push([g,+x.toFixed(7),+y.toFixed(7),ink]);
  }};
  const element={getContext:()=>context};
  const sandbox={Math,URLSearchParams,console,clamp,mix,smooth,edgesAt,cfg,
    water:context,logo:context, document:{getElementById:()=>element,createElement:()=>element},
    location:{search:''}, matchMedia:()=>({matches:false}), getCalls:()=>calls};
  vm.createContext(sandbox);
  const url=continuation ? './field.js' : '../ascii-opening/main.js';
  let source=fs.readFileSync(new URL(url,import.meta.url),'utf8');
  source=continuation ? source.slice(source.indexOf('const palettes'),source.indexOf('const card ='))
    : source.slice(0,source.indexOf("try {\n  await Promise.all(['letters','badge']"));
  vm.runInContext(source+`\n globalThis.measure=(t,s)=>{W=1280;H=800;reachY=608;time=t;${continuation?'transition=s;':''}drawWater();return getCalls();};`,sandbox);
  return sandbox.measure;
}
const baseline=renderer(false), continuation=renderer(true);
for(const clock of [0,0.5,1.4,3.19,3.2,6.8,12,40]) {
  assert.equal(JSON.stringify(continuation(clock,null)),JSON.stringify(baseline(clock)),`opening unchanged at ${clock}`);
}
const takeover=continuation(3.2,{...defaults,age:0}), original=baseline(3.2);
assert.equal(takeover.length,original.length,'takeover glyph count unchanged');
const different=takeover.findIndex((v,i)=>JSON.stringify(v)!==JSON.stringify(original[i]));
assert.equal(different,-1,JSON.stringify({message:'zero-age takeover retains live field',counts:[takeover.length,original.length],actual:takeover[different],expected:original[different]}));
console.log('PASS: indefinite loading; latched readiness; one surge; replay; reduced motion; forward edges; exact waiting kernel and zero-age takeover.');
