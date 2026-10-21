// Development-only material study. Samples the existing canvas; never renders a second graph.
export function openGlassReview() {
  const root = document.createElement('section'); root.id = 'desktop-glass-review';
  root.innerHTML = `<header><p>DESKTOP MATERIAL STUDY</p><h1>Three ways to feel like glass.</h1><p>Live graph behind each sample. Native iOS reference at right.</p><a href="/">Return to the website →</a></header>
    <div class="glass-study-samples">
      <article><p>A · CLEAR REFLECTIVE GLASS</p><div class="desktop-guide-capsule desktop-glass-reflective"><span class="desktop-guide-number">1</span><strong>Spin to explore</strong></div><small>Backdrop blur, edge highlights, blue halo.</small></article>
      <article><p>B · TRANSPARENT HALO</p><div class="desktop-guide-capsule desktop-glass-halo"><span class="desktop-guide-number">1</span><strong>Spin to explore</strong></div><small>Crisp, light, and consistent across browsers.</small></article>
      <article><p>C · REFRACTION STUDY</p><div class="desktop-guide-capsule glass-study-refraction"><canvas aria-hidden="true"></canvas><span class="desktop-guide-number">1</span><strong>Spin to explore</strong></div><small data-refraction-status>Sampling the existing graph canvas.</small></article>
    </div><figure><img src="/artifacts/quick-start-motion-2026-09-20/native-glass.jpg" alt="Native iOS Quick Start capsule above the sphere"><figcaption>Native SwiftUI reference</figcaption></figure>`;
  document.body.append(root); document.body.classList.add('glass-study-active');
  const source = document.getElementById('graph-canvas');
  const target = root.querySelector('canvas');
  let gl;
  try { gl = target.getContext('webgl', { alpha: true, antialias: false }); } catch { /* Optional optical study. */ }
  if (!gl) { root.querySelector('[data-refraction-status]').textContent = 'WebGL unavailable; use the CSS alternatives.'; return; }
  const shader = (type, code) => {
    const s = gl.createShader(type); gl.shaderSource(s, code); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s;
  };
  const program = gl.createProgram();
  gl.attachShader(program, shader(gl.VERTEX_SHADER, 'attribute vec2 position; varying vec2 uv; void main(){uv=(position+1.0)*0.5;gl_Position=vec4(position,0.0,1.0);}'));
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, `precision mediump float; varying vec2 uv; uniform sampler2D scene; uniform vec2 size;
    void main(){
      vec2 p=(uv-.5)*size; float radius=size.y*.5; vec2 center=vec2(clamp(p.x,-size.x*.5+radius,size.x*.5-radius),0.0);
      vec2 d=p-center; float dist=length(d); vec2 normal=d/max(dist,1.0);
      float rim=smoothstep(radius-20.0,radius,dist);
      vec2 sampleUV=uv-normal*rim*10.0/size;
      vec3 color=texture2D(scene,vec2(sampleUV.x,1.0-sampleUV.y)).rgb;
      float light=pow(max(0.0,dot(normal,normalize(vec2(-.4,1.0)))),5.0)*rim;
      color=color*.8+vec3(.08,.12,.17)*.3+vec3(.2,.24,.29)*light;
      gl_FragColor=vec4(color,1.0-smoothstep(radius-1.0,radius,dist));
    }`));
  gl.linkProgram(program); if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Refraction shader link failed');
  gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program,'position'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const patch=document.createElement('canvas'); const ctx=patch.getContext('2d');
  const costs=[]; let last=0; let frame; let stopped=false;
  target.addEventListener('webglcontextlost', event => { event.preventDefault(); stopped=true; cancelAnimationFrame(frame); root.querySelector('[data-refraction-status]').textContent='Refraction unavailable. CSS samples remain usable.'; });
  const paint=now=>{
    if(stopped || !root.isConnected) return;
    frame=requestAnimationFrame(paint);
    if(document.hidden || now-last<33) return;last=now;
    const start=performance.now(); const rect=target.getBoundingClientRect(); const sourceRect=source.getBoundingClientRect();
    if(!rect.width || !source.width || !sourceRect.width) return;
    const ratio=Math.min(devicePixelRatio,1.5); const w=Math.round(rect.width*ratio);const h=Math.round(rect.height*ratio);
    if(patch.width!==w || patch.height!==h){patch.width=target.width=w;patch.height=target.height=h;gl.viewport(0,0,w,h);gl.uniform2f(gl.getUniformLocation(program,'size'),w,h);}
    ctx.clearRect(0,0,w,h);
    ctx.drawImage(source,(rect.left-sourceRect.left)*source.width/sourceRect.width,(rect.top-sourceRect.top)*source.height/sourceRect.height,rect.width*source.width/sourceRect.width,rect.height*source.height/sourceRect.height,0,0,w,h);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,patch);gl.drawArrays(gl.TRIANGLES,0,6);
    costs.push(performance.now()-start);if(costs.length>120)costs.shift();
    if(costs.length===120) root.dataset.refractionMeanMs=(costs.reduce((sum,x)=>sum+x,0)/costs.length).toFixed(2);
  };
  frame=requestAnimationFrame(paint);
  window.addEventListener('pagehide',()=>{stopped=true;cancelAnimationFrame(frame);gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);},{once:true});
}
