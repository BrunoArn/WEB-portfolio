import { atlasSelectionDuration } from "./atlas-motion-settings";
import { atlasRibbonStride, type mountAtlasMotion } from "./atlas-motion";

type Motion = ReturnType<typeof mountAtlasMotion>;
type Ribbon = { index: number; mesh: ReturnType<Motion["prepare"]> };
const vertexStride = 15; // Position, normal/arc/mask, four grid guards, strand, edge/limit.

type View = { scale: number; x: number; y: number; width: number; height: number; pixelRatio: number };

const vertexSource = `#version 300 es
precision highp float;
layout(location=0) in vec2 position;
layout(location=1) in vec4 normalArc;
layout(location=2) in vec4 protection;
layout(location=3) in vec2 strand;
layout(location=4) in vec3 edge;
uniform sampler2D states;
uniform vec4 grid;
uniform vec2 cells;
uniform vec4 motion;
uniform vec3 response;
uniform vec3 view;
uniform vec2 size;
uniform float pixelRatio;
out vec2 uv;
out float opacity;
out vec2 edgeDistance;
const float PI = 3.141592653589793;
vec2 breathe(vec2 p) {
  float t = motion.x;
  return motion.y * vec2(sin(p.y*.007+t*.43)*.65+sin(p.x*.004-p.y*.003-t*.29)*.35,
    cos(p.x*.006-t*.37)*.65+sin(p.y*.005+p.x*.003+t*.23)*.35);
}
float arcDistance(float a, float b, vec4 state) {
  float d=abs(a-b);
  return state.w > .5 ? min(d,state.z-d) : d;
}
float packet(float delta, vec4 state) {
  float d=state.w > .5 ? state.z/PI*sin(PI*delta/state.z) : delta;
  return exp(-.5*pow(d/(32.*motion.z),2.));
}
void main() {
  vec4 state=texelFetch(states,ivec2(0,int(strand.x)),0);
  vec4 strike=texelFetch(states,ivec2(1,int(strand.x)),0);
  vec2 g=clamp((position-grid.xy)/grid.zw,vec2(0.),cells-vec2(.00001));
  vec2 f=fract(g), base=grid.xy+floor(g)*grid.zw;
  vec2 ambient=mix(mix(breathe(base)*protection.x,breathe(base+vec2(grid.z,0.))*protection.y,f.x),
    mix(breathe(base+vec2(0.,grid.w))*protection.z,breathe(base+grid.zw)*protection.w,f.x),f.y);
  float hover=state.y*exp(-.5*pow(arcDistance(normalArc.z,state.x,state)/(response.x*1.3*motion.z),2.));
  float impulse=0.;
  if(motion.w>=0. && abs(strike.y)>0.) {
    float age=motion.w, distance=arcDistance(normalArc.z,strike.x,state);
    float front=(35.+age*300.)*motion.z;
    float tail=clamp((${atlasSelectionDuration}-age)/.4,0.,1.);
    float envelope=(1.-exp(-age/.02))*exp(-age/(.26+response.y/100.*.3))*tail*tail*(3.-2.*tail);
    impulse=strike.y*envelope*(packet(distance-front,state)+packet(distance+front,state))*response.z/25.;
  }
  float bend=(hover+impulse)*normalArc.w;
  float ratio=bend/edge.z, square=ratio*ratio;
  bend=bend/sqrt(sqrt(1.+square*square));
  vec2 p=(position+ambient+normalArc.xy*(bend+sign(edge.x)/(view.x*pixelRatio)))*view.x+view.yz;
  edgeDistance=vec2(sign(edge.x)*(edge.y*view.x*pixelRatio+1.),edge.y*view.x*pixelRatio);
  uv=p/size;
  opacity=strand.y;
  gl_Position=vec4(uv*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);
}`;
const fragmentSource = `#version 300 es
precision highp float;
uniform sampler2D colors;
in vec2 uv;
in float opacity;
in vec2 edgeDistance;
out vec4 pixel;
void main() {
  vec4 color=texture(colors,uv);
  float coverage=clamp((edgeDistance.y-abs(edgeDistance.x))/max(fwidth(edgeDistance.x),.001)+.5,0.,1.);
  float alpha=color.a*opacity*coverage;
  pixel=vec4(color.rgb*alpha,alpha);
}`;

