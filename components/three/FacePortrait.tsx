"use client";

import { Component, Suspense, useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import Image from "next/image";
import * as THREE from "three";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { createPortraitGeometry } from "@/lib/three/portraitGeometry";
import { createPortraitEyeMaterial } from "@/lib/three/portraitEyeMaterial";
import { portraitBlink, stepPortraitSpring } from "@/lib/three/portraitMotion";
import { useDevicePerformance } from "@/hooks/useDevicePerformance";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { MaterialTier } from "@/lib/three/materials";
import { cn } from "@/lib/utils";

const PORTRAIT = "/memoji/avatar.webp";
// One frontal portrait only supports so much turn: past roughly 35 degrees the
// projection stretches the ear and far cheek. Staying inside that keeps every
// reachable pose convincing.
const YAW_LIMIT = 0.56;
const PITCH_LIMIT = 0.36;
type Interaction = {
  yaw: number; pitch: number; gazeX: number; gazeY: number;
  manual: boolean; dragging: boolean; moved: boolean; nodAt: number;
  renderedYaw: number; renderedPitch: number; blinkRequest: number;
  pointer: { x: number; y: number } | null;
  anchor: { x: number; y: number } | null;
};
const bound = (value: number, limit: number) => THREE.MathUtils.clamp(value, -limit, limit);

/** A closed, textured 3D reconstruction, continuously rotated in WebGL. */
export default function FacePortrait({ className }: { className?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const input = useRef<Interaction>({ yaw:0, pitch:0, gazeX:0, gazeY:0, manual:false, dragging:false, moved:false, nodAt:-1, renderedYaw:0, renderedPitch:0, blinkRequest:0, pointer:null, anchor:null });
  const gesture = useRef({ id:-1, type:"", x:0, y:0, yaw:0, pitch:0, captured:false });
  const touchReturn = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  const profile = useDevicePerformance();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const captionId = useId();
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => setFailed(true), []);
  const onPose = useCallback((yaw:number,pitch:number) => {
    input.current.renderedYaw=yaw;
    input.current.renderedPitch=pitch;
  }, []);
  const reset = useCallback(() => {
    if(touchReturn.current) clearTimeout(touchReturn.current);
    touchReturn.current=null;
    const state = input.current;
    state.yaw = state.pitch = state.gazeX = state.gazeY = 0;
    state.nodAt = -1;
    state.manual = true;
    state.anchor = state.pointer;
  }, []);

  useEffect(() => { reducedRef.current = reduced; if (reduced) reset(); }, [reduced, reset]);
  useEffect(() => () => { if(touchReturn.current) clearTimeout(touchReturn.current); }, []);
  useEffect(() => {
    const look = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !container.current || reducedRef.current) return;
      const state = input.current;
      state.pointer = { x:event.clientX, y:event.clientY };
      if (state.dragging) return;
      if (state.manual) {
        if (!state.anchor) { state.anchor = state.pointer; return; }
        if (Math.hypot(event.clientX-state.anchor.x, event.clientY-state.anchor.y) <= 10) return;
        if(touchReturn.current) clearTimeout(touchReturn.current);
        touchReturn.current=null;
        state.manual = false;
      }
      const rect = container.current.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      // Keep a useful gaze range across the whole page, rather than reaching
      // the maximum turn as soon as the pointer leaves the portrait.
      state.gazeX = bound((event.clientX-rect.left-rect.width/2)/Math.max(rect.width*1.1,window.innerWidth*0.5),1);
      state.gazeY = bound((event.clientY-rect.top-rect.height/2)/Math.max(rect.height,window.innerHeight*0.5),1);
    };
    const blur = () => {
      input.current.dragging = false;
      gesture.current.id = -1;
    };
    window.addEventListener("pointermove",look,{passive:true});
    window.addEventListener("blur",blur);
    return () => { window.removeEventListener("pointermove",look); window.removeEventListener("blur",blur); };
  }, []);

  const claim = () => {
    if(touchReturn.current) clearTimeout(touchReturn.current);
    touchReturn.current=null;
    const state = input.current;
    if (!state.manual && !reducedRef.current) {
      state.yaw = state.renderedYaw;
      state.pitch = state.renderedPitch;
    }
    state.manual = true;
    state.anchor = state.pointer;
    state.nodAt = -1;
  };
  const nod = () => {
    if (reducedRef.current) return;
    input.current.nodAt=performance.now();
    input.current.blinkRequest++;
  };
  const finish = (event: React.PointerEvent<HTMLDivElement>, cancelled = false) => {
    if (event.pointerId !== gesture.current.id) return;
    input.current.dragging=false;
    input.current.manual=true;
    input.current.anchor=input.current.pointer;
    if (cancelled) input.current.moved=true;
    gesture.current.id=-1;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if(!cancelled && gesture.current.type!=="mouse" && input.current.moved && !reducedRef.current) {
      touchReturn.current=setTimeout(reset,2400);
    }
  };

  return (
    <div ref={container} className={cn("relative mx-auto aspect-square w-full",className)}>
      <div aria-hidden className="pointer-events-none absolute inset-[12%] rounded-full bg-accent-soft blur-3xl" />
      {(!ready || failed) && <div className="pointer-events-none absolute inset-[5%]"><Image src={PORTRAIT} alt="" fill loading="eager" sizes="(min-width:1024px) 40vw,272px" className="object-contain" /></div>}
      <div
        ref={surface}
        role={failed ? "img" : "button"}
        tabIndex={failed ? -1 : 0}
        aria-label={failed ? "Memoji portrait with swept brown hair and hazel eyes" : reduced ? "Interactive 3D Memoji. Drag or swipe to turn, use arrow keys to rotate, and Escape to reset." : "Interactive 3D Memoji. Move the pointer to guide its gaze, drag or swipe to turn. Use arrow keys to rotate, Enter to say hello, and Escape to reset."}
        aria-describedby={captionId}
        data-face-state={failed ? "fallback" : ready ? "ready" : "loading"}
        data-face-renderer="webgl"
        data-cursor={ready && !failed ? "drag" : undefined}
        className="relative size-full rounded-full [touch-action:pan-y] focus-visible:outline-offset-4"
        onPointerDown={(event) => {
          if (event.button!==0 || !event.isPrimary || failed) return;
          const state=input.current;
          claim();
          state.moved=false;
          gesture.current={id:event.pointerId,type:event.pointerType,x:event.clientX,y:event.clientY,yaw:state.yaw,pitch:state.pitch,captured:event.pointerType==="mouse"};
          if (event.pointerType==="mouse") { event.currentTarget.setPointerCapture(event.pointerId); state.dragging=true; }
        }}
        onPointerMove={(event) => {
          const start=gesture.current;
          if (event.pointerId!==start.id) return;
          const dx=event.clientX-start.x, dy=event.clientY-start.y;
          if (!start.captured) {
            if (Math.abs(dy)>Math.abs(dx) && Math.abs(dy)>7) { start.id=-1; input.current.moved=true; return; }
            if (Math.abs(dx)<7) return;
            start.captured=true;
            event.currentTarget.setPointerCapture(event.pointerId);
            input.current.dragging=true;
          }
          input.current.moved ||= Math.abs(dx)+Math.abs(dy)>5;
          const width=event.currentTarget.getBoundingClientRect().width;
          input.current.yaw=bound(start.yaw+dx/Math.max(width,1)*1.4,YAW_LIMIT);
          if (start.type==="mouse") input.current.pitch=bound(start.pitch+dy/Math.max(width,1)*1.1,PITCH_LIMIT);
        }}
        onPointerUp={(event)=>finish(event)}
        onPointerCancel={(event)=>finish(event,true)}
        onLostPointerCapture={(event)=>finish(event,true)}
        onClick={()=>{ if (!input.current.moved) { claim(); nod(); } }}
        onKeyDown={(event)=>{
          if (!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Enter"," ","Home","Escape"].includes(event.key)) return;
          event.preventDefault(); claim();
          const state=input.current;
          if (event.key==="ArrowLeft") state.yaw=bound(state.yaw-0.14,YAW_LIMIT);
          if (event.key==="ArrowRight") state.yaw=bound(state.yaw+0.14,YAW_LIMIT);
          if (event.key==="ArrowUp") state.pitch=bound(state.pitch-0.1,PITCH_LIMIT);
          if (event.key==="ArrowDown") state.pitch=bound(state.pitch+0.1,PITCH_LIMIT);
          if (event.key==="Enter" || event.key===" ") nod();
          if (event.key==="Home" || event.key==="Escape") reset();
        }}
      >
        {profile && !failed && <FaceBoundary onError={onFailure}>
          <Canvas
            dpr={[1,Math.min(profile.maxDpr,1.75)]}
            gl={{alpha:true,antialias:true,powerPreference:"low-power"}}
            fallback={<span className="sr-only">3D preview unavailable.</span>}
            onCreated={({gl})=>{gl.setClearColor(0x000000,0);gl.outputColorSpace=THREE.SRGBColorSpace;}}
            style={{opacity:ready ? 1 : 0,touchAction:"pan-y"}}
            aria-hidden
          >
            <FitCamera />
            <Suspense fallback={null}><PortraitModel input={input} surface={surface} tier={profile.tier} reduced={reduced} onReady={onReady} onPose={onPose} /></Suspense>
            <CanvasLifecycle container={container} onContextLost={onFailure} />
          </Canvas>
        </FaceBoundary>}
      </div>
      <div className="absolute -bottom-7 inset-x-0 flex items-center justify-center gap-3 text-xs text-fg-muted">
        <p id={captionId} className="whitespace-nowrap">{failed ? "Memoji portrait" : reduced ? "Drag or use arrow keys" : <><span className="sm:hidden [@media(pointer:coarse)]:hidden">Drag to turn</span><span className="hidden sm:inline [@media(pointer:coarse)]:hidden">Move to look · drag to turn</span><span className="hidden [@media(pointer:coarse)]:inline">Swipe to turn</span></>}</p>
        {!failed && !reduced && <button type="button" onClick={()=>{claim();nod();}} className="shrink-0 whitespace-nowrap rounded-full border border-line-strong px-2.5 py-1 transition-colors hover:text-fg">Say hello</button>}
        {!failed && <button type="button" onClick={reset} className="shrink-0 whitespace-nowrap rounded-full border border-line-strong px-2.5 py-1 transition-colors hover:text-fg">Reset</button>}
        {failed && <button type="button" onClick={()=>{useLoader.clear(THREE.TextureLoader,PORTRAIT);setReady(false);setFailed(false);}} className="rounded-full border border-line-strong px-2.5 py-1 transition-colors hover:text-fg">Retry</button>}
      </div>
    </div>
  );
}

