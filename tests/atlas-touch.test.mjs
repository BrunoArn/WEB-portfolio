import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const root=fileURLToPath(new URL('../',import.meta.url));
class Surface {
    listeners=new Map();
    addEventListener(type, fn, options) { const list=this.listeners.get(type)||[];list.push({fn,options});this.listeners.set(type,list); }
    removeEventListener(type,fn) { this.listeners.set(type,(this.listeners.get(type)||[]).filter(item=>item.fn!==fn)); }
    emit(type,event={}) { for(const {fn} of this.listeners.get(type)||[]) fn(event); }
}
function fixture() {
    const window=new Surface(),document=new Surface(),viewport=new Surface(),query=new Surface();
    Object.assign(window,{scrollX:0,scrollY:0});document.hidden=false;query.matches=false;
    let now=0,id=0,intersection;
    const frames=new Map(),context=vm.createContext({console,Float32Array,Float64Array,Math,Number,Array,
        window,document,matchMedia:()=>query,performance:{now:()=>now},PointerEvent:class {},
        requestAnimationFrame:fn=>{frames.set(++id,fn);return id},cancelAnimationFrame:id=>frames.delete(id),
        IntersectionObserver:class {constructor(fn){intersection=fn}observe(){}disconnect(){}},
    });
    const modules=new Map();
    function load(filename) {
        if(modules.has(filename))return modules.get(filename).exports;
        const loaded={exports:{}};modules.set(filename,loaded);
        const source=ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
        vm.runInContext('(function(require,module,exports){'+source+'\n})',context,{filename})(id=>load(resolve(dirname(filename),id+'.ts')),loaded,loaded.exports);
        return loaded.exports;
    }
    const atlas=name=>load(resolve(root,'src/features/atlas/'+name+'.ts'));
    const point=(x,y,id=1)=>({clientX:x,clientY:y,identifier:id});
    const event=(points=[],changed=points,target={closest:()=>null})=>({touches:points,changedTouches:changed,timeStamp:now,target});
    function step(ms=20){now+=ms;const pending=[...frames.values()];frames.clear();for(const fn of pending)fn(now);}
    return {window,document,viewport,query,atlas,point,event,step,frames,intersect:value=>intersection([{isIntersecting:value}])};
}
function touchFixture(){const f=fixture(),calls=[];let allowed=true;const controller=f.atlas('atlas-touch').mountAtlasTouch(f.viewport,{allowed:()=>allowed,begin:p=>calls.push(['begin',p]),move:(p,speed)=>calls.push(['move',p,speed]),end:()=>calls.push(['end']),tap:p=>calls.push(['tap',p])});return {...f,calls,controller,setAllowed:v=>allowed=v,count:type=>calls.filter(item=>item[0]===type).length};}

