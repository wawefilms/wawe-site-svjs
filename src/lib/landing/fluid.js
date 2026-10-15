// @ts-nocheck — retained numerical renderer; typed boundary in runtime.ts.
// A single merged distance-field surface, not connectors behind rigid DOM cards.
// sdBridge/smin and simplex noise adapted from Yousuf Soomro's Viscose carousel
// (MIT), with Ashima Arts / Stefan Gustavson noise (MIT). See FLUID-LICENSE.txt.
const vertex = `#version 300 es
in vec2 position;
void main(){gl_Position=vec4(position,0.,1.);}`;
const fragment = `#version 300 es
precision highp float;
out vec4 color;
uniform vec2 uSize, uOrigin;
uniform float uTime, uK, uWobble, uBlend, uDpr, uLayered, uTopCover, uLogoClip;
uniform int uCount, uLinks;
// rect = centre.xy, half-size.zw; props = radius, rotation, atlas cell, opacity.
uniform vec4 uRect[7], uProps[7], uLinkEnds[6], uLinkShape[6];
uniform float uAspect[7], uTilt[7];
uniform vec4 uLogoEnvelope;
uniform float uLogoRadius;
uniform sampler2D uAtlas;
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec2 mod289(vec2 x){return x-floor(x*(1./289.))*289.;}
vec3 permute(vec3 x){return mod289(((x*34.)+1.)*x);}
float snoise(vec2 v){
 const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
 vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);
 vec2 i1=x0.x>x0.y?vec2(1.,0.):vec2(0.,1.);
 vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod289(i);
 vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
 vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
 m=m*m;m=m*m;vec3 x=2.*fract(p*C.www)-1.;vec3 h=abs(x)-.5;
 vec3 ox=floor(x+.5);vec3 a0=x-ox;
 m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
 vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;
 return 130.*dot(m,g);
}
float box(vec2 p,vec2 b,float r){
 vec2 q=abs(p)-b+r;return min(max(q.x,q.y),0.)+length(max(q,0.))-r;
}
float smin(float a,float b,float k){
 if(k<.001)return min(a,b);
 float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);
}
float bridge(vec2 p,vec4 ends,vec4 shape){
 vec2 ba=ends.zw-ends.xy;float len=length(ba);if(len<.01)return 10000.;
 vec2 dir=ba/len,nrm=vec2(-dir.y,dir.x),q=p-(ends.xy+ends.zw)*.5;
 float along=dot(q,dir),across=dot(q,nrm);
 float h=clamp(along/len+.5,0.,1.),bell=sin(3.14159265*h);
 across-=shape.z*bell*nrm.y;
 float r=mix(shape.y,shape.x,pow(1.-bell,1.7));
 return max(abs(along)-len*.5,abs(across)-r);
}
vec3 artwork(vec2 uv,float cell){
 // Inset prevents neighbouring atlas cells bleeding into liquid edge colours.
 vec2 grid=vec2(mod(cell,4.),floor(cell/4.));
 return texture(uAtlas,(grid+clamp(uv,.003,.997))/vec2(4.,2.)).rgb;
}
void main(){
 vec2 p=vec2(gl_FragCoord.x,uSize.y-gl_FragCoord.y)/uDpr+uOrigin;
 float distance=10000.,near0=10000.,near1=10000.;
 vec3 c0=vec3(0.),c1=vec3(0.);
 float fields[7];vec3 colours[7];
 for(int i=0;i<7;i++){
  if(i>=uCount)break;
  vec4 r=uRect[i],pr=uProps[i];vec2 q=p-r.xy;
  fields[i]=10000.;colours[i]=vec3(0.);
  if(min(r.z,r.w)<.001)continue;
  float ca=cos(pr.y),sa=sin(pr.y);q=vec2(q.x*ca+q.y*sa,-q.x*sa+q.y*ca);
  if(uTilt[i]!=0.){
   // Y rotation projects (x,y) to (x*cos(t),y)*D/(D+x*sin(t)).
   // Invert once for BOTH the silhouette and UVs; the centre stays anchored.
   float ct=cos(uTilt[i]),st=sin(uTilt[i]),D=max(r.z,r.w)*5.;
   float inv=1./max(ct-q.x*st/D,.001);
   q=vec2(q.x,q.y*ct)*inv;
  }
  // As in Viscose, deform the union, not the artwork or each card's perimeter.
  float di=box(q,r.zw,min(pr.x,min(r.z,r.w)));
  if(pr.z>5.5){
   di=max(di,p.x-uLogoClip);
   if(uLogoEnvelope.z>0.)di=max(di,box(p-uLogoEnvelope.xy,uLogoEnvelope.zw,uLogoRadius));
  }
  fields[i]=di;
  distance=smin(distance,di,uK);
  vec2 uv=q/(2.*r.zw)+.5;
  float frameAspect=r.z/r.w,sourceAspect=uAspect[int(pr.z)];
  if(frameAspect>sourceAspect)uv.y=(uv.y-.5)*sourceAspect/frameAspect+.5;
  else uv.x=(uv.x-.5)*frameAspect/sourceAspect+.5;
  vec3 c=artwork(uv,pr.z);colours[i]=c;
  if(di<near0){near1=near0;c1=c0;near0=di;c0=c;}
  else if(di<near1){near1=di;c1=c;}
 }
 for(int i=0;i<6;i++){
  if(i>=uLinks)break;
  distance=smin(distance,bridge(p,uLinkEnds[i],uLinkShape[i]),uLinkShape[i].w);
 }
 distance+=snoise(p*.019+vec2(uTime*.22,-uTime*.17))*uWobble;
 float aa=clamp(fwidth(distance),.5/uDpr,1./uDpr);
 float alpha=1.-smoothstep(-aa,aa,distance);if(alpha<.002)discard;
 vec3 col=mix(c1,c0,smoothstep(-uBlend,uBlend,near1-near0));
 // Nearest-surface colour alone hides smaller nested cards. Composite materials
 // in birth order INSIDE the union, with a soft advancing boundary for arrivals.
 for(int i=0;i<7;i++){
  if(i>=uCount)break;
  float coverage=(1.-smoothstep(-uBlend,uBlend,fields[i]))*uProps[i].w*uLayered;
  col=mix(col,colours[i],coverage);
 }
 // Once the incoming face is complete it owns the WHOLE outline, including
 // antialiasing and the displaced rim. Viscosity cannot expose an older image.
 if(uCount>0)col=mix(col,colours[uCount-1],uTopCover);
 color=vec4(col,alpha);
}`;