class FaceBoundary extends Component<{children:ReactNode;onError:()=>void},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(){this.props.onError();}
  render(){return this.state.failed ? null : this.props.children;}
}

function CanvasLifecycle({container,onContextLost}:{container:RefObject<HTMLDivElement|null>;onContextLost:()=>void}) {
  const setFrameloop=useThree(state=>state.setFrameloop);
  const frameloop=useThree(state=>state.frameloop);
  const gl=useThree(state=>state.gl);
  useEffect(()=>{container.current?.setAttribute("data-canvas-loop",frameloop);},[container,frameloop]);
  useEffect(()=>{
    const canvas=gl.domElement;
    canvas.addEventListener("webglcontextlost",onContextLost);
    return ()=>canvas.removeEventListener("webglcontextlost",onContextLost);
  },[gl,onContextLost]);
  useEffect(()=>{
    let frame=0;
    const update=()=>{
      const rect=container.current?.getBoundingClientRect();
      const visible=rect && rect.bottom>0 && rect.top<window.innerHeight && rect.right>0 && rect.left<window.innerWidth;
      // Demand mode retains a frame after a resize even while motion is paused.
      // A stale intersection callback must never leave an onscreen canvas blank.
      setFrameloop(visible && !document.hidden ? "always" : "demand");
    };
    const afterLayout=()=>{
      update();
      cancelAnimationFrame(frame);
      frame=requestAnimationFrame(update);
    };
    const observer=new IntersectionObserver(afterLayout);
    const resize=new ResizeObserver(afterLayout);
    if(container.current) {observer.observe(container.current);resize.observe(container.current);}
    document.addEventListener("visibilitychange",afterLayout);
    window.addEventListener("resize",afterLayout,{passive:true});
    afterLayout();
    return ()=>{
      observer.disconnect();resize.disconnect();cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange",afterLayout);
      window.removeEventListener("resize",afterLayout);
    };
  },[container,setFrameloop]);
  return null;
}