/** WebGL renderer: the approved ribbon meshes stay resident on the GPU. */
export function createAtlasWebGL(canvas: HTMLCanvasElement, fallback: () => void) {
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: true, depth: false, stencil: false });
  if (!gl) { queueMicrotask(fallback); return null; }
  const shaders: WebGLShader[] = [];
  const program = gl.createProgram();
  const buffer = gl.createBuffer(), indices = gl.createBuffer(), vao = gl.createVertexArray();
  const colors = gl.createTexture(), states = gl.createTexture();
  let disposed = false, count = 0, ribbons: Ribbon[] = [], statePixels = new Float32Array(8), currentView: View;
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  const release = () => {
    shaders.forEach(shader => gl.deleteShader(shader)); gl.deleteProgram(program);
    gl.deleteBuffer(buffer); gl.deleteBuffer(indices); gl.deleteVertexArray(vao); gl.deleteTexture(colors); gl.deleteTexture(states);
  };
  if (!program || !buffer || !indices || !vao || !colors || !states) { release(); queueMicrotask(fallback); return null; }
  for (const [type, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]] as const) {
    const shader = gl.createShader(type);
    if (!shader) { release(); queueMicrotask(fallback); return null; }
    shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader); gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("Atlas WebGL initialization:", gl.getProgramInfoLog(program), ...shaders.map(shader => gl.getShaderInfoLog(shader)));
    release(); queueMicrotask(fallback); return null;
  }
  const uniforms = Object.fromEntries(["states", "grid", "cells", "motion", "response", "view", "size", "colors", "pixelRatio"].map(name => [name, gl.getUniformLocation(program, name)]));
  gl.useProgram(program); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  for (const [location, size, offset] of [[0,2,0],[1,4,2],[2,4,6],[3,2,10],[4,3,12]]) {
    gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location,size,gl.FLOAT,false,vertexStride*4,offset*4);
  }
  gl.uniform1i(uniforms.colors,0); gl.uniform1i(uniforms.states,1);
  for (const [unit, texture, filter] of [[0, colors, gl.LINEAR],[1, states, gl.NEAREST]] as const) {
    gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filter); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,filter);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  }
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  function lost(event: Event) { event.preventDefault(); if (!disposed) fallback(); }
  canvas.addEventListener("webglcontextlost",lost);
  return {
    prepare(next: Ribbon[], colorMap: HTMLCanvasElement, motion: Motion, view: View) {
      if (disposed || gl.isContextLost()) return;
      if (next.length > maxTextureSize || colorMap.width > maxTextureSize || colorMap.height > maxTextureSize || gl.drawingBufferWidth !== canvas.width || gl.drawingBufferHeight !== canvas.height) { fallback(); return; }
      ribbons = next; currentView = view;
      const field = motion.state();
      const vertexCount = ribbons.reduce((sum, ribbon) => sum + ribbon.mesh.mesh.length / atlasRibbonStride, 0);
      const indexCount = ribbons.reduce((sum, { mesh: { mesh, line } }) => sum + (mesh.length / (atlasRibbonStride * 2) - (line.closed ? 0 : 1)) * 6, 0);
      const data = new Float32Array(vertexCount * vertexStride), elements = new Uint32Array(indexCount);
      let vertexCursor = 0, indexCursor = 0;
      for (let lineIndex=0; lineIndex<ribbons.length; lineIndex++) {
        const { mesh: { mesh, line }, index } = ribbons[lineIndex], n=mesh.length/(atlasRibbonStride*2);
        const start = vertexCursor/vertexStride;
        function vertex(i: number) {
          const at=i*atlasRibbonStride, cell=mesh[at+2], below=cell+field.nx+1;
          const v = vertexCursor, opposite = (2*n-1-i)*atlasRibbonStride;
          data[v] = mesh[at]; data[v+1] = mesh[at+1];
          data[v+2] = mesh[at+3]; data[v+3] = mesh[at+4];
          data[v+4] = mesh[at+5]; data[v+5] = mesh[at+6];
          data[v+6] = field.protection[cell]; data[v+7] = field.protection[cell+1];
          data[v+8] = field.protection[below]; data[v+9] = field.protection[below+1];
          data[v+10] = lineIndex; data[v+11] = index%4===0 ? .77 : .42;
          data[v+12] = i<n ? 1 : -1;
          data[v+13] = Math.hypot(mesh[at]-mesh[opposite],mesh[at+1]-mesh[opposite+1])/2;
          data[v+14] = line.bendLimits[i<n ? i : 2*n-1-i];
          vertexCursor += vertexStride;
        }
        for (let i=0;i<2*n;i++) vertex(i);
        // Two triangles per segment; closed contours also join their last pair.
        for (let i=0; i<(line.closed?n:n-1); i++) {
          const j=(i+1)%n, a=i,b=2*n-1-i,c=j,d=2*n-1-j;
          elements[indexCursor++] = start+a; elements[indexCursor++] = start+b;
          elements[indexCursor++] = start+c; elements[indexCursor++] = start+c;
          elements[indexCursor++] = start+b; elements[indexCursor++] = start+d;
        }
      }
      count=elements.length;
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
      gl.bindVertexArray(vao);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indices);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,elements,gl.STATIC_DRAW);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,colors);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,colorMap);
      statePixels=new Float32Array(Math.max(1,ribbons.length)*8);
      gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,states);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,2,Math.max(1,ribbons.length),0,gl.RGBA,gl.FLOAT,statePixels);
      canvas.dataset.gpuVertices=String(vertexCount);
    },
    paint(motion: Motion) {
      if (disposed || !currentView || gl.isContextLost()) return;
      const field=motion.state();
      ribbons.forEach(({mesh:{line}},i) => {
        const offset = i*8;
        statePixels[offset] = line.contact; statePixels[offset+1] = line.value;
        statePixels[offset+2] = line.length; statePixels[offset+3] = line.closed ? 1 : 0;
        statePixels[offset+4] = line.strike?.contact ?? 0; statePixels[offset+5] = line.strike?.value ?? 0;
      });
      gl.useProgram(program);gl.bindVertexArray(vao);gl.viewport(0,0,canvas.width,canvas.height);
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,states);
      gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,2,Math.max(1,ribbons.length),gl.RGBA,gl.FLOAT,statePixels);
      gl.uniform4f(uniforms.grid,field.bounds.left,field.bounds.top,field.stepX,field.stepY);
      gl.uniform2f(uniforms.cells,field.nx,field.ny);
      gl.uniform4f(uniforms.motion,field.time,field.active?field.settings.breath/100*9/field.scale:0,1/field.scale,field.active?field.pulseAge:-1);
      gl.uniform3f(uniforms.response,field.settings.mouseRadius,field.settings.returnTime,field.settings.selectionStrength);
      gl.uniform3f(uniforms.view,currentView.scale,currentView.x,currentView.y);
      gl.uniform2f(uniforms.size,currentView.width,currentView.height);
      gl.uniform1f(uniforms.pixelRatio,currentView.pixelRatio);
      gl.drawElements(gl.TRIANGLES,count,gl.UNSIGNED_INT,0);
    },
    dispose() { disposed=true;canvas.removeEventListener("webglcontextlost",lost);release(); },
  };
}