test('stationary tap fires only on release; every listener is passive',()=>{
 const f=touchFixture(),p=f.point(30,40);f.viewport.emit('touchstart',f.event([p]));assert.equal(f.count('tap'),0);
 f.step(80);f.viewport.emit('touchend',f.event([],[p]));assert.equal(f.count('tap'),1);assert.equal(f.count('move'),0);
 for(const list of f.viewport.listeners.values())for(const {options}of list)assert.equal(options.passive,true);
 f.viewport.emit('pointerup',{});f.viewport.emit('click',{});assert.equal(f.count('tap'),1);
});
test('excursion, long press, scrolling, cancellation and multiple fingers never become taps',()=>{
 for(const kind of ['excursion','long','scroll','cancel','multi','policy']){
  const f=touchFixture(),p=f.point(30,40);f.viewport.emit('touchstart',f.event([p]));
  if(kind==='excursion'){f.step(50);f.viewport.emit('touchmove',f.event([f.point(80,40)]));}
  if(kind==='long')f.step(351);
  if(kind==='scroll')f.window.scrollY=20;
  if(kind==='cancel')f.viewport.emit('touchcancel',f.event([],[p]));
  if(kind==='multi')f.viewport.emit('touchstart',f.event([p,f.point(50,60,2)]));
  if(kind==='policy')f.setAllowed(false);
  f.viewport.emit('touchend',f.event([],[p]));assert.equal(f.count('tap'),0,kind);
 }
});
test('small jitter is a tap, movement is sampled at most once per 16ms and survives pointercancel',()=>{
 const f=touchFixture(),p=f.point(10,20);f.viewport.emit('touchstart',f.event([p]));f.step(40);
 f.viewport.emit('touchmove',f.event([f.point(12,22)]));f.viewport.emit('touchend',f.event([],[f.point(12,22)]));assert.equal(f.count('tap'),1);
 f.viewport.emit('touchstart',f.event([p]));f.step(40);f.viewport.emit('touchmove',f.event([f.point(40,20)]));
 f.viewport.emit('pointercancel',{});
 for(let x=41;x<74;x++){f.step(1);f.viewport.emit('touchmove',f.event([f.point(x,20)]));}
 assert.equal(f.count('move'),3);f.viewport.emit('touchend',f.event([],[p]));assert.equal(f.count('tap'),1);
});
test('controls are excluded; blur, disposal and permission changes clean up',()=>{
 const f=touchFixture(),p=f.point(10,20);f.viewport.emit('touchstart',f.event([p],[p],{closest:selector=>selector==='[data-atlas-project]'?null:{}}));f.viewport.emit('touchend',f.event([],[p]));assert.equal(f.count('tap'),0);
 f.viewport.emit('touchstart',f.event([p]));f.window.emit('blur');f.viewport.emit('touchend',f.event([],[p]));assert.equal(f.count('tap'),0);
 f.controller.dispose();for(const list of f.viewport.listeners.values())assert.equal(list.length,0);assert.equal(f.window.listeners.get('blur').length,0);
});
function motionFixture(){
 const f=fixture(),root={dataset:{selection:'idle'}},canvas={dataset:{},style:{width:'400px'},closest:()=>root,getBoundingClientRect:()=>({left:10,top:20,width:600})};
 const motion=f.atlas('atlas-motion').mountAtlasMotion(canvas,f.viewport,()=>{});
 motion.configure({left:0,top:0,right:400,bottom:400},{width:400,height:400},2,100,200,30,40,[],{cx:-1,cy:-1,sx:.1,sy:.1});
 motion.set({enabled:true,breath:0,pressure:85,mouseRadius:65,returnTime:86,selectionStrength:75});
 const contour={path:[[0,180],[100,180],[200,180],[300,180],[400,180]],closed:false};
 const {line}=motion.prepare(contour.path,contour);
 return {...f,motion,canvas,line,root};
}
test('tap uses inverse raster/world transform and excites the exact contact even at zero speed',()=>{
 const f=motionFixture(),p=f.point(310,320);f.viewport.emit('touchstart',f.event([p]));f.step(80);f.viewport.emit('touchend',f.event([],[p]));
 const impulse=f.line.pointer.impulses.find(i=>i.age>=0);assert(impulse);assert.equal(impulse.contact,135);assert(impulse.value>0);
 assert.equal(f.line.pointer.impulses.filter(i=>i.age>=0).length,1);
 for(let i=0;i<90;i++)f.step();assert(f.line.pointer.impulses.every(i=>i.age<0));assert.equal(f.motion.isRunning(),false);assert.equal(f.frames.size,0);f.motion.dispose();
});
test('touch movement reuses pointer waves, caps energy and ends without following the finger forever',()=>{
 const f=motionFixture();f.viewport.emit('touchstart',f.event([f.point(160,350)]));
 for(let x=170;x<=570;x+=20){f.step(40);f.viewport.emit('touchmove',f.event([f.point(x,350)]));f.step();}
 assert(f.line.pointer.impulses.some(i=>i.age>=0));for(const i of f.line.pointer.impulses)assert(Math.abs(i.value)<=11/2*.85*.65*2.4*(1-Math.exp(-650/450)));
 f.viewport.emit('touchend',f.event([],[f.point(570,350)]));for(let i=0;i<90;i++)f.step();assert.equal(f.motion.isRunning(),false);assert.equal(f.frames.size,0);f.motion.dispose();
});
test('reduced motion, visibility, selection, and teardown reject touches and stop scheduling',()=>{
 for(const kind of ['reduced','hidden','offscreen','selection','dispose']){
  const f=motionFixture(),p=f.point(310,320);f.viewport.emit('touchstart',f.event([p]));
  if(kind==='reduced'){f.query.matches=true;f.query.emit('change');}
  if(kind==='hidden'){f.document.hidden=true;f.document.emit('visibilitychange');}
  if(kind==='offscreen')f.intersect(false);
  if(kind==='selection')f.root.dataset.selection='opening';
  if(kind==='dispose')f.motion.dispose();
  f.viewport.emit('touchend',f.event([],[p]));assert(f.line.pointer.impulses.every(i=>i.age<0),kind);assert.equal(f.frames.size,0,kind);f.motion.dispose();
 }
});
test('mouse formula and cooldown remain unchanged; two slots bound energy and all waves decay',()=>{
 const f=fixture(),{createAtlasString}=f.atlas('atlas-string-response'),{advanceAtlasPointer}=f.atlas('atlas-pointer-impulse');
 const line=createAtlasString({path:[[0,0],[100,0],[200,0]],closed:false});
 advanceAtlasPointer(line,50,10,true,450,85,.02,1,65);
 const first=line.pointer.impulses[0],expected=11*.85*2.4*(1-Math.exp(-1))*(-10/Math.hypot(10,8))*Math.exp(-.5*100/(65*65));
 assert(Math.abs(first.value-expected)<1e-12);assert.equal(first.contact,50);
 advanceAtlasPointer(line,50,10,true,450,85,.02,1,65);assert.equal(line.pointer.impulses.filter(i=>i.age>=0).length,1);
 for(let i=0;i<100;i++)advanceAtlasPointer(line,50,10,false,0,85,.02,1,65);assert(line.pointer.impulses.every(i=>i.age<0));
});

