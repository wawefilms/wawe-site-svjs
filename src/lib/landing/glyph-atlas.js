// @ts-nocheck — retained numerical renderer; typed boundary in runtime.ts.
// Runtime-generated glyph atlas: zero downloaded images or new dependencies.
// Batch the full-screen transition into one GPU draw; retain Canvas2D fallback.
export function createGlyphAtlas(cell,dpr,font,palette,waterCanvas) {
  const tile=Math.ceil(cell*2),size=Math.ceil(tile*dpr),levels=64;
  const atlas=document.createElement('canvas');
  atlas.width=size*palette.length;atlas.height=size*levels;
  const ctx=atlas.getContext('2d');
  ctx.font=`400 ${cell*1.4*dpr}px ${font}`;ctx.textAlign='center';ctx.textBaseline='middle';
  for(let level=0;level<levels;level++) {
    const h=level/(levels-1)*0.82;
    ctx.fillStyle=`rgb(${Math.round(46+194*h)} ${Math.round(107+120*h)} ${Math.round(184+25*h)})`;
    for(let i=0;i<palette.length;i++) ctx.fillText(palette[i],i*size+size/2,level*size+size/2);
  }
  const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');canvas.hidden=true;
  const gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false});
  let gpu=!!gl,program,buffer,texture,view,pointSize,data=new Float32Array(0),count=0;
  const onLost = event => { event.preventDefault(); gpu=false; canvas.hidden=true; };
  if(gl) {
    const shader=(type,source)=>{
      const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) {gl.deleteShader(s);throw Error('Glyph shader compilation failed');}
      return s;
    };
    try {
      const vs=shader(gl.VERTEX_SHADER,`attribute vec4 glyph;attribute float opacity;
        uniform vec2 viewport;uniform float pointSize;varying vec2 uv;varying float alpha;
        void main(){gl_Position=vec4(glyph.x/viewport.x*2.-1.,1.-glyph.y/viewport.y*2.,0.,1.);
        gl_PointSize=pointSize;uv=glyph.zw;alpha=opacity;}`);
      const fs=shader(gl.FRAGMENT_SHADER,`precision highp float;uniform sampler2D atlas;
        varying vec2 uv;varying float alpha;
        void main(){vec4 ink=texture2D(atlas,(uv+gl_PointCoord)/vec2(${palette.length}.,${levels}.));
        gl_FragColor=vec4(ink.rgb,ink.a*alpha);}`);
      program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
      gl.deleteShader(vs);gl.deleteShader(fs);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error('Glyph shader link failed');
      gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      const glyph=gl.getAttribLocation(program,'glyph'),opacity=gl.getAttribLocation(program,'opacity');
      gl.enableVertexAttribArray(glyph);gl.vertexAttribPointer(glyph,4,gl.FLOAT,false,20,0);
      gl.enableVertexAttribArray(opacity);gl.vertexAttribPointer(opacity,1,gl.FLOAT,false,20,16);
      texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);
      view=gl.getUniformLocation(program,'viewport');pointSize=gl.getUniformLocation(program,'pointSize');
      gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      waterCanvas.after(canvas);
      canvas.addEventListener('webglcontextlost',onLost);
    } catch {gpu=false;}
  }
  return {
    begin(active,W,H) {
      count=0;
      if(!gpu) return;
      if(canvas.hidden===active) canvas.hidden=!active;
      if(!active) return;
      if(data.length===0 || canvas.width!==Math.round(W*dpr)||canvas.height!==Math.round(H*dpr)) {
        canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
        data=new Float32Array((Math.ceil(W/cell)+2)*(Math.ceil(H/(cell*1.18))+3)*5);
      }
      gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(view,W,H);gl.uniform1f(pointSize,tile*dpr);
    },
    draw(ctx,index,highlight,alpha,x,y) {
      const level=Math.round(highlight/0.82*(levels-1));
      if(gpu) {data[count++]=x;data[count++]=y;data[count++]=index;data[count++]=level;data[count++]=alpha;}
      else {ctx.globalAlpha=alpha;ctx.drawImage(atlas,index*size,level*size,size,size,x-tile/2,y-tile/2,tile,tile);}
    },
    flush() {if(gpu && count){gl.bufferData(gl.ARRAY_BUFFER,data.subarray(0,count),gl.DYNAMIC_DRAW);gl.drawArrays(gl.POINTS,0,count/5);}},
    hide(){canvas.hidden=true;},
    dispose(){canvas.removeEventListener('webglcontextlost',onLost);canvas.remove();if(gl){gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();}}
  };
}