export function createFluidSurface() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true });
  let program, texture, buffer, uniforms, available = !!gl, warning = '', origin = { x: 0, y: 0 };
  let latest = { renderer: gl ? 'webgl2-sdf' : 'fallback', warning: gl ? '' : 'WebGL2 unavailable: simplified card fallback.' };
  const cell = 512, stamp = document.createElement('canvas'); stamp.width = stamp.height = cell;
  const stampCtx = stamp.getContext('2d');
  const cache = Array(7).fill(null);
  let settledKey = '', pixelRatio = 1;
  function initialize() {
    const compile = (type, source) => {
      const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader); gl.deleteShader(shader); throw new Error(error);
      }
      return shader;
    };
    const vs = compile(gl.VERTEX_SHADER, vertex), fs = compile(gl.FRAGMENT_SHADER, fragment);
    program = gl.createProgram(); gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    uniforms = Object.fromEntries(['uSize','uOrigin','uDpr','uLayered','uTopCover','uLogoClip','uLogoEnvelope','uLogoRadius','uTime','uK','uWobble','uBlend','uCount','uLinks','uRect','uProps','uLinkEnds','uLinkShape','uAspect','uTilt','uAtlas']
      .map(name => [name, gl.getUniformLocation(program, ['uRect','uProps','uLinkEnds','uLinkShape','uAspect','uTilt'].includes(name) ? `${name}[0]` : name)]));
    texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, cell * 4, cell * 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.uniform1i(uniforms.uAtlas, 0); cache.fill(null);
    settledKey = '';
  }
  const onLost = event => { event.preventDefault(); available = false; warning = 'Fluid context lost: simplified card fallback.'; };
  const onRestored = () => {
    try { initialize(); available = true; warning = ''; } catch (error) { warning = error.message; }
  };
  if (gl) {
    try { initialize(); } catch (error) { available = false; warning = `Fluid shader unavailable: ${error.message}`; }
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
  }
  function upload(id, image) {
    const time = image.currentTime ?? -1;
    // currentTime changes before a seek has decoded its new frame. Do not stamp
    // the old pixels with the new time and then skip the actual seeked frame.
    if (image.seeking && cache[id]?.image === image) return;
    if (!image.seeking && cache[id]?.image === image && cache[id].time === time) return;
    stampCtx.clearRect(0, 0, cell, cell); stampCtx.drawImage(image, 0, 0, cell, cell);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, (id % 4) * cell, Math.floor(id / 4) * cell, gl.RGBA, gl.UNSIGNED_BYTE, stamp);
    cache[id] = image.seeking ? null : { image, time };
  }
  return {
    info: () => ({ ...latest, renderer: available ? latest.renderer : 'fallback', warning: warning || latest.warning }),
    draw(ctx, model, images, aspects) {
      if (!available || !model.cards.length) return false;
      const { fluid, layout } = model;
      const cards = [...(model.logoCard ? [model.logoCard] : []), ...model.cards].filter(c => c.visible !== false);
      if (!cards.length) return false;
      const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
      const key = model.phase === 'settled' ? JSON.stringify([dpr, layout.W, layout.H, cards.map(c => [c.id, c.rect, c.rotation, c.tilt ?? 0, c.opacity])]) : '';
      if (key && key === settledKey && cards.every(c => cache[c.id]?.image === images[c.id] && cache[c.id].time === (images[c.id].currentTime ?? -1) && !images[c.id].seeking)) {
        ctx.drawImage(canvas, origin.x, origin.y, canvas.width / pixelRatio, canvas.height / pixelRatio); return true;
      }
      settledKey = '';
      // Shade only the strip/stack envelope, never the entire hero/viewport.
      // Bound the near edge's perspective enlargement, including in-plane rotation.
      // Flat cards keep the original envelope (and identical settled rasterization).
      const projectionPadding = Math.max(...cards.map(c => {
        const tilt = c.tilt ?? 0;
        if (!tilt) return 0;
        const hw = c.rect.w / 2, hh = c.rect.h / 2;
        const distance = Math.max(hw, hh) * 5;
        if (!distance) return 0;
        const scale = 1 / (1 - Math.abs(Math.sin(tilt)) * hw / distance);
        const ca = Math.abs(Math.cos(c.rotation)), sa = Math.abs(Math.sin(c.rotation));
        const projectedHalfWidth = Math.abs(Math.cos(tilt)) * hw;
        return Math.max(0, scale * (ca * projectedHalfWidth + sa * hh) - hw,
          scale * (sa * projectedHalfWidth + ca * hh) - hh);
      }));
      const padding = fluid.merge * 2 + fluid.wobble * 3 + 14 + projectionPadding;
      const x = Math.max(0, Math.floor(Math.min(...cards.map(c => c.rect.x)) - padding));
      const y = Math.max(0, Math.floor(Math.min(...cards.map(c => c.rect.y)) - padding));
      const right = Math.min(layout.W, Math.ceil(Math.max(...cards.map(c => c.rect.x + c.rect.w)) + padding));
      const bottom = Math.min(layout.H, Math.ceil(Math.max(...cards.map(c => c.rect.y + c.rect.h)) + padding));
      pixelRatio = dpr;
      const width = Math.max(64, Math.ceil((right - x) * dpr / 64) * 64), height = Math.max(64, Math.ceil((bottom - y) * dpr / 64) * 64);
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      origin = { x, y };
      gl.viewport(0, 0, width, height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
      cards.forEach(c => upload(c.id, images[c.id]));
      const rects = new Float32Array(28), props = new Float32Array(28);
      cards.forEach((c, i) => {
        const r = c.rect;
        rects.set([r.x + r.w / 2, r.y + r.h / 2, r.w / 2, r.h / 2], i * 4);
        props.set([r.r, c.rotation, c.id, c.opacity], i * 4);
      });
      const ends = new Float32Array(24), shapes = new Float32Array(24);
      fluid.links.forEach((l, i) => { ends.set(l.ends, i * 4); shapes.set(l.shape, i * 4); });
      gl.uniform2f(uniforms.uSize, width, height); gl.uniform2f(uniforms.uOrigin, x, y);
      gl.uniform1f(uniforms.uDpr, dpr);
      gl.uniform1f(uniforms.uLayered, fluid.layered ?? 1);
      gl.uniform1f(uniforms.uTopCover, fluid.topCover ?? 0);
      gl.uniform1f(uniforms.uLogoClip, fluid.logoClip ?? layout.W);
      const envelope = fluid.logoEnvelope;
      gl.uniform4fv(uniforms.uLogoEnvelope, envelope ? [envelope.x + envelope.w / 2, envelope.y + envelope.h / 2, envelope.w / 2, envelope.h / 2] : [0, 0, 0, 0]);
      gl.uniform1f(uniforms.uLogoRadius, envelope?.r ?? 0);
      gl.uniform1f(uniforms.uTime, model.time); gl.uniform1f(uniforms.uK, fluid.merge);
      gl.uniform1f(uniforms.uWobble, fluid.wobble); gl.uniform1f(uniforms.uBlend, fluid.blend);
      gl.uniform1i(uniforms.uCount, cards.length); gl.uniform1i(uniforms.uLinks, fluid.links.length);
      gl.uniform4fv(uniforms.uRect, rects); gl.uniform4fv(uniforms.uProps, props);
      gl.uniform4fv(uniforms.uLinkEnds, ends); gl.uniform4fv(uniforms.uLinkShape, shapes);
      gl.uniform1fv(uniforms.uAspect, aspects);
      const tilts = new Float32Array(7); tilts.set(cards.map(c => c.tilt ?? 0));
      gl.uniform1fv(uniforms.uTilt, tilts);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      ctx.drawImage(canvas, x, y, width / dpr, height / dpr);
      latest = { renderer: 'webgl2-sdf', warning: '', width, height, dpr, merge: fluid.merge, wobble: fluid.wobble, links: fluid.links.length };
      settledKey = key;
      return true;
    },
    sample(points) {
      if (!available) return [];
      return points.map(([x, y]) => {
        const pixel = new Uint8Array(4), px = Math.floor((x - origin.x) * pixelRatio), py = canvas.height - 1 - Math.floor((y - origin.y) * pixelRatio);
        if (px >= 0 && py >= 0 && px < canvas.width && py < canvas.height) gl.readPixels(px, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        return Array.from(pixel);
      });
    },
    loseContext() { gl?.getExtension('WEBGL_lose_context')?.loseContext(); },
    dispose() { canvas.removeEventListener('webglcontextlost', onLost); canvas.removeEventListener('webglcontextrestored', onRestored); if (gl) { gl.deleteTexture(texture); gl.deleteBuffer(buffer); gl.deleteProgram(program); gl.getExtension('WEBGL_lose_context')?.loseContext(); } }
  };
}