function FitCamera() {
  const size = useThree(state => state.size);
  return <OrthographicCamera makeDefault position={[0,0,5]} near={0.1} far={20} zoom={Math.min(size.width,size.height)/3.4} />;
}

function PortraitModel({input,surface,tier,reduced,onReady,onPose}:{input:RefObject<Interaction>;surface:RefObject<HTMLDivElement|null>;tier:MaterialTier;reduced:boolean;onReady:()=>void;onPose:(yaw:number,pitch:number)=>void}) {
  const original=useLoader(THREE.TextureLoader,PORTRAIT);
  const texture=useMemo(()=>{const copy=original.clone();copy.colorSpace=THREE.SRGBColorSpace;copy.anisotropy=4;copy.needsUpdate=true;return copy;},[original]);
  const geometry=useMemo(()=>createPortraitGeometry(tier),[tier]);
  const eyes=useMemo(()=>createPortraitEyeMaterial(texture),[texture]);
  const head=useRef<THREE.Group>(null);
  const animation=useRef({elapsed:0,publishedAt:0,yawVelocity:0,pitchVelocity:0,gazeX:0,gazeY:0,blinkAt:-1,nextBlink:2.8,blinkCycle:0,blinkRequest:0});
  useEffect(()=>{
    if (surface.current) surface.current.setAttribute("data-face-triangles",String((geometry.index?.count ?? 0)/3));
    onReady();
  },[geometry,onReady,surface]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  useEffect(()=>()=>eyes.dispose(),[eyes]);
  useFrame((_,rawDelta)=>{
    if(!head.current) return;
    const delta=Math.min(rawDelta,0.05), state=input.current;
    const motion=animation.current;
    motion.elapsed+=delta;
    const pointer=!reduced && !state.manual && !state.dragging;
    const progress=state.nodAt<0 ? 1 : Math.min((performance.now()-state.nodAt)/750,1);
    const nod=reduced || progress>=1 ? 0 : Math.sin(progress*Math.PI)*0.18;
    const idle=pointer ? 1 : 0;
    const yaw=bound(pointer ? state.gazeX*0.52+Math.sin(motion.elapsed*0.64)*0.012 : state.yaw,YAW_LIMIT);
    const pitch=bound((pointer ? state.gazeY*0.28+0.025+Math.sin(motion.elapsed*0.83)*0.008 : state.pitch)+nod,PITCH_LIMIT);
    if(reduced) {
      head.current.rotation.y=yaw;
      head.current.rotation.x=pitch;
      motion.yawVelocity=motion.pitchVelocity=0;
    } else {
      const [nextYaw,yawVelocity]=stepPortraitSpring(head.current.rotation.y,motion.yawVelocity,yaw,delta);
      const [nextPitch,pitchVelocity]=stepPortraitSpring(head.current.rotation.x,motion.pitchVelocity,pitch,delta);
      head.current.rotation.y=bound(nextYaw,YAW_LIMIT);
      head.current.rotation.x=bound(nextPitch,PITCH_LIMIT);
      motion.yawVelocity=yawVelocity;
      motion.pitchVelocity=pitchVelocity;
    }
    head.current.rotation.z=reduced ? 0 : THREE.MathUtils.damp(head.current.rotation.z,(-state.gazeX*0.025+Math.sin(motion.elapsed*0.71)*0.009)*idle,8,delta);
    head.current.position.x=reduced ? 0 : THREE.MathUtils.damp(head.current.position.x,state.gazeX*0.014*idle,6,delta);
    head.current.position.y=reduced || state.dragging ? 0 : Math.sin(motion.elapsed*1.05)*0.012;
    onPose(head.current.rotation.y,head.current.rotation.x);

    // The eyes lead the head, then hold a quiet gaze as the spring settles.
    motion.gazeX=reduced ? 0 : THREE.MathUtils.damp(motion.gazeX,pointer ? state.gazeX : 0,18,delta);
    motion.gazeY=reduced ? 0 : THREE.MathUtils.damp(motion.gazeY,pointer ? state.gazeY : 0,18,delta);
    if(!reduced && (motion.elapsed>=motion.nextBlink || state.blinkRequest!==motion.blinkRequest)) {
      motion.blinkAt=motion.elapsed;
      motion.blinkRequest=state.blinkRequest;
      motion.blinkCycle++;
      motion.nextBlink=motion.elapsed+4.5+Math.sin(motion.blinkCycle*2.4)*1.2;
    }
    const blink=reduced ? 0 : portraitBlink(motion.elapsed-motion.blinkAt);
    eyes.update(motion.gazeX,motion.gazeY,blink);
    if(surface.current && motion.elapsed-motion.publishedAt>0.08) {
      surface.current.setAttribute("data-face-yaw",(head.current.rotation.y*180/Math.PI).toFixed(1));
      surface.current.setAttribute("data-face-pitch",(head.current.rotation.x*180/Math.PI).toFixed(1));
      surface.current.setAttribute("data-face-gaze-x",motion.gazeX.toFixed(2));
      surface.current.setAttribute("data-face-gaze-y",motion.gazeY.toFixed(2));
      surface.current.setAttribute("data-face-blink",blink.toFixed(2));
      motion.publishedAt=motion.elapsed;
    }
  });
  return <group ref={head}>
    <mesh geometry={geometry}>
      <primitive object={eyes.material} attach="material-0" />
      <meshBasicMaterial attach="material-1" vertexColors toneMapped={false} />
    </mesh>
  </group>;
}