test('holding a still finger after a swipe does not keep the animation alive',()=>{
 const f=motionFixture();f.viewport.emit('touchstart',f.event([f.point(160,350)]));
 for(let x=180;x<=360;x+=20){f.step(40);f.viewport.emit('touchmove',f.event([f.point(x,350)]));f.step();}
 assert(f.line.pointer.impulses.some(i=>i.age>=0));
 for(let i=0;i<100;i++)f.step();assert(f.line.pointer.impulses.every(i=>i.age<0));assert.equal(f.motion.isRunning(),false);assert.equal(f.frames.size,0);f.motion.dispose();
});

const projectTarget={closest:selector=>selector==='[data-atlas-project]'?{}:null};
test('marker taps stay native while a marker-origin swipe excites terrain',()=>{
 const f=touchFixture(),p=f.point(100,400);
 f.viewport.emit('touchstart',f.event([p],[p],projectTarget));f.step(80);f.viewport.emit('touchend',f.event([],[p],projectTarget));assert.equal(f.count('tap'),0);assert.equal(f.count('move'),0);
 f.viewport.emit('touchstart',f.event([p],[p],projectTarget));f.step(40);f.viewport.emit('touchmove',f.event([f.point(100,350)]));assert.equal(f.count('move'),1);f.viewport.emit('touchend',f.event([],[p]));assert.equal(f.count('tap'),0);
});
test('scroll keeps the current finger contact, shares throttling, and ends on release',()=>{
 const f=touchFixture(),p=f.point(100,600);f.viewport.emit('touchstart',f.event([p]));f.step(40);f.viewport.emit('touchmove',f.event([f.point(100,580)]));
 f.window.scrollY=20;f.window.emit('scroll');assert.equal(f.count('move'),1);
 f.step(40);f.viewport.emit('touchmove',f.event([f.point(100,560)]));assert.equal(f.calls.filter(c=>c[0]==='move').at(-1)[1].clientY,560);
 f.step(40);f.window.scrollY=80;f.window.emit('scroll');assert.equal(f.calls.filter(c=>c[0]==='move').at(-1)[1].clientY,560);assert.equal(f.count('move'),3);
 assert.equal(f.window.listeners.get('scroll')[0].options.passive,true);
 f.viewport.emit('touchend',f.event([],[p]));f.step(40);f.window.scrollY=100;f.window.emit('scroll');assert.equal(f.count('move'),3);assert.equal(f.count('tap'),0);
 f.controller.dispose();assert.equal(f.window.listeners.get('scroll').length,0);
});
test('scroll alone generates finite waves without further touchmove events',()=>{
 const f=motionFixture();f.canvas.getBoundingClientRect=()=>({left:10,top:20-f.window.scrollY,width:600});
 const p=f.point(310,320);f.viewport.emit('touchstart',f.event([p]));f.viewport.emit('pointercancel',{});
 for(let i=0;i<8;i++){f.step(40);f.window.scrollY+=20;f.window.emit('scroll');f.step();}
 assert(f.line.pointer.impulses.some(i=>i.age>=0));
 f.viewport.emit('touchend',f.event([],[p]));for(let i=0;i<100;i++)f.step();assert.equal(f.motion.isRunning(),false);assert.equal(f.frames.size,0);f.motion.dispose();
});

test('native scroll supplies energy at the exact current finger position, not a frozen or trailing point',()=>{
 const f=motionFixture();f.canvas.getBoundingClientRect=()=>({left:10,top:20-f.window.scrollY,width:600});
 const contour={path:[[135,100],[135,200],[135,300],[135,400]],closed:false},line=f.motion.prepare(contour.path,contour).line;
 const p=f.point(340,320);f.viewport.emit('touchstart',f.event([p]));
 for(let i=1;i<=6;i++){
  f.step(40);f.viewport.emit('touchmove',f.event([f.point(340,320-20*i)]));
  // The compositor scroll changes after the input event, before the drawing frame.
  f.window.scrollY=20*i;f.window.emit('scroll');f.step(20);
 }
 const active=line.pointer.impulses.filter(i=>i.age>=0);assert(active.length>0);
 for(const impulse of active)assert(Math.abs(impulse.contact-80)<1e-8,'contact must project to world y=180 under the current finger');
 f.viewport.emit('touchend',f.event([],[p]));for(let i=0;i<100;i++)f.step();assert.equal(f.motion.isRunning(),false);f.motion.dispose();
});
